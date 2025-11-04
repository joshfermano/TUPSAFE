'use client';

/**
 * PDS (Personal Data Sheet) Edit Page
 * CS Form No. 212 Revised 2025
 *
 * Allows editing of existing PDS submissions with the following features:
 * - Reuses multi-step form from Create page
 * - Pre-fills form data from existing submission
 * - Edit authorization logic (editable: draft/rejected; read-only: submitted/reviewing/approved)
 * - Auto-save functionality with edit-specific localStorage key
 * - Smart step navigation (starts at first incomplete step)
 * - Error handling (not found, unauthorized, network errors)
 * - Status indicators and edit badges
 * - TUP Manila crimson theme with Magic UI components
 * - Full accessibility (WCAG 2.1 AA)
 * - Mobile-responsive design
 */

import { use, useState, useEffect, useCallback, useMemo } from 'react';
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
  ShieldAlert,
  FileQuestion,
  Pencil,
  AlertTriangle,
} from 'lucide-react';

// Validation schemas
import {
  completePdsSchema,
  getPdsSectionProgress,
  type CompletePdsData as FormPdsData,
} from '@/lib/validations/pds-schema';
import type { CompletePdsData as ApiPdsData } from '@tupsafe/database';

// Form components
import { FormStepIndicator, type FormStep } from '@/components/forms/shared/FormStepIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Particles } from '@/components/ui/particles';
import { BlurFade } from '@/components/ui/blur-fade';

// Hooks
import { useAutoSave, clearDraft } from '@/hooks/useAutoSave';
import { useAuth, usePds } from '@tupsafe/mock-data/api';

// Step components (reused from create page)
import {
  PersonalBasic,
  Addresses,
  Contact,
  Family,
  Education,
  EligibilityWork,
  VoluntaryTraining,
  OtherReview,
} from '../../create/steps';

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

// Map of section IDs to step indices
const STEP_MAP: Record<string, number> = {
  'personal-basic': 0,
  'addresses': 1,
  'contact': 2,
  'family': 3,
  'education': 4,
  'eligibility-work': 5,
  'voluntary-training': 6,
  'other-review': 7,
};

// Note: Using complete schema for validation instead of per-step schemas
// This ensures compatibility with Zod v4 and @hookform/resolvers/zod
// Per-step validation can be handled manually in the step navigation logic

// Status badge component
interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    submitted: { label: 'Submitted', variant: 'default' },
    reviewing: { label: 'Under Review', variant: 'outline' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  };

  const config = variants[status] || variants.draft;

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

// ============================================================================
// PAGE PROPS
// ============================================================================

interface PDSEditPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PDSEditPage({ params }: PDSEditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const { getCompleteSubmission, updateSubmission, submissions } = usePds(userId);

  // ============================================================================
  // State Management
  // ============================================================================

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingData, setExistingData] = useState<ApiPdsData | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // ============================================================================
  // Load Existing PDS Data
  // ============================================================================

  useEffect(() => {
    const loadPdsData = async () => {
      setIsLoading(true);

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const data = getCompleteSubmission(id);

        if (!data) {
          setIsLoading(false);
          return;
        }

        setExistingData(data);

        // Convert to form format for progress calculation
        const formData = {
          personalInfo: data.personalInfo,
          family: data.familyBackground,
          education: data.education,
          eligibility: data.civilService,
          workExperience: data.workExperience,
          voluntaryWork: data.voluntaryWork,
          learningDevelopment: data.training,
          otherInfo: data.otherInfo,
        };

        // Calculate which steps are completed
        // Note: Type assertion needed because database returns Date fields as strings
        const progress = getPdsSectionProgress(formData as unknown as Partial<FormPdsData>);
        const completed: number[] = [];
        Object.entries(progress).forEach(([key, value]) => {
          const stepIndex = STEP_MAP[key];
          if (stepIndex !== undefined && value >= 100) {
            completed.push(stepIndex);
          }
        });
        setCompletedSteps(completed);

        // Start at first incomplete step or last step if all complete
        const firstIncomplete = Object.entries(progress)
          .find(([, value]) => value < 100);

        if (firstIncomplete) {
          const [sectionId] = firstIncomplete;
          setCurrentStep(STEP_MAP[sectionId] || 0);
        } else if (completed.length > 0) {
          setCurrentStep(Math.max(...completed));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load PDS:', error);
        toast.error('Failed to Load PDS', {
          description: 'Unable to load PDS data. Please try again.',
        });
        setIsLoading(false);
      }
    };

    loadPdsData();
  }, [id, getCompleteSubmission]);

  // ============================================================================
  // Check Edit Authorization
  // ============================================================================

  // Get current submission metadata
  const submissionMetadata = useMemo(() => {
    return submissions.find((s) => s.id === id);
  }, [submissions, id]);

  const isReadOnly = useMemo(() => {
    if (!submissionMetadata) return false;
    return ['submitted', 'reviewing', 'approved'].includes(submissionMetadata.status);
  }, [submissionMetadata]);

  const isUnauthorized = useMemo(() => {
    if (!existingData || !user) return false;
    // Check if user owns this PDS
    return submissionMetadata?.userId !== user.id;
  }, [existingData, user, submissionMetadata]);

  // ============================================================================
  // Form Setup
  // ============================================================================

  // Convert API data to form data format
  const convertApiToFormData = useCallback((apiData: ApiPdsData): Partial<FormPdsData> => {
    // The API returns CompletePdsData with database-specific fields (id, pdsSubmissionId, etc.)
    // and dates as strings. We need to transform it to match the form schema format.

    // Helper to strip database fields and convert dates
    const stripDbFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
      const { id, pdsSubmissionId, salnSubmissionId, createdAt, updatedAt, ...rest } = obj as T & {
        id?: string;
        pdsSubmissionId?: string;
        salnSubmissionId?: string;
        createdAt?: string;
        updatedAt?: string;
      };

      // Convert date strings to Date objects
      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value === 'string' && key.toLowerCase().includes('date')) {
          converted[key] = new Date(value);
        } else {
          converted[key] = value;
        }
      }

      return converted as Partial<T>;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Type assertion needed: Database types include DB-specific fields that form doesn't need
    return {
      personalInfo: stripDbFields(apiData.personalInfo) as any,
      family: stripDbFields(apiData.familyBackground) as any,
      education: apiData.education?.map(stripDbFields) as any,
      eligibility: apiData.civilService?.map(stripDbFields) as any,
      workExperience: apiData.workExperience?.map(stripDbFields) as any,
      voluntaryWork: apiData.voluntaryWork?.map(stripDbFields) as any,
      learningDevelopment: apiData.training?.map(stripDbFields) as any,
      otherInfo: stripDbFields(apiData.otherInfo) as any,
    };
  }, []);

  // Form setup - no resolver during multi-step flow to allow incomplete data
  // Final validation happens on submission
  const form = useForm<Partial<FormPdsData>>({
    defaultValues: {},
    mode: 'onChange',
  });

  const formData = form.watch();

  // Pre-fill form when data loads
  useEffect(() => {
    if (existingData && !isLoading) {
      const formattedData = convertApiToFormData(existingData);
      form.reset(formattedData);
    }
  }, [existingData, isLoading, form, convertApiToFormData]);

  // ============================================================================
  // Auto-save Setup (with edit-specific key)
  // ============================================================================

  const { saveStatus, lastSaved, saveNow, clearSaved } = useAutoSave({
    key: `pds-edit-${id}`,
    data: formData,
    debounceMs: 2000,
    autoSaveIntervalMs: 30000,
    enabled: !isSubmitting && !isReadOnly && !isLoading,
    showToast: false, // Custom toast
  });

  // ============================================================================
  // Validation and Navigation
  // ============================================================================

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const isValid = await form.trigger();
    return isValid;
  }, [form]);

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

  // ============================================================================
  // Form Submission (Update)
  // ============================================================================

  const handleSubmit = useCallback(
    async (data: Partial<FormPdsData>) => {
      setIsSubmitting(true);

      try {
        // Validate complete form
        completePdsSchema.parse(data);

        // Convert form data back to database format
        // The updateSubmission API expects database types (with id fields, string dates)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiData: Partial<ApiPdsData> = {
          personalInfo: data.personalInfo as any,
          familyBackground: data.family as any,
          education: data.education as any,
          civilService: data.eligibility as any,
          workExperience: data.workExperience as any,
          voluntaryWork: data.voluntaryWork as any,
          training: data.learningDevelopment as any,
          otherInfo: data.otherInfo as any,
        };

        // Update submission via API (the mock API accepts Partial<CompletePdsData>)
        const success = await updateSubmission(id, apiData);

        if (!success) {
          throw new Error('Update failed');
        }

        // Show success
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success('PDS Updated Successfully!', {
          description: 'Your changes have been saved and submitted for review.',
        });

        // Clear edit draft
        clearDraft(`pds-edit-${id}`);
        clearSaved();

        // Redirect
        setTimeout(() => {
          router.push('/dashboard/pds');
        }, 2000);
      } catch (error) {
        console.error('Update error:', error);
        toast.error('Update Failed', {
          description: 'Please review your form and try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, updateSubmission, clearSaved, router]
  );

  // ============================================================================
  // UI Helpers
  // ============================================================================

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
            <span>Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}</span>
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

  // ============================================================================
  // Error States
  // ============================================================================

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading PDS data...</p>
        </div>
      </div>
    );
  }

  // PDS not found
  if (!existingData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <FileQuestion className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">PDS Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The PDS you&apos;re trying to edit doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => router.push('/dashboard/pds')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PDS Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Unauthorized access
  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Unauthorized Access</h3>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to edit this PDS. Only the owner can edit their PDS.
          </p>
          <Button onClick={() => router.push('/dashboard/pds')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PDS Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Read-only mode (submitted/reviewing/approved)
  if (isReadOnly) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Cannot Edit Submitted PDS</h3>
          <p className="text-muted-foreground mb-4">
            This PDS has been submitted and is currently under review. Editing is not allowed at this stage.
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <StatusBadge status={submissionMetadata?.status || 'submitted'} />
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard/pds')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push(`/dashboard/pds/view?id=${id}`)}>
              View PDS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render (Edit Mode)
  // ============================================================================

  return (
    <div className="min-h-screen relative bg-background">
      {/* Background particles */}
      <Particles
        className="absolute inset-0 pointer-events-none"
        quantity={25}
        staticity={50}
        ease={50}
      />

      {/* Main content */}
      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-6 mb-8 border-b border-border">
          <BlurFade delay={0.1}>
            {/* Status Alert for Rejected */}
            {submissionMetadata?.status === 'rejected' && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>PDS Rejected</AlertTitle>
                <AlertDescription>
                  This PDS was rejected. Please review the feedback, make necessary corrections, and resubmit.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <AnimatedGradientText className="text-3xl font-bold">
                  Edit Personal Data Sheet
                </AnimatedGradientText>
                <Badge variant="outline" className="text-xs">
                  CS Form No. 212 Revised 2025
                </Badge>
              </div>

              {/* Save status */}
              <div className="flex items-center gap-4">
                {saveStatusDisplay}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveNow}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Now
                </Button>
              </div>
            </div>

            {/* Edit indicators */}
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="border-blue-500 text-blue-700">
                <Pencil className="h-3 w-3 mr-1" />
                Editing
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Current Status:</span>
                <StatusBadge status={submissionMetadata?.status || 'draft'} />
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
              <div className="mb-8">{renderStep()}</div>
            </BlurFade>

            {/* Navigation buttons */}
            <BlurFade delay={0.3}>
              <div className="flex items-center justify-between gap-4 pt-8 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={saveNow}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>

                  {isLastStep ? (
                    <ShimmerButton
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[160px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          Update PDS
                        </>
                      )}
                    </ShimmerButton>
                  ) : (
                    <ShimmerButton type="button" onClick={handleNext} disabled={isSubmitting}>
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

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/dashboard/pds')}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
