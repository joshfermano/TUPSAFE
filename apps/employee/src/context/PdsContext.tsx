'use client';

/**
 * PDS Context
 *
 * Provides shared PDS state to all form sections:
 * - pdsSubmissionId (draft ID or existing submission ID)
 * - attachments data grouped by entry type
 * - canEdit flag for permission checks
 * - attachments update handlers
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import type { AttachmentData } from '../components/pds/EntryAttachments';

export interface PdsAttachmentsMap {
  byTraining: Record<string, AttachmentData[]>;
  byCivilService: Record<string, AttachmentData[]>;
}

interface PdsContextValue {
  /** PDS submission ID (null if not yet saved) */
  pdsSubmissionId: string | null;
  /** The filing year for this PDS */
  pdsYear: number;
  /** Whether the form can be edited */
  canEdit: boolean;
  /** Attachments grouped by entry */
  attachments: PdsAttachmentsMap;
  /** Update attachments for a training entry */
  updateTrainingAttachments: (trainingId: string, attachments: AttachmentData[]) => void;
  /** Update attachments for a civil service entry */
  updateCivilServiceAttachments: (civilServiceId: string, attachments: AttachmentData[]) => void;
  /** Get attachments for a training entry */
  getTrainingAttachments: (trainingId: string | undefined) => AttachmentData[];
  /** Get attachments for a civil service entry */
  getCivilServiceAttachments: (civilServiceId: string | undefined) => AttachmentData[];
  /** Handler to auto-save before upload (optional) */
  onBeforeUpload?: (entryContext: {
    entryType: 'training' | 'civil_service';
    entryId: string | null;
  }) => Promise<{
    success: boolean;
    pdsSubmissionId?: string;
    entryId?: string;
    errorMessage?: string;
  }>;
}

const PdsContext = createContext<PdsContextValue | null>(null);

interface PdsProviderProps {
  children: ReactNode;
  pdsSubmissionId: string | null;
  pdsYear: number;
  canEdit?: boolean;
  initialAttachments?: PdsAttachmentsMap;
  onAttachmentsChange?: (attachments: PdsAttachmentsMap) => void;
  onBeforeUpload?: (entryContext: {
    entryType: 'training' | 'civil_service';
    entryId: string | null;
  }) => Promise<{
    success: boolean;
    pdsSubmissionId?: string;
    entryId?: string;
    errorMessage?: string;
  }>;
}

export function PdsProvider({
  children,
  pdsSubmissionId,
  pdsYear,
  canEdit = true,
  initialAttachments,
  onAttachmentsChange,
  onBeforeUpload,
}: PdsProviderProps) {
  const [attachments, setAttachments] = useState<PdsAttachmentsMap>(
    initialAttachments || {
      byTraining: {},
      byCivilService: {},
    }
  );

  // Sync attachments when initialAttachments prop changes (e.g., when loading from DB)
  useEffect(() => {
    if (initialAttachments) {
      setAttachments(initialAttachments);
    }
  }, [initialAttachments]);

  // Notify parent when attachments change
  useEffect(() => {
    if (onAttachmentsChange) {
      onAttachmentsChange(attachments);
    }
  }, [attachments, onAttachmentsChange]);

  const updateTrainingAttachments = useCallback(
    (trainingId: string, newAttachments: AttachmentData[]) => {
      setAttachments((prev) => ({
        ...prev,
        byTraining: {
          ...prev.byTraining,
          [trainingId]: newAttachments,
        },
      }));
    },
    []
  );

  const updateCivilServiceAttachments = useCallback(
    (civilServiceId: string, newAttachments: AttachmentData[]) => {
      setAttachments((prev) => ({
        ...prev,
        byCivilService: {
          ...prev.byCivilService,
          [civilServiceId]: newAttachments,
        },
      }));
    },
    []
  );

  const getTrainingAttachments = useCallback(
    (trainingId: string | undefined): AttachmentData[] => {
      if (!trainingId) return [];
      return attachments.byTraining[trainingId] || [];
    },
    [attachments.byTraining]
  );

  const getCivilServiceAttachments = useCallback(
    (civilServiceId: string | undefined): AttachmentData[] => {
      if (!civilServiceId) return [];
      return attachments.byCivilService[civilServiceId] || [];
    },
    [attachments.byCivilService]
  );

  const value = useMemo(
    () => ({
      pdsSubmissionId,
      pdsYear,
      canEdit,
      attachments,
      updateTrainingAttachments,
      updateCivilServiceAttachments,
      getTrainingAttachments,
      getCivilServiceAttachments,
      onBeforeUpload,
    }),
    [
      pdsSubmissionId,
      pdsYear,
      canEdit,
      attachments,
      updateTrainingAttachments,
      updateCivilServiceAttachments,
      getTrainingAttachments,
      getCivilServiceAttachments,
      onBeforeUpload,
    ]
  );

  return <PdsContext.Provider value={value}>{children}</PdsContext.Provider>;
}

export function usePdsContext() {
  const context = useContext(PdsContext);
  if (!context) {
    throw new Error('usePdsContext must be used within a PdsProvider');
  }
  return context;
}

/**
 * Safe hook that returns null if not in a PdsProvider
 * Useful for components that may or may not be in a PDS form context
 */
export function usePdsContextSafe() {
  return useContext(PdsContext);
}

