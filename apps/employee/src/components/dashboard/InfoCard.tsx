'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function InfoCard({
  title,
  icon: Icon,
  children,
  className,
  gradient = false,
}: InfoCardProps) {
  return (
    <MagicCard
      gradientSize={0}
      gradientColor="#093FB4"
      gradientOpacity={0}
      gradientFrom="#093FB4"
      gradientTo="#8B1538"
      className={cn(
        'h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300',
        className
      )}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
            gradient
              ? 'bg-gradient-to-br from-[#093FB4] to-[#0066B3] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-[#093FB4] dark:text-[#0066B3]'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      </div>

      {/* Card Content */}
      <div className="px-6 pb-6">{children}</div>
    </MagicCard>
  );
}

interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

export function InfoItem({ label, value, icon: Icon }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          {label}
        </p>
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100 break-words">
          {value || '—'}
        </div>
      </div>
    </div>
  );
}
