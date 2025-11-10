'use client';

import { useMemo } from 'react';
import { useAuth, useProfile } from '@tupsafe/mock-data/api';
import { ProfileHero } from '@/components/dashboard/ProfileHero';
import { InfoCard, InfoItem } from '@/components/dashboard/InfoCard';
import { Badge } from '@/components/ui/badge';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Briefcase,
  Shield,
  FileText,
  Calendar,
  Mail,
  Building2,
  Award,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Animation variants for blur-fade effect - extracted outside component to prevent recreation
const BLUR_FADE_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: 'blur(4px)'
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      delay: i * 0.05,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, department, position, loading, error } = useProfile(
    user?.id || ''
  );

  // Memoize memberSince calculation - MUST be before conditional returns to maintain hook order
  const memberSince = useMemo(
    () =>
      profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        : '',
    [profile?.createdAt]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Error Loading Profile
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {error || 'Unable to load profile data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={BLUR_FADE_VARIANTS}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            <AnimatedGradientText
              colorFrom="var(--primary)"
              colorTo="var(--tup-crimson-light)"
              speed={1.5}
            >
              My Profile
            </AnimatedGradientText>
          </h1>
          <p className="text-slate-700 dark:text-slate-400 mt-2">
            View and manage your employee information
          </p>
        </div>
        <Link href={`/dashboard/profile/edit/${user?.id}`}>
          <ShimmerButton
            shimmerColor="#ffffff"
            shimmerSize="0.1em"
            shimmerDuration="2s"
            borderRadius="0.5rem"
            background="linear-gradient(135deg, oklch(0.55 0.22 15) 0%, oklch(0.40 0.18 15) 100%)"
            className="group relative flex items-center gap-2 font-medium text-white dark:text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </ShimmerButton>
        </Link>
      </motion.div>

      {/* Profile Hero */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={BLUR_FADE_VARIANTS}
      >
        <ProfileHero
          profile={profile}
          department={department}
          position={position}
        />
      </motion.div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Personal Information */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
        >
          <InfoCard title="Personal Information" icon={User} gradient>
            <div className="space-y-3">
              <InfoItem
                label="Full Name"
                value={`${profile.firstName} ${
                  profile.middleName ? profile.middleName + ' ' : ''
                }${profile.lastName}`}
              />
              <InfoItem
                label="Employee ID"
                value={profile.employeeId}
                icon={Shield}
              />
              <InfoItem
                label="Email Address"
                value={user?.email || '—'}
                icon={Mail}
              />
            </div>
          </InfoCard>
        </motion.div>

        {/* Employment Details */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
        >
          <InfoCard title="Employment Details" icon={Briefcase}>
            <div className="space-y-3">
              <InfoItem
                label="Department"
                value={department?.name || '—'}
                icon={Building2}
              />
              <InfoItem
                label="Position"
                value={position?.title || '—'}
                icon={Award}
              />
              <InfoItem
                label="Salary Grade"
                value={position?.gradeLevel ? `SG-${position.gradeLevel}` : '—'}
              />
            </div>
          </InfoCard>
        </motion.div>

        {/* Account Status */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
        >
          <InfoCard title="Account Status" icon={Shield}>
            <div className="space-y-3">
              <InfoItem
                label="Status"
                value={
                  <Badge
                    variant={profile.isActive ? 'default' : 'destructive'}
                    className={cn(
                      'font-semibold',
                      profile.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        : ''
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
              <InfoItem
                label="Member Since"
                value={memberSince}
                icon={Calendar}
              />
              <InfoItem
                label="Last Updated"
                value={new Date(profile.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
            </div>
          </InfoCard>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDS Quick Action */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
          className="group relative"
        >
          <div className="h-full p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Personal Data Sheet (e-PDS)
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  View and update your Personal Data Sheet information
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary-foreground bg-primary/5 hover:bg-primary/90 dark:text-primary dark:hover:text-primary-foreground dark:bg-primary/10 dark:hover:bg-primary/80 border border-primary/20 dark:border-primary/30 rounded-lg transition-all duration-200">
                  <Eye className="h-4 w-4" />
                  View e-PDS
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SALN Quick Action */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
          className="group relative"
        >
          <div className="h-full p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 dark:bg-secondary/20 transition-colors">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Statement of Assets (e-SALN)
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Manage your annual Statement of Assets, Liabilities, and Net Worth
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary hover:text-primary-foreground bg-secondary/5 hover:bg-secondary/90 dark:text-secondary dark:hover:text-primary-foreground dark:bg-secondary/10 dark:hover:bg-secondary/80 border border-secondary/20 dark:border-secondary/30 rounded-lg transition-all duration-200">
                  <Eye className="h-4 w-4" />
                  View e-SALN
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Department Information (Full Width) */}
      {department && (
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
        >
          <InfoCard
            title="Department Information"
            icon={Building2}
            className="lg:col-span-2 xl:col-span-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <InfoItem label="Department Name" value={department.name} />
              <InfoItem label="Department Code" value={department.code} />
              <InfoItem
                label="Department Status"
                value={
                  <Badge
                    variant={department.isActive ? 'default' : 'secondary'}
                    className={cn(
                      department.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        : ''
                    )}
                  >
                    {department.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
            </div>
          </InfoCard>
        </motion.div>
      )}
    </div>
  );
}
