'use client';

/**
 * PDS (Personal Data Sheet) Create Page
 * CS Form No. 212 Revised 2025
 *
 * Restructured to match official CS Form sections:
 * - Section I: Personal Information (basic, contact, addresses)
 * - Section II: Family Background
 * - Section III: Educational Background
 * - Section IV: Civil Service Eligibility & Work Experience
 * - Section V: Voluntary Work & Learning Development
 * - Section VI: Other Information (skills, questions, references)
 *
 * Features:
 * - One complete section per page (no component remounting)
 * - Auto-save functionality with API persistence
 * - Draft restoration on mount
 * - Real-time validation per section
 * - Magic UI components for professional design
 * - Full accessibility (WCAG 2.1 AA)
 * - Mobile-responsive design
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from 'react';
import {
  useCreatePDS,
  useSubmitPDS,
  useUpdatePDS,
} from '../../../../hooks/usePDS';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';

// Validation schemas
import {
  completePdsSchema,
  createEmptyPds,
  getPdsSectionProgress,
  type CompletePdsData,
} from '../../../../lib/validations/pds-schema';
import { z } from 'zod';

// PDS Context for attachments
import {
  PdsProvider,
  type PdsAttachmentsMap,
} from '../../../../context/PdsContext';

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
import { FormStepSkeleton } from '../../../../components/forms/shared';
import { PDSSectionIndicator } from '../../../../components/forms/shared/PDSSectionIndicator';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';

// UI components - Keep only essential Magic UI components with subtle effects
import { ShimmerButton } from '../../../../components/ui/shimmer-button';
import { DotPattern } from '../../../../components/ui/dot-pattern';

// Hooks
import { useAutoSave, getSavedDraft } from '../../../../hooks/useAutoSave';
import { useAuth } from '../../../../providers/AuthProvider';
import { useDeadlineForForm } from '../../../../hooks/useDeadlines';
import { useLatestPDS } from '../../../../hooks/usePDS';

// Components
import { DeadlineNotice } from '../../../../components/dashboard/DeadlineNotice';

// Transformations
import {
  transformPdsForSubmission,
  transformPdsFromBackend,
} from '../../../../lib/utils/pds-transformations';

// Section components (lazy-loaded)
import {
  SectionI,
  SectionII,
  SectionIII,
  SectionIV,
  SectionV,
  SectionVI,
} from './sections';

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
// MAIN COMPONENT
// ============================================================================

export default function PDSCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Deadline and submission hooks
  const { deadline } = useDeadlineForForm('pds');
  const { data: latestPDS } = useLatestPDS();

  // Redirect if user has approved submission for current year
  useEffect(() => {
    const currentYear = deadline?.year ?? new Date().getFullYear();
    if (latestPDS?.status === 'approved' && latestPDS?.year === currentYear) {
      toast.info('Already Submitted', {
        description: `You already have an approved PDS for ${currentYear}. Only one submission per year is allowed.`,
      });
      router.replace('/dashboard/pds');
    }
  }, [latestPDS, deadline, router]);

  // Check if loading from existing draft
  const draftIdFromUrl = searchParams.get('draftId');

  // State
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [_hasSavedDraft, setHasSavedDraft] = useState(false);
  const [createdPdsId, setCreatedPdsId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null); // Track draft ID for updates
  const [attachments, setAttachments] = useState<PdsAttachmentsMap>({
    byTraining: {},
    byCivilService: {},
  }); // Track attachments for PDS entries
  const [hasSeenAutoSaveInfo, setHasSeenAutoSaveInfo] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(`pds-autosave-info-seen-${userId}`) === 'true';
  });
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Synchronous draft ID tracking to prevent race conditions
  const draftIdRef = useRef<string | null>(null);

  // Helper to update both state and ref together
  const updateDraftId = useCallback((id: string | null) => {
    draftIdRef.current = id;
    setDraftId(id);
  }, []);

  // Initialize mutations
  const createMutation = useCreatePDS();
  const updateMutation = useUpdatePDS(draftId || '');
  const submitMutation = useSubmitPDS(createdPdsId || '');

  // Form setup - no resolver during multi-step flow to allow incomplete data
  // Final validation happens on submission
  const form = useForm<Partial<CompletePdsData>>({
    defaultValues: createEmptyPds(),
    mode: 'onBlur',
  });

  // Ref-based subscription to track form changes without causing re-renders
  // Removed redundant form.watch() useEffect - useAutoSave handles this via getData callback

  // Callback-based approach for getting draft data
  const getDraftData = useCallback(
    (): PdsDraftData => ({
      formData: form.getValues(),
      completedSections,
      currentSection,
      savedAt: new Date().toISOString(),
      attachments,
    }),
    [completedSections, currentSection, form, attachments]
  );

  // Auto-save setup - localStorage ONLY (no DB sync on auto-save)
  // DB sync only happens on manual "Save Draft" button click with validation
  const { saveStatus, lastSaved, saveNow, clearSaved } =
    useAutoSave<PdsDraftData>({
      key: `pds-draft-${userId}`,
      getData: getDraftData,
      debounceMs: 60000,
      autoSaveIntervalMs: 60000,
      enabled: !isSubmitting,
      showToast: false,
      // NOTE: No onSave callback - auto-save is localStorage-only
      // DB draft sync happens via manual save (handleSaveAndNavigate)
      onError: (error) => {
        console.error('Draft auto-save error:', error);
      },
    });

  // Load draft from database if draftId is present in URL
  useEffect(() => {
    if (draftIdFromUrl) {
      // Load draft from database
      fetch(`/api/pds/${draftIdFromUrl}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Failed to load draft');
          }
          return res.json();
        })
        .then((result) => {
          if (result.success && result.data) {
            const pdsData = result.data;

            // Set draft ID for future updates (update both ref and state)
            updateDraftId(draftIdFromUrl);

            // Transform backend data to frontend format
            const formData = transformPdsFromBackend(pdsData);

            // Reset form with transformed data
            form.reset(formData);

            // Load attachments if available
            if (pdsData.attachments) {
              setAttachments({
                byTraining: pdsData.attachments.byTraining || {},
                byCivilService: pdsData.attachments.byCivilService || {},
              });
            }

            toast.success('Draft Loaded', {
              description: 'Your saved draft has been loaded.',
            });
          }
        })
        .catch((error) => {
          console.error('Failed to load draft:', error);
          toast.error('Failed to Load Draft', {
            description: 'Could not load your saved draft. Starting fresh.',
          });
        });
    } else {
      // Check for saved draft in localStorage if no URL parameter
      const savedDraft = getSavedDraft<PdsDraftData>(`pds-draft-${userId}`);
      if (
        savedDraft &&
        savedDraft.formData &&
        Object.keys(savedDraft.formData).length > 0
      ) {
        setHasSavedDraft(true);
        setShowDraftDialog(true);
      }
    }
  }, [draftIdFromUrl, userId, form]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = getSavedDraft<PdsDraftData>(`pds-draft-${userId}`);
    if (savedDraft && savedDraft.formData) {
      // Restore form data
      form.reset(savedDraft.formData);

      // Restore attachments if available
      if (savedDraft.attachments) {
        setAttachments(savedDraft.attachments);
      }

      // Restore completed sections from saved draft
      if (
        savedDraft.completedSections &&
        Array.isArray(savedDraft.completedSections)
      ) {
        setCompletedSections(savedDraft.completedSections);
      } else {
        // Fallback: Calculate which sections are completed based on form data
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
        description: `Your work from ${savedTime} has been loaded.`,
      });
    }
    setShowDraftDialog(false);
  }, [userId, form]);

  const handleDiscardDraft = useCallback(() => {
    clearSaved();
    setShowDraftDialog(false);
    toast.info('Draft Discarded', {
      description: 'Starting with a blank form.',
    });
  }, [clearSaved]);

  // Auto-save handler for attachment uploads (no navigation)
  // Returns IDs if save succeeded, success: false otherwise
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

        // DEBUG: Log draft data BEFORE auto-save
        console.log('[AUTO-SAVE] Draft data before save:', {
          entryContext,
          hasTraining: !!formData.learningDevelopment,
          trainingCount: formData.learningDevelopment?.length || 0,
          trainingIds:
            formData.learningDevelopment?.map((t) => ({
              id: t.id,
              title: t.title,
              dateFrom: t.dateFrom,
              dateTo: t.dateTo,
            })) || [],
          hasCivilService: !!formData.eligibility,
          civilServiceCount: formData.eligibility?.length || 0,
          civilServiceIds:
            formData.eligibility?.map((cs) => ({
              id: cs.id,
              eligibilityName: cs.eligibilityName,
            })) || [],
        });

        // STEP 0: Pre-flight validation - check if entry has minimum required data
        if (entryContext.entryId) {
          if (entryContext.entryType === 'training') {
            const trainingIndex = formData.learningDevelopment?.findIndex(
              (t) => t.id === entryContext.entryId
            );

            if (trainingIndex !== undefined && trainingIndex >= 0) {
              const training = formData.learningDevelopment![trainingIndex];

              // Check minimum requirements for upload
              if (!training.title || training.title.trim() === '') {
                return {
                  success: false,
                  errorMessage: 'Please enter a training title before uploading attachments.',
                };
              }

              // Optional: Log missing dates (but allow upload)
              if (!training.dateFrom || !training.dateTo) {
                console.log('[AUTO-SAVE] Training entry missing dates, but allowing upload');
              }
            }
          }

          if (entryContext.entryType === 'civil_service') {
            const csIndex = formData.eligibility?.findIndex(
              (cs) => cs.id === entryContext.entryId
            );

            if (csIndex !== undefined && csIndex >= 0) {
              const cs = formData.eligibility![csIndex];

              // Check minimum requirements for upload
              if (!cs.eligibilityName || cs.eligibilityName.trim() === '') {
                return {
                  success: false,
                  errorMessage: 'Please enter an eligibility name before uploading attachments.',
                };
              }
            }
          }
        }

        // STEP 1: Always save to localStorage first (offline backup, no validation)
        await saveNow();

        // STEP 2: Transform data using the same pipeline as submit
        const transformedData = transformPdsForSubmission(formData);

        // DEBUG: Log transformed data structure
        console.log('[AUTO-SAVE] Transformed data structure:', {
          hasTraining: !!transformedData.training,
          trainingCount: transformedData.training?.length || 0,
          trainingData:
            transformedData.training?.map((t: any) => ({
              id: t.id,
              title: t.title,
              dateFrom: t.dateFrom,
              dateTo: t.dateTo,
            })) || [],
          hasCivilService: !!transformedData.civilService,
          civilServiceCount: transformedData.civilService?.length || 0,
        });

        // STEP 2.5: CRITICAL - Verify the entry exists in the transformed payload
        // The transformation filters out incomplete entries, so we need to check
        // if the requested entry will actually be saved to the database
        if (entryContext.entryId) {
          if (entryContext.entryType === 'training') {
            const entryInPayload = transformedData.training?.find(
              (t: any) => t.id === entryContext.entryId
            );
            if (!entryInPayload) {
              console.error(
                '[AUTO-SAVE] Training entry not found in transformed payload:',
                {
                  requestedId: entryContext.entryId,
                  availableIds:
                    transformedData.training?.map((t: any) => t.id) || [],
                  hint: 'Entry may have been filtered out due to missing required fields (dateFrom, dateTo)',
                }
              );
              return {
                success: false,
                errorMessage: 'Please fill in the required date fields (From and To) before uploading attachments.',
              };
            }
          } else if (entryContext.entryType === 'civil_service') {
            const entryInPayload = transformedData.civilService?.find(
              (cs: any) => cs.id === entryContext.entryId
            );
            if (!entryInPayload) {
              console.error(
                '[AUTO-SAVE] Civil service entry not found in transformed payload:',
                {
                  requestedId: entryContext.entryId,
                  availableIds:
                    transformedData.civilService?.map((cs: any) => cs.id) || [],
                  hint: 'Entry may have been filtered out due to missing required fields',
                }
              );
              return {
                success: false,
                errorMessage: 'Please fill in the required fields before uploading attachments.',
              };
            }
          }
        }

        // STEP 3: Save to database
        const currentDraftId = draftIdRef.current;

        if (currentDraftId) {
          // Update existing draft
          console.log(
            '[PDS Create] Auto-saving for upload (update):',
            currentDraftId
          );
          const response = await fetch(`/api/pds/${currentDraftId}`, {
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

          const result = await response.json();
          console.log(
            '[PDS Create] Auto-save update succeeded:',
            currentDraftId
          );

          // Return the entry ID (we already verified it exists in the payload)
          return {
            success: true,
            pdsSubmissionId: currentDraftId,
            entryId: entryContext.entryId || undefined,
          };
        } else {
          // Create new draft
          console.log('[PDS Create] Auto-saving for upload (create new)');
          const response = await fetch('/api/pds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transformedData),
          });

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to create draft');
          }

          const result = await response.json();
          if (result.data?.id) {
            // Update both ref and state together
            updateDraftId(result.data.id);
            console.log(
              '[PDS Create] Auto-save create succeeded:',
              result.data.id
            );

            // Return the entry ID (we already verified it exists in the payload)
            return {
              success: true,
              pdsSubmissionId: result.data.id,
              entryId: entryContext.entryId || undefined,
            };
          } else {
            throw new Error('No draft ID returned from server');
          }
        }
      } catch (error) {
        console.error('[PDS Create] Auto-save for upload failed:', error);
        return {
          success: false,
          errorMessage: error instanceof Error
            ? error.message
            : 'Failed to save draft. Please try again.',
        };
      }
    },
    [form, saveNow, updateDraftId]
  );

  // Manual save and navigate handler
  // Uses the same transformation pipeline as submit, but without full validation
  const handleSaveAndNavigate = useCallback(async (): Promise<void> => {
    try {
      const formData = form.getValues();

      // STEP 1: Always save to localStorage first (offline backup, no validation)
      await saveNow();

      // STEP 2: Transform data using the same pipeline as submit
      // This ensures consistency between draft saves and final submission
      const transformedData = transformPdsForSubmission(formData);

      // STEP 3: Save to database
      const currentDraftId = draftIdRef.current;

      if (currentDraftId) {
        // Update existing draft
        console.log(
          '[PDS Create] Updating draft via manual save:',
          currentDraftId
        );
        const response = await fetch(`/api/pds/${currentDraftId}`, {
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

        console.log('[PDS Create] Draft updated successfully:', currentDraftId);
      } else {
        // Create new draft
        console.log('[PDS Create] Creating new draft via manual save');
        const response = await fetch('/api/pds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to create draft');
        }

        const result = await response.json();
        if (result.data?.id) {
          // Update both ref and state together
          updateDraftId(result.data.id);
          console.log(
            '[PDS Create] Draft created successfully:',
            result.data.id
          );
        } else {
          throw new Error('No draft ID returned from server');
        }
      }

      // Success toast
      toast.success('Draft Saved', {
        description: currentDraftId
          ? 'Your draft has been updated.'
          : 'Your draft has been saved successfully.',
      });

      // Navigate to drafts page after successful save
      router.push('/dashboard/pds/drafts');
    } catch (error) {
      // Log error for debugging
      console.error('[PDS Create] Failed to save draft:', error);

      // Show error toast
      toast.error('Failed to save draft', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });

      // Don't navigate on error
    }
  }, [form, saveNow, updateDraftId, router]);

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

  // ============================================================================
  // FIELD NAME MAPPING FOR USER-FRIENDLY ERROR MESSAGES
  // ============================================================================

  const PDS_FIELD_NAME_MAP: Record<string, string> = {
    // Personal Information
    'personalInfo.surname': 'Surname',
    'personalInfo.firstName': 'First Name',
    'personalInfo.middleName': 'Middle Name',
    'personalInfo.nameExtension': 'Name Extension/Suffix',
    'personalInfo.dateOfBirth': 'Date of Birth',
    'personalInfo.placeOfBirth': 'Place of Birth',
    'personalInfo.sex': 'Sex',
    'personalInfo.civilStatus': 'Civil Status',
    'personalInfo.heightM': 'Height (meters)',
    'personalInfo.weightKg': 'Weight (kg)',
    'personalInfo.bloodType': 'Blood Type',

    // Government IDs
    'personalInfo.gsisNo': 'GSIS ID No.',
    'personalInfo.pagibigNo': 'PAG-IBIG ID No.',
    'personalInfo.philhealthNo': 'PhilHealth No.',
    'personalInfo.sssNo': 'SSS No.',
    'personalInfo.tinNo': 'TIN',
    'personalInfo.agencyEmployeeNo': 'Agency Employee No.',

    // Citizenship
    'personalInfo.citizenship': 'Citizenship',
    'personalInfo.citizenshipType': 'Citizenship Type',
    'personalInfo.citizenshipCountry': 'Citizenship Country',

    // Residential Address
    'personalInfo.residentialAddress': 'Residential Address',
    'personalInfo.residentialAddress.houseNumber':
      'Residential Address - House/Block/Lot No.',
    'personalInfo.residentialAddress.streetName':
      'Residential Address - Street',
    'personalInfo.residentialAddress.subdivision':
      'Residential Address - Subdivision',
    'personalInfo.residentialAddress.barangay':
      'Residential Address - Barangay',
    'personalInfo.residentialAddress.cityMunicipality':
      'Residential Address - City/Municipality',
    'personalInfo.residentialAddress.province':
      'Residential Address - Province',
    'personalInfo.residentialAddress.zipCode': 'Residential Address - ZIP Code',
    'personalInfo.residentialAddress.region': 'Residential Address - Region',

    // Permanent Address
    'personalInfo.permanentAddress': 'Permanent Address',
    'personalInfo.permanentAddress.houseNumber':
      'Permanent Address - House/Block/Lot No.',
    'personalInfo.permanentAddress.streetName': 'Permanent Address - Street',
    'personalInfo.permanentAddress.subdivision':
      'Permanent Address - Subdivision',
    'personalInfo.permanentAddress.barangay': 'Permanent Address - Barangay',
    'personalInfo.permanentAddress.cityMunicipality':
      'Permanent Address - City/Municipality',
    'personalInfo.permanentAddress.province': 'Permanent Address - Province',
    'personalInfo.permanentAddress.zipCode': 'Permanent Address - ZIP Code',
    'personalInfo.permanentAddress.region': 'Permanent Address - Region',

    // Contact
    'personalInfo.telephoneNo': 'Telephone No.',
    'personalInfo.mobileNo': 'Mobile No.',
    'personalInfo.emailAddress': 'Email Address',

    // Family - Spouse
    family: 'Family Background',
    'family.spouseSurname': 'Spouse - Surname',
    'family.spouseFirstName': 'Spouse - First Name',
    'family.spouseMiddleName': 'Spouse - Middle Name',
    'family.spouseNameExtension': 'Spouse - Name Extension',
    'family.spouseOccupation': 'Spouse - Occupation',
    'family.spouseEmployer': 'Spouse - Employer',
    'family.spouseBusinessAddress': 'Spouse - Business Address',
    'family.spouseTelephoneNo': 'Spouse - Telephone No.',

    // Family - Parents
    'family.fatherSurname': 'Father - Surname',
    'family.fatherFirstName': 'Father - First Name',
    'family.fatherMiddleName': 'Father - Middle Name',
    'family.fatherNameExtension': 'Father - Name Extension',
    'family.motherMaidenSurname': 'Mother - Maiden Surname',
    'family.motherFirstName': 'Mother - First Name',
    'family.motherMiddleName': 'Mother - Middle Name',
    'family.children': 'Children',

    // Education
    education: 'Educational Background',
    'education.elementary': 'Elementary Education',
    'education.elementary.schoolName': 'Elementary - School Name',
    'education.elementary.degreeCourse': 'Elementary - Degree/Course',
    'education.elementary.periodFrom': 'Elementary - From Year',
    'education.elementary.periodTo': 'Elementary - To Year',
    'education.elementary.unitsEarned': 'Elementary - Units Earned',
    'education.elementary.yearGraduated': 'Elementary - Year Graduated',
    'education.elementary.honors': 'Elementary - Honors',
    'education.secondary': 'Secondary Education',
    'education.secondary.schoolName': 'Secondary - School Name',
    'education.secondary.degreeCourse': 'Secondary - Degree/Course',
    'education.secondary.periodFrom': 'Secondary - From Year',
    'education.secondary.periodTo': 'Secondary - To Year',
    'education.secondary.unitsEarned': 'Secondary - Units Earned',
    'education.secondary.yearGraduated': 'Secondary - Year Graduated',
    'education.secondary.honors': 'Secondary - Honors',
    'education.vocational': 'Vocational/Trade Course',
    'education.vocational.schoolName': 'Vocational - School Name',
    'education.vocational.degreeCourse': 'Vocational - Course',
    'education.vocational.periodFrom': 'Vocational - From Year',
    'education.vocational.periodTo': 'Vocational - To Year',
    'education.vocational.unitsEarned': 'Vocational - Units Earned',
    'education.vocational.yearGraduated': 'Vocational - Year Graduated',
    'education.vocational.honors': 'Vocational - Honors',
    'education.college': 'College Education',
    'education.college.schoolName': 'College - School Name',
    'education.college.degreeCourse': 'College - Degree/Course',
    'education.college.periodFrom': 'College - From Year',
    'education.college.periodTo': 'College - To Year',
    'education.college.unitsEarned': 'College - Units Earned',
    'education.college.yearGraduated': 'College - Year Graduated',
    'education.college.honors': 'College - Honors',
    'education.graduate': 'Graduate Studies',
    'education.graduate.schoolName': 'Graduate Studies - School Name',
    'education.graduate.degreeCourse': 'Graduate Studies - Degree',
    'education.graduate.periodFrom': 'Graduate Studies - From Year',
    'education.graduate.periodTo': 'Graduate Studies - To Year',
    'education.graduate.unitsEarned': 'Graduate Studies - Units Earned',
    'education.graduate.yearGraduated': 'Graduate Studies - Year Graduated',
    'education.graduate.honors': 'Graduate Studies - Honors',

    // Civil Service Eligibility
    eligibility: 'Civil Service Eligibility',

    // Work Experience
    workExperience: 'Work Experience',

    // Voluntary Work
    voluntaryWork: 'Voluntary Work',

    // Learning & Development
    learningDevelopment: 'Learning and Development',

    // Other Info
    otherInfo: 'Other Information',
    'otherInfo.skills': 'Special Skills and Hobbies',
    'otherInfo.recognitions': 'Non-Academic Distinctions/Recognition',
    'otherInfo.associations': 'Membership in Associations/Organizations',
    'otherInfo.references': 'Character References',
  };

  const ARRAY_FIELD_PATTERNS: Record<string, Record<string, string>> = {
    'family.children': {
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
    },
    eligibility: {
      eligibilityName: 'Career Service/RA 1080',
      rating: 'Rating',
      dateOfExam: 'Date of Examination',
      placeOfExam: 'Place of Examination',
      licenseNo: 'License Number',
      licenseValidityDate: 'License Validity Date',
    },
    workExperience: {
      positionTitle: 'Position Title',
      departmentAgency: 'Department/Agency/Office',
      monthlySalary: 'Monthly Salary',
      salaryGrade: 'Salary Grade',
      statusOfAppointment: 'Status of Appointment',
      isGovernment: 'Government Service',
      dateFrom: 'From Date',
      dateTo: 'To Date',
    },
    voluntaryWork: {
      organizationName: 'Organization Name',
      organizationAddress: 'Organization Address',
      dateFrom: 'From Date',
      dateTo: 'To Date',
      numberOfHours: 'Number of Hours',
      positionNature: 'Position/Nature of Work',
    },
    learningDevelopment: {
      title: 'Title of Program',
      dateFrom: 'From Date',
      dateTo: 'To Date',
      hours: 'Number of Hours',
      typeOfLd: 'Type of LD',
      conductedBy: 'Conducted/Sponsored By',
    },
    'otherInfo.skills': {
      skill: 'Skill',
    },
    'otherInfo.recognitions': {
      recognition: 'Recognition',
    },
    'otherInfo.associations': {
      association: 'Association',
    },
    'otherInfo.references': {
      name: 'Name',
      address: 'Address',
      telephoneNo: 'Telephone No.',
    },
  };

  /**
   * Converts a database field path to a user-friendly display name
   */
  const formatFieldPath = (fieldPath: string): string => {
    // Check for exact match in the mapping
    if (PDS_FIELD_NAME_MAP[fieldPath]) {
      return PDS_FIELD_NAME_MAP[fieldPath];
    }

    // Check for array item patterns (e.g., "family.children.0.fullName", "eligibility.0.rating")
    const arrayMatch = fieldPath.match(/^(.+?)\.(\d+)\.(.+)$/);
    if (arrayMatch) {
      const [, arrayPath, index, fieldName] = arrayMatch;
      const itemIndex = parseInt(index, 10) + 1; // Convert to 1-based for display

      // Check if we have a pattern for this array
      if (
        ARRAY_FIELD_PATTERNS[arrayPath] &&
        ARRAY_FIELD_PATTERNS[arrayPath][fieldName]
      ) {
        const arrayDisplayName = PDS_FIELD_NAME_MAP[arrayPath] || arrayPath;
        const fieldDisplayName = ARRAY_FIELD_PATTERNS[arrayPath][fieldName];
        return `${arrayDisplayName} #${itemIndex} - ${fieldDisplayName}`;
      }
    }

    // Fallback: Convert camelCase to Title Case with spaces
    const fallbackName = fieldPath.split('.').pop() || fieldPath;
    return fallbackName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Form submission with sequential mutations
  const handleSubmit = useCallback(
    async (data: Partial<CompletePdsData>) => {
      setIsSubmitting(true);

      try {
        // STEP 1: Prepare data for validation with type conversions only
        // Apply type conversions but keep the original structure (object format)
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
                    dataWithTypeConversions.personalInfo.heightM as any
                  )
              : null,
            weightKg: dataWithTypeConversions.personalInfo.weightKg
              ? typeof dataWithTypeConversions.personalInfo.weightKg ===
                'number'
                ? dataWithTypeConversions.personalInfo.weightKg
                : parseFloat(
                    dataWithTypeConversions.personalInfo.weightKg as any
                  )
              : null,
          } as any;
        }

        // Convert Family Background - Children dateOfBirth
        if (dataWithTypeConversions.family?.children) {
          dataWithTypeConversions.family.children =
            dataWithTypeConversions.family.children.map((child: any) => ({
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
            dataWithTypeConversions.eligibility.map((item: any) => ({
              ...item,
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
            dataWithTypeConversions.workExperience.map((item: any) => ({
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
            dataWithTypeConversions.voluntaryWork.map((item: any) => ({
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
            dataWithTypeConversions.learningDevelopment.map((item: any) => ({
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

        // Filter out empty references (a reference is considered filled if it has ALL required fields)
        if (dataWithTypeConversions.otherInfo?.references) {
          dataWithTypeConversions.otherInfo.references =
            dataWithTypeConversions.otherInfo.references.filter(
              (ref: any) =>
                ref.name &&
                ref.name.trim() !== '' &&
                ref.address &&
                ref.address.trim() !== '' &&
                ref.telephoneNo &&
                ref.telephoneNo.trim() !== ''
            );
        }

        // Log for debugging
        console.log('Data with type conversions:', {
          hasPersonalInfo: !!dataWithTypeConversions.personalInfo,
          hasFamily: !!dataWithTypeConversions.family,
          hasEducation: !!dataWithTypeConversions.education,
          educationType: Array.isArray(dataWithTypeConversions.education)
            ? 'array'
            : 'object',
          referencesCount:
            dataWithTypeConversions.otherInfo?.references?.length || 0,
          dateOfBirthType:
            typeof dataWithTypeConversions.personalInfo?.dateOfBirth,
          heightType: typeof dataWithTypeConversions.personalInfo?.heightM,
          weightType: typeof dataWithTypeConversions.personalInfo?.weightKg,
        });

        // STEP 2: Validate using the schema (with frontend structure - education as object)
        const validatedData = completePdsSchema.parse(dataWithTypeConversions);

        // STEP 3: Transform to backend format (education object → array, family → familyBackground)
        const backendData = transformPdsForSubmission(dataWithTypeConversions);

        console.log('Backend data structure:', {
          hasPersonalInfo: !!backendData.personalInfo,
          hasFamilyBackground: !!backendData.familyBackground,
          hasEducation: !!backendData.education,
          educationCount: backendData.education?.length || 0,
          educationSample: backendData.education?.[0] || null,
        });

        let pdsId: string;

        if (draftId) {
          // Use existing draft ID
          pdsId = draftId;
          // Update draft one final time before submission
          await updateMutation.mutateAsync(backendData as any);
        } else {
          // Create PDS (status: draft)
          const createResult = await createMutation.mutateAsync(
            backendData as any
          );

          if (!createResult?.data?.id) {
            throw new Error('Failed to create PDS - no ID returned');
          }

          pdsId = createResult.data.id;
        }

        setCreatedPdsId(pdsId);

        // Submit for review (status: draft → submitted)
        await submitMutation.mutateAsync();

        // Clear draft from localStorage
        clearSaved();

        // Success feedback
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('PDS Submitted Successfully!', {
          description: 'Your PDS has been submitted for admin review.',
        });

        // Redirect to pending page
        setTimeout(() => {
          router.push('/dashboard/pds/pending');
        }, 2000);
      } catch (error) {
        console.error('Submission error:', error);

        if (error instanceof z.ZodError) {
          // Format all validation errors to be user-friendly
          const formatValidationErrors = (errors: z.ZodError): string => {
            const errorMessages = errors.errors.map((err) => {
              const path = err.path.join('.');
              const friendlyPath = formatFieldPath(path);
              return `${friendlyPath}: ${err.message}`;
            });

            // Return max 5 errors, each on a new line
            return errorMessages.slice(0, 5).join('\n');
          };

          // Log formatted errors to console for debugging
          const formattedErrors = formatValidationErrors(error);
          console.error('Validation errors (formatted):\n', formattedErrors);
          console.error(
            'Validation errors (raw - for debugging):',
            error.errors
          );

          const firstError = error.errors[0];
          const errorPath = firstError.path.join('.');

          // Provide user-friendly error messages
          let errorMessage: string;
          let errorTitle = 'Validation Failed';

          // Special handling for common errors
          if (errorPath.includes('references')) {
            errorTitle = 'Character References Required';
            errorMessage =
              'You must provide at least 3 complete character references. Each reference must include name, address, and telephone number.';
          } else if (errorPath.includes('dateOfBirth')) {
            errorTitle = 'Date of Birth Required';
            errorMessage =
              'Please provide a valid date of birth in Personal Information.';
          } else if (
            errorPath.includes('heightM') ||
            errorPath.includes('weightKg')
          ) {
            errorTitle = 'Invalid Measurement';
            errorMessage = firstError.message;
          } else if (error.errors.length === 1) {
            // Single error - show formatted message
            errorMessage = formatValidationErrors(error);
          } else {
            // Multiple errors - show all formatted
            errorTitle = `${error.errors.length} Validation Errors`;
            errorMessage = formatValidationErrors(error);
          }

          toast.error(errorTitle, {
            description: errorMessage,
            duration: 8000, // Longer duration for multiple errors
          });

          // Navigate to section with error
          const errorSection = getSectionForFieldPath(errorPath);
          if (errorSection !== null) {
            setCurrentSection(errorSection);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (createdPdsId) {
          toast.error('Submission Failed', {
            description:
              'Your PDS was saved as draft. You can submit it from the dashboard.',
            action: {
              label: 'Go to Dashboard',
              onClick: () => router.push('/dashboard/pds'),
            },
          });
        } else {
          toast.error('Failed to save PDS', {
            description:
              error instanceof Error ? error.message : 'Please try again.',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createMutation,
      submitMutation,
      clearSaved,
      router,
      currentSection,
      createdPdsId,
      draftId,
      updateMutation,
    ]
  );

  /**
   * Helper to determine which section a field path belongs to
   */
  const getSectionForFieldPath = (fieldPath: string): number | null => {
    if (fieldPath.startsWith('personalInfo')) {
      return 0; // Section I
    }
    if (fieldPath.startsWith('family')) {
      return 1; // Section II
    }
    if (fieldPath.startsWith('education')) {
      return 2; // Section III
    }
    if (
      fieldPath.startsWith('eligibility') ||
      fieldPath.startsWith('workExperience')
    ) {
      return 3; // Section IV
    }
    if (
      fieldPath.startsWith('voluntaryWork') ||
      fieldPath.startsWith('learningDevelopment')
    ) {
      return 4; // Section V
    }
    if (fieldPath.startsWith('otherInfo')) {
      return 5; // Section VI
    }
    return null;
  };

  // Save status display - Enhanced badge design with mobile responsiveness
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
                Create Personal Data Sheet
              </h1>
              <Badge
                variant="outline"
                className="text-xs font-normal border-slate-300 dark:border-slate-700 w-fit">
                CS Form No. 212 Revised 2025
              </Badge>
            </div>

            {/* Save status - Always visible, mobile responsive */}
            <div className="flex items-center gap-2 sm:gap-4">
              {saveStatusDisplay}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndNavigate}
                disabled={isSubmitting}
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save Draft</span>
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

        {/* Deadline notice banner */}
        <DeadlineNotice formType="pds" variant="banner" className="mb-6" />

        {/* Auto-save info banner */}
        {!hasSeenAutoSaveInfo && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Auto-save Enabled
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your progress is automatically saved every minute. You can
                    safely navigate away and resume later, or manually save your
                    work using the &ldquo;Save Draft&rdquo; button.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHasSeenAutoSaveInfo(true);
                  localStorage.setItem(
                    `pds-autosave-info-seen-${userId}`,
                    'true'
                  );
                }}
                className="flex-shrink-0 h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Form */}
        <FormProvider {...form}>
          <PdsProvider
            pdsSubmissionId={draftId}
            canEdit={true}
            initialAttachments={attachments}
            onAttachmentsChange={setAttachments}
            onBeforeUpload={handleAutoSaveForUpload}>
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
                    onClick={handleSaveAndNavigate}
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
              Resume Previous Draft?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found a saved draft of your PDS form. Would you like to
              continue where you left off, or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Resume Draft
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
              Ready to Submit Your PDS?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base">
                  Please review your submission before proceeding. Once
                  submitted, you won&apos;t be able to edit your PDS until it
                  has been reviewed by an administrator.
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
              Yes, Submit for Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
