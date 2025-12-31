'use client';

/**
 * SALN Dashboard Page - Clean & Minimalistic Design
 *
 * Design Principles:
 * - Clean, minimalistic layout with no heavy backgrounds
 * - Modern & premium feel with subtle hover effects
 * - Compact & space-efficient design
 * - TUP Manila branding with subtle red accents
 * - Optimized performance with minimal animations
 *
 * Performance Optimizations:
 * - React.memo for all components
 * - useMemo for calculations
 * - useCallback for event handlers
 * - Real API data via React Query hooks
 */

import { useMemo, memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../providers/AuthProvider';
import { useSALNSubmissions } from '../../../hooks/useSALN';
import { useSALNPdf } from '../../../hooks/useSALNPdf';
import type { SALNData } from '../../../components/saln/pdf';
import { toast } from 'sonner';
import { DeadlineSection } from '../../../components/dashboard/DeadlineSection';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import { EmployeeOnlyGuard } from '../../../components/guards/EmployeeOnlyGuard';

// Import minimal MagicUI components
import { BlurFade, NumberTicker, ShimmerButton } from '@tupsafe/shared-ui';

import {
  Landmark,
  Home,
  Car,
  Wallet,
  CreditCard,
  Building2,
  TrendingUp,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Plus,
  Edit,
  Send,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  FileEdit,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// Types for UI display
interface SALNSection {
  id: string;
  title: string;
  description: string;
  amount: number;
  isComplete: boolean;
  icon: LucideIcon;
  items: number;
}

interface ActivityItem {
  id: string;
  action: string;
  section?: string;
  date: Date;
  type: 'create' | 'update' | 'submit' | 'approve';
}

interface YearSummary {
  year: number;
  netWorth: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

// Currency formatter - created once outside component
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Helper functions to calculate section totals from real data
const calculateRealPropertyTotal = (properties: any[] | undefined | null): number => {
  if (!properties || !Array.isArray(properties)) return 0;
  return properties.reduce((sum, prop) => sum + (Number(prop.currentFairMarketValue) || 0), 0);
};

const calculatePersonalPropertyTotal = (properties: any[] | undefined | null): number => {
  if (!properties || !Array.isArray(properties)) return 0;
  return properties.reduce((sum, prop) => sum + (Number(prop.acquisitionCost) || 0), 0);
};

const calculateLiabilitiesTotal = (liabilities: any[] | undefined | null): number => {
  if (!liabilities || !Array.isArray(liabilities)) return 0;
  return liabilities.reduce((sum, liab) => sum + (Number(liab.outstandingBalance) || 0), 0);
};

const calculateBusinessInterestsCount = (interests: any[] | undefined | null): number => {
  if (!interests || !Array.isArray(interests)) return 0;
  return interests.length;
};

// Stats Card Component - Modern, minimal design
const StatsCard = memo(function StatsCard({
  title,
  value,
  icon: Icon,
  delay,
}: {
  title: string;
  value: number;
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
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
});

// Memoized EmptyState component
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
            Start Your SALN Statement
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The Statement of Assets, Liabilities, and Net Worth (e-SALN) is a comprehensive
            declaration required annually to promote transparency and accountability.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.3}>
        <Link href="/dashboard/saln/create">
          <ShimmerButton className="gap-2">
            <Plus className="h-4 w-4" />
            Create New SALN
          </ShimmerButton>
        </Link>
      </BlurFade>
    </div>
  );
});

export default function SalnPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, profile } = useAuth();

  // Use real hooks for SALN data (matching PDS pattern)
  const { data: submissionsResponse, isLoading, error: submissionsError } = useSALNSubmissions();

  // PDF generation hook
  const { downloadPDF, openPDFInNewTab, isGenerating } = useSALNPdf();

  // State for tracking download
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Extract submissions from response (like PDS does)
  const submissions = useMemo(() => {
    if (!submissionsResponse?.data) return [];
    return submissionsResponse.data;
  }, [submissionsResponse]);

  // Derive latest from submissions array (like PDS does - no separate API call)
  const latest = submissions[0] ?? null;
  const hasExistingSALN = submissions.length > 0;

  // Loading state (only from submissions query, like PDS)
  const loading = isLoading;
  const error = submissionsError?.message || null;

  // Memoized currency formatter
  const formatCurrency = useCallback((amount: number) => {
    return CURRENCY_FORMATTER.format(amount);
  }, []);

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

  // Memoized activity icon getter
  const getActivityIcon = useCallback((type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return Plus;
      case 'update':
        return Edit;
      case 'submit':
        return Send;
      case 'approve':
        return CheckCircle2;
      default:
        return Landmark;
    }
  }, []);

  // Calculate SALN sections from latest real data
  const salnSections = useMemo((): SALNSection[] => {
    if (!latest) return [];

    const realPropertyTotal = calculateRealPropertyTotal(latest.realProperties);
    const personalPropertyTotal = calculatePersonalPropertyTotal(latest.personalProperties);
    const liabilitiesTotal = calculateLiabilitiesTotal(latest.liabilities);
    const businessInterestsCount = calculateBusinessInterestsCount(latest.businessInterests);

    // Calculate cash & investments as part of total assets minus real and personal property
    const totalAssets = Number(latest.totalAssets) || 0;
    const cashInvestments = Math.max(0, totalAssets - realPropertyTotal - personalPropertyTotal);

    return [
      {
        id: 'real-property',
        title: 'Real Property',
        description: 'Land, buildings, and improvements',
        amount: realPropertyTotal,
        isComplete: (latest.realProperties?.length || 0) > 0,
        icon: Home,
        items: latest.realProperties?.length || 0,
      },
      {
        id: 'personal-property',
        title: 'Personal Property',
        description: 'Vehicles, jewelry, and other valuables',
        amount: personalPropertyTotal,
        isComplete: (latest.personalProperties?.length || 0) > 0,
        icon: Car,
        items: latest.personalProperties?.length || 0,
      },
      {
        id: 'cash-investments',
        title: 'Cash & Investments',
        description: 'Bank deposits, stocks, bonds',
        amount: cashInvestments,
        isComplete: cashInvestments > 0,
        icon: Wallet,
        items: cashInvestments > 0 ? 1 : 0,
      },
      {
        id: 'liabilities',
        title: 'Liabilities',
        description: 'Loans, mortgages, and other debts',
        amount: liabilitiesTotal,
        isComplete: (latest.liabilities?.length || 0) > 0,
        icon: CreditCard,
        items: latest.liabilities?.length || 0,
      },
      {
        id: 'business-interests',
        title: 'Business Interests',
        description: 'Financial interests in businesses',
        amount: 0,
        isComplete: businessInterestsCount === 0,
        icon: Building2,
        items: businessInterestsCount,
      },
    ];
  }, [latest]);

  // Calculate recent activity from submissions history
  const recentActivity = useMemo((): ActivityItem[] => {
    if (submissions.length === 0) return [];

    return submissions.slice(0, 3).map((s: any, index: number) => {
      let action = '';
      let section: string | undefined = undefined;
      let type: ActivityItem['type'] = 'update';

      if (s.status === 'approved') {
        action = `SALN ${s.year} approved`;
        type = 'approve';
      } else if (s.status === 'submitted') {
        action = `Submitted SALN ${s.year} for review`;
        type = 'submit';
      } else if (index === 0 && s.status === 'draft') {
        action = `Created SALN for ${s.year}`;
        type = 'create';
      } else {
        action = `Updated SALN ${s.year}`;
        section = 'Various sections';
        type = 'update';
      }

      return {
        id: s.id,
        action,
        section,
        date: new Date(s.updatedAt),
        type,
      };
    });
  }, [submissions]);

  // Calculate year summaries from all submissions
  const yearSummaries = useMemo((): YearSummary[] => {
    return submissions
      .sort((a: any, b: any) => b.year - a.year)
      .slice(0, 3)
      .map((s: any) => ({
        year: s.year,
        netWorth: Number(s.netWorth) || 0,
        status: s.status as 'draft' | 'submitted' | 'approved' | 'rejected',
      }));
  }, [submissions]);

  // Calculate statistics from real data - MUST be before early returns
  const stats = useMemo(() => {
    if (!hasExistingSALN) {
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
  }, [hasExistingSALN, submissions]);

  // Memoize net worth calculation
  const netWorthChange = useMemo(() => {
    if (submissions.length < 2) return null;
    const sorted = [...submissions].sort((a: any, b: any) => b.year - a.year);
    const currentYear = sorted[0];
    const previousYear = sorted[1];
    const currentNetWorth = Number(currentYear.netWorth);
    const previousNetWorth = Number(previousYear.netWorth);
    const change = currentNetWorth - previousNetWorth;
    const percentChange = (change / previousNetWorth) * 100;
    return { change, percentChange, isPositive: change >= 0 };
  }, [submissions]);

  // Transform submission data to SALNData format for PDF
  const transformSALNToData = useCallback(
    (submission: any): SALNData => {
      return {
        id: submission.id,
        year: submission.year,
        filingType: submission.filingType || 'not_applicable',
        declarantInfo: {
          surname: profile?.lastName || '',
          firstName: profile?.firstName || '',
          middleInitial: profile?.middleName || null,
          position: submission.position || '',
          agency:
            submission.agency ||
            'Technological University of the Philippines - Manila',
          officeAddress: submission.officeAddress || '',
        },
        spouseInfo:
          submission.filingType === 'joint' && submission.spouseName
            ? {
                surname: submission.spouseName?.split(' ').pop() || '',
                firstName: submission.spouseName?.split(' ')[0] || '',
                middleInitial: submission.spouseName?.split(' ')[1]?.charAt(0) || null,
                position: '',
                agency: '',
                officeAddress: '',
              }
            : undefined,
        children: [],
        realProperties: submission.realProperties || [],
        personalProperties: submission.personalProperties || [],
        liabilities: submission.liabilities || [],
        businessInterests:
          submission.businessInterests?.map((bi: any) => ({
            entityName: bi.businessName || bi.entityName || '',
            businessAddress: bi.businessAddress || '',
            natureOfBusiness: bi.nature || bi.natureOfBusiness || '',
            dateOfAcquisition: bi.dateAcquired || bi.dateOfAcquisition || '',
          })) || [],
        relativesInGov:
          submission.relativesInGov?.map((rel: any) => ({
            name: rel.name || '',
            relationship: rel.relationship || '',
            position: rel.position || '',
            agencyAddress: rel.agency || rel.agencyAddress || '',
          })) || [],
        totalAssets: parseFloat(submission.totalAssets || '0'),
        totalLiabilities: parseFloat(submission.totalLiabilities || '0'),
        netWorth: parseFloat(submission.netWorth || '0'),
      };
    },
    [profile]
  );

  // Handle download
  const handleDownload = useCallback(
    async (id: string) => {
      if (isGenerating || downloadingId) return;

      try {
        setDownloadingId(id);
        const submission = submissions.find((s: any) => s.id === id);
        if (!submission) {
          toast.error('Submission not found');
          return;
        }
        const salnPdfData = transformSALNToData(submission);
        await downloadPDF(salnPdfData);
        toast.success('SALN PDF downloaded successfully');
      } catch (error) {
        toast.error('Failed to generate PDF');
        console.error('PDF generation error:', error);
      } finally {
        setDownloadingId(null);
      }
    },
    [submissions, transformSALNToData, downloadPDF, isGenerating, downloadingId]
  );

  // Handle print
  const handlePrint = useCallback(
    async (id: string) => {
      if (isGenerating || downloadingId) return;

      try {
        setDownloadingId(id);
        const submission = submissions.find((s: any) => s.id === id);
        if (!submission) {
          toast.error('Submission not found');
          return;
        }
        const salnPdfData = transformSALNToData(submission);
        await openPDFInNewTab(salnPdfData);
        toast.success('Opening PDF for printing...');
      } catch (error) {
        toast.error('Failed to open PDF');
        console.error('PDF preview error:', error);
      } finally {
        setDownloadingId(null);
      }
    },
    [submissions, transformSALNToData, openPDFInNewTab, isGenerating, downloadingId]
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading SALN data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Error Loading SALN
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasExistingSALN) {
    return (
      <EmployeeOnlyGuard>
        <EmptyState />
      </EmployeeOnlyGuard>
    );
  }

  // Main content with existing SALN
  return (
    <EmployeeOnlyGuard>
      <div className="space-y-6 pb-8">
      {/* Page Header */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Statement of Assets, Liabilities, and Net Worth (e-SALN)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage your annual SALN declarations and compliance requirements
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

      {/* Deadline Section */}
      <DeadlineSection formType="saln" />

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
        <StatsCard
          title="Approved"
          value={stats.totalSubmissions - stats.rejected - stats.pendingReviews}
          icon={CheckCircle2}
          delay={0.25}
        />
        <StatsCard
          title="Approval Rate"
          value={stats.approvalRate}
          icon={TrendingUp}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Link href="/dashboard/saln/create" className="w-full">
                <ShimmerButton className="w-full h-10 text-sm gap-2">
                  <Plus className="h-4 w-4" />
                  Create New
                </ShimmerButton>
              </Link>
              <Link href="/dashboard/saln/view" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Eye className="h-4 w-4" />
                  View All
                </Button>
              </Link>
              <Link href="/dashboard/saln/pending" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Clock className="h-4 w-4" />
                  Pending
                </Button>
              </Link>
              <Link href="/dashboard/saln/drafts" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <FileEdit className="h-4 w-4" />
                  Drafts
                </Button>
              </Link>
              <Link href="/dashboard/saln/submissions" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Approved
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => latest && handleDownload(latest.id)}
                disabled={!latest || isGenerating}
                className="w-full h-10 text-sm gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGenerating && downloadingId === latest?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      {/* Latest Submission */}
      {latest && (
        <BlurFade delay={0.4}>
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Latest Submission
                </h3>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Landmark className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              SALN {latest.year}
                            </h4>
                            {getStatusBadge(latest.status)}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Updated {new Date(latest.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/saln/view/${latest.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {latest.status === 'approved' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(latest.id)}
                              disabled={isGenerating && downloadingId === latest.id}
                              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGenerating && downloadingId === latest.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrint(latest.id)}
                              disabled={isGenerating && downloadingId === latest.id}
                              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGenerating && downloadingId === latest.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Printer className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CardContent>
          </Card>
        </BlurFade>
      )}

      {/* Net Worth Overview Card */}
      <BlurFade delay={0.45}>
        <Card className="border-slate-200 dark:border-slate-800 hover:border-[oklch(0.55_0.22_15)] transition-colors">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {/* Net Worth */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <BarChart3 className="h-4 w-4" />
                  Net Worth
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ₱
                    <NumberTicker
                      value={latest ? Number(latest.netWorth) : 0}
                    />
                  </span>
                </div>
                {netWorthChange && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      netWorthChange.isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                    {netWorthChange.isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>
                      {netWorthChange.isPositive ? '+' : ''}
                      {formatCurrency(netWorthChange.change)} (
                      <NumberTicker
                        value={Math.abs(netWorthChange.percentChange)}
                        decimalPlaces={1}
                      />
                      %)
                    </span>
                  </div>
                )}
              </div>

              {/* Total Assets */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4" />
                  Total Assets
                </div>
                <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  ₱
                  <NumberTicker
                    value={latest ? Number(latest.totalAssets) : 0}
                  />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Real property, personal property, and investments
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CreditCard className="h-4 w-4" />
                  Total Liabilities
                </div>
                <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  ₱
                  <NumberTicker
                    value={latest ? Number(latest.totalLiabilities) : 0}
                  />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Loans, mortgages, and other obligations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      {/* SALN Categories Grid */}
      <BlurFade delay={0.5}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            SALN Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salnSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <section.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      {section.isComplete ? (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 text-xs border">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 px-2 py-0.5 text-xs border">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                      {section.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      {section.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        ₱<NumberTicker value={section.amount} />
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {section.items} {section.items === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </BlurFade>

      {/* Year Summaries and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Year Summaries */}
        <BlurFade delay={0.55} className="lg:col-span-2">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Historical Overview
                </h3>
              </div>
              <div className="space-y-4">
                {yearSummaries.map((summary) => (
                  <div
                    key={summary.year}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          SALN {summary.year}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          ₱<NumberTicker value={summary.netWorth} />
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(summary.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Recent Activity */}
        <BlurFade delay={0.6}>
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <ActivityIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {activity.action}
                        </p>
                        {activity.section && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {activity.section}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {activity.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    </div>
    </EmployeeOnlyGuard>
  );
}
