/**
 * User Management Page
 *
 * Comprehensive user management interface with:
 * - Real-time statistics
 * - Advanced filtering and search
 * - Paginated data table
 * - User details, edit, and actions
 * - Complete API integration
 */

'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  UserStatsCards,
  DetailedUserStats,
  UserFilters,
  UsersDataTable,
  UserDetailsDialog,
  EditUserDialog,
  ResetPasswordDialog,
  SyncMetadataDialog,
  UsersPagination,
} from '@/components/users';
import { useUsers, useToggleUserStatus, useDeleteUser } from '@/hooks/useUsers';
import type { UserListQuery } from '@tupsafe/types';

export default function UsersPage() {
  const searchParams = useSearchParams();

  // Dialog states
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [syncMetadataUserId, setSyncMetadataUserId] = useState<string | null>(null);

  // Mutations
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();

  // Build query params from URL
  const queryParams = useMemo<Partial<UserListQuery>>(() => {
    const params: Partial<UserListQuery> = {
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    };

    const search = searchParams.get('search');
    if (search) params.search = search;

    const role = searchParams.get('role');
    if (role) params.role = role as any;

    const userType = searchParams.get('userType');
    if (userType) params.userType = userType as any;

    const accountStatus = searchParams.get('accountStatus');
    if (accountStatus) params.accountStatus = accountStatus as any;

    const isActive = searchParams.get('isActive');
    if (isActive) params.isActive = isActive === 'true';

    const departmentId = searchParams.get('departmentId');
    if (departmentId) params.departmentId = departmentId;

    const employmentCategory = searchParams.get('employmentCategory');
    if (employmentCategory) params.employmentCategory = employmentCategory as any;

    const sortBy = searchParams.get('sortBy');
    if (sortBy) params.sortBy = sortBy as any;

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder) params.sortOrder = sortOrder as any;

    return params;
  }, [searchParams]);

  // Fetch users with current filters
  const { data, isLoading, isError, error } = useUsers(queryParams);

  // Handle actions
  const handleViewDetails = (userId: string) => {
    setDetailsUserId(userId);
  };

  const handleEdit = (userId: string) => {
    setEditUserId(userId);
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

  const handleDelete = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUser.mutate(userId);
    }
  };

  const handleCreateUser = () => {
    // TODO: Navigate to create user page or open create dialog
    console.log('Create user functionality not implemented yet');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, permissions, and access control
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Statistics Cards */}
      <UserStatsCards />

      {/* Detailed Statistics (2-column layout) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Filters */}
          <UserFilters
            onFilterChange={() => {
              // Filters update via URL params automatically
            }}
            totalResults={data?.pagination.total}
          />
        </div>
        <div>
          <DetailedUserStats />
        </div>
      </div>

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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} total user(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <UsersPagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDetailsDialog
        userId={detailsUserId}
        open={!!detailsUserId}
        onOpenChange={(open) => !open && setDetailsUserId(null)}
      />

      <EditUserDialog
        userId={editUserId}
        open={!!editUserId}
        onOpenChange={(open) => !open && setEditUserId(null)}
      />

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
    </div>
  );
}
