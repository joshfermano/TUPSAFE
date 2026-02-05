'use client';

/**
 * SALN Step 4: Liabilities
 * Debts, loans, mortgages, and other financial obligations
 *
 * Design Pattern: Matches PDS form with gradient header cards
 * - Clean gradient header with icon
 * - Step number and descriptive subtitle
 * - Consistent spacing and styling
 *
 * Features:
 * - EnhancedCard for liability items
 * - EnhancedInput for text fields
 * - BlurFade for staggered animations
 * - React.memo for performance
 */

import { memo, useMemo } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { StackIcon } from '@radix-ui/react-icons';
import { Plus, Trash2, Info } from 'lucide-react';
import { CurrencyInput } from '../../../../../components/forms/shared/CurrencyInput';
import { Label } from '../../../../../components/ui/label';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { formatCurrency } from '../../../../../lib/utils/currency';
import {
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

interface LiabilityItem {
  outstandingBalance?: number;
  owner?: string;
}

interface LiabilityError {
  nature?: { message?: string };
  creditorName?: { message?: string };
}

// Helper component to watch individual liability owner
function LiabilityOwnerSelect({ index, control }: { index: number; control: unknown }) {
  const watchedOwner = useWatch({
    control: control as ReturnType<typeof useFormContext>['control'],
    name: `liabilities.${index}.owner`,
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
          htmlFor={`liabilities.${index}.owner`}
          className="text-base font-medium">
          Liability Owner
        </Label>
        <Controller
          name={`liabilities.${index}.owner`}
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
            htmlFor={`liabilities.${index}.childName`}
            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
            Which Child?
          </Label>
          <Controller
            name={`liabilities.${index}.childName`}
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

export const Liabilities = memo(function Liabilities() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'liabilities',
  });

  const liabilities = watch('liabilities') || [];

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce(
      (sum: number, liability: LiabilityItem) => {
        const balance = liability.outstandingBalance;
        const numBalance = typeof balance === 'string' ? parseFloat(balance) : (balance || 0);
        return sum + (isNaN(numBalance) ? 0 : numBalance);
      },
      0
    );
  }, [liabilities]);

  const addLiability = () => {
    append({
      nature: '',
      creditorName: '',
      outstandingBalance: 0,
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
            <StackIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Step 4</p>
            <h2 className="text-2xl font-bold text-foreground">
              Liabilities
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              List all debts, loans, and financial obligations
            </p>
          </div>
        </div>
      </div>

      <BlurFade delay={0.1}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8">
          <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-muted-foreground">
              Include all outstanding debts such as home mortgages, car loans,
              personal loans, credit card balances, and business loans. If you
              have no debts, you may skip this section.
            </AlertDescription>
          </Alert>

          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <StackIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">
                No liabilities added
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                If you have no debts or loans, you can proceed to the next step
              </p>
              <Button type="button" onClick={addLiability} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Liability
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
                          <Badge variant="outline">Liability {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Nature of Liability */}
                        <div className="grid gap-2">
                          <Label
                            htmlFor={`liabilities.${index}.nature`}
                            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                            Nature of Liability
                          </Label>
                          <Controller
                            name={`liabilities.${index}.nature`}
                            control={control}
                            render={({ field }) => (
                              <EnhancedInput
                                {...field}
                                placeholder="e.g., Home Mortgage Loan, Car Loan, Personal Loan, Credit Card"
                              />
                            )}
                          />
                          {errors?.liabilities &&
                            Array.isArray(errors.liabilities) &&
                            errors.liabilities[index] && (
                              <p className="text-sm text-destructive">
                                {
                                  (errors.liabilities[index] as LiabilityError)
                                    ?.nature?.message
                                }
                              </p>
                            )}
                        </div>

                        {/* Creditor Information */}
                        <div className="grid gap-2">
                          <Label
                            htmlFor={`liabilities.${index}.creditorName`}
                            className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                            Creditor Name and Address
                          </Label>
                          <Controller
                            name={`liabilities.${index}.creditorName`}
                            control={control}
                            render={({ field }) => (
                              <EnhancedInput
                                {...field}
                                placeholder="e.g., BPI Family Savings Bank, Makati City"
                              />
                            )}
                          />
                          {errors?.liabilities &&
                            Array.isArray(errors.liabilities) &&
                            errors.liabilities[index] && (
                              <p className="text-sm text-destructive">
                                {
                                  (errors.liabilities[index] as LiabilityError)
                                    ?.creditorName?.message
                                }
                              </p>
                            )}
                        </div>

                        {/* Outstanding Balance */}
                        <div className="grid gap-2">
                          <CurrencyInput
                            name={`liabilities.${index}.outstandingBalance`}
                            label="Outstanding Balance"
                            required
                            helperText="Current amount owed as of reporting date"
                          />
                        </div>

                        {/* Owner Selection (2025 SALN Format) */}
                        <LiabilityOwnerSelect index={index} control={control} />
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addLiability}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Liability
              </Button>

              {/* Total Summary */}
              <BlurFade delay={0.2 + fields.length * 0.05}>
                <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">
                      Total Liabilities:
                    </span>
                    <span className="text-xl font-bold text-destructive">
                      {formatCurrency(totalLiabilities)}
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
