'use client';

import { useEffect, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Icons
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  Briefcase,
  Building2,
  Award,
  Mail,
  Shield,
  Loader2,
  Lock,
} from 'lucide-react';

// UI Components
import { Button } from '../../../../../components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';

// MagicUI Components
import { MagicCard } from '../../../../../components/ui/magic-card';
import { ShineBorder } from '../../../../../components/ui/shine-border';
import { AnimatedGradientText } from '../../../../../components/ui/animated-gradient-text';
import { Particles } from '../../../../../components/ui/particles';
import { NeonGradientCard } from '../../../../../components/ui/neon-gradient-card';
import { BlurFade } from '../../../../../components/ui/blur-fade';
import { Ripple } from '../../../../../components/ui/ripple';

// Custom Components
import { AvatarUpload } from '../../../../../components/profile/AvatarUpload';
import { CertificationsSection } from '../../../../../components/profile/CertificationsSection';

// Utilities & Validation
import {
  editProfileSchema,
  type EditProfileFormData,
} from '../../../../../lib/validations/profile';
import { formatSalaryGrade } from '@tupsafe/types';
import { cn } from '../../../../../lib/utils';

// Auth and API hooks
import { useAuth } from '../../../../../providers/AuthProvider';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '../../../../../hooks/useProfile';
import {
  useColleges,
  useOffices,
  useDepartmentsByCollege,
} from '../../../../../hooks/useOrganizationData';

// Animation variants - extracted to prevent recreation on each render
const FADE_IN_UP_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
} as const;

interface EditProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  // Unwrap params promise using React.use() for Next.js 15 compatibility
  const { id: _id } = use(params);

  const router = useRouter();
  const { user } = useAuth();

  // Real API hooks
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  // Organization data hooks
  const { data: colleges = [], isLoading: collegesLoading } = useColleges();
  const { data: offices = [], isLoading: officesLoading } = useOffices();

  // Combine colleges and offices for the College/Office dropdown
  const allCollegesAndOffices = useMemo(() => {
    const combined = [
      ...colleges.map((c) => ({ id: c.id, name: c.name, code: c.code, type: 'college' as const })),
      ...offices.map((o) => ({ id: o.id, name: o.name, code: o.code, type: 'office' as const })),
    ];
    // Sort alphabetically by name
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [colleges, offices]);

  // Check if avatar operations are in progress
  const isAvatarLoading = uploadAvatarMutation.isPending || deleteAvatarMutation.isPending;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      phoneNumber: '',
      collegeId: '',
      departmentId: '',
      positionId: '',
      positionTitle: '',
      avatarUrl: '',
    },
  });

  // Watch selected college to fetch departments
  const selectedCollegeId = form.watch('collegeId');

  // Fetch departments for the selected college
  const { data: departmentsForCollege = [], isLoading: departmentsLoading } = useDepartmentsByCollege(
    selectedCollegeId || undefined
  );

  // Check if selected college has departments
  const selectedCollegeHasDepartments = useMemo(() => {
    if (!selectedCollegeId) return false;
    const selectedItem = allCollegesAndOffices.find((item) => item.id === selectedCollegeId);
    // Only colleges (not offices) can have departments
    return selectedItem?.type === 'college';
  }, [selectedCollegeId, allCollegesAndOffices]);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      // Determine collegeId and departmentId from profile
      // If profile has a college, that's the collegeId
      // If profile has a department with a parentCollegeId, the college is the parent
      let collegeId = '';
      const departmentId = '';

      if (profile.college) {
        // User is assigned to a college directly (no department)
        collegeId = profile.college.id;
      } else if (profile.department) {
        // Check if the department has a parent college (it's a sub-department)
        // The API returns department info - we need to check the structure
        // For now, we'll set departmentId as the college if it's a top-level unit
        // This will be refined based on actual data structure
        collegeId = profile.department.id;
      }

      form.reset({
        firstName: profile.firstName || '',
        middleName: profile.middleName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        collegeId,
        departmentId,
        positionId: profile.position?.id || '',
        positionTitle: profile.positionTitle || '',
        avatarUrl: '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- form.reset is stable; including `form` causes infinite re-render loop
  }, [profile]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback(
    async (file: File) => {
      await uploadAvatarMutation.mutateAsync(file);
    },
    [uploadAvatarMutation]
  );

  // Handle avatar removal
  const handleAvatarRemove = useCallback(async () => {
    await deleteAvatarMutation.mutateAsync();
  }, [deleteAvatarMutation]);

  // Handle form submission - memoized with useCallback
  const onSubmit = useCallback(
    async (data: EditProfileFormData) => {
      console.log('[EditProfile] Form submitted with data:', data);
      try {
        // Determine the final departmentId to save
        // If a specific department is selected (under a college), use that
        // Otherwise, use the college/office ID itself
        const finalDepartmentId = data.departmentId || data.collegeId || null;

        console.log('[EditProfile] Submitting to API:', {
          phoneNumber: data.phoneNumber || null,
          middleName: data.middleName || null,
          departmentId: finalDepartmentId,
          positionTitle: data.positionTitle || null,
        });

        // Only submit editable fields via the mutation
        // Avatar is handled separately via AvatarUpload component
        await updateProfileMutation.mutateAsync({
          phoneNumber: data.phoneNumber || null,
          middleName: data.middleName || null,
          departmentId: finalDepartmentId,
          positionTitle: data.positionTitle || null,
        });

        // Trigger confetti celebration animation
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          zIndex: 9999,
        };

        function fire(particleRatio: number, opts: confetti.Options) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        // Multi-burst confetti effect
        fire(0.25, {
          spread: 26,
          startVelocity: 55,
          colors: ['#8B1538', '#B8264D', '#E0E7FF', '#ffffff'],
        });

        fire(0.2, {
          spread: 60,
          colors: ['#8B1538', '#B8264D', '#E0E7FF', '#ffffff'],
        });

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
          colors: ['#8B1538', '#B8264D', '#E0E7FF', '#ffffff'],
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
          colors: ['#8B1538', '#B8264D', '#E0E7FF', '#ffffff'],
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
          colors: ['#8B1538', '#B8264D', '#E0E7FF', '#ffffff'],
        });

        // Redirect back to profile page after confetti
        setTimeout(() => {
          router.push('/dashboard/profile');
        }, 1500);
      } catch (error) {
        console.error('Error updating profile:', error);
        // Error toast is handled by useUpdateProfile hook
      }
    },
    [router, updateProfileMutation]
  );

  const handleCancel = useCallback(() => {
    router.push('/dashboard/profile');
  }, [router]);

  // Memoize computed full name BEFORE conditional returns to maintain hook order
  const fullName = useMemo(
    () =>
      profile
        ? `${profile.firstName} ${
            profile.middleName ? profile.middleName + ' ' : ''
          }${profile.lastName}`
        : '',
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accessing profile sub-fields; profile object ref changes but we only depend on name fields
    [profile?.firstName, profile?.middleName, profile?.lastName]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!updateProfileMutation.isPending) {
          form.handleSubmit(onSubmit)();
        }
      }

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!updateProfileMutation.isPending) {
          handleCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateProfileMutation.isPending, form, onSubmit, handleCancel]);

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Failed to Load Profile
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {profileError instanceof Error
              ? profileError.message
              : 'An error occurred while loading your profile.'}
          </p>
          <Button onClick={() => router.push('/dashboard/profile')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Authorization check - user can only edit their own profile (or admin can edit any)
  if (!profile || (user?.id !== profile.id && profile.role !== 'admin')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Unauthorized Access
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You don&apos;t have permission to edit this profile.
          </p>
          <Button onClick={() => router.push('/dashboard/profile')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative space-y-8 pb-12">
      {/* Ambient particles background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={30}
          staticity={50}
          color="var(--primary)"
          size={0.5}
          refresh={false}
        />
      </div>

      {/* Page Header */}
      <motion.div
        className="flex flex-col gap-6"
        initial="initial"
        animate="animate"
        variants={FADE_IN_UP_VARIANTS}
        transition={{ duration: 0.3, ease: 'easeOut' }}>
        {/* Breadcrumb & Back Button */}
        <Button
          variant="ghost"
          className="w-fit -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            <AnimatedGradientText
              colorFrom="var(--primary)"
              colorTo="var(--tup-crimson-light)"
              speed={1.5}>
              Edit Profile
            </AnimatedGradientText>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Update your personal information and employment details
          </p>
        </div>
      </motion.div>

      {/* Form Container with ShineBorder */}
      <motion.div
        className="relative"
        initial="initial"
        animate="animate"
        variants={FADE_IN_UP_VARIANTS}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}>
        <ShineBorder
          shineColor={['var(--primary)', 'var(--tup-crimson-light)']}
          borderWidth={2}
          duration={12}
          className="rounded-2xl"
        />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Upload Section with NeonGradientCard */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={FADE_IN_UP_VARIANTS}
                transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
                style={{ contain: 'layout paint' }}>
                <NeonGradientCard
                  borderSize={2}
                  borderRadius={16}
                  neonColors={{
                    firstColor: 'var(--tup-crimson-dark)',
                    secondColor: 'var(--tup-crimson-light)',
                  }}
                  className="p-8">
                  <div className="flex flex-col items-center">
                    <AvatarUpload
                      currentAvatar={profile?.avatarUrl}
                      userName={fullName}
                      onUpload={handleAvatarUpload}
                      onRemove={handleAvatarRemove}
                      isLoading={isAvatarLoading}
                    />
                  </div>
                </NeonGradientCard>
              </motion.div>

              {/* Form Sections Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={FADE_IN_UP_VARIANTS}
                  transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
                  style={{ contain: 'layout paint' }}>
                  <MagicCard
                    gradientSize={0}
                    gradientColor="var(--primary)"
                    gradientOpacity={0}
                    className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Personal Information
                        </h3>
                      </div>

                      {/* Form Fields with BlurFade animations */}
                      <div className="space-y-4">
                        <BlurFade delay={0.1} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  First Name
                                  <Lock className="h-3 w-3 text-slate-400" />
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Juan"
                                    {...field}
                                    disabled
                                    className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Contact HR to change your name
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>

                        <BlurFade delay={0.15} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="middleName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Middle Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Santos (Optional)"
                                    {...field}
                                    className="focus-visible:ring-primary/20 focus-visible:border-primary"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Optional - Leave blank if not applicable
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>

                        <BlurFade delay={0.2} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Last Name
                                  <Lock className="h-3 w-3 text-slate-400" />
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Dela Cruz"
                                    {...field}
                                    disabled
                                    className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Contact HR to change your name
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>

                {/* Contact Information Card */}
                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={FADE_IN_UP_VARIANTS}
                  transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
                  style={{ contain: 'layout paint' }}>
                  <MagicCard
                    gradientSize={0}
                    gradientColor="var(--secondary)"
                    gradientOpacity={0}
                    className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 dark:bg-secondary/20">
                          <Phone className="h-5 w-5 text-secondary" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Contact Information
                        </h3>
                      </div>

                      {/* Form Fields with BlurFade */}
                      <div className="space-y-4">
                        <BlurFade delay={0.25} duration={0.4}>
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <div className="flex items-center gap-2">
                              <Input
                                value={user?.email || profile.email || ''}
                                disabled
                                className="bg-slate-50 dark:bg-slate-800/50"
                              />
                              <Mail className="h-5 w-5 text-red-500" />
                            </div>
                            <FormDescription>
                              Email cannot be changed. Contact HR for
                              assistance.
                            </FormDescription>
                          </FormItem>
                        </BlurFade>

                        <BlurFade delay={0.3} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+639123456789 or 09123456789"
                                    {...field}
                                    className="focus-visible:ring-secondary/20 focus-visible:border-secondary"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Philippine mobile number format
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>

                {/* Employment Details Card */}
                <motion.div
                  className="lg:col-span-2"
                  initial="initial"
                  animate="animate"
                  variants={FADE_IN_UP_VARIANTS}
                  transition={{ duration: 0.3, delay: 0.5, ease: 'easeOut' }}
                  style={{ contain: 'layout paint' }}>
                  <MagicCard
                    gradientSize={0}
                    gradientColor="#8B1538"
                    gradientOpacity={0}>
                    <div className="p-6 space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B1538]/10 dark:bg-[#8B1538]/20">
                          <Briefcase className="h-5 w-5 text-[#8B1538]" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Employment Details
                        </h3>
                      </div>

                      {/* Form Fields Grid with BlurFade */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BlurFade delay={0.35} duration={0.4}>
                          <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <div className="flex items-center gap-2">
                              <Input
                                value={
                                  profile.employeeId ||
                                  profile.applicantId ||
                                  'Not assigned'
                                }
                                disabled
                                className="bg-slate-50 dark:bg-slate-800/50"
                              />
                              <Shield className="h-5 w-5 text-slate-400" />
                            </div>
                            <FormDescription>
                              Employee ID is permanent and cannot be changed
                            </FormDescription>
                          </FormItem>
                        </BlurFade>

                        <BlurFade delay={0.4} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="collegeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>College / Office</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // Reset department when college changes
                                    form.setValue('departmentId', '');
                                  }}
                                  value={field.value}
                                  disabled={collegesLoading || officesLoading}>
                                  <FormControl>
                                    <SelectTrigger className="focus:ring-primary/20 focus:border-primary">
                                      <SelectValue placeholder="Select college or office" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {allCollegesAndOffices.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-slate-500" />
                                          {item.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select your college or administrative office
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>

                        {/* Department dropdown - only shown when a college with departments is selected */}
                        {selectedCollegeHasDepartments && (
                          <BlurFade delay={0.42} duration={0.4}>
                            <FormField
                              control={form.control}
                              name="departmentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department (Optional)</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={departmentsLoading}>
                                    <FormControl>
                                      <SelectTrigger className="focus:ring-primary/20 focus:border-primary">
                                        <SelectValue placeholder="Select department (optional)" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {departmentsForCollege.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                          <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-slate-500" />
                                            {dept.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                      {departmentsForCollege.length === 0 && !departmentsLoading && (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                          No departments found for this college
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Optionally select a specific department within your college
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </BlurFade>
                        )}

                        <BlurFade delay={0.45} duration={0.4}>
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Salary Grade
                              <Lock className="h-3 w-3 text-slate-400" />
                            </FormLabel>
                            <div className="flex items-center gap-2">
                              <Input
                                value={
                                  profile.salaryGrade
                                    ? formatSalaryGrade(profile.salaryGrade)
                                    : 'Not assigned'
                                }
                                disabled
                                className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed text-slate-600 dark:text-slate-400"
                              />
                              <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <FormDescription>
                              Contact HR to change your salary grade
                            </FormDescription>
                          </FormItem>
                        </BlurFade>

                        <BlurFade delay={0.47} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="positionTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Associate Professor III"
                                    {...field}
                                    className="focus-visible:ring-primary/20 focus-visible:border-primary"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your current position or job title
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>

                        <BlurFade delay={0.5} duration={0.4}>
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Position
                              <Lock className="h-3 w-3 text-slate-400" />
                            </FormLabel>
                            <div className="flex items-center gap-2">
                              <Input
                                value={
                                  profile.position
                                    ? `${profile.position.title}${
                                        profile.position.gradeLevel
                                          ? ` (SG-${profile.position.gradeLevel})`
                                          : ''
                                      }`
                                    : 'Not assigned'
                                }
                                disabled
                                className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
                              />
                              <Award className="h-5 w-5 text-slate-400" />
                            </div>
                            <FormDescription>
                              Position changes require HR approval
                            </FormDescription>
                          </FormItem>
                        </BlurFade>
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6"
                initial="initial"
                animate="animate"
                variants={FADE_IN_UP_VARIANTS}
                transition={{ duration: 0.3, delay: 0.6, ease: 'easeOut' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                  className="w-full sm:w-auto order-2 sm:order-1 relative overflow-hidden group border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all duration-200">
                  <span>Cancel</span>
                  <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                    (Esc)
                  </span>
                  <Ripple
                    mainCircleSize={100}
                    mainCircleOpacity={0.2}
                    numCircles={5}
                  />
                </Button>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  onClick={() => {
                    // Log form state for debugging
                    console.log('[EditProfile] Save button clicked');
                    console.log('[EditProfile] Form values:', form.getValues());
                    console.log('[EditProfile] Form errors:', form.formState.errors);

                    // If there are validation errors, show a toast
                    const errors = form.formState.errors;
                    if (Object.keys(errors).length > 0) {
                      const errorMessages = Object.entries(errors)
                        .map(([field, error]) => `${field}: ${error?.message}`)
                        .join(', ');
                      toast.error('Please fix the form errors', {
                        description: errorMessages,
                      });
                    }
                  }}
                  className={cn(
                    "w-full sm:w-auto order-1 sm:order-2 min-w-[180px] relative overflow-hidden group",
                    // Base styles
                    "bg-gradient-to-r from-[#8B1538] to-[#B8264D] text-white font-medium",
                    // Border
                    "border-2 border-[#8B1538]/50 dark:border-[#B8264D]/50",
                    // Hover states
                    "hover:from-[#9B2548] hover:to-[#C8365D] hover:border-[#B8264D]/70 hover:shadow-lg hover:shadow-[#8B1538]/25",
                    // Active/pressed state
                    "active:scale-[0.98] active:from-[#7B0528] active:to-[#A8163D]",
                    // Focus state
                    "focus:outline-none focus:ring-2 focus:ring-[#B8264D]/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                    // Disabled state
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100",
                    // Transition
                    "transition-all duration-200 ease-out"
                  )}>
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Save Changes</span>
                      <span className="ml-2 text-xs opacity-70 hidden sm:inline">
                        (Ctrl+S)
                      </span>
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </div>
      </motion.div>

      {/* Certifications & Trainings Section (independent CRUD lifecycle) */}
      <CertificationsSection />

      {/* Info Banner */}
      <motion.div
        className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4"
        initial="initial"
        animate="animate"
        variants={FADE_IN_UP_VARIANTS}
        transition={{ duration: 0.3, delay: 0.7, ease: 'easeOut' }}>
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-primary dark:text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Privacy & Security
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your information is encrypted and securely stored. Changes to
              employment details may require HR approval and will be reflected
              after verification.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
