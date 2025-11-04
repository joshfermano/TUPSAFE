'use client';

/**
 * Step 2: Real Properties
 * Land, houses, buildings, and other real estate
 */

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Building, Plus, Trash2 } from 'lucide-react';
import { FormSection } from '@/components/forms/shared/FormSection';
import { CurrencyInput } from '@/components/forms/shared/CurrencyInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { PROPERTY_KIND, ACQUISITION_MODE } from '@/lib/validations/saln-schema';
import { useMemo } from 'react';

interface PropertyItem {
  currentFairMarketValue?: number;
}

interface PropertyError {
  description?: { message?: string };
}

export function RealProperties() {
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
      <FormSection
        title="Real Properties"
        description="List all real estate properties you own (land, houses, buildings, etc.)"
        icon={Building}
      >
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
                  <Label htmlFor={`realProperties.${index}.description`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
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
                  {errors?.realProperties && Array.isArray(errors.realProperties) && errors.realProperties[index] && (
                    <p className="text-sm text-destructive">
                      {(errors.realProperties[index] as PropertyError)?.description?.message}
                    </p>
                  )}
                </div>

                {/* Kind & Location */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`realProperties.${index}.kind`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Property Kind
                    </Label>
                    <Controller
                      name={`realProperties.${index}.kind`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_KIND.map((kind) => (
                              <SelectItem key={kind} value={kind}>
                                {kind.charAt(0).toUpperCase() + kind.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`realProperties.${index}.acquisitionYear`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Year Acquired
                    </Label>
                    <Controller
                      name={`realProperties.${index}.acquisitionYear`}
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
                </div>

                {/* Exact Location */}
                <div className="grid gap-2">
                  <Label htmlFor={`realProperties.${index}.exactLocation`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                    Exact Location/Address
                  </Label>
                  <Controller
                    name={`realProperties.${index}.exactLocation`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Street, Barangay, City/Municipality, Province"
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
                    <Label htmlFor={`realProperties.${index}.acquisitionMode`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Mode of Acquisition
                    </Label>
                    <Controller
                      name={`realProperties.${index}.acquisitionMode`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACQUISITION_MODE.map((mode) => (
                              <SelectItem key={mode} value={mode}>
                                {mode}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
            ))}

            <Button type="button" onClick={addRealProperty} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Real Property
            </Button>

            {/* Total Summary */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Real Property Value:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalRealPropertyValue)}
                </span>
              </div>
            </div>
          </div>
        )}
      </FormSection>
    </div>
  );
}
