'use client';

import { useAuth, useProfile } from '@tupsafe/mock-data/api';
import { ProfileHero } from '@/components/dashboard/ProfileHero';
import { InfoCard, InfoItem } from '@/components/dashboard/InfoCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Particles } from '@/components/ui/particles';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
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

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, department, position, loading, error } = useProfile(
    user?.id || ''
  );

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%]'
          )}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center">
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

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative space-y-8 pb-8">
      {/* Animated Background with Particles */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={60}
        ease={80}
        color="#3b82f6"
        size={0.6}
        staticity={40}
        refresh={false}
      />
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.06}
        duration={4}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] -z-10'
        )}
      />

      {/* Page Header with staggered animation */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text">
            My Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            View and manage your employee information
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ShimmerButton
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
            shimmerColor="#ffffff"
            shimmerSize="0.1em"
            shimmerDuration="2s"
            borderRadius="0.5rem"
            background="linear-gradient(135deg, #093FB4 0%, #3b82f6 50%, #6366f1 100%)"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </ShimmerButton>
        </motion.div>
      </motion.div>

      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <ProfileHero
          profile={profile}
          department={department}
          position={position}
        />
      </motion.div>

      {/* Information Grid with staggered animation */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
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
                  )}>
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
      </motion.div>

      {/* Quick Actions Grid with staggered animation */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {/* PDS Quick Action */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <NeonGradientCard
            className="overflow-hidden hover:shadow-2xl transition-shadow duration-500"
            borderSize={2}
            borderRadius={16}
            neonColors={{
              firstColor: '#3b82f6',
              secondColor: '#6366f1',
            }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Personal Data Sheet (e-PDS)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    View and update your Personal Data Sheet information
                  </p>
                  <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                    <Button variant="outline" className="w-full sm:w-auto group hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300">
                      <Eye className="h-4 w-4 mr-2 group-hover:text-blue-600 transition-colors" />
                      View e-PDS
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </NeonGradientCard>
        </motion.div>

        {/* SALN Quick Action */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <NeonGradientCard
            className="overflow-hidden hover:shadow-2xl transition-shadow duration-500"
            borderSize={2}
            borderRadius={16}
            neonColors={{
              firstColor: '#6366f1',
              secondColor: '#8b5cf6',
            }}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Award className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Statement of Assets (e-SALN)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Manage your annual Statement of Assets, Liabilities, and Net
                    Worth
                  </p>
                  <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                    <Button variant="outline" className="w-full sm:w-auto group hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all duration-300">
                      <Eye className="h-4 w-4 mr-2 group-hover:text-indigo-600 transition-colors" />
                      View e-SALN
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </NeonGradientCard>
        </motion.div>
      </motion.div>

      {/* Department Information (Full Width) */}
      {department && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
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
