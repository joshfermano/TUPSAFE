/**
 * PDS API Route - List and Create
 * GET /api/pds - List all PDS submissions for current user
 * POST /api/pds - Create new PDS submission
 */

import { NextRequest } from 'next/server';
import {
  getPDSSubmissions,
  getPDSSubmissionById,
  createPDSSubmission,
  updatePDSSubmission,
  updatePDSCompletion,
  getActivePDSDraft,
  type PDSFilterOptions,
  type CreatePDSData,
  type UpdatePDSData,
} from '@tupsafe/database/server';
import { createServerClient } from '@tupsafe/auth/server';
import { transformPdsFromBackend } from '../../../lib/utils/pds-transformations';
import { getPdsReadinessProgress } from '../../../lib/validations/pds-schema';
import { apiSuccess, apiPaginated, apiError } from '../../../lib/api-helpers';

/**
 * Helper function to compute and persist PDS completion
 * Fetches the full submission, transforms to frontend format, computes readiness, and stores it
 */
async function computeAndPersistCompletion(pdsId: string, userId: string): Promise<void> {
  try {
    // Fetch the complete PDS submission
    const pds = await getPDSSubmissionById(pdsId, userId);
    if (!pds) {
      console.warn(`[computeAndPersistCompletion] PDS ${pdsId} not found`);
      return;
    }

    // Transform to frontend format for progress calculation
    const frontendData = transformPdsFromBackend(pds);

    // Compute readiness-based completion (personal info + other info with references)
    const completion = getPdsReadinessProgress(frontendData);

    // Persist the completion value
    await updatePDSCompletion(pdsId, completion);

    console.log(`[computeAndPersistCompletion] Updated PDS ${pdsId} completion to ${completion}%`);
  } catch (error) {
    // Log but don't fail the main operation
    console.error(`[computeAndPersistCompletion] Failed for PDS ${pdsId}:`, error);
  }
}

/**
 * Convert CreatePDSData to UpdatePDSData for draft updates
 *
 * When updating a draft, we don't need to preserve entry IDs since drafts
 * can be completely rewritten. This function ensures type compatibility by
 * explicitly casting arrays that have different type signatures.
 *
 * The key difference is that UpdatePDSData expects civilService and training
 * entries to have an optional 'id' field (for preserving attachment links),
 * while CreatePDSData omits the 'id' field entirely. Since 'id' is optional
 * in UpdatePDSData, entries without 'id' are valid and will cause the
 * updatePDSSubmission function to delete and recreate these entries.
 */
function convertCreateToUpdateData(data: CreatePDSData): UpdatePDSData {
  return {
    year: data.year,
    version: data.version,
    personalInfo: data.personalInfo,
    familyBackground: data.familyBackground,
    children: data.children,
    education: data.education,
    // Cast civilService entries - entries without 'id' will be treated as new entries
    civilService: data.civilService as UpdatePDSData['civilService'],
    workExperience: data.workExperience,
    voluntaryWork: data.voluntaryWork,
    // Cast training entries - entries without 'id' will be treated as new entries
    training: data.training as UpdatePDSData['training'],
    otherInfo: data.otherInfo,
  };
}

/**
 * GET /api/pds
 * Retrieve all PDS submissions for the authenticated user
 *
 * Query Parameters:
 * - status: Filter by submission status (draft | submitted | reviewing | approved | rejected)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 *
 * Returns:
 * {
 *   success: true,
 *   data: PdsSubmission[],
 *   pagination: { page, limit, total }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[GET /api/pds] Authentication failed:', authError);
      return apiError('Unauthorized. Please log in.', 401);
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as
      | 'draft'
      | 'submitted'
      | 'reviewing'
      | 'approved'
      | 'rejected'
      | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      100
    );

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return apiError('Invalid pagination parameters. Page and limit must be positive integers.');
    }

    // Build filter options
    const filters: PDSFilterOptions = {
      limit,
      offset: (page - 1) * limit,
    };

    if (status) {
      // Validate status
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
      filters.status = status;
    }

    // Fetch PDS submissions
    const submissions = await getPDSSubmissions(user.id, filters);

    console.log(
      `[GET /api/pds] Retrieved ${submissions.length} PDS submissions for user ${user.id}`
    );

    return apiPaginated(submissions, { page, limit, total: submissions.length });
  } catch (error) {
    console.error('[GET /api/pds] Error fetching PDS submissions:', error);
    return apiError(
      error instanceof Error ? error.message : 'Failed to fetch PDS submissions',
      500
    );
  }
}

/**
 * POST /api/pds
 * Create a new PDS submission
 *
 * Body: CreatePDSData
 * {
 *   version?: number,
 *   personalInfo?: {...},
 *   familyBackground?: {...},
 *   children?: [...],
 *   education?: [...],
 *   civilService?: [...],
 *   workExperience?: [...],
 *   voluntaryWork?: [...],
 *   training?: [...],
 *   otherInfo?: {...}
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: { id: string }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[POST /api/pds] Authentication failed:', authError);
      return apiError('Unauthorized. Please log in.', 401);
    }

    // Parse request body
    let body: CreatePDSData;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[POST /api/pds] Invalid JSON body:', parseError);
      return apiError('Invalid request body. Expected valid JSON.');
    }

    // For drafts, allow partial data
    // Only validate if personal info is provided (optional for initial draft creation)
    if (body.personalInfo) {
      const { personalInfo } = body;

      // Only validate required fields if they exist
      // This allows for partial drafts during auto-save
      const providedFields = Object.keys(personalInfo).filter(
        (key) => personalInfo[key as keyof typeof personalInfo] !== null &&
                personalInfo[key as keyof typeof personalInfo] !== undefined &&
                personalInfo[key as keyof typeof personalInfo] !== ''
      );

      // If at least some personal info is provided, that's good enough for a draft
      if (providedFields.length === 0) {
        return apiError('Please provide at least some personal information to save a draft.');
      }
    }

    // Check for existing draft within 24 hours (deduplication)
    const existingDraftId = await getActivePDSDraft(user.id);

    if (existingDraftId) {
      // Update existing draft instead of creating new one
      console.log(
        `[POST /api/pds] Found existing draft ${existingDraftId}, updating instead of creating new`
      );

      // Convert CreatePDSData to UpdatePDSData for type compatibility
      // Draft updates don't need to preserve entry IDs
      const updateData = convertCreateToUpdateData(body);
      await updatePDSSubmission(existingDraftId, user.id, updateData);

      // Compute and persist the completion percentage
      await computeAndPersistCompletion(existingDraftId, user.id);

      return apiSuccess({ id: existingDraftId });
    }

    // No recent draft exists - create new one
    const pdsId = await createPDSSubmission(user.id, body);

    // Compute and persist the completion percentage
    await computeAndPersistCompletion(pdsId, user.id);

    console.log(
      `[POST /api/pds] Created new PDS submission ${pdsId} for user ${user.id}`
    );

    return apiSuccess({ id: pdsId }, 201);
  } catch (error) {
    console.error('[POST /api/pds] Error creating PDS submission:', error);
    return apiError(
      error instanceof Error ? error.message : 'Failed to create PDS submission',
      500
    );
  }
}
