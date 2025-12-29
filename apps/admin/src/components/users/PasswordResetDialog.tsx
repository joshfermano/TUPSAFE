/**
 * Password Reset Dialog
 *
 * Dialog component for resetting user passwords with copy-to-clipboard functionality
 * and optional email notification.
 */

'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Key, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResetPassword } from '@/hooks/useUsers';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail?: string;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
}: PasswordResetDialogProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetPassword = useResetPassword();

  const handleReset = useCallback(async () => {
    try {
      const result = await resetPassword.mutateAsync({
        userId,
        data: { sendEmail },
      });

      if (result.temporaryPassword) {
        setGeneratedPassword(result.temporaryPassword);
      } else {
        // If email was sent, no password returned
        toast.success('Password reset email sent', {
          description: `A password reset link has been sent to ${userEmail || 'the user\'s email'}.`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      // Error is handled by the hook
      console.error('Password reset failed:', error);
    }
  }, [userId, sendEmail, resetPassword, userEmail, onOpenChange]);

  const handleCopyPassword = useCallback(async () => {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy password');
    }
  }, [generatedPassword]);

  const handleClose = useCallback(() => {
    setGeneratedPassword(null);
    setCopied(false);
    setSendEmail(true);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Reset password for <span className="font-semibold">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        {!generatedPassword ? (
          // Reset options form
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                This will generate a new temporary password for the user. They will be required to change it on their next login.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="send-email" className="text-base">
                  Send email notification
                </Label>
                <p className="text-sm text-muted-foreground">
                  {userEmail
                    ? `Send reset link to ${userEmail}`
                    : 'Send password reset email to user'}
                </p>
              </div>
              <Switch
                id="send-email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
            </div>

            {!sendEmail && (
              <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  The temporary password will be displayed here. Make sure to copy it before closing this dialog.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          // Password display
          <div className="space-y-4 py-4">
            <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Password reset successfully! Copy the temporary password below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="temp-password">Temporary Password</Label>
              <div className="flex gap-2">
                <Input
                  id="temp-password"
                  value={generatedPassword}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this password securely with the user. They will be required to change it on first login.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!generatedPassword ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                disabled={resetPassword.isPending}
                className="gap-2"
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
