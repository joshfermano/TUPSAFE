'use client';

import { useMemo, memo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { Registration } from '@/lib/api/registrations';
import { capitalize } from '@/lib/formatting-helpers';

// Memoized actions cell component to prevent re-renders from closing dropdown
const ActionsCell = memo(
  ({
    registration,
    onViewDetails,
    onApprove,
    onReject,
  }: {
    registration: Registration;
    onViewDetails: (registration: Registration) => void;
    onApprove: (registration: Registration) => void;
    onReject: (registration: Registration) => void;
  }) => {
    const isPending = registration.status === 'pending';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onViewDetails(registration)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onApprove(registration)}
                className="text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onReject(registration)}
                className="text-red-600">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

ActionsCell.displayName = 'ActionsCell';

interface RegistrationsDataTableProps {
  registrations: Registration[];
  isLoading: boolean;
  onViewDetails: (registration: Registration) => void;
  onApprove: (registration: Registration) => void;
  onReject: (registration: Registration) => void;
  selectedRows: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

export function RegistrationsDataTable({
  registrations,
  isLoading,
  onViewDetails,
  onApprove,
  onReject,
  selectedRows,
  onSelectionChange,
}: RegistrationsDataTableProps) {
  const columns = useMemo<ColumnDef<Registration>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                const allIds = new Set(registrations.map((r) => r.id));
                onSelectionChange(allIds);
              } else {
                onSelectionChange(new Set());
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRows.has(row.original.id)}
            onCheckedChange={(value) => {
              const newSelection = new Set(selectedRows);
              if (value) {
                newSelection.add(row.original.id);
              } else {
                newSelection.delete(row.original.id);
              }
              onSelectionChange(newSelection);
            }}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const { firstName, lastName, middleName } = row.original;
          const fullName = [firstName, middleName, lastName]
            .filter(Boolean)
            .join(' ');
          return (
            <div className="font-medium">
              {fullName}
              {row.original.email && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {row.original.email}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'userType',
        header: 'User Type',
        cell: ({ row }) => {
          const userType = row.original.userType;
          return (
            <Badge
              variant={userType === 'employee' ? 'default' : 'secondary'}
              className={
                userType === 'employee'
                  ? 'bg-blue-800 text-blue-100'
                  : 'bg-orange-800 text-orange-100'
              }>
              {userType === 'employee' ? 'Employee' : 'Applicant'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => {
          const id =
            row.original.userType === 'employee'
              ? row.original.employeeId
              : row.original.applicantId;
          return (
            <div className="font-mono text-sm text-muted-foreground">
              {id || 'Pending'}
            </div>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => {
          const dept = row.original.department;
          return (
            <div className="text-sm">
              {dept ? (
                dept.name
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'requestedAt',
        header: 'Requested',
        cell: ({ row }) => {
          const date = new Date(row.original.requestedAt);
          return (
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(date, { addSuffix: true })}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variants = {
            pending: {
              variant: 'secondary',
              className: 'bg-blue-800 text-blue-100',
            },
            approved: {
              variant: 'secondary',
              className: 'bg-green-800 text-green-300',
            },
            rejected: {
              variant: 'secondary',
              className: 'bg-red-800 text-red-100',
            },
          } as const;

          // Safety check for undefined status
          if (!status) {
            return <Badge variant="secondary">Unknown</Badge>;
          }

          const config = variants[status];

          return (
            <Badge variant="secondary" className={config.className}>
              {capitalize(status, 'Unknown')}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <ActionsCell
            registration={row.original}
            onViewDetails={onViewDetails}
            onApprove={onApprove}
            onReject={onReject}
          />
        ),
      },
    ],
    [
      registrations,
      selectedRows,
      onSelectionChange,
      onViewDetails,
      onApprove,
      onReject,
    ]
  );

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!registrations.length) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No registrations found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            There are no registration requests matching your current filters.
            Try adjusting your search criteria.
          </p>
        </div>
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
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={selectedRows.has(row.original.id) && 'selected'}
              className="hover:bg-muted/50">
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
