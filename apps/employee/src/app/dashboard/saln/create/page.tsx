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

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';

// Validation schemas
import {
  completeSalnSchema,
  createEmptySaln,
  calculateSalnSummary,
  type CompleteSalnData,
} from '@/lib/validations/saln-schema';

// Form components
import {
  FormStepIndicator,
  FormStepSkeleton,
  type FormStep,
} from '@/components/forms/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Magic UI components
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { BlurFade } from '@/components/ui/blur-fade';
import { DotPattern } from '@/components/ui/dot-pattern';

// Hooks
import { useAutoSave, getSavedDraft } from '@/hooks/useAutoSave';
import { useAuth } from '@tupsafe/mock-data/api';

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

const FORM_STEPS: FormStep[] = [
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
// MAIN COMPONENT
// ============================================================================

export default function SALNCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const selectedYear = new Date().getFullYear();

  // Form setup
  const form = useForm<CompleteSalnData>({
    // @ts-expect-error - Complex nested schema type compatibility
    resolver: zodResolver(completeSalnSchema),
    defaultValues: createEmptySaln(selectedYear, userId),
    mode: 'onChange',
  });

  const formData = form.watch();

  // Auto-save setup
  const { saveStatus, lastSaved, saveNow, clearSaved } = useAutoSave({
    key: `saln-draft-${userId}-${selectedYear}`,
    data: formData,
    debounceMs: 2000,
    autoSaveIntervalMs: 30000,
    enabled: !isSubmitting,
    showToast: false,
  });

  // Real-time financial calculations
  const financialSummary = useMemo(() => {
    return calculateSalnSummary(formData);
  }, [formData]);

  // Update form calculations in real-time (with deep equality check to prevent infinite loops)
  useEffect(() => {
    const currentCalculations = form.getValues('calculations');
    // Only update if calculations have actually changed
    if (JSON.stringify(currentCalculations) !== JSON.stringify(financialSummary)) {
      form.setValue('calculations', financialSummary, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialSummary]);

  // Check for saved draft on mount
  useEffect(() => {
    const savedDraft = getSavedDraft<Partial<CompleteSalnData>>(
      `saln-draft-${userId}-${selectedYear}`
    );
    if (savedDraft && Object.keys(savedDraft).length > 0) {
      setShowDraftDialog(true);
    }
  }, [userId, selectedYear]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = getSavedDraft<Partial<CompleteSalnData>>(
      `saln-draft-${userId}-${selectedYear}`
    );
    if (savedDraft) {
      form.reset(savedDraft);
      toast.success('Draft Restored', {
        description: 'Your previous work has been loaded.',
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

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const isValid = await form.trigger();
    return isValid;
  }, [form]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error('Validation Error', {
        description: 'Please fix the errors before proceeding.',
      });
      return;
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
  }, [currentStep, completedSteps, validateCurrentStep]);

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

  // Form submission
  const handleSubmit = useCallback(
    async (data: CompleteSalnData) => {
      setIsSubmitting(true);

      try {
        // Validate complete form
        completeSalnSchema.parse(data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Show success
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('SALN Submitted Successfully!', {
          description:
            'Your Statement of Assets, Liabilities, and Net Worth has been submitted for review.',
        });

        // Clear draft
        clearSaved();

        // Redirect
        setTimeout(() => {
          router.push('/dashboard/saln');
        }, 2000);
      } catch (error) {
        console.error('Submission error:', error);
        toast.error('Submission Failed', {
          description: 'Please review your form and try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearSaved, router]
  );

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
        return <ReviewSubmit data={formData} summary={financialSummary} />;
      default:
        return null;
    }
  }, [currentStep, formData, financialSummary]);

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
                  Create SALN Statement
                </AnimatedGradientText>
                <Badge variant="outline" className="text-xs font-normal border-slate-300/50 dark:border-slate-700/50 w-fit">
                  CSC Form No. SALN 2019
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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {/* Type assertion needed: Complex nested form schema type inference */}
          <form onSubmit={form.handleSubmit(handleSubmit as any)}>
            <BlurFade delay={0.2} key={currentStep}>
              <Suspense fallback={<FormStepSkeleton fieldCount={7} />}>
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
                          Submit SALN
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
    </div>
  );
}
