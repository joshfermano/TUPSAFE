'use client';

/**
 * SALN (Statement of Assets, Liabilities, and Net Worth) Create Page
 * CSC Form No. SALN 2019 Revised
 *
 * Comprehensive 7-step multi-step form with:
 * - Auto-save functionality (every 30 seconds)
 * - Draft restoration on mount
 * - Real-time financial calculations
 * - Auto-calculated net worth summary
 * - Real-time validation per step
 * - Progress tracking with visual indicators
 * - TUP Manila crimson theme
 * - Magic UI components for premium feel
 * - Full accessibility (WCAG 2.1 AA)
 * - Mobile-responsive design
 */

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { z } from 'zod';
import { EmployeeOnlyGuard } from '../../../../components/guards/EmployeeOnlyGuard';
import {
  User,
  Building,
  Car,
  CreditCard,
  Briefcase,
  Users,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileCheck,
  Clock,
  Info,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// Validation schemas
import {
  completeSalnSchema,
  createEmptySaln,
  calculateSalnSummary,
  getSalnSectionProgress,
  getOverallSalnProgress,
  type CompleteSalnData,
} from '../../../../lib/validations/saln-schema';

// Form components
import {
  SALNStepIndicator,
  FormStepSkeleton,
  type SALNStep,
} from '../../../../components/forms/shared';
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

// Magic UI components
import { ShimmerButton } from '../../../../components/ui/shimmer-button';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { DotPattern } from '../../../../components/ui/dot-pattern';

// Hooks
import { useAutoSave, getSavedDraft } from '../../../../hooks/useAutoSave';
import { useAuth } from '../../../../providers/AuthProvider';
import { useCreateSALN, useUpdateSALN, useSubmitSALN } from '../../../../hooks/useSaln';

// Transformations
import {
  transformSalnForSubmission,
  transformSalnFromBackend,
} from '../../../../lib/utils/saln-transformations';

// Step components
import {
  DeclarantInfo,
  RealProperties,
  PersonalProperties,
  Liabilities,
  BusinessRelatives,
  NetWorthSummary,
  ReviewSubmit,
} from './steps';

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const FORM_STEPS: SALNStep[] = [
  {
    id: 'declarant-info',
    label: 'Declarant Info',
    description: 'Basic information and filing type',
    icon: User,
  },
  {
    id: 'real-properties',
    label: 'Real Properties',
    description: 'Land, houses, and buildings',
    icon: Building,
  },
  {
    id: 'personal-properties',
    label: 'Personal Properties',
    description: 'Vehicles, cash, and investments',
    icon: Car,
  },
  {
    id: 'liabilities',
    label: 'Liabilities',
    description: 'Debts and outstanding loans',
    icon: CreditCard,
  },
  {
    id: 'business-relatives',
    label: 'Business & Relatives',
    description: 'Business interests and government relatives',
    icon: Briefcase,
  },
  {
    id: 'net-worth-summary',
    label: 'Net Worth',
    description: 'Auto-calculated financial summary',
    icon: Calculator,
  },
  {
    id: 'review-submit',
    label: 'Review & Submit',
    description: 'Final review and declaration',
    icon: Users,
  },
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Draft data structure for saving/restoring form state
 */
interface SalnDraftData {
  formData: Partial<CompleteSalnData>;
  completedSteps: number[];
  currentStep: number;
  savedAt: string;
}

// ============================================================================
// SECTION FIELD MAPPINGS (for validation)
// ============================================================================

/**
 * Get the form field paths for a specific step
 * Used for per-step validation before navigation
 */
const getSectionFields = (step: number): string[] => {
  switch (step) {
    case 0: // Step 0: Declarant Info
      return [
        'submission.year',
        'submission.filingType',
        // Spouse name is conditionally required based on filingType
        // This is handled by the schema's refine() method
      ];
    case 1: // Step 1: Real Properties - Optional
      return [];
    case 2: // Step 2: Personal Properties - Optional
      return [];
    case 3: // Step 3: Liabilities - Optional
      return [];
    case 4: // Step 4: Business & Relatives - Optional
      return [];
    case 5: // Step 5: Net Worth Summary - Read-only, no validation needed
      return [];
    case 6: // Step 6: Review & Submit - Full validation done on submit
      return [];
    default:
      return [];
  }
};

/**
 * Get required fields description for error messages
 */
const getSectionRequiredFieldsDescription = (step: number): string => {
  switch (step) {
    case 0:
      return 'year and filing type';
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      return 'all fields in this section';
    default:
      return 'all required fields';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SALNCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Check if loading from existing draft
  const draftIdFromUrl = searchParams.get('draftId');

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [hasSeenAutoSaveInfo, setHasSeenAutoSaveInfo] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(`saln-autosave-info-seen-${userId}`) === 'true';
  });
  const selectedYear = new Date().getFullYear();

  // Ref-based draft ID tracking to prevent race conditions
  const draftIdRef = useRef<string | null>(null);
  const [hasDraftId, setHasDraftId] = useState(false);

  // Helper to update both ref and state together
  const updateDraftId = useCallback((newDraftId: string | null) => {
    draftIdRef.current = newDraftId;
    setHasDraftId(!!newDraftId);
  }, []);

  // Initialize mutations
  const createSALNMutation = useCreateSALN();
  const updateSALNMutation = useUpdateSALN(draftIdRef.current || '');
  const submitSALNMutation = useSubmitSALN(draftIdRef.current || '');

  // Form setup - no resolver during multi-step flow
  // Final validation happens on submission
  const form = useForm<Partial<CompleteSalnData>>({
    defaultValues: createEmptySaln(selectedYear, userId),
    mode: 'onBlur',
  });

  // Extract watch from form methods
  const { watch } = form;

  // Callback-based approach for getting draft data
  const getDraftData = useCallback(
    (): SalnDraftData => ({
      formData: form.getValues(),
      completedSteps,
      currentStep,
      savedAt: new Date().toISOString(),
    }),
    [completedSteps, currentStep, form]
  );

  // Save draft to database (create or update)
  const saveDraftToDatabase = useCallback(
    async (data: SalnDraftData): Promise<{ success: boolean; draftId?: string }> => {
      try {
        // Transform form data for backend
        const transformedData = transformSalnForSubmission(data.formData);

        // Read from ref (synchronous) instead of state (asynchronous)
        const currentDraftId = draftIdRef.current;

        if (currentDraftId) {
          // Update existing draft
          console.log('[SALN Create] Updating draft:', currentDraftId);
          await updateSALNMutation.mutateAsync(transformedData as any);
          console.log('[SALN Create] Draft updated successfully:', currentDraftId);
          return { success: true, draftId: currentDraftId };
        } else {
          // Create new draft
          console.log('[SALN Create] Creating new draft submission');
          const result = await createSALNMutation.mutateAsync(transformedData as any);

          if (result?.data?.id) {
            // Update both ref and state together
            updateDraftId(result.data.id);
            console.log('[SALN Create] Draft created successfully:', result.data.id);
            return { success: true, draftId: result.data.id };
          } else {
            throw new Error('No draft ID returned from server');
          }
        }
      } catch (error) {
        console.error('[SALN Create] Error saving draft to database:', error);
        throw error;
      }
    },
    [updateDraftId, createSALNMutation, updateSALNMutation]
  );

  // Auto-save setup with database persistence (60-second intervals)
  const { saveStatus, lastSaved, saveNow, clearSaved } = useAutoSave<SalnDraftData>({
    key: `saln-draft-${userId}-${selectedYear}`,
    getData: getDraftData,
    debounceMs: 60000,
    autoSaveIntervalMs: 60000,
    enabled: !isSubmitting,
    showToast: false,
    onSave: async (data: SalnDraftData) => {
      await saveDraftToDatabase(data);
    },
    onError: (error) => {
      console.error('Draft save error:', error);
    },
  });

  // Watch the actual field arrays that matter for calculations
  const realProperties = watch('realProperties') || [];
  const personalProperties = watch('personalProperties') || [];
  const liabilities = watch('liabilities') || [];

  // Real-time financial calculations based on watched arrays
  const financialSummary = useMemo(() => {
    console.log('[SALN Create] Calculating financial summary:', {
      realProperties,
      personalProperties,
      liabilities,
    });

    const summary = calculateSalnSummary({
      realProperties,
      personalProperties,
      liabilities,
    });

    console.log('[SALN Create] Calculated summary:', summary);
    return summary;
  }, [realProperties, personalProperties, liabilities]);

  // Calculate real-time progress based on form data
  const formProgress = useMemo(() => {
    const formData = form.getValues();
    return getOverallSalnProgress(formData);
  }, [form, realProperties, personalProperties, liabilities]);

  // Update form calculations in real-time
  useEffect(() => {
    form.setValue('calculations', financialSummary, {
      shouldValidate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialSummary]);

  // Load draft from database if draftId is present in URL
  useEffect(() => {
    if (draftIdFromUrl) {
      // Load draft from database
      fetch(`/api/saln/${draftIdFromUrl}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Failed to load draft');
          }
          return res.json();
        })
        .then((result) => {
          if (result.success && result.data) {
            const salnData = result.data;

            // Set draft ID for future updates
            updateDraftId(draftIdFromUrl);

            // Transform backend data to frontend format
            const formData = transformSalnFromBackend(salnData);

            // Reset form with transformed data
            form.reset(formData);

            // Calculate completed steps based on loaded data
            const sectionProgress = getSalnSectionProgress(formData);
            const completed: number[] = [];

            // Map section progress to step indices
            // Only mark as completed if 100% filled
            if (sectionProgress.declarantInfo >= 100) completed.push(0);
            if (sectionProgress.realProperties >= 100) completed.push(1);
            if (sectionProgress.personalProperties >= 100) completed.push(2);
            if (sectionProgress.liabilities >= 100) completed.push(3);
            if (sectionProgress.businessInterests >= 100) completed.push(4);
            if (sectionProgress.relativesInGov >= 100) completed.push(5);

            setCompletedSteps(completed);

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
      const savedDraft = getSavedDraft<SalnDraftData>(
        `saln-draft-${userId}-${selectedYear}`
      );
      if (
        savedDraft &&
        savedDraft.formData &&
        Object.keys(savedDraft.formData).length > 0
      ) {
        setShowDraftDialog(true);
      }
    }
  }, [draftIdFromUrl, userId, selectedYear, form, updateDraftId]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = getSavedDraft<SalnDraftData>(
      `saln-draft-${userId}-${selectedYear}`
    );
    if (savedDraft && savedDraft.formData) {
      // Restore form data
      form.reset(savedDraft.formData);

      // Calculate completed steps based on actual form data
      const sectionProgress = getSalnSectionProgress(savedDraft.formData);
      const completed: number[] = [];

      // Map section progress to step indices
      // Only mark as completed if 100% filled
      if (sectionProgress.declarantInfo >= 100) completed.push(0);
      if (sectionProgress.realProperties >= 100) completed.push(1);
      if (sectionProgress.personalProperties >= 100) completed.push(2);
      if (sectionProgress.liabilities >= 100) completed.push(3);
      if (sectionProgress.businessInterests >= 100) completed.push(4);
      if (sectionProgress.relativesInGov >= 100) completed.push(5);

      setCompletedSteps(completed);

      // Restore current step position
      if (
        typeof savedDraft.currentStep === 'number' &&
        savedDraft.currentStep >= 0
      ) {
        setCurrentStep(savedDraft.currentStep);
      }

      const savedTime = savedDraft.savedAt
        ? new Date(savedDraft.savedAt).toLocaleString()
        : 'previously';
      toast.success('Draft Restored', {
        description: `Your work from ${savedTime} has been loaded.`,
      });
    }
    setShowDraftDialog(false);
  }, [userId, selectedYear, form]);

  const handleDiscardDraft = useCallback(() => {
    clearSaved();
    setShowDraftDialog(false);
    toast.info('Draft Discarded', {
      description: 'Starting with a blank form.',
    });
  }, [clearSaved]);

  // Manual save and navigate handler
  const handleSaveAndNavigate = useCallback(async (): Promise<void> => {
    try {
      const draftData = getDraftData();

      // Save to database directly with error propagation
      await saveDraftToDatabase(draftData);

      // Also save to localStorage via saveNow (for offline backup)
      await saveNow();

      // If we get here, save was successful
      toast.success('Draft Saved', {
        description: hasDraftId
          ? 'Your draft has been updated.'
          : 'Your draft has been saved successfully.',
      });

      // Navigate to drafts page after successful save
      router.push('/dashboard/saln/drafts');
    } catch (error) {
      console.error('[SALN Create] Failed to save draft:', error);

      toast.error('Failed to save draft', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
        duration: 5000,
      });
    }
  }, [getDraftData, saveDraftToDatabase, saveNow, hasDraftId, router]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    const sectionFields = getSectionFields(currentStep);

    // If there are required fields, validate them
    if (sectionFields.length > 0) {
      const isValid = await form.trigger(
        sectionFields as Parameters<typeof form.trigger>[0]
      );

      if (!isValid) {
        const requiredFieldsDesc =
          getSectionRequiredFieldsDescription(currentStep);
        toast.error('Please fill in all required fields', {
          description: `Required: ${requiredFieldsDesc}`,
        });
        return;
      }
    }

    // Mark step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Move to next step
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, completedSteps, form]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex <= currentStep || completedSteps.includes(stepIndex - 1)) {
        setCurrentStep(stepIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentStep, completedSteps]
  );

  // Form submission with real API integration
  const handleSubmit = useCallback(
    async (data: Partial<CompleteSalnData>) => {
      setIsSubmitting(true);

      try {
        // Step 1: Validate complete form
        completeSalnSchema.parse(data);

        // Step 2: Ensure draft exists
        const currentDraftId = draftIdRef.current;
        if (!currentDraftId) {
          // Create draft first if it doesn't exist
          const draftData = getDraftData();
          const result = await saveDraftToDatabase(draftData);
          if (!result.draftId) {
            throw new Error('Failed to create draft before submission');
          }
        }

        // Step 3: Submit for approval
        await submitSALNMutation.mutateAsync();

        // Step 4: Success feedback
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('SALN Submitted Successfully!', {
          description:
            'Your Statement of Assets, Liabilities, and Net Worth has been submitted for review.',
        });

        // Clear draft from localStorage
        clearSaved();

        // Step 5: Redirect
        setTimeout(() => {
          router.push('/dashboard/saln');
        }, 2000);
      } catch (error) {
        console.error('Submission error:', error);

        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          toast.error('Validation Error', {
            description: firstError.message,
            duration: 5000,
          });
        } else {
          toast.error('Submission Failed', {
            description:
              error instanceof Error
                ? error.message
                : 'Please review your form and try again.',
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearSaved, router, submitSALNMutation, getDraftData, saveDraftToDatabase]
  );

  // Save status display - Enhanced badge design
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
            <AlertCircle className="h-3 w-3 mr-1.5 text-red-600 dark:text-red-400" />
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

  // Render current step - NO key prop to prevent remounting
  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 0:
        return <DeclarantInfo />;
      case 1:
        return <RealProperties />;
      case 2:
        return <PersonalProperties />;
      case 3:
        return <Liabilities />;
      case 4:
        return <BusinessRelatives />;
      case 5:
        return <NetWorthSummary summary={financialSummary} />;
      case 6:
        return <ReviewSubmit data={form.getValues()} summary={financialSummary} />;
      default:
        return null;
    }
  }, [currentStep, financialSummary, form]);

  const isLastStep = currentStep === FORM_STEPS.length - 1;

  return (
    <EmployeeOnlyGuard>
    <div className="relative">
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
                Create SALN Statement
              </h1>
              <Badge
                variant="outline"
                className="text-xs font-normal border-slate-300 dark:border-slate-700 w-fit">
                CSC Form No. SALN 2019
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

          {/* Progress indicator */}
          <SALNStepIndicator
            steps={FORM_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            progressPercentage={formProgress}
          />
        </div>

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
                    `saln-autosave-info-seen-${userId}`,
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
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <BlurFade delay={0.2}>
              <Suspense fallback={<FormStepSkeleton fieldCount={7} />}>
                {/* Step content - No key prop to prevent remounting */}
                <div className="mb-10">{renderStep}</div>
              </Suspense>
            </BlurFade>

            {/* Navigation buttons */}
            <BlurFade delay={0.3}>
              <div className="flex items-center justify-between gap-4 pt-10 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isSubmitting}>
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

                  {isLastStep ? (
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
            </BlurFade>
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
              We found a saved draft of your SALN form for {selectedYear}. Would
              you like to continue where you left off, or start fresh?
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
              Ready to Submit Your SALN?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base">
                  Please review your submission before proceeding. Once
                  submitted, you won&apos;t be able to edit your SALN until it
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
                          <span>
                            Are all assets, liabilities, and properties listed?
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            Did you include all business interests and government relatives?
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>
                            Is the net worth calculation accurate?
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
    </EmployeeOnlyGuard>
  );
}
