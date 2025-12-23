/**
 * Applications Data Table
 *
 * TanStack Table implementation for job applications list with status badges and actions
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
import { MoreVertical, Eye, Edit, FileText, Calendar, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import type { JobApplicationListItem } from '@tupsafe/types';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApplicationsDataTableProps {
  data: JobApplicationListItem[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
  onUpdateStatus?: (id: string) => void;
  onConvertToEmployee?: (id: string) => void;
}

/**
 * Status badge configuration for application statuses
 */
const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200',
  },
  for_interview: {
    label: 'For Interview',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200',
  },
  interviewed: {
    label: 'Interviewed',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200',
  },
  for_final_review: {
    label: 'Final Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200',
  },
  hired: {
    label: 'Hired',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200',
  },
};

export function ApplicationsDataTable({
  data,
  isLoading,
  onViewDetails,
  onUpdateStatus,
  onConvertToEmployee,
}: ApplicationsDataTableProps) {
  const columns: ColumnDef<JobApplicationListItem>[] = useMemo(
    () => [
      {
        accessorKey: 'applicant',
        header: 'Applicant',
        cell: ({ row }) => {
          const applicant = row.original.applicant;
          return (
            <div className="flex flex-col">
              <div className="font-medium">
                {applicant.firstName} {applicant.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{applicant.email}</div>
              {applicant.applicantId && (
                <div className="text-xs text-muted-foreground">{applicant.applicantId}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'applicationNumber',
        header: 'Application #',
        cell: ({ row }) => {
          return (
            <div className="font-mono text-sm">
              {row.original.applicationNumber}
            </div>
          );
        },
      },
      {
        accessorKey: 'position',
        header: 'Position',
        cell: ({ row }) => {
          const position = row.original.position;
          return (
            <div className="flex flex-col max-w-xs">
              <div className="font-medium">{position.positionTitle}</div>
              <div className="text-sm text-muted-foreground">{position.positionCode}</div>
              {position.department && (
                <div className="text-xs text-muted-foreground">{position.department.name}</div>
              )}
            </div>
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
        accessorKey: 'hasPds',
        header: 'PDS',
        cell: ({ row }) => {
          const hasPds = row.original.hasPds;
          return (
            <div className="flex items-center justify-center">
              {hasPds ? (
                <div className="flex items-center gap-1.5" title="PDS submitted">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-muted-foreground sr-only sm:not-sr-only">Yes</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5" title="No PDS">
                  <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-muted-foreground sr-only sm:not-sr-only">No</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'applicationDate',
        header: 'Applied',
        cell: ({ row }) => {
          const date = row.original.applicationDate;
          return (
            <div className="flex flex-col">
              <div className="text-sm">
                {format(new Date(date), 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(date), { addSuffix: true })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'interviewDate',
        header: 'Interview',
        cell: ({ row }) => {
          const date = row.original.interviewDate;
          if (!date) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {format(new Date(date), 'MMM dd, yyyy')}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const application = row.original;
          const canConvert = application.status === 'accepted' && onConvertToEmployee;

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
                  onClick={() => onViewDetails(application.id)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onUpdateStatus && (
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(application.id)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Update Status
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onViewDetails(application.id)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View PDS
                </DropdownMenuItem>
                {canConvert && onConvertToEmployee && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onConvertToEmployee(application.id)}
                      className="gap-2 text-green-600 focus:text-green-600"
                    >
                      <UserCheck className="h-4 w-4" />
                      Convert to Employee
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onViewDetails, onUpdateStatus, onConvertToEmployee]
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
        <h3 className="text-lg font-semibold mb-2">No applications found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          No applications match your current filters. Try adjusting your search criteria.
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
