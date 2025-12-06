'use client';

import { useMemo } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../hooks/useProfile';
import { ProfileHero } from '../../../components/dashboard/ProfileHero';
import { Badge } from '../../../components/ui/badge';
import { ShimmerButton } from '../../../components/ui/shimmer-button';
import { AnimatedGradientText } from '../../../components/ui/animated-gradient-text';
import { BlurFade } from '../../../components/ui/blur-fade';
import { MagicCard } from '../../../components/ui/magic-card';
import { BorderBeam } from '../../../components/ui/border-beam';
import { cn } from '../../../lib/utils';
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
  Phone,
  Clock,
  Hash,
  GraduationCap,
  MapPin,
} from 'lucide-react';

// Info row component for clean display
function InfoRow({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0',
        highlight && 'bg-primary/5 dark:bg-primary/10 -mx-4 px-4 rounded-lg'
      )}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        )}
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value || '—'}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const {
    data: profileData,
    isLoading: loading,
    error: queryError,
  } = useProfile();

  // Extract data from the query response
  const profile = profileData;
  const department = profileData?.department;
  const college = profileData?.college;
  const position = profileData?.position;
  const error = queryError?.message;

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

  // Memoize full name
  const fullName = useMemo(
    () =>
      profile
        ? `${profile.firstName} ${
            profile.middleName ? profile.middleName + ' ' : ''
          }${profile.lastName}`
        : '',
    [profile]
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
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Page Header */}
      <BlurFade delay={0}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              <AnimatedGradientText
                colorFrom="var(--primary)"
                colorTo="var(--tup-crimson-light)"
                speed={1.5}>
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
              className="group relative flex items-center gap-2 font-medium text-white dark:text-white shadow-lg hover:shadow-xl transition-shadow">
              <Edit className="h-4 w-4" />
              Edit Profile
            </ShimmerButton>
          </Link>
        </div>
      </BlurFade>

      {/* Profile Hero */}
      <BlurFade delay={0.05}>
        <ProfileHero
          profile={profile}
          department={department || null}
          position={position || null}
        />
      </BlurFade>

      {/* Personal Information Card */}
      <BlurFade delay={0.1}>
        <MagicCard
          gradientSize={300}
          gradientColor="var(--primary)"
          gradientOpacity={0.05}
          gradientFrom="var(--primary)"
          gradientTo="var(--tup-crimson-dark)"
          className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <BorderBeam
            size={80}
            duration={8}
            colorFrom="var(--primary)"
            colorTo="var(--tup-crimson-light)"
            borderWidth={1}
          />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-tup-crimson-dark text-white shadow-md">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Personal Information
              </h2>
            </div>
            <div className="space-y-1">
              <InfoRow label="Full Name" value={fullName} highlight />
              <InfoRow
                icon={Hash}
                label={
                  profile.userType === 'employee'
                    ? 'Employee ID'
                    : 'Applicant ID'
                }
                value={
                  profile.userType === 'employee'
                    ? profile.employeeId || '—'
                    : profile.applicantId || '—'
                }
              />
              <InfoRow
                icon={Mail}
                label="Email Address"
                value={profile.email || '—'}
              />
              {profile.phoneNumber && (
                <InfoRow
                  icon={Phone}
                  label="Phone Number"
                  value={profile.phoneNumber}
                />
              )}
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      {/* Employment Details Card */}
      <BlurFade delay={0.15}>
        <MagicCard
          gradientSize={300}
          gradientColor="var(--primary)"
          gradientOpacity={0.05}
          gradientFrom="var(--primary)"
          gradientTo="var(--tup-crimson-dark)"
          className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-primary dark:text-tup-crimson-light">
                <Briefcase className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Employment Details
              </h2>
            </div>
            <div className="space-y-1">
              {profile.userType === 'employee' ? (
                <>
                  <InfoRow
                    icon={Building2}
                    label="Department"
                    value={department?.name || '—'}
                    highlight
                  />
                  {college && (
                    <InfoRow
                      icon={GraduationCap}
                      label="College"
                      value={college.name || '—'}
                    />
                  )}
                  <InfoRow
                    icon={Award}
                    label="Position"
                    value={position?.title || '—'}
                  />
                  <InfoRow
                    icon={Hash}
                    label="Salary Grade"
                    value={
                      position?.gradeLevel ? `SG-${position.gradeLevel}` : '—'
                    }
                  />
                  {profile.hireDate && (
                    <InfoRow
                      icon={Calendar}
                      label="Hire Date"
                      value={new Date(profile.hireDate).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    />
                  )}
                  {profile.tenureYears !== null && (
                    <InfoRow
                      icon={Clock}
                      label="Years of Service"
                      value={`${profile.tenureYears} ${
                        profile.tenureYears === 1 ? 'year' : 'years'
                      }`}
                    />
                  )}
                </>
              ) : (
                <InfoRow icon={User} label="User Type" value="Applicant" />
              )}
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      {/* Account Status Card */}
      <BlurFade delay={0.2}>
        <MagicCard
          gradientSize={300}
          gradientColor="var(--primary)"
          gradientOpacity={0.05}
          gradientFrom="var(--primary)"
          gradientTo="var(--tup-crimson-dark)"
          className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-primary dark:text-tup-crimson-light">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Account Status
              </h2>
            </div>
            <div className="space-y-1">
              <InfoRow
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
                highlight
              />
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={memberSince}
              />
              <InfoRow
                icon={Clock}
                label="Last Updated"
                value={new Date(profile.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      {/* Department Information Card */}
      {department && (
        <BlurFade delay={0.25}>
          <MagicCard
            gradientSize={300}
            gradientColor="var(--primary)"
            gradientOpacity={0.05}
            gradientFrom="var(--primary)"
            gradientTo="var(--tup-crimson-dark)"
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-primary dark:text-tup-crimson-light">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Department Information
                </h2>
              </div>
              <div className="space-y-1">
                <InfoRow
                  icon={MapPin}
                  label="Department Name"
                  value={department.name}
                  highlight
                />
                <InfoRow
                  icon={Hash}
                  label="Department Code"
                  value={department.code}
                />
                <InfoRow
                  label="Department Status"
                  value={
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                      Active
                    </Badge>
                  }
                />
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      )}

      {/* Quick Actions */}
      <BlurFade delay={0.3}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PDS Quick Action */}
          <MagicCard
            gradientSize={200}
            gradientColor="var(--primary)"
            gradientOpacity={0.08}
            gradientFrom="var(--primary)"
            gradientTo="var(--tup-crimson-dark)"
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Personal Data Sheet
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    View and update your e-PDS
                  </p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-white bg-primary/5 hover:bg-primary dark:bg-primary/10 dark:hover:bg-primary border border-primary/20 hover:border-primary rounded-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                    View e-PDS
                  </button>
                </div>
              </div>
            </div>
          </MagicCard>

          {/* SALN Quick Action */}
          <MagicCard
            gradientSize={200}
            gradientColor="var(--secondary)"
            gradientOpacity={0.08}
            gradientFrom="var(--secondary)"
            gradientTo="var(--tup-gold-dark)"
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-secondary/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 group-hover:from-secondary/20 group-hover:to-secondary/10 transition-colors">
                  <Award className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Statement of Assets
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Manage your annual e-SALN
                  </p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary hover:text-slate-900 bg-secondary/5 hover:bg-secondary dark:bg-secondary/10 dark:hover:bg-secondary border border-secondary/20 hover:border-secondary rounded-lg transition-all duration-200">
                    <Eye className="h-4 w-4" />
                    View e-SALN
                  </button>
                </div>
              </div>
            </div>
          </MagicCard>
        </div>
      </BlurFade>
    </div>
  );
}
