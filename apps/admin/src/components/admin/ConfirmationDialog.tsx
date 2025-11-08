'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ConfirmationDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Text for confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;
  /** Visual variant - danger for destructive actions (default: "default") */
  variant?: 'default' | 'danger';
  /** Alias for variant="danger" - for destructive actions (default: false) */
  destructive?: boolean;
  /** If true, require user to type confirmation keyword (default: false) */
  requireConfirmation?: boolean;
  /** Keyword to type for confirmation (default: "DELETE") */
  confirmationKeyword?: string;
  /** Callback when confirmed */
  onConfirm: () => Promise<void> | void;
  /** Loading state during confirmation */
  isLoading?: boolean;
}

/**
 * ConfirmationDialog Component
 *
 * Generic confirmation dialog for destructive or important actions.
 *
 * Features:
 * - Alert Dialog with danger variant option
 * - Custom title and description
 * - Optional confirmation input (type keyword to confirm)
 * - Cancel and Confirm buttons
 * - Danger styling for destructive actions
 * - Loading state with spinner
 * - Keyboard shortcuts (Esc to cancel, Enter to confirm)
 * - Professional shadcn/ui styling
 * - Dark mode support
 * - Accessible focus management
 *
 * @example
 * ```tsx
 * // Simple confirmation
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Employee Record?"
 *   description="This action cannot be undone. The employee record will be permanently deleted."
 *   variant="danger"
 *   onConfirm={async () => { await deleteEmployee(); }}
 * />
 *
 * // With confirmation keyword
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete All Submissions?"
 *   description="This will permanently delete all submissions. This action cannot be undone."
 *   variant="danger"
 *   requireConfirmation
 *   confirmationKeyword="DELETE ALL"
 *   onConfirm={async () => { await deleteAllSubmissions(); }}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  destructive = false,
  requireConfirmation = false,
  confirmationKeyword = 'DELETE',
  onConfirm,
  isLoading = false,
}: ConfirmationDialogProps) {
  const [confirmationInput, setConfirmationInput] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Determine effective variant (destructive prop takes precedence)
  const effectiveVariant = destructive ? 'danger' : variant;

  // Reset confirmation input when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setConfirmationInput('');
      setIsProcessing(false);
    }
  }, [open]);

  // Check if confirmation input matches keyword
  const isConfirmationValid = !requireConfirmation || confirmationInput === confirmationKeyword;

  // Combine loading states
  const loading = isLoading || isProcessing;

  const handleConfirm = async () => {
    if (!isConfirmationValid || loading) return;

    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is left to parent component
      console.error('Confirmation action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key to confirm
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConfirmationValid && !loading) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={`sm:max-w-[450px] ${
          effectiveVariant === 'danger' ? 'border-destructive/50' : ''
        }`}
      >
        <AlertDialogHeader>
          {effectiveVariant === 'danger' && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}
          <AlertDialogTitle className={effectiveVariant === 'danger' ? 'text-destructive' : ''}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Optional Confirmation Input */}
        {requireConfirmation && (
          <div className="space-y-2 py-4">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Type <span className="font-mono font-semibold">{confirmationKeyword}</span> to
              confirm
            </Label>
            <Input
              id="confirmation-input"
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={confirmationKeyword}
              disabled={loading}
              className={`font-mono ${
                confirmationInput.length > 0 && !isConfirmationValid
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
              autoComplete="off"
              autoFocus
            />
            {confirmationInput.length > 0 && !isConfirmationValid && (
              <p className="text-sm text-destructive">
                Please type exactly: <span className="font-mono font-semibold">{confirmationKeyword}</span>
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || loading}
            className={
              effectiveVariant === 'danger'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive'
                : ''
            }
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
