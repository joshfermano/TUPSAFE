import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';

interface ReferenceItemProps {
  index: number;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const ReferenceItem = memo(({ index, onRemove, canRemove }: ReferenceItemProps) => {
  const form = useFormContext<Partial<CompletePdsData>>();

  return (
    <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </div>
          <p className="text-sm font-medium">Reference #{index + 1}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="text-muted-foreground hover:text-destructive disabled:opacity-50">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name={`otherInfo.references.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Full Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Dr. Maria Santos"
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
          name={`otherInfo.references.${index}.telephoneNo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Telephone No. <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="+63-2-8123-4567 or 09171234567"
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
          name={`otherInfo.references.${index}.address`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>
                Address <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Complete address"
                  {...field}
                  className="resize-none bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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

ReferenceItem.displayName = 'ReferenceItem';
