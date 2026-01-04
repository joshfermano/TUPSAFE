/**
 * PDS (Personal Data Sheet) Queries
 *
 * Production-ready Drizzle ORM queries for PDS submission operations with comprehensive
 * support for all 10 related tables, proper transaction handling, and version control.
 *
 * All write operations use database transactions to ensure data consistency across
 * multiple related tables. Ownership validation is enforced on all operations.
 *
 * @module queries/pds
 */

import { db } from '../db';
import {
  pdsSubmissions,
  pdsPersonalInfo,
  pdsFamilyBackground,
  pdsChildren,
  pdsEducation,
  pdsCivilService,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsTraining,
  pdsOtherInfo,
  archives,
} from '../schema';
import { eq, and, desc, gte, notInArray, inArray } from 'drizzle-orm';
import type {
  PdsSubmission,
  PdsPersonalInfo,
  PdsFamilyBackground,
  PdsChild,
  PdsEducation,
  PdsCivilService,
  PdsWorkExperience,
  PdsVoluntaryWork,
  PdsTraining,
  PdsOtherInfo,
} from '../types';

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Filter options for PDS submission lists
 */
export interface PDSFilterOptions extends PaginationOptions {
  status?: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  year?: number; // Filter by calendar year (e.g., 2025 for "Annual PDS - CY 2025")
}

/**
 * PDS Attachment data structure for UI display
 * (simplified version of PdsAttachment from database schema)
 */
export interface PdsAttachmentData {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  fileUrl: string | null;
  trainingId?: string | null;
  civilServiceId?: string | null;
  createdAt: Date | string;
}

/**
 * Grouped attachments by entry type
 */
export interface PdsAttachmentsMap {
  byTraining: Record<string, PdsAttachmentData[]>;
  byCivilService: Record<string, PdsAttachmentData[]>;
}

/**
 * Complete PDS submission with all related sections
 */
export interface CompletePDSSubmission {
  submission: PdsSubmission;
  personalInfo: PdsPersonalInfo | null;
  familyBackground: PdsFamilyBackground | null;
  children: PdsChild[];
  education: PdsEducation[];
  civilService: PdsCivilService[];
  workExperience: PdsWorkExperience[];
  voluntaryWork: PdsVoluntaryWork[];
  training: PdsTraining[];
  otherInfo: PdsOtherInfo | null;
  attachments?: PdsAttachmentsMap;
}

/**
 * Data structure for creating a new PDS submission
 */
export interface CreatePDSData {
  year?: number; // Calendar year for this PDS (defaults to current year)
  version?: number; // Version within the year (auto-calculated if not provided)
  personalInfo?: Omit<PdsPersonalInfo, 'id' | 'pdsSubmissionId'>;
  familyBackground?: Omit<PdsFamilyBackground, 'id' | 'pdsSubmissionId'>;
  children?: Omit<PdsChild, 'id' | 'pdsSubmissionId'>[];
  education?: Omit<PdsEducation, 'id' | 'pdsSubmissionId'>[];
  civilService?: Omit<PdsCivilService, 'id' | 'pdsSubmissionId'>[];
  workExperience?: Omit<PdsWorkExperience, 'id' | 'pdsSubmissionId'>[];
  voluntaryWork?: Omit<PdsVoluntaryWork, 'id' | 'pdsSubmissionId'>[];
  training?: Omit<PdsTraining, 'id' | 'pdsSubmissionId'>[];
  otherInfo?: Omit<PdsOtherInfo, 'id' | 'pdsSubmissionId'>;
}

/**
 * Data structure for updating an existing PDS submission
 * Civil service and training entries can include optional `id` for stable references (attachments linking)
 */
export interface UpdatePDSData {
  year?: number;
  version?: number;
  personalInfo?: Omit<PdsPersonalInfo, 'id' | 'pdsSubmissionId'>;
  familyBackground?: Omit<PdsFamilyBackground, 'id' | 'pdsSubmissionId'>;
  children?: Omit<PdsChild, 'id' | 'pdsSubmissionId'>[];
  education?: Omit<PdsEducation, 'id' | 'pdsSubmissionId'>[];
  // Civil service entries can include `id` to preserve attachment links during updates
  civilService?: (Omit<PdsCivilService, 'pdsSubmissionId'> & { id?: string })[];
  workExperience?: Omit<PdsWorkExperience, 'id' | 'pdsSubmissionId'>[];
  voluntaryWork?: Omit<PdsVoluntaryWork, 'id' | 'pdsSubmissionId'>[];
  // Training entries can include `id` to preserve attachment links during updates
  training?: (Omit<PdsTraining, 'pdsSubmissionId'> & { id?: string })[];
  otherInfo?: Omit<PdsOtherInfo, 'id' | 'pdsSubmissionId'>;
}

/**
 * Statistics for PDS submissions
 */
export interface PDSStatistics {
  total: number;
  draft: number;
  submitted: number;
  reviewing: number;
  approved: number;
  rejected: number;
}

/**
 * Get all PDS submissions for a specific user
 *
 * Retrieves a paginated list of PDS submissions with optional status filtering.
 * Uses composite index: pds_submissions_user_status_idx
 *
 * @param userId - User UUID
 * @param filters - Optional pagination and status filters
 * @returns Promise<PdsSubmission[]> Array of PDS submissions
 * @throws Error if userId is invalid or database query fails
 *
 * @example
 * const submissions = await getPDSSubmissions(userId, { status: 'approved', limit: 10 });
 * console.log(`User has ${submissions.length} approved submissions`);
 */
export async function getPDSSubmissions(
  userId: string,
  filters?: PDSFilterOptions
): Promise<PdsSubmission[]> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const conditions = [eq(pdsSubmissions.userId, userId)];

    if (filters?.status) {
      conditions.push(eq(pdsSubmissions.status, filters.status));
    }

    // Filter by year (e.g., 2025 for "Annual PDS - CY 2025")
    if (filters?.year) {
      conditions.push(eq(pdsSubmissions.year, filters.year));
    }

    const baseQuery = db
      .select()
      .from(pdsSubmissions)
      .where(and(...conditions))
      .orderBy(desc(pdsSubmissions.year), desc(pdsSubmissions.version));

    // Build final query with limit/offset if provided
    const query = filters?.offset
      ? filters?.limit
        ? baseQuery.limit(filters.limit).offset(filters.offset)
        : baseQuery.offset(filters.offset)
      : filters?.limit
      ? baseQuery.limit(filters.limit)
      : baseQuery;

    const submissions = await query;
    return submissions;
  } catch (error) {
    console.error('[getPDSSubmissions] Database error:', error);
    throw new Error(
      `Failed to fetch PDS submissions for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get a complete PDS submission by ID with all related sections
 *
 * Retrieves a single PDS submission along with all 9 related section tables using
 * Drizzle's relational queries for efficient eager loading. Validates user ownership.
 *
 * Uses primary key index on pdsSubmissions and foreign key indexes on all child tables.
 *
 * @param id - PDS submission UUID
 * @param userId - User UUID for ownership validation
 * @returns Promise<CompletePDSSubmission | null> Complete PDS or null if not found
 * @throws Error if IDs are invalid, ownership validation fails, or database query fails
 *
 * @example
 * const pds = await getPDSSubmissionById(submissionId, userId);
 * if (pds) {
 *   console.log(`PDS has ${pds.education.length} education entries`);
 * }
 */
export async function getPDSSubmissionById(
  id: string,
  userId: string
): Promise<CompletePDSSubmission | null> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    // Fetch main submission with ownership validation
    const [submission] = await db
      .select()
      .from(pdsSubmissions)
      .where(and(eq(pdsSubmissions.id, id), eq(pdsSubmissions.userId, userId)))
      .limit(1);

    if (!submission) {
      return null;
    }

    // Fetch all related sections in parallel for optimal performance
    const [
      personalInfo,
      familyBackground,
      children,
      education,
      civilService,
      workExperience,
      voluntaryWork,
      training,
      otherInfo,
    ] = await Promise.all([
      // One-to-one relations
      db
        .select()
        .from(pdsPersonalInfo)
        .where(eq(pdsPersonalInfo.pdsSubmissionId, id))
        .limit(1)
        .then((rows) => rows[0] || null),

      db
        .select()
        .from(pdsFamilyBackground)
        .where(eq(pdsFamilyBackground.pdsSubmissionId, id))
        .limit(1)
        .then((rows) => rows[0] || null),

      // One-to-many relations
      db
        .select()
        .from(pdsChildren)
        .where(eq(pdsChildren.pdsSubmissionId, id))
        .orderBy(pdsChildren.dateOfBirth),

      db
        .select()
        .from(pdsEducation)
        .where(eq(pdsEducation.pdsSubmissionId, id))
        .orderBy(pdsEducation.level),

      db
        .select()
        .from(pdsCivilService)
        .where(eq(pdsCivilService.pdsSubmissionId, id))
        .orderBy(desc(pdsCivilService.dateOfExam)),

      db
        .select()
        .from(pdsWorkExperience)
        .where(eq(pdsWorkExperience.pdsSubmissionId, id))
        .orderBy(desc(pdsWorkExperience.dateFrom)),

      db
        .select()
        .from(pdsVoluntaryWork)
        .where(eq(pdsVoluntaryWork.pdsSubmissionId, id))
        .orderBy(desc(pdsVoluntaryWork.dateFrom)),

      db
        .select()
        .from(pdsTraining)
        .where(eq(pdsTraining.pdsSubmissionId, id))
        .orderBy(desc(pdsTraining.dateFrom)),

      db
        .select()
        .from(pdsOtherInfo)
        .where(eq(pdsOtherInfo.pdsSubmissionId, id))
        .limit(1)
        .then((rows) => rows[0] || null),
    ]);

    return {
      submission,
      personalInfo,
      familyBackground,
      children,
      education,
      civilService,
      workExperience,
      voluntaryWork,
      training,
      otherInfo,
    };
  } catch (error) {
    console.error('[getPDSSubmissionById] Database error:', error);
    throw new Error(
      `Failed to fetch PDS submission ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get the active draft for a user (within 24 hours and current year)
 * Returns the most recently updated draft created in the last 24 hours for the current year
 *
 * @param userId - The user ID to find draft for
 * @param year - Optional year to check (defaults to current year)
 * @returns Draft ID if found, null otherwise
 */
export async function getActiveDraft(
  userId: string,
  year?: number
): Promise<string | null> {
  try {
    // Only consider drafts from the last 24 hours for the specified year
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const targetYear = year || new Date().getFullYear();

    const [draft] = await db
      .select({ id: pdsSubmissions.id })
      .from(pdsSubmissions)
      .where(
        and(
          eq(pdsSubmissions.userId, userId),
          eq(pdsSubmissions.status, 'draft'),
          eq(pdsSubmissions.year, targetYear),
          gte(pdsSubmissions.createdAt, twentyFourHoursAgo)
        )
      )
      .orderBy(desc(pdsSubmissions.updatedAt))
      .limit(1);

    return draft?.id ?? null;
  } catch (error) {
    console.error('[getActiveDraft] Error:', error);
    return null;
  }
}

/**
 * Get the latest PDS submission for a user
 *
 * Retrieves the most recent PDS submission marked as 'latest' (isLatest=true).
 * Uses composite index: pds_submissions_user_latest_idx
 *
 * @param userId - User UUID
 * @returns Promise<CompletePDSSubmission | null> Latest PDS or null if none exists
 * @throws Error if userId is invalid or database query fails
 *
 * @example
 * const latestPDS = await getLatestPDSSubmission(userId);
 * if (latestPDS) {
 *   console.log(`Latest PDS version: ${latestPDS.submission.version}`);
 * }
 */
export async function getLatestPDSSubmission(
  userId: string
): Promise<CompletePDSSubmission | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const [submission] = await db
      .select()
      .from(pdsSubmissions)
      .where(
        and(
          eq(pdsSubmissions.userId, userId),
          eq(pdsSubmissions.isLatest, true)
        )
      )
      .limit(1);

    if (!submission) {
      return null;
    }

    // Reuse getPDSSubmissionById for consistency
    return getPDSSubmissionById(submission.id, userId);
  } catch (error) {
    console.error('[getLatestPDSSubmission] Database error:', error);
    throw new Error(
      `Failed to fetch latest PDS for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Create a new PDS submission with all related sections
 *
 * Creates a complete PDS submission within a database transaction to ensure atomicity.
 * Automatically sets all existing submissions to isLatest=false before creating the new one.
 * Calculates version number based on existing submissions.
 *
 * TRANSACTION OPERATIONS:
 * 1. Set all existing user submissions to isLatest=false
 * 2. Create main PDS submission record
 * 3. Insert all provided sections (personal info, family, education, etc.)
 *
 * @param userId - User UUID
 * @param data - Complete PDS data including all sections
 * @returns Promise<string> The ID of the newly created PDS submission
 * @throws Error if userId is invalid, data validation fails, or transaction fails
 *
 * @example
 * const newPDSId = await createPDSSubmission(userId, {
 *   personalInfo: { surname: 'Doe', firstName: 'John', ... },
 *   education: [{ level: 'college', schoolName: 'TUP Manila', ... }],
 *   // ... other sections
 * });
 */
export async function createPDSSubmission(
  userId: string,
  data: CreatePDSData
): Promise<string> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    return await db.transaction(async (tx) => {
      // Calculate year (use provided or current year)
      const submissionYear = data.year || new Date().getFullYear();

      // Calculate next version number WITHIN THE SAME YEAR
      // This allows multiple submissions per year (v1, v2, etc.) but only if previous is approved/rejected
      const existingSubmissions = await tx
        .select({
          version: pdsSubmissions.version,
          status: pdsSubmissions.status,
        })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.userId, userId),
            eq(pdsSubmissions.year, submissionYear)
          )
        )
        .orderBy(desc(pdsSubmissions.version))
        .limit(1);

      // Check if user has a pending submission for this year
      if (existingSubmissions.length > 0) {
        const latest = existingSubmissions[0];
        if (
          latest.status === 'draft' ||
          latest.status === 'submitted' ||
          latest.status === 'reviewing'
        ) {
          throw new Error(
            `You already have a pending PDS submission for CY ${submissionYear}. Please complete or withdraw it before creating a new one.`
          );
        }
      }

      const nextVersion =
        data.version ||
        (existingSubmissions.length > 0
          ? (existingSubmissions[0].version || 0) + 1
          : 1);

      // Set all existing submissions FOR THIS YEAR to isLatest=false
      await tx
        .update(pdsSubmissions)
        .set({ isLatest: false, updatedAt: new Date() })
        .where(
          and(
            eq(pdsSubmissions.userId, userId),
            eq(pdsSubmissions.year, submissionYear)
          )
        );

      // Create main submission with year
      const [submission] = await tx
        .insert(pdsSubmissions)
        .values({
          userId,
          year: submissionYear,
          version: nextVersion,
          status: 'draft',
          isLatest: true,
        })
        .returning();

      const submissionId = submission.id;

      // Insert personal info if provided
      if (data.personalInfo) {
        await tx.insert(pdsPersonalInfo).values({
          ...data.personalInfo,
          pdsSubmissionId: submissionId,
        } as typeof pdsPersonalInfo.$inferInsert);
      }

      // Insert family background if provided
      if (data.familyBackground) {
        await tx.insert(pdsFamilyBackground).values({
          ...data.familyBackground,
          pdsSubmissionId: submissionId,
        } as typeof pdsFamilyBackground.$inferInsert);
      }

      // Insert children if provided
      if (data.children && data.children.length > 0) {
        await tx.insert(pdsChildren).values(
          data.children.map((child) => ({
            ...child,
            pdsSubmissionId: submissionId,
          })) as (typeof pdsChildren.$inferInsert)[]
        );
      }

      // Insert education if provided
      if (data.education && data.education.length > 0) {
        await tx.insert(pdsEducation).values(
          data.education.map((edu) => ({
            ...edu,
            pdsSubmissionId: submissionId,
          })) as (typeof pdsEducation.$inferInsert)[]
        );
      }

      // Insert civil service eligibility if provided
      if (data.civilService && data.civilService.length > 0) {
        await tx.insert(pdsCivilService).values(
          data.civilService.map((cs) => ({
            ...cs,
            pdsSubmissionId: submissionId,
          })) as (typeof pdsCivilService.$inferInsert)[]
        );
      }

      // Insert work experience if provided
      if (data.workExperience && data.workExperience.length > 0) {
        await tx.insert(pdsWorkExperience).values(
          data.workExperience.map((we) => ({
            ...we,
            pdsSubmissionId: submissionId,
          })) as (typeof pdsWorkExperience.$inferInsert)[]
        );
      }

      // Insert voluntary work if provided
      if (data.voluntaryWork && data.voluntaryWork.length > 0) {
        await tx.insert(pdsVoluntaryWork).values(
          data.voluntaryWork.map((vw) => ({
            ...vw,
            pdsSubmissionId: submissionId,
          })) as (typeof pdsVoluntaryWork.$inferInsert)[]
        );
      }

      // Insert training if provided
      if (data.training && data.training.length > 0) {
        await tx.insert(pdsTraining).values(
          data.training.map((tr) => ({
            ...tr,
            pdsSubmissionId: submissionId,
          })) as (typeof pdsTraining.$inferInsert)[]
        );
      }

      // Insert other info if provided
      if (data.otherInfo) {
        await tx.insert(pdsOtherInfo).values({
          ...data.otherInfo,
          pdsSubmissionId: submissionId,
        } as typeof pdsOtherInfo.$inferInsert);
      }

      return submissionId;
    });
  } catch (error) {
    console.error('[createPDSSubmission] Transaction error:', error);
    throw new Error(
      `Failed to create PDS submission for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Update an existing PDS submission
 *
 * Updates a PDS submission and its related sections within a transaction.
 * Only updates sections that are provided in the data parameter.
 * Validates user ownership before performing updates.
 * Increments version number if status is not 'draft'.
 *
 * TRANSACTION OPERATIONS:
 * 1. Validate ownership
 * 2. Update main submission metadata
 * 3. Delete and recreate one-to-many sections if provided
 * 4. Update or insert one-to-one sections if provided
 *
 * @param id - PDS submission UUID
 * @param userId - User UUID for ownership validation
 * @param data - Partial PDS data to update
 * @returns Promise<void>
 * @throws Error if ownership validation fails or transaction fails
 *
 * @example
 * await updatePDSSubmission(submissionId, userId, {
 *   personalInfo: { mobileNo: '+639171234567' },
 *   education: [updatedEducationList],
 * });
 */
export async function updatePDSSubmission(
  id: string,
  userId: string,
  data: UpdatePDSData
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    // DEBUG: Log what data is received in updatePDSSubmission
    console.log('[updatePDSSubmission] START:', {
      pdsId: id,
      userId,
      hasTraining: !!data.training,
      trainingCount: data.training?.length || 0,
      trainingIds: data.training?.map(t => ({
        id: t.id,
        title: t.title,
        dateFrom: t.dateFrom,
        dateTo: t.dateTo,
      })) || [],
      hasCivilService: !!data.civilService,
      civilServiceCount: data.civilService?.length || 0,
    });

    await db.transaction(async (tx) => {
      // Validate ownership
      const [submission] = await tx
        .select()
        .from(pdsSubmissions)
        .where(
          and(eq(pdsSubmissions.id, id), eq(pdsSubmissions.userId, userId))
        )
        .limit(1);

      if (!submission) {
        throw new Error('PDS submission not found or access denied');
      }

      // Determine if we should increment version
      const shouldIncrementVersion = submission.status !== 'draft';
      const nextVersion = shouldIncrementVersion
        ? submission.version + 1
        : submission.version;

      // Update main submission
      await tx
        .update(pdsSubmissions)
        .set({
          version: nextVersion,
          updatedAt: new Date(),
        })
        .where(eq(pdsSubmissions.id, id));

      // Update personal info if provided
      if (data.personalInfo) {
        // Check if exists
        const [existing] = await tx
          .select()
          .from(pdsPersonalInfo)
          .where(eq(pdsPersonalInfo.pdsSubmissionId, id))
          .limit(1);

        if (existing) {
          await tx
            .update(pdsPersonalInfo)
            .set(data.personalInfo)
            .where(eq(pdsPersonalInfo.pdsSubmissionId, id));
        } else {
          await tx.insert(pdsPersonalInfo).values({
            ...data.personalInfo,
            pdsSubmissionId: id,
          } as typeof pdsPersonalInfo.$inferInsert);
        }
      }

      // Update family background if provided
      if (data.familyBackground) {
        const [existing] = await tx
          .select()
          .from(pdsFamilyBackground)
          .where(eq(pdsFamilyBackground.pdsSubmissionId, id))
          .limit(1);

        if (existing) {
          await tx
            .update(pdsFamilyBackground)
            .set(data.familyBackground)
            .where(eq(pdsFamilyBackground.pdsSubmissionId, id));
        } else {
          await tx.insert(pdsFamilyBackground).values({
            ...data.familyBackground,
            pdsSubmissionId: id,
          } as typeof pdsFamilyBackground.$inferInsert);
        }
      }

      // Update children if provided (delete and recreate)
      // undefined = no change, [] = clear all, [...] = replace with new entries
      if (data.children !== undefined) {
        await tx.delete(pdsChildren).where(eq(pdsChildren.pdsSubmissionId, id));
        if (data.children.length > 0) {
          await tx.insert(pdsChildren).values(
            data.children.map((child) => ({
              ...child,
              pdsSubmissionId: id,
            })) as (typeof pdsChildren.$inferInsert)[]
          );
        }
      }

      // Update education if provided (delete and recreate)
      // undefined = no change, [] = clear all, [...] = replace with new entries
      if (data.education !== undefined) {
        await tx
          .delete(pdsEducation)
          .where(eq(pdsEducation.pdsSubmissionId, id));
        if (data.education.length > 0) {
          await tx.insert(pdsEducation).values(
            data.education.map((edu) => ({
              ...edu,
              pdsSubmissionId: id,
            })) as (typeof pdsEducation.$inferInsert)[]
          );
        }
      }

      // Update civil service if provided (upsert-by-id to preserve attachment links)
      if (data.civilService !== undefined) {
        // Get all entry IDs from the payload
        const entriesWithIds = data.civilService.filter((cs) => cs.id);
        const entryIds = entriesWithIds.map((cs) => cs.id as string);

        // Query which IDs actually exist in the database
        let actuallyExistingIds: string[] = [];
        if (entryIds.length > 0) {
          const dbEntries = await tx
            .select({ id: pdsCivilService.id })
            .from(pdsCivilService)
            .where(
              and(
                eq(pdsCivilService.pdsSubmissionId, id),
                inArray(pdsCivilService.id, entryIds)
              )
            );
          actuallyExistingIds = dbEntries.map((e) => e.id);
        }

        // Classify based on what actually exists in DB (not just presence of ID)
        const existingEntries = data.civilService.filter(
          (cs) => cs.id && actuallyExistingIds.includes(cs.id as string)
        );
        const newEntries = data.civilService.filter(
          (cs) => !cs.id || !actuallyExistingIds.includes(cs.id as string)
        );
        const allPayloadIds = data.civilService.filter((cs) => cs.id).map((cs) => cs.id as string);

        console.log('[updatePDSSubmission] Civil Service update operation:', {
          pdsId: id,
          totalCivilService: data.civilService.length,
          entriesWithIdsInPayload: entryIds.length,
          actuallyExistingInDb: actuallyExistingIds.length,
          existingEntriesCount: existingEntries.length,
          newEntriesCount: newEntries.length,
        });

        // Delete entries that are no longer in the payload
        if (allPayloadIds.length > 0) {
          await tx
            .delete(pdsCivilService)
            .where(
              and(
                eq(pdsCivilService.pdsSubmissionId, id),
                notInArray(pdsCivilService.id, allPayloadIds)
              )
            );
        } else {
          // If no entries have IDs, delete all existing entries
          await tx
            .delete(pdsCivilService)
            .where(eq(pdsCivilService.pdsSubmissionId, id));
        }

        // Update entries that actually exist in the database
        for (const cs of existingEntries) {
          const { id: csId, ...updateData } = cs;
          await tx
            .update(pdsCivilService)
            .set(updateData)
            .where(eq(pdsCivilService.id, csId as string));
        }

        // Insert new entries (including those with client-generated IDs that don't exist in DB)
        if (newEntries.length > 0) {
          const insertResult = await tx.insert(pdsCivilService).values(
            newEntries.map((cs) => ({
              ...cs,
              pdsSubmissionId: id,
            })) as (typeof pdsCivilService.$inferInsert)[]
          ).returning();
          console.log(`[updatePDSSubmission] Inserted ${newEntries.length} new civil service entries:`, {
            insertedCount: insertResult.length,
            insertedIds: insertResult.map(e => e.id),
          });
        }
      }

      // Update work experience if provided (delete and recreate)
      // undefined = no change, [] = clear all, [...] = replace with new entries
      if (data.workExperience !== undefined) {
        await tx
          .delete(pdsWorkExperience)
          .where(eq(pdsWorkExperience.pdsSubmissionId, id));
        if (data.workExperience.length > 0) {
          await tx.insert(pdsWorkExperience).values(
            data.workExperience.map((we) => ({
              ...we,
              pdsSubmissionId: id,
            })) as (typeof pdsWorkExperience.$inferInsert)[]
          );
        }
      }

      // Update voluntary work if provided (delete and recreate)
      // undefined = no change, [] = clear all, [...] = replace with new entries
      if (data.voluntaryWork !== undefined) {
        await tx
          .delete(pdsVoluntaryWork)
          .where(eq(pdsVoluntaryWork.pdsSubmissionId, id));
        if (data.voluntaryWork.length > 0) {
          await tx.insert(pdsVoluntaryWork).values(
            data.voluntaryWork.map((vw) => ({
              ...vw,
              pdsSubmissionId: id,
            })) as (typeof pdsVoluntaryWork.$inferInsert)[]
          );
        }
      }

      // Update training if provided (upsert-by-id to preserve attachment links)
      if (data.training !== undefined) {
        // Get all entry IDs from the payload
        const entriesWithIds = data.training.filter((tr) => tr.id);
        const entryIds = entriesWithIds.map((tr) => tr.id as string);

        // Query which IDs actually exist in the database
        let actuallyExistingIds: string[] = [];
        if (entryIds.length > 0) {
          const dbEntries = await tx
            .select({ id: pdsTraining.id })
            .from(pdsTraining)
            .where(
              and(
                eq(pdsTraining.pdsSubmissionId, id),
                inArray(pdsTraining.id, entryIds)
              )
            );
          actuallyExistingIds = dbEntries.map((e) => e.id);
        }

        // Classify based on what actually exists in DB (not just presence of ID)
        const existingEntries = data.training.filter(
          (tr) => tr.id && actuallyExistingIds.includes(tr.id as string)
        );
        const newEntries = data.training.filter(
          (tr) => !tr.id || !actuallyExistingIds.includes(tr.id as string)
        );
        const allPayloadIds = data.training.filter((tr) => tr.id).map((tr) => tr.id as string);

        console.log('[updatePDSSubmission] Training update operation:', {
          pdsId: id,
          totalTraining: data.training.length,
          entriesWithIdsInPayload: entryIds.length,
          actuallyExistingInDb: actuallyExistingIds.length,
          existingEntriesCount: existingEntries.length,
          newEntriesCount: newEntries.length,
          actuallyExistingIds,
          trainingDetails: data.training.map((tr) => ({
            id: tr.id,
            title: tr.title,
            dateFrom: tr.dateFrom,
            dateTo: tr.dateTo,
            existsInDb: tr.id ? actuallyExistingIds.includes(tr.id as string) : false,
          })),
        });

        // Delete entries that are no longer in the payload
        if (allPayloadIds.length > 0) {
          await tx
            .delete(pdsTraining)
            .where(
              and(
                eq(pdsTraining.pdsSubmissionId, id),
                notInArray(pdsTraining.id, allPayloadIds)
              )
            );
          console.log('[updatePDSSubmission] Deleted old training entries (not in payload)');
        } else {
          // If no entries have IDs, delete all existing entries
          await tx
            .delete(pdsTraining)
            .where(eq(pdsTraining.pdsSubmissionId, id));
          console.log('[updatePDSSubmission] Deleted ALL existing training entries (no IDs in payload)');
        }

        // Update entries that actually exist in the database
        for (const tr of existingEntries) {
          const { id: trId, ...updateData } = tr;
          await tx
            .update(pdsTraining)
            .set(updateData)
            .where(eq(pdsTraining.id, trId as string));
          console.log(`[updatePDSSubmission] Updated training entry ${trId}:`, updateData);
        }

        // Insert new entries (including those with client-generated IDs that don't exist in DB)
        if (newEntries.length > 0) {
          const insertResult = await tx.insert(pdsTraining).values(
            newEntries.map((tr) => ({
              ...tr,
              pdsSubmissionId: id,
            })) as (typeof pdsTraining.$inferInsert)[]
          ).returning();
          console.log(`[updatePDSSubmission] Inserted ${newEntries.length} new training entries:`, {
            insertedCount: insertResult.length,
            insertedIds: insertResult.map(t => t.id),
            insertedTitles: insertResult.map(t => t.title),
          });
        }

        // DEBUG: Verify training entries were saved
        const allTrainingForPds = await tx
          .select()
          .from(pdsTraining)
          .where(eq(pdsTraining.pdsSubmissionId, id));
        console.log('[updatePDSSubmission] Final training entries in database:', {
          pdsId: id,
          count: allTrainingForPds.length,
          entries: allTrainingForPds.map(t => ({
            id: t.id,
            title: t.title,
            dateFrom: t.dateFrom,
            dateTo: t.dateTo,
          })),
        });
      }

      // Update other info if provided
      if (data.otherInfo) {
        const [existing] = await tx
          .select()
          .from(pdsOtherInfo)
          .where(eq(pdsOtherInfo.pdsSubmissionId, id))
          .limit(1);

        if (existing) {
          await tx
            .update(pdsOtherInfo)
            .set(data.otherInfo)
            .where(eq(pdsOtherInfo.pdsSubmissionId, id));
        } else {
          await tx.insert(pdsOtherInfo).values({
            ...data.otherInfo,
            pdsSubmissionId: id,
          } as typeof pdsOtherInfo.$inferInsert);
        }
      }
    });

    // DEBUG: Final verification after transaction completes
    console.log('[updatePDSSubmission] END: Transaction completed successfully for PDS', id);
  } catch (error) {
    console.error('[updatePDSSubmission] Transaction error:', error);
    throw new Error(
      `Failed to update PDS submission ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Update the completion percentage for a PDS submission
 *
 * @param id - PDS submission UUID
 * @param completion - Completion percentage (0-100)
 * @returns Promise<void>
 */
export async function updatePDSCompletion(
  id: string,
  completion: number
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    // Ensure completion is within valid range
    const validCompletion = Math.max(0, Math.min(100, Math.round(completion)));

    await db
      .update(pdsSubmissions)
      .set({
        completion: validCompletion,
        updatedAt: new Date(),
      })
      .where(eq(pdsSubmissions.id, id));
  } catch (error) {
    console.error('[updatePDSCompletion] Database error:', error);
    throw new Error(
      `Failed to update PDS completion for ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Submit a PDS for approval
 *
 * Changes the status of a PDS submission from 'draft' to 'submitted'.
 * Sets the submittedAt timestamp. Validates user ownership.
 *
 * @param id - PDS submission UUID
 * @param userId - User UUID for ownership validation
 * @returns Promise<void>
 * @throws Error if PDS is not in draft status, ownership validation fails, or update fails
 *
 * @example
 * await submitPDSForApproval(submissionId, userId);
 * console.log('PDS submitted for review');
 */
export async function submitPDSForApproval(
  id: string,
  userId: string
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const [submission] = await db
      .select()
      .from(pdsSubmissions)
      .where(and(eq(pdsSubmissions.id, id), eq(pdsSubmissions.userId, userId)))
      .limit(1);

    if (!submission) {
      throw new Error('PDS submission not found or access denied');
    }

    // Allow both draft and rejected submissions to be submitted/resubmitted
    const allowedStatuses = ['draft', 'rejected'];
    if (!allowedStatuses.includes(submission.status)) {
      throw new Error(
        `Cannot submit PDS with status '${submission.status}'. Only draft or rejected submissions can be submitted.`
      );
    }

    await db
      .update(pdsSubmissions)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pdsSubmissions.id, id));
  } catch (error) {
    console.error('[submitPDSForApproval] Database error:', error);
    throw new Error(
      `Failed to submit PDS ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Approve a PDS submission
 *
 * Changes the status to 'approved' and records the approver and approval timestamp.
 * This function should only be called by users with HR or admin roles.
 * Role validation should be performed at the application layer.
 *
 * @param id - PDS submission UUID
 * @param approverId - UUID of the user approving the submission
 * @param reviewNotes - Optional review feedback or approval notes
 * @returns Promise<void>
 * @throws Error if PDS is not in submitted/reviewing status or update fails
 *
 * @example
 * await approvePDS(submissionId, hrUserId, 'All documents verified and complete.');
 * console.log('PDS approved successfully');
 */
export async function approvePDS(
  id: string,
  approverId: string,
  reviewNotes?: string
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!approverId || typeof approverId !== 'string') {
      throw new Error('Valid approver ID is required');
    }

    const [submission] = await db
      .select()
      .from(pdsSubmissions)
      .where(eq(pdsSubmissions.id, id))
      .limit(1);

    if (!submission) {
      throw new Error('PDS submission not found');
    }

    if (
      submission.status !== 'submitted' &&
      submission.status !== 'reviewing'
    ) {
      throw new Error(
        `Cannot approve PDS with status '${submission.status}'. Only submitted or reviewing submissions can be approved.`
      );
    }

    await db
      .update(pdsSubmissions)
      .set({
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
        rejectionReason: null, // Clear any previous rejection reason
        reviewNotes: reviewNotes ? reviewNotes.trim() : null, // Optional review feedback
      })
      .where(eq(pdsSubmissions.id, id));
  } catch (error) {
    console.error('[approvePDS] Database error:', error);
    throw new Error(
      `Failed to approve PDS ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Reject a PDS submission with a reason
 *
 * Changes the status to 'rejected' and records the rejection reason.
 * This function should only be called by users with HR or admin roles.
 * Role validation should be performed at the application layer.
 *
 * @param id - PDS submission UUID
 * @param approverId - UUID of the user rejecting the submission
 * @param reason - Detailed reason for rejection (required)
 * @param reviewNotes - Optional additional review feedback or context
 * @returns Promise<void>
 * @throws Error if reason is empty, PDS is not in submitted/reviewing status, or update fails
 *
 * @example
 * await rejectPDS(submissionId, hrUserId, 'Missing required civil service eligibility documents', 'Please upload CSC eligibility certificate');
 */
export async function rejectPDS(
  id: string,
  approverId: string,
  reason: string,
  reviewNotes?: string
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!approverId || typeof approverId !== 'string') {
      throw new Error('Valid approver ID is required');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    const [submission] = await db
      .select()
      .from(pdsSubmissions)
      .where(eq(pdsSubmissions.id, id))
      .limit(1);

    if (!submission) {
      throw new Error('PDS submission not found');
    }

    if (
      submission.status !== 'submitted' &&
      submission.status !== 'reviewing'
    ) {
      throw new Error(
        `Cannot reject PDS with status '${submission.status}'. Only submitted or reviewing submissions can be rejected.`
      );
    }

    await db
      .update(pdsSubmissions)
      .set({
        status: 'rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: reason.trim(),
        reviewNotes: reviewNotes ? reviewNotes.trim() : null, // Optional review feedback
        updatedAt: new Date(),
      })
      .where(eq(pdsSubmissions.id, id));
  } catch (error) {
    console.error('[rejectPDS] Database error:', error);
    throw new Error(
      `Failed to reject PDS ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Archive a PDS submission
 *
 * Moves a complete PDS submission and all its related sections to the archives table,
 * then deletes the original records. This operation is performed in a transaction
 * to ensure data consistency.
 *
 * TRANSACTION OPERATIONS:
 * 1. Fetch complete PDS with all sections
 * 2. Create archive record with complete data
 * 3. Delete all related section records
 * 4. Delete main submission record
 *
 * @param id - PDS submission UUID
 * @param userId - User UUID for ownership validation
 * @returns Promise<void>
 * @throws Error if ownership validation fails or transaction fails
 *
 * @example
 * await archivePDSSubmission(oldSubmissionId, userId);
 * console.log('PDS archived successfully');
 */
export async function archivePDSSubmission(
  id: string,
  userId: string
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    await db.transaction(async (tx) => {
      // Validate ownership
      const [submission] = await tx
        .select()
        .from(pdsSubmissions)
        .where(
          and(eq(pdsSubmissions.id, id), eq(pdsSubmissions.userId, userId))
        )
        .limit(1);

      if (!submission) {
        throw new Error('PDS submission not found or access denied');
      }

      // Fetch complete PDS data for archival
      const completePDS = await getPDSSubmissionById(id, userId);

      if (!completePDS) {
        throw new Error('Failed to fetch complete PDS data for archival');
      }

      // Create archive record
      await tx.insert(archives).values({
        originalTable: 'pds_submissions',
        originalId: id,
        data: completePDS,
        archivedBy: userId,
      });

      // Delete all child records (cascade will handle this in most cases, but being explicit)
      await tx.delete(pdsChildren).where(eq(pdsChildren.pdsSubmissionId, id));
      await tx.delete(pdsEducation).where(eq(pdsEducation.pdsSubmissionId, id));
      await tx
        .delete(pdsCivilService)
        .where(eq(pdsCivilService.pdsSubmissionId, id));
      await tx
        .delete(pdsWorkExperience)
        .where(eq(pdsWorkExperience.pdsSubmissionId, id));
      await tx
        .delete(pdsVoluntaryWork)
        .where(eq(pdsVoluntaryWork.pdsSubmissionId, id));
      await tx.delete(pdsTraining).where(eq(pdsTraining.pdsSubmissionId, id));
      await tx
        .delete(pdsPersonalInfo)
        .where(eq(pdsPersonalInfo.pdsSubmissionId, id));
      await tx
        .delete(pdsFamilyBackground)
        .where(eq(pdsFamilyBackground.pdsSubmissionId, id));
      await tx.delete(pdsOtherInfo).where(eq(pdsOtherInfo.pdsSubmissionId, id));

      // Delete main submission
      await tx.delete(pdsSubmissions).where(eq(pdsSubmissions.id, id));
    });
  } catch (error) {
    console.error('[archivePDSSubmission] Transaction error:', error);
    throw new Error(
      `Failed to archive PDS submission ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get archived PDS submissions for a user
 *
 * Retrieves all archived PDS submissions from the archives table.
 * Uses composite index: archives_original_table_idx
 *
 * @param userId - User UUID
 * @param options - Optional pagination parameters
 * @returns Promise<Array> Array of archived PDS data
 * @throws Error if userId is invalid or database query fails
 *
 * @example
 * const archivedPDS = await getArchivedPDS(userId, { limit: 20 });
 * console.log(`User has ${archivedPDS.length} archived submissions`);
 */
export async function getArchivedPDS(
  userId: string,
  options?: PaginationOptions
): Promise<
  Array<{
    id: string;
    archivedAt: Date;
    data: CompletePDSSubmission;
  }>
> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const baseQuery = db
      .select({
        id: archives.id,
        archivedAt: archives.archivedAt,
        data: archives.data,
      })
      .from(archives)
      .where(
        and(
          eq(archives.originalTable, 'pds_submissions'),
          eq(archives.archivedBy, userId)
        )
      )
      .orderBy(desc(archives.archivedAt));

    // Build final query with limit/offset if provided
    const query = options?.offset
      ? options?.limit
        ? baseQuery.limit(options.limit).offset(options.offset)
        : baseQuery.offset(options.offset)
      : options?.limit
      ? baseQuery.limit(options.limit)
      : baseQuery;

    const results = await query;

    return results.map((record) => ({
      id: record.id,
      archivedAt: record.archivedAt,
      data: record.data as unknown as CompletePDSSubmission,
    }));
  } catch (error) {
    console.error('[getArchivedPDS] Database error:', error);
    throw new Error(
      `Failed to fetch archived PDS for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Delete a PDS submission
 *
 * Permanently deletes a PDS submission and all its related sections from the database.
 * Only draft and rejected submissions can be deleted. Submitted, reviewing, and approved
 * submissions should be archived instead.
 *
 * TRANSACTION OPERATIONS:
 * 1. Validate ownership and status
 * 2. Delete all related section records
 * 3. Delete main submission record
 *
 * SECURITY:
 * - Validates user ownership before deletion
 * - Only allows deletion of draft or rejected submissions
 * - Uses transaction to ensure atomicity
 *
 * @param id - PDS submission UUID
 * @param userId - User UUID for ownership validation
 * @returns Promise<void>
 * @throws Error if PDS status doesn't allow deletion, ownership validation fails, or transaction fails
 *
 * @example
 * await deletePDSSubmission(submissionId, userId);
 * console.log('PDS deleted successfully');
 */
export async function deletePDSSubmission(
  id: string,
  userId: string
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid PDS submission ID is required');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    let deletedStatus = 'unknown';

    await db.transaction(async (tx) => {
      // Validate ownership and get submission status
      const [submission] = await tx
        .select()
        .from(pdsSubmissions)
        .where(
          and(eq(pdsSubmissions.id, id), eq(pdsSubmissions.userId, userId))
        )
        .limit(1);

      if (!submission) {
        throw new Error('PDS submission not found or access denied');
      }

      // Store status for logging
      deletedStatus = submission.status;

      // Only allow deletion of draft or rejected submissions
      const allowedDeleteStatuses = ['draft', 'rejected'];
      if (!allowedDeleteStatuses.includes(submission.status)) {
        throw new Error(
          `Cannot delete PDS with status '${submission.status}'. Only draft or rejected submissions can be deleted. Please archive submitted or approved submissions instead.`
        );
      }

      // Delete all child records in proper order (foreign key dependencies)
      // One-to-many relations (array sections)
      await tx.delete(pdsChildren).where(eq(pdsChildren.pdsSubmissionId, id));
      await tx.delete(pdsEducation).where(eq(pdsEducation.pdsSubmissionId, id));
      await tx
        .delete(pdsCivilService)
        .where(eq(pdsCivilService.pdsSubmissionId, id));
      await tx
        .delete(pdsWorkExperience)
        .where(eq(pdsWorkExperience.pdsSubmissionId, id));
      await tx
        .delete(pdsVoluntaryWork)
        .where(eq(pdsVoluntaryWork.pdsSubmissionId, id));
      await tx.delete(pdsTraining).where(eq(pdsTraining.pdsSubmissionId, id));

      // One-to-one relations
      await tx
        .delete(pdsPersonalInfo)
        .where(eq(pdsPersonalInfo.pdsSubmissionId, id));
      await tx
        .delete(pdsFamilyBackground)
        .where(eq(pdsFamilyBackground.pdsSubmissionId, id));
      await tx.delete(pdsOtherInfo).where(eq(pdsOtherInfo.pdsSubmissionId, id));

      // Finally, delete the main submission record
      await tx.delete(pdsSubmissions).where(eq(pdsSubmissions.id, id));
    });

    console.log(
      `[deletePDSSubmission] Successfully deleted PDS ${id} (status: ${deletedStatus})`
    );
  } catch (error) {
    console.error('[deletePDSSubmission] Transaction error:', error);
    throw new Error(
      `Failed to delete PDS submission ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get PDS submission statistics for a user
 *
 * Retrieves aggregate statistics about a user's PDS submissions including
 * counts by status. This is useful for dashboard displays.
 *
 * Uses index: pds_submissions_user_status_idx
 *
 * @param userId - User UUID
 * @returns Promise<PDSStatistics> Submission statistics
 * @throws Error if userId is invalid or database query fails
 *
 * @example
 * const stats = await getPDSStatistics(userId);
 * console.log(`Total: ${stats.total}, Approved: ${stats.approved}, Draft: ${stats.draft}`);
 */
export async function getPDSStatistics(userId: string): Promise<PDSStatistics> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    // Get all submissions for the user
    const submissions = await db
      .select({
        status: pdsSubmissions.status,
      })
      .from(pdsSubmissions)
      .where(eq(pdsSubmissions.userId, userId));

    // Count by status
    const stats: PDSStatistics = {
      total: submissions.length,
      draft: 0,
      submitted: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
    };

    submissions.forEach((sub) => {
      switch (sub.status) {
        case 'draft':
          stats.draft++;
          break;
        case 'submitted':
          stats.submitted++;
          break;
        case 'reviewing':
          stats.reviewing++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('[getPDSStatistics] Database error:', error);
    throw new Error(
      `Failed to fetch PDS statistics for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
