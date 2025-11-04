'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePds, useAuth } from '@tupsafe/mock-data/api';
import type { PdsSubmission } from '@tupsafe/mock-data';
import { differenceInYears, format, formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Download,
  Printer,
  Edit,
  Eye,
  Plus,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Archive,
  Sparkles
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Statistics Card Component
interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'default' | 'green' | 'yellow' | 'blue' | 'red';
}

const StatsCard = React.memo(({ label, value, icon: Icon, color = 'default' }: StatsCardProps) => {
  const colorClasses = {
    default: 'from-slate-500 to-slate-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-rose-500 to-rose-600',
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

// PDS Card Component
interface PDSCardProps {
  submission: PdsSubmission;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

const PDSCard = React.memo(({ submission, onView, onEdit, onDownload, onPrint }: PDSCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const completion = useMemo(() => calculateCompletion(submission), [submission]);

  const StatusIcon = STATUS_ICONS[submission.status as keyof typeof STATUS_ICONS];
  const submissionYear = submission.submittedAt
    ? new Date(submission.submittedAt).getFullYear()
    : new Date(submission.createdAt).getFullYear();

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
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Personal Data Sheet {submissionYear}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {submission.submittedAt
                ? `Submitted ${formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}`
                : `Created ${formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}`
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

        {/* Version and Last Updated */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Version {submission.version}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Updated {format(new Date(submission.updatedAt), 'MMM d, yyyy')}
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          {(submission.status === 'draft' || submission.status === 'rejected') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
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
      </div>
    </MagicCard>
  );
});

PDSCard.displayName = 'PDSCard';

// Loading State Component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading your PDS submissions...</p>
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
const EmptyState = ({ onCreateNew, onViewArchive }: { onCreateNew: () => void; onViewArchive: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
    <div className="relative">
      <FileText className="h-24 w-24 text-slate-300 dark:text-slate-700" />
      <Sparkles className="h-8 w-8 text-[oklch(0.55_0.22_15)] absolute -top-2 -right-2" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        No Active PDS Submissions
      </h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md">
        You haven&apos;t created any Personal Data Sheet in the last 5 years. Start a new submission or view your archived records.
      </p>
    </div>
    <div className="flex gap-4">
      <ShimmerButton onClick={onCreateNew} className="gap-2">
        <Plus className="h-4 w-4" />
        Create New PDS
      </ShimmerButton>
      <Button variant="outline" onClick={onViewArchive} className="gap-2">
        <Archive className="h-4 w-4" />
        View Archive
      </Button>
    </div>
  </div>
);

// Main PDS View Page
export default function PDSViewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, loading, error } = usePds(user?.id || '');

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status' | 'completion'>('date-desc');

  // Filter active submissions (0-5 years old)
  const activeSubmissions = useMemo(() => {
    const filtered = submissions.filter(submission => {
      const submissionDate = submission.submittedAt || submission.createdAt;
      const age = differenceInYears(new Date(), new Date(submissionDate));
      return age < 5;
    });

    // Apply status filter
    const statusFiltered = statusFilter === 'all'
      ? filtered
      : filtered.filter(s => s.status === statusFilter);

    // Apply sorting
    return statusFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'completion':
          return calculateCompletion(b) - calculateCompletion(a);
        default:
          return 0;
      }
    });
  }, [submissions, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: activeSubmissions.length,
    approved: activeSubmissions.filter(s => s.status === 'approved').length,
    pending: activeSubmissions.filter(s => s.status === 'submitted' || s.status === 'reviewing').length,
    drafts: activeSubmissions.filter(s => s.status === 'draft').length,
  }), [activeSubmissions]);

  // Handlers
  const handleView = useCallback((id: string) => {
    router.push(`/dashboard/pds/view/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: string) => {
    router.push(`/dashboard/pds/edit/${id}`);
  }, [router]);

  const handleDownload = useCallback((id: string) => {
    console.log('Download PDF:', id);
    // TODO: Implement PDF download
  }, []);

  const handlePrint = useCallback((id: string) => {
    console.log('Print:', id);
    // TODO: Implement print functionality
  }, []);

  const handleCreateNew = useCallback(() => {
    router.push('/dashboard/pds/create');
  }, [router]);

  const handleViewArchive = useCallback(() => {
    router.push('/dashboard/pds/archive');
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
            <AnimatedGradientText className="text-3xl md:text-4xl font-bold mb-2">
              PDS Submissions
            </AnimatedGradientText>
            <p className="text-slate-600 dark:text-slate-400">
              View and manage your active Personal Data Sheet submissions from the last 5 years
            </p>
          </div>
          <ShimmerButton onClick={handleCreateNew} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Create New PDS
          </ShimmerButton>
        </div>

        {/* Statistics */}
        {activeSubmissions.length > 0 && (
          <BlurFade delay={0.1}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Total Submissions" value={stats.total} icon={FileText} />
              <StatsCard label="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
              <StatsCard label="Pending Review" value={stats.pending} icon={Clock} color="yellow" />
              <StatsCard label="Drafts" value={stats.drafts} icon={FileEdit} color="blue" />
            </div>
          </BlurFade>
        )}

        {/* Filters and Sort */}
        {activeSubmissions.length > 0 && (
          <BlurFade delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleViewArchive}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                View Archive
              </Button>
            </div>
          </BlurFade>
        )}

        {/* Cards Grid or Empty State */}
        {activeSubmissions.length === 0 ? (
          <BlurFade delay={0.2}>
            <EmptyState
              onCreateNew={handleCreateNew}
              onViewArchive={handleViewArchive}
            />
          </BlurFade>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSubmissions.map((submission, index) => (
              <BlurFade key={submission.id} delay={0.2 + index * 0.05}>
                <PDSCard
                  submission={submission}
                  onView={() => handleView(submission.id)}
                  onEdit={() => handleEdit(submission.id)}
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
