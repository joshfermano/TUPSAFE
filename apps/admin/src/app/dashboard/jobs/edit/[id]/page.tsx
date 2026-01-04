/**
 * Job Edit Page
 *
 * Full-page tabbed interface for editing job positions with:
 * - Basic Info: Title, department, category, status, description
 * - Details: Qualifications and responsibilities (badge arrays)
 * - Requirements: Education, experience, skills (badge arrays)
 * - Settings: Salary, employment type, deadline, featured flag
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Loader2,
  CalendarIcon,
  AlertCircle,
  Star,
  Sparkles,
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  updateOpenPositionSchema,
  type UpdateOpenPositionData,
} from '@tupsafe/types';
import { useOpenPositionDetails, useOpenPositions } from '@/hooks/useJobsQuery';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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

interface JobEditPageProps {
  params: Promise<{ id: string }>;
}

export default function JobEditPage({ params }: JobEditPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState('basic');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');

  // Department selection state
  const [officeType, setOfficeType] = useState<'college' | 'administrative'>(
    'college'
  );
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  // Requirements arrays state
  const [educationRequirements, setEducationRequirements] = useState<string[]>(
    []
  );
  const [experienceRequirements, setExperienceRequirements] = useState<
    string[]
  >([]);
  const [skillsRequirements, setSkillsRequirements] = useState<string[]>([]);
  const [newEducation, setNewEducation] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Fetch position details
  const {
    data: position,
    isLoading: isFetchingPosition,
    isError,
    error,
  } = useOpenPositionDetails(id);

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

  // Get mutation functions
  const { updatePosition, isUpdating } = useOpenPositions();

  // Form setup
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
        employmentCategory: position.employmentCategory as
          | 'faculty'
          | 'administrative'
          | 'contractual'
          | 'not_applicable',
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
      setEducationRequirements(position.requirements?.education || []);
      setExperienceRequirements(position.requirements?.experience || []);
      setSkillsRequirements(position.requirements?.skills || []);

      // Set initial office type and college based on department
      if (position.department) {
        const dept = position.department as {
          id: string;
          officeType?: 'academic' | 'administrative';
          parentCollegeId?: string | null;
        };

        // If department has officeType field directly
        if (dept.officeType === 'administrative') {
          setOfficeType('administrative');
          setSelectedCollegeId('');
        } else if (dept.officeType === 'academic') {
          setOfficeType('college');
          // If it has a parentCollegeId, it's a department under a college
          if (dept.parentCollegeId) {
            setSelectedCollegeId(dept.parentCollegeId);
          } else {
            // It's a college itself
            setSelectedCollegeId(dept.id);
          }
        }
      }
    }
  }, [position, form]);

  // Handle form submission
  const handleSubmit = (data: UpdateOpenPositionData) => {
    updatePosition(
      {
        id,
        data: {
          ...data,
          qualifications,
          responsibilities,
          requirements: {
            education: educationRequirements,
            experience: experienceRequirements,
            skills: skillsRequirements,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success('Position updated successfully!');
          router.push(`/dashboard/jobs/${id}?updated=true`);
        },
        onError: (error) => {
          toast.error('Failed to update position', {
            description: error.message,
          });
        },
      }
    );
  };

  // Badge array helpers
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
      setEducationRequirements([
        ...educationRequirements,
        newEducation.trim(),
      ]);
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

  // Loading state
  if (isFetchingPosition) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or not found state
  if (isError || !position) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <Link href="/dashboard/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Position</AlertTitle>
          <AlertDescription>
            {error?.message || 'Position not found or failed to load.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/jobs/${id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Edit Position
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Update position details, requirements, and settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-2">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-xl">{position.positionTitle}</CardTitle>
            <CardDescription>
              Modify the information below and save your changes
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <CardContent className="p-0">
                {/* Sticky Tabs Navigation */}
                <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full">
                    <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-4 rounded-none bg-muted/30">
                      <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                        Basic Info
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                        Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="requirements"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                        Requirements
                      </TabsTrigger>
                      <TabsTrigger
                        value="settings"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                        Settings
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab Contents */}
                    <div className="p-6">
                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-6 mt-0">
                        <div className="grid gap-6">
                          <FormField
                            control={form.control}
                            name="positionTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">
                                  Position Title
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Assistant Professor - Computer Science"
                                    className="h-11"
                                    {...field}
                                  />
                                </FormControl>
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
                                onValueChange={(
                                  value: 'college' | 'administrative'
                                ) => {
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
                                              Academic colleges and their
                                              departments
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
                                    <SelectTrigger className="mt-2 h-11">
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
                                        <SelectItem
                                          key={college.id}
                                          value={college.id}>
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
                                            field.onChange(
                                              value || selectedCollegeId
                                            );
                                          }}
                                          value={
                                            field.value === selectedCollegeId
                                              ? ''
                                              : field.value
                                          }>
                                          <FormControl>
                                            <SelectTrigger className="h-11">
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
                                              <SelectItem
                                                key={dept.id}
                                                value={dept.id}>
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
                                        <SelectTrigger className="h-11">
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
                                          <SelectItem
                                            key={office.id}
                                            value={office.id}>
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
                                <FormLabel className="text-base">
                                  Employment Category
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="faculty">
                                      Faculty
                                    </SelectItem>
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
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">
                                  Position Status
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">
                                      Closed
                                    </SelectItem>
                                    <SelectItem value="filled">
                                      Filled
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                      Cancelled
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
                                <FormLabel className="text-base">
                                  Position Description
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Provide a detailed description of the position..."
                                    rows={8}
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Describe the role, its purpose, and key
                                  objectives
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      {/* Details Tab */}
                      <TabsContent value="details" className="space-y-6 mt-0">
                        <div className="space-y-6">
                          {/* Qualifications */}
                          <div className="space-y-3">
                            <FormLabel className="text-base">
                              Qualifications
                            </FormLabel>
                            <FormDescription>
                              Add specific qualifications required for this
                              position
                            </FormDescription>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a qualification..."
                                value={newQualification}
                                onChange={(e) =>
                                  setNewQualification(e.target.value)
                                }
                                onKeyPress={(e) =>
                                  e.key === 'Enter' &&
                                  (e.preventDefault(), addQualification())
                                }
                                className="h-11"
                              />
                              <Button
                                type="button"
                                onClick={addQualification}
                                size="default"
                                variant="secondary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                            {qualifications.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
                                {qualifications.map((qual, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="gap-1 py-1.5 px-3 text-sm">
                                    {qual}
                                    <button
                                      type="button"
                                      onClick={() => removeQualification(index)}
                                      className="hover:text-destructive ml-1">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Responsibilities */}
                          <div className="space-y-3">
                            <FormLabel className="text-base">
                              Responsibilities
                            </FormLabel>
                            <FormDescription>
                              List the key responsibilities and duties
                            </FormDescription>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a responsibility..."
                                value={newResponsibility}
                                onChange={(e) =>
                                  setNewResponsibility(e.target.value)
                                }
                                onKeyPress={(e) =>
                                  e.key === 'Enter' &&
                                  (e.preventDefault(), addResponsibility())
                                }
                                className="h-11"
                              />
                              <Button
                                type="button"
                                onClick={addResponsibility}
                                size="default"
                                variant="secondary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                            {responsibilities.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
                                {responsibilities.map((resp, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="gap-1 py-1.5 px-3 text-sm">
                                    {resp}
                                    <button
                                      type="button"
                                      onClick={() => removeResponsibility(index)}
                                      className="hover:text-destructive ml-1">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Requirements Tab */}
                      <TabsContent
                        value="requirements"
                        className="space-y-6 mt-0">
                        <div className="space-y-6">
                          {/* Salary Information */}
                          <div className="grid sm:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="salaryGrade"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base">
                                    Salary Grade
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., SG-12"
                                      className="h-11"
                                      {...field}
                                    />
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
                                  <FormLabel className="text-base">
                                    Employment Type
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Full-time"
                                      className="h-11"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="salaryRangeMin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base">
                                    Minimum Salary
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className="h-11"
                                      {...field}
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
                                  <FormLabel className="text-base">
                                    Maximum Salary
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className="h-11"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator className="my-6" />

                          {/* Education Requirements */}
                          <div className="space-y-3">
                            <FormLabel className="text-base">
                              Education Requirements
                            </FormLabel>
                            <FormDescription>
                              Specify educational qualifications needed
                            </FormDescription>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g., Bachelor's degree in Computer Science..."
                                value={newEducation}
                                onChange={(e) => setNewEducation(e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === 'Enter' &&
                                  (e.preventDefault(), addEducation())
                                }
                                className="h-11"
                              />
                              <Button
                                type="button"
                                onClick={addEducation}
                                size="default"
                                variant="secondary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                            {educationRequirements.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
                                {educationRequirements.map((edu, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="gap-1 py-1.5 px-3 text-sm">
                                    {edu}
                                    <button
                                      type="button"
                                      onClick={() => removeEducation(index)}
                                      className="hover:text-destructive ml-1">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Experience Requirements */}
                          <div className="space-y-3">
                            <FormLabel className="text-base">
                              Experience Requirements
                            </FormLabel>
                            <FormDescription>
                              Define required work experience
                            </FormDescription>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g., 3+ years teaching experience..."
                                value={newExperience}
                                onChange={(e) =>
                                  setNewExperience(e.target.value)
                                }
                                onKeyPress={(e) =>
                                  e.key === 'Enter' &&
                                  (e.preventDefault(), addExperience())
                                }
                                className="h-11"
                              />
                              <Button
                                type="button"
                                onClick={addExperience}
                                size="default"
                                variant="secondary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                            {experienceRequirements.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
                                {experienceRequirements.map((exp, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="gap-1 py-1.5 px-3 text-sm">
                                    {exp}
                                    <button
                                      type="button"
                                      onClick={() => removeExperience(index)}
                                      className="hover:text-destructive ml-1">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Skills Requirements */}
                          <div className="space-y-3">
                            <FormLabel className="text-base">
                              Skills Requirements
                            </FormLabel>
                            <FormDescription>
                              List technical and soft skills needed
                            </FormDescription>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g., Python, Machine Learning, Data Analysis..."
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === 'Enter' &&
                                  (e.preventDefault(), addSkill())
                                }
                                className="h-11"
                              />
                              <Button
                                type="button"
                                onClick={addSkill}
                                size="default"
                                variant="secondary">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                            {skillsRequirements.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
                                {skillsRequirements.map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="gap-1 py-1.5 px-3 text-sm">
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(index)}
                                      className="hover:text-destructive ml-1">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Settings Tab */}
                      <TabsContent value="settings" className="space-y-6 mt-0">
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="applicationDeadline"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-base">
                                  Application Deadline
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          'w-full h-11 pl-3 text-left font-normal',
                                          !field.value && 'text-muted-foreground'
                                        )}>
                                        {field.value ? (
                                          format(new Date(field.value), 'PPP')
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start">
                                    <Calendar
                                      mode="single"
                                      selected={
                                        field.value
                                          ? new Date(field.value)
                                          : undefined
                                      }
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Last date for accepting applications
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="numberOfOpenings"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">
                                  Number of Openings
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="h-11"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  How many positions are available
                                </FormDescription>
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
                                        Featured positions appear at the top of
                                        job listings and get highlighted display
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
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </CardContent>

              {/* Fixed Bottom Actions */}
              <div className="border-t bg-muted/50 p-6">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/jobs/${id}`)}
                    disabled={isUpdating}
                    className="h-11">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="h-11">
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
