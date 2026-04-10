'use client';

/**
 * SALN Step 1: Declarant Information
 * Updated for 2025 SALN Format
 *
 * Design Pattern: Matches PDS form with gradient header cards
 * - Clean gradient header with icon
 * - Step number and descriptive subtitle
 * - Consistent spacing and styling
 *
 * Features:
 * - Year auto-set to current year (read-only display)
 * - Compliance type selection (Annual, Assumption, Exit)
 * - Multiple marriages disclosure
 * - Spouse as public official section (for joint filing)
 * - Unmarried children below 18 listing
 * - EnhancedInput for all text fields
 * - BlurFade entrance animations
 * - React.memo for performance
 */

import { memo, useEffect, useRef } from 'react';
import { useFormContext, useWatch, useFieldArray, Controller } from 'react-hook-form';
import { PersonIcon } from '@radix-ui/react-icons';
import { Plus, Trash2, Info, Users, Calendar, Briefcase } from 'lucide-react';
import { Label } from '../../../../../components/ui/label';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { Textarea } from '../../../../../components/ui/textarea';
import { formatDateForInput } from '../../../../../lib/utils/date-utils';
import { FormDateInput } from '../../../../../components/forms/shared/FormDateInput';

// Import Enhanced Components from shared-ui
import {
  EnhancedInput,
  EnhancedCard,
  EnhancedCardContent,
  BlurFade,
} from '@tupsafe/shared-ui';
import type { CompleteSalnData } from '../../../../../lib/validations/saln-schema';

interface SubmissionErrors {
  year?: { message?: string };
  position?: { message?: string };
  agency?: { message?: string };
  officeAddress?: { message?: string };
  filingType?: { message?: string };
  spouseName?: { message?: string };
  complianceType?: { message?: string };
  complianceDate?: { message?: string };
  hasMultipleMarriages?: { message?: string };
  previousSpouseNames?: { message?: string };
  spouseIsPublicOfficial?: { message?: string };
  spousePosition?: { message?: string };
  spouseAgency?: { message?: string };
  spouseOfficeAddress?: { message?: string };
  unmarriedChildren?: { message?: string };
}

interface FormErrors {
  submission?: SubmissionErrors;
}

export const DeclarantInfo = memo(function DeclarantInfo() {
  const form = useFormContext<Partial<CompleteSalnData>>();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  // Watch for conditional rendering
  const filingType = useWatch({ control, name: 'submission.filingType' });
  const complianceType = useWatch({ control, name: 'submission.complianceType' });
  const hasMultipleMarriages = useWatch({ control, name: 'submission.hasMultipleMarriages' });
  const spouseIsPublicOfficial = useWatch({ control, name: 'submission.spouseIsPublicOfficial' });

  const _isJointFiling = filingType === 'joint';
  const hasSpouse = filingType === 'joint' || filingType === 'separate';
  const requiresComplianceDate = complianceType === 'assumption' || complianceType === 'exit';

  // Clear complianceDate when compliance type changes (so assumption/exit dates don't carry over)
  const prevComplianceTypeRef = useRef(complianceType);
  useEffect(() => {
    if (
      prevComplianceTypeRef.current !== undefined &&
      prevComplianceTypeRef.current !== complianceType &&
      complianceType !== undefined
    ) {
      form.setValue('submission.complianceDate', undefined);
    }
    prevComplianceTypeRef.current = complianceType;
  }, [complianceType, form]);

  // useFieldArray for unmarried children
  const {
    fields: childrenFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: 'submission.unmarriedChildren',
  });

  const addChild = () => {
    appendChild({ name: '', age: 0 });
  };

  // Current year for SALN filing (always the current year)
  const currentYear = new Date().getFullYear();

  // Auto-set the year value to current year
  useEffect(() => {
    const currentValue = form.getValues('submission.year');
    if (currentValue !== currentYear) {
      form.setValue('submission.year', currentYear, { shouldDirty: false });
    }
  }, [form, currentYear]);

  return (
    <div className="space-y-8">
      {/* Step Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PersonIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Step 1</p>
            <h2 className="text-2xl font-bold text-foreground">
              Declarant Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic information about you and your filing details
            </p>
          </div>
        </div>
      </div>

      {/* Reporting Year */}
      <BlurFade delay={0.1}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-6">
                Reporting Period
              </h3>
              <div className="grid gap-2">
                <Label
                  htmlFor="submission.year"
                  className="text-base font-medium">
                  As of December 31 of Year <span className="text-destructive">*</span>
                </Label>
                <div className="flex h-10 w-full items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-2">
                  <span className="text-base font-semibold text-foreground">{currentYear}</span>
                </div>
                <input type="hidden" {...register('submission.year')} />
                {errors?.submission && 'year' in errors.submission && (
                  <p className="text-sm text-destructive">
                    {(errors as FormErrors).submission?.year?.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  SALN submissions are filed for the current year only
                </p>
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Position and Agency */}
      <BlurFade delay={0.15}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-semibold text-foreground">
              Position Information
            </h3>
            <div className="grid gap-6 md:grid-cols-2 items-start">
              <div className="grid gap-2">
                <Label
                  htmlFor="submission.position"
                  className="text-base font-medium">
                  Position/Designation
                </Label>
                <EnhancedInput
                  id="submission.position"
                  placeholder="e.g., Assistant Professor III"
                  {...register('submission.position')}
                />
                {errors?.submission && 'position' in errors.submission && (
                  <p className="text-sm text-destructive">
                    {(errors as FormErrors).submission?.position?.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="submission.agency"
                  className="text-base font-medium">
                  Agency/Office
                </Label>
                <EnhancedInput
                  id="submission.agency"
                  placeholder="e.g., Technological University of the Philippines"
                  {...register('submission.agency')}
                />
                {errors?.submission && 'agency' in errors.submission && (
                  <p className="text-sm text-destructive">
                    {(errors as FormErrors).submission?.agency?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="submission.officeAddress"
                className="text-base font-medium">
                Office Address
              </Label>
              <EnhancedInput
                id="submission.officeAddress"
                placeholder="Complete office address"
                {...register('submission.officeAddress')}
              />
              {errors?.submission && 'officeAddress' in errors.submission && (
                <p className="text-sm text-destructive">
                  {(errors as FormErrors).submission?.officeAddress?.message}
                </p>
              )}
            </div>

          </div>
        </div>
      </BlurFade>

      {/* Filing Type */}
      <BlurFade delay={0.2}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Filing Type
              </h3>
              <p className="text-sm text-muted-foreground">
                Specify if filing jointly with spouse or separately
              </p>
            </div>
            <div className="space-y-6">
            <div className="grid gap-3">
              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.filingType')}
                  value="separate"
                  id="separate"
                  className="w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Separate Filing
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Filing individually (not with spouse)
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.filingType')}
                  value="joint"
                  id="joint"
                  className="w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Joint Filing
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Filing together with spouse (combined assets/liabilities)
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-6 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.filingType')}
                  value="not_applicable"
                  id="not_applicable"
                  className="w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Not Applicable
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Single, widowed, or separated
                  </p>
                </div>
              </label>
            </div>
            {errors?.submission && 'filingType' in errors.submission && (
              <p className="text-sm text-destructive">
                {(errors as FormErrors).submission?.filingType?.message}
              </p>
            )}

            {/* Spouse Name - shown for joint or separate filing (married declarants) */}
              {hasSpouse && (
                <BlurFade delay={0.25}>
                  <div className="grid gap-2 pt-4">
                    <Label
                      htmlFor="submission.spouseName"
                      className="text-base font-medium">
                      Spouse Full Name <span className="text-destructive">*</span>
                    </Label>
                    <EnhancedInput
                      id="submission.spouseName"
                      placeholder="e.g., Maria Clara Santos"
                      {...register('submission.spouseName')}
                    />
                    {errors?.submission && 'spouseName' in errors.submission && (
                      <p className="text-sm text-destructive">
                        {(errors as FormErrors).submission?.spouseName?.message}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Required for joint filing. Include middle name if
                      applicable.
                    </p>
                  </div>

                </BlurFade>
              )}
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Compliance Type Section (2025 SALN Format) */}
      <BlurFade delay={0.25}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Compliance Type
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the type of SALN filing you are submitting
              </p>
            </div>

            <div className="grid gap-3">
              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.complianceType')}
                  value="annual"
                  id="compliance-annual"
                  className="w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Annual Filing
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Regular annual SALN submission
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.complianceType')}
                  value="assumption"
                  id="compliance-assumption"
                  className="w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Assumption of Office
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Filing upon assuming a new position in government
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.complianceType')}
                  value="exit"
                  id="compliance-exit"
                  className="w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Exit from Office
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Filing upon separation from government service
                  </p>
                </div>
              </label>
            </div>

            {errors?.submission && 'complianceType' in errors.submission && (
              <p className="text-sm text-destructive">
                {(errors as FormErrors).submission?.complianceType?.message}
              </p>
            )}

            {/* Compliance Date - shown for assumption or exit */}
            {requiresComplianceDate && (
              <BlurFade delay={0.3}>
                <div className="grid gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Label
                    htmlFor="submission.complianceDate"
                    className="text-base font-medium">
                    Date of {complianceType === 'assumption' ? 'Assumption' : 'Exit'}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <FormDateInput
                    control={control}
                    name="submission.complianceDate"
                    variant="enhanced"
                    max={formatDateForInput(new Date())}
                    className="max-w-xs"
                  />
                  {errors?.submission && 'complianceDate' in errors.submission && (
                    <p className="text-sm text-destructive">
                      {(errors as FormErrors).submission?.complianceDate?.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {complianceType === 'assumption'
                      ? 'Date when you assumed your current position'
                      : 'Date of your separation from government service'}
                  </p>
                </div>
              </BlurFade>
            )}
          </div>
        </div>
      </BlurFade>

      {/* Multiple Marriages Section (2025 SALN Format) */}
      <BlurFade delay={0.3}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Multiple Marriages Disclosure
              </h3>
              <p className="text-sm text-muted-foreground">
                Indicate if you have had multiple marriages
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('submission.hasMultipleMarriages')}
                  id="hasMultipleMarriages"
                  className="mt-1 w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    I have had multiple marriages
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Check this box if you have been married more than once
                  </p>
                </div>
              </label>

              {hasMultipleMarriages ? (
                <BlurFade delay={0.35}>
                  <div className="grid gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Label
                      htmlFor="submission.previousSpouseNames"
                      className="text-base font-medium">
                      Previous Spouse Names <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="submission.previousSpouseNames"
                      placeholder="Enter the full names of your previous spouse(s), one per line"
                      {...register('submission.previousSpouseNames')}
                      className="min-h-[100px] bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                    {errors?.submission && 'previousSpouseNames' in errors.submission && (
                      <p className="text-sm text-destructive">
                        {(errors as FormErrors).submission?.previousSpouseNames?.message}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      List all previous spouse names for proper disclosure
                    </p>
                  </div>
                </BlurFade>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Not Applicable - No previous marriages to disclose
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </BlurFade>

      {/* Spouse as Public Official Section (2025 SALN Format) - For Joint or Separate Filing */}
      {hasSpouse && (
        <BlurFade delay={0.35}>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">
                    Spouse Employment Status
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Indicate if your spouse is also a public official or employee
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('submission.spouseIsPublicOfficial')}
                    id="spouseIsPublicOfficial"
                    className="mt-1 w-4 h-4 text-primary bg-transparent border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      My spouse is a public official or employee
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Check this if your spouse is employed in government service
                    </p>
                  </div>
                </label>

                {spouseIsPublicOfficial && (
                  <BlurFade delay={0.4}>
                    <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                          Please provide your spouse&apos;s government employment details
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-6 md:grid-cols-2 items-start">
                        <div className="grid gap-2">
                          <Label
                            htmlFor="submission.spousePosition"
                            className="text-base font-medium">
                            Spouse Position/Designation <span className="text-destructive">*</span>
                          </Label>
                          <EnhancedInput
                            id="submission.spousePosition"
                            placeholder="e.g., Administrative Officer III"
                            {...register('submission.spousePosition')}
                          />
                          {errors?.submission && 'spousePosition' in errors.submission && (
                            <p className="text-sm text-destructive">
                              {(errors as FormErrors).submission?.spousePosition?.message}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label
                            htmlFor="submission.spouseAgency"
                            className="text-base font-medium">
                            Spouse Agency/Office <span className="text-destructive">*</span>
                          </Label>
                          <EnhancedInput
                            id="submission.spouseAgency"
                            placeholder="e.g., Department of Education"
                            {...register('submission.spouseAgency')}
                          />
                          {errors?.submission && 'spouseAgency' in errors.submission && (
                            <p className="text-sm text-destructive">
                              {(errors as FormErrors).submission?.spouseAgency?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="submission.spouseOfficeAddress"
                          className="text-base font-medium">
                          Spouse Office Address <span className="text-destructive">*</span>
                        </Label>
                        <EnhancedInput
                          id="submission.spouseOfficeAddress"
                          placeholder="Complete office address of spouse"
                          {...register('submission.spouseOfficeAddress')}
                        />
                        {errors?.submission && 'spouseOfficeAddress' in errors.submission && (
                          <p className="text-sm text-destructive">
                            {(errors as FormErrors).submission?.spouseOfficeAddress?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </BlurFade>
                )}
              </div>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Unmarried Children Below 18 Section (2025 SALN Format) */}
      <BlurFade delay={0.4}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Unmarried Children Below 18 Years Old
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              List all unmarried children who are below 18 years of age
            </p>

            <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm text-muted-foreground">
                Include children whose assets, liabilities, or business interests may need to be disclosed in this SALN.
                If you have no unmarried children below 18, you may skip this section.
              </AlertDescription>
            </Alert>

            {childrenFields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground mb-2">
                  No unmarried children added
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have unmarried children below 18, add them here
                </p>
                <Button
                  type="button"
                  onClick={addChild}
                  variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {childrenFields.map((field, index) => (
                  <BlurFade key={field.id} delay={0.45 + index * 0.05}>
                    <EnhancedCard variant="default">
                      <EnhancedCardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline">Child {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChild(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`submission.unmarriedChildren.${index}.name`}
                              className="text-sm font-medium">
                              Child Name <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                              name={`submission.unmarriedChildren.${index}.name`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Full name of child"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`submission.unmarriedChildren.${index}.age`}
                              className="text-sm font-medium">
                              Age <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                              name={`submission.unmarriedChildren.${index}.age`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  type="number"
                                  min={0}
                                  max={17}
                                  placeholder="Age (0-17)"
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value === '' ? 0 : parseInt(value, 10));
                                  }}
                                />
                              )}
                            />
                            <p className="text-xs text-muted-foreground">
                              Must be below 18 years old
                            </p>
                          </div>
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  </BlurFade>
                ))}

                <Button
                  type="button"
                  onClick={addChild}
                  variant="outline"
                  className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Child
                </Button>
              </div>
            )}

            {errors?.submission && 'unmarriedChildren' in errors.submission && (
              <p className="text-sm text-destructive mt-4">
                {(errors as FormErrors).submission?.unmarriedChildren?.message}
              </p>
            )}
          </div>
        </div>
      </BlurFade>
    </div>
  );
});
