import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { archiveSALNSubmission } from '@tupsafe/database/server';

/**
 * POST /api/saln/[id]/archive
 * Archive a SALN (approved ones only)
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
      .select('user_type, employee_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'employee') {
      return NextResponse.json(
        { error: 'Only employees can archive SALN submissions' },
        { status: 403 }
      );
    }

    // Check if user has permission to archive (HR or admin role)
    const canArchive = ['hr', 'admin'].includes(profile.role);
    if (!canArchive) {
      return NextResponse.json(
        {
          error:
            'Only HR or admin users can archive SALN submissions. Regular employees cannot archive their own SALNs.',
        },
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

    // Get the SALN to be archived (need to check ownership differently for HR/admin)
    const { data: salnToArchive } = await supabase
      .from('saln_submissions')
      .select('id, user_id, year, status')
      .eq('id', id)
      .single();

    if (!salnToArchive) {
      return NextResponse.json(
        { error: 'SALN submission not found' },
        { status: 404 }
      );
    }

    // Archive SALN submission
    const archive = await archiveSALNSubmission(
      id,
      salnToArchive.user_id,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: archive,
      message: `SALN for year ${salnToArchive.year} archived successfully`,
      archivedAt: archive.archivedAt,
    });
  } catch (error) {
    console.error('Error archiving SALN:', error);

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
        error.message.includes('Only approved')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to archive SALN',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
