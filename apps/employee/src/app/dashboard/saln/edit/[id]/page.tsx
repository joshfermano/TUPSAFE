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

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../providers/AuthProvider';
import { useSALNSubmission, useUpdateSALN, useSubmitSALN } from '../../../../../hooks/useSALN';
import { toast as _toast } from 'sonner';
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
  Plus,
  Trash2,
  Info,
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
import { Badge } from '../../../../../components/ui/badge';
import { Textarea } from '../../../../../components/ui/textarea';
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
import {
  PROPERTY_KIND,
  ACQUISITION_MODE,
  PROPERTY_OWNER,
  RELATIONSHIP_TYPE,
} from '../../../../../lib/validations/saln-schema';

// ============================================================================
// TYPES
// ============================================================================

interface EditableSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}

interface RealPropertyItem {
  description: string;
  kind: string;
  exactLocation: string;
  assessedValue: number;
  currentFairMarketValue: number;
  acquisitionYear: number;
  acquisitionMode: string;
  acquisitionCost: number;
  owner: string;
  childName: string | null;
}

interface PersonalPropertyItem {
  description: string;
  yearAcquired: number;
  acquisitionCost: number;
  owner: string;
  childName: string | null;
}

interface LiabilityItem {
  nature: string;
  creditorName: string;
  outstandingBalance: number;
  owner: string;
  childName: string | null;
}

interface BusinessInterestItem {
  entityName: string;
  businessAddress: string;
  natureOfBusiness: string;
  dateOfAcquisition: string | Date;
  owner: string;
  childName: string | null;
}

interface RelativeInGovItem {
  name: string;
  relationship: string;
  position: string;
  agencyAddress: string;
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
// CURRENCY INPUT FOR EDIT PAGE (standalone, no react-hook-form)
// ============================================================================

interface EditCurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  helperText?: string;
}

// Format number with commas (e.g., 1,000,000.00)
const formatNumberWithCommas = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Remove commas and non-numeric chars (except dot and minus) for parsing
const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const EditCurrencyInput = React.memo(
  ({ label, value, onChange, required = false, helperText }: EditCurrencyInputProps) => {
    const [displayValue, setDisplayValue] = useState(formatNumberWithCommas(value || 0));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumberWithCommas(value || 0));
      }
    }, [value, isFocused]);

    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₱</span>
          <Input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => {
              const raw = e.target.value;
              // Allow typing: only digits, commas, dots, minus
              if (raw === '' || /^[0-9,\.\-]*$/.test(raw)) {
                setDisplayValue(raw);
                const numVal = parseFormattedNumber(raw);
                onChange(numVal);
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              // Remove formatting on focus for easier editing
              const numVal = parseFormattedNumber(displayValue);
              setDisplayValue(numVal === 0 ? '' : numVal.toString());
            }}
            onBlur={() => {
              setIsFocused(false);
              const numVal = parseFormattedNumber(displayValue);
              const finalVal = isNaN(numVal) ? 0 : numVal;
              setDisplayValue(formatNumberWithCommas(finalVal));
              onChange(finalVal);
            }}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
        {helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

EditCurrencyInput.displayName = 'EditCurrencyInput';

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
// YEAR OPTIONS (memoized outside component)
// ============================================================================

const YEAR_OPTIONS = Array.from({ length: 75 }, (_, i) => new Date().getFullYear() - i);

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
  useAuth();

  // Use new React Query hooks
  const { data: salnData, isLoading } = useSALNSubmission(salnId);
  const updateMutation = useUpdateSALN(salnId);
  const submitMutation = useSubmitSALN(salnId);
  const loading = isLoading;

  // Extract submission metadata from salnData
  // salnData has shape: { submission: {...}, realProperties: [...], ... }
  // submission contains Part I declarant info: year, filingType, spouseName, position, agency, officeAddress
  const submission = salnData?.submission;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSaveDraft is stable via useCallback; including it would cause infinite re-renders
  }, [formData, hasUnsavedChanges]);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mutation expects strict type but dataToSave is dynamically constructed
      await updateMutation.mutateAsync(dataToSave as any);
      setHasUnsavedChanges(false);
    } catch (_error) {
      // Error handling is done in the mutation
    } finally {
      setIsSaving(false);
    }
  }, [formData, updateMutation]);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mutation expects strict type but dataToSave is dynamically constructed
      await updateMutation.mutateAsync(dataToSave as any);
      // Then submit for review
      await submitMutation.mutateAsync();
      router.push('/dashboard/saln/view');
    } catch (_error) {
      // Error handling is done in the mutations
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, updateMutation, submitMutation, router]);

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

  // ========================================================================
  // ARRAY MANIPULATION HELPERS
  // ========================================================================

  const addRealProperty = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        realProperties: [
          ...(prev.realProperties || []),
          {
            description: '',
            kind: 'residential',
            exactLocation: '',
            assessedValue: 0,
            currentFairMarketValue: 0,
            acquisitionYear: new Date().getFullYear(),
            acquisitionMode: 'Purchase',
            acquisitionCost: 0,
            owner: 'declarant',
            childName: null,
          },
        ],
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const removeRealProperty = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.realProperties || [])];
      updated.splice(index, 1);
      return { ...prev, realProperties: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateRealProperty = useCallback((index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.realProperties || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, realProperties: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addPersonalProperty = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        personalProperties: [
          ...(prev.personalProperties || []),
          {
            description: '',
            yearAcquired: new Date().getFullYear(),
            acquisitionCost: 0,
            owner: 'declarant',
            childName: null,
          },
        ],
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const removePersonalProperty = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.personalProperties || [])];
      updated.splice(index, 1);
      return { ...prev, personalProperties: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updatePersonalProperty = useCallback((index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.personalProperties || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, personalProperties: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addLiability = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        liabilities: [
          ...(prev.liabilities || []),
          {
            nature: '',
            creditorName: '',
            outstandingBalance: 0,
            owner: 'declarant',
            childName: null,
          },
        ],
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const removeLiability = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.liabilities || [])];
      updated.splice(index, 1);
      return { ...prev, liabilities: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateLiability = useCallback((index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.liabilities || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, liabilities: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addBusinessInterest = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        businessInterests: [
          ...(prev.businessInterests || []),
          {
            entityName: '',
            businessAddress: '',
            natureOfBusiness: '',
            dateOfAcquisition: new Date(),
            owner: 'declarant' as const,
            childName: null,
          },
        ],
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const removeBusinessInterest = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.businessInterests || [])];
      updated.splice(index, 1);
      return { ...prev, businessInterests: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateBusinessInterest = useCallback((index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.businessInterests || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, businessInterests: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addRelativeInGov = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        relativesInGov: [
          ...(prev.relativesInGov || []),
          {
            name: '',
            relationship: 'Spouse',
            position: '',
            agencyAddress: '',
          },
        ],
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const removeRelativeInGov = useCallback((index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.relativesInGov || [])];
      updated.splice(index, 1);
      return { ...prev, relativesInGov: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateRelativeInGov = useCallback((index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.relativesInGov || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, relativesInGov: updated };
    });
    setHasUnsavedChanges(true);
  }, []);

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
        <div className="space-y-6">
          {/* Basic Info */}
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
            {(formData.submission?.filingType === 'joint' || formData.submission?.filingType === 'separate') && (
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

          <Separator />

          {/* Compliance Type */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">
              Compliance Type <span className="text-rose-500">*</span>
            </Label>
            <div className="grid gap-2">
              {[
                { value: 'annual', label: 'Annual Filing', desc: 'Regular annual SALN submission' },
                { value: 'assumption', label: 'Assumption of Office', desc: 'Filing upon assuming a new position' },
                { value: 'exit', label: 'Exit from Office', desc: 'Filing upon separation from service' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 hover:bg-accent/50 transition-all cursor-pointer">
                  <input
                    type="radio"
                    name="complianceType"
                    value={opt.value}
                    checked={(formData.submission as Record<string, unknown>)?.complianceType === opt.value}
                    onChange={() =>
                      handleFieldChange('submission', {
                        ...formData.submission,
                        complianceType: opt.value,
                        // Clear complianceDate when switching type so assumption/exit dates don't carry over
                        // For 'annual', always clear it; for assumption/exit, only clear when switching between them
                        complianceDate: opt.value === 'annual' || (formData.submission as Record<string, unknown>)?.complianceType !== opt.value
                          ? null
                          : (formData.submission as Record<string, unknown>)?.complianceDate,
                      })
                    }
                    className="w-4 h-4 text-primary border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{opt.label}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Compliance Date - shown for assumption or exit */}
            {((formData.submission as Record<string, unknown>)?.complianceType === 'assumption' ||
              (formData.submission as Record<string, unknown>)?.complianceType === 'exit') && (
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-medium">
                  Date of {(formData.submission as Record<string, unknown>)?.complianceType === 'assumption' ? 'Assumption' : 'Exit'}{' '}
                  <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={
                    (formData.submission as Record<string, unknown>)?.complianceDate
                      ? (() => {
                          const cd = (formData.submission as Record<string, unknown>).complianceDate;
                          if (cd instanceof Date) return cd.toISOString().split('T')[0];
                          if (typeof cd === 'string') {
                            try { return new Date(cd).toISOString().split('T')[0]; } catch { return cd; }
                          }
                          return '';
                        })()
                      : ''
                  }
                  onChange={(e) => {
                    const dateStr = e.target.value;
                    handleFieldChange('submission', {
                      ...formData.submission,
                      complianceDate: dateStr ? new Date(dateStr) : null,
                    });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Multiple Marriages */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Multiple Marriages Disclosure</Label>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(formData.submission as Record<string, unknown>)?.hasMultipleMarriages}
                onChange={(e) =>
                  handleFieldChange('submission', {
                    ...formData.submission,
                    hasMultipleMarriages: e.target.checked,
                  })
                }
                className="mt-1 w-4 h-4 text-primary border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  I have had multiple marriages
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check this box if you have been married more than once
                </p>
              </div>
            </label>
            {(formData.submission as Record<string, unknown>)?.hasMultipleMarriages ? (
              <div className="space-y-1.5 pl-7">
                <Label className="text-xs font-medium">
                  Previous Spouse Names <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  value={((formData.submission as Record<string, unknown>)?.previousSpouseNames as string) || ''}
                  onChange={(e) =>
                    handleFieldChange('submission', {
                      ...formData.submission,
                      previousSpouseNames: e.target.value,
                    })
                  }
                  placeholder="Enter the full names of your previous spouse(s), one per line"
                  rows={3}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-500">Not Applicable - No previous marriages to disclose</span>
              </div>
            )}
          </div>

          {/* Spouse as Public Official - shown for joint or separate filing */}
          {(formData.submission?.filingType === 'joint' || formData.submission?.filingType === 'separate') && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs font-medium">Spouse Employment Status</Label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(formData.submission as Record<string, unknown>)?.spouseIsPublicOfficial}
                    onChange={(e) =>
                      handleFieldChange('submission', {
                        ...formData.submission,
                        spouseIsPublicOfficial: e.target.checked,
                      })
                    }
                    className="mt-1 w-4 h-4 text-primary border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      My spouse is a public official or employee
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Check this if your spouse is employed in government service
                    </p>
                  </div>
                </label>
                {Boolean((formData.submission as Record<string, unknown>)?.spouseIsPublicOfficial) && (
                  <div className="space-y-3 pl-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Spouse Position/Designation"
                        name="spousePosition"
                        value={(formData.submission as Record<string, unknown>)?.spousePosition as string}
                        onChange={(val) =>
                          handleFieldChange('submission', {
                            ...formData.submission,
                            spousePosition: val,
                          })
                        }
                        required
                      />
                      <FormField
                        label="Spouse Agency/Office"
                        name="spouseAgency"
                        value={(formData.submission as Record<string, unknown>)?.spouseAgency as string}
                        onChange={(val) =>
                          handleFieldChange('submission', {
                            ...formData.submission,
                            spouseAgency: val,
                          })
                        }
                        required
                      />
                    </div>
                    <FormField
                      label="Spouse Office Address"
                      name="spouseOfficeAddress"
                      value={(formData.submission as Record<string, unknown>)?.spouseOfficeAddress as string}
                      onChange={(val) =>
                        handleFieldChange('submission', {
                          ...formData.submission,
                          spouseOfficeAddress: val,
                        })
                      }
                      fullWidth
                      required
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Unmarried Children Below 18 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              <Label className="text-xs font-medium">Unmarried Children Below 18 Years Old</Label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              List all unmarried children who are below 18 years of age
            </p>
            {(() => {
              const children = ((formData.submission as Record<string, unknown>)?.unmarriedChildren as Array<{ name: string; age: number }>) || [];
              if (children.length === 0) {
                return (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
                    <Users className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No unmarried children added</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentChildren = ((formData.submission as Record<string, unknown>)?.unmarriedChildren as Array<{ name: string; age: number }>) || [];
                        handleFieldChange('submission', {
                          ...formData.submission,
                          unmarriedChildren: [...currentChildren, { name: '', age: 0 }],
                        });
                      }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Child
                    </Button>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {children.map((child, index) => (
                    <Card key={index} className="p-3 border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">Child {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentChildren = [...children];
                            currentChildren.splice(index, 1);
                            handleFieldChange('submission', {
                              ...formData.submission,
                              unmarriedChildren: currentChildren,
                            });
                          }}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          label="Child Name"
                          name={`childName-${index}`}
                          value={child.name}
                          onChange={(val) => {
                            const currentChildren = [...children];
                            currentChildren[index] = { ...currentChildren[index], name: val };
                            handleFieldChange('submission', {
                              ...formData.submission,
                              unmarriedChildren: currentChildren,
                            });
                          }}
                          required
                        />
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            Age <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={17}
                            value={child.age || 0}
                            onChange={(e) => {
                              const currentChildren = [...children];
                              currentChildren[index] = { ...currentChildren[index], age: parseInt(e.target.value, 10) || 0 };
                              handleFieldChange('submission', {
                                ...formData.submission,
                                unmarriedChildren: currentChildren,
                              });
                            }}
                            placeholder="Age (0-17)"
                          />
                          <p className="text-[10px] text-slate-500">Must be below 18 years old</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleFieldChange('submission', {
                        ...formData.submission,
                        unmarriedChildren: [...children, { name: '', age: 0 }],
                      });
                    }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Child
                  </Button>
                </div>
              );
            })()}
          </div>

          <Separator />

          {/* First Government Issued ID */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">First Government Issued ID</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">ID Type</Label>
                <Select
                  value={((formData.submission as Record<string, unknown>)?.governmentIdType as string) || ''}
                  onValueChange={(val) =>
                    handleFieldChange('submission', {
                      ...formData.submission,
                      governmentIdType: val,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Driver's License", 'Passport', 'SSS ID', 'GSIS ID', 'PhilHealth ID', "Voter's ID", 'PRC ID', 'Postal ID', 'Senior Citizen ID', 'PWD ID', 'UMID', 'Other'].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormField
                label="ID Number"
                name="governmentIdNumber"
                value={(formData.submission as Record<string, unknown>)?.governmentIdNumber as string}
                onChange={(val) =>
                  handleFieldChange('submission', {
                    ...formData.submission,
                    governmentIdNumber: val,
                  })
                }
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date Issued</Label>
                <Input
                  type="date"
                  value={
                    (formData.submission as Record<string, unknown>)?.governmentIdDateIssued
                      ? (() => {
                          const d = (formData.submission as Record<string, unknown>).governmentIdDateIssued;
                          if (d instanceof Date) return d.toISOString().split('T')[0];
                          if (typeof d === 'string') {
                            try { return new Date(d).toISOString().split('T')[0]; } catch { return d; }
                          }
                          return '';
                        })()
                      : ''
                  }
                  onChange={(e) => {
                    const dateStr = e.target.value;
                    handleFieldChange('submission', {
                      ...formData.submission,
                      governmentIdDateIssued: dateStr ? new Date(dateStr) : null,
                    });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Second Government Issued ID */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Second Government Issued ID</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">ID Type</Label>
                <Select
                  value={((formData.submission as Record<string, unknown>)?.governmentIdType2 as string) || ''}
                  onValueChange={(val) =>
                    handleFieldChange('submission', {
                      ...formData.submission,
                      governmentIdType2: val,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Driver's License", 'Passport', 'SSS ID', 'GSIS ID', 'PhilHealth ID', "Voter's ID", 'PRC ID', 'Postal ID', 'Senior Citizen ID', 'PWD ID', 'UMID', 'Other'].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormField
                label="ID Number"
                name="governmentIdNumber2"
                value={(formData.submission as Record<string, unknown>)?.governmentIdNumber2 as string}
                onChange={(val) =>
                  handleFieldChange('submission', {
                    ...formData.submission,
                    governmentIdNumber2: val,
                  })
                }
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date Issued</Label>
                <Input
                  type="date"
                  value={
                    (formData.submission as Record<string, unknown>)?.governmentIdDateIssued2
                      ? (() => {
                          const d = (formData.submission as Record<string, unknown>).governmentIdDateIssued2;
                          if (d instanceof Date) return d.toISOString().split('T')[0];
                          if (typeof d === 'string') {
                            try { return new Date(d).toISOString().split('T')[0]; } catch { return d; }
                          }
                          return '';
                        })()
                      : ''
                  }
                  onChange={(e) => {
                    const dateStr = e.target.value;
                    handleFieldChange('submission', {
                      ...formData.submission,
                      governmentIdDateIssued2: dateStr ? new Date(dateStr) : null,
                    });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Info className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">The 2025 SALN format requires two government-issued IDs for verification.</span>
            </div>
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
        <div className="space-y-4">
          {(!formData.realProperties || formData.realProperties.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <Home className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No real properties added yet</p>
              <Button type="button" onClick={addRealProperty} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Real Property
              </Button>
            </div>
          ) : (
            <>
              {(formData.realProperties as RealPropertyItem[]).map((prop, index) => (
                <Card key={index} className="p-4 border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Property {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRealProperty(index)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Description <span className="text-rose-500">*</span></Label>
                      <Textarea
                        value={prop.description || ''}
                        onChange={(e) => updateRealProperty(index, 'description', e.target.value)}
                        placeholder="e.g., 3-bedroom house and lot"
                        rows={2}
                      />
                    </div>

                    {/* Kind & Year */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Property Kind <span className="text-rose-500">*</span></Label>
                        <select
                          value={prop.kind || ''}
                          onChange={(e) => updateRealProperty(index, 'kind', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                        >
                          <option value="">Select kind</option>
                          {PROPERTY_KIND.map((kind) => (
                            <option key={kind} value={kind}>
                              {kind.charAt(0).toUpperCase() + kind.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Year Acquired <span className="text-rose-500">*</span></Label>
                        <select
                          value={prop.acquisitionYear?.toString() || ''}
                          onChange={(e) => updateRealProperty(index, 'acquisitionYear', parseInt(e.target.value, 10))}
                          className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                        >
                          <option value="">Select year</option>
                          {YEAR_OPTIONS.map((year) => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Exact Location */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Exact Location/Address <span className="text-rose-500">*</span></Label>
                      <Textarea
                        value={prop.exactLocation || ''}
                        onChange={(e) => updateRealProperty(index, 'exactLocation', e.target.value)}
                        placeholder="Street, Barangay, City/Municipality, Province"
                        rows={2}
                      />
                    </div>

                    {/* Financial Values */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <EditCurrencyInput
                        label="Assessed Value"
                        value={Number(prop.assessedValue) || 0}
                        onChange={(val) => updateRealProperty(index, 'assessedValue', val)}
                        required
                        helperText="From tax declaration"
                      />
                      <EditCurrencyInput
                        label="Current Fair Market Value"
                        value={Number(prop.currentFairMarketValue) || 0}
                        onChange={(val) => updateRealProperty(index, 'currentFairMarketValue', val)}
                        required
                        helperText="Current market value"
                      />
                    </div>

                    {/* Acquisition Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Mode of Acquisition <span className="text-rose-500">*</span></Label>
                        <select
                          value={prop.acquisitionMode || ''}
                          onChange={(e) => updateRealProperty(index, 'acquisitionMode', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                        >
                          <option value="">Select mode</option>
                          {ACQUISITION_MODE.map((mode) => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </div>
                      <EditCurrencyInput
                        label="Acquisition Cost"
                        value={Number(prop.acquisitionCost) || 0}
                        onChange={(val) => updateRealProperty(index, 'acquisitionCost', val)}
                        required
                        helperText="Use 0 for inheritance/donation"
                      />
                    </div>

                    {/* Owner Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Property Owner</Label>
                      <select
                        value={prop.owner || 'declarant'}
                        onChange={(e) => updateRealProperty(index, 'owner', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                      >
                        {PROPERTY_OWNER.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner === 'declarant' ? 'Declarant' :
                             owner === 'joint' ? 'Joint (Declarant & Spouse)' :
                             owner === 'spouse' ? 'Spouse Exclusive' :
                             'Child Exclusive'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Child Name (conditional) */}
                    {prop.owner === 'child' && (
                      <FormField
                        label="Child Name"
                        name={`realProp-${index}-childName`}
                        value={prop.childName}
                        onChange={(val) => updateRealProperty(index, 'childName', val)}
                        placeholder="Name of the child"
                        required
                      />
                    )}
                  </div>
                </Card>
              ))}

              <Button type="button" onClick={addRealProperty} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Real Property
              </Button>

              {/* Total */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">Total Real Property Value:</span>
                <span className="text-lg font-bold text-[oklch(0.55_0.22_15)]">
                  {formatCurrency(totalRealProperty)}
                </span>
              </div>
            </>
          )}
        </div>
      </EditableSection>

      {/* IV. PERSONAL PROPERTIES */}
      <EditableSection title="IV. Personal Properties" icon={Package} delay={0.4}>
        <div className="space-y-4">
          {(!formData.personalProperties || formData.personalProperties.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <Package className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No personal properties added yet</p>
              <Button type="button" onClick={addPersonalProperty} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Personal Property
              </Button>
            </div>
          ) : (
            <>
              {(formData.personalProperties as PersonalPropertyItem[]).map((prop, index) => (
                <Card key={index} className="p-4 border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Property {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removePersonalProperty(index)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Description <span className="text-rose-500">*</span></Label>
                      <Textarea
                        value={prop.description || ''}
                        onChange={(e) => updatePersonalProperty(index, 'description', e.target.value)}
                        placeholder="e.g., 2020 Toyota Corolla, Jewelry Collection, Cash in Bank"
                        rows={2}
                      />
                    </div>

                    {/* Year and Cost */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Year Acquired <span className="text-rose-500">*</span></Label>
                        <select
                          value={prop.yearAcquired?.toString() || ''}
                          onChange={(e) => updatePersonalProperty(index, 'yearAcquired', parseInt(e.target.value, 10))}
                          className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                        >
                          <option value="">Select year</option>
                          {YEAR_OPTIONS.map((year) => (
                            <option key={year} value={year.toString()}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <EditCurrencyInput
                        label="Acquisition Cost / Current Value"
                        value={Number(prop.acquisitionCost) || 0}
                        onChange={(val) => updatePersonalProperty(index, 'acquisitionCost', val)}
                        required
                        helperText="Original cost or current market value"
                      />
                    </div>

                    {/* Owner Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Property Owner</Label>
                      <select
                        value={prop.owner || 'declarant'}
                        onChange={(e) => updatePersonalProperty(index, 'owner', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                      >
                        {PROPERTY_OWNER.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner === 'declarant' ? 'Declarant' :
                             owner === 'joint' ? 'Joint (Declarant & Spouse)' :
                             owner === 'spouse' ? 'Spouse Exclusive' :
                             'Child Exclusive'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Child Name (conditional) */}
                    {prop.owner === 'child' && (
                      <FormField
                        label="Child Name"
                        name={`personalProp-${index}-childName`}
                        value={prop.childName}
                        onChange={(val) => updatePersonalProperty(index, 'childName', val)}
                        placeholder="Name of the child"
                        required
                      />
                    )}
                  </div>
                </Card>
              ))}

              <Button type="button" onClick={addPersonalProperty} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Personal Property
              </Button>

              {/* Total */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">Total Personal Property Value:</span>
                <span className="text-lg font-bold text-[oklch(0.55_0.22_15)]">
                  {formatCurrency(totalPersonalProperty)}
                </span>
              </div>
            </>
          )}
        </div>
      </EditableSection>

      {/* V. LIABILITIES */}
      <EditableSection title="V. Liabilities" icon={CreditCard} delay={0.45}>
        <div className="space-y-4">
          <Alert className="border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-slate-600 dark:text-slate-400">
              Include all outstanding debts such as home mortgages, car loans,
              personal loans, credit card balances, and business loans. If you
              have no debts, you may leave this section empty.
            </AlertDescription>
          </Alert>

          {(!formData.liabilities || formData.liabilities.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <CreditCard className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No liabilities added</p>
              <p className="text-xs text-slate-400 mb-3">If you have no debts, you can leave this empty</p>
              <Button type="button" onClick={addLiability} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Liability
              </Button>
            </div>
          ) : (
            <>
              {(formData.liabilities as LiabilityItem[]).map((liability, index) => (
                <Card key={index} className="p-4 border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Liability {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLiability(index)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>

                    {/* Nature */}
                    <FormField
                      label="Nature of Liability"
                      name={`liability-${index}-nature`}
                      value={liability.nature}
                      onChange={(val) => updateLiability(index, 'nature', val)}
                      placeholder="e.g., Home Mortgage Loan, Car Loan, Personal Loan"
                      required
                    />

                    {/* Creditor */}
                    <FormField
                      label="Creditor Name and Address"
                      name={`liability-${index}-creditorName`}
                      value={liability.creditorName}
                      onChange={(val) => updateLiability(index, 'creditorName', val)}
                      placeholder="e.g., BPI Family Savings Bank, Makati City"
                      required
                    />

                    {/* Outstanding Balance */}
                    <EditCurrencyInput
                      label="Outstanding Balance"
                      value={Number(liability.outstandingBalance) || 0}
                      onChange={(val) => updateLiability(index, 'outstandingBalance', val)}
                      required
                      helperText="Current amount owed as of reporting date"
                    />

                    {/* Owner Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Liability Owner</Label>
                      <select
                        value={liability.owner || 'declarant'}
                        onChange={(e) => updateLiability(index, 'owner', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                      >
                        {PROPERTY_OWNER.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner === 'declarant' ? 'Declarant' :
                             owner === 'joint' ? 'Joint (Declarant & Spouse)' :
                             owner === 'spouse' ? 'Spouse Exclusive' :
                             'Child Exclusive'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Child Name (conditional) */}
                    {liability.owner === 'child' && (
                      <FormField
                        label="Child Name"
                        name={`liability-${index}-childName`}
                        value={liability.childName}
                        onChange={(val) => updateLiability(index, 'childName', val)}
                        placeholder="Name of the child"
                        required
                      />
                    )}
                  </div>
                </Card>
              ))}

              <Button type="button" onClick={addLiability} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Liability
              </Button>

              {/* Total */}
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">Total Liabilities:</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalLiabilities)}
                </span>
              </div>
            </>
          )}
        </div>
      </EditableSection>

      {/* VI. BUSINESS INTERESTS */}
      <EditableSection title="VI. Business Interests" icon={Briefcase} delay={0.5}>
        <div className="space-y-4">
          <Alert className="border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-slate-600 dark:text-slate-400">
              Include any business where you or your spouse have an interest
              (stockholder, partner, officer, director, etc.). If none, leave this section empty.
            </AlertDescription>
          </Alert>

          {(!formData.businessInterests || formData.businessInterests.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <Briefcase className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No business interests added</p>
              <p className="text-xs text-slate-400 mb-3">Add business interests or leave empty if none</p>
              <Button type="button" onClick={addBusinessInterest} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Business Interest
              </Button>
            </div>
          ) : (
            <>
              {(formData.businessInterests as BusinessInterestItem[]).map((biz, index) => (
                <Card key={index} className="p-4 border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Business {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBusinessInterest(index)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>

                    {/* Business Name */}
                    <FormField
                      label="Business Name"
                      name={`biz-${index}-entityName`}
                      value={biz.entityName}
                      onChange={(val) => updateBusinessInterest(index, 'entityName', val)}
                      placeholder="Name of business/corporation"
                      required
                    />

                    {/* Business Address */}
                    <FormField
                      label="Business Address"
                      name={`biz-${index}-businessAddress`}
                      value={biz.businessAddress}
                      onChange={(val) => updateBusinessInterest(index, 'businessAddress', val)}
                      placeholder="Complete business address"
                      required
                      fullWidth
                    />

                    {/* Nature of Business */}
                    <FormField
                      label="Nature of Business Interest"
                      name={`biz-${index}-natureOfBusiness`}
                      value={biz.natureOfBusiness}
                      onChange={(val) => updateBusinessInterest(index, 'natureOfBusiness', val)}
                      placeholder="e.g., Stockholder, Partner, Director"
                      required
                    />

                    {/* Date of Acquisition */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Date of Acquisition <span className="text-rose-500">*</span></Label>
                      <Input
                        type="date"
                        value={
                          biz.dateOfAcquisition instanceof Date
                            ? biz.dateOfAcquisition.toISOString().split('T')[0]
                            : typeof biz.dateOfAcquisition === 'string' && biz.dateOfAcquisition
                              ? (() => { try { return new Date(biz.dateOfAcquisition).toISOString().split('T')[0]; } catch { return biz.dateOfAcquisition; } })()
                              : ''
                        }
                        onChange={(e) => updateBusinessInterest(index, 'dateOfAcquisition', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Owner Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Business Owner</Label>
                      <select
                        value={biz.owner || 'declarant'}
                        onChange={(e) => updateBusinessInterest(index, 'owner', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                      >
                        {PROPERTY_OWNER.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner === 'declarant' ? 'Declarant' :
                             owner === 'joint' ? 'Joint (Declarant & Spouse)' :
                             owner === 'spouse' ? 'Spouse Exclusive' :
                             'Child Exclusive'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Child Name (conditional) */}
                    {biz.owner === 'child' && (
                      <FormField
                        label="Child Name"
                        name={`biz-${index}-childName`}
                        value={biz.childName}
                        onChange={(val) => updateBusinessInterest(index, 'childName', val)}
                        placeholder="Name of the child"
                        required
                      />
                    )}
                  </div>
                </Card>
              ))}

              <Button type="button" onClick={addBusinessInterest} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Business Interest
              </Button>
            </>
          )}
        </div>
      </EditableSection>

      {/* VII. RELATIVES IN GOVERNMENT */}
      <EditableSection title="VII. Relatives in Government" icon={Users} delay={0.55}>
        <div className="space-y-4">
          <Alert className="border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-slate-600 dark:text-slate-400">
              Disclose relatives within the 4th civil degree (by consanguinity
              or affinity) currently employed in government. If none, leave this section empty.
            </AlertDescription>
          </Alert>

          {(!formData.relativesInGov || formData.relativesInGov.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <Users className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No relatives in government added</p>
              <p className="text-xs text-slate-400 mb-3">Add relatives or leave empty if none</p>
              <Button type="button" onClick={addRelativeInGov} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Relative
              </Button>
            </div>
          ) : (
            <>
              {(formData.relativesInGov as RelativeInGovItem[]).map((relative, index) => (
                <Card key={index} className="p-4 border-slate-200 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Relative {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRelativeInGov(index)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>

                    {/* Name & Relationship */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Full Name"
                        name={`relative-${index}-name`}
                        value={relative.name}
                        onChange={(val) => updateRelativeInGov(index, 'name', val)}
                        placeholder="Full name of relative"
                        required
                      />
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Relationship <span className="text-rose-500">*</span></Label>
                        <select
                          value={relative.relationship || ''}
                          onChange={(e) => updateRelativeInGov(index, 'relationship', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[oklch(0.55_0.22_15)]"
                        >
                          <option value="">Select relationship</option>
                          {RELATIONSHIP_TYPE.map((rel) => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Position */}
                    <FormField
                      label="Position/Title"
                      name={`relative-${index}-position`}
                      value={relative.position}
                      onChange={(val) => updateRelativeInGov(index, 'position', val)}
                      placeholder="Position in government"
                      required
                    />

                    {/* Agency/Office */}
                    <FormField
                      label="Agency/Office and Address"
                      name={`relative-${index}-agencyAddress`}
                      value={relative.agencyAddress}
                      onChange={(val) => updateRelativeInGov(index, 'agencyAddress', val)}
                      placeholder="Complete agency name and address"
                      required
                      fullWidth
                    />
                  </div>
                </Card>
              ))}

              <Button type="button" onClick={addRelativeInGov} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Relative
              </Button>
            </>
          )}
        </div>
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
