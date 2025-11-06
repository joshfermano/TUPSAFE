'use client';

import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  type InputHTMLAttributes,
} from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  parseCurrency,
  formatCurrencyInput,
  isValidCurrencyInput,
  cleanCurrencyInput,
  CURRENCY_CONSTANTS,
} from '@/lib/utils/currency';
import { X } from 'lucide-react';

/**
 * CurrencyInput Component
 *
 * A specialized input component for Philippine Peso (PHP) currency values
 * specifically designed for the SALN module.
 *
 * Features:
 * - Auto-format with peso sign (₱) and comma separators
 * - Real-time validation
 * - Format on blur for better UX
 * - Support for large amounts (billions)
 * - React Hook Form integration
 * - Min/max value constraints
 * - Clear button
 * - Accessible WCAG 2.1 AA compliant
 * - Optimized with React.memo and useCallback
 * - TUP Manila crimson theme
 *
 * @example
 * ```tsx
 * <CurrencyInput
 *   name="assets.realProperty[0].acquisitionCost"
 *   label="Acquisition Cost"
 *   required
 *   min={0}
 *   helperText="Enter the original purchase price"
 * />
 * ```
 */

export interface CurrencyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'name' | 'type' | 'value' | 'onChange'
  > {
  /** Form field name (supports nested paths) */
  name: string;
  /** Display label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Show clear button (×) to reset value */
  showClearButton?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Callback when value changes (receives numeric value) */
  onValueChange?: (value: number) => void;
}

export const CurrencyInput = memo(function CurrencyInput({
  name,
  label,
  placeholder = CURRENCY_CONSTANTS.DEFAULT_PLACEHOLDER,
  required = false,
  disabled = false,
  min = CURRENCY_CONSTANTS.MIN_VALUE,
  max = CURRENCY_CONSTANTS.MAX_VALUE,
  helperText,
  showClearButton = true,
  className,
  onValueChange,
  ...inputProps
}: CurrencyInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Local state for the formatted display value
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get nested error if exists
  const error = useMemo(() => {
    const pathParts = name.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Type assertion needed: Dynamic property access on form errors object
    let currentError: any = errors;

    for (const part of pathParts) {
      // Handle array notation like "assets[0]"
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        currentError = currentError?.[arrayName]?.[parseInt(index)];
      } else {
        currentError = currentError?.[part];
      }

      if (!currentError) break;
    }

    return currentError?.message as string | undefined;
  }, [errors, name]);

  /**
   * Handle input change with real-time validation
   */
  const handleInputChange = useCallback(
    (value: string, onChange: (value: number) => void) => {
      // Clean the input value
      const cleaned = cleanCurrencyInput(value);

      // Validate the cleaned input
      if (!isValidCurrencyInput(cleaned)) {
        return;
      }

      // Format for display
      const formatted = formatCurrencyInput(cleaned);
      setDisplayValue(formatted);

      // Parse and emit numeric value
      const numericValue = parseCurrency(formatted);

      // Apply min/max constraints
      let constrainedValue = numericValue;
      if (min !== undefined && numericValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && numericValue > max) {
        constrainedValue = max;
      }

      onChange(constrainedValue);
      onValueChange?.(constrainedValue);
    },
    [min, max, onValueChange]
  );

  /**
   * Handle blur event - format the value with currency symbol
   */
  const handleBlur = useCallback(
    (value: number) => {
      setIsFocused(false);

      if (value === 0 || isNaN(value)) {
        setDisplayValue('');
        return;
      }

      // Format with full currency notation on blur
      const formatted = formatCurrency(value);
      setDisplayValue(formatted);
    },
    []
  );

  /**
   * Handle focus event - remove currency symbol for easier editing
   */
  const handleFocus = useCallback((value: number) => {
    setIsFocused(true);

    if (value === 0 || isNaN(value)) {
      setDisplayValue('');
      return;
    }

    // Show just the number with commas when focused
    const formatted = formatCurrencyInput(value.toString());
    setDisplayValue(formatted);

    // Select all text on focus for easy replacement
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }, []);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(
    (onChange: (value: number) => void) => {
      setDisplayValue('');
      onChange(0);
      onValueChange?.(0);
      inputRef.current?.focus();
    },
    [onValueChange]
  );

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow Ctrl+A to select all
      if (e.ctrlKey && e.key === 'a') {
        return;
      }

      // Allow navigation keys
      const navigationKeys = [
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'Tab',
        'Backspace',
        'Delete',
      ];
      if (navigationKeys.includes(e.key)) {
        return;
      }

      // Allow decimal point (only one)
      if (e.key === '.' && !displayValue.includes('.')) {
        return;
      }

      // Allow digits
      if (/^\d$/.test(e.key)) {
        return;
      }

      // Prevent all other keys
      e.preventDefault();
    },
    [displayValue]
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value, ref } }) => {
        // Sync display value with form value
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (!isFocused) {
            const numValue = typeof value === 'number' ? value : 0;
            if (numValue === 0) {
              setDisplayValue('');
            } else {
              setDisplayValue(formatCurrency(numValue));
            }
          }
        }, [value, isFocused]);

        return (
          <div className={cn('grid gap-2', className)}>
            {/* Label */}
            {label && (
              <Label
                htmlFor={name}
                className={cn(
                  error && 'text-destructive',
                  required && "after:content-['*'] after:ml-0.5 after:text-destructive"
                )}
              >
                {label}
              </Label>
            )}

            {/* Input Container with Motion */}
            <motion.div
              className="relative"
              animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Peso Sign Prefix */}
              <motion.div
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                animate={isFocused ? { x: 1 } : { x: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <span
                  className={cn(
                    'text-muted-foreground text-sm font-medium select-none transition-colors duration-200',
                    isFocused && 'text-primary',
                    error && 'text-destructive',
                    disabled && 'opacity-50'
                  )}
                >
                  ₱
                </span>
              </motion.div>

              {/* Input Field */}
              <Input
                ref={(e) => {
                  ref(e);
                  (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }}
                id={name}
                type="text"
                inputMode="decimal"
                placeholder={placeholder}
                value={displayValue}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={
                  error ? `${name}-error` : helperText ? `${name}-helper` : undefined
                }
                className={cn(
                  'pl-8 pr-9 font-mono tabular-nums',
                  error && 'border-destructive ring-destructive/20',
                  disabled && 'cursor-not-allowed'
                )}
                onChange={(e) => handleInputChange(e.target.value, onChange)}
                onFocus={() => handleFocus(value || 0)}
                onBlur={() => {
                  handleBlur(value || 0);
                  onBlur();
                }}
                onKeyDown={handleKeyDown}
                {...inputProps}
              />

              {/* Clear Button with Animation */}
              <AnimatePresence>
                {showClearButton && displayValue && !disabled && (
                  <motion.button
                    type="button"
                    onClick={() => handleClear(onChange)}
                    className={cn(
                      'absolute inset-y-0 right-0 flex items-center pr-3',
                      'text-muted-foreground hover:text-foreground',
                      'transition-colors duration-200',
                      'focus:outline-none focus-visible:text-foreground'
                    )}
                    aria-label="Clear value"
                    tabIndex={-1}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Helper Text or Error Message */}
            {error ? (
              <p
                id={`${name}-error`}
                className="text-destructive text-sm font-medium"
                role="alert"
              >
                {error}
              </p>
            ) : helperText ? (
              <p
                id={`${name}-helper`}
                className="text-muted-foreground text-sm"
              >
                {helperText}
              </p>
            ) : null}

            {/* Value Range Indicator (if min/max set) */}
            {(min !== CURRENCY_CONSTANTS.MIN_VALUE ||
              max !== CURRENCY_CONSTANTS.MAX_VALUE) && (
              <p className="text-muted-foreground text-xs">
                Range: {formatCurrency(min)} - {formatCurrency(max)}
              </p>
            )}
          </div>
        );
      }}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
