import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
/**
 * Health check endpoint for Docker container health monitoring
 * Returns 200 OK if the application is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'admin-portal',
    },
    { status: 200 }
  );
}
