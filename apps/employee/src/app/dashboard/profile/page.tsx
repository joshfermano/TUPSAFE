'use client';

import { useAuth, useProfile } from '@smartgov/mock-data/api';
import { ProfileHero } from '@/components/dashboard/ProfileHero';
import { InfoCard, InfoItem } from '@/components/dashboard/InfoCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { cn } from '@/lib/utils';
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
    <div className="relative space-y-8">
      {/* Animated Background */}
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.08}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] -z-10'
        )}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            My Profile
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            View and manage your employee information
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Hero */}
      <ProfileHero
        profile={profile}
        department={department}
        position={position}
      />

      {/* Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Personal Information */}
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

        {/* Employment Details */}
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

        {/* Account Status */}
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
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDS Quick Action */}
        <NeonGradientCard
          className="overflow-hidden"
          borderSize={2}
          borderRadius={16}>
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Personal Data Sheet (e-PDS)
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  View and update your Personal Data Sheet information
                </p>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  View e-PDS
                </Button>
              </div>
            </div>
          </div>
        </NeonGradientCard>

        {/* SALN Quick Action */}
        <NeonGradientCard
          className="overflow-hidden"
          borderSize={2}
          borderRadius={16}>
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/50">
                <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Statement of Assets (e-SALN)
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Manage your annual Statement of Assets, Liabilities, and Net
                  Worth
                </p>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  View e-SALN
                </Button>
              </div>
            </div>
          </div>
        </NeonGradientCard>
      </div>

      {/* Department Information (Full Width) */}
      {department && (
        <InfoCard
          title="Department Information"
          icon={Building2}
          className="lg:col-span-2 xl:col-span-3">
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
                  )}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
          </div>
        </InfoCard>
      )}
    </div>
  );
}
