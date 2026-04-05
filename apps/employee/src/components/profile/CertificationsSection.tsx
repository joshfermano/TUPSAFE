'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  FileIcon,
  UploadIcon,
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  DownloadIcon,
  EyeOpenIcon,
} from '@radix-ui/react-icons';

import {
  useCertifications,
  useCreateCertification,
  useUpdateCertification,
  useDeleteCertification,
  useUploadCertificationFile,
  useDeleteCertificationFile,
} from '@/hooks/useCertifications';

import type {
  ProfileCertificationData,
  CertificationFileData,
  CreateCertificationRequest,
} from '@tupsafe/types';

// ============================================================================
// Constants
// ============================================================================

const LD_TYPE_OPTIONS = [
  { value: '', label: 'Select type...' },
  { value: 'Managerial', label: 'Managerial' },
  { value: 'Supervisory', label: 'Supervisory' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Foundation', label: 'Foundation' },
] as const;

const EMPTY_FORM: CreateCertificationRequest = {
  title: '',
  dateFrom: '',
  dateTo: '',
  hours: null,
  typeOfLd: null,
  conductedBy: null,
};

// ============================================================================
// Utilities
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDisplayDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// ============================================================================
// Shared Styles
// ============================================================================

const inputClassName =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors';

const selectClassName =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors appearance-none';

const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

const cardClassName =
  'rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm';

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({
  status,
}: {
  status: ProfileCertificationData['verificationStatus'];
}) {
  const config = {
    pending: {
      icon: ClockIcon,
      label: 'Pending',
      className:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
    verified: {
      icon: CheckCircledIcon,
      label: 'Verified',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    rejected: {
      icon: CrossCircledIcon,
      label: 'Rejected',
      className:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
  } as const;

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ============================================================================
// Certification Form (Add / Edit)
// ============================================================================

interface CertificationFormProps {
  initialData?: CreateCertificationRequest;
  onSubmit: (data: CreateCertificationRequest) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}

function CertificationForm({
  initialData = EMPTY_FORM,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: CertificationFormProps) {
  const [formData, setFormData] = useState<CreateCertificationRequest>({
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.dateFrom) {
      newErrors.dateFrom = 'Date from is required';
    }
    if (!formData.dateTo) {
      newErrors.dateTo = 'Date to is required';
    }
    if (formData.dateFrom && formData.dateTo && formData.dateFrom > formData.dateTo) {
      newErrors.dateTo = 'Date to must be after date from';
    }
    if (formData.hours !== null && formData.hours !== undefined && formData.hours < 0) {
      newErrors.hours = 'Hours must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateCertificationRequest = {
      title: formData.title.trim(),
      dateFrom: formData.dateFrom,
      dateTo: formData.dateTo,
      hours: formData.hours || null,
      typeOfLd: formData.typeOfLd || null,
      conductedBy: formData.conductedBy?.trim() || null,
    };

    await onSubmit(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden">
      <form onSubmit={handleSubmit} className={`${cardClassName} p-6 mb-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title - full width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g., AWS Solutions Architect"
              className={inputClassName}
              disabled={isPending}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.title}
              </p>
            )}
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.dateFrom}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, dateFrom: e.target.value }));
                if (errors.dateFrom)
                  setErrors((prev) => ({ ...prev, dateFrom: '' }));
              }}
              className={inputClassName}
              disabled={isPending}
            />
            {errors.dateFrom && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.dateFrom}
              </p>
            )}
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date To <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.dateTo}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, dateTo: e.target.value }));
                if (errors.dateTo)
                  setErrors((prev) => ({ ...prev, dateTo: '' }));
              }}
              className={inputClassName}
              disabled={isPending}
            />
            {errors.dateTo && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.dateTo}
              </p>
            )}
          </div>

          {/* Number of Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.hours ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  hours: val === '' ? null : Number(val),
                }));
                if (errors.hours)
                  setErrors((prev) => ({ ...prev, hours: '' }));
              }}
              placeholder="e.g., 40"
              className={inputClassName}
              disabled={isPending}
            />
            {errors.hours && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.hours}
              </p>
            )}
          </div>

          {/* Type of L&D */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type of L&D
            </label>
            <select
              value={formData.typeOfLd ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  typeOfLd: e.target.value || null,
                }))
              }
              className={selectClassName}
              disabled={isPending}>
              {LD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conducted/Sponsored By - full width */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conducted / Sponsored By
            </label>
            <input
              type="text"
              value={formData.conductedBy ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conductedBy: e.target.value || null,
                }))
              }
              placeholder="e.g., Civil Service Commission"
              className={inputClassName}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={secondaryButtonClassName}>
            <Cross2Icon className="h-4 w-4" />
            Cancel
          </button>
          <button type="submit" disabled={isPending} className={primaryButtonClassName}>
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircledIcon className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ============================================================================
// File List Item
// ============================================================================

interface FileItemProps {
  file: CertificationFileData;
  canDelete: boolean;
  onDelete: (fileId: string) => void;
  isDeleting: boolean;
}

function FileItem({ file, canDelete, onDelete, isDeleting }: FileItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-sm">
      <FileIcon className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-800 dark:text-gray-200">
          {file.fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.sizeBytes)}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {file.fileUrl && (
          <>
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="View file">
              <EyeOpenIcon className="h-3.5 w-3.5" />
            </a>
            <a
              href={file.fileUrl}
              download={file.fileName}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Download file">
              <DownloadIcon className="h-3.5 w-3.5" />
            </a>
          </>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            disabled={isDeleting}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            title="Delete file">
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Certification Card
// ============================================================================

interface CertificationCardProps {
  cert: ProfileCertificationData;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSaveEdit: (data: CreateCertificationRequest) => Promise<void>;
  onCancelEdit: () => void;
  onUploadFile: (certId: string, file: File) => void;
  onDeleteFile: (certId: string, fileId: string) => void;
  isUpdatePending: boolean;
  isDeletePending: boolean;
  isUploadPending: boolean;
  isFileDeletePending: boolean;
}

function CertificationCard({
  cert,
  isEditing,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onUploadFile,
  onDeleteFile,
  isUpdatePending,
  isDeletePending,
  isUploadPending,
  isFileDeletePending,
}: CertificationCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPending = cert.verificationStatus === 'pending';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (let i = 0; i < files.length; i++) {
      onUploadFile(cert.id, files[i]);
    }

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  if (isEditing) {
    return (
      <CertificationForm
        initialData={{
          title: cert.title,
          dateFrom: cert.dateFrom,
          dateTo: cert.dateTo,
          hours: cert.hours,
          typeOfLd: cert.typeOfLd,
          conductedBy: cert.conductedBy,
        }}
        onSubmit={onSaveEdit}
        onCancel={onCancelEdit}
        isPending={isUpdatePending}
        submitLabel="Save Changes"
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`${cardClassName} p-5 mb-4`}>
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {cert.title}
            </h3>
            <StatusBadge status={cert.verificationStatus} />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {formatDisplayDate(cert.dateFrom)} &mdash;{' '}
              {formatDisplayDate(cert.dateTo)}
            </span>
            {cert.hours !== null && <span>{cert.hours} hours</span>}
            {cert.typeOfLd && <span>{cert.typeOfLd}</span>}
          </div>

          {cert.conductedBy && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Conducted by: {cert.conductedBy}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Edit certification">
              <Pencil1Icon className="h-3.5 w-3.5" />
              Edit
            </button>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete certification">
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                  }}
                  disabled={isDeletePending}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                  {isDeletePending ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <TrashIcon className="h-3.5 w-3.5" />
                  )}
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Cross2Icon className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Notes */}
      {cert.verificationStatus === 'rejected' && cert.verificationNotes && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <CrossCircledIcon className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Rejection Reason
              </p>
              <p className="mt-0.5 text-sm text-red-700 dark:text-red-400">
                {cert.verificationNotes}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Files Section */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Attachments ({cert.files.length})
          </p>
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50">
                {isUploadPending ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400 dark:border-t-transparent" />
                ) : (
                  <UploadIcon className="h-3.5 w-3.5" />
                )}
                {isUploadPending ? 'Uploading...' : 'Upload File'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
        </div>

        {cert.files.length > 0 ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {cert.files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  canDelete={isPending}
                  onDelete={(fileId) => onDeleteFile(cert.id, fileId)}
                  isDeleting={isFileDeletePending}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">
            No files attached
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function CertificationSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className={`${cardClassName} p-5 animate-pulse`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex gap-4 mb-2">
            <div className="h-4 w-36 rounded bg-gray-100 dark:bg-gray-700/60" />
            <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-700/60" />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${cardClassName} p-8 text-center`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
        <FileIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No certifications yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
        Add your certifications, trainings, and professional development records
        for verification.
      </p>
      <button type="button" onClick={onAdd} className={primaryButtonClassName}>
        <PlusIcon className="h-4 w-4" />
        Add Your First Certification
      </button>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CertificationsSection() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Query hook
  const { data: certifications, isLoading } = useCertifications();

  // Mutation hooks
  const createMutation = useCreateCertification();
  const updateMutation = useUpdateCertification();
  const deleteMutation = useDeleteCertification();
  const uploadFileMutation = useUploadCertificationFile();
  const deleteFileMutation = useDeleteCertificationFile();

  // -- Handlers --

  const handleCreate = useCallback(
    async (data: CreateCertificationRequest) => {
      await createMutation.mutateAsync(data);
      setIsAdding(false);
    },
    [createMutation]
  );

  const handleUpdate = useCallback(
    async (data: CreateCertificationRequest) => {
      if (!editingId) return;
      await updateMutation.mutateAsync({ id: editingId, body: data });
      setEditingId(null);
    },
    [editingId, updateMutation]
  );

  const handleDelete = useCallback(
    (certId: string) => {
      deleteMutation.mutate(certId);
    },
    [deleteMutation]
  );

  const handleFileUpload = useCallback(
    (certId: string, file: File) => {
      uploadFileMutation.mutate({ certificationId: certId, file });
    },
    [uploadFileMutation]
  );

  const handleFileDelete = useCallback(
    (certId: string, fileId: string) => {
      deleteFileMutation.mutate({ certificationId: certId, fileId });
    },
    [deleteFileMutation]
  );

  const startEdit = useCallback((cert: ProfileCertificationData) => {
    setEditingId(cert.id);
    setIsAdding(false);
  }, []);

  const startAdding = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-red-600 dark:text-red-400">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Certifications & Trainings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading
                ? 'Loading...'
                : `${certifications?.length || 0} total`}
            </p>
          </div>
        </div>

        {!isAdding && (
          <motion.button
            type="button"
            onClick={startAdding}
            className={primaryButtonClassName}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}>
            <PlusIcon className="h-4 w-4" />
            Add Certification
          </motion.button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <CertificationForm
            onSubmit={handleCreate}
            onCancel={() => setIsAdding(false)}
            isPending={createMutation.isPending}
            submitLabel="Add Certification"
          />
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && <CertificationSkeleton />}

      {/* Certifications List */}
      {!isLoading && certifications && certifications.length > 0 && (
        <AnimatePresence mode="popLayout">
          {certifications.map((cert) => (
            <CertificationCard
              key={cert.id}
              cert={cert}
              isEditing={editingId === cert.id}
              onEdit={() => startEdit(cert)}
              onDelete={() => handleDelete(cert.id)}
              onSaveEdit={handleUpdate}
              onCancelEdit={() => setEditingId(null)}
              onUploadFile={handleFileUpload}
              onDeleteFile={handleFileDelete}
              isUpdatePending={updateMutation.isPending}
              isDeletePending={deleteMutation.isPending}
              isUploadPending={uploadFileMutation.isPending}
              isFileDeletePending={deleteFileMutation.isPending}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!isLoading && (!certifications || certifications.length === 0) && !isAdding && (
        <EmptyState onAdd={startAdding} />
      )}
    </motion.div>
  );
}
