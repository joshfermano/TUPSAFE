'use client';

/**
 * Route-segment error boundary for /dashboard/*.
 *
 * Next.js 15 App Router renders this component in place of the route when any
 * client component below it throws during render. Without this boundary, an
 * unhandled exception (e.g. the historical `null.toLocaleString()` crash that
 * happened when the dashboard API 504'd) shows the framework's generic
 * "Application error: a client-side exception has occurred" screen with no
 * recovery affordance. This component renders a friendly retry UI instead.
 */

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Surface to server logs; in production this also reaches the log drain
    // so on-call can see exactly which digest crashed for a given user.
    console.error('[Dashboard] Rendering error boundary:', {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the TUPSAFE Admin Portal</p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong loading the dashboard</AlertTitle>
        <AlertDescription>
          <p className="mt-1">
            {error?.message?.includes('504') || error?.message?.includes('timeout')
              ? 'The dashboard API took too long to respond. This usually clears up within a minute — please retry.'
              : 'We hit an unexpected error while rendering this page. Retrying will usually resolve it.'}
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs opacity-70">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => reset()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.location.href = '/dashboard';
              }}>
              Reload page
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
