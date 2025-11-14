'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface HireDateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function HireDateInput({
  value,
  onChange,
  error,
  disabled = false,
  className,
}: HireDateInputProps) {
  // Convert Date to YYYY-MM-DD format for input
  const [inputValue, setInputValue] = useState<string>('');

  // Update input value when prop value changes
  useEffect(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      setInputValue(`${year}-${month}-${day}`);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue) {
      const date = new Date(newValue + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        onChange(date);
      }
    } else {
      onChange(undefined);
    }
  };

  // Format display date
  const formatDisplayDate = (date: Date | undefined): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label htmlFor="hire-date" className="text-sm font-medium">
        Date of Appointment at TUP Manila *
      </Label>

      {/* Date Input Container */}
      <div className="relative">
        {/* Calendar Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </div>

        {/* Native Date Input */}
        <input
          id="hire-date"
          type="date"
          value={inputValue}
          onChange={handleChange}
          disabled={disabled}
          max={today}
          className={cn(
            'w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300',
            'bg-slate-50 dark:bg-slate-800',
            'text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-500 dark:placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538]',
            'hover:bg-white hover:border-[#8B1538]/40',
            'dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-600',
            // Custom styling for date input calendar icon
            '[&::-webkit-calendar-picker-indicator]:opacity-0',
            '[&::-webkit-calendar-picker-indicator]:absolute',
            '[&::-webkit-calendar-picker-indicator]:inset-0',
            '[&::-webkit-calendar-picker-indicator]:w-full',
            '[&::-webkit-calendar-picker-indicator]:h-full',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
          )}
          aria-describedby={error ? 'hire-date-error' : 'hire-date-description'}
          aria-invalid={!!error}
        />
      </div>

      {/* Display formatted date when value exists */}
      {value && !error && (
        <div className="flex items-center space-x-2 text-sm text-[#8B1538] dark:text-[#8B1538]/90">
          <svg
            className="h-4 w-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{formatDisplayDate(value)}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          id="hire-date-error"
          className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {!error && (
        <div
          id="hire-date-description"
          className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400"
        >
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              Enter the date you officially started working at TUP Manila.
            </p>
            <p className="text-slate-500 dark:text-slate-500">
              This will be used to generate your employee ID (TUPM-MMDD-YY-###).
            </p>
          </div>
        </div>
      )}

      {/* Info Box for Important Notice */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Important
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Please ensure this date matches your official appointment letter.
              This information will be verified by the Human Resources Office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
