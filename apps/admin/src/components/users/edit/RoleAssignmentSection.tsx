'use client';

import { Control, UseFormSetValue } from 'react-hook-form';
import { Shield, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import { EditUserFormValues } from '@/lib/schemas/edit-user';
import { ROLE_OPTIONS } from '@/lib/user-utils';

interface RoleAssignmentSectionProps {
  control: Control<EditUserFormValues>;
  setValue: UseFormSetValue<EditUserFormValues>;
  showCoAdminToggle: boolean;
  isCoAdmin: boolean;
}

export function RoleAssignmentSection({
  control,
  setValue,
  showCoAdminToggle,
  isCoAdmin,
}: RoleAssignmentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Role & Access</CardTitle>
        </div>
        <CardDescription>User permissions and admin portal access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Role */}
        <FormField
          control={control}
          name="baseRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Role *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-auto min-h-[2.75rem]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Determines the user&apos;s base permissions in the system
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Co-Admin Toggle - Only visible if user's office is HR */}
        {showCoAdminToggle && (
          <FormField
            control={control}
            name="isCoAdmin"
            render={({ field }) => (
              <FormItem
                className={`rounded-lg border p-4 transition-colors ${
                  field.value
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/40'
                    : 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base font-medium cursor-pointer text-slate-900 dark:text-slate-100">
                        Admin Portal Access
                      </FormLabel>
                      {field.value && (
                        <Badge variant="default" className="bg-emerald-600 text-white dark:bg-emerald-500">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Enabled
                        </Badge>
                      )}
                    </div>
                    <FormDescription className="text-sm text-slate-600 dark:text-slate-300">
                      {field.value
                        ? 'This user has full admin portal access'
                        : 'Grant admin portal access for HR management'
                      }
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                {field.value && (
                  <p className="mt-3 text-xs text-emerald-800 dark:text-emerald-200 border-t border-emerald-300 dark:border-emerald-700 pt-3">
                    Co-Admin users can manage employees, review submissions, and access all admin portal features.
                  </p>
                )}
              </FormItem>
            )}
          />
        )}

        {/* Message when Co-Admin toggle is hidden */}
        {!showCoAdminToggle && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-100 p-4 dark:border-slate-600 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Shield className="h-4 w-4" />
              <p className="text-sm font-medium">
                Admin Portal access is only available for users assigned to Human Resource offices.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
