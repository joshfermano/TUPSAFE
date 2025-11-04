'use client';

/**
 * Step 1: Declarant Information
 * Basic information, position, reporting period, and joint filing
 */

import { useFormContext, Controller } from 'react-hook-form';
import { User, Calendar, Users } from 'lucide-react';
import { FormSection } from '@/components/forms/shared/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FILING_TYPE } from '@/lib/validations/saln-schema';

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

export function DeclarantInfo() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Type assertion needed: Complex nested form schema type inference with watch
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<any>();

  const filingType = watch('submission.filingType');
  const isJointFiling = filingType === 'joint';

  return (
    <div className="space-y-6">
      {/* Reporting Year */}
      <FormSection
        title="Reporting Period"
        description="Select the year for this SALN statement"
        icon={Calendar}
        required>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label
              htmlFor="submission.year"
              className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
              As of December 31 of Year
            </Label>
            <Controller
              name="submission.year"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors?.submission && 'year' in errors.submission && (
              <p className="text-sm text-destructive">
                {(errors as FormErrors).submission?.year?.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Position and Agency */}
      <FormSection
        title="Position Information"
        description="Your current position and office"
        icon={User}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="submission.position">Position/Designation</Label>
            <Input
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
            <Input
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
          <Input
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
      </FormSection>

      {/* Filing Type */}
      <FormSection
        title="Filing Type"
        description="Specify if filing jointly with spouse or separately"
        icon={Users}
        required>
        <div className="space-y-4">
          <Controller
            name="submission.filingType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid gap-4">
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="separate" id="separate" />
                  <div className="flex-1">
                    <Label htmlFor="separate" className="cursor-pointer">
                      <div className="font-medium">Separate Filing</div>
                      <p className="text-sm text-muted-foreground">
                        Filing individually (not with spouse)
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="joint" id="joint" />
                  <div className="flex-1">
                    <Label htmlFor="joint" className="cursor-pointer">
                      <div className="font-medium">Joint Filing</div>
                      <p className="text-sm text-muted-foreground">
                        Filing together with spouse (combined
                        assets/liabilities)
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="not_applicable" id="not_applicable" />
                  <div className="flex-1">
                    <Label htmlFor="not_applicable" className="cursor-pointer">
                      <div className="font-medium">Not Applicable</div>
                      <p className="text-sm text-muted-foreground">
                        Single, widowed, or separated
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            )}
          />
          {errors?.submission && 'filingType' in errors.submission && (
            <p className="text-sm text-destructive">
              {(errors as FormErrors).submission?.filingType?.message}
            </p>
          )}

          {/* Spouse Name (shown only for joint filing) */}
          {isJointFiling && (
            <div className="grid gap-2 pt-2">
              <Label
                htmlFor="submission.spouseName"
                className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                Spouse Full Name
              </Label>
              <Input
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
          )}
        </div>
      </FormSection>
    </div>
  );
}
