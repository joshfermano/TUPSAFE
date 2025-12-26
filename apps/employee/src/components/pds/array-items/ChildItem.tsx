import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';
import { formatDateForInput, parseDateFromInput } from '../../../lib/utils/date-utils';

interface ChildItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export const ChildItem = memo(({ index, onRemove }: ChildItemProps) => {
  const form = useFormContext<CompletePdsData>();

  return (
    <div className="flex gap-4 items-start p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
        {index + 1}
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`family.children.${index}.fullName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Juan Dela Cruz Jr."
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
          name={`family.children.${index}.dateOfBirth`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date of Birth <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={formatDateForInput(field.value as Date | null)}
                  onChange={(e) => {
                    field.onChange(parseDateFromInput(e.target.value));
                  }}
                  className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="shrink-0 text-muted-foreground hover:text-destructive">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
});

ChildItem.displayName = 'ChildItem';
