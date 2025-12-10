'use client';

import React, { memo } from 'react';
import { BlurFade, NumberTicker } from '@tupsafe/shared-ui';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileEdit, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsSectionProps {
  total: number;
  draftCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface StatsCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'slate' | 'amber' | 'blue' | 'emerald' | 'rose';
  delay?: number;
}

const StatsCard = memo(
  ({ label, value, icon: Icon, color, delay = 0 }: StatsCardProps) => {
    const bgColorClasses = {
      slate: 'bg-slate-50 dark:bg-slate-950/20',
      amber: 'bg-amber-50 dark:bg-amber-950/20',
      blue: 'bg-blue-50 dark:bg-blue-950/20',
      emerald: 'bg-emerald-50 dark:bg-emerald-950/20',
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
                    color === 'slate' && 'text-slate-600 dark:text-slate-500',
                    color === 'amber' && 'text-amber-600 dark:text-amber-500',
                    color === 'blue' && 'text-blue-600 dark:text-blue-500',
                    color === 'emerald' && 'text-emerald-600 dark:text-emerald-500',
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
    total,
    draftCount,
    pendingCount,
    approvedCount,
    rejectedCount,
  }: StatsSectionProps) => {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatsCard
          label="Total"
          value={total}
          icon={FileText}
          color="slate"
          delay={0.1}
        />
        <StatsCard
          label="Drafts"
          value={draftCount}
          icon={FileEdit}
          color="amber"
          delay={0.15}
        />
        <StatsCard
          label="Pending"
          value={pendingCount}
          icon={Clock}
          color="blue"
          delay={0.2}
        />
        <StatsCard
          label="Approved"
          value={approvedCount}
          icon={CheckCircle2}
          color="emerald"
          delay={0.25}
        />
        <StatsCard
          label="Rejected"
          value={rejectedCount}
          icon={XCircle}
          color="rose"
          delay={0.3}
        />
      </div>
    );
  }
);

StatsSection.displayName = 'StatsSection';
