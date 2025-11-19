'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  Building2,
  Filter,
  Search,
  Eye,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useApplicationsQuery, type Application } from '@/hooks/useApplicationsQuery';
import { BlurFade } from '@/components/ui/blur-fade';
import { ShineBorder } from '@/components/ui/shine-border';
import AnimatedGradientText from '@/components/ui/animated-gradient-text';

/**
 * Status badge color mapping
 */
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  shortlisted: 'bg-purple-100 text-purple-800 border-purple-200',
  for_interview: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  interviewed: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  for_final_review: 'bg-violet-100 text-violet-800 border-violet-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
  hired: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

/**
 * Format status for display
 */
const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Application card component
 */
function ApplicationCard({ application }: { application: Application }) {
  return (
    <BlurFade delay={0.1} inView>
      <Link href={`/dashboard/applications/${application.id}`}>
        <ShineBorder
          className="relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:shadow-lg"
          shineColor={['#8B1538', '#B8264D', '#D4345F']}
          borderWidth={2}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {application.position.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {application.applicationNumber}
                </p>
              </div>
              <Badge
                className={cn(
                  'border',
                  statusColors[application.status] ||
                    'bg-gray-100 text-gray-800 border-gray-200'
                )}
                variant="outline">
                {formatStatus(application.status)}
              </Badge>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Department */}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-[#8B1538]" />
                <span className="text-slate-700 dark:text-slate-300">
                  {application.position.department.name}
                </span>
              </div>

              {/* Application Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-[#8B1538]" />
                <span className="text-slate-700 dark:text-slate-300">
                  Applied {format(new Date(application.applicationDate), 'MMM dd, yyyy')}
                </span>
              </div>

              {/* Employment Category */}
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-[#8B1538]" />
                <span className="text-slate-700 dark:text-slate-300">
                  {application.position.employmentCategory}
                </span>
              </div>

              {/* Interview Date (if scheduled) */}
              {application.interviewDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Interview: {format(new Date(application.interviewDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* View Details Button */}
            <div className="pt-2">
              <Button
                variant="ghost"
                className="w-full gap-2 text-[#8B1538] hover:bg-[#8B1538]/10 hover:text-[#8B1538]">
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </div>
          </div>
        </ShineBorder>
      </Link>
    </BlurFade>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <BlurFade delay={0.2} inView>
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No Applications Yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              You haven&apos;t submitted any job applications yet. Browse open positions to get
              started.
            </p>
          </div>
          <Button
            asChild
            className="mt-4 bg-gradient-to-r from-[#8B1538] to-[#B8264D] text-white hover:from-[#B8264D] hover:to-[#8B1538]">
            <Link href="/dashboard/positions">Browse Open Positions</Link>
          </Button>
        </div>
      </Card>
    </BlurFade>
  );
}

/**
 * My Applications Page
 * Shows all job applications submitted by the applicant
 */
export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useApplicationsQuery(
    statusFilter ? { status: statusFilter } : undefined
  );

  // Filter applications by search query (client-side)
  const filteredApplications =
    data?.applications.filter(
      (app) =>
        app.position.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.department.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <BlurFade delay={0.05} inView>
        <div className="space-y-2">
          <AnimatedGradientText>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              My Applications
            </h1>
          </AnimatedGradientText>
          <p className="text-slate-600 dark:text-slate-400">
            Track and manage your job applications
          </p>
        </div>
      </BlurFade>

      {/* Filters */}
      <BlurFade delay={0.1} inView>
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by position or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="for_interview">For Interview</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </BlurFade>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B1538]" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <BlurFade delay={0.2} inView>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <div className="p-6 text-center">
              <p className="text-red-800 dark:text-red-400">
                Failed to load applications. Please try again later.
              </p>
            </div>
          </Card>
        </BlurFade>
      )}

      {/* Applications Grid */}
      {!isLoading && !error && (
        <>
          {filteredApplications.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Summary */}
              <BlurFade delay={0.15} inView>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredApplications.length} of {data?.total || 0} applications
                  </p>
                </div>
              </BlurFade>

              {/* Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {filteredApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
