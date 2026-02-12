'use client';

/**
 * Shared Number Input Component
 * Specialized input for year fields, hours, ratings, etc.
 *
 * Features:
 * - Type-safe number handling
 * - Optional min/max/step validation
 * - Consistent error message display
 * - Shared styling across all sections
 */

import React from 'react';
import { Input } from '../../ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../../ui/form';
import { type UseFormReturn, type FieldValues } from 'react-hook-form';

interface NumberInputProps {
  form: UseFormReturn<FieldValues>;
  name: string;
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  onBlur?: () => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  form,
  name,
  label,
  required = false,
  min,
  max,
  step = 1,
  placeholder,
  onBlur,
}) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              onBlur={onBlur}
              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
