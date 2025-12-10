'use client';

import React, { memo } from 'react';
import { BlurFade, NumberTicker } from '@tupsafe/shared-ui';
import { Card, CardContent } from '@/components/ui/card';
import { FileEdit, Clock, Eye, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsSectionProps {
  totalPending: number;
  submittedCount: number;
  reviewingCount: number;
}

interface StatsCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'amber' | 'blue' | 'purple' | 'rose';
  delay?: number;
}

const StatsCard = memo(
  ({ label, value, icon: Icon, color, delay = 0 }: StatsCardProps) => {
    const bgColorClasses = {
      amber: 'bg-amber-50 dark:bg-amber-950/20',
      blue: 'bg-blue-50 dark:bg-blue-950/20',
      purple: 'bg-purple-50 dark:bg-purple-950/20',
      rose: 'bg-rose-50 dark:bg-rose-950/20',
    };

    return (
      <BlurFade delay={delay}>
        <Card className="relative overflow-hidden h-full transition-all duration-200 hover:shadow-md hover:border-[oklch(0.55_0.22_15)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {label}
                </p>
                <div className="text-2xl font-bold bg-gradient-to-r from-[oklch(0.55_0.22_15)] to-[oklch(0.65_0.22_15)] bg-clip-text text-transparent">
                  <NumberTicker value={value} />
                </div>
              </div>
              <div
                className={cn(
                  'p-2.5 rounded-full',
                  bgColorClasses[color]
                )}>
                <Icon
                  className={cn(
                    'h-5 w-5',
                    color === 'amber' && 'text-amber-600 dark:text-amber-500',
                    color === 'blue' && 'text-blue-600 dark:text-blue-500',
                    color === 'purple' && 'text-purple-600 dark:text-purple-500',
                    color === 'rose' && 'text-rose-600 dark:text-rose-500'
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export const StatsSection = memo(
  ({
    totalPending,
    submittedCount,
    reviewingCount,
  }: StatsSectionProps) => {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
        <StatsCard
          label="Total Pending"
          value={totalPending}
          icon={Eye}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          label="Submitted"
          value={submittedCount}
          icon={Clock}
          color="blue"
          delay={0.15}
        />
        <StatsCard
          label="Reviewing"
          value={reviewingCount}
          icon={Clock}
          color="purple"
          delay={0.2}
        />
      </div>
    );
  }
);

StatsSection.displayName = 'StatsSection';
