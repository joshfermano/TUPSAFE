/**
 * Reset Password Dialog
 *
 * Alert dialog for password reset with:
 * - Confirmation prompt
 * - Generated temporary password display
 * - Copy to clipboard functionality
 * - Email notification option
 */

'use client';

import { useState } from 'react';
import { Copy, Check, Mail, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useResetPassword, useUserDetails } from '@/hooks/useUsers';
import { toast } from 'sonner';

interface ResetPasswordDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ userId, open, onOpenChange }: ResetPasswordDialogProps) {
  const { data: user } = useUserDetails(userId);
  const resetPassword = useResetPassword();
  const [sendEmail, setSendEmail] = useState(true);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConfirm = async () => {
    if (!userId) return;

    resetPassword.mutate(
      { userId, data: { sendEmail } },
      {
        onSuccess: (response) => {
          setTempPassword(response.temporaryPassword);
          if (!sendEmail) {
            // If not sending email, keep dialog open to show password
            return;
          }
          onOpenChange(false);
        },
      }
    );
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;

    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error('Failed to copy password');
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setCopied(false);
    setSendEmail(true);
    onOpenChange(false);
  };

  // If password has been generated and email is not being sent, show the password
  if (tempPassword && !sendEmail) {
    return (
      <AlertDialog open={open} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Temporary Password Generated</AlertDialogTitle>
            <AlertDialogDescription>
              Please share this temporary password with the user securely.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <Label className="text-sm font-medium">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm">
                  {tempPassword}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Important Security Notice</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  The user must change this password upon first login. Store it securely and
                  delete after sharing.
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password</AlertDialogTitle>
          <AlertDialogDescription>
            {user && (
              <>
                Reset password for <strong>{user.firstName} {user.lastName}</strong>?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">This action will:</p>
              <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                <li>Generate a new temporary password</li>
                <li>Invalidate the current password</li>
                <li>Require password change on next login</li>
                {sendEmail && <li>Send an email notification to the user</li>}
              </ul>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label
              htmlFor="send-email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send email notification to user
              </div>
            </Label>
          </div>

          {!sendEmail && (
            <div className="text-sm text-muted-foreground rounded-lg bg-muted p-3">
              The temporary password will be displayed after confirmation. You must share it
              with the user manually.
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetPassword.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={resetPassword.isPending}>
            {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
