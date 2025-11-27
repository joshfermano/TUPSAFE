/**
 * Jobs Filters Component
 *
 * Advanced filtering controls for positions list with URL sync
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface JobsFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  status: 'all' | 'open' | 'closed' | 'filled' | 'cancelled';
  departmentId?: string;
  employmentCategory: 'all' | 'faculty' | 'administrative' | 'contractual' | 'not_applicable';
  isFeatured?: boolean;
  search?: string;
  page: number;
}

export function JobsFilters({ onFilterChange }: JobsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch departments from API
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery<{
    departments: Department[];
  }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const departments = departmentsData?.departments || [];

  const [filters, setFilters] = useState<FilterState>({
    status: (searchParams.get('status') as FilterState['status']) || 'all',
    departmentId: searchParams.get('departmentId') || undefined,
    employmentCategory:
      (searchParams.get('employmentCategory') as FilterState['employmentCategory']) || 'all',
    isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const debouncedSearch = useDebounce(filters.search || '', 300);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.departmentId) params.set('departmentId', filters.departmentId);
    if (filters.employmentCategory !== 'all')
      params.set('employmentCategory', filters.employmentCategory);
    if (filters.isFeatured !== undefined) params.set('isFeatured', String(filters.isFeatured));
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', filters.page.toString());

    router.push(`?${params.toString()}`, { scroll: false });
    onFilterChange?.({ ...filters, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.departmentId,
    filters.employmentCategory,
    filters.isFeatured,
    debouncedSearch,
    filters.page,
  ]);

  const updateFilter = (key: keyof FilterState, value: string | boolean | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to page 1 when filter changes
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      departmentId: undefined,
      employmentCategory: 'all',
      isFeatured: undefined,
      search: '',
      page: 1,
    });
  };

  const activeFilterCount =
    (filters.status !== 'all' ? 1 : 0) +
    (filters.departmentId ? 1 : 0) +
    (filters.employmentCategory !== 'all' ? 1 : 0) +
    (filters.isFeatured !== undefined ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and Featured Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by position title or code..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="featured-toggle"
            checked={filters.isFeatured === true}
            onCheckedChange={(checked) => updateFilter('isFeatured', checked ? true : undefined)}
          />
          <Label htmlFor="featured-toggle" className="text-sm cursor-pointer">
            Featured Only
          </Label>
        </div>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select
          value={filters.departmentId || 'all'}
          onValueChange={(v) => updateFilter('departmentId', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            {isLoadingDepartments ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="All Departments" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employment Category Filter */}
        <Select
          value={filters.employmentCategory}
          onValueChange={(v) => updateFilter('employmentCategory', v)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="administrative">Administrative</SelectItem>
            <SelectItem value="contractual">Contractual</SelectItem>
            <SelectItem value="not_applicable">Not Applicable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() => updateFilter('status', 'all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.departmentId && (
            <Badge variant="secondary" className="gap-1">
              {departments.find((d) => d.id === filters.departmentId)?.name || 'Department'}
              <button
                onClick={() => updateFilter('departmentId', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.employmentCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.employmentCategory}
              <button
                onClick={() => updateFilter('employmentCategory', 'all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.isFeatured && (
            <Badge variant="secondary" className="gap-1">
              Featured
              <button
                onClick={() => updateFilter('isFeatured', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
