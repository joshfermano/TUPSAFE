import { db } from '@tupsafe/database/server';
import {
  profiles,
  departments,
  pdsSubmissions,
  salnSubmissions,
} from '@tupsafe/database/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

/** Submission statuses that count toward compliance. */
export const COMPLIANT_SUBMISSION_STATUSES = ['submitted', 'approved'] as const;

/** Returns the current reporting year (server local). */
export function currentReportingYear(now: Date = new Date()): number {
  return now.getFullYear();
}

/** Safe division. Returns 0 when denominator is <= 0. */
export function safeRate(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return 0;
  if (denominator <= 0) return 0;
  const rate = (numerator / denominator) * 100;
  return Number.isFinite(rate) ? rate : 0;
}

/** Round a percentage to N decimal places (default 1). Handles NaN/±Infinity. */
export function roundRate(value: number, decimals = 1): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export interface ComplianceRates {
  /** Active, non-applicant employees in scope. */
  expected: number;
  /** Distinct users with a qualifying PDS submission (any year). */
  pdsSubmitted: number;
  /** Distinct users with a qualifying SALN submission for the reporting year. */
  salnSubmitted: number;
  /** PDS compliance rate in percent (0–100), full precision. */
  pdsRate: number;
  /** SALN compliance rate in percent (0–100), full precision. */
  salnRate: number;
  /** (pdsRate + salnRate) / 2, full precision. */
  overallRate: number;
  /** Reporting year used for SALN year filter. */
  year: number;
}

/**
 * Compute PDS/SALN/overall compliance rates.
 *
 * Pass a `departmentId` to scope both the denominator and numerators to that
 * department. Passing undefined computes organization-wide rates.
 *
 * This is the ONLY function that should compute these numbers. All API routes,
 * widgets, report endpoints, and AI-agent-facing tools should call through
 * here (or mirror its SQL exactly) so that the dashboard shows one consistent
 * value everywhere.
 */
export async function computeComplianceRates(
  departmentId?: string,
  now: Date = new Date(),
): Promise<ComplianceRates> {
  const year = currentReportingYear(now);

  const employeeScope = and(
    eq(profiles.userType, 'employee'),
    eq(profiles.accountStatus, 'active'),
    eq(profiles.isActive, true),
    departmentId ? eq(profiles.departmentId, departmentId) : undefined,
  );

  const [expectedRow, pdsRow, salnRow] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(profiles)
      .where(employeeScope),

    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${pdsSubmissions.userId})`,
      })
      .from(pdsSubmissions)
      .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
      .where(
        and(
          employeeScope,
          inArray(pdsSubmissions.status, [...COMPLIANT_SUBMISSION_STATUSES]),
        ),
      ),

    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${salnSubmissions.userId})`,
      })
      .from(salnSubmissions)
      .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
      .where(
        and(
          employeeScope,
          eq(salnSubmissions.year, year),
          inArray(salnSubmissions.status, [...COMPLIANT_SUBMISSION_STATUSES]),
        ),
      ),
  ]);

  const expected = Number(expectedRow[0]?.count ?? 0);
  const pdsSubmitted = Number(pdsRow[0]?.count ?? 0);
  const salnSubmitted = Number(salnRow[0]?.count ?? 0);

  const pdsRate = safeRate(pdsSubmitted, expected);
  const salnRate = safeRate(salnSubmitted, expected);
  const overallRate = (pdsRate + salnRate) / 2;

  return {
    expected,
    pdsSubmitted,
    salnSubmitted,
    pdsRate,
    salnRate,
    overallRate,
    year,
  };
}

export interface DepartmentCompliance {
  departmentId: string;
  departmentName: string;
  departmentCode: string | null;
  expected: number;
  pdsSubmitted: number;
  salnSubmitted: number;
  pdsRate: number;
  salnRate: number;
  overallRate: number;
  year: number;
}

/**
 * Compute per-department compliance in a single query using correlated
 * subqueries so each department's distinct-user counts are isolated and
 * can't interact across the PDS/SALN joins (a classic bug when chaining
 * LEFT JOINs — each JOIN inflates the other's DISTINCT count).
 */
export async function computeDepartmentCompliance(
  now: Date = new Date(),
): Promise<DepartmentCompliance[]> {
  const year = currentReportingYear(now);

  // Use fully-qualified "departments"."id" in correlated subqueries. Drizzle's
  // ${departments.id} interpolation renders just "id", which Postgres reports
  // as ambiguous once "profiles".id is in scope inside the subquery (42702).
  const rows = await db
    .select({
      departmentId: departments.id,
      departmentName: departments.name,
      departmentCode: departments.code,
      expected: sql<number>`(
        SELECT COUNT(*) FROM ${profiles} p
        WHERE p.department_id = "departments"."id"
          AND p.user_type = 'employee'
          AND p.account_status = 'active'
          AND p.is_active = true
      )`,
      pdsSubmitted: sql<number>`(
        SELECT COUNT(DISTINCT s.user_id)
        FROM ${pdsSubmissions} s
        INNER JOIN ${profiles} p ON p.id = s.user_id
        WHERE p.department_id = "departments"."id"
          AND p.user_type = 'employee'
          AND p.account_status = 'active'
          AND p.is_active = true
          AND s.status IN ('submitted','approved')
      )`,
      salnSubmitted: sql<number>`(
        SELECT COUNT(DISTINCT s.user_id)
        FROM ${salnSubmissions} s
        INNER JOIN ${profiles} p ON p.id = s.user_id
        WHERE p.department_id = "departments"."id"
          AND p.user_type = 'employee'
          AND p.account_status = 'active'
          AND p.is_active = true
          AND s.year = ${year}
          AND s.status IN ('submitted','approved')
      )`,
    })
    .from(departments)
    .orderBy(departments.name);

  return rows.map((r) => {
    const expected = Number(r.expected ?? 0);
    const pdsSubmitted = Number(r.pdsSubmitted ?? 0);
    const salnSubmitted = Number(r.salnSubmitted ?? 0);
    const pdsRate = safeRate(pdsSubmitted, expected);
    const salnRate = safeRate(salnSubmitted, expected);
    return {
      departmentId: r.departmentId,
      departmentName: r.departmentName,
      departmentCode: r.departmentCode ?? null,
      expected,
      pdsSubmitted,
      salnSubmitted,
      pdsRate,
      salnRate,
      overallRate: (pdsRate + salnRate) / 2,
      year,
    };
  });
}
