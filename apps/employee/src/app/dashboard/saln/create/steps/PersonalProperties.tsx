'use client';

/**
 * Step 3: Personal Properties
 * Vehicles, jewelry, cash, investments, and other personal assets
 */

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Car, Plus, Trash2 } from 'lucide-react';
import { FormSection } from '@/components/forms/shared/FormSection';
import { CurrencyInput } from '@/components/forms/shared/CurrencyInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { useMemo } from 'react';

interface PropertyItem {
  acquisitionCost?: number;
}

interface PropertyError {
  description?: { message?: string };
}

export function PersonalProperties() {
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
    <div className="space-y-6">
      <FormSection
        title="Personal Properties"
        description="List all personal assets (vehicles, jewelry, cash, investments, etc.)"
        icon={Car}
      >
        {fields.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No personal properties added yet</p>
              <Button type="button" onClick={addPersonalProperty} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Personal Property
              </Button>
            </div>

            {/* Suggested Categories */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-3">Suggested Categories:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-6 border rounded-lg bg-card space-y-4 relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">Property {index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Description */}
                <div className="grid gap-2">
                  <Label htmlFor={`personalProperties.${index}.description`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
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
                      />
                    )}
                  />
                  {errors?.personalProperties && Array.isArray(errors.personalProperties) && errors.personalProperties[index] && (
                    <p className="text-sm text-destructive">
                      {(errors.personalProperties[index] as PropertyError)?.description?.message}
                    </p>
                  )}
                </div>

                {/* Year and Cost */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`personalProperties.${index}.yearAcquired`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Year Acquired
                    </Label>
                    <Controller
                      name={`personalProperties.${index}.yearAcquired`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          min={1950}
                          max={new Date().getFullYear()}
                        />
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
            ))}

            <Button type="button" onClick={addPersonalProperty} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Personal Property
            </Button>

            {/* Total Summary */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Personal Property Value:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalPersonalPropertyValue)}
                </span>
              </div>
            </div>
          </div>
        )}
      </FormSection>
    </div>
  );
}
