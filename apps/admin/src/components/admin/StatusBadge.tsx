import { memo } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

interface StatusColors {
  bg: string;
  text: string;
  border: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    light: StatusColors;
    dark: StatusColors;
    pulse?: boolean;
  }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    light: { bg: '#e2e8f0', text: '#475569', border: '#94a3b8' },
    dark: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
  },
  submitted: {
    label: 'Submitted',
    icon: Clock,
    light: { bg: '#bfdbfe', text: '#1e3a8a', border: '#60a5fa' },
    dark: { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd', border: 'rgba(59,130,246,0.4)' },
  },
  reviewing: {
    label: 'Reviewing',
    icon: Eye,
    pulse: true,
    light: { bg: '#fef08a', text: '#713f12', border: '#facc15' },
    dark: { bg: 'rgba(234,179,8,0.15)', text: '#fde047', border: 'rgba(234,179,8,0.4)' },
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    light: { bg: '#bbf7d0', text: '#14532d', border: '#4ade80' },
    dark: { bg: 'rgba(34,197,94,0.15)', text: '#86efac', border: 'rgba(34,197,94,0.4)' },
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    light: { bg: '#fecaca', text: '#7f1d1d', border: '#f87171' },
    dark: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.4)' },
  },
  active: {
    label: 'Active',
    icon: UserCheck,
    light: { bg: '#bbf7d0', text: '#14532d', border: '#4ade80' },
    dark: { bg: 'rgba(34,197,94,0.15)', text: '#86efac', border: 'rgba(34,197,94,0.4)' },
  },
  inactive: {
    label: 'Inactive',
    icon: UserX,
    light: { bg: '#e2e8f0', text: '#64748b', border: '#cbd5e1' },
    dark: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
  },
};

export type StatusType = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge = memo(function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const isDark = useIsDarkMode();
  const config = statusConfig[status];
  if (!config) return null;

  const colors = isDark ? config.dark : config.light;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        config.pulse && 'animate-pulse',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
