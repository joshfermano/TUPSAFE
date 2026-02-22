'use client';

/**
 * SALN Step 5: Business Interests & Relatives in Government
 * Combined section for business connections and government relatives
 *
 * Design Pattern: Matches PDS form with gradient header cards
 * - Clean gradient header with icon
 * - Step number and descriptive subtitle
 * - Consistent spacing and styling
 *
 * Features:
 * - EnhancedCard for business/relative items
 * - EnhancedInput for text fields
 * - BlurFade for staggered animations
 * - React.memo for performance
 */

import { memo } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { BackpackIcon, PersonIcon } from '@radix-ui/react-icons';
import { Plus, Trash2, Info } from 'lucide-react';
import { Label } from '../../../../../components/ui/label';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import {
  RELATIONSHIP_TYPE,
  PROPERTY_OWNER,
  type UnmarriedChild,
} from '../../../../../lib/validations/saln-schema';

// Import Enhanced Components
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedInput,
  BlurFade,
} from '@tupsafe/shared-ui';

// Helper component to watch individual business interest owner
function BusinessOwnerSelect({ index, control }: { index: number; control: unknown }) {
  const watchedOwner = useWatch({
    control: control as ReturnType<typeof useFormContext>['control'],
    name: `businessInterests.${index}.owner`,
  });

  const unmarriedChildren = useWatch({
    control: control as ReturnType<typeof useFormContext>['control'],
    name: 'submission.unmarriedChildren',
  }) as UnmarriedChild[] || [];

  return (
    <>
      {/* Owner Selection */}
      <div className="grid gap-2">
        <Label
          htmlFor={`businessInterests.${index}.owner`}
          className="text-base font-medium">
          Business Owner
        </Label>
        <Controller
          name={`businessInterests.${index}.owner`}
          control={control as ReturnType<typeof useFormContext>['control']}
          render={({ field: { onChange, value } }) => (
            <select
              value={value || 'declarant'}
              onChange={(e) => onChange(e.target.value)}
              className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
              {PROPERTY_OWNER.map((owner) => (
                <option key={owner} value={owner}>
                  {owner === 'declarant' && 'Declarant'}
                  {owner === 'joint' && 'Joint (Declarant & Spouse)'}
                  {owner === 'spouse' && 'Spouse Exclusive'}
                  {owner === 'child' && 'Child Exclusive'}
                </option>
              ))}
            </select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Declarant & Joint go to ANNEX A/B. Spouse/Child go to ANNEX C.
        </p>
      </div>

      {/* Conditional Child Name - only when owner is 'child' */}
      {watchedOwner === 'child' && (
        <div className="grid gap-2">
          <Label
            htmlFor={`businessInterests.${index}.childName`}
            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
            Which Child?
          </Label>
          <Controller
            name={`businessInterests.${index}.childName`}
            control={control as ReturnType<typeof useFormContext>['control']}
            render={({ field: { onChange, value } }) => (
              <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                <option value="">Select child</option>
                {unmarriedChildren.map((child) => (
                  <option key={child.name} value={child.name}>
                    {child.name}
                  </option>
                ))}
              </select>
            )}
          />
          {unmarriedChildren.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No unmarried children listed. Add children in Step 1 (Declarant Info).
            </p>
          )}
        </div>
      )}
    </>
  );
}

export const BusinessRelatives = memo(function BusinessRelatives() {
  const { control, watch } = useFormContext();

  // Watch for the "I/We do not have" checkboxes
  const hasNoBusinessInterests = watch('submission.hasNoBusinessInterests') || false;
  const hasNoRelativesInGov = watch('submission.hasNoRelativesInGov') || false;

  const {
    fields: businessFields,
    append: appendBusiness,
    remove: removeBusiness,
  } = useFieldArray({
    control,
    name: 'businessInterests',
  });

  const {
    fields: relativeFields,
    append: appendRelative,
    remove: removeRelative,
  } = useFieldArray({
    control,
    name: 'relativesInGov',
  });

  const addBusinessInterest = () => {
    appendBusiness({
      entityName: '',
      businessAddress: '',
      natureOfBusiness: '',
      dateOfAcquisition: new Date(),
      owner: 'declarant',
      childName: null,
    });
  };

  const addRelative = () => {
    appendRelative({
      name: '',
      relationship: 'Spouse',
      position: '',
      agencyAddress: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Step Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BackpackIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Step 5</p>
            <h2 className="text-2xl font-bold text-foreground">
              Business Interests & Relatives in Government
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Disclose business connections and government service relatives
            </p>
          </div>
        </div>
      </div>

      {/* Business Interests Section */}
      <BlurFade delay={0.1}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <BackpackIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Business Interests and Financial Connections
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Disclose any business interests, partnerships, or financial connections
            </p>
          <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-muted-foreground">
              Include any business where you or your spouse have an interest
              (stockholder, partner, officer, director, etc.). If none, check
              the box below.
            </AlertDescription>
          </Alert>

          {/* I/We do not have business interests checkbox */}
          <Controller
            name="submission.hasNoBusinessInterests"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50 cursor-pointer mb-6 hover:bg-muted/70 transition-colors">
                <input
                  type="checkbox"
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium">
                  I/We do not have any business interest or financial connection
                </span>
              </label>
            )}
          />

          {hasNoBusinessInterests ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
              <BackpackIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No business interests to declare
              </p>
            </div>
          ) : businessFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <BackpackIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">
                No business interests added
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your business interests or check the box above if you have none
              </p>
              <Button
                type="button"
                onClick={addBusinessInterest}
                variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Business Interest
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {businessFields.map((field, index) => (
                <BlurFade key={field.id} delay={0.15 + index * 0.05}>
                  <EnhancedCard variant="default">
                    <EnhancedCardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Business {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBusiness(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-6">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.entityName`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Business Name
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.entityName`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Name of business/corporation"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.businessAddress`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Business Address
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.businessAddress`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Complete business address"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.natureOfBusiness`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Nature of Business Interest
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.natureOfBusiness`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="e.g., Stockholder, Partner, Director"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.dateOfAcquisition`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Date of Acquisition
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.dateOfAcquisition`}
                              control={control}
                              render={({ field }) => {
                                // Normalize value to YYYY-MM-DD string format
                                let displayValue = '';
                                if (field.value instanceof Date) {
                                  displayValue = field.value.toISOString().split('T')[0];
                                } else if (typeof field.value === 'string' && field.value) {
                                  // Handle ISO string from localStorage
                                  try {
                                    displayValue = new Date(field.value).toISOString().split('T')[0];
                                  } catch {
                                    displayValue = field.value;
                                  }
                                }

                                return (
                                  <EnhancedInput
                                    type="date"
                                    value={displayValue}
                                    onChange={(e) => {
                                      const dateStr = e.target.value;
                                      // Store as Date object for consistency with form state
                                      field.onChange(dateStr ? new Date(dateStr) : null);
                                    }}
                                    max={new Date().toISOString().split('T')[0]}
                                  />
                                );
                              }}
                            />
                          </div>

                          {/* Owner Selection (2025 SALN Format) */}
                          <BusinessOwnerSelect index={index} control={control} />
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addBusinessInterest}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Business Interest
              </Button>
            </div>
          )}
          </div>
        </div>
      </BlurFade>

      {/* Relatives in Government Section */}
      <BlurFade delay={0.2}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <PersonIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Relatives in Government Service
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              List relatives within 4th civil degree working in government
            </p>
          <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-muted-foreground">
              Disclose relatives within the 4th civil degree (by consanguinity
              or affinity) currently employed in government. If none, check
              the box below.
            </AlertDescription>
          </Alert>

          {/* I/We do not know of any relatives checkbox */}
          <Controller
            name="submission.hasNoRelativesInGov"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50 cursor-pointer mb-6 hover:bg-muted/70 transition-colors">
                <input
                  type="checkbox"
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium">
                  I/We do not know of any relative/s in the government service
                </span>
              </label>
            )}
          />

          {hasNoRelativesInGov ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
              <PersonIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No relatives in government to declare
              </p>
            </div>
          ) : relativeFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <PersonIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">
                No relatives in government added
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your relatives or check the box above if you have none
              </p>
              <Button type="button" onClick={addRelative} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Relative
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {relativeFields.map((field, index) => (
                <BlurFade key={field.id} delay={0.25 + index * 0.05}>
                  <EnhancedCard variant="default">
                    <EnhancedCardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Relative {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRelative(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-6">
                          <div className="grid gap-6 md:grid-cols-2 items-start">
                            <div className="grid gap-2">
                              <Label
                                htmlFor={`relativesInGov.${index}.name`}
                                className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                                Full Name
                              </Label>
                              <Controller
                                name={`relativesInGov.${index}.name`}
                                control={control}
                                render={({ field }) => (
                                  <EnhancedInput
                                    {...field}
                                    placeholder="Full name of relative"
                                  />
                                )}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label
                                htmlFor={`relativesInGov.${index}.relationship`}
                                className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                                Relationship
                              </Label>
                              <Controller
                                name={`relativesInGov.${index}.relationship`}
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                  <select
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                                    <option value="">
                                      Select relationship
                                    </option>
                                    {RELATIONSHIP_TYPE.map((rel) => (
                                      <option key={rel} value={rel}>
                                        {rel}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`relativesInGov.${index}.position`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Position/Title
                            </Label>
                            <Controller
                              name={`relativesInGov.${index}.position`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Position in government"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`relativesInGov.${index}.agencyAddress`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Agency/Office and Address
                            </Label>
                            <Controller
                              name={`relativesInGov.${index}.agencyAddress`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Complete agency name and address"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addRelative}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Relative
              </Button>
            </div>
          )}
          </div>
        </div>
      </BlurFade>
    </div>
  );
});
