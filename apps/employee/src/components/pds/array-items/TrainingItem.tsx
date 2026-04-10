import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X, Paperclip } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { type CompletePdsData } from '../../../lib/validations/pds-schema';
import { FormDateInput } from '../../forms/shared/FormDateInput';
import { usePdsContextSafe } from '../../../context/PdsContext';
import { EntryAttachments } from '../EntryAttachments';

interface TrainingItemProps {
  index: number;
  onRemove: (index: number) => void;
  onDateBlur: () => void;
}

export const TrainingItem = memo(({ index, onRemove, onDateBlur }: TrainingItemProps) => {
  const form = useFormContext<CompletePdsData>();
  const pdsContext = usePdsContextSafe();

  return (
    <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {index + 1}
          </div>
          <p className="text-sm font-medium">Training #{index + 1}</p>
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

      <FormField
        control={form.control}
        name={`learningDevelopment.${index}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Title of Training/Seminar <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Advanced Teaching Methodologies"
                {...field}
                className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormDateInput
          control={form.control}
          name={`learningDevelopment.${index}.dateFrom`}
          label="From"
          required
          onBlur={onDateBlur}
        />

        <FormDateInput
          control={form.control}
          name={`learningDevelopment.${index}.dateTo`}
          label="To"
          required
          onBlur={onDateBlur}
        />

        <FormField
          control={form.control}
          name={`learningDevelopment.${index}.hours`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 40"
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
          name={`learningDevelopment.${index}.typeOfLd`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of L&D</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Managerial">Managerial</SelectItem>
                  <SelectItem value="Supervisory">Supervisory</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`learningDevelopment.${index}.conductedBy`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Conducted / Sponsored By</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., CHED"
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

      {/* Attachments Section */}
      {pdsContext && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Attachments
            </span>
            <span className="text-xs text-muted-foreground">
              (certificates, seminar proofs, etc.)
            </span>
          </div>
          <EntryAttachments
            pdsSubmissionId={pdsContext.pdsSubmissionId}
            entryId={form.getValues(`learningDevelopment.${index}.id`) || null}
            entryType="training"
            attachments={pdsContext.getTrainingAttachments(
              form.getValues(`learningDevelopment.${index}.id`)
            )}
            canEdit={pdsContext.canEdit}
            onAttachmentsChange={(attachments) => {
              const entryId = form.getValues(`learningDevelopment.${index}.id`);
              if (entryId) {
                pdsContext.updateTrainingAttachments(entryId, attachments);
              }
            }}
            onBeforeUpload={pdsContext.onBeforeUpload}
          />
        </div>
      )}
    </div>
  );
});

TrainingItem.displayName = 'TrainingItem';
