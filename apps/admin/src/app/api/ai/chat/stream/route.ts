/**
 * AI Chat Stream API Route
 *
 * Proxies streaming SSE requests to the Python AI service.
 * Handles authentication and forwards streaming responses back to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  checkUserRoleFromSupabase,
  createServerClient,
} from '@tupsafe/auth/server';

export const dynamic = 'force-dynamic';

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('[AI Chat] POST request received');

  try {
    // 1. Get Supabase client and session with JWT access token
    console.log('[AI Chat] Getting Supabase session...');
    const supabase = await createServerClient('admin');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('[AI Chat] Session result:', { hasSession: !!session, error: sessionError?.message });

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Get user profile information
    const sessionUser = await getUserFromSupabase('admin');

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 401 }
      );
    }

    // 3. Verify user has appropriate role
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const { message, sessionId, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 5. Forward request to Python AI service with actual JWT access token
    console.log('[AI Chat] Forwarding to Python:', AI_AGENT_URL);
    console.log('[AI Chat] Token length:', session.access_token?.length || 0);

    const response = await fetch(`${AI_AGENT_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message,
        sessionId: sessionId || `admin-${sessionUser.id}`,
        history: history || [],
        context: {
          userId: sessionUser.id,
          userEmail: sessionUser.email,
          userRole: sessionUser.role,
          portal: 'admin',
        },
      }),
    });

    console.log('[AI Chat] Python response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Chat] AI service error:', errorText);
      return NextResponse.json(
        {
          error: 'AI service error',
          details: errorText,
        },
        { status: response.status }
      );
    }

    console.log('[AI Chat] Starting stream...');

    // 6. Stream response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // Forward the chunk as-is
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[AI Chat] Chat stream error:', error);
    console.error('[AI Chat] Error type:', error?.constructor?.name);
    console.error('[AI Chat] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
