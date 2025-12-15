/**
 * Organization Data Table Component
 *
 * TanStack Table implementation for displaying organizational units
 * with sortable columns, row actions, and responsive design.
 */

'use client';

import { useMemo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2, RefreshCw, ArrowUpDown, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { DepartmentWithStats } from '@tupsafe/types';

interface OrganizationTableProps {
  /**
   * Array of organizational units to display
   */
  data: DepartmentWithStats[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * View details action handler
   */
  onViewDetails: (id: string) => void;

  /**
   * Edit action handler
   */
  onEdit: (id: string) => void;

  /**
   * Delete action handler
   */
  onDelete: (id: string) => void;

  /**
   * Reactivate action handler
   */
  onReactivate: (id: string) => void;
}

/**
 * Helper function to determine unit type based on structure
 */
function getUnitType(unit: DepartmentWithStats): 'college' | 'department' | 'office' {
  if (unit.officeType === 'academic' && !unit.parentCollegeId) {
    return 'college';
  } else if (unit.officeType === 'academic' && unit.parentCollegeId) {
    return 'department';
  } else {
    return 'office';
  }
}

/**
 * Organization data table with sortable columns and actions
 */
export function OrganizationTable({
  data,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onReactivate,
}: OrganizationTableProps) {
  const columns = useMemo<ColumnDef<DepartmentWithStats>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Code
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <Badge variant="outline" className="font-mono">
              {row.original.code}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Name
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.name}</div>;
        },
      },
      {
        id: 'type',
        accessorFn: (row) => getUnitType(row),
        header: 'Type',
        cell: ({ row }) => {
          const type = getUnitType(row.original);
          const typeConfig = {
            college: { label: 'College', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
            department: { label: 'Department', variant: 'secondary' as const, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            office: { label: 'Office', variant: 'secondary' as const, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
          };
          const config = typeConfig[type];
          return (
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'employeeCount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              Employees
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return <div className="text-center">{row.original.employeeCount || 0}</div>;
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return (
            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const unit = row.original;
          const isActive = unit.isActive;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewDetails(unit.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(unit.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isActive ? (
                  <DropdownMenuItem
                    onClick={() => onDelete(unit.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReactivate(unit.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onViewDetails, onEdit, onDelete, onReactivate]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="rounded-full bg-muted p-3">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No organizational units found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating a new college, department, or office.
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
