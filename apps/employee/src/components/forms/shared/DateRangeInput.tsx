'use client';

/**
 * Shared Date Range Input Component
 * Used across multiple PDS sections for date range fields
 *
 * Features:
 * - From/To date inputs
 * - Optional "Present" support for ongoing entries
 * - Consistent styling and validation
 * - Auto-save on blur
 */

import React from 'react';
import { type UseFormReturn, type FieldValues } from 'react-hook-form';
import { Input } from '../../ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../../ui/form';

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
      <FormField
        control={form.control}
        name={fromName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {fromLabel} <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={
                  field.value instanceof Date
                    ? field.value.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : null
                  );
                }}
                onBlur={onBlur}
                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* To Date */}
      <FormField
        control={form.control}
        name={toName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {toLabel}
              {allowPresent && " (or 'Present')"}
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={
                  field.value instanceof Date
                    ? field.value.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : null
                  );
                }}
                onBlur={onBlur}
                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
