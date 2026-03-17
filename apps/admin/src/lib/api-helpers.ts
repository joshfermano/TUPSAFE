/**
 * API Response Helpers - Admin App
 *
 * Standardised NextResponse factories that enforce a consistent envelope:
 *   { success: true,  data: T }
 *   { success: true,  data: T[], pagination: { ... } }
 *   { success: false, error: string, code?: string }
 *
 * Import the matching type companions from @tupsafe/types when you need
 * to annotate return types on calling code.
 */

import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Success – single resource or arbitrary payload
// ---------------------------------------------------------------------------

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status });
}

// ---------------------------------------------------------------------------
// Success – paginated list
// ---------------------------------------------------------------------------

export function apiPaginated<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return NextResponse.json({
    success: true as const,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export function apiError(error: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false as const, error, ...(code && { code }) },
    { status }
  );
}
