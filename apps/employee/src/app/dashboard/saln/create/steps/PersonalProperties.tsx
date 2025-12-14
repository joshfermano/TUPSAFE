'use client';

/**
 * SALN Step 3: Personal Properties
 * Vehicles, jewelry, cash, investments, and other personal assets
 *
 * Design Pattern: Matches PDS form with gradient header cards
 * - Clean gradient header with icon
 * - Step number and descriptive subtitle
 * - Consistent spacing and styling
 *
 * Features:
 * - EnhancedCard for property items
 * - BlurFade for staggered animations
 * - React.memo for performance
 */

import { memo, useMemo } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { BackpackIcon } from '@radix-ui/react-icons';
import { Plus, Trash2 } from 'lucide-react';
import { CurrencyInput } from '../../../../../components/forms/shared/CurrencyInput';
import { Label } from '../../../../../components/ui/label';
import { Button } from '../../../../../components/ui/button';
import { Textarea } from '../../../../../components/ui/textarea';
import { Badge } from '../../../../../components/ui/badge';
import { formatCurrency } from '../../../../../lib/utils/currency';

// Import Enhanced Components
import {
  EnhancedFormSection,
  EnhancedCard,
  EnhancedCardContent,
  BlurFade,
} from '@tupsafe/shared-ui';

interface PropertyItem {
  acquisitionCost?: number;
}

interface PropertyError {
  description?: { message?: string };
}

export const PersonalProperties = memo(function PersonalProperties() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'personalProperties',
  });

  const personalProperties = watch('personalProperties') || [];

  const totalPersonalPropertyValue = useMemo(() => {
    return personalProperties.reduce(
      (sum: number, prop: PropertyItem) => sum + (prop.acquisitionCost || 0),
      0
    );
  }, [personalProperties]);

  const addPersonalProperty = () => {
    append({
      description: '',
      yearAcquired: new Date().getFullYear(),
      acquisitionCost: 0,
    });
  };

  const suggestedCategories = [
    'Motor Vehicles',
    'Jewelry and Watches',
    'Electronics and Appliances',
    'Cash on Hand',
    'Cash in Bank',
    'Stocks and Bonds',
    'Investment Securities',
    'Other Investments',
  ];

  return (
    <div className="space-y-8">
      {/* Step Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BackpackIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Step 3</p>
            <h2 className="text-2xl font-bold text-foreground">
              Personal Properties
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              List all personal assets (vehicles, jewelry, cash, investments, etc.)
            </p>
          </div>
        </div>
      </div>

      <BlurFade delay={0.1}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8">
          {fields.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
                <BackpackIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No personal properties added yet
                </p>
                <Button
                  type="button"
                  onClick={addPersonalProperty}
                  variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Personal Property
                </Button>
              </div>

              {/* Suggested Categories */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-base font-medium text-foreground mb-3">
                  Suggested Categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
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
                            htmlFor={`personalProperties.${index}.description`}
                            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                            Property Description
                          </Label>
                          <Controller
                            name={`personalProperties.${index}.description`}
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                {...field}
                                placeholder="e.g., 2020 Toyota Corolla, Jewelry Collection, Cash in BPI Savings"
                                rows={2}
                                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                              />
                            )}
                          />
                          {errors?.personalProperties &&
                            Array.isArray(errors.personalProperties) &&
                            errors.personalProperties[index] && (
                              <p className="text-sm text-destructive">
                                {
                                  (
                                    errors.personalProperties[
                                      index
                                    ] as PropertyError
                                  )?.description?.message
                                }
                              </p>
                            )}
                        </div>

                        {/* Year and Cost */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`personalProperties.${index}.yearAcquired`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Year Acquired
                            </Label>
                            <Controller
                              name={`personalProperties.${index}.yearAcquired`}
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
                                  {Array.from(
                                    { length: 75 },
                                    (_, i) => new Date().getFullYear() - i
                                  ).map((year) => (
                                    <option key={year} value={year.toString()}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>

                          <CurrencyInput
                            name={`personalProperties.${index}.acquisitionCost`}
                            label="Acquisition Cost / Current Value"
                            required
                            helperText="Original cost or current market value"
                          />
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addPersonalProperty}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Personal Property
              </Button>

              {/* Total Summary */}
              <BlurFade delay={0.2 + fields.length * 0.05}>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Total Personal Property Value:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalPersonalPropertyValue)}
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
