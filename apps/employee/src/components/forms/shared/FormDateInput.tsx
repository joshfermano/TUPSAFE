'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '../../ui/input';
import { EnhancedInput } from '@tupsafe/shared-ui';
import { formatDateForInput, parseDateFromInput } from '../../../lib/utils/date-utils';
import { cn } from '../../../lib/utils';

export interface FormDateInputProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  onBlur?: () => void;
  max?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  variant?: 'input' | 'enhanced';
}

/**
 * FormDateInput - Date input that buffers local state to prevent
 * keyboard typing resets in controlled React <input type="date"> elements.
 *
 * The native date input only returns a complete YYYY-MM-DD string when
 * all segments (month, day, year) are filled. This component maintains
 * local string state so partial typing is never overwritten by form re-renders.
 */
export const FormDateInput = React.memo(function FormDateInput({
  value,
  onChange,
  onBlur,
  max,
  className,
  disabled,
  id,
  variant = 'input',
}: FormDateInputProps) {
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

FormDateInput.displayName = 'FormDateInput';
