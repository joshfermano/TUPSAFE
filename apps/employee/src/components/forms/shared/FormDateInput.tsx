'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '../../ui/input';
import { EnhancedInput } from '@tupsafe/shared-ui';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../../ui/form';
import { formatDateForInput, parseDateFromInput } from '../../../lib/utils/date-utils';
import { cn } from '../../../lib/utils';

// ---------------------------------------------------------------------------
// Props for DIRECT usage: <FormDateInput value={...} onChange={...} />
// ---------------------------------------------------------------------------
export interface FormDateInputDirectProps {
  value: Date | string | null | undefined;
  onChange: (date: Date | null) => void;
  onBlur?: () => void;
  max?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  variant?: 'input' | 'enhanced';
  // Discriminator: when control is absent, this is the "direct" overload
  control?: undefined;
  name?: undefined;
  label?: undefined;
  placeholder?: undefined;
  required?: undefined;
}

// ---------------------------------------------------------------------------
// Props for FORM-FIELD usage: <FormDateInput control={form.control} name="..." label="..." />
// ---------------------------------------------------------------------------
export interface FormDateInputFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  variant?: 'input' | 'enhanced';
  required?: boolean;
  onBlur?: () => void;
  // These must NOT be provided in FormField mode
  value?: undefined;
  onChange?: undefined;
}

export type FormDateInputProps<TFieldValues extends FieldValues = FieldValues> =
  | FormDateInputDirectProps
  | FormDateInputFieldProps<TFieldValues>;

// ---------------------------------------------------------------------------
// Inner date input — handles local string buffering to prevent keyboard resets
// ---------------------------------------------------------------------------
interface DateInputCoreProps {
  value: Date | string | null | undefined;
  onChange: (date: Date | null) => void;
  onBlur?: () => void;
  max?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  variant?: 'input' | 'enhanced';
}

const DateInputCore = React.memo(function DateInputCore({
  value,
  onChange,
  onBlur,
  max,
  className,
  disabled,
  id,
  variant = 'input',
}: DateInputCoreProps) {
  const [localValue, setLocalValue] = useState<string>(() =>
    formatDateForInput(value)
  );
  const isFocusedRef = useRef(false);

  // Sync from parent value when NOT focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(formatDateForInput(value));
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
        const parsed = parseDateFromInput(newValue);
        onChange(parsed);
      }
      // Do NOT propagate null for incomplete values
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(localValue)) {
      setLocalValue(formatDateForInput(value));
      if (localValue === '' && value != null) {
        onChange(null);
      }
    }

    onBlur?.();
  }, [localValue, value, onChange, onBlur]);

  const inputClassName = cn(
    'bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors',
    className
  );

  if (variant === 'enhanced') {
    return (
      <EnhancedInput
        type="date"
        id={id}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        max={max}
        disabled={disabled}
        className={inputClassName}
      />
    );
  }

  return (
    <Input
      type="date"
      id={id}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      max={max}
      disabled={disabled}
      className={inputClassName}
    />
  );
});

DateInputCore.displayName = 'DateInputCore';

// ---------------------------------------------------------------------------
// Public component — supports both direct and FormField-wrapped usage
// ---------------------------------------------------------------------------

/**
 * FormDateInput - Date input that buffers local state to prevent
 * keyboard typing resets in controlled React <input type="date"> elements.
 *
 * **Two usage modes:**
 *
 * 1. **Direct** (value/onChange):
 *    ```tsx
 *    <FormDateInput value={date} onChange={setDate} />
 *    ```
 *
 * 2. **FormField-wrapped** (control/name):
 *    ```tsx
 *    <FormDateInput control={form.control} name="otherInfo.governmentId.dateIssued" label="Date" />
 *    ```
 *    Renders inside FormField > FormItem > FormLabel > FormControl > FormMessage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormDateInput = React.memo(function FormDateInput(props: FormDateInputProps<any>) {
  // Discriminate: if `control` is provided, use FormField-wrapper mode
  if (props.control !== undefined && props.name !== undefined) {
    // FormField-wrapper mode
    const { control, name, label, max, className, disabled, id, variant, required, onBlur: externalOnBlur } = props;
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            {label && <FormLabel>{label}{required && <span className="text-destructive"> *</span>}</FormLabel>}
            <FormControl>
              <DateInputCore
                value={field.value as Date | string | null | undefined}
                onChange={field.onChange}
                onBlur={() => { field.onBlur(); externalOnBlur?.(); }}
                max={max}
                className={className}
                disabled={disabled}
                id={id}
                variant={variant}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Direct mode — pass through to DateInputCore
  const { value, onChange, onBlur, max, className, disabled, id, variant } = props as Omit<FormDateInputDirectProps, 'control' | 'name' | 'label' | 'placeholder' | 'required'>;
  return (
    <DateInputCore
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      max={max}
      className={className}
      disabled={disabled}
      id={id}
      variant={variant}
    />
  );
});

FormDateInput.displayName = 'FormDateInput';
