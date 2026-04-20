/**
 * Registration Statistics Cards
 *
 * Displays key registration metrics with color-coded indicators and trend data.
 * Cards show pending count, approved this week, rejected, and average approval time.
 * Uses inline styles for theme-aware colors to avoid Tailwind v4 specificity issues.
 */

'use client';

import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import type { RegistrationStats } from '@/lib/api/registrations';

/** Theme-aware icon colors for each stat card category */
const iconThemeStyles = {
  pending: {
    light: { bg: '#dbeafe', color: '#1e40af' },   // blue-100, blue-800
    dark: { bg: '#1e3a8a', color: '#bfdbfe' },     // blue-900, blue-200
  },
  approved: {
    light: { bg: '#dcfce7', color: '#166534' },    // green-100, green-800
    dark: { bg: '#14532d', color: '#bbf7d0' },     // green-900, green-200
  },
  rejected: {
    light: { bg: '#fee2e2', color: '#991b1b' },    // red-100, red-800
    dark: { bg: '#7f1d1d', color: '#fecaca' },     // red-900, red-200
  },
  average: {
    light: { bg: '#f3e8ff', color: '#6b21a8' },    // purple-100, purple-800
    dark: { bg: '#581c87', color: '#e9d5ff' },     // purple-900, purple-200
  },
} as const;

type IconCategory = keyof typeof iconThemeStyles;

interface RegistrationStatsCardsProps {
  stats: RegistrationStats | undefined;
  isLoading: boolean;
}

export function RegistrationStatsCards({ stats, isLoading }: RegistrationStatsCardsProps) {
  const isDark = useIsDarkMode();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const isPendingUrgent = stats.pending > 10;

  const cards: Array<{
    title: string;
    value: number | string;
    description: string;
    icon: typeof FileText;
    category: IconCategory;
    urgent?: boolean;
    trend?: string;
  }> = [
    {
      title: 'Pending Registrations',
      value: stats.pending,
      description: isPendingUrgent ? 'Requires immediate attention' : 'Awaiting review',
      icon: FileText,
      category: 'pending',
      urgent: isPendingUrgent,
    },
    {
      title: 'Approved This Week',
      value: stats.approved.thisWeek,
      description: `${stats.approved.total} total approved`,
      icon: CheckCircle,
      category: 'approved',
      trend: stats.approved.thisWeek > 0 ? 'up' : undefined,
    },
    {
      title: 'Rejected This Month',
      value: stats.rejected.thisMonth,
      description: `${stats.rejected.total} total rejected`,
      icon: XCircle,
      category: 'rejected',
    },
    {
      title: 'Avg Approval Time',
      value: stats.averageApprovalTime,
      description: `${stats.averageApprovalTimeHours.toFixed(1)} hours average`,
      icon: Clock,
      category: 'average',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const theme = isDark ? iconThemeStyles[card.category].dark : iconThemeStyles[card.category].light;
        return (
          <Card
            key={index}
            className={cn(
              'transition-all hover:shadow-md',
              card.urgent && 'border-orange-500 ring-2 ring-orange-500/20'
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: theme.bg }}
              >
                <Icon className="h-4 w-4" style={{ color: theme.color }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.trend === 'up' && (
                  <div className="flex items-center text-xs text-green-600">
                    <span className="font-medium">↑ Active</span>
                  </div>
                )}
                {card.urgent && (
                  <div className="flex items-center text-xs text-orange-600">
                    <span className="font-medium">! Urgent</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
