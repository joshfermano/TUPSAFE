import { memo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  /** Error object or error message string */
  error: Error | string;
  /** Optional retry callback */
  retry?: () => void;
  /** Custom title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the retry button should show loading state */
  isRetrying?: boolean;
}

/**
 * Extracts a user-friendly error message from an Error object or string
 */
function getErrorMessage(error: Error | string): string {
  if (typeof error === 'string') {
    return error;
  }

  // Handle common error patterns
  if (error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (error.message.includes('401') || error.message.includes('unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.message.includes('403') || error.message.includes('forbidden')) {
    return "You don't have permission to access this resource.";
  }

  if (error.message.includes('404') || error.message.includes('not found')) {
    return 'The requested resource was not found.';
  }

  if (error.message.includes('500') || error.message.includes('server')) {
    return 'A server error occurred. Please try again later.';
  }

  return error.message || 'An unexpected error occurred.';
}

/**
 * ErrorAlert Component
 *
 * Professional error display with optional retry functionality.
 * Provides user-friendly error messages and recovery options.
 *
 * @example
 * ```tsx
 * <ErrorAlert
 *   error={error}
 *   retry={() => refetch()}
 *   isRetrying={isRefetching}
 * />
 * ```
 */
export const ErrorAlert = memo(function ErrorAlert({
  error,
  retry,
  title = 'Error',
  className,
  isRetrying = false,
}: ErrorAlertProps) {
  const errorMessage = getErrorMessage(error);

  return (
    <Alert
      variant="destructive"
      className={cn('border-destructive/50', className)}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{errorMessage}</p>

        {retry && (
          <Button
            onClick={retry}
            disabled={isRetrying}
            variant="outline"
            size="sm"
            className="bg-background hover:bg-background/80"
          >
            <RefreshCw
              className={cn(
                'mr-2 h-3 w-3',
                isRetrying && 'animate-spin',
              )}
            />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
});

ErrorAlert.displayName = 'ErrorAlert';
