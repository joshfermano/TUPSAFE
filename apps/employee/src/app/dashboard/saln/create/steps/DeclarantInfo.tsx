'use client';

/**
 * SALN Step 1: Declarant Information
 *
 * Design Pattern: Matches PDS form with gradient header cards
 * - Clean gradient header with icon
 * - Step number and descriptive subtitle
 * - Consistent spacing and styling
 *
 * Features:
 * - Native HTML select with proper React Hook Form integration
 * - EnhancedInput for all text fields
 * - BlurFade entrance animations
 * - React.memo for performance
 */

import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { PersonIcon } from '@radix-ui/react-icons';
import { Label } from '../../../../../components/ui/label';

// Import Enhanced Components from shared-ui
import {
  EnhancedFormSection,
  EnhancedInput,
  BlurFade,
} from '@tupsafe/shared-ui';

interface SubmissionErrors {
  year?: { message?: string };
  position?: { message?: string };
  agency?: { message?: string };
  officeAddress?: { message?: string };
  filingType?: { message?: string };
  spouseName?: { message?: string };
}

interface FormErrors {
  submission?: SubmissionErrors;
}

export const DeclarantInfo = memo(function DeclarantInfo() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<any>();

  const filingType = watch('submission.filingType');
  const isJointFiling = filingType === 'joint';

  // Memoize year options to prevent recreation on every render
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

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
                <select
                  id="submission.year"
                  {...register('submission.year', {
                    setValueAs: (v) => (v ? parseInt(v, 10) : undefined),
                  })}
                  className="flex h-10 w-full rounded-md border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors px-3 py-2 text-sm ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors?.submission && 'year' in errors.submission && (
                  <p className="text-sm text-destructive">
                    {(errors as FormErrors).submission?.year?.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Year for which this SALN is being filed
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
            <div className="grid gap-6 md:grid-cols-2">
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

            {/* Spouse Name - shown only for joint filing */}
              {isJointFiling && (
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
    </div>
  );
});
