'use client';

/**
 * SALN Step 2: Real Properties
 * Land, houses, buildings, and other real estate
 *
 * Design Pattern: Matches PDS form with gradient header cards
 * - Clean gradient header with icon
 * - Step number and descriptive subtitle
 * - Consistent spacing and styling
 *
 * Features:
 * - EnhancedCard for property items
 * - Native HTML select for all dropdowns
 * - BlurFade for staggered animations
 * - React.memo for performance
 */

import { memo, useMemo } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { HomeIcon } from '@radix-ui/react-icons';
import { Plus, Trash2 } from 'lucide-react';
import { CurrencyInput } from '../../../../../components/forms/shared/CurrencyInput';
import { Label } from '../../../../../components/ui/label';
import { Button } from '../../../../../components/ui/button';
import { Textarea } from '../../../../../components/ui/textarea';
import { Badge } from '../../../../../components/ui/badge';
import { formatCurrency } from '../../../../../lib/utils/currency';
import {
  PROPERTY_KIND,
  ACQUISITION_MODE,
  PROPERTY_OWNER,
  type UnmarriedChild,
} from '../../../../../lib/validations/saln-schema';

// Import Enhanced Components
import {
  EnhancedCard,
  EnhancedCardContent,
  BlurFade,
} from '@tupsafe/shared-ui';

interface PropertyItem {
  currentFairMarketValue?: number;
  owner?: string;
}

interface PropertyError {
  description?: { message?: string };
}

// Helper component to watch individual property owner
function PropertyOwnerSelect({ index, control }: { index: number; control: unknown }) {
  const watchedOwner = useWatch({
    control: control as ReturnType<typeof useFormContext>['control'],
    name: `realProperties.${index}.owner`,
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
          htmlFor={`realProperties.${index}.owner`}
          className="text-base font-medium">
          Property Owner
        </Label>
        <Controller
          name={`realProperties.${index}.owner`}
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
            htmlFor={`realProperties.${index}.childName`}
            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
            Which Child?
          </Label>
          <Controller
            name={`realProperties.${index}.childName`}
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

export const RealProperties = memo(function RealProperties() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'realProperties',
  });

  const realProperties = watch('realProperties') || [];

  // Memoize year options to prevent recreation on every render
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 75 }, (_, i) => currentYear - i);
  }, []);

  const totalRealPropertyValue = useMemo(() => {
    const items = (realProperties || []) as PropertyItem[];
    return items.reduce(
      (sum: number, prop: PropertyItem) =>
        sum + (prop.currentFairMarketValue || 0),
      0
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- realProperties from watch() may create new array ref; computation is cheap
  }, [JSON.stringify(realProperties)]);

  const addRealProperty = () => {
    append({
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
    });
  };

  return (
    <div className="space-y-8">
      {/* Step Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HomeIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Step 2</p>
            <h2 className="text-2xl font-bold text-foreground">
              Real Properties
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              List all real estate properties you own (land, houses, buildings, etc.)
            </p>
          </div>
        </div>
      </div>

      <BlurFade delay={0.1}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8">
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <HomeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No real properties added yet
              </p>
              <Button type="button" onClick={addRealProperty} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Real Property
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {fields.map((field, index) => (
                <BlurFade key={field.id} delay={0.15 + index * 0.05}>
                  <EnhancedCard variant="default">
                    <EnhancedCardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Property {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                          <Label
                            htmlFor={`realProperties.${index}.description`}
                            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                            Property Description
                          </Label>
                          <Controller
                            name={`realProperties.${index}.description`}
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                {...field}
                                placeholder="e.g., 3-bedroom house and lot"
                                rows={2}
                                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                              />
                            )}
                          />
                          {errors?.realProperties &&
                            Array.isArray(errors.realProperties) &&
                            errors.realProperties[index] && (
                              <p className="text-sm text-destructive">
                                {
                                  (
                                    errors.realProperties[
                                      index
                                    ] as PropertyError
                                  )?.description?.message
                                }
                              </p>
                            )}
                        </div>

                        {/* Kind & Acquisition Year */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`realProperties.${index}.kind`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Property Kind
                            </Label>
                            <Controller
                              name={`realProperties.${index}.kind`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <select
                                  value={value || ''}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                                  <option value="">Select kind</option>
                                  {PROPERTY_KIND.map((kind) => (
                                    <option key={kind} value={kind}>
                                      {kind.charAt(0).toUpperCase() +
                                        kind.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`realProperties.${index}.acquisitionYear`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Year Acquired
                            </Label>
                            <Controller
                              name={`realProperties.${index}.acquisitionYear`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <select
                                  value={value?.toString() || ''}
                                  onChange={(e) => {
                                    const numValue = parseInt(
                                      e.target.value,
                                      10
                                    );
                                    if (!isNaN(numValue)) {
                                      onChange(numValue);
                                    }
                                  }}
                                  className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                                  <option value="">Select year</option>
                                  {yearOptions.map((year) => (
                                    <option key={year} value={year.toString()}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>
                        </div>

                        {/* Exact Location */}
                        <div className="grid gap-2">
                          <Label
                            htmlFor={`realProperties.${index}.exactLocation`}
                            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                            Exact Location/Address
                          </Label>
                          <Controller
                            name={`realProperties.${index}.exactLocation`}
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                {...field}
                                placeholder="Street, Barangay, City/Municipality, Province"
                                rows={2}
                                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                              />
                            )}
                          />
                        </div>

                        {/* Financial Values */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <CurrencyInput
                            name={`realProperties.${index}.assessedValue`}
                            label="Assessed Value"
                            required
                            helperText="From tax declaration"
                          />

                          <CurrencyInput
                            name={`realProperties.${index}.currentFairMarketValue`}
                            label="Current Fair Market Value"
                            required
                            helperText="Current market value"
                          />
                        </div>

                        {/* Acquisition Details */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`realProperties.${index}.acquisitionMode`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Mode of Acquisition
                            </Label>
                            <Controller
                              name={`realProperties.${index}.acquisitionMode`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <select
                                  value={value || ''}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                                  <option value="">Select mode</option>
                                  {ACQUISITION_MODE.map((mode) => (
                                    <option key={mode} value={mode}>
                                      {mode}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>

                          <CurrencyInput
                            name={`realProperties.${index}.acquisitionCost`}
                            label="Acquisition Cost"
                            required
                            helperText="Use 0 for inheritance/donation"
                          />
                        </div>

                        {/* Owner Selection (2025 SALN Format) */}
                        <PropertyOwnerSelect index={index} control={control} />
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addRealProperty}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Real Property
              </Button>

              {/* Total Summary */}
              <BlurFade delay={0.2 + fields.length * 0.05}>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Total Real Property Value:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalRealPropertyValue)}
                    </span>
                  </div>
                </div>
              </BlurFade>
            </div>
          )}
          </div>
        </div>
      </BlurFade>
    </div>
  );
});
