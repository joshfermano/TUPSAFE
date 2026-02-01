/**
 * Delete Confirmation Dialog Component
 *
 * Alert dialog for confirming soft or hard deletion of organizational units.
 * Shows warnings for units with employees or positions, with detailed dependency information.
 * Supports reassignment workflow for units with dependencies.
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, ChevronDown, ChevronUp, Users, Briefcase, Building2, RefreshCw } from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useOrganizationDetail, useDeleteOrganization, useDepartmentDependencies, useReactivateOrganization } from '@/hooks/useOrganization';

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

  /**
   * Callback when user clicks reassign & delete
   * Used to open the reassignment dialog
   */
  onReassignClick?: (orgId: string) => void;
}

/**
 * Confirmation dialog for deleting organizational units
 */
export function DeleteConfirmDialog({
  organizationId,
  open,
  onOpenChange,
  allowHardDelete = false,
  onReassignClick,
}: DeleteConfirmDialogProps) {
  const [hardDelete, setHardDelete] = useState(true);
  const [employeesOpen, setEmployeesOpen] = useState(true);
  const [positionsOpen, setPositionsOpen] = useState(true);
  const [childDepartmentsOpen, setChildDepartmentsOpen] = useState(true);

  const { data: organization, isLoading } = useOrganizationDetail(organizationId);
  const { data: dependencies, isLoading: isDependenciesLoading } = useDepartmentDependencies(organizationId);
  const deleteOrg = useDeleteOrganization();
  const reactivateOrg = useReactivateOrganization();

  // Detect if organization is already inactive
  const isAlreadyInactive = organization?.isActive === false;

  const hasEmployees = (dependencies?.employees.length || 0) > 0;
  const hasPositions = (dependencies?.positions.length || 0) > 0;
  const hasChildDepartments = (dependencies?.childDepartments.length || 0) > 0;
  const hasDependencies = hasEmployees || hasPositions || hasChildDepartments;
  const canSoftDelete = dependencies?.canSoftDelete ?? true;

  const handleDelete = async () => {
    if (!organizationId) return;

    try {
      await deleteOrg.mutateAsync({ id: organizationId, hard: hardDelete });
      onOpenChange(false);
      setHardDelete(true);
    } catch (error) {
      // Error handling is done in mutation hook
      console.error('Failed to delete organization:', error);
    }
  };

  const handleReassign = () => {
    if (!organizationId || !onReassignClick) return;
    onReassignClick(organizationId);
    onOpenChange(false);
  };

  const handleReactivate = async () => {
    if (!organizationId) return;
    try {
      await reactivateOrg.mutateAsync(organizationId);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to reactivate organization:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHardDelete(true);
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
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground text-sm">
              {isLoading || isDependenciesLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading organization details...
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    {isAlreadyInactive ? (
                      <>
                        This organization is already <strong>inactive</strong>.
                        Would you like to reactivate it to make it available again?
                      </>
                    ) : hardDelete ? (
                      <>
                        Are you sure you want to <strong>permanently delete</strong> this organization?
                        This action cannot be undone and will remove all data from the database.
                      </>
                    ) : (
                      <>
                        Are you sure you want to <strong>deactivate</strong> this organization?
                        It will be hidden from most views but can be reactivated later.
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

                  {/* Show blocking reasons if can't soft delete */}
                  {!canSoftDelete && dependencies?.blockingReasons && dependencies.blockingReasons.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Cannot Delete</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-1">
                          {dependencies.blockingReasons.map((reason, idx) => (
                            <div key={idx}>• {reason}</div>
                          ))}
                          <div className="mt-2">
                            Please reassign employees and positions to another department before deleting.
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Show dependency details */}
                  {hasDependencies && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Dependencies</div>

                      {/* Employees Section */}
                      {hasEmployees && (
                        <Collapsible open={employeesOpen} onOpenChange={setEmployeesOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex w-full justify-between p-2 h-auto hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">Employees</span>
                                <Badge variant="secondary" className="ml-1">
                                  {dependencies?.employees.length}
                                </Badge>
                              </div>
                              {employeesOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <div className="rounded-md border bg-muted/30 divide-y max-h-40 overflow-y-auto">
                              {dependencies?.employees.map((employee) => (
                                <div key={employee.id} className="px-3 py-2 text-sm">
                                  <div className="font-medium">{employee.fullName}</div>
                                  {employee.positionTitle && (
                                    <div className="text-xs text-muted-foreground">
                                      {employee.positionTitle}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Positions Section */}
                      {hasPositions && (
                        <Collapsible open={positionsOpen} onOpenChange={setPositionsOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex w-full justify-between p-2 h-auto hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium">Positions</span>
                                <Badge variant="secondary" className="ml-1">
                                  {dependencies?.positions.length}
                                </Badge>
                              </div>
                              {positionsOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <div className="rounded-md border bg-muted/30 divide-y max-h-40 overflow-y-auto">
                              {dependencies?.positions.map((position) => (
                                <div key={position.id} className="px-3 py-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{position.title}</div>
                                    <div className="flex items-center gap-2">
                                      {position.gradeLevel && (
                                        <Badge variant="outline" className="text-xs">
                                          SG-{position.gradeLevel}
                                        </Badge>
                                      )}
                                      <Badge variant={position.isActive ? "default" : "secondary"} className="text-xs">
                                        {position.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Child Departments Section */}
                      {hasChildDepartments && (
                        <Collapsible open={childDepartmentsOpen} onOpenChange={setChildDepartmentsOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex w-full justify-between p-2 h-auto hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Child Departments</span>
                                <Badge variant="secondary" className="ml-1">
                                  {dependencies?.childDepartments.length}
                                </Badge>
                              </div>
                              {childDepartmentsOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <div className="rounded-md border bg-muted/30 divide-y max-h-40 overflow-y-auto">
                              {dependencies?.childDepartments.map((dept) => (
                                <div key={dept.id} className="px-3 py-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{dept.name}</div>
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {dept.code}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}

                  {allowHardDelete && (
                    <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="hard-delete" className="text-sm font-medium">
                          Deactivate Instead
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mark as inactive instead of permanently deleting (can be reactivated)
                        </p>
                      </div>
                      <Switch
                        id="hard-delete"
                        checked={!hardDelete}
                        onCheckedChange={(checked) => setHardDelete(!checked)}
                        disabled={deleteOrg.isPending}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteOrg.isPending || reactivateOrg.isPending}>
            Cancel
          </AlertDialogCancel>

          {isAlreadyInactive ? (
            <Button
              onClick={handleReactivate}
              disabled={reactivateOrg.isPending || isLoading || isDependenciesLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {reactivateOrg.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reactivate Organization
                </>
              )}
            </Button>
          ) : !canSoftDelete && onReassignClick ? (
            <Button
              onClick={handleReassign}
              disabled={deleteOrg.isPending || isLoading || isDependenciesLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="mr-2 h-4 w-4" />
              Reassign & Delete
            </Button>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteOrg.isPending || isLoading || isDependenciesLoading}
              variant={hardDelete ? 'destructive' : undefined}
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
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
