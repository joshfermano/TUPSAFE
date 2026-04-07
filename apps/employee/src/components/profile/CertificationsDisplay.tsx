'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import {
  FileIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
} from '@radix-ui/react-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useCertifications } from '../../hooks/useCertifications';
import { MagicCard } from '../ui/magic-card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { groupCertificationsByYear } from '../../lib/utils/certification-grouping';
import type {
  ProfileCertificationData,
  CertificationFileData,
  CertificationVerificationStatus,
} from '@tupsafe/types';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format a date string (ISO/YYYY-MM-DD) as "MMM DD, YYYY"
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a byte count into a human-readable size string (KB / MB)
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Sub-components
// ============================================================================

const statusConfig: Record<
  CertificationVerificationStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
  }
> = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircledIcon,
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800',
  },
  rejected: {
    label: 'Rejected',
    icon: CrossCircledIcon,
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
};

function StatusBadge({
  status,
}: {
  status: CertificationVerificationStatus;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn('font-semibold gap-1.5', config.badgeClass)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function FileAttachment({ file }: { file: CertificationFileData }) {
  return (
    <a
      href={file.fileUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2',
        'bg-slate-50 dark:bg-slate-800/50 text-sm transition-colors',
        file.fileUrl
          ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
          : 'opacity-50 pointer-events-none'
      )}>
      <FileIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
      <span className="truncate text-slate-700 dark:text-slate-300 flex-1 min-w-0">
        {file.fileName}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
        {formatFileSize(file.sizeBytes)}
      </span>
      {file.fileUrl && (
        <DownloadIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      )}
    </a>
  );
}

function CertCard({ cert, index }: { cert: ProfileCertificationData; index: number }) {
  const dateRange = `${formatDate(cert.dateFrom)} - ${formatDate(cert.dateTo)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className="border-b border-slate-100 dark:border-slate-800 last:border-0 py-4 first:pt-0 last:pb-0">
      {/* Header: title + status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {cert.title}
        </h3>
        <StatusBadge status={cert.verificationStatus} />
      </div>

      {/* Meta details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
        <span>{dateRange}</span>
        {cert.hours !== null && cert.hours > 0 && (
          <span>{cert.hours} hour{cert.hours !== 1 ? 's' : ''}</span>
        )}
        {cert.typeOfLd && <span>{cert.typeOfLd}</span>}
        {cert.conductedBy && (
          <span>
            Conducted by{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {cert.conductedBy}
            </span>
          </span>
        )}
      </div>

      {/* Rejection notes */}
      {cert.verificationStatus === 'rejected' && cert.verificationNotes && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-3 py-2 mb-2">
          <p className="text-xs text-red-700 dark:text-red-400">
            <span className="font-semibold">Reviewer note:</span>{' '}
            {cert.verificationNotes}
          </p>
        </div>
      )}

      {/* File attachments */}
      {cert.files.length > 0 && (
        <div className="grid gap-2 mt-2 sm:grid-cols-2">
          {cert.files.map((file) => (
            <FileAttachment key={file.id} file={file} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div className="flex justify-between">
            <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-36 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ editUrl }: { editUrl: string }) {
  return (
    <div className="p-4 sm:p-6">
      {/* Section icon + heading (matches filled state) */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-primary dark:text-tup-crimson-light">
          <FileIcon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Certifications &amp; Trainings
        </h2>
      </div>
      {/* Empty message */}
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <FileIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
          No certifications yet.
        </p>
        <Link
          href={editUrl}
          className="text-sm font-medium text-primary hover:underline">
          Visit Edit Profile to add certifications.
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CertificationsDisplay() {
  const { user } = useAuth();
  const { data: certifications, isLoading } = useCertifications();

  const editUrl = `/dashboard/profile/edit/${user?.id ?? ''}`;

  const groupedCertifications = useMemo(() => {
    if (!certifications) return new Map<number, ProfileCertificationData[]>();
    return groupCertificationsByYear(certifications);
  }, [certifications]);

  if (isLoading) {
    return (
      <MagicCard
        gradientSize={300}
        gradientColor="var(--primary)"
        gradientOpacity={0.05}
        gradientFrom="var(--primary)"
        gradientTo="var(--tup-crimson-dark)"
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <LoadingSkeleton />
      </MagicCard>
    );
  }

  if (!certifications || certifications.length === 0) {
    return (
      <MagicCard
        gradientSize={300}
        gradientColor="var(--primary)"
        gradientOpacity={0.05}
        gradientFrom="var(--primary)"
        gradientTo="var(--tup-crimson-dark)"
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <EmptyState editUrl={editUrl} />
      </MagicCard>
    );
  }

  return (
    <MagicCard
      gradientSize={300}
      gradientColor="var(--primary)"
      gradientOpacity={0.05}
      gradientFrom="var(--primary)"
      gradientTo="var(--tup-crimson-dark)"
      className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-primary dark:text-tup-crimson-light">
              <FileIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Certifications &amp; Trainings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {certifications.length} record{certifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            href={editUrl}
            className="text-xs font-medium text-primary hover:underline shrink-0">
            Edit
          </Link>
        </div>

        {/* Certification list — grouped by year */}
        <div className="space-y-4">
          {[...groupedCertifications.entries()].map(([year, certs]) => (
            <div key={year}>
              <div className="flex items-center gap-2 px-1 py-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{year}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ({certs.length})
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-0">
                {certs.map((cert, index) => (
                  <CertCard key={cert.id} cert={cert} index={index} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MagicCard>
  );
}
