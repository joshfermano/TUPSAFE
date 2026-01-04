/**
 * Create Job Position - Multi-Step Wizard
 *
 * Premium, modern multi-step form for creating new job positions.
 * Features:
 * - 4-step wizard with validation
 * - Progress indicator with circles and bar
 * - Badge-based array inputs
 * - Date picker for deadline
 * - Success screen with navigation
 * - Responsive design
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Briefcase,
  FileText,
  ClipboardList,
  Settings,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Star,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';
import {
  createOpenPositionSchema,
  type CreateOpenPositionData,
} from '@tupsafe/types';
import type { z } from 'zod';

// Use the input type for form values (allows undefined for defaulted fields)
type CreateOpenPositionFormValues = z.input<typeof createOpenPositionSchema>;

interface Department {
  id: string;
  name: string;
  code: string;
}

interface College {
  id: string;
  name: string;
  code: string;
}

interface AdministrativeOffice {
  id: string;
  name: string;
  code: string;
}

// Step configuration
const STEPS = [
  {
    number: 1,
    label: 'Basic Info',
    icon: Briefcase,
    description: 'Position details',
  },
  {
    number: 2,
    label: 'Details',
    icon: FileText,
    description: 'Qualifications & responsibilities',
  },
  {
    number: 3,
    label: 'Requirements',
    icon: ClipboardList,
    description: 'Education, experience & skills',
  },
  {
    number: 4,
    label: 'Settings',
    icon: Settings,
    description: 'Final settings & review',
  },
];

const TOTAL_STEPS = STEPS.length;

export default function CreateJobPage() {
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [createdPositionId, setCreatedPositionId] = useState<string | null>(
    null
  );
  const [isCreated, setIsCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Department selection state
  const [officeType, setOfficeType] = useState<'college' | 'administrative'>(
    'college'
  );
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  // Badge arrays state
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [educationRequirements, setEducationRequirements] = useState<string[]>(
    []
  );
  const [experienceRequirements, setExperienceRequirements] = useState<
    string[]
  >([]);
  const [skillsRequirements, setSkillsRequirements] = useState<string[]>([]);

  // Temporary input states
  const [newQualification, setNewQualification] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Fetch colleges
  const { data: collegesData, isLoading: isLoadingColleges } = useQuery<{
    colleges: College[];
  }>({
    queryKey: ['colleges'],
    queryFn: async () => {
      const response = await fetch('/api/departments/colleges');
      if (!response.ok) {
        throw new Error('Failed to fetch colleges');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const colleges = collegesData?.colleges || [];

  // Fetch administrative offices
  const { data: administrativeData, isLoading: isLoadingAdministrative } =
    useQuery<{
      offices: AdministrativeOffice[];
    }>({
      queryKey: ['administrative-offices'],
      queryFn: async () => {
        const response = await fetch('/api/departments/administrative');
        if (!response.ok) {
          throw new Error('Failed to fetch administrative offices');
        }
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });

  const administrativeOffices = administrativeData?.offices || [];

  // Fetch departments under selected college
  const { data: collegeDepartmentsData, isLoading: isLoadingCollegeDepartments } =
    useQuery<{
      departments: Department[];
      collegeId: string;
    }>({
      queryKey: ['college-departments', selectedCollegeId],
      queryFn: async () => {
        const response = await fetch(
          `/api/departments/college/${selectedCollegeId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch college departments');
        }
        return response.json();
      },
      enabled: !!selectedCollegeId && officeType === 'college',
      staleTime: 5 * 60 * 1000,
    });

  const collegeDepartments = collegeDepartmentsData?.departments || [];

  // Form
  const form = useForm<CreateOpenPositionFormValues>({
    resolver: zodResolver(createOpenPositionSchema),
    defaultValues: {
      positionTitle: '',
      positionCode: '',
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
      numberOfOpenings: 1,
      isFeatured: false,
    },
  });

  const { watch, formState, trigger } = form;
  const { dirtyFields } = formState;
  const hasUnsavedChanges = Object.keys(dirtyFields).length > 0 && !isCreated;

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  // Badge helpers
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

  const addEducation = () => {
    if (newEducation.trim()) {
      setEducationRequirements([...educationRequirements, newEducation.trim()]);
      setNewEducation('');
    }
  };

  const removeEducation = (index: number) => {
    setEducationRequirements(
      educationRequirements.filter((_, i) => i !== index)
    );
  };

  const addExperience = () => {
    if (newExperience.trim()) {
      setExperienceRequirements([
        ...experienceRequirements,
        newExperience.trim(),
      ]);
      setNewExperience('');
    }
  };

  const removeExperience = (index: number) => {
    setExperienceRequirements(
      experienceRequirements.filter((_, i) => i !== index)
    );
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkillsRequirements([...skillsRequirements, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setSkillsRequirements(skillsRequirements.filter((_, i) => i !== index));
  };

  // Validation per step
  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      let fieldsToValidate: (keyof CreateOpenPositionFormValues)[] = [];

      switch (step) {
        case 1:
          fieldsToValidate = [
            'positionTitle',
            'positionCode',
            'departmentId',
            'employmentCategory',
            'description',
          ];
          break;
        case 2:
          // Validate that at least one qualification and responsibility exist
          if (qualifications.length === 0 || responsibilities.length === 0) {
            toast.error('Validation Error', {
              description:
                'Please add at least one qualification and one responsibility.',
            });
            return false;
          }
          return true;
        case 3:
          // Validate that at least one requirement array has items
          if (
            educationRequirements.length === 0 &&
            experienceRequirements.length === 0 &&
            skillsRequirements.length === 0
          ) {
            toast.error('Validation Error', {
              description:
                'Please add at least one requirement (education, experience, or skill).',
            });
            return false;
          }
          return true;
        case 4:
          fieldsToValidate = ['applicationDeadline', 'numberOfOpenings'];
          break;
      }

      return await trigger(fieldsToValidate);
    },
    [
      trigger,
      qualifications,
      responsibilities,
      educationRequirements,
      experienceRequirements,
      skillsRequirements,
    ]
  );

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      router.push('/dashboard/jobs');
    }
  }, [hasUnsavedChanges, router]);

  const onSubmit = useCallback(
    async (values: CreateOpenPositionFormValues) => {
      setIsSubmitting(true);

      try {
        const payload: CreateOpenPositionData = {
          ...values,
          qualifications,
          responsibilities,
          requirements: {
            education: educationRequirements,
            experience: experienceRequirements,
            skills: skillsRequirements,
          },
        } as CreateOpenPositionData;

        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create position');
        }

        toast.success('Position created successfully', {
          description: `${values.positionTitle} has been posted.`,
        });

        // Navigate to jobs listing page
        router.push('/dashboard/jobs?created=true');
      } catch (error) {
        toast.error('Failed to create position', {
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      qualifications,
      responsibilities,
      educationRequirements,
      experienceRequirements,
      skillsRequirements,
      router,
    ]
  );

  // Get step content component
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the position title, code, department, and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="positionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Assistant Professor - Computer Science"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ACAD-CS-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use uppercase letters, numbers, and hyphens only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department Selection - Two Step Process */}
              <div className="space-y-4">
                <div>
                  <FormLabel className="text-base mb-3 block">
                    Office Type *
                  </FormLabel>
                  <RadioGroup
                    value={officeType}
                    onValueChange={(value: 'college' | 'administrative') => {
                      setOfficeType(value);
                      setSelectedCollegeId('');
                      form.setValue('departmentId', '');
                    }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Label htmlFor="college">
                        <Card
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-md',
                            officeType === 'college'
                              ? 'border-primary border-2 bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem
                                value="college"
                                id="college"
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="text-base font-semibold cursor-pointer">
                                  College
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Academic colleges and their departments
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>

                      <Label htmlFor="administrative">
                        <Card
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-md',
                            officeType === 'administrative'
                              ? 'border-primary border-2 bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem
                                value="administrative"
                                id="administrative"
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="text-base font-semibold cursor-pointer">
                                  Administrative Office
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Non-academic administrative offices
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* College Path */}
                {officeType === 'college' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <FormLabel className="text-base">
                        Select College *
                      </FormLabel>
                      <Select
                        value={selectedCollegeId}
                        onValueChange={(value) => {
                          setSelectedCollegeId(value);
                          form.setValue('departmentId', value);
                        }}>
                        <SelectTrigger className="mt-2">
                          {isLoadingColleges ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select a college" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {colleges.map((college) => (
                            <SelectItem key={college.id} value={college.id}>
                              {college.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCollegeId && (
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">
                              Select Department (Optional)
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value || selectedCollegeId);
                              }}
                              value={
                                field.value === selectedCollegeId
                                  ? ''
                                  : field.value
                              }>
                              <FormControl>
                                <SelectTrigger>
                                  {isLoadingCollegeDepartments ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Loading...</span>
                                    </div>
                                  ) : (
                                    <SelectValue placeholder="None (use college)" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {collegeDepartments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Leave empty to use the college level
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Administrative Office Path */}
                {officeType === 'administrative' && (
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Select Administrative Office *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              {isLoadingAdministrative ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Select an administrative office" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {administrativeOffices.map((office) => (
                              <SelectItem key={office.id} value={office.id}>
                                {office.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="employmentCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="administrative">
                          Administrative
                        </SelectItem>
                        <SelectItem value="contractual">
                          Contractual
                        </SelectItem>
                        <SelectItem value="not_applicable">
                          Not Applicable
                        </SelectItem>
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
                    <FormLabel>Position Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the position..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 50 characters. Include key information about the
                      role.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Details & Qualifications
              </CardTitle>
              <CardDescription>
                Add qualifications and responsibilities for this position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Qualifications */}
              <div className="space-y-3">
                <FormLabel>Qualifications *</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a qualification..."
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addQualification())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addQualification}
                    size="icon"
                    variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {qualifications.map((qual, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 py-1.5">
                        {qual}
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {qualifications.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No qualifications added yet. Add at least one.
                  </p>
                )}
              </div>

              <Separator />

              {/* Responsibilities */}
              <div className="space-y-3">
                <FormLabel>Responsibilities *</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a responsibility..."
                    value={newResponsibility}
                    onChange={(e) => setNewResponsibility(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addResponsibility())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addResponsibility}
                    size="icon"
                    variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {responsibilities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {responsibilities.map((resp, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 py-1.5">
                        {resp}
                        <button
                          type="button"
                          onClick={() => removeResponsibility(index)}
                          className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {responsibilities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No responsibilities added yet. Add at least one.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Requirements
              </CardTitle>
              <CardDescription>
                Specify education, experience, and skills requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Education Requirements */}
              <div className="space-y-3">
                <FormLabel>Education Requirements</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Bachelor's degree in Computer Science..."
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addEducation())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addEducation}
                    size="icon"
                    variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {educationRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {educationRequirements.map((edu, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 py-1.5">
                        {edu}
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Experience Requirements */}
              <div className="space-y-3">
                <FormLabel>Experience Requirements</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 3+ years teaching experience..."
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addExperience())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addExperience}
                    size="icon"
                    variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {experienceRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {experienceRequirements.map((exp, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 py-1.5">
                        {exp}
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Skills Requirements */}
              <div className="space-y-3">
                <FormLabel>Skills Requirements</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Python, Machine Learning, Data Analysis..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addSkill())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    size="icon"
                    variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {skillsRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillsRequirements.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 py-1.5">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {educationRequirements.length === 0 &&
                experienceRequirements.length === 0 &&
                skillsRequirements.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Add at least one requirement before proceeding.
                  </p>
                )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings & Review
              </CardTitle>
              <CardDescription>
                Configure salary, deadline, and final settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Salary Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Salary Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="salaryRangeMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
                          />
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
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Position Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Position Settings</h3>

                <FormField
                  control={form.control}
                  name="applicationDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Deadline *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}>
                              {field.value ? (
                                format(field.value, 'PPP')
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
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
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
                      <FormLabel>Number of Openings *</FormLabel>
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
                    <FormItem>
                      <div
                        className={cn(
                          'relative flex flex-row items-center justify-between rounded-lg border-2 p-4 transition-all duration-300',
                          field.value
                            ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 border-transparent'
                            : 'bg-muted/30 border-border'
                        )}>
                        {/* Gradient border effect when ON */}
                        {field.value && (
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 opacity-75 -z-10" />
                        )}

                        <div className="flex items-center gap-4 flex-1">
                          {/* Icon with conditional rendering */}
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300',
                              field.value
                                ? 'bg-yellow-100 dark:bg-yellow-900/50'
                                : 'bg-muted'
                            )}>
                            {field.value ? (
                              <Sparkles
                                className={cn(
                                  'h-5 w-5 animate-pulse transition-colors duration-300',
                                  'text-yellow-600 dark:text-yellow-400'
                                )}
                              />
                            ) : (
                              <Star
                                className={cn(
                                  'h-5 w-5 transition-colors duration-300',
                                  'text-muted-foreground'
                                )}
                              />
                            )}
                          </div>

                          {/* Text content */}
                          <div className="space-y-0.5">
                            <FormLabel
                              className={cn(
                                'text-base font-semibold cursor-pointer transition-colors duration-300',
                                field.value
                                  ? 'text-yellow-900 dark:text-yellow-100'
                                  : ''
                              )}>
                              Featured Position
                            </FormLabel>
                            <FormDescription
                              className={cn(
                                'transition-colors duration-300',
                                field.value
                                  ? 'text-yellow-700 dark:text-yellow-300'
                                  : ''
                              )}>
                              Featured positions appear at the top of the job
                              listings
                            </FormDescription>
                          </div>
                        </div>

                        {/* Switch */}
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={cn(
                              'transition-all duration-300',
                              field.value &&
                                'data-[state=checked]:bg-yellow-600 dark:data-[state=checked]:bg-yellow-500'
                            )}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-4 rounded-lg bg-muted p-4">
                <h3 className="text-sm font-semibold">Position Summary</h3>
                <dl className="grid gap-2 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Position:</dt>
                    <dd className="font-medium">{watch('positionTitle')}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Code:</dt>
                    <dd className="font-medium font-mono">
                      {watch('positionCode')}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Qualifications:</dt>
                    <dd className="font-medium">{qualifications.length}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Responsibilities:</dt>
                    <dd className="font-medium">{responsibilities.length}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <dt className="text-muted-foreground">Requirements:</dt>
                    <dd className="font-medium">
                      {educationRequirements.length +
                        experienceRequirements.length +
                        skillsRequirements.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Success screen
  if (isCreated && createdPositionId) {
    return (
      <div className="container max-w-3xl mx-auto py-8 space-y-6">
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">
                  Position Created Successfully
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  The job position has been posted and is now visible to
                  applicants.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-white dark:bg-green-950 p-4">
              <dl className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-1">
                  <dt className="text-muted-foreground">Position Title:</dt>
                  <dd className="font-medium">{watch('positionTitle')}</dd>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <dt className="text-muted-foreground">Position Code:</dt>
                  <dd className="font-medium font-mono">
                    {watch('positionCode')}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <dt className="text-muted-foreground">Office Type:</dt>
                  <dd className="font-medium capitalize">{officeType}</dd>
                </div>
              </dl>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  router.push(
                    `/dashboard/jobs/${createdPositionId}?created=true`
                  )
                }>
                View Position Details
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/jobs')}>
                Go to Jobs List
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreated(false);
                  setCreatedPositionId(null);
                  form.reset();
                  setCurrentStep(1);
                  setQualifications([]);
                  setResponsibilities([]);
                  setEducationRequirements([]);
                  setExperienceRequirements([]);
                  setSkillsRequirements([]);
                }}>
                Create Another Position
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Job Position
          </h1>
          <p className="text-muted-foreground">
            Post a new job opening for applicants to apply
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Step {currentStep} of {TOTAL_STEPS}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-2 mb-6" />

          {/* Step Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map(({ number, label, icon: Icon, description }) => (
              <div
                key={number}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg p-3 transition-all',
                  currentStep === number
                    ? 'bg-primary/10 text-primary scale-105'
                    : currentStep > number
                    ? 'bg-muted text-muted-foreground'
                    : 'text-muted-foreground'
                )}>
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    currentStep === number
                      ? 'border-primary bg-primary text-primary-foreground'
                      : currentStep > number
                      ? 'border-muted-foreground bg-muted-foreground text-background'
                      : 'border-muted-foreground'
                  )}>
                  {currentStep > number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {renderStepContent()}

          {/* Navigation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between gap-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                </div>

                {currentStep < TOTAL_STEPS ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create Position
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this
              page? All progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/dashboard/jobs')}
              className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
