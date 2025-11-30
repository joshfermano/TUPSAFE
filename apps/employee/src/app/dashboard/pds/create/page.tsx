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
import { useCreatePDS, useSubmitPDS, useUpdatePDS } from '../../../../hooks/usePDS';
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
} from 'lucide-react';

// Validation schemas
import {
  completePdsSchema,
  createEmptyPds,
  getPdsSectionProgress,
  type CompletePdsData,
} from '../../../../lib/validations/pds-schema';
import { z } from 'zod';

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

// Transformations
import { transformPdsForSubmission, transformPdsFromBackend } from '../../../../lib/utils/pds-transformations';

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
  const formDataRef = useRef<Partial<CompletePdsData>>(createEmptyPds());

  // Subscribe to form changes without causing re-renders
  useEffect(() => {
    const subscription = form.watch((value) => {
      formDataRef.current = value as Partial<CompletePdsData>;
    });
    return () => subscription.unsubscribe();
  }, [form]);

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

  // Save draft to database (create or update)
  // Uses ref for synchronous draft ID access to prevent race conditions
  const saveDraftToDatabase = useCallback(
    async (data: PdsDraftData): Promise<{ success: boolean; draftId?: string }> => {
      try {
        // Transform form data for backend
        const transformedData = transformPdsForSubmission(data.formData);

        // Read from ref (synchronous) instead of state (asynchronous)
        const currentDraftId = draftIdRef.current;

        if (currentDraftId) {
          // Update existing draft
          console.log('[PDS Create] Updating draft:', currentDraftId);
          const response = await fetch(`/api/pds/${currentDraftId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transformedData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to update draft');
          }

          console.log('[PDS Create] Draft updated successfully:', currentDraftId);
          return { success: true, draftId: currentDraftId };
        } else {
          // Create new draft
          console.log('[PDS Create] Creating new draft submission');
          const response = await fetch('/api/pds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transformedData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to create draft');
          }

          const result = await response.json();
          if (result.data?.id) {
            // Update both ref and state together
            updateDraftId(result.data.id);
            console.log('[PDS Create] Draft created successfully:', result.data.id);
            return { success: true, draftId: result.data.id };
          } else {
            throw new Error('No draft ID returned from server');
          }
        }
      } catch (error) {
        console.error('[PDS Create] Error saving draft to database:', error);
        throw error;
      }
    },
    [updateDraftId] // Stable dependency
  );

  // Auto-save setup with database persistence
  const { saveStatus, lastSaved, saveNow, clearSaved } =
    useAutoSave<PdsDraftData>({
      key: `pds-draft-${userId}`,
      getData: getDraftData,
      debounceMs: 3000,
      autoSaveIntervalMs: 30000,
      enabled: !isSubmitting,
      showToast: false,
      onSave: async (data: PdsDraftData) => {
        await saveDraftToDatabase(data);
        // Return void - wrapper function that discards the return value
      },
      onError: (error) => {
        console.error('Draft save error:', error);
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

  // Manual save and navigate handler
  const handleSaveAndNavigate = useCallback(async (): Promise<void> => {
    // Since saveNow() doesn't throw errors (they're caught in performSave),
    // we need to manually call saveDraftToDatabase with proper error handling
    try {
      const draftData = getDraftData();

      // Save to database directly with error propagation
      await saveDraftToDatabase(draftData);

      // Also save to localStorage via saveNow (for offline backup)
      await saveNow();

      // If we get here, save was successful
      toast.success('Draft Saved', {
        description: draftId
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
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });

      // Don't navigate on error
    }
  }, [getDraftData, saveDraftToDatabase, saveNow, draftId, router]);

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
        // STEP 1: Prepare data for validation with type conversions only
        // Apply type conversions but keep the original structure (object format)
        const dataWithTypeConversions = { ...data };

        // Convert Personal Info date/number fields
        if (dataWithTypeConversions.personalInfo) {
          dataWithTypeConversions.personalInfo = {
            ...dataWithTypeConversions.personalInfo,
            dateOfBirth: dataWithTypeConversions.personalInfo.dateOfBirth 
              ? (dataWithTypeConversions.personalInfo.dateOfBirth instanceof Date 
                ? dataWithTypeConversions.personalInfo.dateOfBirth 
                : new Date(dataWithTypeConversions.personalInfo.dateOfBirth))
              : null,
            heightM: dataWithTypeConversions.personalInfo.heightM
              ? (typeof dataWithTypeConversions.personalInfo.heightM === 'number'
                ? dataWithTypeConversions.personalInfo.heightM
                : parseFloat(dataWithTypeConversions.personalInfo.heightM as any))
              : null,
            weightKg: dataWithTypeConversions.personalInfo.weightKg
              ? (typeof dataWithTypeConversions.personalInfo.weightKg === 'number'
                ? dataWithTypeConversions.personalInfo.weightKg
                : parseFloat(dataWithTypeConversions.personalInfo.weightKg as any))
              : null,
          } as any;
        }

        // Convert Family Background - Children dateOfBirth
        if (dataWithTypeConversions.family?.children) {
          dataWithTypeConversions.family.children = dataWithTypeConversions.family.children.map((child: any) => ({
            ...child,
            dateOfBirth: child.dateOfBirth
              ? (child.dateOfBirth instanceof Date
                ? child.dateOfBirth
                : new Date(child.dateOfBirth))
              : null,
          }));
        }

        // Convert Civil Service Eligibility dates
        if (dataWithTypeConversions.eligibility) {
          dataWithTypeConversions.eligibility = dataWithTypeConversions.eligibility.map((item: any) => ({
            ...item,
            dateOfExam: item.dateOfExam
              ? (item.dateOfExam instanceof Date
                ? item.dateOfExam
                : new Date(item.dateOfExam))
              : null,
            licenseValidityDate: item.licenseValidityDate
              ? (item.licenseValidityDate instanceof Date
                ? item.licenseValidityDate
                : new Date(item.licenseValidityDate))
              : null,
          }));
        }

        // Convert Work Experience dates and salary
        if (dataWithTypeConversions.workExperience) {
          dataWithTypeConversions.workExperience = dataWithTypeConversions.workExperience.map((item: any) => ({
            ...item,
            dateFrom: item.dateFrom
              ? (item.dateFrom instanceof Date
                ? item.dateFrom
                : new Date(item.dateFrom))
              : null,
            dateTo: item.dateTo
              ? (item.dateTo instanceof Date
                ? item.dateTo
                : new Date(item.dateTo))
              : null,
            monthlySalary: item.monthlySalary
              ? (typeof item.monthlySalary === 'number'
                ? item.monthlySalary
                : parseFloat(item.monthlySalary))
              : null,
          }));
        }

        // Convert Voluntary Work dates and hours
        if (dataWithTypeConversions.voluntaryWork) {
          dataWithTypeConversions.voluntaryWork = dataWithTypeConversions.voluntaryWork.map((item: any) => ({
            ...item,
            dateFrom: item.dateFrom
              ? (item.dateFrom instanceof Date
                ? item.dateFrom
                : new Date(item.dateFrom))
              : null,
            dateTo: item.dateTo
              ? (item.dateTo instanceof Date
                ? item.dateTo
                : new Date(item.dateTo))
              : null,
            numberOfHours: item.numberOfHours
              ? (typeof item.numberOfHours === 'number'
                ? item.numberOfHours
                : parseFloat(item.numberOfHours))
              : null,
          }));
        }

        // Convert Learning Development dates and hours
        if (dataWithTypeConversions.learningDevelopment) {
          dataWithTypeConversions.learningDevelopment = dataWithTypeConversions.learningDevelopment.map((item: any) => ({
            ...item,
            dateFrom: item.dateFrom
              ? (item.dateFrom instanceof Date
                ? item.dateFrom
                : new Date(item.dateFrom))
              : null,
            dateTo: item.dateTo
              ? (item.dateTo instanceof Date
                ? item.dateTo
                : new Date(item.dateTo))
              : null,
            hours: item.hours
              ? (typeof item.hours === 'number'
                ? item.hours
                : parseFloat(item.hours))
              : null,
          }));
        }

        // Filter out empty references (a reference is considered filled if it has ALL required fields)
        if (dataWithTypeConversions.otherInfo?.references) {
          dataWithTypeConversions.otherInfo.references =
            dataWithTypeConversions.otherInfo.references.filter(
              (ref: any) =>
                ref.name && ref.name.trim() !== '' &&
                ref.address && ref.address.trim() !== '' &&
                ref.telephoneNo && ref.telephoneNo.trim() !== ''
            );
        }

        // Log for debugging
        console.log('Data with type conversions:', {
          hasPersonalInfo: !!dataWithTypeConversions.personalInfo,
          hasFamily: !!dataWithTypeConversions.family,
          hasEducation: !!dataWithTypeConversions.education,
          educationType: Array.isArray(dataWithTypeConversions.education) ? 'array' : 'object',
          referencesCount: dataWithTypeConversions.otherInfo?.references?.length || 0,
          dateOfBirthType: typeof dataWithTypeConversions.personalInfo?.dateOfBirth,
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
          const createResult = await createMutation.mutateAsync(backendData as any);

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
          const firstError = error.errors[0];
          const errorPath = firstError.path.join('.');
          console.error('Validation errors:', error.errors);

          // Provide user-friendly error messages
          let errorMessage = firstError.message;
          let errorTitle = 'Validation Error';

          // Special handling for references error
          if (errorPath.includes('references')) {
            errorTitle = 'Character References Required';
            errorMessage = 'You must provide at least 3 complete character references. Each reference must include name, address, and telephone number.';
          } else if (errorPath.includes('dateOfBirth')) {
            errorTitle = 'Date of Birth Required';
            errorMessage = 'Please provide a valid date of birth.';
          } else if (errorPath.includes('heightM') || errorPath.includes('weightKg')) {
            errorTitle = 'Invalid Measurement';
            errorMessage = firstError.message;
          } else {
            errorMessage = `${errorPath}: ${firstError.message}`;
          }

          toast.error(errorTitle, {
            description: errorMessage,
          });

          const errorSection = getSectionForFieldPath(errorPath);
          if (errorSection !== null) {
            setCurrentSection(errorSection);
          }
        } else if (createdPdsId) {
          toast.error('Submission Failed', {
            description: 'Your PDS was saved as draft. You can submit it from the dashboard.',
            action: {
              label: 'Go to Dashboard',
              onClick: () => router.push('/dashboard/pds'),
            },
          });
        } else {
          toast.error('Failed to save PDS', {
            description: error instanceof Error ? error.message : 'Please try again.',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [createMutation, submitMutation, clearSaved, router, currentSection, createdPdsId, draftId, updateMutation]
  );;

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

  // Save status display
  const saveStatusDisplay = useMemo(() => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-3 w-3" />
            <span>
              Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>Save failed</span>
          </div>
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
      <div className="relative z-10 container max-w-5xl mx-auto px-6 py-12">
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

            {/* Save status */}
            <div className="hidden sm:flex items-center gap-4">
              {saveStatusDisplay}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndNavigate}
                disabled={isSubmitting}
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
                <Save className="h-4 w-4 mr-2" />
                Save Now
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
                    <ShimmerButton
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[160px]">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          Submit PDS
                        </>
                      )}
                    </ShimmerButton>
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
    </div>
  );
}
