'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePds, useAuth } from '@tupsafe/mock-data/api';
import type { PdsSubmission } from '@tupsafe/mock-data';
import { differenceInYears, format } from 'date-fns';
import {
  FileText,
  Download,
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Archive,
  Sparkles,
  Calendar,
  History
} from 'lucide-react';

import { MagicCard } from '@/components/ui/magic-card';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BlurFade } from '@/components/ui/blur-fade';
import { Particles } from '@/components/ui/particles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Status badge color configuration with TUP Manila Crimson theme
const STATUS_COLORS = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  reviewing: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};

const STATUS_ICONS = {
  draft: FileEdit,
  submitted: Clock,
  reviewing: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

// Calculate PDS completion percentage
const calculateCompletion = (submission: PdsSubmission): number => {
  // This is a simplified calculation
  // In a real implementation, you would check all required fields
  if (submission.status === 'approved') return 100;
  if (submission.status === 'submitted' || submission.status === 'reviewing') return 95;
  if (submission.status === 'draft') return Math.floor(Math.random() * 40) + 50; // 50-90%
  return 0;
};

// Get decade from year
const getDecade = (year: number): string => {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
};

// Statistics Card Component
interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'default' | 'green' | 'yellow' | 'blue' | 'red' | 'purple';
}

const StatsCard = React.memo(({ label, value, icon: Icon, color = 'default' }: StatsCardProps) => {
  const colorClasses = {
    default: 'from-slate-500 to-slate-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-rose-500 to-rose-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <Card className="relative overflow-hidden border-slate-200 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {label}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-[oklch(0.55_0.22_15)] to-[oklch(0.65_0.22_15)] bg-clip-text text-transparent">
              <NumberTicker value={value} />
            </div>
          </div>
          {Icon && (
            <div className={cn(
              "p-3 rounded-full bg-gradient-to-br",
              colorClasses[color],
              "bg-opacity-10"
            )}>
              <Icon className={cn("h-6 w-6", `text-${color === 'default' ? 'slate' : color}-600`)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

// Archived PDS Card Component
interface ArchivedPDSCardProps {
  submission: PdsSubmission;
  onView: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

const ArchivedPDSCard = React.memo(({ submission, onView, onDownload, onPrint }: ArchivedPDSCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const completion = useMemo(() => calculateCompletion(submission), [submission]);

  const StatusIcon = STATUS_ICONS[submission.status as keyof typeof STATUS_ICONS];
  const submissionDate = submission.submittedAt || submission.createdAt;
  const submissionYear = new Date(submissionDate).getFullYear();
  const yearsAgo = differenceInYears(new Date(), new Date(submissionDate));

  const sections = [
    { name: 'Personal Information', completed: true },
    { name: 'Family Background', completed: true },
    { name: 'Educational Background', completed: completion > 60 },
    { name: 'Civil Service Eligibility', completed: completion > 70 },
    { name: 'Work Experience', completed: completion > 80 },
    { name: 'Voluntary Work', completed: completion > 85 },
    { name: 'Training Programs', completed: completion > 90 },
    { name: 'Other Information', completed: completion > 95 },
  ];

  return (
    <MagicCard className="group cursor-pointer transition-all duration-300 hover:shadow-xl">
      <div className="p-6 space-y-4">
        {/* Header with Archive Badge */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Personal Data Sheet {submissionYear}
              </h3>
              <Badge variant="outline" className="border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-500 gap-1">
                <Archive className="h-3 w-3" />
                Archived
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {submission.submittedAt
                ? `Submitted ${yearsAgo} years ago`
                : `Created ${yearsAgo} years ago`
              }
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 px-3 py-1",
              STATUS_COLORS[submission.status as keyof typeof STATUS_COLORS]
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span className="capitalize font-medium">{submission.status}</span>
          </Badge>
        </div>

        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Completion</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </div>

        {/* Version and Archive Info */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Version {submission.version}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Updated {format(new Date(submission.updatedAt), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <History className="h-3.5 w-3.5" />
            {yearsAgo} years old
          </span>
        </div>

        {/* Expandable Sections Preview */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="text-sm font-medium">View Sections</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <ul className="space-y-2">
              {sections.map((section, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  {section.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span className={cn(
                    section.completed
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500"
                  )}>
                    {section.name}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons - Read-only actions only */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        {/* Archive Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
          <p className="text-xs text-amber-700 dark:text-amber-500 flex items-center gap-2">
            <Archive className="h-3.5 w-3.5 shrink-0" />
            <span>This is an archived record (5+ years old) and cannot be edited</span>
          </p>
        </div>
      </div>
    </MagicCard>
  );
});

ArchivedPDSCard.displayName = 'ArchivedPDSCard';

// Loading State Component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading archived submissions...</p>
  </div>
);

// Error State Component
const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <XCircle className="h-16 w-16 text-rose-500" />
    <p className="text-slate-900 dark:text-slate-100 text-xl font-semibold">Something went wrong</p>
    <p className="text-slate-600 dark:text-slate-400">{error}</p>
    <Button onClick={() => window.location.reload()}>Try Again</Button>
  </div>
);

// Empty State Component
const EmptyState = ({ onViewActive }: { onViewActive: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
    <div className="relative">
      <Archive className="h-24 w-24 text-slate-300 dark:text-slate-700" />
      <Sparkles className="h-8 w-8 text-[oklch(0.55_0.22_15)] absolute -top-2 -right-2" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        No Archived PDS Submissions
      </h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md">
        You don&apos;t have any Personal Data Sheet submissions older than 5 years. Check your active submissions instead.
      </p>
    </div>
    <ShimmerButton onClick={onViewActive} className="gap-2">
      <Eye className="h-4 w-4" />
      View Active Submissions
    </ShimmerButton>
  </div>
);

// Year Group Component
interface YearGroupProps {
  year: number;
  submissions: PdsSubmission[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onPrint: (id: string) => void;
}

const YearGroup = React.memo(({ year, submissions, onView, onDownload, onPrint }: YearGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800 p-4 h-auto"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[oklch(0.55_0.22_15)]" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{year}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        )}
      </Button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4">
          {submissions.map((submission, index) => (
            <BlurFade key={submission.id} delay={0.05 * index}>
              <ArchivedPDSCard
                submission={submission}
                onView={() => onView(submission.id)}
                onDownload={() => onDownload(submission.id)}
                onPrint={() => onPrint(submission.id)}
              />
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
});

YearGroup.displayName = 'YearGroup';

// Main PDS Archive Page
export default function PDSArchivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, loading, error } = usePds(user?.id || '');

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [decadeFilter, setDecadeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc');
  const [groupByYear, setGroupByYear] = useState(true);

  // Filter archived submissions (5+ years old)
  const archivedSubmissions = useMemo(() => {
    const filtered = submissions.filter(submission => {
      const submissionDate = submission.submittedAt || submission.createdAt;
      const age = differenceInYears(new Date(), new Date(submissionDate));
      return age >= 5; // Show 5+ years old
    });

    // Apply status filter
    const statusFiltered = statusFilter === 'all'
      ? filtered
      : filtered.filter(s => s.status === statusFilter);

    // Apply decade filter
    const decadeFiltered = decadeFilter === 'all'
      ? statusFiltered
      : statusFiltered.filter(s => {
          const year = new Date(s.submittedAt || s.createdAt).getFullYear();
          return getDecade(year) === decadeFilter;
        });

    // Apply sorting
    return decadeFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.submittedAt || a.createdAt).getTime() - new Date(b.submittedAt || b.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [submissions, statusFilter, decadeFilter, sortBy]);

  // Group submissions by year
  const groupedByYear = useMemo(() => {
    const groups: Record<number, PdsSubmission[]> = {};
    archivedSubmissions.forEach(submission => {
      const year = new Date(submission.submittedAt || submission.createdAt).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(submission);
    });
    return Object.entries(groups)
      .sort(([yearA], [yearB]) => sortBy === 'date-desc' ? Number(yearB) - Number(yearA) : Number(yearA) - Number(yearB));
  }, [archivedSubmissions, sortBy]);

  // Get available decades
  const availableDecades = useMemo(() => {
    const decades = new Set<string>();
    submissions
      .filter(s => {
        const age = differenceInYears(new Date(), new Date(s.submittedAt || s.createdAt));
        return age >= 5;
      })
      .forEach(s => {
        const year = new Date(s.submittedAt || s.createdAt).getFullYear();
        decades.add(getDecade(year));
      });
    return Array.from(decades).sort().reverse();
  }, [submissions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const oldestSubmission = archivedSubmissions.reduce((oldest, current) => {
      const currentDate = new Date(current.submittedAt || current.createdAt);
      const oldestDate = new Date(oldest.submittedAt || oldest.createdAt);
      return currentDate < oldestDate ? current : oldest;
    }, archivedSubmissions[0]);

    const oldestYear = oldestSubmission
      ? new Date(oldestSubmission.submittedAt || oldestSubmission.createdAt).getFullYear()
      : 0;

    return {
      total: archivedSubmissions.length,
      approved: archivedSubmissions.filter(s => s.status === 'approved').length,
      rejected: archivedSubmissions.filter(s => s.status === 'rejected').length,
      oldestYear,
    };
  }, [archivedSubmissions]);

  // Handlers
  const handleView = useCallback((id: string) => {
    router.push(`/dashboard/pds/view/${id}`);
  }, [router]);

  const handleDownload = useCallback((id: string) => {
    console.log('Download PDF:', id);
    // TODO: Implement PDF download
  }, []);

  const handlePrint = useCallback((id: string) => {
    console.log('Print:', id);
    // TODO: Implement print functionality
  }, []);

  const handleViewActive = useCallback(() => {
    router.push('/dashboard/pds/view');
  }, [router]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="relative min-h-screen pb-12">
      <Particles
        className="absolute inset-0 pointer-events-none"
        quantity={20}
        staticity={50}
        ease={50}
      />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AnimatedGradientText className="text-3xl md:text-4xl font-bold">
                PDS Archive
              </AnimatedGradientText>
              <Badge variant="outline" className="border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-500">
                <Archive className="h-3.5 w-3.5 mr-1" />
                Historical Records
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              View archived Personal Data Sheet submissions from 5+ years ago
            </p>
          </div>
          <ShimmerButton onClick={handleViewActive} className="gap-2 shrink-0">
            <Eye className="h-4 w-4" />
            View Active Submissions
          </ShimmerButton>
        </div>

        {/* Statistics */}
        {archivedSubmissions.length > 0 && (
          <BlurFade delay={0.1}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                label="Total Archived"
                value={stats.total}
                icon={Archive}
                color="purple"
              />
              <StatsCard
                label="Approved"
                value={stats.approved}
                icon={CheckCircle2}
                color="green"
              />
              <StatsCard
                label="Rejected"
                value={stats.rejected}
                icon={XCircle}
                color="red"
              />
              <StatsCard
                label="Oldest Record"
                value={stats.oldestYear}
                icon={History}
                color="blue"
              />
            </div>
          </BlurFade>
        )}

        {/* Filters and Sort */}
        {archivedSubmissions.length > 0 && (
          <BlurFade delay={0.15}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {availableDecades.length > 1 && (
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <Select value={decadeFilter} onValueChange={setDecadeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by decade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Decades</SelectItem>
                      {availableDecades.map(decade => (
                        <SelectItem key={decade} value={decade}>{decade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 flex-1">
                <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date-desc' | 'date-asc' | 'status')}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={groupByYear ? "default" : "outline"}
                onClick={() => setGroupByYear(!groupByYear)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Group by Year
              </Button>
            </div>
          </BlurFade>
        )}

        {/* Cards Grid or Empty State */}
        {archivedSubmissions.length === 0 ? (
          <BlurFade delay={0.2}>
            <EmptyState onViewActive={handleViewActive} />
          </BlurFade>
        ) : groupByYear ? (
          <div className="space-y-8">
            {groupedByYear.map(([year, yearSubmissions]) => (
              <BlurFade key={year} delay={0.2}>
                <YearGroup
                  year={Number(year)}
                  submissions={yearSubmissions}
                  onView={handleView}
                  onDownload={handleDownload}
                  onPrint={handlePrint}
                />
              </BlurFade>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedSubmissions.map((submission, index) => (
              <BlurFade key={submission.id} delay={0.2 + index * 0.05}>
                <ArchivedPDSCard
                  submission={submission}
                  onView={() => handleView(submission.id)}
                  onDownload={() => handleDownload(submission.id)}
                  onPrint={() => handlePrint(submission.id)}
                />
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
