/**
 * Delete Confirmation Dialog Component
 *
 * Alert dialog for confirming soft or hard deletion of organizational units.
 * Shows warnings for units with employees or positions.
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganizationDetail, useDeleteOrganization } from '@/hooks/useOrganization';

interface DeleteConfirmDialogProps {
  /**
   * ID of the organization to delete
   */
  organizationId: string | null;

  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Whether hard delete is allowed (admin only)
   */
  allowHardDelete?: boolean;
}

/**
 * Confirmation dialog for deleting organizational units
 */
export function DeleteConfirmDialog({
  organizationId,
  open,
  onOpenChange,
  allowHardDelete = false,
}: DeleteConfirmDialogProps) {
  const [hardDelete, setHardDelete] = useState(false);
  const { data: organization, isLoading } = useOrganizationDetail(organizationId);
  const deleteOrg = useDeleteOrganization();

  const hasEmployees = (organization?.employeeCount || 0) > 0;
  const hasPositions = (organization?.positionCount || 0) > 0;
  const hasDependencies = hasEmployees || hasPositions;

  const handleDelete = async () => {
    if (!organizationId) return;

    try {
      await deleteOrg.mutateAsync({ id: organizationId, hard: hardDelete });
      onOpenChange(false);
      setHardDelete(false);
    } catch (error) {
      // Error handling is done in mutation hook
      console.error('Failed to delete organization:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHardDelete(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading organization details...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  {hardDelete ? (
                    <>
                      Are you sure you want to <strong>permanently delete</strong> this organization? This action cannot be undone.
                    </>
                  ) : (
                    <>
                      Are you sure you want to <strong>deactivate</strong> this organization? It will be hidden from most views but can be reactivated later.
                    </>
                  )}
                </div>

                {organization && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{organization.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Code:</span>
                      <Badge variant="outline" className="font-mono">
                        {organization.code}
                      </Badge>
                    </div>
                  </div>
                )}

                {hasDependencies && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-1">
                        {hasEmployees && (
                          <div>
                            This organization has <strong>{organization?.employeeCount} employee(s)</strong>.
                          </div>
                        )}
                        {hasPositions && (
                          <div>
                            This organization has <strong>{organization?.positionCount} position(s)</strong>.
                          </div>
                        )}
                        <div className="mt-2">
                          {hardDelete ? (
                            <span className="text-destructive-foreground">
                              All related data will be permanently deleted.
                            </span>
                          ) : (
                            <span>
                              These will remain in the system but will need to be reassigned.
                            </span>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {allowHardDelete && (
                  <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="hard-delete" className="text-sm font-medium">
                        Permanent Deletion
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Delete permanently instead of deactivating
                      </p>
                    </div>
                    <Switch
                      id="hard-delete"
                      checked={hardDelete}
                      onCheckedChange={setHardDelete}
                      disabled={deleteOrg.isPending}
                    />
                  </div>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteOrg.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteOrg.isPending || isLoading}
            className={
              hardDelete
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {deleteOrg.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {hardDelete ? 'Delete Permanently' : 'Deactivate'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
