/**
 * User Filters Component
 *
 * Compact filtering UI for user management with:
 * - Real-time search with debouncing
 * - Inline filter dropdowns
 * - Active filter badges
 * - URL query param synchronization
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { UserListQuery } from '@tupsafe/types';

interface UserFiltersProps {
  onFilterChange?: (filters: Partial<UserListQuery>) => void;
  totalResults?: number;
}

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Personnel' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'auditor', label: 'Auditor' },
];

const USER_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'employee', label: 'Employee' },
  { value: 'applicant', label: 'Applicant' },
];

const ACCOUNT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

const ACTIVE_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Active Only' },
  { value: 'false', label: 'Inactive Only' },
];

const EMPLOYMENT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
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
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [userType, setUserType] = useState(searchParams.get('userType') || 'all');
  const [accountStatus, setAccountStatus] = useState(searchParams.get('accountStatus') || 'all');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || 'all');
  const [employmentCategory, setEmploymentCategory] = useState(
    searchParams.get('employmentCategory') || 'all'
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            (filterObj as Record<string, unknown>)[key] = Number(value);
          } else if (key === 'isActive') {
            filterObj.isActive = value === 'true';
          } else {
            (filterObj as Record<string, unknown>)[key] = value;
          }
        });
        onFilterChange(filterObj);
      }
    },
    [searchParams, router, onFilterChange]
  );

  const handleRoleChange = (value: string) => {
    setRole(value);
    updateFilters({ role: (value === 'all' ? undefined : value) as 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor' | undefined });
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value);
    updateFilters({ userType: (value === 'all' ? undefined : value) as 'employee' | 'applicant' | undefined });
  };

  const handleAccountStatusChange = (value: string) => {
    setAccountStatus(value);
    updateFilters({ accountStatus: (value === 'all' ? undefined : value) as 'pending' | 'active' | 'suspended' | 'rejected' | undefined });
  };

  const handleIsActiveChange = (value: string) => {
    setIsActive(value);
    updateFilters({ isActive: value === 'true' ? true : value === 'false' ? false : undefined });
  };

  const handleEmploymentCategoryChange = (value: string) => {
    setEmploymentCategory(value);
    updateFilters({ employmentCategory: (value === 'all' ? undefined : value) as 'faculty' | 'administrative' | 'contractual' | 'not_applicable' | undefined });
  };

  const handleClearFilters = () => {
    setSearch('');
    setRole('all');
    setUserType('all');
    setAccountStatus('all');
    setIsActive('all');
    setEmploymentCategory('all');
    router.push('?page=1', { scroll: false });
    if (onFilterChange) {
      onFilterChange({ page: 1 });
    }
  };

  const activeFilterCount =
    [
      search,
      role !== 'all' ? role : '',
      userType !== 'all' ? userType : '',
      accountStatus !== 'all' ? accountStatus : '',
      isActive !== 'all' ? isActive : '',
      employmentCategory !== 'all' ? employmentCategory : ''
    ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search + Quick Filters Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
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

        {/* Quick Filter: Role */}
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick Filter: Status */}
        <Select value={accountStatus} onValueChange={handleAccountStatusChange}>
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">More</span>
              {(userType !== 'all' || isActive !== 'all' || employmentCategory !== 'all') && (
                <Badge variant="secondary" className="h-5 w-5 p-0 justify-center">
                  {[userType !== 'all', isActive !== 'all', employmentCategory !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Additional Filters</h4>

              {/* User Type */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">User Type</label>
                <Select value={userType} onValueChange={handleUserTypeChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
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

              {/* Active Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Active Status</label>
                <Select value={isActive} onValueChange={handleIsActiveChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
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

              {/* Employment Category */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Employment Category</label>
                <Select value={employmentCategory} onValueChange={handleEmploymentCategoryChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
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
          </PopoverContent>
        </Popover>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 gap-1">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Search: {search}
              <button onClick={() => setSearch('')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {role !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs capitalize">
              {role}
              <button onClick={() => handleRoleChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {accountStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs capitalize">
              {accountStatus}
              <button onClick={() => handleAccountStatusChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {userType !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs capitalize">
              {userType}
              <button onClick={() => handleUserTypeChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {isActive !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {isActive === 'true' ? 'Active' : 'Inactive'}
              <button onClick={() => handleIsActiveChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {employmentCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs capitalize">
              {employmentCategory.replace('_', ' ')}
              <button onClick={() => handleEmploymentCategoryChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
