/**
 * Data Table Pagination Component
 *
 * Reusable pagination controls with page size selection for any data table.
 * Features smart page number windowing to show maximum 5 page buttons.
 *
 * Based on UsersPagination pattern with enhanced flexibility for different data types.
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number;
  /** Total number of pages available */
  totalPages: number;
  /** Current page size (items per page) */
  pageSize: number;
  /** Total number of items across all pages */
  total: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Name of the items being paginated (e.g., "users", "applications") */
  itemName?: string;
  /** Available page size options */
  pageSizeOptions?: number[];
}

/**
 * Reusable pagination component for data tables
 *
 * Provides:
 * - Smart page number buttons (max 5 shown with windowing logic)
 * - Page size selector
 * - Previous/Next navigation
 * - Result summary display
 * - Responsive design (icon-only buttons on mobile)
 *
 * @example
 * ```tsx
 * <DataTablePagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   pageSize={pageSize}
 *   total={total}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   itemName="applications"
 *   pageSizeOptions={[10, 25, 50, 100]}
 * />
 * ```
 */
export const DataTablePagination = React.memo(function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemName = 'items',
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps) {
  // Calculate the range of items currently displayed
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  // Handle page size change from select
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    if (newSize > 0) {
      onPageSizeChange(newSize);
    }
  };

  // Handle page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  /**
   * Smart page windowing logic
   * Shows maximum 5 page buttons, intelligently positioned based on current page
   *
   * Rules:
   * - If totalPages <= 5: Show all pages
   * - If currentPage <= 3: Show pages 1-5
   * - If currentPage >= totalPages - 2: Show last 5 pages
   * - Otherwise: Show currentPage in center (currentPage-2 to currentPage+2)
   */
  const getPageNumbers = (): number[] => {
    const maxButtons = 5;
    const pages: number[] = [];

    if (totalPages <= maxButtons) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages
      for (let i = 1; i <= maxButtons; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages
      for (let i = totalPages - maxButtons + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show currentPage in center
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Left section: Results summary and page size selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {total} {itemName}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right section: Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className="w-8"
              aria-label={`Go to page ${pageNumber}`}
              aria-current={currentPage === pageNumber ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
});
