/**
 * Submissions Data Table
 *
 * TanStack Table implementation for submission list with sorting, selection, and actions
 */

'use client';

import { useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { MoreVertical, Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { SubmissionListItem } from '@tupsafe/types';
import { formatDistanceToNow } from 'date-fns';
import { capitalize } from '@/lib/formatting-helpers';

interface SubmissionsDataTableProps {
  data: SubmissionListItem[];
  isLoading: boolean;
  onViewDetails: (id: string, type: 'pds' | 'saln') => void;
  onApprove: (id: string, type: 'pds' | 'saln') => void;
  onReject: (id: string, type: 'pds' | 'saln') => void;
  onBulkSelect: (submissions: SubmissionListItem[]) => void;
}

export function SubmissionsDataTable({
  data,
  isLoading,
  onViewDetails,
  onApprove,
  onReject,
  onBulkSelect,
}: SubmissionsDataTableProps) {
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<SubmissionListItem>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                onBulkSelect(data);
              } else {
                onBulkSelect([]);
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              const selectedRows = table
                .getSelectedRowModel()
                .rows.map((r) => r.original);
              onBulkSelect(selectedRows);
            }}
            aria-label="Select row"
            disabled={
              row.original.status === 'approved' || row.original.status === 'rejected'
            }
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => {
          const employee = row.original.employee;
          return (
            <div className="flex flex-col">
              <div className="font-medium">
                {employee.firstName} {employee.lastName}
              </div>
              {employee.employeeId && (
                <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge variant={type === 'pds' ? 'default' : 'secondary'}>
              {type.toUpperCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'year',
        header: 'Year',
        cell: ({ row }) => {
          // For PDS: show year, for SALN: show fiscalYear
          const type = row.original.type;
          if (type === 'pds') {
            const year = row.original.year;
            return year ? <span>{year}</span> : <span className="text-muted-foreground">—</span>;
          } else {
            const fiscalYear = row.original.fiscalYear;
            return fiscalYear ? <span>{fiscalYear}</span> : <span className="text-muted-foreground">—</span>;
          }
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            submitted: 'secondary',
            reviewing: 'default',
            approved: 'default',
            rejected: 'destructive',
          };
          const colors: Record<string, string> = {
            submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          };

          // Safety check for undefined status
          if (!status) {
            return <Badge variant="secondary">Unknown</Badge>;
          }

          return (
            <Badge variant={variants[status]} className={colors[status]}>
              {capitalize(status, 'Unknown')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => {
          const dept = row.original.employee.department;
          return dept ? (
            <div className="text-sm">{dept.name}</div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'submittedAt',
        header: 'Submitted',
        cell: ({ row }) => {
          const date = row.original.submittedAt;
          return date ? (
            <div className="text-sm">
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const submission = row.original;
          const canApproveReject =
            submission.status === 'submitted' || submission.status === 'reviewing';

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
                  onClick={() => onViewDetails(submission.id, submission.type)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {canApproveReject && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onApprove(submission.id, submission.type)}
                      className="gap-2 text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onReject(submission.id, submission.type)}
                      className="gap-2 text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Audit Log
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- columns are used to create the table; table cannot be a dep of its own input
    [data, onViewDetails, onApprove, onReject, onBulkSelect]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
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
        <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          No submissions match your current filters. Try adjusting your search criteria.
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
            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
