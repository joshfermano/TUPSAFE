/**
 * AI Chat API Route
 *
 * Non-streaming chat endpoint. Proxies requests to the Python AI service
 * and returns the complete response.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  checkUserRoleFromSupabase,
} from '@tupsafe/auth/server';

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const sessionUser = await getUserFromSupabase('admin');

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Verify user has appropriate role
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

    // 3. Parse request body
    const body = await request.json();
    const { message, sessionId, model, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 4. Forward request to Python AI service
    const response = await fetch(`${AI_AGENT_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionUser.id}`,
      },
      body: JSON.stringify({
        message,
        sessionId: sessionId || `admin-${sessionUser.id}`,
        model: model || 'openrouter',
        history: history || [],
        context: {
          userId: sessionUser.id,
          userEmail: sessionUser.email,
          userRole: sessionUser.role,
          portal: 'admin',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', errorText);
      return NextResponse.json(
        {
          error: 'AI service error',
          details: errorText,
        },
        { status: response.status }
      );
    }

    // 5. Return response
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
