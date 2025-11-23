import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  getSALNSubmissionById,
  updateSALNSubmission,
  type UpdateSalnInput,
} from '@tupsafe/database/server';

/**
 * GET /api/saln/[id]
 * Get complete SALN with all sections
 * Returns: Full SALN with assets, liabilities, business interests, relatives
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid SALN ID format' },
        { status: 400 }
      );
    }

    // Fetch SALN submission with all sections
    const saln = await getSALNSubmissionById(id, user.id);

    if (!saln) {
      return NextResponse.json(
        { error: 'SALN submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: saln,
    });
  } catch (error) {
    console.error('Error fetching SALN submission:', error);

    // Handle ownership error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch SALN submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/saln/[id]
 * Update existing SALN (draft/rejected only)
 * Body: Partial SALN data
 * Auto-recalculates totals
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'Only employees can update SALN submissions' },
        { status: 403 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid SALN ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate filing type if provided
    if (
      body.filingType &&
      !['joint', 'separate', 'not_applicable'].includes(body.filingType)
    ) {
      return NextResponse.json(
        {
          error:
            'Valid filing type is required (joint, separate, or not_applicable)',
        },
        { status: 400 }
      );
    }

    // Validate year if provided
    if (body.year !== undefined) {
      const year = parseInt(body.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        return NextResponse.json(
          { error: `Year must be between 1900 and ${currentYear + 1}` },
          { status: 400 }
        );
      }
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
          validateFinancialValue(
            prop.assessedValue,
            `Real property ${index + 1} assessed value`
          );
          validateFinancialValue(
            prop.currentFairMarketValue,
            `Real property ${index + 1} market value`
          );
          validateFinancialValue(
            prop.acquisitionCost,
            `Real property ${index + 1} acquisition cost`
          );
        });
      }

      // Validate personal properties
      if (body.personalProperties && Array.isArray(body.personalProperties)) {
        body.personalProperties.forEach((prop: any, index: number) => {
          validateFinancialValue(
            prop.acquisitionCost,
            `Personal property ${index + 1} acquisition cost`
          );
        });
      }

      // Validate liabilities
      if (body.liabilities && Array.isArray(body.liabilities)) {
        body.liabilities.forEach((liability: any, index: number) => {
          validateFinancialValue(
            liability.outstandingBalance,
            `Liability ${index + 1} outstanding balance`
          );
        });
      }
    } catch (validationError) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : 'Validation error',
        },
        { status: 400 }
      );
    }

    // Prepare update input
    const updateInput: UpdateSalnInput = {
      ...(body.year !== undefined && { year: parseInt(body.year) }),
      ...(body.filingType && { filingType: body.filingType }),
      ...(body.realProperties !== undefined && {
        realProperties: body.realProperties,
      }),
      ...(body.personalProperties !== undefined && {
        personalProperties: body.personalProperties,
      }),
      ...(body.liabilities !== undefined && { liabilities: body.liabilities }),
      ...(body.businessInterests !== undefined && {
        businessInterests: body.businessInterests,
      }),
      ...(body.relativesInGov !== undefined && {
        relativesInGov: body.relativesInGov,
      }),
    };

    // Update SALN submission
    const updatedSaln = await updateSALNSubmission(
      id,
      user.id,
      updateInput
    );

    return NextResponse.json({
      success: true,
      data: updatedSaln,
      message: 'SALN updated successfully',
      totals: {
        totalAssets: updatedSaln.totalAssets,
        totalLiabilities: updatedSaln.totalLiabilities,
        netWorth: updatedSaln.netWorth,
      },
    });
  } catch (error) {
    console.error('Error updating SALN submission:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Cannot update')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update SALN submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
