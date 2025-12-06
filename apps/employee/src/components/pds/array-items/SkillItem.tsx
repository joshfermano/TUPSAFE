import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { FormField, FormItem, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';

interface SkillItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export const SkillItem = memo(({ index, onRemove }: SkillItemProps) => {
  const form = useFormContext<Partial<CompletePdsData>>();

  return (
    <div className="flex gap-3">
      <FormField
        control={form.control}
        name={`otherInfo.skills.${index}`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                placeholder="e.g., Public Speaking"
                {...field}
                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="text-muted-foreground hover:text-destructive">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
});

SkillItem.displayName = 'SkillItem';
