'use client';

/**
 * SALN Edit Detail Page
 * CSC Form SALN 2019 Revised - Edit Mode with Admin Approval Requirement
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
import { useSALNSubmission, useUpdateSALN, useSubmitSALN } from '../../../../../hooks/useSaln';
import { toast } from 'sonner';
import { EmployeeOnlyGuard } from '../../../../../components/guards/EmployeeOnlyGuard';
import {
  AlertCircle,
  Save,
  Send,
  ChevronRight,
  User,
  DollarSign,
  Home,
  Package,
  CreditCard,
  Briefcase,
  Users,
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
import { Separator } from '../../../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { cn } from '../../../../../lib/utils';
import { formatCurrency } from '../../../../../lib/utils/currency';
import type { CompleteSalnData } from '../../../../../lib/validations/saln-schema';

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
      Loading SALN for editing...
    </p>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SALNEditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: salnId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // Use new React Query hooks
  const { data: salnData, isLoading } = useSALNSubmission(salnId);
  const updateMutation = useUpdateSALN(salnId);
  const submitMutation = useSubmitSALN(salnId);
  const loading = isLoading;

  // Extract submission data from salnData
  const submission = salnData;
  const initialData = salnData as CompleteSalnData | null;

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Form state - simplified for demonstration
  // In production, use React Hook Form with proper validation
  const [formData, setFormData] = useState<CompleteSalnData | null>(
    initialData
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Calculate initial completion
      setCompletionPercentage(75); // Mock calculation
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
      // Calculate financial totals
      const totalRealProperty =
        formData.realProperties?.reduce(
          (sum, prop) => sum + (Number(prop.currentFairMarketValue) || 0),
          0
        ) || 0;
      const totalPersonalProperty =
        formData.personalProperties?.reduce(
          (sum, prop) => sum + (Number(prop.acquisitionCost) || 0),
          0
        ) || 0;
      const totalAssets = totalRealProperty + totalPersonalProperty;
      const totalLiabilities =
        formData.liabilities?.reduce(
          (sum, liability) => sum + (Number(liability.outstandingBalance) || 0),
          0
        ) || 0;
      const netWorth = totalAssets - totalLiabilities;

      // Include calculated values in submission
      const dataToSave = {
        ...formData,
        submission: {
          ...formData.submission,
          totalAssets,
          totalLiabilities,
          netWorth,
        },
      };

      // Use mutation to update
      await updateMutation.mutateAsync(dataToSave as any);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsSaving(false);
    }
  }, [salnId, formData, updateMutation]);

  const handleSubmit = useCallback(async () => {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      // Calculate financial totals
      const totalRealProperty =
        formData.realProperties?.reduce(
          (sum, prop) => sum + (Number(prop.currentFairMarketValue) || 0),
          0
        ) || 0;
      const totalPersonalProperty =
        formData.personalProperties?.reduce(
          (sum, prop) => sum + (Number(prop.acquisitionCost) || 0),
          0
        ) || 0;
      const totalAssets = totalRealProperty + totalPersonalProperty;
      const totalLiabilities =
        formData.liabilities?.reduce(
          (sum, liability) => sum + (Number(liability.outstandingBalance) || 0),
          0
        ) || 0;
      const netWorth = totalAssets - totalLiabilities;

      // Include calculated values in submission
      const dataToSave = {
        ...formData,
        submission: {
          ...formData.submission,
          totalAssets,
          totalLiabilities,
          netWorth,
        },
      };

      // Save first using mutation
      await updateMutation.mutateAsync(dataToSave as any);
      // Then submit for review
      await submitMutation.mutateAsync();
      router.push('/dashboard/saln/view');
    } catch (error) {
      // Error handling is done in the mutations
    } finally {
      setIsSubmitting(false);
    }
  }, [salnId, formData, updateMutation, submitMutation, router]);

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

  // Calculate totals for display
  const totalRealProperty =
    formData?.realProperties?.reduce(
      (sum, prop) => sum + (Number(prop.currentFairMarketValue) || 0),
      0
    ) || 0;
  const totalPersonalProperty =
    formData?.personalProperties?.reduce(
      (sum, prop) => sum + (Number(prop.acquisitionCost) || 0),
      0
    ) || 0;
  const totalAssets = totalRealProperty + totalPersonalProperty;
  const totalLiabilities =
    formData?.liabilities?.reduce(
      (sum, liability) => sum + (Number(liability.outstandingBalance) || 0),
      0
    ) || 0;
  const netWorth = totalAssets - totalLiabilities;

  if (loading || !submission || !formData) {
    return <LoadingState />;
  }

  return (
    <EmployeeOnlyGuard>
    <div className="space-y-6 pb-8">
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
            href="/dashboard/saln/view"
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            SALN
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
            Changes to your SALN require administrator approval before taking
            effect. Your current data remains active until changes are approved.
          </AlertDescription>
        </Alert>
      </BlurFade>

      {/* Header */}
      <BlurFade delay={0.15}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Edit Statement of Assets, Liabilities, and Net Worth
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              As of December 31, {submission.year} • Editing mode
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

      {/* I. DECLARANT INFORMATION */}
      <EditableSection
        title="I. Declarant & Spouse Information"
        icon={User}
        delay={0.25}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Filing Type <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.submission?.filingType || 'separate'}
                onValueChange={(val) =>
                  handleFieldChange('submission', {
                    ...formData.submission,
                    filingType: val,
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select filing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joint">Joint Filing</SelectItem>
                  <SelectItem value="separate">Separate Filing</SelectItem>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField
              label="Year"
              name="year"
              value={submission.year}
              onChange={() => {}}
              required
            />
            {formData.submission?.filingType === 'joint' && (
              <FormField
                label="Spouse Name"
                name="spouseName"
                value={formData.submission?.spouseName}
                onChange={(val) =>
                  handleFieldChange('submission', {
                    ...formData.submission,
                    spouseName: val,
                  })
                }
                fullWidth
                required
              />
            )}
            <FormField
              label="Position"
              name="position"
              value={formData.submission?.position}
              onChange={(val) =>
                handleFieldChange('submission', {
                  ...formData.submission,
                  position: val,
                })
              }
            />
            <FormField
              label="Agency/Office"
              name="agency"
              value={formData.submission?.agency}
              onChange={(val) =>
                handleFieldChange('submission', {
                  ...formData.submission,
                  agency: val,
                })
              }
            />
            <FormField
              label="Office Address"
              name="officeAddress"
              value={formData.submission?.officeAddress}
              onChange={(val) =>
                handleFieldChange('submission', {
                  ...formData.submission,
                  officeAddress: val,
                })
              }
              fullWidth
            />
          </div>
        </div>
      </EditableSection>

      {/* II. FINANCIAL SUMMARY (READ-ONLY) */}
      <EditableSection
        title="II. Financial Summary (Auto-Calculated)"
        icon={DollarSign}
        delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
              Total Assets
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAssets)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real: {formatCurrency(totalRealProperty)} • Personal:{' '}
              {formatCurrency(totalPersonalProperty)}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
              Total Liabilities
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-[oklch(0.55_0.22_15)] to-[oklch(0.45_0.22_15)] text-white rounded-lg">
            <p className="text-xs opacity-90 font-medium mb-1">Net Worth</p>
            <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
            <p className="text-xs opacity-75 mt-1">Assets minus Liabilities</p>
          </div>
        </div>
      </EditableSection>

      {/* III. REAL PROPERTIES */}
      <EditableSection title="III. Real Properties" icon={Home} delay={0.35}>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium mb-2">
            Note: This is a simplified edit form for demonstration purposes.
          </p>
          <p>In production, this section would include:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
            <li>
              Dynamic array of real property entries with add/remove
              functionality
            </li>
            <li>
              Fields: Description, Kind (dropdown), Exact Location, Assessed
              Value, Fair Market Value
            </li>
            <li>Acquisition details: Year, Mode (dropdown), Cost</li>
            <li>Currency input fields with proper formatting</li>
            <li>Real-time validation feedback</li>
            <li>Auto-calculation of totals</li>
          </ul>
        </div>
      </EditableSection>

      {/* IV. PERSONAL PROPERTIES */}
      <EditableSection
        title="IV. Personal Properties"
        icon={Package}
        delay={0.4}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic personal property entries (vehicles, jewelry, cash,
          investments, etc.) with add/remove functionality would be implemented
          here. Each entry would have: Description, Year Acquired, and
          Acquisition Cost fields.
        </p>
      </EditableSection>

      {/* V. LIABILITIES */}
      <EditableSection title="V. Liabilities" icon={CreditCard} delay={0.45}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic liability entries with add/remove functionality would be
          implemented here. Each entry would have: Nature, Creditor Name, and
          Outstanding Balance fields.
        </p>
      </EditableSection>

      {/* VI. BUSINESS INTERESTS */}
      <EditableSection
        title="VI. Business Interests"
        icon={Briefcase}
        delay={0.5}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic business interest entries with add/remove functionality would
          be implemented here. Each entry would have: Entity Name, Business
          Address, Nature of Business, and Date of Acquisition fields.
        </p>
      </EditableSection>

      {/* VII. RELATIVES IN GOVERNMENT */}
      <EditableSection
        title="VII. Relatives in Government"
        icon={Users}
        delay={0.55}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Dynamic relative entries (within 4th civil degree) with add/remove
          functionality would be implemented here. Each entry would have: Name,
          Relationship (dropdown), Position, and Agency/Office Address fields.
        </p>
      </EditableSection>

      {/* Bottom Actions */}
      <BlurFade delay={0.6}>
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
    </EmployeeOnlyGuard>
  );
}
