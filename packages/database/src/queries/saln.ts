/**
 * SALN (Statement of Assets, Liabilities, Net Worth) Query Functions
 *
 * Production-ready query functions for SALN operations using Drizzle ORM.
 * All mutations use transactions for data integrity.
 *
 * @module queries/saln
 */

import { eq, and, desc, gte, or } from 'drizzle-orm';
import { db } from '../db';
import {
  salnSubmissions,
  salnRealProperties,
  salnPersonalProperties,
  salnLiabilities,
  salnBusinessInterests,
  salnRelativesInGov,
  approvalWorkflows,
  archives,
} from '../schema';
import { v7 as uuidv7 } from 'uuid';
import type {
  SalnSubmission,
  SalnRealProperty,
  NewSalnRealProperty,
  SalnPersonalProperty,
  NewSalnPersonalProperty,
  SalnLiability,
  NewSalnLiability,
  SalnBusinessInterest,
  NewSalnBusinessInterest,
  SalnRelativeInGov,
  NewSalnRelativeInGov,
} from '../types';

/**
 * Complete SALN with all related sections
 */
export interface CompleteSaln extends SalnSubmission {
  realProperties: SalnRealProperty[];
  personalProperties: SalnPersonalProperty[];
  liabilities: SalnLiability[];
  businessInterests: SalnBusinessInterest[];
  relativesInGov: SalnRelativeInGov[];
}

// Import 2025 SALN format types from the types module
import type { ComplianceType, PropertyOwner, UnmarriedChild } from '../types';

// Re-export for convenience
export type { ComplianceType, PropertyOwner, UnmarriedChild };

/**
 * Input data for creating a new SALN submission
 * Supports both 2019 and 2025 SALN format fields
 */
export interface CreateSalnInput {
  year: number;
  filingType: 'joint' | 'separate' | 'not_applicable';
  spouseName?: string;
  position?: string;
  agency?: string;
  officeAddress?: string;
  // 2025 SALN Format fields
  complianceType?: ComplianceType;
  complianceDate?: string | Date;
  hasMultipleMarriages?: boolean;
  previousSpouseNames?: string;
  spouseIsPublicOfficial?: boolean;
  spousePosition?: string;
  spouseAgency?: string;
  spouseOfficeAddress?: string;
  unmarriedChildren?: UnmarriedChild[];
  hasNoBusinessInterests?: boolean;
  hasNoRelativesInGov?: boolean;
  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdDateIssued?: string | Date;
  declarantTin?: string;
  spouseTin?: string;
  spouseDateOfBirth?: string | Date;
  governmentIdType2?: string;
  governmentIdNumber2?: string;
  governmentIdDateIssued2?: string | Date;
  salnFormatVersion?: number;
  // Section arrays
  realProperties?: Omit<NewSalnRealProperty, 'salnSubmissionId'>[];
  personalProperties?: Omit<NewSalnPersonalProperty, 'salnSubmissionId'>[];
  liabilities?: Omit<NewSalnLiability, 'salnSubmissionId'>[];
  businessInterests?: Omit<NewSalnBusinessInterest, 'salnSubmissionId'>[];
  relativesInGov?: Omit<NewSalnRelativeInGov, 'salnSubmissionId'>[];
}

/**
 * Input data for updating an existing SALN submission
 * Supports both 2019 and 2025 SALN format fields
 */
export interface UpdateSalnInput {
  year?: number;
  filingType?: 'joint' | 'separate' | 'not_applicable';
  spouseName?: string;
  position?: string;
  agency?: string;
  officeAddress?: string;
  // 2025 SALN Format fields
  complianceType?: ComplianceType;
  complianceDate?: string | Date;
  hasMultipleMarriages?: boolean;
  previousSpouseNames?: string;
  spouseIsPublicOfficial?: boolean;
  spousePosition?: string;
  spouseAgency?: string;
  spouseOfficeAddress?: string;
  unmarriedChildren?: UnmarriedChild[];
  hasNoBusinessInterests?: boolean;
  hasNoRelativesInGov?: boolean;
  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdDateIssued?: string | Date;
  declarantTin?: string;
  spouseTin?: string;
  spouseDateOfBirth?: string | Date;
  governmentIdType2?: string;
  governmentIdNumber2?: string;
  governmentIdDateIssued2?: string | Date;
  salnFormatVersion?: number;
  // Section arrays
  realProperties?: Omit<NewSalnRealProperty, 'salnSubmissionId'>[];
  personalProperties?: Omit<NewSalnPersonalProperty, 'salnSubmissionId'>[];
  liabilities?: Omit<NewSalnLiability, 'salnSubmissionId'>[];
  businessInterests?: Omit<NewSalnBusinessInterest, 'salnSubmissionId'>[];
  relativesInGov?: Omit<NewSalnRelativeInGov, 'salnSubmissionId'>[];
}

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Filter options for SALN submissions
 */
export interface SalnFilterOptions extends PaginationOptions {
  year?: number;
  status?: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
}

/**
 * SALN statistics for a user
 */
export interface SalnStatistics {
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  submissionsByYear: {
    year: number;
    count: number;
    status: string;
  }[];
}

/**
 * Year-over-year comparison data
 */
export interface SalnComparison {
  year1: number;
  year2: number;
  saln1: CompleteSaln | null;
  saln2: CompleteSaln | null;
  changes: {
    assetsChange: number;
    liabilitiesChange: number;
    netWorthChange: number;
    percentageChange: number;
  };
}

/**
 * Get all SALN submissions for a user with optional filtering and pagination
 *
 * @param userId - The user's ID
 * @param options - Filter and pagination options
 * @returns Array of SALN submissions
 */
export async function getSALNSubmissions(
  userId: string,
  options: SalnFilterOptions = {}
): Promise<CompleteSaln[]> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const { year, status, page = 1, pageSize = 10 } = options;
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [eq(salnSubmissions.userId, userId)];

    if (year !== undefined) {
      conditions.push(eq(salnSubmissions.year, year));
    }

    if (status !== undefined) {
      conditions.push(eq(salnSubmissions.status, status));
    }

    // Use relational query API to load all child tables in a fixed number of
    // queries (one per relation) rather than issuing 5 queries per submission
    // row (the previous N+1 pattern).
    const submissions = await db.query.salnSubmissions.findMany({
      where: and(...conditions),
      orderBy: [desc(salnSubmissions.year), desc(salnSubmissions.createdAt)],
      limit: pageSize,
      offset,
      with: {
        realProperties: true,
        personalProperties: true,
        liabilities: true,
        businessInterests: true,
        relativesInGov: true,
      },
    });

    console.log(`[getSALNSubmissions] User ID for query: ${userId}`);
    console.log(`[getSALNSubmissions] Submissions found: ${submissions.length}`);
    if (submissions.length > 0) {
      console.log(`[getSALNSubmissions] First submission ID: ${submissions[0].id}, year: ${submissions[0].year}, status: ${submissions[0].status}`);
    } else {
      console.log(`[getSALNSubmissions] No submissions found for user ${userId}`);
    }

    return submissions as CompleteSaln[];
  } catch (error) {
    console.error('[getSALNSubmissions] Database error:', error);
    throw new Error(
      `Failed to fetch SALN submissions for user ${userId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get complete SALN submission by ID with all related sections
 *
 * @param id - SALN submission ID
 * @param userId - User ID for ownership validation
 * @returns Complete SALN with all relations or null if not found
 * @throws Error if user doesn't own the SALN
 */
export async function getSALNSubmissionById(
  id: string,
  userId: string
): Promise<CompleteSaln | null> {
  const submission = await db.query.salnSubmissions.findFirst({
    where: eq(salnSubmissions.id, id),
    with: {
      realProperties: true,
      personalProperties: true,
      liabilities: true,
      businessInterests: true,
      relativesInGov: true,
    },
  });

  if (!submission) {
    return null;
  }

  // Validate ownership
  if (submission.userId !== userId) {
    throw new Error('Unauthorized: You do not own this SALN submission');
  }

  return submission as CompleteSaln;
}

/**
 * Get SALN submission for a specific year
 *
 * @param userId - User ID
 * @param year - Submission year
 * @returns Complete SALN or null if not found
 */
export async function getSALNByYear(
  userId: string,
  year: number
): Promise<CompleteSaln | null> {
  const submission = await db.query.salnSubmissions.findFirst({
    where: and(eq(salnSubmissions.userId, userId), eq(salnSubmissions.year, year)),
    with: {
      realProperties: true,
      personalProperties: true,
      liabilities: true,
      businessInterests: true,
      relativesInGov: true,
    },
  });

  return submission ? (submission as CompleteSaln) : null;
}

/**
 * Get the active draft for a user (within 24 hours and current year)
 * Returns the most recently created draft within the last 24 hours for the specified year
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
    const targetYear = year || new Date().getFullYear();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [result] = await db
      .select({ id: salnSubmissions.id })
      .from(salnSubmissions)
      .where(
        and(
          eq(salnSubmissions.userId, userId),
          eq(salnSubmissions.year, targetYear),
          eq(salnSubmissions.status, 'draft'),
          gte(salnSubmissions.createdAt, twentyFourHoursAgo)
        )
      )
      .orderBy(desc(salnSubmissions.createdAt))
      .limit(1);

    return result?.id || null;
  } catch (error) {
    console.error('[getActiveDraft] Error:', error);
    return null;
  }
}


/**
 * Get an editable SALN for a specific year (draft or rejected)
 * Used by POST route to find existing submission to update instead of creating new
 *
 * @param userId - The user ID
 * @param year - The year to check
 * @returns The editable SALN ID if found (draft or rejected), null otherwise
 */
export async function getEditableSALNForYear(
  userId: string,
  year: number
): Promise<string | null> {
  try {
    const [result] = await db
      .select({ id: salnSubmissions.id })
      .from(salnSubmissions)
      .where(
        and(
          eq(salnSubmissions.userId, userId),
          eq(salnSubmissions.year, year),
          or(
            eq(salnSubmissions.status, 'draft'),
            eq(salnSubmissions.status, 'rejected')
          )
        )
      )
      .orderBy(desc(salnSubmissions.createdAt))
      .limit(1);

    return result?.id || null;
  } catch (error) {
    console.error('[getEditableSALNForYear] Error:', error);
    return null;
  }
}

/**
 * Create a new SALN submission with all sections in a transaction
 *
 * @param userId - User ID
 * @param data - SALN data including all sections
 * @returns Created SALN with all relations
 * @throws Error if SALN for the year already exists or validation fails
 */
export async function createSALNSubmission(
  userId: string,
  data: CreateSalnInput
): Promise<CompleteSaln> {
  // Check if SALN for this year already exists
  const existing = await getSALNByYear(userId, data.year);
  if (existing) {
    throw new Error(`SALN for year ${data.year} already exists`);
  }

  return await db.transaction(async (tx) => {
    // Prepare compliance date if provided
    const complianceDateValue = data.complianceDate
      ? (data.complianceDate instanceof Date
          ? data.complianceDate.toISOString().split('T')[0]
          : data.complianceDate)
      : undefined;

    // Prepare government ID date (declarant) if provided
    const govIdDateValue = data.governmentIdDateIssued
      ? (data.governmentIdDateIssued instanceof Date
          ? data.governmentIdDateIssued.toISOString().split('T')[0]
          : data.governmentIdDateIssued)
      : undefined;

    // Prepare spouse date of birth if provided
    const spouseDobValue = data.spouseDateOfBirth
      ? (data.spouseDateOfBirth instanceof Date
          ? data.spouseDateOfBirth.toISOString().split('T')[0]
          : data.spouseDateOfBirth)
      : undefined;

    // Prepare government ID date (spouse) if provided
    const govIdDate2Value = data.governmentIdDateIssued2
      ? (data.governmentIdDateIssued2 instanceof Date
          ? data.governmentIdDateIssued2.toISOString().split('T')[0]
          : data.governmentIdDateIssued2)
      : undefined;

    // Create main submission with 2025 format fields
    const [submission] = await tx
      .insert(salnSubmissions)
      .values({
        userId,
        year: data.year,
        filingType: data.filingType,
        spouseName: data.spouseName,
        position: data.position,
        agency: data.agency,
        officeAddress: data.officeAddress,
        // 2025 SALN Format fields
        complianceType: data.complianceType,
        complianceDate: complianceDateValue,
        hasMultipleMarriages: data.hasMultipleMarriages ?? false,
        previousSpouseNames: data.previousSpouseNames,
        spouseIsPublicOfficial: data.spouseIsPublicOfficial ?? false,
        spousePosition: data.spousePosition,
        spouseAgency: data.spouseAgency,
        spouseOfficeAddress: data.spouseOfficeAddress,
        unmarriedChildren: data.unmarriedChildren,
        hasNoBusinessInterests: data.hasNoBusinessInterests ?? false,
        hasNoRelativesInGov: data.hasNoRelativesInGov ?? false,
        governmentIdType: data.governmentIdType,
        governmentIdNumber: data.governmentIdNumber,
        governmentIdDateIssued: govIdDateValue,
        declarantTin: data.declarantTin,
        spouseTin: data.spouseTin,
        spouseDateOfBirth: spouseDobValue,
        governmentIdType2: data.governmentIdType2,
        governmentIdNumber2: data.governmentIdNumber2,
        governmentIdDateIssued2: govIdDate2Value,
        salnFormatVersion: data.salnFormatVersion ?? 2025,
        status: 'draft',
        totalAssets: '0',
        totalLiabilities: '0',
        netWorth: '0',
        updatedAt: new Date(),
      })
      .returning();

    // Create related records
    const realProperties: SalnRealProperty[] = [];
    const personalProperties: SalnPersonalProperty[] = [];
    const liabilities: SalnLiability[] = [];
    const businessInterests: SalnBusinessInterest[] = [];
    const relativesInGov: SalnRelativeInGov[] = [];

    if (data.realProperties && data.realProperties.length > 0) {
      const insertedProps = await tx
        .insert(salnRealProperties)
        .values(
          data.realProperties.map((prop) => ({
            ...prop,
            salnSubmissionId: submission.id,
          }))
        )
        .returning();
      realProperties.push(...insertedProps);
    }

    if (data.personalProperties && data.personalProperties.length > 0) {
      const insertedProps = await tx
        .insert(salnPersonalProperties)
        .values(
          data.personalProperties.map((prop) => ({
            ...prop,
            salnSubmissionId: submission.id,
          }))
        )
        .returning();
      personalProperties.push(...insertedProps);
    }

    if (data.liabilities && data.liabilities.length > 0) {
      const insertedLiabilities = await tx
        .insert(salnLiabilities)
        .values(
          data.liabilities.map((liability) => ({
            ...liability,
            salnSubmissionId: submission.id,
          }))
        )
        .returning();
      liabilities.push(...insertedLiabilities);
    }

    if (data.businessInterests && data.businessInterests.length > 0) {
      const insertedInterests = await tx
        .insert(salnBusinessInterests)
        .values(
          data.businessInterests.map((interest) => ({
            ...interest,
            salnSubmissionId: submission.id,
          }))
        )
        .returning();
      businessInterests.push(...insertedInterests);
    }

    if (data.relativesInGov && data.relativesInGov.length > 0) {
      const insertedRelatives = await tx
        .insert(salnRelativesInGov)
        .values(
          data.relativesInGov.map((relative) => ({
            ...relative,
            salnSubmissionId: submission.id,
          }))
        )
        .returning();
      relativesInGov.push(...insertedRelatives);
    }

    // Calculate totals
    const totals = await calculateTotalsInTransaction(tx, submission.id);

    // Update submission with calculated totals
    const [updatedSubmission] = await tx
      .update(salnSubmissions)
      .set({
        totalAssets: totals.totalAssets.toString(),
        totalLiabilities: totals.totalLiabilities.toString(),
        netWorth: totals.netWorth.toString(),
        updatedAt: new Date(),
      })
      .where(eq(salnSubmissions.id, submission.id))
      .returning();

    return {
      ...updatedSubmission,
      realProperties,
      personalProperties,
      liabilities,
      businessInterests,
      relativesInGov,
    };
  });
}

/**
 * Update an existing SALN submission and its sections in a transaction
 *
 * @param id - SALN submission ID
 * @param userId - User ID for ownership validation
 * @param data - Updated SALN data
 * @returns Updated complete SALN
 * @throws Error if SALN not found, unauthorized, or already submitted
 */
export async function updateSALNSubmission(
  id: string,
  userId: string,
  data: UpdateSalnInput
): Promise<CompleteSaln> {
  // Validate ownership and status
  const existing = await getSALNSubmissionById(id, userId);
  if (!existing) {
    throw new Error('SALN submission not found');
  }

  if (existing.status !== 'draft' && existing.status !== 'rejected') {
    throw new Error(
      'Cannot update SALN that is submitted, reviewing, or approved. Create a new version instead.'
    );
  }

  return await db.transaction(async (tx) => {
    // Reset rejected submissions to draft when updated
    if (existing.status === 'rejected') {
      await tx
        .update(salnSubmissions)
        .set({
          status: 'draft',
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(salnSubmissions.id, id));
    }

    // Check for metadata updates (basic + 2025 format fields)
    const hasMetadataUpdates =
      data.year !== undefined ||
      data.filingType !== undefined ||
      data.spouseName !== undefined ||
      data.position !== undefined ||
      data.agency !== undefined ||
      data.officeAddress !== undefined ||
      // 2025 format fields
      data.complianceType !== undefined ||
      data.complianceDate !== undefined ||
      data.hasMultipleMarriages !== undefined ||
      data.previousSpouseNames !== undefined ||
      data.spouseIsPublicOfficial !== undefined ||
      data.spousePosition !== undefined ||
      data.spouseAgency !== undefined ||
      data.spouseOfficeAddress !== undefined ||
      data.unmarriedChildren !== undefined ||
      data.hasNoBusinessInterests !== undefined ||
      data.hasNoRelativesInGov !== undefined ||
      data.governmentIdType !== undefined ||
      data.governmentIdNumber !== undefined ||
      data.governmentIdDateIssued !== undefined ||
      data.declarantTin !== undefined ||
      data.spouseTin !== undefined ||
      data.spouseDateOfBirth !== undefined ||
      data.governmentIdType2 !== undefined ||
      data.governmentIdNumber2 !== undefined ||
      data.governmentIdDateIssued2 !== undefined ||
      data.salnFormatVersion !== undefined;

    if (hasMetadataUpdates) {
      // Prepare date values
      const complianceDateValue = data.complianceDate !== undefined
        ? (data.complianceDate instanceof Date
            ? data.complianceDate.toISOString().split('T')[0]
            : data.complianceDate)
        : undefined;

      const govIdDateValue = data.governmentIdDateIssued !== undefined
        ? (data.governmentIdDateIssued instanceof Date
            ? data.governmentIdDateIssued.toISOString().split('T')[0]
            : data.governmentIdDateIssued)
        : undefined;

      const spouseDobValue = data.spouseDateOfBirth !== undefined
        ? (data.spouseDateOfBirth instanceof Date
            ? data.spouseDateOfBirth.toISOString().split('T')[0]
            : data.spouseDateOfBirth)
        : undefined;

      const govIdDate2Value = data.governmentIdDateIssued2 !== undefined
        ? (data.governmentIdDateIssued2 instanceof Date
            ? data.governmentIdDateIssued2.toISOString().split('T')[0]
            : data.governmentIdDateIssued2)
        : undefined;

      await tx
        .update(salnSubmissions)
        .set({
          ...(data.year !== undefined && { year: data.year }),
          ...(data.filingType !== undefined && { filingType: data.filingType }),
          ...(data.spouseName !== undefined && { spouseName: data.spouseName }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.agency !== undefined && { agency: data.agency }),
          ...(data.officeAddress !== undefined && { officeAddress: data.officeAddress }),
          // 2025 SALN Format fields
          ...(data.complianceType !== undefined && { complianceType: data.complianceType }),
          ...(complianceDateValue !== undefined && { complianceDate: complianceDateValue }),
          ...(data.hasMultipleMarriages !== undefined && { hasMultipleMarriages: data.hasMultipleMarriages }),
          ...(data.previousSpouseNames !== undefined && { previousSpouseNames: data.previousSpouseNames }),
          ...(data.spouseIsPublicOfficial !== undefined && { spouseIsPublicOfficial: data.spouseIsPublicOfficial }),
          ...(data.spousePosition !== undefined && { spousePosition: data.spousePosition }),
          ...(data.spouseAgency !== undefined && { spouseAgency: data.spouseAgency }),
          ...(data.spouseOfficeAddress !== undefined && { spouseOfficeAddress: data.spouseOfficeAddress }),
          ...(data.unmarriedChildren !== undefined && { unmarriedChildren: data.unmarriedChildren }),
          ...(data.hasNoBusinessInterests !== undefined && { hasNoBusinessInterests: data.hasNoBusinessInterests }),
          ...(data.hasNoRelativesInGov !== undefined && { hasNoRelativesInGov: data.hasNoRelativesInGov }),
          ...(data.governmentIdType !== undefined && { governmentIdType: data.governmentIdType }),
          ...(data.governmentIdNumber !== undefined && { governmentIdNumber: data.governmentIdNumber }),
          ...(govIdDateValue !== undefined && { governmentIdDateIssued: govIdDateValue }),
          ...(data.declarantTin !== undefined && { declarantTin: data.declarantTin }),
          ...(data.spouseTin !== undefined && { spouseTin: data.spouseTin }),
          ...(spouseDobValue !== undefined && { spouseDateOfBirth: spouseDobValue }),
          ...(data.governmentIdType2 !== undefined && { governmentIdType2: data.governmentIdType2 }),
          ...(data.governmentIdNumber2 !== undefined && { governmentIdNumber2: data.governmentIdNumber2 }),
          ...(govIdDate2Value !== undefined && { governmentIdDateIssued2: govIdDate2Value }),
          ...(data.salnFormatVersion !== undefined && { salnFormatVersion: data.salnFormatVersion }),
          updatedAt: new Date(),
        })
        .where(eq(salnSubmissions.id, id));
    }

    // Update related records by deleting and recreating
    const realProperties: SalnRealProperty[] = [];
    const personalProperties: SalnPersonalProperty[] = [];
    const liabilities: SalnLiability[] = [];
    const businessInterests: SalnBusinessInterest[] = [];
    const relativesInGov: SalnRelativeInGov[] = [];

    if (data.realProperties !== undefined) {
      await tx
        .delete(salnRealProperties)
        .where(eq(salnRealProperties.salnSubmissionId, id));

      if (data.realProperties.length > 0) {
        const insertedProps = await tx
          .insert(salnRealProperties)
          .values(
            data.realProperties.map((prop) => ({
              ...prop,
              salnSubmissionId: id,
            }))
          )
          .returning();
        realProperties.push(...insertedProps);
      }
    }

    if (data.personalProperties !== undefined) {
      await tx
        .delete(salnPersonalProperties)
        .where(eq(salnPersonalProperties.salnSubmissionId, id));

      if (data.personalProperties.length > 0) {
        const insertedProps = await tx
          .insert(salnPersonalProperties)
          .values(
            data.personalProperties.map((prop) => ({
              ...prop,
              salnSubmissionId: id,
            }))
          )
          .returning();
        personalProperties.push(...insertedProps);
      }
    }

    if (data.liabilities !== undefined) {
      await tx
        .delete(salnLiabilities)
        .where(eq(salnLiabilities.salnSubmissionId, id));

      if (data.liabilities.length > 0) {
        const insertedLiabilities = await tx
          .insert(salnLiabilities)
          .values(
            data.liabilities.map((liability) => ({
              ...liability,
              salnSubmissionId: id,
            }))
          )
          .returning();
        liabilities.push(...insertedLiabilities);
      }
    }

    if (data.businessInterests !== undefined) {
      await tx
        .delete(salnBusinessInterests)
        .where(eq(salnBusinessInterests.salnSubmissionId, id));

      if (data.businessInterests.length > 0) {
        const insertedInterests = await tx
          .insert(salnBusinessInterests)
          .values(
            data.businessInterests.map((interest) => ({
              ...interest,
              salnSubmissionId: id,
            }))
          )
          .returning();
        businessInterests.push(...insertedInterests);
      }
    }

    if (data.relativesInGov !== undefined) {
      await tx
        .delete(salnRelativesInGov)
        .where(eq(salnRelativesInGov.salnSubmissionId, id));

      if (data.relativesInGov.length > 0) {
        const insertedRelatives = await tx
          .insert(salnRelativesInGov)
          .values(
            data.relativesInGov.map((relative) => ({
              ...relative,
              salnSubmissionId: id,
            }))
          )
          .returning();
        relativesInGov.push(...insertedRelatives);
      }
    }

    // Recalculate totals
    const totals = await calculateTotalsInTransaction(tx, id);

    // Update submission with new totals
    const [updatedSubmission] = await tx
      .update(salnSubmissions)
      .set({
        totalAssets: totals.totalAssets.toString(),
        totalLiabilities: totals.totalLiabilities.toString(),
        netWorth: totals.netWorth.toString(),
        updatedAt: new Date(),
      })
      .where(eq(salnSubmissions.id, id))
      .returning();

    // Fetch all current relations if not updated
    const finalRealProperties =
      data.realProperties !== undefined
        ? realProperties
        : await tx.query.salnRealProperties.findMany({
            where: eq(salnRealProperties.salnSubmissionId, id),
          });

    const finalPersonalProperties =
      data.personalProperties !== undefined
        ? personalProperties
        : await tx.query.salnPersonalProperties.findMany({
            where: eq(salnPersonalProperties.salnSubmissionId, id),
          });

    const finalLiabilities =
      data.liabilities !== undefined
        ? liabilities
        : await tx.query.salnLiabilities.findMany({
            where: eq(salnLiabilities.salnSubmissionId, id),
          });

    const finalBusinessInterests =
      data.businessInterests !== undefined
        ? businessInterests
        : await tx.query.salnBusinessInterests.findMany({
            where: eq(salnBusinessInterests.salnSubmissionId, id),
          });

    const finalRelativesInGov =
      data.relativesInGov !== undefined
        ? relativesInGov
        : await tx.query.salnRelativesInGov.findMany({
            where: eq(salnRelativesInGov.salnSubmissionId, id),
          });

    return {
      ...updatedSubmission,
      realProperties: finalRealProperties,
      personalProperties: finalPersonalProperties,
      liabilities: finalLiabilities,
      businessInterests: finalBusinessInterests,
      relativesInGov: finalRelativesInGov,
    };
  });
}

/**
 * Update the completion percentage for a SALN submission
 *
 * @param id - SALN submission UUID
 * @param completion - Completion percentage (0-100)
 * @returns Promise<void>
 */
export async function updateSALNCompletion(
  id: string,
  completion: number
): Promise<void> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid SALN submission ID is required');
    }

    // Ensure completion is within valid range
    const validCompletion = Math.max(0, Math.min(100, Math.round(completion)));

    await db
      .update(salnSubmissions)
      .set({
        completion: validCompletion,
        updatedAt: new Date(),
      })
      .where(eq(salnSubmissions.id, id));
  } catch (error) {
    console.error('[updateSALNCompletion] Database error:', error);
    throw new Error(
      `Failed to update SALN completion for ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Calculate total assets, liabilities, and net worth for a SALN submission
 *
 * @param id - SALN submission ID
 * @returns Calculated totals
 */
export async function calculateSALNTotals(id: string): Promise<{
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}> {
  return await db.transaction(async (tx) => {
    const totals = await calculateTotalsInTransaction(tx, id);

    // Update submission with calculated totals
    await tx
      .update(salnSubmissions)
      .set({
        totalAssets: totals.totalAssets.toString(),
        totalLiabilities: totals.totalLiabilities.toString(),
        netWorth: totals.netWorth.toString(),
        updatedAt: new Date(),
      })
      .where(eq(salnSubmissions.id, id));

    return totals;
  });
}

/**
 * Helper function to calculate totals within a transaction
 */
async function calculateTotalsInTransaction(
  tx: any,
  id: string
): Promise<{
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}> {
  // Get all real properties
  const realProps = await tx.query.salnRealProperties.findMany({
    where: eq(salnRealProperties.salnSubmissionId, id),
  });

  // Get all personal properties
  const personalProps = await tx.query.salnPersonalProperties.findMany({
    where: eq(salnPersonalProperties.salnSubmissionId, id),
  });

  // Calculate total assets
  const realPropsTotal = realProps.reduce(
    (sum: number, p: SalnRealProperty) =>
      sum + Number(p.currentFairMarketValue || 0),
    0
  );

  const personalPropsTotal = personalProps.reduce(
    (sum: number, p: SalnPersonalProperty) =>
      sum + Number(p.acquisitionCost || 0),
    0
  );

  const totalAssets = realPropsTotal + personalPropsTotal;

  // Get all liabilities
  const liabilitiesList = await tx.query.salnLiabilities.findMany({
    where: eq(salnLiabilities.salnSubmissionId, id),
  });

  const totalLiabilities = liabilitiesList.reduce(
    (sum: number, l: SalnLiability) => sum + Number(l.outstandingBalance || 0),
    0
  );

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets: Math.round(totalAssets * 100) / 100, // Round to 2 decimal places
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
  };
}

/**
 * Delete a SALN submission (drafts only)
 * Cascading deletes all related records
 *
 * @param id - SALN submission ID
 * @param userId - User ID for ownership validation
 * @returns Deleted SALN submission
 * @throws Error if SALN not found, not owned by user, or not a draft
 */
export async function deleteSALNSubmission(
  id: string,
  userId: string
): Promise<SalnSubmission> {
  // Validate ownership and draft status
  const existing = await getSALNSubmissionById(id, userId);
  if (!existing) {
    throw new Error('SALN submission not found');
  }

  if (existing.status !== 'draft') {
    throw new Error('Only draft SALNs can be deleted');
  }

  return await db.transaction(async (tx) => {
    // Delete child records first (foreign key constraints)
    await tx.delete(salnRealProperties).where(eq(salnRealProperties.salnSubmissionId, id));
    await tx.delete(salnPersonalProperties).where(eq(salnPersonalProperties.salnSubmissionId, id));
    await tx.delete(salnLiabilities).where(eq(salnLiabilities.salnSubmissionId, id));
    await tx.delete(salnBusinessInterests).where(eq(salnBusinessInterests.salnSubmissionId, id));
    await tx.delete(salnRelativesInGov).where(eq(salnRelativesInGov.salnSubmissionId, id));

    // Delete main submission record
    const [deleted] = await tx
      .delete(salnSubmissions)
      .where(eq(salnSubmissions.id, id))
      .returning();

    return deleted;
  });
}

/**
 * Admin-only hard delete of a SALN submission at ANY status.
 *
 * Archives a full snapshot of the submission and all related data to the
 * archives table before hard-deleting it. Removes approval workflow records
 * within the same transaction.
 *
 * Callers are responsible for post-commit storage cleanup and notifications.
 *
 * @param id - SALN submission UUID
 * @param adminUserId - Admin user UUID performing the deletion
 * @param reason - Deletion reason (10-500 chars) for audit trail
 * @returns Owner user ID, PDF file path (or null), and snapshot
 * @throws Error if submission not found or transaction fails
 */
export async function deleteSALNSubmissionAsAdmin(
  id: string,
  adminUserId: string,
  reason: string
): Promise<{
  ownerUserId: string;
  pdfFilePath: string | null;
  snapshot: Record<string, unknown>;
}> {
  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch the main submission (no ownership filter — admin bypass)
      const [submission] = await tx
        .select()
        .from(salnSubmissions)
        .where(eq(salnSubmissions.id, id))
        .limit(1);

      if (!submission) {
        throw new Error('SALN submission not found');
      }

      // 2. Fetch all related records in parallel for snapshot
      const [
        realPropertyRows,
        personalPropertyRows,
        liabilityRows,
        businessInterestRows,
        relativesInGovRows,
        workflowRows,
      ] = await Promise.all([
        tx.select().from(salnRealProperties).where(eq(salnRealProperties.salnSubmissionId, id)),
        tx.select().from(salnPersonalProperties).where(eq(salnPersonalProperties.salnSubmissionId, id)),
        tx.select().from(salnLiabilities).where(eq(salnLiabilities.salnSubmissionId, id)),
        tx.select().from(salnBusinessInterests).where(eq(salnBusinessInterests.salnSubmissionId, id)),
        tx.select().from(salnRelativesInGov).where(eq(salnRelativesInGov.salnSubmissionId, id)),
        tx.select().from(approvalWorkflows).where(
          and(
            eq(approvalWorkflows.submissionId, id),
            eq(approvalWorkflows.submissionType, 'saln')
          )
        ),
      ]);

      // 3. Build snapshot
      const snapshot: Record<string, unknown> = {
        submission,
        realProperties: realPropertyRows,
        personalProperties: personalPropertyRows,
        liabilities: liabilityRows,
        businessInterests: businessInterestRows,
        relativesInGov: relativesInGovRows,
        approvalWorkflows: workflowRows,
        deletedBy: adminUserId,
        deletedAt: new Date().toISOString(),
        reason,
      };

      // 4. Insert into archives
      await tx.insert(archives).values({
        id: uuidv7(),
        originalTable: 'saln_submissions',
        originalId: id,
        data: snapshot,
        archivedBy: adminUserId,
      });

      // 5. Delete approval workflows for this submission
      await tx
        .delete(approvalWorkflows)
        .where(
          and(
            eq(approvalWorkflows.submissionId, id),
            eq(approvalWorkflows.submissionType, 'saln')
          )
        );

      // 6. Delete all SALN child tables
      await tx.delete(salnRealProperties).where(eq(salnRealProperties.salnSubmissionId, id));
      await tx.delete(salnPersonalProperties).where(eq(salnPersonalProperties.salnSubmissionId, id));
      await tx.delete(salnLiabilities).where(eq(salnLiabilities.salnSubmissionId, id));
      await tx.delete(salnBusinessInterests).where(eq(salnBusinessInterests.salnSubmissionId, id));
      await tx.delete(salnRelativesInGov).where(eq(salnRelativesInGov.salnSubmissionId, id));

      // 7. Delete the main submission
      await tx.delete(salnSubmissions).where(eq(salnSubmissions.id, id));

      return {
        ownerUserId: submission.userId,
        pdfFilePath: submission.pdfFilePath ?? null,
        snapshot,
      };
    });
  } catch (error) {
    console.error('[deleteSALNSubmissionAsAdmin] Transaction error:', error);
    throw new Error(
      `Failed to delete SALN submission ${id}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Submit SALN for approval (change status from draft to submitted)
 *
 * @param id - SALN submission ID
 * @param userId - User ID for ownership validation
 * @returns Updated SALN submission
 * @throws Error if SALN not found, unauthorized, or already submitted
 */
export async function submitSALNForApproval(
  id: string,
  userId: string
): Promise<SalnSubmission> {
  const existing = await getSALNSubmissionById(id, userId);
  if (!existing) {
    throw new Error('SALN submission not found');
  }

  if (existing.status !== 'draft' && existing.status !== 'rejected') {
    throw new Error('Only draft or rejected SALNs can be submitted');
  }

  const [updated] = await db
    .update(salnSubmissions)
    .set({
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(salnSubmissions.id, id))
    .returning();

  return updated;
}

/**
 * Approve a SALN submission (admin/HR only)
 *
 * @param id - SALN submission ID
 * @param approverId - ID of the approver (admin/HR)
 * @returns Approved SALN submission
 * @throws Error if SALN not found or not in reviewable status
 */
export async function approveSALN(
  id: string,
  approverId: string
): Promise<SalnSubmission> {
  const existing = await db.query.salnSubmissions.findFirst({
    where: eq(salnSubmissions.id, id),
  });

  if (!existing) {
    throw new Error('SALN submission not found');
  }

  if (existing.status !== 'submitted' && existing.status !== 'reviewing') {
    throw new Error('Only submitted or reviewing SALNs can be approved');
  }

  const [approved] = await db
    .update(salnSubmissions)
    .set({
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      rejectionReason: null, // Clear any previous rejection reason
      updatedAt: new Date(),
    })
    .where(eq(salnSubmissions.id, id))
    .returning();

  return approved;
}

/**
 * Reject a SALN submission with a reason (admin/HR only)
 *
 * @param id - SALN submission ID
 * @param approverId - ID of the approver (admin/HR)
 * @param reason - Reason for rejection
 * @returns Rejected SALN submission
 * @throws Error if SALN not found or not in reviewable status
 */
export async function rejectSALN(
  id: string,
  approverId: string,
  reason: string
): Promise<SalnSubmission> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }

  const existing = await db.query.salnSubmissions.findFirst({
    where: eq(salnSubmissions.id, id),
  });

  if (!existing) {
    throw new Error('SALN submission not found');
  }

  if (existing.status !== 'submitted' && existing.status !== 'reviewing') {
    throw new Error('Only submitted or reviewing SALNs can be rejected');
  }

  const [rejected] = await db
    .update(salnSubmissions)
    .set({
      status: 'rejected',
      approvedBy: approverId,
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(salnSubmissions.id, id))
    .returning();

  return rejected;
}

/**
 * Archive a SALN submission (move to archives table)
 *
 * @param id - SALN submission ID
 * @param userId - User ID for ownership validation
 * @param archivedBy - User ID of the person archiving (admin/HR)
 * @returns Archive record
 * @throws Error if SALN not found, unauthorized, or not approved
 */
export async function archiveSALNSubmission(
  id: string,
  userId: string,
  archivedBy: string
): Promise<any> {
  const existing = await getSALNSubmissionById(id, userId);
  if (!existing) {
    throw new Error('SALN submission not found');
  }

  if (existing.status !== 'approved') {
    throw new Error('Only approved SALNs can be archived');
  }

  return await db.transaction(async (tx) => {
    // Create archive record
    const [archive] = await tx
      .insert(archives)
      .values({
        originalTable: 'saln_submissions',
        originalId: id,
        data: existing,
        archivedBy,
      })
      .returning();

    // Optional: Delete from main tables if archive-only storage is required
    // For now, we keep both for redundancy

    return archive;
  });
}

/**
 * Get archived SALN submissions for a user
 *
 * @param userId - User ID
 * @returns Array of archived SALN submissions
 */
export async function getArchivedSALN(userId: string): Promise<any[]> {
  const archivedSubmissions = await db.query.archives.findMany({
    where: eq(archives.originalTable, 'saln_submissions'),
    orderBy: [desc(archives.archivedAt)],
  });

  // Filter by userId from the archived data
  const userArchives = archivedSubmissions.filter((archive: any) => {
    const data = archive.data as any;
    return data?.userId === userId;
  });

  return userArchives;
}

/**
 * Get submission statistics for a user
 *
 * @param userId - User ID
 * @returns SALN statistics
 */
export async function getSALNStatistics(
  userId: string
): Promise<SalnStatistics> {
  const submissions = await db.query.salnSubmissions.findMany({
    where: eq(salnSubmissions.userId, userId),
  });

  const totalSubmissions = submissions.length;
  const approvedSubmissions = submissions.filter(
    (s) => s.status === 'approved'
  ).length;
  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'reviewing'
  ).length;
  const rejectedSubmissions = submissions.filter(
    (s) => s.status === 'rejected'
  ).length;

  // Group by year
  const submissionsByYear = submissions.reduce(
    (acc, submission) => {
      const existing = acc.find((item) => item.year === submission.year);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          year: submission.year,
          count: 1,
          status: submission.status,
        });
      }
      return acc;
    },
    [] as { year: number; count: number; status: string }[]
  );

  // Sort by year descending
  submissionsByYear.sort((a, b) => b.year - a.year);

  return {
    totalSubmissions,
    approvedSubmissions,
    pendingSubmissions,
    rejectedSubmissions,
    submissionsByYear,
  };
}

/**
 * Compare two SALN submissions year-over-year
 *
 * @param userId - User ID
 * @param year1 - First year to compare
 * @param year2 - Second year to compare
 * @returns Comparison data with change calculations
 */
export async function compareSALNYears(
  userId: string,
  year1: number,
  year2: number
): Promise<SalnComparison> {
  const [saln1, saln2] = await Promise.all([
    getSALNByYear(userId, year1),
    getSALNByYear(userId, year2),
  ]);

  const assets1 = saln1 ? Number(saln1.totalAssets) : 0;
  const assets2 = saln2 ? Number(saln2.totalAssets) : 0;
  const liabilities1 = saln1 ? Number(saln1.totalLiabilities) : 0;
  const liabilities2 = saln2 ? Number(saln2.totalLiabilities) : 0;
  const netWorth1 = saln1 ? Number(saln1.netWorth) : 0;
  const netWorth2 = saln2 ? Number(saln2.netWorth) : 0;

  const assetsChange = assets2 - assets1;
  const liabilitiesChange = liabilities2 - liabilities1;
  const netWorthChange = netWorth2 - netWorth1;

  // Calculate percentage change (avoid division by zero)
  const percentageChange =
    netWorth1 !== 0 ? ((netWorthChange / netWorth1) * 100) : 0;

  return {
    year1,
    year2,
    saln1,
    saln2,
    changes: {
      assetsChange: Math.round(assetsChange * 100) / 100,
      liabilitiesChange: Math.round(liabilitiesChange * 100) / 100,
      netWorthChange: Math.round(netWorthChange * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
    },
  };
}

// ============================================================================
// 2025 SALN FORMAT - OWNER-BASED FILTERING HELPERS
// ============================================================================

/**
 * Filter properties/liabilities by owner type
 * Useful for generating owner-specific summaries in 2025 SALN format
 *
 * @param items - Array of items with 'owner' field
 * @param owner - Owner type to filter by
 * @returns Filtered array of items
 */
export function filterByOwner<T extends { owner?: string | null }>(
  items: T[],
  owner: PropertyOwner
): T[] {
  return items.filter((item) => item.owner === owner);
}

/**
 * Group properties/liabilities by owner type
 * Returns an object with arrays for each owner type
 *
 * @param items - Array of items with 'owner' field
 * @returns Object with items grouped by owner
 */
export function groupByOwner<T extends { owner?: string | null }>(
  items: T[]
): Record<PropertyOwner, T[]> {
  return {
    declarant: items.filter((item) => item.owner === 'declarant' || !item.owner),
    spouse: items.filter((item) => item.owner === 'spouse'),
    child: items.filter((item) => item.owner === 'child'),
    joint: items.filter((item) => item.owner === 'joint'),
  };
}

/**
 * Calculate totals for each owner from a complete SALN
 * Used for 2025 SALN format reporting
 *
 * @param saln - Complete SALN with all sections
 * @returns Totals broken down by owner
 */
export function calculateTotalsByOwner(saln: CompleteSaln): {
  declarant: { assets: number; liabilities: number; netWorth: number };
  spouse: { assets: number; liabilities: number; netWorth: number };
  child: { assets: number; liabilities: number; netWorth: number };
  joint: { assets: number; liabilities: number; netWorth: number };
  combined: { assets: number; liabilities: number; netWorth: number };
} {
  // Group all items by owner
  const realPropertiesByOwner = groupByOwner(saln.realProperties || []);
  const personalPropertiesByOwner = groupByOwner(saln.personalProperties || []);
  const liabilitiesByOwner = groupByOwner(saln.liabilities || []);

  // Helper to calculate totals for a specific owner
  const calculateOwnerTotals = (owner: PropertyOwner) => {
    const realPropsTotal = realPropertiesByOwner[owner].reduce(
      (sum, p) => sum + Number(p.currentFairMarketValue || 0),
      0
    );
    const personalPropsTotal = personalPropertiesByOwner[owner].reduce(
      (sum, p) => sum + Number(p.acquisitionCost || 0),
      0
    );
    const assets = realPropsTotal + personalPropsTotal;

    const liabilitiesTotal = liabilitiesByOwner[owner].reduce(
      (sum, l) => sum + Number(l.outstandingBalance || 0),
      0
    );

    return {
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabilitiesTotal * 100) / 100,
      netWorth: Math.round((assets - liabilitiesTotal) * 100) / 100,
    };
  };

  const declarantTotals = calculateOwnerTotals('declarant');
  const spouseTotals = calculateOwnerTotals('spouse');
  const childTotals = calculateOwnerTotals('child');
  const jointTotals = calculateOwnerTotals('joint');

  // Combined totals
  const combinedAssets =
    declarantTotals.assets +
    spouseTotals.assets +
    childTotals.assets +
    jointTotals.assets;
  const combinedLiabilities =
    declarantTotals.liabilities +
    spouseTotals.liabilities +
    childTotals.liabilities +
    jointTotals.liabilities;

  return {
    declarant: declarantTotals,
    spouse: spouseTotals,
    child: childTotals,
    joint: jointTotals,
    combined: {
      assets: Math.round(combinedAssets * 100) / 100,
      liabilities: Math.round(combinedLiabilities * 100) / 100,
      netWorth: Math.round((combinedAssets - combinedLiabilities) * 100) / 100,
    },
  };
}

/**
 * Get child-specific items with their names
 * Used for 2025 SALN format to list items belonging to unmarried children
 *
 * @param saln - Complete SALN with all sections
 * @returns Object with child items grouped by child name
 */
export function getChildItems(saln: CompleteSaln): {
  realProperties: Map<string, SalnRealProperty[]>;
  personalProperties: Map<string, SalnPersonalProperty[]>;
  liabilities: Map<string, SalnLiability[]>;
  businessInterests: Map<string, SalnBusinessInterest[]>;
} {
  const groupByChildName = <T extends { owner?: string | null; childName?: string | null }>(
    items: T[]
  ): Map<string, T[]> => {
    const result = new Map<string, T[]>();
    items
      .filter((item) => item.owner === 'child' && item.childName)
      .forEach((item) => {
        const name = item.childName!;
        if (!result.has(name)) {
          result.set(name, []);
        }
        result.get(name)!.push(item);
      });
    return result;
  };

  return {
    realProperties: groupByChildName(saln.realProperties || []),
    personalProperties: groupByChildName(saln.personalProperties || []),
    liabilities: groupByChildName(saln.liabilities || []),
    businessInterests: groupByChildName(saln.businessInterests || []),
  };
}

/**
 * Check if a SALN uses the 2025 format
 * Based on salnFormatVersion field
 *
 * @param saln - SALN submission
 * @returns true if using 2025 format
 */
export function is2025Format(saln: SalnSubmission): boolean {
  return saln.salnFormatVersion === 2025;
}

/**
 * Get compliance type label for display
 *
 * @param complianceType - The compliance type value
 * @returns Human-readable label
 */
export function getComplianceTypeLabel(
  complianceType?: ComplianceType | null
): string {
  switch (complianceType) {
    case 'assumption':
      return 'Assumption of Office';
    case 'annual':
      return 'Annual Declaration';
    case 'exit':
      return 'Separation from Service';
    default:
      return 'Annual Declaration';
  }
}

/**
 * Get owner label for display
 *
 * @param owner - The owner type value
 * @returns Human-readable label
 */
export function getOwnerLabel(owner?: PropertyOwner | null): string {
  switch (owner) {
    case 'declarant':
      return 'Declarant';
    case 'spouse':
      return 'Spouse';
    case 'child':
      return 'Unmarried Child';
    case 'joint':
      return 'Joint (Declarant & Spouse)';
    default:
      return 'Declarant';
  }
}
