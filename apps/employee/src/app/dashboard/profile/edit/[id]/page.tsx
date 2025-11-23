'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
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
} from 'lucide-react';

// UI Components
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

// MagicUI Components
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { ShineBorder } from '@/components/ui/shine-border';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { Particles } from '@/components/ui/particles';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { BlurFade } from '@/components/ui/blur-fade';
import { Ripple } from '@/components/ui/ripple';

// Custom Components
import { AvatarUpload } from '@/components/profile/AvatarUpload';

// Utilities & Validation
import {
  editProfileSchema,
  type EditProfileFormData,
} from '@/lib/validations/profile';

// Mock data (replace with actual API calls)
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@tupsafe/mock-data/api';

// Animation variants - extracted to prevent recreation on each render
const FADE_IN_UP_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
} as const;

// Mock data - extracted as constants for performance
const MOCK_DEPARTMENTS = [
  { id: '1', name: 'College of Engineering (COE)', code: 'COE' },
  { id: '2', name: 'College of Industrial Education (CIE)', code: 'CIE' },
  { id: '3', name: 'College of Liberal Arts (CLA)', code: 'CLA' },
  { id: '4', name: 'College of Science (CS)', code: 'CS' },
  { id: '5', name: 'College of Architecture and Fine Arts (CAFA)', code: 'CAFA' },
  { id: '6', name: 'College of Industrial Technology (CIT)', code: 'CIT' },
] as const;

const MOCK_POSITIONS = [
  { id: '1', title: 'Professor', gradeLevel: 23 },
  { id: '2', title: 'Associate Professor', gradeLevel: 22 },
  { id: '3', title: 'Assistant Professor', gradeLevel: 21 },
  { id: '4', title: 'Instructor', gradeLevel: 18 },
  { id: '5', title: 'Administrative Officer', gradeLevel: 15 },
  { id: '6', title: 'University Registrar', gradeLevel: 24 },
] as const;

interface EditProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  // Unwrap params promise using React.use() for Next.js 15 compatibility
  const { id } = use(params);

  const router = useRouter();
  const { user } = useAuth();
const { profile, loading: profileLoading } = useProfile(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      phoneNumber: '',
      departmentId: '',
      positionId: '',
      avatarUrl: '',
    },
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || '',
        middleName: profile.middleName || '',
        lastName: profile.lastName || '',
        phoneNumber: '', // TODO: Add phoneNumber to Profile type in database schema
        departmentId: profile.departmentId || '',
        positionId: profile.positionId || '',
        avatarUrl: '', // TODO: Add avatarUrl to Profile type in database schema
      });
    }
  }, [profile, form]);

  // Handle form submission - memoized with useCallback
  const onSubmit = useCallback(
    async (data: EditProfileFormData) => {
      setIsSubmitting(true);

      try {
        // TODO: Replace with actual API call
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Handle avatar upload if present
        if (avatarFile) {
          // TODO: Upload avatar to storage service
          console.log('Uploading avatar:', avatarFile);
        }

        // TODO: Call API to update profile
        console.log('Updating profile:', data);

        // Show success toast
        toast.success('Profile updated successfully!', {
          description: 'Your changes have been saved.',
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
        toast.error('Failed to update profile', {
          description: 'Please try again later.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [avatarFile, router]
  );

  const handleCancel = useCallback(() => {
    router.push('/dashboard/profile');
  }, [router]);

  // Memoize computed full name BEFORE conditional returns to maintain hook order
  const fullName = useMemo(
    () =>
      profile
        ? `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}`
        : '',
    [profile?.firstName, profile?.middleName, profile?.lastName]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSubmitting) {
          form.handleSubmit(onSubmit)();
        }
      }

      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isSubmitting) {
          handleCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, form, onSubmit, handleCancel]);

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

  // Authorization check
  if (!profile || (user?.id !== id && profile?.role !== 'admin')) {
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
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Breadcrumb & Back Button */}
        <Button
          variant="ghost"
          className="w-fit -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            <AnimatedGradientText
              colorFrom="var(--primary)"
              colorTo="var(--tup-crimson-light)"
              speed={1.5}
            >
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
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
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
                style={{ contain: 'layout paint' }}
              >
                <NeonGradientCard
                  borderSize={2}
                  borderRadius={16}
                  neonColors={{
                    firstColor: 'var(--tup-crimson-dark)',
                    secondColor: 'var(--tup-crimson-light)',
                  }}
                  className="p-8"
                >
                  <div className="flex flex-col items-center">
                    <AvatarUpload
                      currentAvatar={undefined}
                      userName={fullName}
                      onAvatarChange={setAvatarFile}
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
                  style={{ contain: 'layout paint' }}
                >
                  <MagicCard
                    gradientSize={0}
                    gradientColor="var(--primary)"
                    gradientOpacity={0}
                    className="h-full"
                  >
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
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Juan"
                                    {...field}
                                    className="focus-visible:ring-primary/20 focus-visible:border-primary"
                                  />
                                </FormControl>
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
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Dela Cruz"
                                    {...field}
                                    className="focus-visible:ring-primary/20 focus-visible:border-primary"
                                  />
                                </FormControl>
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
                  style={{ contain: 'layout paint' }}
                >
                  <MagicCard
                    gradientSize={0}
                    gradientColor="var(--secondary)"
                    gradientOpacity={0}
                    className="h-full"
                  >
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
                                value={user?.email || ''}
                                disabled
                                className="bg-slate-50 dark:bg-slate-800/50"
                              />
                              <Mail className="h-5 w-5 text-red-500" />
                            </div>
                            <FormDescription>
                              Email cannot be changed. Contact HR for assistance.
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
                  style={{ contain: 'layout paint' }}
                >
                  <MagicCard
                    gradientSize={0}
                    gradientColor="#8B1538"
                    gradientOpacity={0}
                  >
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <BlurFade delay={0.35} duration={0.4}>
                          <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <div className="flex items-center gap-2">
                              <Input
                                value={profile.employeeId ?? undefined}
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
                            name="departmentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="focus:ring-primary/20 focus:border-primary">
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MOCK_DEPARTMENTS.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.id}>
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-slate-500" />
                                          {dept.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </BlurFade>

                        <BlurFade delay={0.45} duration={0.4}>
                          <FormField
                            control={form.control}
                            name="positionId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="focus:ring-primary/20 focus:border-primary">
                                      <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MOCK_POSITIONS.map((pos) => (
                                      <SelectItem key={pos.id} value={pos.id}>
                                        <div className="flex items-center gap-2">
                                          <Award className="h-4 w-4 text-slate-500" />
                                          <span>{pos.title}</span>
                                          <span className="text-xs text-slate-500">
                                            (SG-{pos.gradeLevel})
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                transition={{ duration: 0.3, delay: 0.6, ease: 'easeOut' }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-2 sm:order-1 relative overflow-hidden group"
                >
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

                <ShimmerButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-1 sm:order-2 min-w-[180px] group"
                  shimmerColor="#B8264D"
                  background="linear-gradient(135deg, oklch(0.55 0.22 15) 0%, oklch(0.40 0.18 15) 100%)"
                >
                  {isSubmitting ? (
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
                </ShimmerButton>
              </motion.div>
            </form>
          </Form>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4"
        initial="initial"
        animate="animate"
        variants={FADE_IN_UP_VARIANTS}
        transition={{ duration: 0.3, delay: 0.7, ease: 'easeOut' }}
      >
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
