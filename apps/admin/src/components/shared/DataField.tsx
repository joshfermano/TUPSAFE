'use client';

import { cn } from '@/lib/utils';

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DataField({ label, value, className }: DataFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value || '—'}</dd>
    </div>
  );
}
