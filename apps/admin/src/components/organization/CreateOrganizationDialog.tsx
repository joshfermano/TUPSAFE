/**
 * Create Organization Dialog Component
 *
 * Multi-step dialog for creating colleges, departments, or offices.
 * Steps: Type Selection → Basic Information → Review & Confirm
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, FolderTree, Users, ArrowRight, ArrowLeft, Check } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  useCreateCollege,
  useCreateDepartment,
  useCreateOffice,
  useOrganizations,
} from '@/hooks/useOrganization';
import type {
  CreateCollegeInput,
  CreateDepartmentInput,
  CreateOfficeInput,
} from '@tupsafe/types';

interface CreateOrganizationDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void;
}

type OrganizationType = 'college' | 'department' | 'office';

// Step 1: Type Selection Schema
const typeSelectionSchema = z.object({
  type: z.enum(['college', 'department', 'office'], {
    required_error: 'Please select an organization type',
  }),
});

// Step 2: Basic Information Schema (varies by type)
const basicInfoSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  code: z
    .string({ required_error: 'Code is required' })
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .trim()
    .transform((val) => val.toUpperCase()),
  parentCollegeId: z.string().uuid().optional(),
});

type TypeSelectionData = z.infer<typeof typeSelectionSchema>;
type BasicInfoData = z.infer<typeof basicInfoSchema>;

/**
 * Multi-step organization creation dialog
 */
export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<OrganizationType | null>(null);

  // Mutations
  const createCollege = useCreateCollege();
  const createDepartment = useCreateDepartment();
  const createOffice = useCreateOffice();

  // Fetch colleges for department parent selection
  const { data: orgsData } = useOrganizations({ type: 'college' });
  const colleges = orgsData?.colleges || [];

  // Forms for each step
  const typeForm = useForm<TypeSelectionData>({
    resolver: zodResolver(typeSelectionSchema),
  });

  const infoForm = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      code: '',
      parentCollegeId: undefined,
    },
  });;

  const isCreating =
    createCollege.isPending || createDepartment.isPending || createOffice.isPending;

  // Reset forms when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1);
      setSelectedType(null);
      typeForm.reset();
      infoForm.reset();
    }
    onOpenChange(newOpen);
  };

  // Step 1: Type Selection
  const handleTypeNext = typeForm.handleSubmit((data) => {
    setSelectedType(data.type);
    setStep(2);
  });

  // Step 2: Basic Information
  const handleInfoNext = infoForm.handleSubmit(() => {
    setStep(3);
  });

  // Step 3: Review & Confirm
  const handleCreate = async () => {
    const infoData = infoForm.getValues();

    try {
      if (selectedType === 'college') {
        const data: CreateCollegeInput = {
          name: infoData.name,
          code: infoData.code,
        };
        await createCollege.mutateAsync(data);
      } else if (selectedType === 'department') {
        if (!infoData.parentCollegeId) {
          infoForm.setError('parentCollegeId', {
            message: 'Parent college is required for departments',
          });
          setStep(2);
          return;
        }
        const data: CreateDepartmentInput = {
          name: infoData.name,
          code: infoData.code,
          parentCollegeId: infoData.parentCollegeId,
        };
        await createDepartment.mutateAsync(data);
      } else if (selectedType === 'office') {
        const data: CreateOfficeInput = {
          name: infoData.name,
          code: infoData.code,
        };
        await createOffice.mutateAsync(data);
      }

      handleOpenChange(false);
    } catch (error) {
      // Error handling is done in mutation hooks
      console.error('Failed to create organization:', error);
    }
  };

  const organizationTypes = [
    {
      type: 'college' as const,
      icon: Building2,
      label: 'College',
      description: 'Top-level academic unit with multiple departments',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      selectedBorder: 'border-blue-500',
    },
    {
      type: 'department' as const,
      icon: FolderTree,
      label: 'Department',
      description: 'Academic unit within a college',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      selectedBorder: 'border-emerald-500',
    },
    {
      type: 'office' as const,
      icon: Users,
      label: 'Office',
      description: 'Administrative or support unit',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      selectedBorder: 'border-purple-500',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Type Selection' : step === 2 ? 'Basic Information' : 'Review & Confirm'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <Form {...typeForm}>
            <form onSubmit={handleTypeNext} className="space-y-4">
              <FormField
                control={typeForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select Organization Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {organizationTypes.map((orgType) => {
                          const Icon = orgType.icon;
                          const isSelected = field.value === orgType.type;
                          return (
                            <FormItem key={orgType.type}>
                              <FormControl>
                                <RadioGroupItem
                                  value={orgType.type}
                                  id={orgType.type}
                                  className="sr-only"
                                />
                              </FormControl>
                              <FormLabel htmlFor={orgType.type} className="cursor-pointer">
                                <Card
                                  className={`
                                    transition-all duration-200
                                    ${isSelected 
                                      ? `${orgType.selectedBorder} border-2 bg-muted/30 shadow-sm` 
                                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'
                                    }
                                  `}
                                >
                                  <CardContent className="flex items-center gap-4 p-4">
                                    <div className={`rounded-lg ${orgType.bgColor} p-2.5`}>
                                      <Icon className={`h-5 w-5 ${orgType.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{orgType.label}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {orgType.description}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </FormLabel>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* Step 2: Basic Information */}
        {step === 2 && (
          <Form {...infoForm}>
            <form onSubmit={handleInfoNext} className="space-y-4">
              <FormField
                control={infoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., College of Engineering" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full name of the {selectedType}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={infoForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., COE"
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique code/abbreviation (letters, numbers, hyphens only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedType === 'department' && (
                <FormField
                  control={infoForm.control}
                  name="parentCollegeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent College</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isCreating}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={isCreating}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                  <Badge className="mt-1 capitalize">{selectedType}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                  <p className="mt-1 font-medium">{infoForm.getValues('name')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Code</h4>
                  <p className="mt-1 font-mono font-medium">{infoForm.getValues('code')}</p>
                </div>
                {selectedType === 'department' && infoForm.getValues('parentCollegeId') && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Parent College</h4>
                    <p className="mt-1 font-medium">
                      {colleges.find((c) => c.id === infoForm.getValues('parentCollegeId'))?.name || 'Loading...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isCreating}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
