'use client';

/**
 * SALN Step 2: Real Properties
 * Land, houses, buildings, and other real estate
 *
 * FIXED: Replaced Radix UI Select with native HTML select to eliminate infinite loops
 *
 * Rebuilt with:
 * - EnhancedCard for property items
 * - EnhancedFormSection for clean layout
 * - Native HTML select for all dropdowns
 * - BlurFade for staggered animations
 * - React.memo for performance
 */

import { memo, useMemo } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Building, Plus, Trash2 } from 'lucide-react';
import { CurrencyInput } from '@/components/forms/shared/CurrencyInput';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { PROPERTY_KIND, ACQUISITION_MODE } from '@/lib/validations/saln-schema';

// Import Enhanced Components
import {
  EnhancedFormSection,
  EnhancedCard,
  EnhancedCardContent,
  BlurFade,
} from '@tupsafe/shared-ui';

interface PropertyItem {
  currentFairMarketValue?: number;
}

interface PropertyError {
  description?: { message?: string };
}

export const RealProperties = memo(function RealProperties() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'realProperties',
  });

  const realProperties = watch('realProperties') || [];

  // Generate year options (75 years back)
  const yearOptions = Array.from(
    { length: 75 },
    (_, i) => new Date().getFullYear() - i
  );

  const totalRealPropertyValue = useMemo(() => {
    return realProperties.reduce(
      (sum: number, prop: PropertyItem) => sum + (prop.currentFairMarketValue || 0),
      0
    );
  }, [realProperties]);

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
    });
  };

  return (
    <div className="space-y-6">
      <BlurFade delay={0.1}>
        <EnhancedFormSection
          title="Real Properties"
          subtitle="List all real estate properties you own (land, houses, buildings, etc.)"
          variant="default">
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No real properties added yet</p>
              <Button type="button" onClick={addRealProperty} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Real Property
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <BlurFade key={field.id} delay={0.15 + index * 0.05}>
                  <EnhancedCard variant="default">
                    <EnhancedCardContent>
                      <div className="space-y-4">
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
                            className="after:content-['*'] after:ml-0.5 after:text-destructive">
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
                              />
                            )}
                          />
                          {errors?.realProperties &&
                            Array.isArray(errors.realProperties) &&
                            errors.realProperties[index] && (
                              <p className="text-sm text-destructive">
                                {
                                  (errors.realProperties[index] as PropertyError)
                                    ?.description?.message
                                }
                              </p>
                            )}
                        </div>

                        {/* Kind & Acquisition Year */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`realProperties.${index}.kind`}
                              className="after:content-['*'] after:ml-0.5 after:text-destructive">
                              Property Kind
                            </Label>
                            <Controller
                              name={`realProperties.${index}.kind`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <select
                                  value={value || ''}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-600 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                                  <option value="">Select kind</option>
                                  {PROPERTY_KIND.map((kind) => (
                                    <option key={kind} value={kind}>
                                      {kind.charAt(0).toUpperCase() + kind.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`realProperties.${index}.acquisitionYear`}
                              className="after:content-['*'] after:ml-0.5 after:text-destructive">
                              Year Acquired
                            </Label>
                            <Controller
                              name={`realProperties.${index}.acquisitionYear`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <select
                                  value={value?.toString() || ''}
                                  onChange={(e) => {
                                    const numValue = parseInt(e.target.value, 10);
                                    if (!isNaN(numValue)) {
                                      onChange(numValue);
                                    }
                                  }}
                                  className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-600 [&>option]:bg-white [&>option]:dark:bg-slate-800">
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
                        </div>

                        {/* Exact Location */}
                        <div className="grid gap-2">
                          <Label
                            htmlFor={`realProperties.${index}.exactLocation`}
                            className="after:content-['*'] after:ml-0.5 after:text-destructive">
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
                              />
                            )}
                          />
                        </div>

                        {/* Financial Values */}
                        <div className="grid gap-4 md:grid-cols-2">
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
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`realProperties.${index}.acquisitionMode`}
                              className="after:content-['*'] after:ml-0.5 after:text-destructive">
                              Mode of Acquisition
                            </Label>
                            <Controller
                              name={`realProperties.${index}.acquisitionMode`}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <select
                                  value={value || ''}
                                  onChange={(e) => onChange(e.target.value)}
                                  className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-600 [&>option]:bg-white [&>option]:dark:bg-slate-800">
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
                    <span className="font-medium">Total Real Property Value:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalRealPropertyValue)}
                    </span>
                  </div>
                </div>
              </BlurFade>
            </div>
          )}
        </EnhancedFormSection>
      </BlurFade>
    </div>
  );
});
