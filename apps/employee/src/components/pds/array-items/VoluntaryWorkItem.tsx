import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';
import { formatDateForInput, parseDateFromInput } from '../../../lib/utils/date-utils';

interface VoluntaryWorkItemProps {
  index: number;
  onRemove: (index: number) => void;
  onDateBlur: () => void;
}

export const VoluntaryWorkItem = memo(({ index, onRemove, onDateBlur }: VoluntaryWorkItemProps) => {
  const form = useFormContext<CompletePdsData>();

  return (
    <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </div>
          <p className="text-sm font-medium">Voluntary Work #{index + 1}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name={`voluntaryWork.${index}.organizationName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Organization Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Red Cross Philippines"
                  {...field}
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`voluntaryWork.${index}.organizationAddress`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Manila, Philippines"
                  {...field}
                  value={field.value ?? ''}
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`voluntaryWork.${index}.dateFrom`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                From <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={formatDateForInput(field.value as Date | null)}
                  onChange={(e) => {
                    field.onChange(parseDateFromInput(e.target.value));
                  }}
                  onBlur={onDateBlur}
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`voluntaryWork.${index}.dateTo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>To (leave blank if ongoing)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={formatDateForInput(field.value as Date | null)}
                  onChange={(e) => {
                    field.onChange(parseDateFromInput(e.target.value));
                  }}
                  onBlur={onDateBlur}
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`voluntaryWork.${index}.numberOfHours`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 120"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`voluntaryWork.${index}.positionNature`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position / Nature of Work</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Volunteer Coordinator"
                  {...field}
                  value={field.value ?? ''}
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

VoluntaryWorkItem.displayName = 'VoluntaryWorkItem';
