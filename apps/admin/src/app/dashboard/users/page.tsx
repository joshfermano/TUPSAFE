/**
 * User Management Page
 *
 * Comprehensive user management interface with:
 * - Compact statistics row
 * - Integrated search and filters
 * - Data table with actions
 * - Dialogs for user operations
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, AlertCircle, Users, UserCheck, UserX, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  UserFilters,
  UsersDataTable,
  ResetPasswordDialog,
  SyncMetadataDialog,
} from '@/components/users';
import { useUsers, useUserStats, useToggleUserStatus, useDeleteUser, type DeleteUserError } from '@/hooks/useUsers';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import type { UserListQuery } from '@tupsafe/types';
import Link from 'next/link';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pagination
  const pagination = usePagination();

  // Dialog states
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [syncMetadataUserId, setSyncMetadataUserId] = useState<string | null>(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [deleteDependencies, setDeleteDependencies] = useState<{
    pdsSubmissions: number;
    salnSubmissions: number;
    jobApplications: number;
    hasComplianceRecords: boolean;
  } | null>(null);

  // Mutations
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();

  // Fetch stats
  const { data: stats } = useUserStats();

  // Build query params from URL
  const queryParams = useMemo<Partial<UserListQuery>>(() => {
    const params: Partial<UserListQuery> = {
      page: pagination.page,
      limit: pagination.pageSize,
    };

    const search = searchParams.get('search');
    if (search) params.search = search;

    const role = searchParams.get('role');
    if (role) params.role = role as 'employee' | 'hr' | 'admin' | 'co_admin' | 'supervisor' | 'auditor';

    const userType = searchParams.get('userType');
    if (userType) params.userType = userType as 'employee' | 'applicant';

    const accountStatus = searchParams.get('accountStatus');
    if (accountStatus) params.accountStatus = accountStatus as 'pending' | 'active' | 'suspended' | 'rejected';

    const isActive = searchParams.get('isActive');
    if (isActive) params.isActive = isActive === 'true';

    const departmentId = searchParams.get('departmentId');
    if (departmentId) params.departmentId = departmentId;

    const employmentCategory = searchParams.get('employmentCategory');
    if (employmentCategory) params.employmentCategory = employmentCategory as 'faculty' | 'administrative' | 'contractual' | 'not_applicable';

    const sortBy = searchParams.get('sortBy');
    if (sortBy) params.sortBy = sortBy as 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'role';

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder) params.sortOrder = sortOrder as 'asc' | 'desc';

    return params;
  }, [searchParams, pagination.page, pagination.pageSize]);

  // Fetch users with current filters
  const { data, isLoading, isError, error } = useUsers(queryParams);

  // Handle actions
  const handleViewDetails = (userId: string) => {
    router.push(`/dashboard/users/view/${userId}`);
  };

  const handleEdit = (userId: string) => {
    router.push(`/dashboard/users/edit/${userId}`);
  };

  const handleToggleStatus = (userId: string, isActive: boolean) => {
    toggleStatus.mutate({ userId, isActive });
  };

  const handleResetPassword = (userId: string) => {
    setResetPasswordUserId(userId);
  };

  const handleSyncMetadata = (userId: string) => {
    setSyncMetadataUserId(userId);
  };

  const handleDelete = useCallback((userId: string) => {
    setPendingDeleteUserId(userId);
    setDeleteDependencies(null);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async (forceDelete: boolean = false) => {
    if (!pendingDeleteUserId) return;
    
    try {
      await deleteUser.mutateAsync({ userId: pendingDeleteUserId, forceDelete });
      setDeleteDialogOpen(false);
      setPendingDeleteUserId(null);
      setDeleteDependencies(null);
    } catch (error) {
      const deleteError = error as DeleteUserError & { hasComplianceRecords?: boolean };
      // If can be force deleted, show the force delete option with dependencies
      if (deleteError.canForceDelete && deleteError.dependencies) {
        setDeleteDependencies({
          pdsSubmissions: deleteError.dependencies.pdsSubmissions || 0,
          salnSubmissions: deleteError.dependencies.salnSubmissions || 0,
          jobApplications: deleteError.dependencies.jobApplications || 0,
          hasComplianceRecords: deleteError.hasComplianceRecords || 
            (deleteError.dependencies.pdsSubmissions || 0) > 0 || 
            (deleteError.dependencies.salnSubmissions || 0) > 0,
        });
        // Keep dialog open to show force delete option
      } else {
        // Other errors close the dialog (toast is shown by the hook)
        setDeleteDialogOpen(false);
        setPendingDeleteUserId(null);
        setDeleteDependencies(null);
      }
    }
  }, [pendingDeleteUserId, deleteUser]);

  return (
    <div className="space-y-4">
      {/* Compact Header with Stats */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, permissions, and access control
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/users/create">
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </Link>
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="rounded-md bg-green-100 p-2 dark:bg-green-900/30">
            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats?.activeUsers || 0}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="rounded-md bg-yellow-100 p-2 dark:bg-yellow-900/30">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats?.pendingApprovals || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="rounded-md bg-red-100 p-2 dark:bg-red-900/30">
            <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats?.suspendedUsers || 0}</p>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </div>
        </div>
      </div>

      {/* Detailed Stats (Collapsible) */}
      {stats && (
        <Collapsible open={showDetailedStats} onOpenChange={setShowDetailedStats}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="text-xs">
                {showDetailedStats ? 'Hide' : 'Show'} detailed breakdown
              </span>
              {showDetailedStats ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* By User Type */}
              <Card className="border-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">By User Type</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats.byUserType.employees}</Badge>
                    <span className="text-xs text-muted-foreground">Employees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats.byUserType.applicants}</Badge>
                    <span className="text-xs text-muted-foreground">Applicants</span>
                  </div>
                </CardContent>
              </Card>

              {/* By Role */}
              <Card className="border-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">By Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byRole).map(([role, count]) => (
                      <div key={role} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {String(count)}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{role}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Registrations */}
              <Card className="border-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Registrations</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <div>
                    <p className="text-lg font-bold">{stats.recentRegistrations.last7Days}</p>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stats.recentRegistrations.last30Days}</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Users</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to load users. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content: Filters + Table */}
      <Card className="border-muted/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {data?.pagination.total || 0} total user(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Integrated Filters */}
          <UserFilters
            onFilterChange={() => {
              // Filters update via URL params automatically
            }}
            totalResults={data?.pagination.total}
          />

          {/* Data Table */}
          <UsersDataTable
            data={data?.users || []}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            onSyncMetadata={handleSyncMetadata}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <DataTablePagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              itemName="users"
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ResetPasswordDialog
        userId={resetPasswordUserId}
        open={!!resetPasswordUserId}
        onOpenChange={(open) => !open && setResetPasswordUserId(null)}
      />

      <SyncMetadataDialog
        userId={syncMetadataUserId}
        open={!!syncMetadataUserId}
        onOpenChange={(open) => !open && setSyncMetadataUserId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteDependencies ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  User Has Associated Data
                </>
              ) : (
                'Delete User Account'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {deleteDependencies ? (
                  <>
                    <p>This user has the following data that would be permanently deleted:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {deleteDependencies.pdsSubmissions > 0 && (
                        <li><strong>{deleteDependencies.pdsSubmissions}</strong> PDS submission(s)</li>
                      )}
                      {deleteDependencies.salnSubmissions > 0 && (
                        <li><strong>{deleteDependencies.salnSubmissions}</strong> SALN submission(s)</li>
                      )}
                      {deleteDependencies.jobApplications > 0 && (
                        <li><strong>{deleteDependencies.jobApplications}</strong> job application(s)</li>
                      )}
                    </ul>
                    {deleteDependencies.hasComplianceRecords && (
                      <Alert variant="destructive" className="text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>⚠️ Compliance Records Warning</AlertTitle>
                        <AlertDescription>
                          This includes PDS/SALN compliance records. These are official government documents 
                          and deleting them may have legal implications. Only proceed if you are certain 
                          this data should be permanently removed.
                        </AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone. All associated data will be permanently deleted.
                    </p>
                  </>
                ) : (
                  <p>
                    Are you sure you want to delete this user? This action cannot be undone. 
                    The user account will be permanently removed from the system.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setPendingDeleteUserId(null);
                setDeleteDependencies(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            {deleteDependencies ? (
              <AlertDialogAction
                onClick={() => handleConfirmDelete(true)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deleting...' : 'Force Delete All Data'}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={() => handleConfirmDelete(false)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
