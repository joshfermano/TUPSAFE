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

export function InfoCard({ title, icon: Icon, children, className, gradient = false }: InfoCardProps) {
  return (
    <MagicCard
      className={cn(
        "relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 group",
        gradient && "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
        className
      )}
      gradientColor={gradient ? "#60a5fa" : undefined}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-800">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          gradient
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
            : "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {children}
      </div>
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
        <Icon className="h-5 w-5 mt-0.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          {label}
        </p>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 break-words">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}
