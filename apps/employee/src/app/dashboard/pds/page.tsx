'use client';

// React and Next.js
import { useMemo, memo, useCallback, useState } from 'react';
import Link from 'next/link';

// Motion and Animation
import { motion } from 'framer-motion';

// API Hooks - Use real data hooks instead of mock data
import { useAuth } from '../../../providers/AuthProvider';
import {
  usePDSSubmissions,
  useDeadlineForForm,
  usePDSPdf,
  type PDSSubmission,
} from '../../../hooks';
import { transformPdsForPdf } from '../../../lib/utils/pds-transformations';
import { toast } from 'sonner';

// Enhanced UI Components from shared-ui
import {
  NumberTicker,
  BlurFade,
  Badge,
  ShimmerButton,
  BorderBeam,
  AnimatedGradientText,
} from '@tupsafe/shared-ui';

// Local UI Components
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Tooltip } from '../../../components/ui/tooltip';
import { Progress } from '../../../components/ui/progress';

// Local Components
import { DeadlineSection } from '../../../components/dashboard/DeadlineSection';

// Utils
import { cn } from '../../../lib/utils';

// Icons
import {
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Heart,
  Award,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Calendar,
  Plus,
  Send,
  TrendingUp,
  Archive,
  Loader2,
  Info,
  Users,
  BookOpen,
  ChevronRight,
  Sparkles,
  Shield,
  ListChecks,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Type Definitions
interface PDSSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

// Constants - 9 PDS Sections as per CSC Format
const PDS_SECTIONS: PDSSection[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic biographical data and contact details',
    icon: User,
  },
  {
    id: 'family-background',
    title: 'Family Background',
    description: 'Spouse and children information',
    icon: Users,
  },
  {
    id: 'educational-background',
    title: 'Educational Background',
    description: 'Elementary, secondary, vocational, college, graduate studies',
    icon: GraduationCap,
  },
  {
    id: 'civil-service',
    title: 'Civil Service Eligibility',
    description: 'Government examinations and professional licenses',
    icon: Shield,
  },
  {
    id: 'work-experience',
    title: 'Work Experience',
    description: 'Employment history and positions held',
    icon: Briefcase,
  },
  {
    id: 'voluntary-work',
    title: 'Voluntary Work',
    description: 'Civic and non-government organization involvement',
    icon: Heart,
  },
  {
    id: 'learning-development',
    title: 'Learning & Development',
    description: 'Training programs and seminars attended',
    icon: BookOpen,
  },
  {
    id: 'other-info',
    title: 'Other Information',
    description: 'Special skills, recognition, organization membership',
    icon: Award,
  },
  {
    id: 'references',
    title: 'References',
    description: 'Character references (not relatives)',
    icon: ListChecks,
  },
];

// Memoized Components
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 px-4">
      <BlurFade delay={0.1}>
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 blur-xl" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <FileText className="h-10 w-10 text-primary" />
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Start Your Personal Data Sheet
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The Personal Data Sheet (e-PDS) is a comprehensive record of your
            personal, educational, and professional information required by the
            Civil Service Commission.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.3}>
        <Link href="/dashboard/pds/create">
          <ShimmerButton className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First PDS
          </ShimmerButton>
        </Link>
      </BlurFade>
    </div>
  );
});

// Stats Card Component - Modern, minimal design
const StatsCard = memo(function StatsCard({
  title,
  value,
  suffix,
  icon: Icon,
  delay,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  delay: number;
}) {
  return (
    <BlurFade delay={delay}>
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-0.5">
            <NumberTicker
              value={value}
              className="text-2xl font-bold text-slate-900 dark:text-slate-100"
            />
            {suffix && (
              <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {suffix}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
});

// Submission Card Component
const SubmissionCard = memo(function SubmissionCard({
  submission,
  index,
  onView,
  onDownload,
  isGenerating,
}: {
  submission: PDSSubmission;
  index: number;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  isGenerating: boolean;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          label: 'Approved',
          className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          label: 'Rejected',
          className: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
        };
      case 'reviewing':
        return {
          icon: Eye,
          label: 'Under Review',
          className: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-900/50',
        };
      case 'submitted':
        return {
          icon: Send,
          label: 'Submitted',
          className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
        };
      default:
        return {
          icon: Clock,
          label: 'Draft',
          className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
        };
    }
  };

  const config = getStatusConfig(submission.status);
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    PDS {submission.year}
                  </h4>
                  <Badge className={cn('text-xs px-2 py-0.5 border', config.className)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Updated {new Date(submission.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => onView(submission.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {submission.status === 'approved' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => onDownload(submission.id)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Section Card Component
const SectionCard = memo(function SectionCard({
  section,
  index,
}: {
  section: PDSSection;
  index: number;
}) {
  const IconComponent = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
          <IconComponent className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {section.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {section.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// Main Component
export default function PDSPage() {
  const { user } = useAuth();
  
  // Use real data hooks instead of mock data
  const { data: pdsResponse, isLoading, error: pdsError } = usePDSSubmissions();
  const { deadline } = useDeadlineForForm('pds');
  const { downloadPDF, openPDFInNewTab, isGenerating } = usePDSPdf();

  // Track which submission is being downloaded
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Extract submissions from the response
  const submissions = useMemo(() => {
    if (!pdsResponse?.data) return [];
    return pdsResponse.data;
  }, [pdsResponse]);

  const hasExistingPDS = submissions.length > 0;
  const latest = submissions[0] ?? null;

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!hasExistingPDS) {
      return {
        totalSubmissions: 0,
        pendingReviews: 0,
        approvalRate: 0,
        rejected: 0,
      };
    }

    const totalSubmissions = submissions.length;
    const approvedCount = submissions.filter((s: any) => s.status === 'approved').length;
    const pendingReviews = submissions.filter(
      (s: any) => s.status === 'submitted' || s.status === 'reviewing'
    ).length;
    const rejected = submissions.filter((s: any) => s.status === 'rejected').length;

    const approvalRate =
      totalSubmissions > 0
        ? Math.round((approvedCount / totalSubmissions) * 100)
        : 0;

    return {
      totalSubmissions,
      pendingReviews,
      approvalRate,
      rejected,
    };
  }, [hasExistingPDS, submissions]);

  // Check if PDF download/print is allowed (only when approved)
  const canDownloadPDF = latest?.status === 'approved';

  // Get status-specific message for PDF restriction
  const getPdfRestrictionMessage = useCallback(() => {
    switch (latest?.status) {
      case 'draft':
        return 'Please submit your PDS for approval first';
      case 'submitted':
      case 'reviewing':
        return 'PDF will be available after admin approval';
      case 'rejected':
        return 'Please address feedback and resubmit for approval';
      default:
        return 'PDF available after admin approval';
    }
  }, [latest?.status]);

  // Handler for downloading the latest PDS as PDF
  const handleDownloadPDF = useCallback(async () => {
    if (!latest) {
      toast.error('No PDS available', {
        description: 'Please create a PDS first.',
      });
      return;
    }

    try {
      setDownloadingId(latest.id);
      toast.loading('Preparing PDF...', { id: 'pds-pdf-download' });

      // Fetch complete PDS data
      const response = await fetch(`/api/pds/${latest.id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDS data');
      }

      const result = await response.json();
      const pdsData = result.data;

      // Transform to PDF format
      const pdfReadyData = transformPdsForPdf(pdsData);

      // Generate and download PDF
      await downloadPDF(pdfReadyData);

      toast.success('PDS PDF downloaded successfully', {
        id: 'pds-pdf-download',
        description: `PDS for CY ${pdsData.year || 'N/A'} has been downloaded.`,
      });
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF', {
        id: 'pds-pdf-download',
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setDownloadingId(null);
    }
  }, [latest, downloadPDF]);

  // Handler for printing the latest PDS
  const handlePrintPDS = useCallback(async () => {
    if (!latest) {
      toast.error('No PDS available', {
        description: 'Please create a PDS first.',
      });
      return;
    }

    try {
      setDownloadingId(latest.id);
      toast.loading('Preparing PDF for print...', { id: 'pds-pdf-print' });

      // Fetch complete PDS data
      const response = await fetch(`/api/pds/${latest.id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDS data');
      }

      const result = await response.json();
      const pdsData = result.data;

      // Transform to PDF format
      const pdfReadyData = transformPdsForPdf(pdsData);

      // Open PDF in new tab for printing
      await openPDFInNewTab(pdfReadyData);

      toast.success('PDF opened in new tab', {
        id: 'pds-pdf-print',
        description: 'Use your browser\'s print function to print the PDF.',
      });
    } catch (err) {
      console.error('PDF print error:', err);
      toast.error('Failed to open PDF', {
        id: 'pds-pdf-print',
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setDownloadingId(null);
    }
  }, [latest, openPDFInNewTab]);

  // View submission handler
  const handleViewSubmission = useCallback((id: string) => {
    window.location.href = `/dashboard/pds/view/${id}`;
  }, []);

  // Download submission handler - directly downloads PDF like SALN page
  const handleDownloadSubmission = useCallback(async (id: string) => {
    if (isGenerating || downloadingId) return;

    try {
      setDownloadingId(id);
      toast.loading('Preparing PDF...', { id: 'pds-pdf-download' });

      // Fetch complete PDS data
      const response = await fetch(`/api/pds/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDS data');
      }

      const result = await response.json();
      const pdsData = result.data;

      // Transform to PDF format
      const pdfReadyData = transformPdsForPdf(pdsData);

      // Generate and download PDF
      await downloadPDF(pdfReadyData);

      toast.success('PDS PDF downloaded successfully', {
        id: 'pds-pdf-download',
        description: `PDS for CY ${pdsData.year || 'N/A'} has been downloaded.`,
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF', {
        id: 'pds-pdf-download',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setDownloadingId(null);
    }
  }, [downloadPDF, isGenerating, downloadingId]);

  // Memoized status badge renderer
  const getStatusBadge = useCallback(
    (status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reviewing') => {
      const variants = {
        draft: {
          icon: Clock,
          label: 'Draft',
          className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
        },
        submitted: {
          icon: Send,
          label: 'Submitted',
          className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
        },
        reviewing: {
          icon: Eye,
          label: 'Under Review',
          className: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-900/50',
        },
        approved: {
          icon: CheckCircle2,
          label: 'Approved',
          className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
        },
        rejected: {
          icon: AlertCircle,
          label: 'Rejected',
          className: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
        },
      };

      const config = variants[status] || variants.draft;
      const IconComponent = config.icon;

      return (
        <Badge className={cn('font-medium px-3 py-1.5 text-sm border', config.className)}>
          <IconComponent className="h-3.5 w-3.5 mr-1.5" />
          {config.label}
        </Badge>
      );
    },
    []
  );

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-primary" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading PDS data...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (pdsError) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 mx-auto">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Error Loading PDS
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {pdsError instanceof Error ? pdsError.message : 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <AnimatedGradientText className="text-2xl sm:text-3xl font-bold">
              Personal Data Sheet (e-PDS)
            </AnimatedGradientText>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage your personal information required by the Civil Service Commission
            </p>
          </div>
          {latest && (
            <div className="flex items-center gap-3">
              {getStatusBadge(latest.status)}
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 dark:text-slate-400">Last updated</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {new Date(latest.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </BlurFade>

      {/* Empty State */}
      {!hasExistingPDS ? (
        <EmptyState />
      ) : (
        <>
          {/* Deadline Section */}
          <DeadlineSection formType="pds" />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Submissions"
              value={stats.totalSubmissions}
              icon={FileText}
              delay={0.15}
            />
            <StatsCard
              title="Pending Reviews"
              value={stats.pendingReviews}
              icon={Clock}
              delay={0.2}
            />
            <BlurFade delay={0.25}>
              <Card className="border border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                      <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-1">
                    Needs Revision
                  </p>
                  <div className="flex items-baseline gap-0.5">
                    <NumberTicker
                      value={stats.rejected}
                      className="text-2xl font-bold text-rose-900 dark:text-rose-100"
                    />
                  </div>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-2">
                    Submissions requiring changes
                  </p>
                </CardContent>
              </Card>
            </BlurFade>
            <StatsCard
              title="Approval Rate"
              value={stats.approvalRate}
              suffix="%"
              icon={CheckCircle2}
              delay={0.3}
            />
          </div>

          {/* Quick Actions */}
          <BlurFade delay={0.35}>
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Sparkles className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Quick Actions
                  </h3>
                </div>

                {/* Rejected Submissions Alert */}
                {stats.rejected > 0 && (
                  <div className="mb-4">
                    <Link
                      href="/dashboard/pds/submissions?filter=rejected"
                      className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors group"
                    >
                      <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
                          Revise Rejected Submissions
                        </p>
                        <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                          {stats.rejected} submission{stats.rejected !== 1 ? 's' : ''} need{stats.rejected === 1 ? 's' : ''} your attention
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <Link href="/dashboard/pds/create" className="w-full">
                    <ShimmerButton className="w-full h-10 text-sm gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Create New</span>
                      <span className="sm:hidden">New</span>
                    </ShimmerButton>
                  </Link>

                  <Link href="/dashboard/pds/submissions" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full h-10 text-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">View All</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </Link>

                  <Link href="/dashboard/pds/archive" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full h-10 text-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </Link>

                  <Tooltip content={getPdfRestrictionMessage()} disabled={canDownloadPDF}>
                    <Button
                      onClick={canDownloadPDF ? handleDownloadPDF : undefined}
                      disabled={downloadingId !== null || isGenerating || !latest || !canDownloadPDF}
                      variant="outline"
                      className={cn(
                        'w-full h-10 text-sm border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
                        canDownloadPDF && 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      {(downloadingId === latest?.id || isGenerating) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">PDF</span>
                    </Button>
                  </Tooltip>

                  <Tooltip content={getPdfRestrictionMessage()} disabled={canDownloadPDF}>
                    <Button
                      onClick={canDownloadPDF ? handlePrintPDS : undefined}
                      disabled={downloadingId !== null || isGenerating || !latest || !canDownloadPDF}
                      variant="outline"
                      className={cn(
                        'w-full h-10 text-sm border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed',
                        canDownloadPDF && 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      {(downloadingId === latest?.id || isGenerating) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4 mr-2" />
                      )}
                      Print
                    </Button>
                  </Tooltip>
                </div>

                {/* PDF Restriction Notice */}
                {!canDownloadPDF && latest && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mt-3">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>{getPdfRestrictionMessage()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </BlurFade>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Current Status & Submissions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Status Card */}
              {latest && (
                <BlurFade delay={0.4}>
                  <div className="relative">
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
                      <BorderBeam
                        size={200}
                        duration={10}
                        colorFrom="var(--primary)"
                        colorTo="var(--tup-crimson-dark)"
                      />

                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <FileCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            Current Status
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(latest.status)}
                            {latest.status === 'reviewing' && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                              </motion.div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              PDS {latest.year}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(latest.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {latest.status === 'draft' &&
                              'Continue editing and submit for review when ready.'}
                            {latest.status === 'submitted' &&
                              'Your PDS has been submitted. HR will review it shortly.'}
                            {latest.status === 'reviewing' &&
                              'Your PDS is under review. You will be notified once complete.'}
                            {latest.status === 'approved' &&
                              'Congratulations! Your PDS has been approved. You can download or print it.'}
                            {latest.status === 'rejected' &&
                              'Your PDS requires revisions. Please review the feedback and resubmit.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </BlurFade>
              )}

              {/* Recent Submissions */}
              <BlurFade delay={0.45}>
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          Recent Submissions
                        </h3>
                      </div>
                      <Link href="/dashboard/pds/submissions">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                          View All
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {submissions.slice(0, 5).map((submission: any, index: number) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          index={index}
                          onView={handleViewSubmission}
                          onDownload={handleDownloadSubmission}
                          isGenerating={isGenerating}
                        />
                      ))}
                    </div>

                    {submissions.length === 0 && (
                      <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                        No submissions yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </BlurFade>
            </div>

            {/* Right Column - PDS Sections */}
            <div className="lg:col-span-1">
              <BlurFade delay={0.5}>
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm lg:sticky lg:top-6">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <ListChecks className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        PDS Sections
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {PDS_SECTIONS.map((section, index) => (
                        <SectionCard key={section.id} section={section} index={index} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
