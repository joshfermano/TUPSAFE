/**
 * Registration Statistics Cards
 *
 * Displays key registration metrics with color-coded indicators and trend data.
 * Cards show pending count, approved this week, rejected, and average approval time.
 */

'use client';

import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { RegistrationStats } from '@/lib/api/registrations';

interface RegistrationStatsCardsProps {
  stats: RegistrationStats | undefined;
  isLoading: boolean;
}

export function RegistrationStatsCards({ stats, isLoading }: RegistrationStatsCardsProps) {
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

  const cards = [
    {
      title: 'Pending Registrations',
      value: stats.pending,
      description: isPendingUrgent ? 'Requires immediate attention' : 'Awaiting review',
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      urgent: isPendingUrgent,
    },
    {
      title: 'Approved This Week',
      value: stats.approved.thisWeek,
      description: `${stats.approved.total} total approved`,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      trend: stats.approved.thisWeek > 0 ? 'up' : undefined,
    },
    {
      title: 'Rejected This Month',
      value: stats.rejected.thisMonth,
      description: `${stats.rejected.total} total rejected`,
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBgColor: 'bg-red-100',
    },
    {
      title: 'Avg Approval Time',
      value: stats.averageApprovalTime,
      description: `${stats.averageApprovalTimeHours.toFixed(1)} hours average`,
      icon: Clock,
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
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
              <div className={cn('p-2 rounded-full', card.iconBgColor)}>
                <Icon className={cn('h-4 w-4', card.iconColor)} />
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
                    <span className="font-medium">⚠ Urgent</span>
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
