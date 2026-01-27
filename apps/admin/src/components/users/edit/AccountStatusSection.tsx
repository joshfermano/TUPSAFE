'use client';

import { Control } from 'react-hook-form';
import { UserCheck, UserX } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { EditUserFormValues } from '@/lib/schemas/edit-user';

interface AccountStatusSectionProps {
  control: Control<EditUserFormValues>;
  isActive: boolean;
}

export function AccountStatusSection({
  control,
  isActive,
}: AccountStatusSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isActive ? (
            <UserCheck className="h-5 w-5 text-green-600" />
          ) : (
            <UserX className="h-5 w-5 text-red-600" />
          )}
          <CardTitle>Account Status</CardTitle>
        </div>
        <CardDescription>Manage user account access</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="active-toggle" className="text-base font-medium">
                    Active Status
                  </Label>
                  <FormDescription>
                    {field.value
                      ? 'User can log in and access the system'
                      : 'User is blocked from logging in'}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    id="active-toggle"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
