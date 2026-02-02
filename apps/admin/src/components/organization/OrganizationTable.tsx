/**
 * Organization Data Table Component
 *
 * TanStack Table implementation for displaying organizational units
 * with sortable columns, row selection, bulk actions, and responsive design.
 */

'use client';

import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2, RefreshCw, ArrowUpDown, Building2 } from 'lucide-react';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

  /**
   * Bulk delete action handler
   */
  onBulkDelete?: (ids: string[]) => void;

  /**
   * Whether bulk delete is in progress
   */
  isBulkDeleting?: boolean;
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
 * Organization data table with sortable columns, row selection, and actions
 */
export function OrganizationTable({
  data,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onReactivate,
  onBulkDelete,
  isBulkDeleting = false,
}: OrganizationTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Responsive column visibility
  const columnVisibility = useMemo(
    () => ({
      employeeCount: !isMobile, // Hide on mobile
      type: !isMobile && !isTablet, // Hide on mobile and tablet
    }),
    [isMobile, isTablet]
  );

  const columns = useMemo<ColumnDef<DepartmentWithStats>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
            college: { label: 'College', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 dark:bg-blue-700/90 dark:text-blue-200' },
            department: { label: 'Department', variant: 'secondary' as const, className: 'bg-green-100 text-green-700 dark:bg-green-700/90 dark:text-green-300' },
            office: { label: 'Office', variant: 'secondary' as const, className: 'bg-purple-100 text-purple-700 dark:bg-purple-700/90 dark:text-purple-200' },
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
            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-100 text-green-700 dark:bg-green-700/90 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}>
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
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnVisibility,
    },
    getRowId: (row) => row.id,
  });

  // Get selected row IDs
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setRowSelection({});
      setShowBulkDeleteDialog(false);
    }
  };

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
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
            >
              Clear Selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isBulkDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
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
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className={!row.original.isActive ? 'opacity-60 bg-muted/30' : ''}
              >
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

      {/* Footer with selection info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete {selectedCount} Organization(s)?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">
                This action will permanently delete the selected organizational units from the database.
              </p>
              <p>
                All data associated with these organizations will be removed and cannot be recovered.
                This action is irreversible.
              </p>
              <p className="text-sm">
                Note: Organizations with dependencies (employees, positions, or sub-units) will be soft-deleted (deactivated) instead to maintain data integrity.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
