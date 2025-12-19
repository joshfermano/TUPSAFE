/**
 * Organization Management Page
 *
 * Comprehensive organizational structure management interface with:
 * - Statistics overview
 * - Tabbed filtering (All, Colleges, Departments, Offices)
 * - Search and sorting
 * - Data table with actions
 * - Dialogs for CRUD operations
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  OrganizationStatsCards,
  OrganizationTable,
  CreateOrganizationDialog,
  EditOrganizationDialog,
  DeleteConfirmDialog,
} from '@/components/organization';
import { useOrganizations, useReactivateOrganization, useBulkDeleteOrganization } from '@/hooks/useOrganization';
import type { OrganizationQuery } from '@tupsafe/types';

export default function OrganizationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Local search state (for immediate UI feedback)
  const [searchValue, setSearchValue] = useState('');

  // Mutations
  const reactivateOrg = useReactivateOrganization();
  const bulkDeleteOrg = useBulkDeleteOrganization();

  // Sync local search state with URL on mount and when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (searchValue !== urlSearch) {
      setSearchValue(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce search updates to URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== (searchParams.get('search') || '')) {
        updateParams({ search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Build query params from URL
  const queryParams = useMemo<Partial<OrganizationQuery>>(() => {
    const params: Partial<OrganizationQuery> = {
      type: (searchParams.get('type') as OrganizationQuery['type']) || 'all',
      includeInactive: searchParams.get('includeInactive') === 'true',
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as OrganizationQuery['sortBy']) || 'name',
      sortOrder: (searchParams.get('sortOrder') as OrganizationQuery['sortOrder']) || 'asc',
    };

    return params;
  }, [searchParams]);

  // Fetch organizations with current filters
  const { data, isLoading, isError, error } = useOrganizations(queryParams);

  // Calculate stats
  const stats = useMemo(() => {
    if (!data) {
      return {
        totalColleges: 0,
        totalDepartments: 0,
        totalOffices: 0,
        totalActive: 0,
      };
    }

    return {
      totalColleges: data.colleges.length,
      totalDepartments: data.departments.length,
      totalOffices: data.offices.length,
      totalActive:
        data.colleges.filter((c) => c.isActive).length +
        data.departments.filter((d) => d.isActive).length +
        data.offices.filter((o) => o.isActive).length,
    };
  }, [data]);

  // Combine all organizations for table display
  const allOrganizations = useMemo(() => {
    if (!data) return [];

    const all = [...data.colleges, ...data.departments, ...data.offices];

    // Apply search filter client-side for better UX
    if (queryParams.search) {
      const searchLower = queryParams.search.toLowerCase();
      return all.filter(
        (org) =>
          org.name.toLowerCase().includes(searchLower) ||
          org.code.toLowerCase().includes(searchLower)
      );
    }

    return all;
  }, [data, queryParams.search]);

  // Update URL params
  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle actions
  const handleViewDetails = (id: string) => {
    // You can implement a details dialog or navigate to a details page
    console.log('View details for:', id);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleReactivate = (id: string) => {
    reactivateOrg.mutate(id);
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteOrg.mutate(ids);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage colleges, departments, and administrative offices
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Stats Cards */}
      <OrganizationStatsCards
        totalColleges={stats.totalColleges}
        totalDepartments={stats.totalDepartments}
        totalOffices={stats.totalOffices}
        totalActive={stats.totalActive}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Organizations</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to load organizations. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card className="border-muted/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>{data?.total || 0} total unit(s)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs for Type Filtering */}
          <Tabs
            value={queryParams.type || 'all'}
            onValueChange={(value) => updateParams({ type: value })}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="college">Colleges</TabsTrigger>
              <TabsTrigger value="department">Departments</TabsTrigger>
              <TabsTrigger value="office">Offices</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={queryParams.includeInactive ? 'true' : 'false'}
                onValueChange={(value) => updateParams({ includeInactive: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Active Only</SelectItem>
                  <SelectItem value="true">Include Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={queryParams.sortBy || 'name'}
                onValueChange={(value) => updateParams({ sortBy: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="code">Sort by Code</SelectItem>
                  <SelectItem value="createdAt">Sort by Date</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={queryParams.sortOrder || 'asc'}
                onValueChange={(value) => updateParams({ sortOrder: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <OrganizationTable
            data={allOrganizations}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            onBulkDelete={handleBulkDelete}
            isBulkDeleting={bulkDeleteOrg.isPending}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} />

      <EditOrganizationDialog
        organizationId={editId}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
      />

      <DeleteConfirmDialog
        organizationId={deleteId}
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        allowHardDelete={false} // Set to true for admin users
      />
    </div>
  );
}
