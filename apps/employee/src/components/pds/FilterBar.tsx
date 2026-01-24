'use client';

import React, { memo } from 'react';
import { BlurFade } from '@tupsafe/shared-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SortAsc, Search } from 'lucide-react';

export type SortOption = 'date-desc' | 'date-asc' | 'version-desc' | 'version-asc';

interface FilterBarProps {
  sortBy: SortOption;
  searchQuery: string;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (query: string) => void;
}

export const FilterBar = memo(
  ({
    sortBy,
    searchQuery,
    onSortChange,
    onSearchChange,
  }: FilterBarProps) => {
    return (
      <BlurFade delay={0.35}>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by year..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <Select
              value={sortBy}
              onValueChange={(v) => onSortChange(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="version-desc">Year (Newest)</SelectItem>
                <SelectItem value="version-asc">Year (Oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </BlurFade>
    );
  }
);

FilterBar.displayName = 'FilterBar';
