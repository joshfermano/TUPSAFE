/**
 * User Filters Component
 *
 * Provides comprehensive filtering UI for user management with:
 * - Real-time search with debouncing
 * - Multiple filter dropdowns (role, status, user type, etc.)
 * - Active filter badges
 * - URL query param synchronization for shareable links
 * - Clear all filters functionality
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserListQuery } from '@tupsafe/types';

interface UserFiltersProps {
  onFilterChange?: (filters: Partial<UserListQuery>) => void;
  totalResults?: number;
}

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Personnel' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'auditor', label: 'Auditor' },
];

const USER_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'employee', label: 'Employee' },
  { value: 'applicant', label: 'Applicant' },
];

const ACCOUNT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

const ACTIVE_STATUSES = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active Only' },
  { value: 'false', label: 'Inactive Only' },
];

const EMPLOYMENT_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'contractual', label: 'Contractual' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

export function UserFilters({ onFilterChange, totalResults }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for immediate UI updates
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [userType, setUserType] = useState(searchParams.get('userType') || '');
  const [accountStatus, setAccountStatus] = useState(searchParams.get('accountStatus') || '');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || '');
  const [employmentCategory, setEmploymentCategory] = useState(
    searchParams.get('employmentCategory') || ''
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search });
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL and trigger filter change
  const updateFilters = useCallback(
    (updates: Partial<UserListQuery>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      // Always reset to page 1 when filters change
      params.set('page', '1');

      // Update URL
      router.push(`?${params.toString()}`, { scroll: false });

      // Notify parent
      if (onFilterChange) {
        const filterObj: Partial<UserListQuery> = {};
        params.forEach((value, key) => {
          if (key === 'page' || key === 'limit') {
            (filterObj as any)[key] = Number(value);
          } else if (key === 'isActive') {
            filterObj.isActive = value === 'true';
          } else if (key === 'role' || key === 'userType' || key === 'accountStatus' || key === 'sortBy' || key === 'sortOrder' || key === 'employmentCategory') {
            (filterObj as any)[key] = value;
          }
        });
        onFilterChange(filterObj);
      }
    },
    [searchParams, router, onFilterChange]
  );

  const handleRoleChange = (value: string) => {
    setRole(value);
    updateFilters({ role: (value || undefined) as 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor' | undefined });
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value);
    updateFilters({ userType: (value || undefined) as 'employee' | 'applicant' | undefined });
  };

  const handleAccountStatusChange = (value: string) => {
    setAccountStatus(value);
    updateFilters({ accountStatus: value as any });
  };

  const handleIsActiveChange = (value: string) => {
    setIsActive(value);
    updateFilters({ isActive: value === 'true' ? true : value === 'false' ? false : undefined });
  };

  const handleEmploymentCategoryChange = (value: string) => {
    setEmploymentCategory(value);
    updateFilters({ employmentCategory: value as any });
  };

  const handleClearFilters = () => {
    setSearch('');
    setRole('');
    setUserType('');
    setAccountStatus('');
    setIsActive('');
    setEmploymentCategory('');
    router.push('?page=1', { scroll: false });
    if (onFilterChange) {
      onFilterChange({ page: 1 });
    }
  };

  const activeFilterCount =
    [search, role, userType, accountStatus, isActive, employmentCategory].filter(Boolean).length;

  return (
    <Card className="border-muted/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search and filter users</CardDescription>
          </div>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Role Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">User Type</label>
            <Select value={userType} onValueChange={handleUserTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Status</label>
            <Select value={accountStatus} onValueChange={handleAccountStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Status</label>
            <Select value={isActive} onValueChange={handleIsActiveChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Employment Category</label>
            <Select value={employmentCategory} onValueChange={handleEmploymentCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border border-muted">
            <p className="text-sm text-muted-foreground">
              {totalResults !== undefined && `${totalResults} user(s) found`}
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
