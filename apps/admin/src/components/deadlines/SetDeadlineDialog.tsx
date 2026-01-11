/**
 * Set Deadline Dialog Component
 *
 * Modal form for creating or editing submission deadlines.
 * Supports date selection and configurable reminder days.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { useCreateDeadline, useUpdateDeadline } from '@/hooks/useDeadlines';
import type { FormType, DeadlineDetailResponse } from '@/lib/api/deadlines';
import { cn } from '@/lib/utils';

interface SetDeadlineDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Form type for the deadline */
  formType: FormType;
  /** Existing deadline for editing (null for creating new) */
  existingDeadline?: DeadlineDetailResponse | null;
  /** Default year for new deadlines */
  defaultYear?: number;
}

// Validation schema for deadline form
const deadlineFormSchema = z.object({
  year: z
    .number()
    .int()
    .min(2020, 'Year must be 2020 or later')
    .max(2100, 'Year must be before 2100'),
  deadlineDate: z.date({
    required_error: 'Please select a deadline date',
  }),
  reminderDays: z.object({
    day30: z.boolean(),
    day15: z.boolean(),
    day7: z.boolean(),
    day3: z.boolean(),
    day1: z.boolean(),
  }),
});

type DeadlineFormValues = z.infer<typeof deadlineFormSchema>;

// Available reminder day options
const REMINDER_OPTIONS = [
  { key: 'day30' as const, days: 30, label: '30 days before' },
  { key: 'day15' as const, days: 15, label: '15 days before' },
  { key: 'day7' as const, days: 7, label: '7 days before' },
  { key: 'day3' as const, days: 3, label: '3 days before' },
  { key: 'day1' as const, days: 1, label: '1 day before' },
];

/**
 * Convert reminder days array to form checkbox state
 */
function reminderDaysToCheckboxes(days: number[] | undefined): DeadlineFormValues['reminderDays'] {
  const daysSet = new Set(days || []);
  return {
    day30: daysSet.has(30),
    day15: daysSet.has(15),
    day7: daysSet.has(7),
    day3: daysSet.has(3),
    day1: daysSet.has(1),
  };
}

/**
 * Convert form checkbox state to reminder days array
 */
function checkboxesToReminderDays(checkboxes: DeadlineFormValues['reminderDays']): number[] {
  const days: number[] = [];
  if (checkboxes.day30) days.push(30);
  if (checkboxes.day15) days.push(15);
  if (checkboxes.day7) days.push(7);
  if (checkboxes.day3) days.push(3);
  if (checkboxes.day1) days.push(1);
  return days;
}

export function SetDeadlineDialog({
  open,
  onOpenChange,
  formType,
  existingDeadline,
  defaultYear = new Date().getFullYear(),
}: SetDeadlineDialogProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isEditing = !!existingDeadline;
  const formTypeLabel = formType.toUpperCase();

  const createDeadline = useCreateDeadline();
  const updateDeadline = useUpdateDeadline();

  const isSubmitting = createDeadline.isPending || updateDeadline.isPending;

  const form = useForm<DeadlineFormValues>({
    resolver: zodResolver(deadlineFormSchema),
    defaultValues: {
      year: defaultYear,
      deadlineDate: undefined,
      reminderDays: {
        day30: true,
        day15: true,
        day7: true,
        day3: false,
        day1: false,
      },
    },
  });

  // Reset form when dialog opens or existingDeadline changes
  useEffect(() => {
    if (open) {
      if (existingDeadline) {
        form.reset({
          year: existingDeadline.year,
          deadlineDate: parseISO(existingDeadline.deadlineDate),
          reminderDays: reminderDaysToCheckboxes(existingDeadline.reminderDaysBefore),
        });
      } else {
        form.reset({
          year: defaultYear,
          deadlineDate: undefined,
          reminderDays: {
            day30: true,
            day15: true,
            day7: true,
            day3: false,
            day1: false,
          },
        });
      }
    }
  }, [open, existingDeadline, defaultYear, form]);

  const handleSubmit = useCallback(
    async (values: DeadlineFormValues) => {
      const reminderDaysBefore = checkboxesToReminderDays(values.reminderDays);
      const deadlineDateStr = format(values.deadlineDate, 'yyyy-MM-dd');

      try {
        if (isEditing && existingDeadline) {
          await updateDeadline.mutateAsync({
            id: existingDeadline.id,
            data: {
              deadlineDate: deadlineDateStr,
              reminderDaysBefore,
            },
          });
        } else {
          await createDeadline.mutateAsync({
            formType,
            year: values.year,
            deadlineDate: deadlineDateStr,
            reminderDaysBefore,
            isActive: true,
          });
        }
        onOpenChange(false);
      } catch {
        // Error handling is done in the mutation hooks
      }
    },
    [isEditing, existingDeadline, formType, createDeadline, updateDeadline, onOpenChange]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  }, [isSubmitting, onOpenChange]);

  const selectedDate = form.watch('deadlineDate');
  const reminderDays = form.watch('reminderDays');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit' : 'Set'} {formTypeLabel} Deadline
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the submission deadline for ${formTypeLabel} ${existingDeadline?.year}.`
              : `Set the submission deadline for ${formTypeLabel} compliance.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Year Input - Only shown when creating new deadline */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min={2020}
                max={2100}
                {...form.register('year', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="w-32"
              />
              {form.formState.errors.year && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.year.message}
                </p>
              )}
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Deadline Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'MMMM d, yyyy')
                  ) : (
                    <span>Select deadline date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      form.setValue('deadlineDate', date, { shouldValidate: true });
                      setIsCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => {
                    // Optionally disable past dates for new deadlines
                    if (!isEditing) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.deadlineDate && (
              <p className="text-sm text-destructive">
                {form.formState.errors.deadlineDate.message}
              </p>
            )}
          </div>

          {/* Reminder Days Checkboxes */}
          <div className="space-y-3">
            <Label>Reminder Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Select when to send reminder notifications to employees.
            </p>
            <div className="space-y-3 rounded-lg border p-4">
              {REMINDER_OPTIONS.map((option) => (
                <div key={option.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.key}
                    checked={reminderDays[option.key]}
                    onCheckedChange={(checked) => {
                      form.setValue(`reminderDays.${option.key}`, !!checked);
                    }}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={option.key}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-2 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="border-2 border-primary/60 hover:border-primary/80 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Deadline'
              ) : (
                'Set Deadline'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
