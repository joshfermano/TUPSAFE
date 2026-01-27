'use client';

import { Control } from 'react-hook-form';
import { Building2, Info } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { EditUserFormValues } from '@/lib/schemas/edit-user';
import { SALARY_GRADE_OPTIONS } from '@/lib/user-utils';

interface OrganizationOption {
  value: string;
  label: string;
  isHR?: boolean;
  isActive?: boolean;
}

interface PositionOption {
  id: string;
  title: string;
  isActive?: boolean;
}

interface OrganizationSectionProps {
  control: Control<EditUserFormValues>;
  collegeOptions: OrganizationOption[];
  departmentOptions: OrganizationOption[];
  positionOptions: PositionOption[];
  isLoading: boolean;
  selectedCollegeIsHR: boolean;
  selectedCollegeHasNoDepartments: boolean;
}

export function OrganizationSection({
  control,
  collegeOptions,
  departmentOptions,
  positionOptions,
  isLoading,
  selectedCollegeIsHR,
  selectedCollegeHasNoDepartments,
}: OrganizationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Organization & Position</CardTitle>
        </div>
        <CardDescription>Department assignment and job details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* College/Office */}
        <FormField
          control={control}
          name="collegeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College / Office</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={isLoading ? 'Loading...' : 'Select college or office'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {collegeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-2.5">
                      <span>{option.label}</span>
                      {option.isHR && (
                        <span className="ml-2 text-xs font-medium text-primary">(HR)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select a college or administrative office
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Info message for offices without departments */}
        {selectedCollegeHasNoDepartments && !selectedCollegeIsHR && (
          <Alert className="border-sky-400 bg-sky-100 dark:border-sky-600 dark:bg-sky-900/60">
            <Info className="h-4 w-4 text-sky-800 dark:text-sky-200" />
            <AlertDescription className="text-sky-900 dark:text-sky-100 font-medium">
              This office has no sub-departments. The user will be assigned directly to the office.
            </AlertDescription>
          </Alert>
        )}

        {/* HR Office message */}
        {selectedCollegeIsHR && (
          <Alert className="border-emerald-400 bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/60">
            <Info className="h-4 w-4 text-emerald-800 dark:text-emerald-200" />
            <AlertDescription className="text-emerald-900 dark:text-emerald-100 font-medium">
              HR office selected. Department selection is optional.
            </AlertDescription>
          </Alert>
        )}

        {/* Department */}
        <FormField
          control={control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Department
                {(selectedCollegeIsHR || selectedCollegeHasNoDepartments) && (
                  <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
                )}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading || selectedCollegeHasNoDepartments}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={
                      selectedCollegeHasNoDepartments
                        ? 'No departments available'
                        : isLoading
                          ? 'Loading...'
                          : 'Select department'
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-2.5">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Departments under the selected college/office
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Position and Salary Grade - 2 column grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Position */}
          <FormField
            control={control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none" className="py-2.5">None</SelectItem>
                    {positionOptions.map((position) => (
                      <SelectItem key={position.id} value={position.id} className="py-2.5">
                        {position.title}
                        {position.isActive === false && (
                          <span className="ml-2 text-xs text-muted-foreground">[Inactive]</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Salary Grade */}
          <FormField
            control={control}
            name="salaryGrade"
            render={({ field }) => {
              const selectValue = field.value !== null && field.value !== undefined
                ? field.value.toString()
                : 'none';

              return (
                <FormItem>
                  <FormLabel>Salary Grade</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const numValue = value === 'none' ? null : parseInt(value, 10);
                      field.onChange(numValue);
                    }}
                    value={selectValue}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {SALARY_GRADE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="py-2">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Philippine SSL V (1-33)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Position Title (custom) */}
        <FormField
          control={control}
          name="positionTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Position Title
                <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Associate Professor III"
                  className="h-10"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Custom position title for display purposes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
