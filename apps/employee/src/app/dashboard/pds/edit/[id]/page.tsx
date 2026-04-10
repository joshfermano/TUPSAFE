'use client';

/**
 * PDS Edit Page
 * CS Form No. 212 Revised 2025
 *
 * Complete production-ready multi-step wizard for editing existing PDS submissions.
 * Architecture matches the create page while preserving edit-specific features:
 * - Permission checking (draft/rejected only)
 * - Data fetching and transformation from backend
 * - PATCH updates instead of POST creation
 * - Authorization states (loading, not found, unauthorized)
 *
 * Features:
 * - Multi-step wizard: 6 sections
 * - React Hook Form + FormProvider context
 * - useAutoSave hook with dual persistence (localStorage + database)
 * - Per-section validation using form.trigger()
 * - Magic UI components: ShimmerButton, DotPattern
 * - Draft restoration dialog
 * - Save status indicator (Saving/Saved/Error with timestamp)
 * - Submission confirmation dialog with checklist
 * - Confetti on success
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  use,
} from 'react';
import {
  useUpdatePDS,
  useSubmitPDS,
  type UpdatePDSData,
} from '../../../../../hooks/usePDS';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  User,
  Users,
  GraduationCap,
  Briefcase,
  Heart,
  Info,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileCheck,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

// Validation schemas
import {
  completePdsSchema,
  getPdsSectionProgress,
  type CompletePdsData,
} from '../../../../../lib/validations/pds-schema';
import { z } from 'zod';

// PDS Context for attachments
import { PdsProvider, type PdsAttachmentsMap } from '../../../../../context/PdsContext';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Draft data structure for saving/restoring form state
 */
interface PdsDraftData {
  formData: Partial<CompletePdsData>;
  completedSections: number[];
  currentSection: number;
  savedAt: string;
  attachments?: PdsAttachmentsMap;
}

// ============================================================================
// DATE REHYDRATION HELPER
// ============================================================================

/**
 * Convert a DateLike value (string, Date, null) to a Date object.
 * Handles ISO date-only (YYYY-MM-DD) and ISO datetime strings using LOCAL timezone
 * to prevent -1 day shifts from UTC conversion.
 */
function toDateObj(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    // ISO date-only: parse as local time
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return new Date(parseInt(dateOnly[1]), parseInt(dateOnly[2]) - 1, parseInt(dateOnly[3]));
    }
    // ISO datetime: extract date portion, parse as local time
    const isoDatetime = value.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoDatetime) {
      return new Date(parseInt(isoDatetime[1]), parseInt(isoDatetime[2]) - 1, parseInt(isoDatetime[3]));
    }
    // Fallback
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Rehydrate all Date fields in a PDS draft that were serialized as ISO strings
 * by localStorage. Mutates the input object in-place and returns it.
 *
 * localStorage JSON.stringify converts Date objects to ISO strings.
 * This function converts them back so react-hook-form and FormDateInput work correctly.
 */
function rehydrateDraftDates(data: Partial<CompletePdsData>): Partial<CompletePdsData> {
  // Personal Info
  if (data.personalInfo) {
    const pi = data.personalInfo as Record<string, unknown>;
    if (pi.dateOfBirth) pi.dateOfBirth = toDateObj(pi.dateOfBirth);
  }

  // Family → Children
  if (data.family?.children) {
    data.family.children = data.family.children.map((child) => ({
      ...child,
      dateOfBirth: toDateObj(child.dateOfBirth) as Date | null | undefined,
    }));
  }

  // Eligibility
  if (data.eligibility) {
    data.eligibility = data.eligibility.map((item) => ({
      ...item,
      dateOfExam: toDateObj(item.dateOfExam) as Date | null,
      licenseValidityDate: toDateObj(item.licenseValidityDate) as Date | null | undefined,
    }));
  }

  // Work Experience
  if (data.workExperience) {
    data.workExperience = data.workExperience.map((item) => ({
      ...item,
      dateFrom: toDateObj(item.dateFrom) as Date | null | undefined,
      dateTo: toDateObj(item.dateTo) as Date | null | undefined,
    }));
  }

  // Voluntary Work
  if (data.voluntaryWork) {
    data.voluntaryWork = data.voluntaryWork.map((item) => ({
      ...item,
      dateFrom: toDateObj(item.dateFrom) as Date | null | undefined,
      dateTo: toDateObj(item.dateTo) as Date | null | undefined,
    }));
  }

  // Learning & Development
  if (data.learningDevelopment) {
    data.learningDevelopment = data.learningDevelopment.map((item) => ({
      ...item,
      dateFrom: toDateObj(item.dateFrom) as Date | null | undefined,
      dateTo: toDateObj(item.dateTo) as Date | null | undefined,
    }));
  }

  // Other Info → Government ID
  if (data.otherInfo?.governmentId) {
    const govId = data.otherInfo.governmentId as Record<string, unknown>;
    if (govId.dateIssued) {
      govId.dateIssued = toDateObj(govId.dateIssued);
    }
  }

  return data;
}

/**
 * Section definition for the form
 */
interface PDSFormSection {
  id: string;
  label: string;
  title: string;
  icon: typeof User;
}

// Form components
import { FormStepSkeleton } from '../../../../../components/forms/shared';
import { PDSSectionIndicator } from '../../../../../components/forms/shared/PDSSectionIndicator';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../../components/ui/alert-dialog';

// UI components - Keep only essential Magic UI components with subtle effects
import { ShimmerButton } from '../../../../../components/ui/shimmer-button';
import { DotPattern } from '../../../../../components/ui/dot-pattern';
import { BlurFade } from '../../../../../components/ui/blur-fade';

// Hooks
import { useAutoSave, getSavedDraft } from '../../../../../hooks/useAutoSave';
import { useAuth } from '../../../../../providers/AuthProvider';
import { usePdsSubmissionById } from '../../../../../hooks/usePdsSubmissionById';

// Transformations
import {
  transformPdsForSubmission,
  transformPdsFromBackend,
} from '../../../../../lib/utils/pds-transformations';

// Section components (lazy-loaded)
import {
  SectionI,
  SectionII,
  SectionIII,
  SectionIV,
  SectionV,
  SectionVI,
} from '../../create/sections';

// ============================================================================
// SECTION DEFINITIONS
// ============================================================================

const FORM_SECTIONS: PDSFormSection[] = [
  {
    id: 'section-i',
    label: 'Section I',
    title: 'Personal Information',
    icon: User,
  },
  {
    id: 'section-ii',
    label: 'Section II',
    title: 'Family Background',
    icon: Users,
  },
  {
    id: 'section-iii',
    label: 'Section III',
    title: 'Educational Background',
    icon: GraduationCap,
  },
  {
    id: 'section-iv',
    label: 'Section IV',
    title: 'Eligibility & Work',
    icon: Briefcase,
  },
  {
    id: 'section-v',
    label: 'Section V',
    title: 'Training & Volunteer',
    icon: Heart,
  },
  {
    id: 'section-vi',
    label: 'Section VI',
    title: 'Other Information',
    icon: Info,
  },
];

// ============================================================================
// SECTION FIELD MAPPINGS (for validation)
// ============================================================================

/**
 * Get the form field paths for a specific section
 * Used for per-section validation before navigation
 */
const getSectionFields = (section: number): string[] => {
  switch (section) {
    case 0: // Section I: Personal Information
      return [
        'personalInfo.surname',
        'personalInfo.firstName',
        'personalInfo.dateOfBirth',
        'personalInfo.placeOfBirth',
        'personalInfo.sex',
        'personalInfo.civilStatus',
        'personalInfo.citizenship',
        'personalInfo.residentialAddress.barangay',
        'personalInfo.residentialAddress.cityMunicipality',
        'personalInfo.residentialAddress.province',
        'personalInfo.permanentAddress.barangay',
        'personalInfo.permanentAddress.cityMunicipality',
        'personalInfo.permanentAddress.province',
        'personalInfo.emailAddress',
      ];
    case 1: // Section II: Family Background - Optional
      return [];
    case 2: // Section III: Educational Background - Optional
      return [];
    case 3: // Section IV: Eligibility & Work - Optional
      return [];
    case 4: // Section V: Training & Volunteer - Optional
      return [];
    case 5: // Section VI: Other Information - References required
      return ['otherInfo.references'];
    default:
      return [];
  }
};

/**
 * Get required fields description for error messages
 */
const getSectionRequiredFieldsDescription = (section: number): string => {
  switch (section) {
    case 0:
      return 'personal details including name, birth info, citizenship, addresses, and email';
    case 5:
      return 'at least 3 character references';
    default:
      return 'all required fields';
  }
};

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
      Loading PDS for editing...
    </p>
  </div>
);

// ============================================================================
// NOT FOUND STATE
// ============================================================================

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <BlurFade delay={0.1}>
    <Card className="p-8 text-center max-w-2xl mx-auto">
      <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">PDS Not Found</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        The requested PDS submission could not be found.
      </p>
      <Button onClick={onBack}>Back to PDS</Button>
    </Card>
  </BlurFade>
);

// ============================================================================
// UNAUTHORIZED EDIT STATE
// ============================================================================

const UnauthorizedEditState = ({
  status,
  pdsId: _pdsId,
  onBack,
  onViewDetails,
}: {
  status: string;
  pdsId: string;
  onBack: () => void;
  onViewDetails: () => void;
}) => {
  const getMessage = () => {
    switch (status) {
      case 'submitted':
        return 'Your PDS is currently awaiting admin review.';
      case 'reviewing':
        return 'Your PDS is currently under review by the administration.';
      case 'approved':
        return 'Your PDS has been approved. Contact admin to create a new version.';
      default:
        return 'This PDS cannot be edited in its current state.';
    }
  };

  return (
    <BlurFade delay={0.1}>
      <Card className="p-8 text-center max-w-2xl mx-auto">
        <ShieldAlert className="h-16 w-16 mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Editing Not Allowed</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {getMessage()}
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">What you can do</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {status === 'approved'
              ? 'Contact the admin to request creating a new version of your PDS.'
              : 'You can view your submission details or wait for admin feedback.'}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}>
            Back to PDS
          </Button>
          <Button onClick={onViewDetails}>View Details</Button>
        </div>
      </Card>
    </BlurFade>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PDSEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pdsId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Fetch complete PDS data by ID
  const { pdsData: rawPdsData, loading, error } = usePdsSubmissionById(pdsId);

  // Extract submission metadata
  const submission = rawPdsData?.submission ?? null;

  // Check if user can edit based on status
  const canEdit = submission?.status === 'draft' || submission?.status === 'rejected';

  // State
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Extract attachments from rawPdsData
  const attachments = useMemo<PdsAttachmentsMap>(() => {
    if (!rawPdsData?.attachments) {
      return { byTraining: {}, byCivilService: {} };
    }
    return {
      byTraining: rawPdsData.attachments.byTraining || {},
      byCivilService: rawPdsData.attachments.byCivilService || {},
    };
  }, [rawPdsData?.attachments]);

  // Initialize mutations
  const updateMutation = useUpdatePDS(pdsId);
  const submitMutation = useSubmitPDS(pdsId);

  // Transform backend data to frontend format
  const initialData = useMemo(() => {
    if (!rawPdsData) return null;
    return transformPdsFromBackend({
      personalInfo: rawPdsData.personalInfo,
      familyBackground: rawPdsData.familyBackground,
      children: rawPdsData.children,
      education: rawPdsData.education,
      civilService: rawPdsData.civilService,
      workExperience: rawPdsData.workExperience,
      voluntaryWork: rawPdsData.voluntaryWork,
      training: rawPdsData.training,
      otherInfo: rawPdsData.otherInfo,
    });
  }, [rawPdsData]);

  // Form setup - no resolver during multi-step flow to allow incomplete data
  // Final validation happens on submission
  const form = useForm<Partial<CompletePdsData>>({
    defaultValues: initialData || {},
    mode: 'onBlur',
  });

  // Initialize form with data when it loads
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  // Callback-based approach for getting draft data
  const getDraftData = useCallback(
    (): PdsDraftData => ({
      formData: form.getValues(),
      completedSections,
      currentSection,
      savedAt: new Date().toISOString(),
    }),
    [completedSections, currentSection, form]
  );

  // Save draft to database (always PATCH for edit mode)
  const saveDraftToDatabase = useCallback(
    async (data: PdsDraftData): Promise<void> => {
      try {
        // Transform form data for backend
        const transformedData = transformPdsForSubmission(data.formData);

        // Always PATCH (not POST) for edit mode
        const response = await fetch(`/api/pds/${pdsId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to update draft');
        }

        console.log('[PDS Edit] Draft updated successfully:', pdsId);
      } catch (error) {
        console.error('[PDS Edit] Error saving draft to database:', error);
        throw error;
      }
    },
    [pdsId]
  );

  // Auto-save setup with database persistence (60-second intervals)
  const { saveStatus, lastSaved, saveNow, clearSaved } =
    useAutoSave<PdsDraftData>({
      key: `pds-edit-${pdsId}`,
      getData: getDraftData,
      debounceMs: 60000,
      autoSaveIntervalMs: 60000,
      enabled: !isSubmitting && canEdit, // Permission check
      showToast: false,
      onSave: async (data: PdsDraftData) => {
        await saveDraftToDatabase(data);
      },
      onError: (error) => {
        console.error('Draft save error:', error);
      },
    });

  // Check for localStorage draft restoration (only if newer than database)
  useEffect(() => {
    if (!initialData || !userId || !submission) return;

    const savedDraft = getSavedDraft<PdsDraftData>(`pds-edit-${pdsId}`);

    if (savedDraft && savedDraft.savedAt) {
      const savedTime = new Date(savedDraft.savedAt);
      const lastFetchTime = new Date(submission.updatedAt || 0);

      // Show dialog ONLY if localStorage is newer than database
      if (savedTime > lastFetchTime) {
        setShowDraftDialog(true);
      }
    }
  }, [initialData, pdsId, userId, submission]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = getSavedDraft<PdsDraftData>(`pds-edit-${pdsId}`);
    if (savedDraft && savedDraft.formData) {
      // Rehydrate all date fields from localStorage (ISO strings → Date objects)
      rehydrateDraftDates(savedDraft.formData);

      // Restore form data
      form.reset(savedDraft.formData);

      // Restore completed sections
      if (
        savedDraft.completedSections &&
        Array.isArray(savedDraft.completedSections)
      ) {
        setCompletedSections(savedDraft.completedSections);
      } else {
        // Fallback: Calculate which sections are completed
        const progress = getPdsSectionProgress(savedDraft.formData);
        const completed: number[] = [];
        Object.entries(progress).forEach(([, value], index) => {
          if (value >= 100) {
            completed.push(index);
          }
        });
        setCompletedSections(completed);
      }

      // Restore current section position
      if (
        typeof savedDraft.currentSection === 'number' &&
        savedDraft.currentSection >= 0
      ) {
        setCurrentSection(savedDraft.currentSection);
      }

      const savedTime = savedDraft.savedAt
        ? new Date(savedDraft.savedAt).toLocaleString()
        : 'previously';
      toast.success('Draft Restored', {
        description: `Your local changes from ${savedTime} have been loaded.`,
      });
    }
    setShowDraftDialog(false);
  }, [pdsId, form]);

  const handleDiscardDraft = useCallback(() => {
    clearSaved();
    setShowDraftDialog(false);
    toast.info('Local Draft Discarded', {
      description: 'Using the database version.',
    });
  }, [clearSaved]);

  // Manual save handler
  const handleSaveNow = useCallback(async (): Promise<void> => {
    try {
      const draftData = getDraftData();
      await saveDraftToDatabase(draftData);
      await saveNow();

      toast.success('Draft Saved', {
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('[PDS Edit] Failed to save draft:', error);
      toast.error('Failed to save draft', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });
    }
  }, [getDraftData, saveDraftToDatabase, saveNow]);

  // Auto-save for upload: saves the current form to DB so attachments can reference valid entries
  const handleAutoSaveForUpload = useCallback(
    async (entryContext: {
      entryType: 'training' | 'civil_service';
      entryId: string | null;
    }): Promise<{
      success: boolean;
      pdsSubmissionId?: string;
      entryId?: string;
      errorMessage?: string;
    }> => {
      try {
        const formData = form.getValues();

        // Pre-flight validation: check minimum required data before saving
        if (entryContext.entryId) {
          if (entryContext.entryType === 'training') {
            const trainingIndex = formData.learningDevelopment?.findIndex(
              (t) => t.id === entryContext.entryId
            );

            if (trainingIndex !== undefined && trainingIndex >= 0) {
              const training = formData.learningDevelopment![trainingIndex];

              if (!training.title || training.title.trim() === '') {
                return {
                  success: false,
                  errorMessage:
                    'Please enter a training title before uploading attachments.',
                };
              }
            }
          }

          if (entryContext.entryType === 'civil_service') {
            const csIndex = formData.eligibility?.findIndex(
              (cs) => cs.id === entryContext.entryId
            );

            if (csIndex !== undefined && csIndex >= 0) {
              const cs = formData.eligibility![csIndex];

              if (!cs.eligibilityName || cs.eligibilityName.trim() === '') {
                return {
                  success: false,
                  errorMessage:
                    'Please enter an eligibility name before uploading attachments.',
                };
              }
            }
          }
        }

        // Transform data using the same pipeline as submit
        const transformedData = transformPdsForSubmission(formData) as Record<string, unknown> & {
          training?: Record<string, unknown>[];
          civilService?: Record<string, unknown>[];
        };

        // Verify the entry exists in the transformed payload
        // (the transformation may filter out incomplete entries)
        if (entryContext.entryId) {
          if (entryContext.entryType === 'training') {
            const entryInPayload = transformedData.training?.find(
              (t: Record<string, unknown>) => t.id === entryContext.entryId
            );
            if (!entryInPayload) {
              return {
                success: false,
                errorMessage:
                  'Please fill in the required date fields (From and To) before uploading attachments.',
              };
            }
          } else if (entryContext.entryType === 'civil_service') {
            const entryInPayload = transformedData.civilService?.find(
              (cs: Record<string, unknown>) => cs.id === entryContext.entryId
            );
            if (!entryInPayload) {
              return {
                success: false,
                errorMessage:
                  'Please fill in the required fields before uploading attachments.',
              };
            }
          }
        }

        // PATCH the existing PDS (edit page always has a pdsId)
        const response = await fetch(`/api/pds/${pdsId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to update draft');
        }

        return {
          success: true,
          pdsSubmissionId: pdsId,
          entryId: entryContext.entryId || undefined,
        };
      } catch (error) {
        console.error('[PDS Edit] Auto-save for upload failed:', error);
        return {
          success: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Failed to save draft. Please try again.',
        };
      }
    },
    [form, pdsId]
  );

  // Navigation handlers
  const handleNext = useCallback(async () => {
    const sectionFields = getSectionFields(currentSection);

    // If there are required fields, validate them
    if (sectionFields.length > 0) {
      const isValid = await form.trigger(
        sectionFields as Parameters<typeof form.trigger>[0]
      );

      if (!isValid) {
        const requiredFieldsDesc =
          getSectionRequiredFieldsDescription(currentSection);
        toast.error('Please fill in all required fields', {
          description: `Required: ${requiredFieldsDesc}`,
        });
        return;
      }
    }

    // Mark section as completed
    if (!completedSections.includes(currentSection)) {
      setCompletedSections([...completedSections, currentSection]);
    }

    // Move to next section
    if (currentSection < FORM_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection, completedSections, form]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection]);

  const handleSectionClick = useCallback(
    (sectionIndex: number) => {
      if (
        sectionIndex <= currentSection ||
        completedSections.includes(sectionIndex - 1)
      ) {
        setCurrentSection(sectionIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentSection, completedSections]
  );

  // Form submission with sequential mutations
  const handleSubmit = useCallback(
    async (data: Partial<CompletePdsData>) => {
      setIsSubmitting(true);

      try {
        // STEP 1: Prepare data for validation with type conversions
        const dataWithTypeConversions = { ...data };

        // Convert Personal Info date/number fields
        if (dataWithTypeConversions.personalInfo) {
          dataWithTypeConversions.personalInfo = {
            ...dataWithTypeConversions.personalInfo,
            dateOfBirth: dataWithTypeConversions.personalInfo.dateOfBirth
              ? dataWithTypeConversions.personalInfo.dateOfBirth instanceof Date
                ? dataWithTypeConversions.personalInfo.dateOfBirth
                : new Date(dataWithTypeConversions.personalInfo.dateOfBirth)
              : null,
            heightM: dataWithTypeConversions.personalInfo.heightM
              ? typeof dataWithTypeConversions.personalInfo.heightM === 'number'
                ? dataWithTypeConversions.personalInfo.heightM
                : parseFloat(
                    String(dataWithTypeConversions.personalInfo.heightM)
                  )
              : null,
            weightKg: dataWithTypeConversions.personalInfo.weightKg
              ? typeof dataWithTypeConversions.personalInfo.weightKg ===
                'number'
                ? dataWithTypeConversions.personalInfo.weightKg
                : parseFloat(
                    String(dataWithTypeConversions.personalInfo.weightKg)
                  )
              : null,
          } as CompletePdsData['personalInfo'];
        }

        // Convert Family Background - Children dateOfBirth
        if (dataWithTypeConversions.family?.children) {
          dataWithTypeConversions.family.children =
            dataWithTypeConversions.family.children.map((child) => ({
              ...child,
              dateOfBirth: child.dateOfBirth
                ? child.dateOfBirth instanceof Date
                  ? child.dateOfBirth
                  : new Date(child.dateOfBirth)
                : null,
            }));
        }

        // Convert Civil Service Eligibility dates
        if (dataWithTypeConversions.eligibility) {
          dataWithTypeConversions.eligibility =
            dataWithTypeConversions.eligibility.map((item) => ({
              ...item,
              rating: item.rating
                ? typeof item.rating === 'number'
                  ? item.rating
                  : parseFloat(item.rating)
                : null,
              dateOfExam: item.dateOfExam
                ? item.dateOfExam instanceof Date
                  ? item.dateOfExam
                  : new Date(item.dateOfExam)
                : null,
              licenseValidityDate: item.licenseValidityDate
                ? item.licenseValidityDate instanceof Date
                  ? item.licenseValidityDate
                  : new Date(item.licenseValidityDate)
                : null,
            }));
        }

        // Convert Work Experience dates and salary
        if (dataWithTypeConversions.workExperience) {
          dataWithTypeConversions.workExperience =
            dataWithTypeConversions.workExperience.map((item) => ({
              ...item,
              dateFrom: item.dateFrom
                ? item.dateFrom instanceof Date
                  ? item.dateFrom
                  : new Date(item.dateFrom)
                : null,
              dateTo: item.dateTo
                ? item.dateTo instanceof Date
                  ? item.dateTo
                  : new Date(item.dateTo)
                : null,
              monthlySalary: item.monthlySalary
                ? typeof item.monthlySalary === 'number'
                  ? item.monthlySalary
                  : parseFloat(item.monthlySalary)
                : null,
            }));
        }

        // Convert Voluntary Work dates and hours
        if (dataWithTypeConversions.voluntaryWork) {
          dataWithTypeConversions.voluntaryWork =
            dataWithTypeConversions.voluntaryWork.map((item) => ({
              ...item,
              dateFrom: item.dateFrom
                ? item.dateFrom instanceof Date
                  ? item.dateFrom
                  : new Date(item.dateFrom)
                : null,
              dateTo: item.dateTo
                ? item.dateTo instanceof Date
                  ? item.dateTo
                  : new Date(item.dateTo)
                : null,
              numberOfHours: item.numberOfHours
                ? typeof item.numberOfHours === 'number'
                  ? item.numberOfHours
                  : parseFloat(item.numberOfHours)
                : null,
            }));
        }

        // Convert Learning Development dates and hours
        if (dataWithTypeConversions.learningDevelopment) {
          dataWithTypeConversions.learningDevelopment =
            dataWithTypeConversions.learningDevelopment.map((item) => ({
              ...item,
              dateFrom: item.dateFrom
                ? item.dateFrom instanceof Date
                  ? item.dateFrom
                  : new Date(item.dateFrom)
                : null,
              dateTo: item.dateTo
                ? item.dateTo instanceof Date
                  ? item.dateTo
                  : new Date(item.dateTo)
                : null,
              hours: item.hours
                ? typeof item.hours === 'number'
                  ? item.hours
                  : parseFloat(item.hours)
                : null,
            }));
        }

        // Filter out empty references
        if (dataWithTypeConversions.otherInfo?.references) {
          dataWithTypeConversions.otherInfo.references =
            dataWithTypeConversions.otherInfo.references.filter(
              (ref) =>
                ref.name &&
                ref.name.trim() !== '' &&
                ref.address &&
                ref.address.trim() !== '' &&
                ref.telephoneNo &&
                ref.telephoneNo.trim() !== ''
            );
        }

        // STEP 2: Validate using the schema
        completePdsSchema.parse(dataWithTypeConversions);

        // STEP 3: Transform to backend format
        const backendData = transformPdsForSubmission(dataWithTypeConversions);

        // Update existing PDS (PATCH)
        await updateMutation.mutateAsync(backendData as UpdatePDSData);

        // Submit for review (status: draft/rejected → submitted)
        await submitMutation.mutateAsync();

        // Clear draft from localStorage
        clearSaved();

        // Success feedback
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('PDS Updated Successfully!', {
          description: 'Your changes have been submitted for admin review.',
        });

        // Redirect to view page (not pending)
        setTimeout(() => {
          router.push(`/dashboard/pds/view/${pdsId}`);
        }, 2000);
      } catch (error) {
        console.error('Submission error:', error);

        if (error instanceof z.ZodError) {
          // Format validation errors
          const firstError = error.errors[0];
          const errorPath = firstError.path.join('.');

          let errorMessage: string;
          let errorTitle = 'Validation Failed';

          // Special handling for common errors
          if (errorPath.includes('references')) {
            errorTitle = 'Character References Required';
            errorMessage =
              'You must provide at least 3 complete character references.';
          } else if (errorPath.includes('dateOfBirth')) {
            errorTitle = 'Date of Birth Required';
            errorMessage = 'Please provide a valid date of birth.';
          } else {
            errorMessage = firstError.message;
          }

          toast.error(errorTitle, {
            description: errorMessage,
            duration: 8000,
          });

          // Navigate to section with error
          const errorSection = getSectionForFieldPath(errorPath);
          if (errorSection !== null) {
            setCurrentSection(errorSection);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          toast.error('Update Failed', {
            description:
              error instanceof Error ? error.message : 'Please try again.',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateMutation, submitMutation, clearSaved, router, pdsId]
  );

  /**
   * Helper to determine which section a field path belongs to
   */
  const getSectionForFieldPath = (fieldPath: string): number | null => {
    if (fieldPath.startsWith('personalInfo')) return 0;
    if (fieldPath.startsWith('family')) return 1;
    if (fieldPath.startsWith('education')) return 2;
    if (
      fieldPath.startsWith('eligibility') ||
      fieldPath.startsWith('workExperience')
    )
      return 3;
    if (
      fieldPath.startsWith('voluntaryWork') ||
      fieldPath.startsWith('learningDevelopment')
    )
      return 4;
    if (fieldPath.startsWith('otherInfo')) return 5;
    return null;
  };

  // Save status display
  const saveStatusDisplay = useMemo(() => {
    switch (saveStatus) {
      case 'saving':
        return (
          <Badge
            variant="outline"
            className="border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700">
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300">
              <span className="sm:hidden">Saving</span>
              <span className="hidden sm:inline">Saving...</span>
            </span>
          </Badge>
        );
      case 'saved':
        return (
          <Badge
            variant="outline"
            className="border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">
              <span className="sm:hidden">Saved</span>
              <span className="hidden sm:inline">
                Saved{' '}
                {lastSaved
                  ? `at ${lastSaved.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : ''}
              </span>
            </span>
          </Badge>
        );
      case 'error':
        return (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700">
            <XCircle className="h-3 w-3 mr-1.5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">
              <span className="sm:hidden">Error</span>
              <span className="hidden sm:inline">Save failed</span>
            </span>
          </Badge>
        );
      default:
        return null;
    }
  }, [saveStatus, lastSaved]);

  // Render current section - NO key prop to prevent remounting
  const renderSection = useMemo(() => {
    switch (currentSection) {
      case 0:
        return <SectionI />;
      case 1:
        return <SectionII />;
      case 2:
        return <SectionIII />;
      case 3:
        return <SectionIV />;
      case 4:
        return <SectionV />;
      case 5:
        return <SectionVI />;
      default:
        return null;
    }
  }, [currentSection]);

  const isLastSection = currentSection === FORM_SECTIONS.length - 1;

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error or not found state
  if (error || !rawPdsData || !submission) {
    return (
      <NotFoundState
        onBack={() => router.back()}
      />
    );
  }

  // Permission check - only allow editing if status is draft or rejected
  if (!canEdit) {
    return (
      <UnauthorizedEditState
        status={submission.status}
        pdsId={pdsId}
        onBack={() => router.back()}
        onViewDetails={() => router.push(`/dashboard/pds/view/${pdsId}`)}
      />
    );
  }

  // Cannot proceed without form data
  if (!initialData) {
    return <LoadingState />;
  }

  return (
    <div className="relative min-h-screen">
      {/* Subtle background pattern */}
      <DotPattern
        className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      {/* Main content */}
      <div className="max-w-5xl mx-auto space-y-8 pb-8">
        {/* Header - Clean, Professional */}
        <div className="pb-8 mb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Edit Personal Data Sheet
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-slate-300 dark:border-slate-700 w-fit">
                  CS Form No. 212 Revised 2025
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    submission.status === 'draft'
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700 text-red-700 dark:text-red-300'
                  }>
                  {submission.status === 'draft' ? 'Draft' : 'Rejected'}
                </Badge>
              </div>
            </div>

            {/* Save status - Always visible, mobile responsive */}
            <div className="flex items-center gap-2 sm:gap-4">
              {saveStatusDisplay}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNow}
                disabled={isSubmitting}
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save Now</span>
              </Button>
            </div>
          </div>

          {/* Section progress indicator */}
          <PDSSectionIndicator
            sections={FORM_SECTIONS}
            currentSection={currentSection}
            completedSections={completedSections}
            onSectionClick={handleSectionClick}
          />
        </div>

        {/* Form */}
        <FormProvider {...form}>
          <PdsProvider
            pdsSubmissionId={pdsId}
            pdsYear={submission?.year ?? new Date().getFullYear()}
            canEdit={canEdit}
            initialAttachments={attachments}
            onBeforeUpload={handleAutoSaveForUpload}
          >
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              {/* Section content - No key prop to prevent remounting */}
              <Suspense fallback={<FormStepSkeleton fieldCount={10} />}>
                <div className="mb-10">{renderSection}</div>
              </Suspense>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 pt-10 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0 || isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveNow}
                  disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>

                {isLastSection ? (
                  <Button
                    type="button"
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={isSubmitting}
                    size="lg"
                    className="min-w-[180px] bg-amber-600 hover:bg-amber-700 text-white font-semibold border-2 border-amber-400 animate-pulse-border dark:bg-amber-500 dark:hover:bg-amber-600 dark:border-amber-300">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                ) : (
                  <ShimmerButton
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}>
                    Next Section
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </ShimmerButton>
                )}
                </div>
              </div>
            </form>
          </PdsProvider>
        </FormProvider>
      </div>

      {/* Draft restoration dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Resume Local Draft?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found newer changes in your browser storage. Would you like to
              restore them, or use the version from the database?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Use Database Version
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Restore Local Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              Ready to Submit Your Changes?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base">
                  Please review your changes before proceeding. Once submitted,
                  you won&apos;t be able to edit until reviewed by an
                  administrator.
                </p>

                {/* Warning checklist */}
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                      <p className="font-semibold">
                        Before submitting, please confirm:
                      </p>
                      <ul className="space-y-1.5 ml-1">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            Have you reviewed all sections for accuracy?
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Are all required fields completed?</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            Did you provide at least 3 character references?
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  After submission, you won&apos;t be able to edit until
                  reviewed by HR.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => setShowSubmitDialog(false)}
              className="sm:mr-2">
              Cancel - Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSubmitDialog(false);
                form.handleSubmit(handleSubmit)();
              }}
              className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600">
              <FileCheck className="h-4 w-4 mr-2" />
              Yes, Submit Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
