import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { compareSALNYears } from '@tupsafe/database/server';

/**
 * GET /api/saln/compare
 * Compare two SALN submissions year-over-year
 * Query params: year1, year2
 * Returns: Year-over-year comparison data with change calculations
 */
export async function GET(request: NextRequest) {
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
        { error: 'Only employees can compare SALN submissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const year1Param = searchParams.get('year1');
    const year2Param = searchParams.get('year2');

    // Validate required parameters
    if (!year1Param || !year2Param) {
      return NextResponse.json(
        { error: 'Both year1 and year2 query parameters are required' },
        { status: 400 }
      );
    }

    // Parse and validate years
    const year1 = parseInt(year1Param);
    const year2 = parseInt(year2Param);

    if (isNaN(year1) || isNaN(year2)) {
      return NextResponse.json(
        { error: 'Year parameters must be valid numbers' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    if (
      year1 < 1900 ||
      year1 > currentYear + 1 ||
      year2 < 1900 ||
      year2 > currentYear + 1
    ) {
      return NextResponse.json(
        { error: `Years must be between 1900 and ${currentYear + 1}` },
        { status: 400 }
      );
    }

    if (year1 === year2) {
      return NextResponse.json(
        { error: 'Cannot compare the same year. Please select two different years.' },
        { status: 400 }
      );
    }

    // Compare SALN submissions
    const comparison = await compareSALNYears(user.id, year1, year2);

    // Check if at least one SALN exists
    if (!comparison.saln1 && !comparison.saln2) {
      return NextResponse.json(
        {
          error: `No SALN submissions found for years ${year1} or ${year2}`,
          suggestion: 'Please ensure you have SALN submissions for the years you want to compare',
        },
        { status: 404 }
      );
    }

    // Provide helpful message if only one year exists
    let message = 'SALN comparison retrieved successfully';
    if (!comparison.saln1) {
      message = `Note: No SALN found for year ${year1}. Showing data for year ${year2} only.`;
    } else if (!comparison.saln2) {
      message = `Note: No SALN found for year ${year2}. Showing data for year ${year1} only.`;
    }

    return NextResponse.json({
      success: true,
      data: comparison,
      message,
    });
  } catch (error) {
    console.error('Error comparing SALNs:', error);

    return NextResponse.json(
      {
        error: 'Failed to compare SALN submissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
