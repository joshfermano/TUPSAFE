/**
 * Sync Metadata Dialog
 *
 * Confirmation dialog for syncing user authentication metadata with database profile.
 * Useful for fixing users stuck on pending-approval when database shows active.
 *
 * Features:
 * - Clear explanation of what will be synced
 * - Shows current database status
 * - Confirmation required
 * - Loading state
 */

'use client';

import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useSyncMetadata, useUserDetails } from '@/hooks/useUsers';

interface SyncMetadataDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncMetadataDialog({ userId, open, onOpenChange }: SyncMetadataDialogProps) {
  const { data: user } = useUserDetails(userId);
  const syncMetadata = useSyncMetadata();

  const handleConfirm = async () => {
    if (!userId) return;

    syncMetadata.mutate(userId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Authentication Metadata
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user && (
              <>
                Sync authentication data for <strong>{user.firstName} {user.lastName}</strong>?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Current Database Status */}
          {user && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Database Status</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Account Status:</span>
                  <div className="mt-1">
                    <Badge variant={user.accountStatus === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {user.accountStatus}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">User Type:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {user.userType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Active Status:</span>
                  <div className="mt-1">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                {user.employeeId && (
                  <div>
                    <span className="text-muted-foreground">Employee ID:</span>
                    <div className="mt-1 font-mono text-xs">
                      {user.employeeId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium">What this action does:</p>
              <ul className="list-disc list-inside mt-1 text-blue-800 dark:text-blue-200 space-y-1">
                <li>Updates Supabase authentication metadata</li>
                <li>Syncs account status, user type, and active status</li>
                <li>Fixes users stuck on pending-approval page</li>
                <li>Does not modify database records</li>
              </ul>
            </div>
          </div>

          {/* Use Case */}
          <div className="text-sm text-muted-foreground rounded-lg bg-muted p-3">
            <p className="font-medium mb-1">When to use this:</p>
            <p>
              Use this action when a user is approved in the database but still stuck on the
              pending-approval page. This syncs their authentication metadata to match the database.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={syncMetadata.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={syncMetadata.isPending}>
            {syncMetadata.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Metadata
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
