/**
 * Jobs Data Table
 *
 * TanStack Table implementation for positions list with sorting and actions
 */

'use client';

import { useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Eye, Edit, Trash2, Star, FileText } from 'lucide-react';
import type { OpenPositionListItem } from '@tupsafe/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobsDataTableProps {
  data: OpenPositionListItem[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Status badge configuration for position statuses
 */
const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  },
  filled: {
    label: 'Filled',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
  },
};

export function JobsDataTable({
  data,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
}: JobsDataTableProps) {
  const columns: ColumnDef<OpenPositionListItem>[] = useMemo(
    () => [
      {
        accessorKey: 'positionTitle',
        header: 'Position Title',
        cell: ({ row }) => {
          const position = row.original;
          return (
            <div className="flex flex-col max-w-xs">
              <div className="font-medium flex items-center gap-2">
                {position.positionTitle}
                {position.isFeatured && (
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">{position.positionCode}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => {
          const dept = row.original.department;
          return dept ? (
            <div className="text-sm">{dept.name}</div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'employmentCategory',
        header: 'Category',
        cell: ({ row }) => {
          const category = row.original.employmentCategory;
          const categoryLabels: Record<string, string> = {
            faculty: 'Faculty',
            administrative: 'Administrative',
            contractual: 'Contractual',
            not_applicable: 'N/A',
          };
          return (
            <Badge variant="outline" className="capitalize">
              {categoryLabels[category] || category}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const config = statusConfig[status as keyof typeof statusConfig];

          return (
            <Badge variant="outline" className={cn('font-medium', config?.className)}>
              {config?.label || status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'applicationDeadline',
        header: 'Deadline',
        cell: ({ row }) => {
          const deadline = row.original.applicationDeadline;
          const now = new Date();
          const deadlineDate = new Date(deadline);
          const isOverdue = deadlineDate < now;
          const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                {format(deadlineDate, 'MMM dd, yyyy')}
              </div>
              <div className={cn(
                'text-xs',
                isOverdue ? 'text-red-600 dark:text-red-400' :
                daysUntil <= 7 ? 'text-orange-600 dark:text-orange-400' :
                'text-muted-foreground'
              )}>
                {isOverdue ? 'Overdue' :
                 daysUntil === 0 ? 'Today' :
                 daysUntil === 1 ? 'Tomorrow' :
                 `${daysUntil} days left`}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'applicationsReceived',
        header: 'Applications',
        cell: ({ row }) => {
          const count = row.original.applicationsReceived;
          const openings = row.original.numberOfOpenings;
          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium">{count}</div>
              <div className="text-xs text-muted-foreground">
                {openings} {openings === 1 ? 'opening' : 'openings'}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const position = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onViewDetails(position.id)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(position.id)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Position
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onViewDetails(position.id)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Applications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(position.id)}
                  className="gap-2 text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onViewDetails, onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No positions found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          No positions match your current filters. Try adjusting your search criteria or create a
          new position.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
