'use client';

/**
 * PDS (Personal Data Sheet) Create Page
 * CS Form No. 212 Revised 2025
 *
 * Comprehensive 8-step multi-step form with:
 * - Auto-save functionality (every 30 seconds) with API persistence
 * - Draft restoration on mount (including completed steps)
 * - Real-time validation per step with required field enforcement
 * - Progress tracking with visual indicators
 * - TUP Manila crimson theme
 * - Magic UI components for premium feel
 * - Full accessibility (WCAG 2.1 AA)
 * - Mobile-responsive design
 */

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  User,
  Home,
  Phone,
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
  completedSteps: number[];
  currentStep: number;
  savedAt: string;
}

// Form components
import {
  FormStepIndicator,
  FormStepSkeleton,
  type FormStep,
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
import { AnimatedGradientText } from '../../../../components/ui/animated-gradient-text';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { DotPattern } from '../../../../components/ui/dot-pattern';

// Hooks
import { useAutoSave, getSavedDraft } from '../../../../hooks/useAutoSave';
import { useAuth } from '../../../../providers/AuthProvider';

// Step components
import {
  PersonalBasic,
  Addresses,
  Contact,
  Family,
  Education,
  EligibilityWork,
  VoluntaryTraining,
  OtherReview,
} from './steps';

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const FORM_STEPS: FormStep[] = [
  {
    id: 'personal-basic',
    label: 'Personal Info',
    description: 'Basic personal information and IDs',
    icon: User,
  },
  {
    id: 'addresses',
    label: 'Addresses',
    description: 'Residential and permanent addresses',
    icon: Home,
  },
  {
    id: 'contact',
    label: 'Contact',
    description: 'Phone numbers and email',
    icon: Phone,
  },
  {
    id: 'family',
    label: 'Family',
    description: 'Spouse, parents, and children',
    icon: Users,
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Educational attainment',
    icon: GraduationCap,
  },
  {
    id: 'eligibility-work',
    label: 'Work Experience',
    description: 'Civil service and work history',
    icon: Briefcase,
  },
  {
    id: 'voluntary-training',
    label: 'Training',
    description: 'Voluntary work and learning',
    icon: Heart,
  },
  {
    id: 'other-review',
    label: 'Review',
    description: 'Skills, references, and review',
    icon: Info,
  },
];

// Note: Using complete schema for validation instead of per-step schemas
// This ensures compatibility with Zod v4 and @hookform/resolvers/zod
// Per-step validation can be handled manually in the step navigation logic

// ============================================================================
// STEP FIELD MAPPINGS
// ============================================================================

/**
 * Get the form field paths for a specific step
 * Used for per-step validation before navigation
 *
 * @param step - The step index (0-based)
 * @returns Array of field paths to validate for the given step
 */
const getStepFields = (step: number): string[] => {
  switch (step) {
    case 0: // Personal Basic - REQUIRED
      return [
        'personalInfo.surname',
        'personalInfo.firstName',
        'personalInfo.dateOfBirth',
        'personalInfo.placeOfBirth',
        'personalInfo.sex',
        'personalInfo.civilStatus',
        'personalInfo.citizenship',
      ];
    case 1: // Addresses - Key fields required
      return [
        'personalInfo.residentialAddress.barangay',
        'personalInfo.residentialAddress.cityMunicipality',
        'personalInfo.residentialAddress.province',
        'personalInfo.permanentAddress.barangay',
        'personalInfo.permanentAddress.cityMunicipality',
        'personalInfo.permanentAddress.province',
      ];
    case 2: // Contact - At least mobile or email
      return [
        'personalInfo.mobileNo',
        'personalInfo.emailAddress',
      ];
    case 3: // Family - Optional, return empty
      return [];
    case 4: // Education - Optional, return empty
      return [];
    case 5: // Eligibility & Work - Optional, return empty
      return [];
    case 6: // Voluntary & Training - Optional, return empty
      return [];
    case 7: // Other Info & Review - References required on final submission
      return [
        'otherInfo.references',
      ];
    default:
      return [];
  }
};

/**
 * Get required fields description for error messages
 */
const getStepRequiredFieldsDescription = (step: number): string => {
  switch (step) {
    case 0:
      return 'surname, first name, date of birth, place of birth, sex, civil status, and citizenship';
    case 1:
      return 'barangay, city/municipality, and province for both residential and permanent addresses';
    case 2:
      return 'at least a mobile number or email address for contact';
    case 7:
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
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [_showExitDialog, _setShowExitDialog] = useState(false); // Reserved for exit confirmation
  const [_hasSavedDraft, setHasSavedDraft] = useState(false); // Tracking draft state

  // Form setup - no resolver during multi-step flow to allow incomplete data
  // Final validation happens on submission
  // Using 'onBlur' mode to validate on blur instead of every keystroke (performance optimization)
  const form = useForm<Partial<CompletePdsData>>({
    defaultValues: createEmptyPds(),
    mode: 'onBlur',
  });

  // Ref-based subscription to track form changes without causing re-renders
  // This is a performance optimization - we only need the data for auto-save, not for rendering
  const formDataRef = useRef<Partial<CompletePdsData>>(createEmptyPds());

  // Subscribe to form changes without causing re-renders
  useEffect(() => {
    const subscription = form.watch((value) => {
      formDataRef.current = value as Partial<CompletePdsData>;
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Callback-based approach for getting draft data
  // This doesn't cause re-renders when form data changes
  const getDraftData = useCallback((): PdsDraftData => ({
    formData: form.getValues(),
    completedSteps,
    currentStep,
    savedAt: new Date().toISOString(),
  }), [completedSteps, currentStep, form]);

  // Auto-save setup with API persistence
  // Using getDraftData callback instead of reactive data to avoid re-renders
  const { saveStatus, lastSaved, saveNow, clearSaved, hasSavedData } =
    useAutoSave<PdsDraftData>({
      key: `pds-draft-${userId}`,
      getData: getDraftData, // Callback-based approach for better performance
      debounceMs: 3000, // Increased from 2000ms to reduce save frequency
      autoSaveIntervalMs: 30000,
      enabled: !isSubmitting,
      showToast: false, // Disabled to reduce DOM updates and improve performance
      onSave: async (data) => {
        // Save to API as well for server-side persistence
        try {
          await fetch('/api/pds/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } catch (error) {
          console.error('Failed to save draft to server:', error);
          // LocalStorage will still work as backup
          // Don't throw - we want the local save to succeed even if API fails
        }
      },
      onError: (error) => {
        console.error('Draft save error:', error);
        // Error toast is handled by useAutoSave when showToast is true
      },
    });

  // Check for saved draft on mount
  useEffect(() => {
    const savedDraft = getSavedDraft<PdsDraftData>(`pds-draft-${userId}`);
    if (savedDraft && savedDraft.formData && Object.keys(savedDraft.formData).length > 0) {
      setHasSavedDraft(true);
      setShowDraftDialog(true);
    }
  }, [userId]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = getSavedDraft<PdsDraftData>(`pds-draft-${userId}`);
    if (savedDraft && savedDraft.formData) {
      // Restore form data
      form.reset(savedDraft.formData);

      // Restore completed steps from saved draft
      if (savedDraft.completedSteps && Array.isArray(savedDraft.completedSteps)) {
        setCompletedSteps(savedDraft.completedSteps);
      } else {
        // Fallback: Calculate which steps are completed based on form data
        const progress = getPdsSectionProgress(savedDraft.formData);
        const completed: number[] = [];
        Object.entries(progress).forEach(([, value], index) => {
          if (value >= 100) {
            completed.push(index);
          }
        });
        setCompletedSteps(completed);
      }

      // Restore current step position
      if (typeof savedDraft.currentStep === 'number' && savedDraft.currentStep >= 0) {
        setCurrentStep(savedDraft.currentStep);
      }

      // Show success message with last saved time if available
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

  // Validate current step - only validates fields for the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const stepFields = getStepFields(currentStep);

    // If there are no required fields for this step, it's valid
    if (stepFields.length === 0) {
      return true;
    }

    // Validate only the current step's fields
    // Cast to any because react-hook-form trigger accepts string | string[] but TS typing is strict
    const isValid = await form.trigger(stepFields as Parameters<typeof form.trigger>[0]);
    return isValid;
  }, [form, currentStep]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    // Get the fields for the current step
    const stepFields = getStepFields(currentStep);

    // If there are required fields, validate them
    if (stepFields.length > 0) {
      // Validate only the current step's fields
      const isValid = await form.trigger(stepFields as Parameters<typeof form.trigger>[0]);

      if (!isValid) {
        const requiredFieldsDesc = getStepRequiredFieldsDescription(currentStep);
        toast.error('Please fill in all required fields', {
          description: `Required fields: ${requiredFieldsDesc}`,
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

  // Form submission with real API call
  const handleSubmit = useCallback(
    async (data: Partial<CompletePdsData>) => {
      setIsSubmitting(true);

      try {
        // Validate complete form with Zod schema
        const validatedData = completePdsSchema.parse(data);

        // Call real API to create PDS
        const response = await fetch('/api/pds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to create PDS (${response.status})`
          );
        }

        const result = await response.json();

        // Clear draft on success
        clearSaved();

        // Show success animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('PDS Created Successfully!', {
          description: 'Your Personal Data Sheet has been saved.',
        });

        // Redirect after animation
        setTimeout(() => {
          router.push('/dashboard/pds');
        }, 2000);
      } catch (error) {
        console.error('Submission error:', error);

        if (error instanceof z.ZodError) {
          // Show validation errors from Zod
          const firstError = error.errors[0];
          const fieldPath = firstError.path.join('.');
          toast.error('Validation Error', {
            description: `${fieldPath}: ${firstError.message}`,
          });

          // Try to navigate to the step with the error
          const errorStep = getStepForFieldPath(fieldPath);
          if (errorStep !== null && errorStep !== currentStep) {
            setCurrentStep(errorStep);
            toast.info('Navigated to the step with errors', {
              description: 'Please fix the highlighted fields.',
            });
          }
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
    [clearSaved, router, currentStep]
  );

  /**
   * Helper to determine which step a field path belongs to
   */
  const getStepForFieldPath = (fieldPath: string): number | null => {
    if (fieldPath.startsWith('personalInfo.surname') ||
        fieldPath.startsWith('personalInfo.firstName') ||
        fieldPath.startsWith('personalInfo.dateOfBirth') ||
        fieldPath.startsWith('personalInfo.placeOfBirth') ||
        fieldPath.startsWith('personalInfo.sex') ||
        fieldPath.startsWith('personalInfo.civilStatus') ||
        fieldPath.startsWith('personalInfo.citizenship')) {
      return 0;
    }
    if (fieldPath.includes('residentialAddress') || fieldPath.includes('permanentAddress')) {
      return 1;
    }
    if (fieldPath.includes('telephoneNo') || fieldPath.includes('mobileNo') || fieldPath.includes('emailAddress')) {
      return 2;
    }
    if (fieldPath.startsWith('family')) {
      return 3;
    }
    if (fieldPath.startsWith('education')) {
      return 4;
    }
    if (fieldPath.startsWith('eligibility') || fieldPath.startsWith('workExperience')) {
      return 5;
    }
    if (fieldPath.startsWith('voluntaryWork') || fieldPath.startsWith('learningDevelopment')) {
      return 6;
    }
    if (fieldPath.startsWith('otherInfo')) {
      return 7;
    }
    return null;
  };

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    return Math.round((completedSteps.length / FORM_STEPS.length) * 100);
  }, [completedSteps.length]);

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

  // Render current step
  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 0:
        return <PersonalBasic />;
      case 1:
        return <Addresses />;
      case 2:
        return <Contact />;
      case 3:
        return <Family />;
      case 4:
        return <Education />;
      case 5:
        return <EligibilityWork />;
      case 6:
        return <VoluntaryTraining />;
      case 7:
        return <OtherReview />;
      default:
        return null;
    }
  }, [currentStep]);

  const isLastStep = currentStep === FORM_STEPS.length - 1;

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
        {/* Header */}
        <div className="pb-8 mb-8 border-b border-slate-200/50 dark:border-slate-800/50">
          <BlurFade delay={0.1}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <AnimatedGradientText className="text-2xl sm:text-3xl font-semibold">
                  Create Personal Data Sheet
                </AnimatedGradientText>
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-slate-300/50 dark:border-slate-700/50 w-fit">
                  CS Form No. 212 Revised 2025
                </Badge>
              </div>

              {/* Save status */}
              <div className="hidden sm:flex items-center gap-4">
                {saveStatusDisplay}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveNow}
                  disabled={isSubmitting}
                  className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Save className="h-4 w-4 mr-2" />
                  Save Now
                </Button>
              </div>
            </div>

            {/* Progress indicator */}
            <FormStepIndicator
              steps={FORM_STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              compact={false}
            />
          </BlurFade>
        </div>

        {/* Form */}
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <BlurFade delay={0.2} key={currentStep}>
              <Suspense fallback={<FormStepSkeleton fieldCount={8} />}>
                <div className="mb-10">{renderStep()}</div>
              </Suspense>
            </BlurFade>

            {/* Navigation buttons */}
            <BlurFade delay={0.3}>
              <div className="flex items-center justify-between gap-4 pt-10 border-t border-border/50">
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
                    onClick={saveNow}
                    disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>

                  {isLastStep ? (
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
                      Next
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
