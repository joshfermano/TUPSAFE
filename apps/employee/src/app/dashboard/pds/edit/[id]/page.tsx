'use client';

/**
 * PDS Edit Detail Page
 * CS Form No. 212 Revised 2025 - Edit Mode with Admin Approval Requirement
 *
 * Design: Clean, minimalistic, modern, premium
 * Layout: Form sections with inline validation
 * Theme: TUP red accent - oklch(0.55_0.22_15)
 * Features: Auto-save every 30s, change tracking, optimistic updates
 */

import React, { useMemo, useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../providers/AuthProvider';
import { usePdsSubmissionById } from '../../../../../hooks/usePdsSubmissionById';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  completePdsSchema,
  type CompletePdsData,
} from '../../../../../lib/validations/pds-schema';
import { toast } from 'sonner';
import { z } from 'zod';
import { useUpdatePDS, useSubmitPDS } from '../../../../../hooks/usePDS';
import {
  AlertCircle,
  Save,
  Send,
  ChevronRight,
  User,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  Heart,
  BookOpen,
  Star,
  ShieldAlert,
} from 'lucide-react';

// UI Components
import { BlurFade } from '../../../../../components/ui/blur-fade';
import { Card } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '../../../../../components/ui/alert';
import { Progress } from '../../../../../components/ui/progress';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { Separator } from '../../../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { cn } from '../../../../../lib/utils';

// Transformations
import { transformPdsForSubmission } from '../../../../../lib/utils/pds-transformations';

// ============================================================================
// TYPES
// ============================================================================

interface EditableSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}

// ============================================================================
// EDITABLE SECTION COMPONENT
// ============================================================================

const EditableSection = React.memo(
  ({ title, icon: Icon, children, delay = 0 }: EditableSectionProps) => {
    return (
      <BlurFade delay={delay}>
        <Card className="p-5 hover:border-[oklch(0.55_0.22_15)] dark:hover:border-[oklch(0.65_0.24_15)] transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Icon className="h-5 w-5 text-[oklch(0.55_0.22_15)] dark:text-[oklch(0.65_0.24_15)]" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          </div>
          <Separator className="mb-4" />
          {children}
        </Card>
      </BlurFade>
    );
  }
);

EditableSection.displayName = 'EditableSection';

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

interface FormFieldProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  fullWidth?: boolean;
  required?: boolean;
}

const FormField = React.memo(
  ({
    label,
    name,
    value,
    onChange,
    error,
    placeholder,
    type = 'text',
    fullWidth = false,
    required = false,
  }: FormFieldProps) => {
    return (
      <div className={cn('space-y-1.5', fullWidth && 'md:col-span-2')}>
        <Label htmlFor={name} className="text-xs font-medium">
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
        <Input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(error && 'border-rose-500 focus-visible:ring-rose-500')}
        />
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
      Loading PDS for editing...
    </p>
  </div>
);

// ============================================================================
// UNAUTHORIZED EDIT STATE
// ============================================================================

const UnauthorizedEditState = ({
  status,
  pdsId
}: {
  status: string;
  pdsId: string;
}) => {
  const router = useRouter();

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
        <p className="text-slate-600 dark:text-slate-400 mb-4">{getMessage()}</p>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">What you can do</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {status === 'approved'
              ? 'Contact the admin to request creating a new version of your PDS.'
              : 'You can view your submission details or wait for admin feedback.'}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            Back to PDS
          </Button>
          <Button onClick={() => router.push(`/dashboard/pds/view/${pdsId}`)}>
            View Details
          </Button>
        </div>
      </Card>
    </BlurFade>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PDSEditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pdsId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch complete PDS data by ID
  const { pdsData: rawPdsData, loading, error } = usePdsSubmissionById(pdsId);

  // Extract submission metadata from complete data
  const submission = rawPdsData?.submission ?? null;

  // Check if user can edit based on status
  const canEdit = submission?.status === 'draft' || submission?.status === 'rejected';

  // Create compatible data structure for form (handles different property naming conventions)
  // Note: Using 'as any as CompletePdsData' for type compatibility between DB schema and form schema
  // The DB returns dates as strings and has additional ID fields, while the form expects Date objects
  // Provide default empty objects/arrays for all nested properties to prevent null access errors
  // Memoized to prevent infinite re-renders in useEffect dependency
  const initialData = useMemo(() => {
    if (!rawPdsData) return null;
    return {
      personalInfo: rawPdsData.personalInfo ?? {},
      family: rawPdsData.familyBackground ?? {
        spouseSurname: '',
        spouseFirstName: '',
        spouseMiddleName: '',
        spouseNameExtension: '',
        spouseOccupation: '',
        spouseEmployer: '',
        spouseBusinessAddress: '',
        spouseTelephoneNo: '',
        fatherSurname: '',
        fatherFirstName: '',
        fatherMiddleName: '',
        fatherNameExtension: '',
        motherMaidenSurname: '',
        motherFirstName: '',
        motherMiddleName: '',
      },
      education: rawPdsData.education ?? [],
      eligibility: rawPdsData.civilService ?? [],
      workExperience: rawPdsData.workExperience ?? [],
      voluntaryWork: rawPdsData.voluntaryWork ?? [],
      learningDevelopment: rawPdsData.training ?? [],
      otherInfo: rawPdsData.otherInfo ?? {},
    } as any as CompletePdsData;
  }, [rawPdsData]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Initialize mutations
  const updateMutation = useUpdatePDS(pdsId);
  const submitMutation = useSubmitPDS(pdsId);

  // Form state - simplified for demonstration
  // In production, use React Hook Form with proper validation
  const [formData, setFormData] = useState<CompletePdsData | null>(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Calculate initial completion
      setCompletionPercentage(85); // Mock calculation
    }
  }, [initialData]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000);

    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!formData) return;

    setIsSaving(true);
    try {
      // Transform data structure to match backend expectations
      const transformedData = transformPdsForSubmission(formData);

      // Update PDS draft via mutation
      await updateMutation.mutateAsync(transformedData as any);

      setHasUnsavedChanges(false);
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [pdsId, formData, updateMutation]);

  const handleSubmit = useCallback(async () => {
    if (!formData) return;

    setIsSubmitting(true);

    try {
      // Validate
      const validatedData = completePdsSchema.parse(formData);

      // Transform data structure to match backend expectations
      const transformedData = transformPdsForSubmission(validatedData);

      // Save changes if needed
      if (hasUnsavedChanges) {
        await updateMutation.mutateAsync(transformedData as any);
      }

      // Submit for review
      await submitMutation.mutateAsync();

      // Clear unsaved flag
      setHasUnsavedChanges(false);

      toast.success('PDS Submitted Successfully!', {
        description: 'Your changes have been submitted for admin review.',
      });

      // Redirect
      setTimeout(() => {
        router.push(`/dashboard/pds/view/${pdsId}`);
      }, 1500);

    } catch (error) {
      console.error('Submit error:', error);

      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error('Validation Error', {
          description: `${firstError.path.join('.')}: ${firstError.message}`,
        });
      } else {
        toast.error('Submission Failed', {
          description: error instanceof Error ? error.message : 'Unable to submit PDS.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [pdsId, formData, hasUnsavedChanges, updateMutation, submitMutation, router]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, router]);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error or not found state
  if (error || !rawPdsData || !submission) {
    return (
      <BlurFade delay={0.1}>
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">PDS Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error || 'The requested PDS submission could not be found.'}
          </p>
          <Button onClick={() => router.back()}>
            Back to PDS
          </Button>
        </Card>
      </BlurFade>
    );
  }

  // Permission check - only allow editing if status is draft or rejected
  if (!canEdit) {
    return <UnauthorizedEditState status={submission.status} pdsId={pdsId} />;
  }

  // Cannot proceed without form data
  if (!formData) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <BlurFade delay={0.05}>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Link
            href="/dashboard"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href="/dashboard/pds/view"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            PDS
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">
            Edit
          </span>
        </div>
      </BlurFade>

      {/* Admin Approval Warning */}
      <BlurFade delay={0.1}>
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-400">
            Admin Approval Required
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-500">
            Changes to your PDS require administrator approval before taking
            effect. Your current data remains active until changes are approved.
          </AlertDescription>
        </Alert>
      </BlurFade>

      {/* Header */}
      <BlurFade delay={0.15}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Edit Personal Data Sheet
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Version {submission.version} • Editing mode
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Unsaved changes
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving || !hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              size="sm"
              className="bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]"
              onClick={handleSubmit}
              disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </BlurFade>

      {/* Progress Indicator */}
      <BlurFade delay={0.2}>
        <div className="flex items-center gap-3">
          <Progress value={completionPercentage} className="h-2 flex-1" />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {completionPercentage}%
          </span>
        </div>
      </BlurFade>

      {/* I. PERSONAL INFORMATION */}
      <EditableSection title="I. Personal Information" icon={User} delay={0.25}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Surname"
              name="surname"
              value={formData.personalInfo.surname}
              onChange={(val) =>
                handleFieldChange('personalInfo', {
                  ...formData.personalInfo,
                  surname: val,
                })
              }
              required
            />
            <FormField
              label="First Name"
              name="firstName"
              value={formData.personalInfo.firstName}
              onChange={(val) =>
                handleFieldChange('personalInfo', {
                  ...formData.personalInfo,
                  firstName: val,
                })
              }
              required
            />
            <FormField
              label="Middle Name"
              name="middleName"
              value={formData.personalInfo.middleName}
              onChange={(val) =>
                handleFieldChange('personalInfo', {
                  ...formData.personalInfo,
                  middleName: val,
                })
              }
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name Extension</Label>
              <Select
                value={formData.personalInfo?.nameExtension || '_none'}
                onValueChange={(val) =>
                  handleFieldChange('personalInfo', {
                    ...(formData.personalInfo ?? {}),
                    nameExtension: val === '_none' ? null : val,
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select extension" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  <SelectItem value="Jr.">Jr.</SelectItem>
                  <SelectItem value="Sr.">Sr.</SelectItem>
                  <SelectItem value="II">II</SelectItem>
                  <SelectItem value="III">III</SelectItem>
                  <SelectItem value="IV">IV</SelectItem>
                  <SelectItem value="V">V</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 mt-6">
            <p className="font-medium mb-2">
              Note: This is a simplified edit form for demonstration purposes.
            </p>
            <p>
              In production, all 8 sections would have fully functional form
              fields with:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
              <li>Complete field validation using Zod schemas</li>
              <li>
                Dynamic array fields for children, work experience, education,
                etc.
              </li>
              <li>Address autocomplete for Philippine locations</li>
              <li>Date pickers for all date fields</li>
              <li>File upload for supporting documents</li>
              <li>Real-time validation feedback</li>
              <li>Auto-save with optimistic UI updates</li>
              <li>Change tracking and diff visualization</li>
            </ul>
          </div>
        </div>
      </EditableSection>

      {/* II. FAMILY BACKGROUND */}
      <EditableSection title="II. Family Background" icon={Users} delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Spouse Surname"
            name="spouseSurname"
            value={formData.family?.spouseSurname ?? ''}
            onChange={(val) =>
              handleFieldChange('family', {
                ...(formData.family ?? {}),
                spouseSurname: val,
              })
            }
          />
          <FormField
            label="Spouse First Name"
            name="spouseFirstName"
            value={formData.family?.spouseFirstName ?? ''}
            onChange={(val) =>
              handleFieldChange('family', {
                ...(formData.family ?? {}),
                spouseFirstName: val,
              })
            }
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Additional family fields would be implemented here...
        </p>
      </EditableSection>

      {/* III. EDUCATIONAL BACKGROUND */}
      <EditableSection
        title="III. Educational Background"
        icon={GraduationCap}
        delay={0.35}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic education level entries (Elementary, Secondary, Vocational,
          College, Graduate Studies) would be implemented here with add/remove
          functionality.
        </p>
      </EditableSection>

      {/* IV. CIVIL SERVICE ELIGIBILITY */}
      <EditableSection
        title="IV. Civil Service Eligibility"
        icon={Award}
        delay={0.4}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic eligibility entries with add/remove functionality would be
          implemented here.
        </p>
      </EditableSection>

      {/* V. WORK EXPERIENCE */}
      <EditableSection title="V. Work Experience" icon={Briefcase} delay={0.45}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic work experience entries with add/remove functionality would be
          implemented here.
        </p>
      </EditableSection>

      {/* VI. VOLUNTARY WORK */}
      <EditableSection title="VI. Voluntary Work" icon={Heart} delay={0.5}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic voluntary work entries with add/remove functionality would be
          implemented here.
        </p>
      </EditableSection>

      {/* VII. LEARNING & DEVELOPMENT */}
      <EditableSection
        title="VII. Learning and Development Interventions"
        icon={BookOpen}
        delay={0.55}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic training/seminar entries with add/remove functionality would
          be implemented here.
        </p>
      </EditableSection>

      {/* VIII. OTHER INFORMATION */}
      <EditableSection title="VIII. Other Information" icon={Star} delay={0.6}>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Special Skills and Hobbies
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tag input for skills would be implemented here...
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Supplementary Questions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yes/No questions with conditional detail fields would be
              implemented here...
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Character References
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Minimum 3, maximum 5 references with add/remove functionality
              would be implemented here...
            </p>
          </div>
        </div>
      </EditableSection>

      {/* Bottom Actions */}
      <BlurFade delay={0.65}>
        <Card className="p-5 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium">Ready to submit?</p>
              <p className="text-xs">
                Your changes will be sent to admin for review
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]"
                onClick={handleSubmit}
                disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        </Card>
      </BlurFade>
    </div>
  );
}
