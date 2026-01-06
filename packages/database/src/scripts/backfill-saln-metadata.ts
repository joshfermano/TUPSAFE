import { db } from '../db';
import { salnSubmissions, profiles, positions } from '../schema';
import { eq, isNull, or, and, sql } from 'drizzle-orm';

const DEFAULT_AGENCY = 'Technological University of the Philippines - Manila';

interface BackfillResult {
  total: number;
  updated: number;
  skipped: number;
  errors: string[];
}

async function backfillSalnMetadata(): Promise<BackfillResult> {
  const result: BackfillResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  console.log('Starting SALN metadata backfill...\n');

  try {
    // Find all SALN submissions with missing metadata
    // A record needs backfill if position OR agency is null/empty
    const submissionsToBackfill = await db
      .select({
        salnId: salnSubmissions.id,
        userId: salnSubmissions.userId,
        year: salnSubmissions.year,
        currentPosition: salnSubmissions.position,
        currentAgency: salnSubmissions.agency,
      })
      .from(salnSubmissions)
      .where(
        or(
          isNull(salnSubmissions.position),
          eq(salnSubmissions.position, ''),
          isNull(salnSubmissions.agency),
          eq(salnSubmissions.agency, '')
        )
      );

    result.total = submissionsToBackfill.length;
    console.log(
      `Found ${result.total} SALN submissions with missing metadata\n`
    );

    if (result.total === 0) {
      console.log('No submissions need backfill. Done!');
      return result;
    }

    // Process each submission
    for (const submission of submissionsToBackfill) {
      try {
        // Fetch user's profile with position
        const [profileData] = await db
          .select({
            profilePositionTitle: profiles.positionTitle,
            positionTableTitle: positions.title,
          })
          .from(profiles)
          .leftJoin(positions, eq(profiles.positionId, positions.id))
          .where(eq(profiles.id, submission.userId))
          .limit(1);

        if (!profileData) {
          result.errors.push(
            `SALN ${submission.salnId} (year ${submission.year}): No profile found for user ${submission.userId}`
          );
          result.skipped++;
          continue;
        }

        // Determine position value:
        // 1. Use positions table title if available (via positionId)
        // 2. Fall back to custom positionTitle in profiles
        // 3. Leave null if neither available
        const positionValue =
          profileData.positionTableTitle ||
          profileData.profilePositionTitle ||
          null;

        // Build update object - only update fields that are missing
        const updateData: {
          position?: string | null;
          agency?: string;
          updatedAt: Date;
        } = {
          updatedAt: new Date(),
        };

        // Only update position if it's currently empty
        if (!submission.currentPosition && positionValue) {
          updateData.position = positionValue;
        }

        // Only update agency if it's currently empty
        if (!submission.currentAgency) {
          updateData.agency = DEFAULT_AGENCY;
        }

        // Skip if no changes needed
        if (!updateData.position && !updateData.agency) {
          console.log(
            `  Skipping SALN ${submission.salnId} (year ${submission.year}): No data available for backfill`
          );
          result.skipped++;
          continue;
        }

        // Update the submission
        await db
          .update(salnSubmissions)
          .set(updateData)
          .where(eq(salnSubmissions.id, submission.salnId));

        console.log(
          `  Updated SALN ${submission.salnId} (year ${submission.year}): ` +
            `position="${updateData.position || '(unchanged)'}", ` +
            `agency="${updateData.agency || '(unchanged)'}"`
        );
        result.updated++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(
          `SALN ${submission.salnId} (year ${submission.year}): ${errorMsg}`
        );
        result.skipped++;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Fatal error: ${errorMsg}`);
  }

  return result;
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('SALN Metadata Backfill Script');
  console.log('='.repeat(60));
  console.log();

  const result = await backfillSalnMetadata();

  console.log();
  console.log('='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  console.log(`  Total submissions needing backfill: ${result.total}`);
  console.log(`  Successfully updated: ${result.updated}`);
  console.log(`  Skipped: ${result.skipped}`);

  if (result.errors.length > 0) {
    console.log(`\n  Errors (${result.errors.length}):`);
    result.errors.forEach((err, i) => {
      console.log(`    ${i + 1}. ${err}`);
    });
  }

  console.log();
  console.log('Backfill complete!');

  // Exit with error code if there were issues
  if (result.errors.length > 0 && result.updated === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
