/**
 * PDS Attachments API Route - Delete
 * DELETE /api/pds/attachments/[attachmentId]
 *
 * Deletes a PDS attachment (both storage object and database record).
 * Validates ownership before deletion.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@tupsafe/auth/server';
import { PDS_ATTACHMENTS_BUCKET } from '@tupsafe/auth/server';
import { db, pdsAttachments } from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ attachmentId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { attachmentId } = await context.params;

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    // Find the attachment and verify ownership
    const [attachment] = await db
      .select()
      .from(pdsAttachments)
      .where(
        and(
          eq(pdsAttachments.id, attachmentId),
          eq(pdsAttachments.userId, userId)
        )
      )
      .limit(1);

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found or access denied' },
        { status: 404 }
      );
    }

    // Use admin client for storage to bypass RLS
    // Authorization is already verified above (user owns the attachment)
    const adminClient = createAdminClient();

    // Delete from Supabase Storage using admin client
    const { error: deleteStorageError } = await adminClient.storage
      .from(PDS_ATTACHMENTS_BUCKET)
      .remove([attachment.filePath]);

    if (deleteStorageError) {
      console.error(
        '[DELETE /api/pds/attachments/[attachmentId]] Storage delete error:',
        deleteStorageError
      );
      // Continue to delete DB record even if storage delete fails
      // (file might already be deleted)
    }

    // Delete from database
    await db
      .delete(pdsAttachments)
      .where(eq(pdsAttachments.id, attachmentId));

    console.log(
      `[DELETE /api/pds/attachments/[attachmentId]] Deleted attachment ${attachmentId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/pds/attachments/[attachmentId]] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete attachment',
      },
      { status: 500 }
    );
  }
}

