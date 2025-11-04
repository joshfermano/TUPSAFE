'use client';

import { memo } from 'react';
import { Heart, BookOpen, Plus, X } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormSection } from '@/components/forms/shared/FormSection';
import { type CompletePdsData } from '@/lib/validations/pds-schema';

/**
 * Step 7: Voluntary Work & Learning Development
 */
export const VoluntaryTraining = memo(function VoluntaryTraining() {
  const form = useFormContext<CompletePdsData>();

  const { fields: voluntaryFields, append: appendVoluntary, remove: removeVoluntary } = useFieldArray({
    control: form.control,
    name: 'voluntaryWork',
  });

  const { fields: trainingFields, append: appendTraining, remove: removeTraining } = useFieldArray({
    control: form.control,
    name: 'learningDevelopment',
  });

  return (
    <FormSection
      title="Voluntary Work & Training"
      description="Voluntary work involvement and learning and development interventions"
      icon={Heart}
      stepNumber={7}
    >
      <div className="space-y-8">
        {/* Voluntary Work */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Voluntary Work or Involvement
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendVoluntary({
                organizationName: '',
                organizationAddress: '',
                dateFrom: new Date(),
                dateTo: null,
                numberOfHours: null,
                positionNature: '',
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Voluntary Work
            </Button>
          </div>

          {voluntaryFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No voluntary work added yet
            </div>
          ) : (
            <div className="space-y-4">
              {voluntaryFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border border-border space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">Voluntary Work #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVoluntary(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`voluntaryWork.${index}.organizationName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Red Cross Philippines" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Learning & Development */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Learning and Development Interventions
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendTraining({
                title: '',
                dateFrom: new Date(),
                dateTo: new Date(),
                hours: null,
                typeOfLd: '',
                conductedBy: '',
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Training
            </Button>
          </div>

          {trainingFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No learning and development interventions added yet
            </div>
          ) : (
            <div className="space-y-4">
              {trainingFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border border-border space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">Training #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTraining(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`learningDevelopment.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title of Training/Seminar</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Advanced Teaching Methodologies" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
});
