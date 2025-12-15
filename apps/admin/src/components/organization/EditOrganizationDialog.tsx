/**
 * Edit Organization Dialog Component
 *
 * Dialog for editing existing colleges, departments, or offices.
 * Allows updating name, code (disabled), active status, and parent college (for departments).
 */

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  useOrganizationDetail,
  useUpdateOrganization,
  useOrganizations,
} from '@/hooks/useOrganization';
import type { UpdateDepartmentInput } from '@tupsafe/types';

interface EditOrganizationDialogProps {
  /**
   * ID of the organization to edit
   */
  organizationId: string | null;

  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void;
}

// Validation schema for editing
const editSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  isActive: z.boolean(),
  parentCollegeId: z.string().uuid().nullable().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

/**
 * Dialog for editing organizational units
 */
export function EditOrganizationDialog({
  organizationId,
  open,
  onOpenChange,
}: EditOrganizationDialogProps) {
  const { data: organization, isLoading } = useOrganizationDetail(organizationId);
  const updateOrg = useUpdateOrganization();
  const { data: orgsData } = useOrganizations({ type: 'college' });
  const colleges = orgsData?.colleges || [];

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      isActive: true,
      parentCollegeId: null,
    },
  });

  // Update form when organization data loads
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        isActive: organization.isActive,
        parentCollegeId: organization.parentCollegeId || null,
      });
    }
  }, [organization, form]);

  const isDepartment =
    organization?.officeType === 'academic' && organization?.parentCollegeId;

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!organizationId) return;

    try {
      const updateData: UpdateDepartmentInput = {
        name: data.name,
        isActive: data.isActive,
      };

      // Only include parentCollegeId for departments
      if (isDepartment) {
        updateData.parentCollegeId = data.parentCollegeId;
      }

      await updateOrg.mutateAsync({ id: organizationId, data: updateData });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in mutation hook
      console.error('Failed to update organization:', error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update the organization information. Code cannot be changed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display code (non-editable) */}
              {organization && (
                <div>
                  <label className="text-sm font-medium">Code</label>
                  <div className="mt-1.5">
                    <Badge variant="outline" className="font-mono">
                      {organization.code}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Codes cannot be changed after creation
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Organization name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full name of the organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isDepartment && (
                <FormField
                  control={form.control}
                  name="parentCollegeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent College</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges.map((college) => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name} ({college.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The college this department belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive organizations are hidden from most views
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateOrg.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOrg.isPending}>
                  {updateOrg.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
