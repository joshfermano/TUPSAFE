/**
 * Submission Filters Component
 *
 * Advanced filtering controls for submission list with URL sync
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SubmissionFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  type: 'all' | 'pds' | 'saln';
  status: 'all' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  departmentId?: string;
  fiscalYear?: number;
  search?: string;
  page: number;
}

export function SubmissionFilters({ onFilterChange }: SubmissionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    type: (searchParams.get('type') as FilterState['type']) || 'all',
    status: (searchParams.get('status') as FilterState['status']) || 'submitted',
    departmentId: searchParams.get('departmentId') || undefined,
    fiscalYear: searchParams.get('fiscalYear')
      ? parseInt(searchParams.get('fiscalYear')!)
      : undefined,
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const debouncedSearch = useDebounce(filters.search || '', 300);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.departmentId) params.set('departmentId', filters.departmentId);
    if (filters.fiscalYear) params.set('fiscalYear', filters.fiscalYear.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', filters.page.toString());

    router.push(`?${params.toString()}`, { scroll: false });
    onFilterChange?.({ ...filters, search: debouncedSearch });
  }, [
    filters.type,
    filters.status,
    filters.departmentId,
    filters.fiscalYear,
    debouncedSearch,
    filters.page,
  ]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to page 1 when filter changes
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'submitted',
      departmentId: undefined,
      fiscalYear: undefined,
      search: '',
      page: 1,
    });
  };

  const activeFilterCount =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.departmentId ? 1 : 0) +
    (filters.fiscalYear ? 1 : 0) +
    (filters.search ? 1 : 0);

  const currentYear = new Date().getFullYear();
  const fiscalYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      {/* Type Tabs */}
      <Tabs value={filters.type} onValueChange={(v) => updateFilter('type', v)}>
        <TabsList>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
          <TabsTrigger value="pds">PDS Only</TabsTrigger>
          <TabsTrigger value="saln">SALN Only</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status Tabs */}
      <Tabs value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">Pending Review</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee name or ID..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Department Filter */}
        <Select
          value={filters.departmentId || 'all'}
          onValueChange={(v) => updateFilter('departmentId', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {/* TODO: Load departments dynamically */}
            <SelectItem value="dept-1">College of Engineering</SelectItem>
            <SelectItem value="dept-2">College of Science</SelectItem>
            <SelectItem value="dept-3">College of Liberal Arts</SelectItem>
          </SelectContent>
        </Select>

        {/* Year Filter (for both PDS and SALN) */}
        <Select
          value={filters.fiscalYear?.toString() || 'all'}
          onValueChange={(v) =>
            updateFilter('fiscalYear', v === 'all' ? undefined : parseInt(v))
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {fiscalYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                CY {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type.toUpperCase()}
              <button
                onClick={() => updateFilter('type', 'all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
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
              Department
              <button
                onClick={() => updateFilter('departmentId', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.fiscalYear && (
            <Badge variant="secondary" className="gap-1">
              Year: {filters.fiscalYear}
              <button
                onClick={() => updateFilter('fiscalYear', undefined)}
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
