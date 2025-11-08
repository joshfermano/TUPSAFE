'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserCheck,
  UserX,
} from 'lucide-react';

import {
  useUsersQuery,
  type UsersFilters,
  type UserWithDetails,
} from '@/hooks/useUsersQuery';
import {
  EmptyState,
  ErrorAlert,
  StatusBadge,
  UserAvatar,
} from '@/components/admin';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Available roles for filtering
const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR Personnel' },
  { value: 'dean', label: 'Dean' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'staff', label: 'Staff' },
];

// Available departments for filtering
const DEPARTMENTS = [
  { value: 'all', label: 'All Departments' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'science', label: 'Science' },
  { value: 'liberal_arts', label: 'Liberal Arts' },
  { value: 'industrial_technology', label: 'Industrial Technology' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'administration', label: 'Administration' },
];

// User Row Component (memoized)
const UserRow = memo(({ user }: { user: UserWithDetails }) => {
  const handleAction = useCallback((action: string) => {
    console.log(`Action: ${action} for user:`, user.profile.id);
    // TODO: Implement actions
  }, [user.profile.id]);

  const fullName = `${user.profile.firstName} ${user.profile.lastName}`;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <UserAvatar
            user={{
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              avatarUrl: null,
            }}
            size="sm"
          />
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-sm text-muted-foreground">{user.profile.employeeId}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {user.profile.role.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {user.department?.name || 'N/A'}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {user.position?.title || 'N/A'}
      </TableCell>
      <TableCell>
        <StatusBadge
          status={user.profile.isActive ? 'active' : 'inactive'}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction('view')}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('edit')}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.profile.isActive ? (
              <DropdownMenuItem onClick={() => handleAction('deactivate')}>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleAction('activate')}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction('delete')}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

UserRow.displayName = 'UserRow';

// Loading Skeleton
const LoadingTable = memo(() => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
    ))}
  </div>
));

LoadingTable.displayName = 'LoadingTable';

// Main User Management Page Component
export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Build filters object
  const filters = useMemo<UsersFilters>(
    () => ({
      search: searchQuery,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
    }),
    [searchQuery, roleFilter, departmentFilter]
  );

  // Fetch users with filters
  const { data: users, isLoading, isError, error } = useUsersQuery(filters);

  // Handle search input with debounce effect
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleCreateUser = useCallback(() => {
    console.log('Create user clicked');
    // TODO: Implement create user dialog/page
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('all');
  }, []);

  const hasActiveFilters =
    searchQuery || roleFilter !== 'all' || departmentFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Department Filter */}
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {users?.length || 0} user(s) found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {users?.length || 0} total user(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && <LoadingTable />}

          {/* Error State */}
          {isError && (
            <ErrorAlert
              error={error || 'Failed to load users'}
              title="Failed to load users"
            />
          )}

          {/* Empty State */}
          {!isLoading && !isError && users?.length === 0 && (
            <EmptyState
              icon={hasActiveFilters ? Search : UserPlus}
              title={
                hasActiveFilters ? 'No users found' : 'No users available'
              }
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first user'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear Filters',
                      onClick: handleResetFilters,
                      variant: 'outline' as const,
                    }
                  : {
                      label: 'Create User',
                      onClick: handleCreateUser,
                    }
              }
            />
          )}

          {/* Users Table */}
          {!isLoading && !isError && users && users.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Department
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Position
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <UserRow key={user.profile.id} user={user} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
