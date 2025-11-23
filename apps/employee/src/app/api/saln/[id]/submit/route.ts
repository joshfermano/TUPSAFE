import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { submitSALNForApproval } from '@tupsafe/database/server';

/**
 * POST /api/saln/[id]/submit
 * Submit SALN for approval
 * Changes status from 'draft' or 'rejected' to 'submitted'
 * Returns: Success status
 */
export async function POST(
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
      .select('user_type, employee_id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'employee') {
      return NextResponse.json(
        { error: 'Only employees can submit SALN submissions' },
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

    // Submit SALN for approval
    const submittedSaln = await submitSALNForApproval(id, user.id);

    return NextResponse.json({
      success: true,
      data: submittedSaln,
      message: `SALN for year ${submittedSaln.year} submitted successfully for approval`,
      submittedAt: submittedSaln.submittedAt,
    });
  } catch (error) {
    console.error('Error submitting SALN:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'SALN submission not found' },
          { status: 404 }
        );
      }
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Only draft')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to submit SALN',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
