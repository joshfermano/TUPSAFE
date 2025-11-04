'use client';

import { memo } from 'react';
import { GraduationCap } from 'lucide-react';
import { useFormContext, type FieldPath } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FormSection } from '@/components/forms/shared/FormSection';
import { type CompletePdsData } from '@/lib/validations/pds-schema';

/**
 * Step 5: Educational Background
 * Elementary, Secondary, Vocational, College, and Graduate Studies
 */
export const Education = memo(function Education() {
  const form = useFormContext<CompletePdsData>();

  const educationLevels = [
    { key: 'elementary', label: 'Elementary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'vocational', label: 'Vocational / Trade Course' },
    { key: 'college', label: 'College' },
    { key: 'graduate', label: 'Graduate Studies' },
  ];

  return (
    <FormSection
      title="Educational Background"
      description="List your educational attainment from elementary to graduate studies"
      icon={GraduationCap}
      stepNumber={5}
    >
      <div className="space-y-8">
        {educationLevels.map((level, index) => (
          <div key={level.key}>
            {index > 0 && <Separator className="mb-6" />}
            <h4 className="text-sm font-semibold text-foreground mb-4">{level.label}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`education.${level.key}.schoolName` as FieldPath<CompletePdsData>}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`e.g., ${level.key === 'elementary' ? 'Manila Elementary School' : level.key === 'secondary' ? 'Manila Science High School' : 'Technological University of the Philippines'}`}
                        {...field}
                        value={(field?.value as string) || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`education.${level.key}.degreeCourse` as FieldPath<CompletePdsData>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree / Course</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={level.key === 'college' ? 'e.g., BS Computer Science' : 'Leave blank if not applicable'}
                        {...field}
                        value={(field?.value as string) || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`education.${level.key}.yearGraduated` as FieldPath<CompletePdsData>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Graduated</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        placeholder="e.g., 2020"
                        {...field}
                        value={(field?.value as number) || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
});
