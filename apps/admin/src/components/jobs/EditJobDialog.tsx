/**
 * Edit Job Dialog
 *
 * Multi-step form dialog for editing existing job positions
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Plus, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { updateOpenPositionSchema, type UpdateOpenPositionData, type OpenPositionDetail } from '@tupsafe/types';
import { useOpenPositionDetails } from '@/hooks/useJobsQuery';
import { useQuery } from '@tanstack/react-query';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface EditJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: OpenPositionDetail | null;
  positionId?: string | null;
  onSubmit: (data: UpdateOpenPositionData) => void;
  isLoading?: boolean;
}

export function EditJobDialog({
  open,
  onOpenChange,
  position: providedPosition,
  positionId,
  onSubmit,
  isLoading,
}: EditJobDialogProps) {
  // Fetch position details if only ID is provided
  const { data: fetchedPosition, isLoading: isFetchingPosition } = useOpenPositionDetails(
    positionId && !providedPosition ? positionId : null
  );

  // Use provided position or fetched position
  const position = providedPosition || fetchedPosition;
  const [activeTab, setActiveTab] = useState('basic');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');

  // Fetch departments from API
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery<{
    departments: Department[];
  }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const departments = departmentsData?.departments || [];

  const form = useForm<UpdateOpenPositionData>({
    resolver: zodResolver(updateOpenPositionSchema),
    defaultValues: {
      positionTitle: '',
      departmentId: '',
      employmentCategory: 'faculty',
      description: '',
      qualifications: [],
      responsibilities: [],
      requirements: {
        education: [],
        experience: [],
        skills: [],
      },
      salaryGrade: '',
      salaryRangeMin: undefined,
      salaryRangeMax: undefined,
      employmentType: '',
      status: 'open',
      numberOfOpenings: 1,
      isFeatured: false,
    },
  });

  // Update form when position data is loaded
  useEffect(() => {
    if (position) {
      form.reset({
        positionTitle: position.positionTitle,
        departmentId: position.department?.id || '',
        employmentCategory: position.employmentCategory as 'faculty' | 'administrative' | 'contractual' | 'not_applicable',
        description: position.description,
        salaryGrade: position.salaryGrade || '',
        salaryRangeMin: position.salaryRangeMin ?? undefined,
        salaryRangeMax: position.salaryRangeMax ?? undefined,
        employmentType: position.employmentType || '',
        status: position.status,
        applicationDeadline: position.applicationDeadline,
        numberOfOpenings: position.numberOfOpenings,
        isFeatured: position.isFeatured || false,
      });
      setQualifications(position.qualifications || []);
      setResponsibilities(position.responsibilities || []);
    }
  }, [position, form]);

  const handleSubmit = (data: UpdateOpenPositionData) => {
    onSubmit({
      ...data,
      qualifications,
      responsibilities,
    });
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setQualifications([...qualifications, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility('');
    }
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  // Show loading state when position data is being fetched
  if (!position || isFetchingPosition) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Position</DialogTitle>
          <DialogDescription>
            Update the position details. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="positionTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Assistant Professor - Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              {isLoadingDepartments ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Select department" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employmentCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="administrative">Administrative</SelectItem>
                            <SelectItem value="contractual">Contractual</SelectItem>
                            <SelectItem value="not_applicable">Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the position..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <FormLabel>Qualifications</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a qualification..."
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                    />
                    <Button type="button" onClick={addQualification} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {qualifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {qualifications.map((qual, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {qual}
                          <button
                            type="button"
                            onClick={() => removeQualification(index)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <FormLabel>Responsibilities</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a responsibility..."
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                    />
                    <Button type="button" onClick={addResponsibility} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {responsibilities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {responsibilities.map((resp, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {resp}
                          <button
                            type="button"
                            onClick={() => removeResponsibility(index)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Grade</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., SG-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Full-time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryRangeMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salaryRangeMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Salary</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="applicationDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfOpenings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Openings</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Position</FormLabel>
                        <FormDescription>
                          Featured positions appear at the top of the job listings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
