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
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

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
import { PageTransition } from '@/components/PageTransition';
import {
  EnhancedTable,
  EnhancedTableBody,
  EnhancedTableCell,
  EnhancedTableHead,
  EnhancedTableHeader,
  EnhancedTableRow,
} from '@/components/admin/EnhancedTable';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

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

// Mock data for user growth chart (last 6 months)
const getUserGrowthData = () => {
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  return months.map((month, index) => ({
    month,
    users: 45 + index * 12 + Math.floor(Math.random() * 10),
  }));
};

// User Row Component (memoized)
const UserRow = memo(({ user, index }: { user: UserWithDetails; index: number }) => {
  const handleAction = useCallback((action: string, userId: string) => {
    switch (action) {
      case 'view':
        window.location.href = `/dashboard/users/view/${userId}`;
        break;
      case 'edit':
        window.location.href = `/dashboard/users/edit/${userId}`;
        break;
      default:
        console.log(`Action: ${action} for user:`, userId);
    }
  }, []);

  const fullName = `${user.profile.firstName} ${user.profile.lastName}`;

  return (
    <EnhancedTableRow index={index}>
      <EnhancedTableCell>
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
      </EnhancedTableCell>
      <EnhancedTableCell>
        <Badge variant="outline" className="capitalize">
          {user.profile.role.replace('_', ' ')}
        </Badge>
      </EnhancedTableCell>
      <EnhancedTableCell className="hidden md:table-cell">
        {user.department?.name || 'N/A'}
      </EnhancedTableCell>
      <EnhancedTableCell className="hidden lg:table-cell">
        {user.position?.title || 'N/A'}
      </EnhancedTableCell>
      <EnhancedTableCell>
        <StatusBadge
          status={user.profile.isActive ? 'active' : 'inactive'}
        />
      </EnhancedTableCell>
      <EnhancedTableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-dropdown">
            <DropdownMenuItem onClick={() => handleAction('view', user.profile.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('edit', user.profile.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.profile.isActive ? (
              <DropdownMenuItem onClick={() => handleAction('deactivate', user.profile.id)}>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleAction('activate', user.profile.id)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction('delete', user.profile.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </EnhancedTableCell>
    </EnhancedTableRow>
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
  const [searchFocused, setSearchFocused] = useState(false);

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

  // Mock user growth data
  const userGrowthData = useMemo(() => getUserGrowthData(), []);

  // Handle search input with debounce effect
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleCreateUser = useCallback(() => {
    window.location.href = '/dashboard/users/create';
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('all');
  }, []);

  const hasActiveFilters =
    searchQuery || roleFilter !== 'all' || departmentFilter !== 'all';

  return (
    <PageTransition className="space-y-6">
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

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>User Growth Trend</CardTitle>
          </div>
          <CardDescription>User registration over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              users: {
                label: 'Users',
                color: '#8B1538',
              },
            }}
            className="h-[300px]"
          >
            <LineChart data={userGrowthData}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-users)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Filters Card - Fixed theme adaptivity */}
      <Card className="border-muted/50 bg-card shadow-sm">
        <CardHeader className="border-b border-subtle bg-muted/30">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search Input with animated icon */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: searchFocused ? 1.1 : 1,
                    rotate: searchFocused ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </motion.div>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="pl-9 bg-background"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
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
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
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
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border border-subtle">
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
              <EnhancedTable>
                <EnhancedTableHeader>
                  <EnhancedTableRow animate={false}>
                    <EnhancedTableHead>User</EnhancedTableHead>
                    <EnhancedTableHead>Role</EnhancedTableHead>
                    <EnhancedTableHead className="hidden md:table-cell">
                      Department
                    </EnhancedTableHead>
                    <EnhancedTableHead className="hidden lg:table-cell">
                      Position
                    </EnhancedTableHead>
                    <EnhancedTableHead>Status</EnhancedTableHead>
                    <EnhancedTableHead className="w-[50px]">
                      <span className="sr-only">Actions</span>
                    </EnhancedTableHead>
                  </EnhancedTableRow>
                </EnhancedTableHeader>
                <EnhancedTableBody>
                  {users.map((user, index) => (
                    <UserRow key={user.profile.id} user={user} index={index} />
                  ))}
                </EnhancedTableBody>
              </EnhancedTable>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
