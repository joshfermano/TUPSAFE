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

import { useMemo, memo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../providers/AuthProvider';
import { useSALNSubmissions, useLatestSALN } from '../../../hooks/useSaln';
import { useDeadlineForForm } from '../../../hooks';
import { InfoCard } from '../../../components/dashboard/InfoCard';
import { DeadlineSection } from '../../../components/dashboard/DeadlineSection';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import { EmployeeOnlyGuard } from '../../../components/guards/EmployeeOnlyGuard';

// Import minimal MagicUI components
import { BlurFade, NumberTicker, AnimatedGradientText } from '@tupsafe/shared-ui';

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
  Archive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

// Memoized EmptyState component
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
      {/* Icon Container */}
      <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Landmark className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Text Content */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          No Active SALN Submissions
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You haven&apos;t created any Statement of Assets, Liabilities, and Net
          Worth in the last 5 years. Start a new submission or view your
          archived records.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link href="/dashboard/saln/create">
          <Button className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
            <Plus className="h-4 w-4" />
            Create New SALN
          </Button>
        </Link>
        <Link href="/dashboard/saln/archive">
          <Button variant="outline" className="gap-2">
            <Archive className="h-4 w-4" />
            View Archive
          </Button>
        </Link>
      </div>
    </div>
  );
});

export default function SalnPage() {
  const { user } = useAuth();

  // Use real hooks for SALN data
  const { data: submissionsResponse, isLoading, error: submissionsError } = useSALNSubmissions();
  const { data: latest, isLoading: isLatestLoading } = useLatestSALN();

  // Extract submissions from response
  const submissions = useMemo(() => submissionsResponse?.data || [], [submissionsResponse]);
  const hasExistingSALN = submissions.length > 0;

  // Combine loading states
  const loading = isLoading || isLatestLoading;
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
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Draft',
          className:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
        },
        submitted: {
          variant: 'default' as const,
          icon: Send,
          label: 'Submitted',
          className:
            'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
        },
        reviewing: {
          variant: 'default' as const,
          icon: Eye,
          label: 'Under Review',
          className:
            'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
        },
        approved: {
          variant: 'default' as const,
          icon: CheckCircle2,
          label: 'Approved',
          className:
            'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
        },
        rejected: {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Rejected',
          className: '',
        },
      };

      const config = variants[status] || variants.draft;
      const IconComponent = config.icon;

      return (
        <Badge
          variant={config.variant}
          className={cn('font-semibold', config.className)}>
          <IconComponent className="h-3 w-3 mr-1" />
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
            <div className="flex items-center gap-2 flex-wrap">
              <AnimatedGradientText className="text-2xl sm:text-3xl font-bold">
                e-SALN {latest?.year || new Date().getFullYear()}
              </AnimatedGradientText>
              {latest && getStatusBadge(latest.status)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Statement of Assets, Liabilities, and Net Worth
            </p>
          </div>
        </div>
      </BlurFade>

      {/* Deadline Section - Persistent */}
      <DeadlineSection formType="saln" />

      {/* Quick Actions */}
      <BlurFade delay={0.2}>
        <InfoCard title="Quick Actions" icon={Landmark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            <Link href="/dashboard/saln/view" className="w-full">
              <Button
                variant="outline"
                className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-[oklch(0.55_0.22_15)] transition-colors">
                <Eye className="h-3.5 w-3.5 mr-2" />
                View Submissions
              </Button>
            </Link>
            <Link href="/dashboard/saln/archive" className="w-full">
              <Button
                variant="outline"
                className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                <Archive className="h-3.5 w-3.5 mr-2" />
                View Archive
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
              <Download className="h-3.5 w-3.5 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors">
              <Printer className="h-3.5 w-3.5 mr-2" />
              Print SALN
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-[oklch(0.55_0.22_15)] transition-colors">
              <Send className="h-3.5 w-3.5 mr-2" />
              Submit for Review
            </Button>
          </div>
        </InfoCard>
      </BlurFade>

      {/* Net Worth Overview Card */}
      <BlurFade delay={0.3}>
        <Card className="border-slate-200 dark:border-slate-800 hover:border-[oklch(0.55_0.22_15)] transition-colors">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
      <BlurFade delay={0.4}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            SALN Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salnSections.map((section) => (
              <Card
                key={section.id}
                className="cursor-pointer hover:shadow-md hover:border-[oklch(0.55_0.22_15)] transition-all border-slate-200 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        'bg-white dark:bg-slate-800'
                      )}>
                      <section.icon
                        className={cn(
                          'h-5 w-5',
                          section.isComplete
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-red-500 dark:text-red-500'
                        )}
                      />
                    </div>
                    {section.isComplete ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-2 py-0.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 px-2 py-0.5 text-xs">
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
            ))}
          </div>
        </div>
      </BlurFade>

      {/* Year Summaries and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Year Summaries */}
        <BlurFade delay={0.5} className="lg:col-span-2">
          <InfoCard title="Historical Overview" icon={Calendar}>
            <div className="space-y-4">
              {yearSummaries.map((summary) => (
                <div
                  key={summary.year}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-tup-crimson-subtle to-tup-crimson-subtle dark:from-primary/50 dark:to-tup-crimson-dark/50">
                      <Calendar className="h-6 w-6 text-primary dark:text-tup-crimson-light" />
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
          </InfoCard>
        </BlurFade>

        {/* Recent Activity */}
        <BlurFade delay={0.6}>
          <InfoCard title="Recent Activity" icon={Clock}>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tup-crimson-subtle dark:bg-primary/30 flex-shrink-0">
                      <ActivityIcon className="h-4 w-4 text-primary dark:text-tup-crimson-light" />
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
          </InfoCard>
        </BlurFade>
      </div>
    </div>
    </EmployeeOnlyGuard>
  );
}
