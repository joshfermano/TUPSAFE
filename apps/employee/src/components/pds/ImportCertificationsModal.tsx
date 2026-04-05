'use client';

/**
 * ImportCertificationsModal
 *
 * Allows employees to select profile certifications from their wallet and
 * import them into the PDS Learning & Development (Section V) form. Handles
 * deduplication against trainings already present in the form.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  FileIcon,
  DownloadIcon,
} from '@radix-ui/react-icons';
import { useCertifications } from '../../hooks/useCertifications';
import type { ProfileCertificationData } from '@tupsafe/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportCertificationsModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (certifications: ProfileCertificationData[]) => void;
  existingTrainings: Array<{
    title: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a date string into a human-readable label.
 * Input format is "YYYY-MM-DD" from the API.
 */
function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Normalise a Date or string to "YYYY-MM-DD" for deduplication comparison.
 */
function toDateKey(value: Date | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build a dedup key from a title and date range.
 */
function dedupKey(
  title: string,
  dateFrom: Date | string | null | undefined,
  dateTo: Date | string | null | undefined
): string {
  return `${title.toLowerCase().trim()}|${toDateKey(dateFrom)}|${toDateKey(dateTo)}`;
}

// ---------------------------------------------------------------------------
// Verification Badge
// ---------------------------------------------------------------------------

function VerificationBadge({
  status,
}: {
  status: ProfileCertificationData['verificationStatus'];
}) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircledIcon className="h-3 w-3" />
          Verified
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
          <CrossCircledIcon className="h-3 w-3" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <ClockIcon className="h-3 w-3" />
          Pending
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImportCertificationsModal({
  open,
  onClose,
  onImport,
  existingTrainings,
}: ImportCertificationsModalProps) {
  const { data: certifications, isLoading, isError } = useCertifications();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Build a set of keys for trainings already in the PDS form
  const existingKeys = useMemo(() => {
    const keys = new Set<string>();
    existingTrainings.forEach((t) => {
      keys.add(dedupKey(t.title, t.dateFrom, t.dateTo));
    });
    return keys;
  }, [existingTrainings]);

  // Determine which certifications are duplicates
  const isDuplicate = useCallback(
    (cert: ProfileCertificationData): boolean => {
      return existingKeys.has(dedupKey(cert.title, cert.dateFrom, cert.dateTo));
    },
    [existingKeys]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleImport = useCallback(() => {
    if (!certifications) return;
    const selected = certifications.filter((c) => selectedIds.has(c.id));
    if (selected.length > 0) {
      onImport(selected);
    }
  }, [certifications, selectedIds, onImport]);

  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  const selectableCount = useMemo(() => {
    if (!certifications) return 0;
    return certifications.filter((c) => !isDuplicate(c)).length;
  }, [certifications, isDuplicate]);

  const toggleSelectAll = useCallback(() => {
    if (!certifications) return;
    const selectable = certifications.filter((c) => !isDuplicate(c));
    if (selectedIds.size === selectable.length && selectable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable.map((c) => c.id)));
    }
  }, [certifications, isDuplicate, selectedIds.size]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                  <DownloadIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Import from Profile
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select certifications to import into your PDS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Cross2Icon className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Loading certifications...
                  </p>
                </div>
              )}

              {isError && (
                <div className="text-center py-12">
                  <CrossCircledIcon className="h-8 w-8 text-red-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load certifications. Please try again.
                  </p>
                </div>
              )}

              {!isLoading &&
                !isError &&
                (!certifications || certifications.length === 0) && (
                  <div className="text-center py-12">
                    <FileIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No certifications in your profile wallet yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add certifications from your Profile page first.
                    </p>
                  </div>
                )}

              {!isLoading &&
                !isError &&
                certifications &&
                certifications.length > 0 && (
                  <div className="space-y-2">
                    {/* Select All */}
                    {selectableCount > 1 && (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline mb-2"
                      >
                        {selectedIds.size === selectableCount
                          ? 'Deselect all'
                          : `Select all (${selectableCount})`}
                      </button>
                    )}

                    {certifications.map((cert) => {
                      const duplicate = isDuplicate(cert);
                      const selected = selectedIds.has(cert.id);

                      return (
                        <button
                          key={cert.id}
                          type="button"
                          disabled={duplicate}
                          onClick={() => toggleSelection(cert.id)}
                          className={`w-full text-left rounded-xl border p-4 transition-all ${
                            duplicate
                              ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                              : selected
                                ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox area */}
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                  duplicate
                                    ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                                    : selected
                                      ? 'border-red-600 bg-red-600 dark:border-red-500 dark:bg-red-500'
                                      : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {selected && !duplicate && (
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {cert.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDate(cert.dateFrom)} -{' '}
                                    {formatDate(cert.dateTo)}
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  <VerificationBadge
                                    status={cert.verificationStatus}
                                  />
                                </div>
                              </div>

                              {/* Metadata row */}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {cert.hours != null && (
                                  <span className="text-xs text-muted-foreground">
                                    {cert.hours} hours
                                  </span>
                                )}
                                {cert.typeOfLd && (
                                  <span className="text-xs text-muted-foreground">
                                    {cert.typeOfLd}
                                  </span>
                                )}
                                {cert.conductedBy && (
                                  <span className="text-xs text-muted-foreground">
                                    by {cert.conductedBy}
                                  </span>
                                )}
                                {cert.files.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <FileIcon className="h-3 w-3" />
                                    {cert.files.length} file
                                    {cert.files.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>

                              {duplicate && (
                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                                  (Already added)
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
              <p className="text-xs text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : 'No certifications selected'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedIds.size === 0}
                  className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <DownloadIcon className="h-4 w-4" />
                    Import Selected
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
