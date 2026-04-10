'use client';

/**
 * Shared Date Range Input Component
 * Used across multiple PDS sections for date range fields
 *
 * Features:
 * - From/To date inputs with local state buffering (via FormDateInput)
 * - Optional "Present" support for ongoing entries
 * - Consistent styling and validation
 * - Auto-save on blur
 */

import React from 'react';
import { type UseFormReturn, type FieldValues } from 'react-hook-form';
import { FormDateInput } from './FormDateInput';

interface DateRangeInputProps {
  form: UseFormReturn<FieldValues>;
  fromName: string;
  toName: string;
  fromLabel?: string;
  toLabel?: string;
  allowPresent?: boolean;
  onBlur?: () => void;
}

export const DateRangeInput: React.FC<DateRangeInputProps> = ({
  form,
  fromName,
  toName,
  fromLabel = 'From',
  toLabel = 'To',
  allowPresent = true,
  onBlur,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* From Date */}
      <FormDateInput
        control={form.control}
        name={fromName}
        label={fromLabel}
        required
        onBlur={onBlur}
      />

      {/* To Date */}
      <FormDateInput
        control={form.control}
        name={toName}
        label={allowPresent ? `${toLabel} (or 'Present')` : toLabel}
        onBlur={onBlur}
      />
    </div>
  );
};
