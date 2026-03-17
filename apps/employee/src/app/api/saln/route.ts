/**
 * SALN API Route - List and Create
 * GET /api/saln - List all SALN submissions for current user
 * POST /api/saln - Create new SALN submission
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiPaginated, apiError } from '../../../lib/api-helpers';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { profiles } from '@tupsafe/database/schema';
import { eq } from 'drizzle-orm';
import {
  getSALNSubmissions,
  getSALNSubmissionById,
  createSALNSubmission,
  getEditableSALNForYear,
  updateSALNSubmission,
  updateSALNCompletion,
  type CreateSalnInput,
} from '@tupsafe/database/server';
import { transformSalnForSubmission, transformSalnFromBackend } from '../../../lib/utils/saln-transformations';
import { getSalnReadinessProgress } from '../../../lib/validations/saln-schema';

/**
 * Helper function to compute and persist SALN completion
 * Fetches the full submission, transforms to frontend format, computes readiness, and stores it
 */
async function computeAndPersistCompletion(salnId: string, userId: string): Promise<void> {
  try {
    // Fetch the complete SALN submission
    const saln = await getSALNSubmissionById(salnId, userId);
    if (!saln) {
      console.warn(`[computeAndPersistCompletion] SALN ${salnId} not found`);
      return;
    }

    // Transform to frontend format for progress calculation
    const frontendData = transformSalnFromBackend(saln);

    // Compute readiness-based completion (declarant info + has assets)
    const completion = getSalnReadinessProgress(frontendData);

    // Persist the completion value
    await updateSALNCompletion(salnId, completion);

    console.log(`[computeAndPersistCompletion] Updated SALN ${salnId} completion to ${completion}%`);
  } catch (error) {
    // Log but don't fail the main operation
    console.error(`[computeAndPersistCompletion] Failed for SALN ${salnId}:`, error);
  }
}

/**
 * GET /api/saln
 * List all SALN submissions for current user
 *
 * Query Parameters:
 * - year: Filter by year (optional)
 * - status: Filter by submission status (draft | submitted | reviewing | approved | rejected)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 *
 * Returns:
 * {
 *   success: true,
 *   data: SalnSubmission[],
 *   pagination: { page, limit, total }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // STEP 1: Authenticate user
    // ========================================================================
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[GET /api/saln] Authentication failed:', authError);
      return apiError('Unauthorized. Please log in.', 401);
    }

    // ========================================================================
    // STEP 2: RBAC CHECK - EMPLOYEE ONLY (Source of Truth: profiles table)
    // ========================================================================
    const [profile] = await db
      .select({ userType: profiles.userType })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    // DEBUG: Log profile check result
    console.log(`[GET /api/saln] Profile check: userId=${user.id}, userType=${profile?.userType || 'null'}`);

    // ENFORCE EMPLOYEE-ONLY ACCESS
    if (!profile || profile.userType !== 'employee') {
      console.error(
        `[GET /api/saln] Access denied for user ${user.id}: userType=${profile?.userType || 'null'}`
      );
      return apiError('SALN is only available to employees.', 403);
    }

    // ========================================================================
    // STEP 3: Parse and validate query parameters
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : undefined;
    const statusParam = searchParams.get('status');
    const status = statusParam
      ? (statusParam as 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected')
      : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return apiError('Invalid pagination parameters. Page and limit must be positive integers.');
    }

    // Validate year if provided
    if (year !== undefined && (year < 2000 || year > new Date().getFullYear() + 1)) {
      return apiError(`Invalid year. Must be between 2000 and ${new Date().getFullYear() + 1}`);
    }

    // Validate status if provided
    if (status) {
      const validStatuses = [
        'draft',
        'submitted',
        'reviewing',
        'approved',
        'rejected',
      ];
      if (!validStatuses.includes(status)) {
        return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // ========================================================================
    // STEP 4: Fetch SALN submissions
    // ========================================================================
    const submissions = await getSALNSubmissions(user.id, {
      year,
      status,
      page,
      pageSize: limit,
    });

    // DEBUG: Log query details and results
    console.log(`[GET /api/saln] Query params: year=${year}, status=${status}, page=${page}, limit=${limit}`);
    console.log(`[GET /api/saln] User ID for query: ${user.id}`);
    console.log(`[GET /api/saln] Submissions found: ${submissions.length}`);
    if (submissions.length > 0) {
      console.log(`[GET /api/saln] First submission ID: ${submissions[0].id}, year: ${submissions[0].year}, status: ${submissions[0].status}`);
    } else {
      console.log(`[GET /api/saln] No submissions found for user ${user.id}`);
    }

    return apiPaginated(submissions, { page, limit, total: submissions.length });
  } catch (error) {
    console.error('[GET /api/saln] Error fetching SALN submissions:', error);
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch SALN submissions',
      500
    );
  }
}

/**
 * POST /api/saln
 * Create a new SALN submission
 *
 * Body: CompleteSalnData (transformed from frontend format)
 * {
 *   submission: { year, filingType, ... },
 *   realProperties: [...],
 *   personalProperties: [...],
 *   liabilities: [...],
 *   businessInterests: [...],
 *   relativesInGov: [...]
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: { id: string },
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // STEP 1: Authenticate user
    // ========================================================================
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[POST /api/saln] Authentication failed:', authError);
      return apiError('Unauthorized. Please log in.', 401);
    }

    // ========================================================================
    // STEP 2: RBAC CHECK - EMPLOYEE ONLY (Source of Truth: profiles table)
    // ========================================================================
    const [profile] = await db
      .select({ userType: profiles.userType })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    // ENFORCE EMPLOYEE-ONLY ACCESS
    if (!profile || profile.userType !== 'employee') {
      console.error(
        `[POST /api/saln] Access denied for user ${user.id}: userType=${profile?.userType || 'null'}`
      );
      return apiError('SALN is only available to employees.', 403);
    }

    // ========================================================================
    // STEP 3: Parse and validate request body
    // ========================================================================
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[POST /api/saln] Invalid JSON body:', parseError);
      return apiError('Invalid request body. Expected valid JSON.');
    }

    // ========================================================================
    // STEP 4: Transform frontend data to backend format
    // ========================================================================
    const transformedData = transformSalnForSubmission(body) as CreateSalnInput & Record<string, unknown>;

    // Validate required fields
    if (!transformedData.year) {
      return apiError('Year is required');
    }

    if (
      !transformedData.filingType ||
      !['joint', 'separate', 'not_applicable'].includes(
        transformedData.filingType
      )
    ) {
      return apiError('Valid filing type is required (joint, separate, or not_applicable)');
    }

    // Validate year
    const year = typeof transformedData.year === 'string' ? parseInt(transformedData.year) : transformedData.year;
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 1) {
      return apiError(`Year must be between 2000 and ${currentYear + 1}`);
    }

    // ========================================================================
    // STEP 5: Create SALN input with all fields including metadata
    // ========================================================================
    const salnInput: CreateSalnInput = {
      year,
      filingType: transformedData.filingType,
      spouseName: transformedData.spouseName,
      position: transformedData.position,
      agency: transformedData.agency,
      officeAddress: transformedData.officeAddress,
      // 2025 SALN Format fields
      salnFormatVersion: transformedData.salnFormatVersion ?? 2025,
      complianceType: transformedData.complianceType,
      complianceDate: transformedData.complianceDate,
      hasMultipleMarriages: transformedData.hasMultipleMarriages,
      previousSpouseNames: transformedData.previousSpouseNames,
      spouseIsPublicOfficial: transformedData.spouseIsPublicOfficial,
      spousePosition: transformedData.spousePosition,
      spouseAgency: transformedData.spouseAgency,
      spouseOfficeAddress: transformedData.spouseOfficeAddress,
      unmarriedChildren: transformedData.unmarriedChildren,
      hasNoBusinessInterests: transformedData.hasNoBusinessInterests,
      hasNoRelativesInGov: transformedData.hasNoRelativesInGov,
      governmentIdType: transformedData.governmentIdType,
      governmentIdNumber: transformedData.governmentIdNumber,
      governmentIdDateIssued: transformedData.governmentIdDateIssued,
      governmentIdType2: transformedData.governmentIdType2,
      governmentIdNumber2: transformedData.governmentIdNumber2,
      governmentIdDateIssued2: transformedData.governmentIdDateIssued2,
      declarantTin: transformedData.declarantTin,
      spouseTin: transformedData.spouseTin,
      spouseDateOfBirth: transformedData.spouseDateOfBirth,
      // Section arrays
      realProperties: transformedData.realProperties || [],
      personalProperties: transformedData.personalProperties || [],
      liabilities: transformedData.liabilities || [],
      businessInterests: transformedData.businessInterests || [],
      relativesInGov: transformedData.relativesInGov || [],
    };

    // Check for existing editable SALN (draft or rejected) for this year
    const editableSalnId = await getEditableSALNForYear(user.id, year);

    if (editableSalnId) {
      console.log(
        `[POST /api/saln] Found existing editable SALN ${editableSalnId}, updating instead of creating new`
      );

      // Update existing (draft or rejected) submission
      await updateSALNSubmission(editableSalnId, user.id, salnInput);
      await computeAndPersistCompletion(editableSalnId, user.id);

      return apiSuccess({ id: editableSalnId });
    }

    // ========================================================================
    // STEP 6: Create SALN submission
    // ========================================================================
    // No recent draft exists - create new one
    const newSaln = await createSALNSubmission(user.id, salnInput);

    // Compute and persist the completion percentage
    await computeAndPersistCompletion(newSaln.id, user.id);

    console.log(
      `[POST /api/saln] Created new SALN submission ${newSaln.id} for user ${user.id}, year ${year}`
    );

    return apiSuccess({ id: newSaln.id }, 201);
  } catch (error) {
    console.error('[POST /api/saln] Error creating SALN submission:', error);

    // Handle specific error cases
    if (error instanceof Error && error.message.includes('already exists')) {
      return apiError(error.message, 409);
    }

    return apiError(
      error instanceof Error ? error.message : 'Failed to create SALN submission',
      500
    );
  }
}
