/**
 * Registration Filters Component
 *
 * Provides filtering and search capabilities for registration list.
 * Includes status tabs, user type filter, department filter, and debounced search.
 * Uses inline styles for theme-aware colors to avoid Tailwind v4 specificity issues.
 */

'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Search, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

export interface RegistrationFiltersState {
  status?: 'pending' | 'approved' | 'rejected';
  userType?: 'employee' | 'applicant';
  departmentId?: string;
  search?: string;
}

/** Theme-aware styles for active tab triggers */
const tabActiveStyles = {
  all: {
    light: { backgroundColor: '#e2e8f0', color: '#1e293b', borderColor: '#94a3b8' },
    dark: { backgroundColor: 'rgba(100,116,139,0.2)', color: '#e2e8f0', borderColor: 'rgba(100,116,139,0.4)' },
  },
  pending: {
    light: { backgroundColor: '#bfdbfe', color: '#1e3a8a', borderColor: '#60a5fa' },
    dark: { backgroundColor: 'rgba(59,130,246,0.15)', color: '#93c5fd', borderColor: 'rgba(59,130,246,0.4)' },
  },
  approved: {
    light: { backgroundColor: '#bbf7d0', color: '#14532d', borderColor: '#4ade80' },
    dark: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#86efac', borderColor: 'rgba(34,197,94,0.4)' },
  },
  rejected: {
    light: { backgroundColor: '#fecaca', color: '#7f1d1d', borderColor: '#f87171' },
    dark: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.4)' },
  },
} as const;

type TabStatus = keyof typeof tabActiveStyles;

interface RegistrationFiltersProps {
  filters: RegistrationFiltersState;
  onFiltersChange: (filters: RegistrationFiltersState) => void;
  departments?: Array<{ id: string; name: string }>;
}

export function RegistrationFilters({
  filters,
  onFiltersChange,
  departments = [],
}: RegistrationFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const isDark = useIsDarkMode();
  const activeTab = filters.status || 'all';

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce should only re-run when searchValue changes, not when filters/onFiltersChange refs change
  }, [searchValue]);

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : (status as RegistrationFiltersState['status']),
    });
  };

  const handleUserTypeChange = (userType: string) => {
    onFiltersChange({
      ...filters,
      userType: userType === 'all' ? undefined : (userType as RegistrationFiltersState['userType']),
    });
  };

  const handleDepartmentChange = (departmentId: string) => {
    onFiltersChange({
      ...filters,
      departmentId: departmentId === 'all' ? undefined : departmentId,
    });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.status,
    filters.userType,
    filters.departmentId,
    filters.search,
  ].filter(Boolean).length;

  /**
   * Returns inline style for a tab trigger when it is the active tab.
   * Returns undefined for inactive tabs so the default shadcn styling applies.
   */
  function getTabStyle(value: string): CSSProperties | undefined {
    if (activeTab !== value) return undefined;
    const config = tabActiveStyles[value as TabStatus];
    if (!config) return undefined;
    return isDark ? config.dark : config.light;
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleStatusChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" style={getTabStyle('all')}>All</TabsTrigger>
          <TabsTrigger value="pending" style={getTabStyle('pending')}>
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" style={getTabStyle('approved')}>
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" style={getTabStyle('rejected')}>
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* User Type Filter */}
        <Select
          value={filters.userType || 'all'}
          onValueChange={handleUserTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="applicant">Applicant</SelectItem>
          </SelectContent>
        </Select>

        {/* Department Filter */}
        {departments.length > 0 && (
          <Select
            value={filters.departmentId || 'all'}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Department" />
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
        )}

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear {activeFilterCount > 1 && `(${activeFilterCount})`}
          </Button>
        )}
      </div>

      {/* Active Filters Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.userType && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.userType}
              <button
                onClick={() => onFiltersChange({ ...filters, userType: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.departmentId && (
            <Badge variant="secondary" className="gap-1">
              Department:{' '}
              {departments.find((d) => d.id === filters.departmentId)?.name || 'Unknown'}
              <button
                onClick={() => onFiltersChange({ ...filters, departmentId: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, search: undefined });
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
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
