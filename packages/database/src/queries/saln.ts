/**
 * SALN (Statement of Assets, Liabilities, Net Worth) Query Functions
 *
 * Production-ready query functions for SALN operations using Drizzle ORM.
 * All mutations use transactions for data integrity.
 *
 * @module queries/saln
 */

import { eq, and, desc, gte } from 'drizzle-orm';
import { db } from '../db';
import {
  salnSubmissions,
  salnRealProperties,
  salnPersonalProperties,
  salnLiabilities,
  salnBusinessInterests,
  salnRelativesInGov,
  archives,
} from '../schema';
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

/**
 * Input data for creating a new SALN submission
 */
export interface CreateSalnInput {
  year: number;
  filingType: 'joint' | 'separate' | 'not_applicable';
  realProperties?: Omit<NewSalnRealProperty, 'salnSubmissionId'>[];
  personalProperties?: Omit<NewSalnPersonalProperty, 'salnSubmissionId'>[];
  liabilities?: Omit<NewSalnLiability, 'salnSubmissionId'>[];
  businessInterests?: Omit<NewSalnBusinessInterest, 'salnSubmissionId'>[];
  relativesInGov?: Omit<NewSalnRelativeInGov, 'salnSubmissionId'>[];
}

/**
 * Input data for updating an existing SALN submission
 */
export interface UpdateSalnInput {
  year?: number;
  filingType?: 'joint' | 'separate' | 'not_applicable';
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
): Promise<SalnSubmission[]> {
  const { year, status, page = 1, pageSize = 10 } = options;

  const conditions = [eq(salnSubmissions.userId, userId)];

  if (year !== undefined) {
    conditions.push(eq(salnSubmissions.year, year));
  }

  if (status !== undefined) {
    conditions.push(eq(salnSubmissions.status, status));
  }

  const offset = (page - 1) * pageSize;

  const submissions = await db.query.salnSubmissions.findMany({
    where: and(...conditions),
    orderBy: [desc(salnSubmissions.year), desc(salnSubmissions.createdAt)],
    limit: pageSize,
    offset,
  });

  return submissions;
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
    // Create main submission
    const [submission] = await tx
      .insert(salnSubmissions)
      .values({
        userId,
        year: data.year,
        filingType: data.filingType,
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
    // Update main submission if year or filing type changed
    if (data.year !== undefined || data.filingType !== undefined) {
      await tx
        .update(salnSubmissions)
        .set({
          ...(data.year !== undefined && { year: data.year }),
          ...(data.filingType !== undefined && { filingType: data.filingType }),
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
