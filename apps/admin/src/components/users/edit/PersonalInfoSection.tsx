'use client';

import { Control } from 'react-hook-form';
import { User, Lock, LockOpen } from 'lucide-react';

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
import { Button } from '@/components/ui/button';

import { EditUserFormValues } from '@/lib/schemas/edit-user';
import { SUFFIX_OPTIONS } from '@/lib/user-utils';

interface PersonalInfoSectionProps {
  control: Control<EditUserFormValues>;
  employeeId?: string | null;
  isEmailLocked: boolean;
  onToggleEmailLock: () => void;
}

export function PersonalInfoSection({
  control,
  employeeId,
  isEmailLocked,
  onToggleEmailLock,
}: PersonalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Personal Information</CardTitle>
        </div>
        <CardDescription>Basic identity and contact information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Name fields - 2 column grid on desktop */}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Dela Cruz" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Middle name and suffix - 2 column grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Middle Name
                  <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Santos" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="suffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suffix</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select suffix" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUFFIX_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-2.5">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Employee ID (read-only) */}
        <FormItem>
          <FormLabel>Employee ID</FormLabel>
          <Input
            value={employeeId || 'Not assigned'}
            disabled
            className="h-10 bg-muted cursor-not-allowed font-mono"
          />
          <FormDescription>
            Employee ID is system-generated and cannot be modified
          </FormDescription>
        </FormItem>

        {/* Email with lock/unlock */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Email Address *</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onToggleEmailLock}
                  className="h-7 gap-1.5 px-2.5 text-xs hover:bg-muted"
                >
                  {isEmailLocked ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <LockOpen className="h-3.5 w-3.5" />
                      Lock
                    </>
                  )}
                </Button>
              </div>
              <FormControl>
                <Input
                  type="email"
                  placeholder="juan.delacruz@tup.edu.ph"
                  disabled={isEmailLocked}
                  className={`h-10 ${isEmailLocked ? 'bg-muted cursor-not-allowed' : ''}`}
                  {...field}
                />
              </FormControl>
              {isEmailLocked && (
                <FormDescription className="text-xs">
                  Email is locked for security. Click &quot;Unlock&quot; to make changes.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
