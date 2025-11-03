'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { toast } from 'sonner';

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

// Custom Components
import { AvatarUpload } from '@/components/profile/AvatarUpload';

// Utilities & Validation
import { cn } from '@/lib/utils';
import {
  editProfileSchema,
  type EditProfileFormData,
} from '@/lib/validations/profile';

// Mock data (replace with actual API calls)
import { useAuth, useProfile } from '@tupsafe/mock-data/api';

// Fade-in animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Mock departments and positions (replace with API data)
const MOCK_DEPARTMENTS = [
  { id: '1', name: 'College of Engineering (COE)' },
  { id: '2', name: 'College of Science (COS)' },
  { id: '3', name: 'College of Liberal Arts (CLA)' },
  { id: '4', name: 'College of Industrial Technology (CIT)' },
  { id: '5', name: 'College of Industrial Education (CIE)' },
  { id: '6', name: 'Human Resources Office' },
  { id: '7', name: 'Finance Office' },
];

const MOCK_POSITIONS = [
  { id: '1', title: 'Professor', gradeLevel: 24 },
  { id: '2', title: 'Associate Professor', gradeLevel: 22 },
  { id: '3', title: 'Assistant Professor', gradeLevel: 20 },
  { id: '4', title: 'Instructor', gradeLevel: 18 },
  { id: '5', title: 'Administrative Officer', gradeLevel: 15 },
  { id: '6', title: 'HR Specialist', gradeLevel: 12 },
];

interface EditProfilePageProps {
  params: {
    id: string;
  };
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(params.id);

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

  // Handle form submission
  const onSubmit = async (data: EditProfileFormData) => {
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

      // Redirect back to profile page
      setTimeout(() => {
        router.push('/dashboard/profile');
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/profile');
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#093FB4]" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // Authorization check
  if (!profile || (user?.id !== params.id && profile?.role !== 'admin')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Unauthorized Access
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You don't have permission to edit this profile.
          </p>
          <Button onClick={() => router.push('/dashboard/profile')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}`;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <motion.div
        className="flex flex-col gap-6"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
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
              colorFrom="#093FB4"
              colorTo="#8B1538"
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
        variants={fadeInUp}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <ShineBorder
          shineColor={['#093FB4', '#8B1538', '#0066B3']}
          borderWidth={2}
          duration={12}
          className="rounded-2xl"
        />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Upload Section */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={fadeInUp}
                transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
              >
                <MagicCard
                  gradientSize={0}
                  gradientColor="#093FB4"
                  gradientOpacity={0}
                  gradientFrom="#093FB4"
                  gradientTo="#8B1538"
                  className="p-8"
                >
                  <div className="flex flex-col items-center">
                    <AvatarUpload
                      currentAvatar={undefined}
                      userName={fullName}
                      onAvatarChange={setAvatarFile}
                    />
                  </div>
                </MagicCard>
              </motion.div>

              {/* Form Sections Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={fadeInUp}
                  transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
                >
                  <MagicCard
                    gradientSize={0}
                    gradientColor="#093FB4"
                    gradientOpacity={0}
                    className="h-full"
                  >
                    <div className="p-6 space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#093FB4]/10 dark:bg-[#093FB4]/20">
                          <User className="h-5 w-5 text-[#093FB4]" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Personal Information
                        </h3>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
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
                                  className="focus-visible:ring-[#093FB4]/20 focus-visible:border-[#093FB4]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                  className="focus-visible:ring-[#093FB4]/20 focus-visible:border-[#093FB4]"
                                />
                              </FormControl>
                              <FormDescription>
                                Optional - Leave blank if not applicable
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                  className="focus-visible:ring-[#093FB4]/20 focus-visible:border-[#093FB4]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>

                {/* Contact Information Card */}
                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={fadeInUp}
                  transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
                >
                  <MagicCard
                    gradientSize={0}
                    gradientColor="#0066B3"
                    gradientOpacity={0}
                    className="h-full"
                  >
                    <div className="p-6 space-y-6">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066B3]/10 dark:bg-[#0066B3]/20">
                          <Phone className="h-5 w-5 text-[#0066B3]" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          Contact Information
                        </h3>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <div className="flex items-center gap-2">
                            <Input
                              value={user?.email || ''}
                              disabled
                              className="bg-slate-50 dark:bg-slate-800/50"
                            />
                            <Mail className="h-5 w-5 text-slate-400" />
                          </div>
                          <FormDescription>
                            Email cannot be changed. Contact HR for assistance.
                          </FormDescription>
                        </FormItem>

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
                                  className="focus-visible:ring-[#0066B3]/20 focus-visible:border-[#0066B3]"
                                />
                              </FormControl>
                              <FormDescription>
                                Philippine mobile number format
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>

                {/* Employment Details Card */}
                <motion.div
                  className="lg:col-span-2"
                  initial="initial"
                  animate="animate"
                  variants={fadeInUp}
                  transition={{ duration: 0.3, delay: 0.5, ease: 'easeOut' }}
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

                      {/* Form Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <div className="flex items-center gap-2">
                            <Input
                              value={profile.employeeId}
                              disabled
                              className="bg-slate-50 dark:bg-slate-800/50"
                            />
                            <Shield className="h-5 w-5 text-slate-400" />
                          </div>
                          <FormDescription>
                            Employee ID is permanent and cannot be changed
                          </FormDescription>
                        </FormItem>

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
                                  <SelectTrigger className="focus:ring-[#8B1538]/20 focus:border-[#8B1538]">
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
                                  <SelectTrigger className="focus:ring-[#8B1538]/20 focus:border-[#8B1538]">
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
                variants={fadeInUp}
                transition={{ duration: 0.3, delay: 0.6, ease: 'easeOut' }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <ShimmerButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-1 sm:order-2 min-w-[140px]"
                  shimmerColor="#B8264D"
                  background="linear-gradient(135deg, #093FB4 0%, #0066B3 100%)"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
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
        className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        transition={{ duration: 0.3, delay: 0.7, ease: 'easeOut' }}
      >
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-[#093FB4] flex-shrink-0 mt-0.5" />
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
