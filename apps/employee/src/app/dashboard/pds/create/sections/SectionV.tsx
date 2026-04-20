'use client';

/**
 * Section V: Voluntary Work & Learning Development
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 */

import { memo, useCallback, useEffect, startTransition, useRef, useState } from 'react';
import { Heart, BookOpen, Plus, GraduationCap, Download, Info, X } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../../../../../components/ui/button';
import { VoluntaryWorkItem, TrainingItem } from '../../../../../components/pds/array-items';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';
import { autoSortWithNotification } from '../../../../../lib/utils/pds-sort';
import { usePdsContextSafe } from '../../../../../context/PdsContext';
import { ImportCertificationsModal } from '../../../../../components/pds/ImportCertificationsModal';
import type { ProfileCertificationData } from '@tupsafe/types';
import { useCertificationsByYear } from '../../../../../hooks/useCertifications';

export const SectionV = memo(function SectionV() {
  const form = useFormContext<CompletePdsData>();
  const pdsContext = usePdsContextSafe();

  // Import from Profile modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Auto-import state
  const hasAutoImported = useRef(false);
  const [showAutoImportBanner, setShowAutoImportBanner] = useState(false);

  // Pending file copies: certs imported before draft was saved
  // Each entry maps a certificationId to the generated trainingId
  const pendingFileCopies = useRef<Array<{ certificationId: string; trainingId: string }>>([]);

  // Fetch certifications for the PDS filing year
  const pdsYear = pdsContext?.pdsYear ?? new Date().getFullYear();
  const { data: yearCertifications } = useCertificationsByYear(pdsYear);

  // Refs for virtualization
  const trainingParentRef = useRef<HTMLDivElement>(null);

  const {
    fields: voluntaryFields,
    append: appendVoluntary,
    remove: removeVoluntary,
    replace: replaceVoluntary,
  } = useFieldArray({
    control: form.control,
    name: 'voluntaryWork',
  });

  const {
    fields: trainingFields,
    append: appendTraining,
    remove: removeTraining,
    replace: replaceTraining,
  } = useFieldArray({
    control: form.control,
    name: 'learningDevelopment',
  });

  // Virtualize training fields if there are more than 10 items
  const shouldVirtualizeTraining = trainingFields.length > 10;

  const trainingVirtualizer = useVirtualizer({
    count: trainingFields.length,
    getScrollElement: () => trainingParentRef.current,
    estimateSize: () => 250, // Estimated height per training item
    overscan: 5,
    enabled: shouldVirtualizeTraining,
  });

  /**
   * Sort voluntary work entries by date (latest first)
   */
  const sortVoluntaryWorkEntries = useCallback(() => {
    const currentValues = form.getValues('voluntaryWork');
    if (!currentValues || currentValues.length <= 1) return;

    const { sorted, wasReordered } = autoSortWithNotification(currentValues);
    if (wasReordered) {
      replaceVoluntary(sorted);
      toast.info('Voluntary work sorted by date (latest first)');
    }
  }, [form, replaceVoluntary]);

  /**
   * Sort training entries by date (latest first)
   */
  const sortTrainingEntries = useCallback(() => {
    const currentValues = form.getValues('learningDevelopment');
    if (!currentValues || currentValues.length <= 1) return;

    const { sorted, wasReordered } = autoSortWithNotification(currentValues);
    if (wasReordered) {
      replaceTraining(sorted);
      toast.info('Training programs sorted by date (latest first)');
    }
  }, [form, replaceTraining]);

  /**
   * Copy certification files to PDS training attachments.
   * If pdsSubmissionId is available, fires immediately.
   * If not (draft not saved yet), queues for later flush.
   */
  const copyCertFilesToPds = useCallback(
    (mappings: Array<{ certificationId: string; trainingId: string }>) => {
      const submissionId = pdsContext?.pdsSubmissionId;
      if (!submissionId) {
        // Queue — will be flushed when pdsSubmissionId becomes available
        pendingFileCopies.current.push(...mappings);
        return;
      }

      // Fire copy requests (non-blocking)
      mappings.forEach(async ({ certificationId, trainingId }) => {
        try {
          const res = await fetch('/api/pds/attachments/copy-from-certification', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              certificationId,
              pdsSubmissionId: submissionId,
              trainingId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.copiedCount > 0) {
              console.log(
                `[SectionV] Copied ${data.copiedCount} file(s) from cert ${certificationId} to training ${trainingId}`
              );
            }
          }
        } catch (err) {
          console.error('[SectionV] Failed to copy cert files:', err);
        }
      });
    },
    [pdsContext?.pdsSubmissionId]
  );

  // Flush pending file copies when pdsSubmissionId becomes available
  useEffect(() => {
    const submissionId = pdsContext?.pdsSubmissionId;
    if (!submissionId || pendingFileCopies.current.length === 0) return;

    const queued = [...pendingFileCopies.current];
    pendingFileCopies.current = [];
    copyCertFilesToPds(queued);
  }, [pdsContext?.pdsSubmissionId, copyCertFilesToPds]);

  // Auto-import certifications from profile for the PDS year
  useEffect(() => {
    if (
      hasAutoImported.current ||
      !yearCertifications ||
      yearCertifications.length === 0 ||
      trainingFields.length > 0
    ) {
      return;
    }

    // Filter out rejected certifications
    const eligibleCerts = yearCertifications.filter(
      (cert) => cert.verificationStatus !== 'rejected'
    );

    if (eligibleCerts.length === 0) return;

    hasAutoImported.current = true;

    // Convert certifications to training entries, tracking cert→training mapping
    const fileCopyMappings: Array<{ certificationId: string; trainingId: string }> = [];
    const entries = eligibleCerts.map((cert) => {
      const trainingId = uuidv4();
      if (cert.files.length > 0) {
        fileCopyMappings.push({ certificationId: cert.id, trainingId });
      }
      return {
        id: trainingId,
        title: cert.title,
        dateFrom: new Date(cert.dateFrom),
        dateTo: new Date(cert.dateTo),
        hours: cert.hours,
        typeOfLd: cert.typeOfLd || '',
        conductedBy: cert.conductedBy || '',
      };
    });

    replaceTraining(entries);
    setShowAutoImportBanner(true);

    // Trigger file copy (queues if draft not saved yet)
    if (fileCopyMappings.length > 0) {
      copyCertFilesToPds(fileCopyMappings);
    }

    startTransition(() => {
      sortTrainingEntries();
    });

    toast.success(
      `Auto-imported ${eligibleCerts.length} certification${eligibleCerts.length > 1 ? 's' : ''} from your profile for ${pdsYear}`
    );
  }, [yearCertifications, trainingFields.length, pdsYear, replaceTraining, sortTrainingEntries, copyCertFilesToPds]);

  /**
   * Handle adding new voluntary work with auto-sort
   */
  const handleAddVoluntaryWork = useCallback(() => {
    appendVoluntary({
      organizationName: '',
      organizationAddress: '',
      dateFrom: new Date(),
      dateTo: null,
      numberOfHours: null,
      positionNature: '',
    });
    startTransition(() => {
      sortVoluntaryWorkEntries();
    });
  }, [appendVoluntary, sortVoluntaryWorkEntries]);

  /**
   * Handle adding new training with auto-sort
   * Note: id is required for attachment linking
   */
  const handleAddTraining = useCallback(() => {
    appendTraining({
      id: uuidv4(), // Generate stable ID for attachments linking
      title: '',
      dateFrom: new Date(),
      dateTo: new Date(),
      hours: null,
      typeOfLd: '',
      conductedBy: '',
    });
    startTransition(() => {
      sortTrainingEntries();
    });
  }, [appendTraining, sortTrainingEntries]);

  /**
   * Handle blur event on voluntary work date fields to trigger auto-sort
   */
  const handleVoluntaryDateBlur = useCallback(() => {
    sortVoluntaryWorkEntries();
  }, [sortVoluntaryWorkEntries]);

  /**
   * Handle blur event on training date fields to trigger auto-sort
   */
  const handleTrainingDateBlur = useCallback(() => {
    sortTrainingEntries();
  }, [sortTrainingEntries]);

  /**
   * Handle importing certifications from the profile wallet into the
   * Learning & Development section. Each imported cert becomes a new
   * training entry with a stable UUID for attachment linking.
   */
  const handleImportCertifications = useCallback(
    (certs: ProfileCertificationData[]) => {
      const fileCopyMappings: Array<{ certificationId: string; trainingId: string }> = [];

      certs.forEach((cert) => {
        const trainingId = uuidv4();
        if (cert.files.length > 0) {
          fileCopyMappings.push({ certificationId: cert.id, trainingId });
        }
        appendTraining({
          id: trainingId,
          title: cert.title,
          dateFrom: new Date(cert.dateFrom),
          dateTo: new Date(cert.dateTo),
          hours: cert.hours,
          typeOfLd: cert.typeOfLd || '',
          conductedBy: cert.conductedBy || '',
        });
      });

      // Trigger file copy (queues if draft not saved yet)
      if (fileCopyMappings.length > 0) {
        copyCertFilesToPds(fileCopyMappings);
      }

      startTransition(() => {
        sortTrainingEntries();
      });

      toast.success(
        `Imported ${certs.length} certification${certs.length > 1 ? 's' : ''} from profile`
      );
      setShowImportModal(false);
    },
    [appendTraining, sortTrainingEntries, copyCertFilesToPds]
  );

  /**
   * Handle removing training with attachment cleanup
   */
  const handleRemoveTraining = useCallback(
    (index: number) => {
      const training = form.getValues(`learningDevelopment.${index}`);

      // Clean up attachments before removing entry
      if (pdsContext && training?.id) {
        const trainingId = training.id; // Extract to help TypeScript narrow the type
        const attachments = pdsContext.getTrainingAttachments(trainingId) || [];

        // Delete each attachment from storage + DB
        attachments.forEach(async (att) => {
          try {
            await fetch(`/api/pds/attachments/${att.id}`, { method: 'DELETE' });
            // Remove attachment from context by updating with filtered list
            const remainingAttachments = attachments.filter((a) => a.id !== att.id);
            pdsContext.updateTrainingAttachments(trainingId, remainingAttachments);
          } catch (error) {
            console.error('Failed to delete attachment:', error);
            // Continue with entry deletion even if attachment cleanup fails
          }
        });
      }

      // Remove the entry
      removeTraining(index);
    },
    [form, pdsContext, removeTraining]
  );

  return (
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section V</p>
            <h2 className="text-2xl font-bold text-foreground">
              Voluntary Work & Learning Development
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Voluntary work involvement and training programs attended
            </p>
          </div>
        </div>
      </div>

      {/* Voluntary Work Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Voluntary Work or Involvement
                </h3>
                <p className="text-xs text-muted-foreground">
                  Civic/Non-Government/People/Voluntary Organizations
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVoluntaryWork}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Voluntary Work
            </Button>
          </div>

          {voluntaryFields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No voluntary work added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Voluntary Work&quot; to add your volunteer
                experience
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {voluntaryFields.map((field, index) => (
                <VoluntaryWorkItem
                  key={field.id}
                  index={index}
                  onRemove={removeVoluntary}
                  onDateBlur={handleVoluntaryDateBlur}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learning & Development Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Learning and Development Interventions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Training programs attended
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                <Download className="h-4 w-4 mr-2" />
                Import from Profile
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTraining}
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            </div>
          </div>

          {/* Auto-import info banner */}
          {showAutoImportBanner && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-4">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Certifications from your profile for {pdsYear} have been automatically added. You can remove any or add more manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoImportBanner(false)}
                className="shrink-0 rounded p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {trainingFields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No learning and development interventions added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Training&quot; to add training programs
              </p>
            </div>
          ) : shouldVirtualizeTraining ? (
            // Virtualized rendering for >10 items
            <div
              ref={trainingParentRef}
              style={{ height: '600px', overflow: 'auto' }}
              className="space-y-4">
              <div
                style={{
                  height: `${trainingVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}>
                {trainingVirtualizer.getVirtualItems().map((virtualItem) => (
                  <div
                    key={trainingFields[virtualItem.index].id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}>
                    <div className="pb-4">
                      <TrainingItem
                        index={virtualItem.index}
                        onRemove={handleRemoveTraining}
                        onDateBlur={handleTrainingDateBlur}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Non-virtualized rendering for <=10 items
            <div className="space-y-4">
              {trainingFields.map((field, index) => (
                <TrainingItem
                  key={field.id}
                  index={index}
                  onRemove={handleRemoveTraining}
                  onDateBlur={handleTrainingDateBlur}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Notice - Clean, subtle styling */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Training & Voluntary Work Records
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Include all relevant training programs and voluntary work experience.
            Entries will be automatically sorted by date (latest first).
          </p>
        </div>
      </div>

      {/* Import from Profile Modal */}
      <ImportCertificationsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCertifications}
        pdsYear={pdsYear}
        existingTrainings={trainingFields.map((field, index) => {
          const values = form.getValues(`learningDevelopment.${index}`);
          return {
            title: values?.title ?? '',
            dateFrom: values?.dateFrom ?? null,
            dateTo: values?.dateTo ?? null,
          };
        })}
      />
    </div>
  );
});
