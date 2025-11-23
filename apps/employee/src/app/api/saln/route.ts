import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  getSALNSubmissions,
  createSALNSubmission,
  type CreateSalnInput,
} from '@tupsafe/database/server';

/**
 * GET /api/saln
 * List all SALN submissions for current user
 * Query params: year, status, page, limit
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
        { error: 'Only employees can access SALN submissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : undefined;
    const status = searchParams.get('status') as
      | 'draft'
      | 'submitted'
      | 'reviewing'
      | 'approved'
      | 'rejected'
      | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate year if provided
    if (year !== undefined && (year < 1900 || year > new Date().getFullYear() + 1)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    // Fetch SALN submissions
    const submissions = await getSALNSubmissions(user.id, {
      year,
      status,
      page,
      pageSize: limit,
    });

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total: submissions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching SALN submissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch SALN submissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saln
 * Create new SALN submission
 * Body: SALN data for all sections
 * Validates year uniqueness per user
 */
export async function POST(request: NextRequest) {
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
        { error: 'Only employees can create SALN submissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.year) {
      return NextResponse.json(
        { error: 'Year is required' },
        { status: 400 }
      );
    }

    if (!body.filingType || !['joint', 'separate', 'not_applicable'].includes(body.filingType)) {
      return NextResponse.json(
        { error: 'Valid filing type is required (joint, separate, or not_applicable)' },
        { status: 400 }
      );
    }

    // Validate year
    const year = parseInt(body.year);
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      return NextResponse.json(
        { error: `Year must be between 1900 and ${currentYear + 1}` },
        { status: 400 }
      );
    }

    // Validate financial values if provided
    const validateFinancialValue = (value: any, fieldName: string) => {
      if (value === undefined || value === null) return;

      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) {
        throw new Error(`${fieldName} must be a valid number`);
      }
      if (num < 0) {
        throw new Error(`${fieldName} cannot be negative`);
      }
    };

    try {
      // Validate real properties
      if (body.realProperties && Array.isArray(body.realProperties)) {
        body.realProperties.forEach((prop: any, index: number) => {
          validateFinancialValue(prop.assessedValue, `Real property ${index + 1} assessed value`);
          validateFinancialValue(prop.currentFairMarketValue, `Real property ${index + 1} market value`);
          validateFinancialValue(prop.acquisitionCost, `Real property ${index + 1} acquisition cost`);
        });
      }

      // Validate personal properties
      if (body.personalProperties && Array.isArray(body.personalProperties)) {
        body.personalProperties.forEach((prop: any, index: number) => {
          validateFinancialValue(prop.acquisitionCost, `Personal property ${index + 1} acquisition cost`);
        });
      }

      // Validate liabilities
      if (body.liabilities && Array.isArray(body.liabilities)) {
        body.liabilities.forEach((liability: any, index: number) => {
          validateFinancialValue(liability.outstandingBalance, `Liability ${index + 1} outstanding balance`);
        });
      }
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : 'Validation error' },
        { status: 400 }
      );
    }

    // Prepare SALN input
    const salnInput: CreateSalnInput = {
      year,
      filingType: body.filingType,
      realProperties: body.realProperties || [],
      personalProperties: body.personalProperties || [],
      liabilities: body.liabilities || [],
      businessInterests: body.businessInterests || [],
      relativesInGov: body.relativesInGov || [],
    };

    // Create SALN submission
    const newSaln = await createSALNSubmission(user.id, salnInput);

    return NextResponse.json(
      {
        success: true,
        data: newSaln,
        message: `SALN for year ${year} created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating SALN submission:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create SALN submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
