'use client';

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { usePdsQuery } from '../../../../hooks/usePdsQuery';
import { BlurFade, Badge, NumberTicker } from '@tupsafe/shared-ui';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Input } from '../../../../components/ui/input';
import { format } from 'date-fns';
import {
  FileText,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  SortAsc,
  Calendar,
  User,
  Search,
  Loader2,
  AlertCircle,
  FolderCheck,
} from 'lucide-react';

type SortOption = 'newest' | 'oldest';

interface ApprovedSubmission {
  id: string;
  year: number; // Calendar year for this PDS
  version: number; // Version within the year
  status: string;
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectionReason: string | null;
}

/**
 * Loading State Component
 */
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-12 w-12 animate-spin text-[oklch(0.55_0.22_15)]" />
    <p className="text-muted-foreground">Loading approved submissions...</p>
  </div>
));
LoadingState.displayName = 'LoadingState';

/**
 * Error State Component
 */
const ErrorState = memo<{ message: string }>(({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="rounded-full bg-destructive/10 p-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold">Error Loading Submissions</h3>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  </div>
));
ErrorState.displayName = 'ErrorState';

/**
 * Empty State Component
 */
const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 p-4">
      <FolderCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold">No Approved Submissions</h3>
      <p className="text-muted-foreground max-w-md">
        You don&apos;t have any approved PDS submissions yet. Submit your PDS for review to see
        approved submissions here.
      </p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

/**
 * Stats Card Component
 */
const StatsCard = memo<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  delay: number;
}>(({ title, value, icon, delay }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === 'number' ? <NumberTicker value={value} /> : value}
            </p>
          </div>
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/30 p-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
StatsCard.displayName = 'StatsCard';

/**
 * Approved Card Component
 */
const ApprovedCard = memo<{
  submission: ApprovedSubmission;
  delay: number;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onPrint: (id: string) => void;
}>(({ submission, delay, onView, onDownload, onPrint }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-muted hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/30 p-2.5">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Annual PDS - CY {submission.year}</h3>
                <p className="text-sm text-muted-foreground">Version {submission.version}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {submission.submittedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Submitted: {format(submission.submittedAt, 'MMM dd, yyyy')}</span>
              </div>
            )}
            {submission.approvedAt && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Approved: {format(submission.approvedAt, 'MMM dd, yyyy')}</span>
              </div>
            )}
            {submission.approvedBy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Approved by: {submission.approvedBy}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(submission.id)}
              className="flex-1 min-w-[100px]"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(submission.id)}
              className="flex-1 min-w-[100px]"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrint(submission.id)}
              className="flex-1 min-w-[100px]"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
ApprovedCard.displayName = 'ApprovedCard';

/**
 * Main Page Component
 */
export default function ApprovedSubmissionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, loading, error } = usePdsQuery(user?.id || '');

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only approved submissions
  const approvedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions
      .filter((submission) => submission.status === 'approved')
      .map(
        (submission): ApprovedSubmission => ({
          id: submission.id,
          year: submission.year,
          version: submission.version,
          status: submission.status,
          submittedAt: submission.submittedAt,
          approvedAt: submission.approvedAt,
          approvedBy: submission.approvedBy,
          rejectionReason: submission.rejectionReason ?? null,
        })
      );
  }, [submissions]);

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = [...approvedSubmissions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((submission) =>
        `version ${submission.version}`.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = a.approvedAt || a.submittedAt || new Date(0);
      const dateB = b.approvedAt || b.submittedAt || new Date(0);

      if (sortBy === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });

    return filtered;
  }, [approvedSubmissions, searchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (approvedSubmissions.length === 0) {
      return {
        total: 0,
        latestYear: 'N/A',
        oldestYear: 'N/A',
      };
    }

    const years = approvedSubmissions
      .map((submission) => {
        const date = submission.approvedAt || submission.submittedAt;
        return date ? new Date(date).getFullYear() : null;
      })
      .filter((year): year is number => year !== null);

    return {
      total: approvedSubmissions.length,
      latestYear: years.length > 0 ? Math.max(...years).toString() : 'N/A',
      oldestYear: years.length > 0 ? Math.min(...years).toString() : 'N/A',
    };
  }, [approvedSubmissions]);

  // Event handlers
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/pds/${id}`);
    },
    [router]
  );

  const handleDownload = useCallback((id: string) => {
    // TODO: Implement PDF download
    console.log('Download PDF:', id);
  }, []);

  const handlePrint = useCallback((id: string) => {
    // TODO: Implement print functionality
    console.log('Print:', id);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as SortOption);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ErrorState message={error || 'Failed to load approved submissions'} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <BlurFade delay={0.1} inView>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approved Submissions</h1>
            <p className="text-muted-foreground mt-1">
              View all your approved Personal Data Sheet submissions
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 w-fit"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approved
          </Badge>
        </div>
      </BlurFade>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Approved"
          value={stats.total}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          delay={0.2}
        />
        <StatsCard
          title="Latest Approved"
          value={stats.latestYear}
          icon={<Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          delay={0.25}
        />
        <StatsCard
          title="Oldest Approved"
          value={stats.oldestYear}
          icon={<FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          delay={0.3}
        />
      </div>

      {/* Filters */}
      {approvedSubmissions.length > 0 && (
        <BlurFade delay={0.35} inView>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by version..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </BlurFade>
      )}

      {/* Submissions Grid */}
      {approvedSubmissions.length === 0 ? (
        <EmptyState />
      ) : filteredAndSortedSubmissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="rounded-full bg-muted p-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">No Results Found</h3>
            <p className="text-muted-foreground max-w-md">
              No approved submissions match your search criteria. Try adjusting your filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSubmissions.map((submission, index) => (
            <ApprovedCard
              key={submission.id}
              submission={submission}
              delay={0.4 + index * 0.05}
              onView={handleView}
              onDownload={handleDownload}
              onPrint={handlePrint}
            />
          ))}
        </div>
      )}
    </div>
  );
}
