'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface CardGridPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemName?: string;
  pageSizeOptions?: number[];
}

function CardGridPaginationComponent({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemName = 'items',
  pageSizeOptions = [10, 20, 50],
}: CardGridPaginationProps) {
  // Calculate visible page numbers with smart windowing
  const getPageNumbers = React.useMemo(() => {
    const maxVisible = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart windowing logic
      if (currentPage <= 3) {
        // Near start: show 1,2,3,4,...,last
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: show 1,...,last-3,last-2,last-1,last
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: show 1,...,current-1,current,current+1,...,last
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Calculate result summary
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // Handlers
  const handlePrevious = React.useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = React.useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageClick = React.useCallback(
    (page: number) => {
      onPageChange(page);
    },
    [onPageChange]
  );

  const handlePageSizeChange = React.useCallback(
    (value: string) => {
      const newSize = parseInt(value, 10);
      onPageSizeChange(newSize);
    },
    [onPageSizeChange]
  );

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Result Summary */}
      <div className="text-muted-foreground text-sm">
        Showing{' '}
        <span className="text-foreground font-medium">{startItem}</span> to{' '}
        <span className="text-foreground font-medium">{endItem}</span> of{' '}
        <span className="text-foreground font-medium">{total}</span> {itemName}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            Show
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}>
            <SelectTrigger size="sm" className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">per page</span>
        </div>

        {/* Pagination Controls */}
        <nav
          className="flex items-center gap-1"
          role="navigation"
          aria-label="Pagination">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className="gap-1">
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {/* Page Number Buttons */}
          <div className="hidden items-center gap-1 sm:flex">
            {getPageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="text-muted-foreground flex size-8 items-center justify-center text-sm">
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <Button
                  key={pageNumber}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageClick(pageNumber)}
                  disabled={isActive}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'size-8 p-0',
                    isActive &&
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}>
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          {/* Mobile Page Indicator */}
          <div className="text-muted-foreground flex items-center px-3 text-sm sm:hidden">
            Page {currentPage} of {totalPages}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            className="gap-1">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>
    </div>
  );
}

export const CardGridPagination = React.memo(CardGridPaginationComponent);
