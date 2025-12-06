import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';

interface AssociationItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export const AssociationItem = memo(({ index, onRemove }: AssociationItemProps) => {
  const form = useFormContext<Partial<CompletePdsData>>();

  return (
    <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </div>
          <p className="text-sm font-medium">Membership #{index + 1}</p>
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
          name={`otherInfo.associations.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Association / Organization Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Philippine Institute of Engineering"
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
          name={`otherInfo.associations.${index}.position`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position / Role (if any)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Member, Board Member"
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
          name={`otherInfo.associations.${index}.yearJoined`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year Joined</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2020"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                  }
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

AssociationItem.displayName = 'AssociationItem';
