import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { getArchivedSALN } from '@tupsafe/database/server';

/**
 * GET /api/saln/archive
 * Get archived SALN submissions
 * Returns: List of archived SALNs for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient('employee');

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is employee (not applicant)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, employee_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'employee') {
      return NextResponse.json(
        { error: 'Only employees can access archived SALN submissions' },
        { status: 403 }
      );
    }

    // Fetch archived SALN submissions
    const archivedSalns = await getArchivedSALN(user.id);

    return NextResponse.json({
      success: true,
      data: archivedSalns,
      total: archivedSalns.length,
    });
  } catch (error) {
    console.error('Error fetching archived SALNs:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch archived SALN submissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
