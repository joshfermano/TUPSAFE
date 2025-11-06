'use client';

/**
 * SALN Step 1: Declarant Information
 *
 * FIXED: Replaced Radix UI Select with native HTML select to eliminate infinite loops
 * Enhanced with shared-ui components for premium, minimalistic design
 *
 * Features:
 * - EnhancedFormSection with clean variant
 * - Native HTML select with proper React Hook Form integration
 * - EnhancedInput for all text fields
 * - BlurFade entrance animations
 * - React.memo for performance
 */

import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<any>();

  const filingType = watch('submission.filingType');
  const isJointFiling = filingType === 'joint';

  // Generate year options
  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="space-y-6">
      {/* Reporting Year */}
      <BlurFade delay={0.1}>
        <EnhancedFormSection
          title="Reporting Period"
          subtitle="Select the year for this SALN statement"
          variant="default">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="submission.year"
                className="after:content-['*'] after:ml-0.5 after:text-destructive">
                As of December 31 of Year
              </Label>
              <select
                id="submission.year"
                {...register('submission.year', {
                  setValueAs: (v) => (v ? parseInt(v, 10) : undefined),
                })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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
            </div>
          </div>
        </EnhancedFormSection>
      </BlurFade>

      {/* Position and Agency */}
      <BlurFade delay={0.15}>
        <EnhancedFormSection
          title="Position Information"
          subtitle="Your current position and office"
          variant="default">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="submission.position">Position/Designation</Label>
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
              <Label htmlFor="submission.agency">Agency/Office</Label>
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
            <Label htmlFor="submission.officeAddress">Office Address</Label>
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
        </EnhancedFormSection>
      </BlurFade>

      {/* Filing Type */}
      <BlurFade delay={0.2}>
        <EnhancedFormSection
          title="Filing Type"
          subtitle="Specify if filing jointly with spouse or separately"
          variant="default">
          <div className="space-y-4">
            <div className="grid gap-3">
              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.filingType')}
                  value="separate"
                  id="separate"
                  className="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Separate Filing
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Filing individually (not with spouse)
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.filingType')}
                  value="joint"
                  id="joint"
                  className="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Joint Filing
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Filing together with spouse (combined assets/liabilities)
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-accent/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  {...register('submission.filingType')}
                  value="not_applicable"
                  id="not_applicable"
                  className="w-4 h-4 text-primary bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Not Applicable
                  </div>
                  <p className="text-sm text-muted-foreground">
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
                <div className="grid gap-2 pt-2">
                  <Label
                    htmlFor="submission.spouseName"
                    className="after:content-['*'] after:ml-0.5 after:text-destructive">
                    Spouse Full Name
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
                  <p className="text-xs text-muted-foreground">
                    Required for joint filing. Include middle name if applicable.
                  </p>
                </div>
              </BlurFade>
            )}
          </div>
        </EnhancedFormSection>
      </BlurFade>
    </div>
  );
});
