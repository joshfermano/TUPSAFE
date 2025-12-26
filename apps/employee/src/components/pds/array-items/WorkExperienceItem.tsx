import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';
import { formatDateForInput, parseDateFromInput } from '../../../lib/utils/date-utils';

interface WorkExperienceItemProps {
  index: number;
  onRemove: (index: number) => void;
  onDateBlur: () => void;
}

export const WorkExperienceItem = memo(({ index, onRemove, onDateBlur }: WorkExperienceItemProps) => {
  const form = useFormContext<CompletePdsData>();

  return (
    <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </div>
          <p className="text-sm font-medium">Work Experience #{index + 1}</p>
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
          name={`workExperience.${index}.dateFrom`}
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
          name={`workExperience.${index}.dateTo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>To (leave blank if present)</FormLabel>
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
          name={`workExperience.${index}.positionTitle`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Position Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Professor"
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
          name={`workExperience.${index}.departmentAgency`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Department / Agency <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., TUP Manila"
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
          name={`workExperience.${index}.monthlySalary`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Salary (PHP)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 45000.00"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
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
          name={`workExperience.${index}.salaryGrade`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Grade/Step (if gov&apos;t)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., SG-24 Step 1"
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
          name={`workExperience.${index}.statusOfAppointment`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status of Appointment</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                  <SelectItem value="Contractual">Contractual</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Co-terminus">Co-terminus</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`workExperience.${index}.isGovernment`}
          render={({ field }) => (
            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border border-slate-200 dark:border-slate-800 p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                Government Service (Y/N)
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

WorkExperienceItem.displayName = 'WorkExperienceItem';
