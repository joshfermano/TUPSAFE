'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardStats, isEmployeeStats, isApplicantStats } from '@/hooks/useDashboardStats';
import { useProfile } from '@/hooks/useProfile';
import { Particles } from '@/components/ui/particles';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { MagicCard } from '@/components/ui/magic-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Award,
  Calendar,
  Bell,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Clock,
  Loader2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// Animation constants
const BLUR_FADE_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: 'blur(4px)',
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats, isLoading, error } = useDashboardStats();

  // Memoize greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const firstName = profile?.firstName || user?.email?.split('@')[0] || 'User';

  if (isLoading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <Particles
          className="absolute inset-0 -z-10"
          quantity={80}
          ease={80}
          color="#8B1538"
          size={0.8}
          staticity={40}
          refresh={false}
        />
        <AnimatedGridPattern
          numSquares={60}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(700px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] -z-10'
          )}
        />
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B1538]/30 to-[#B8264D]/30 blur-2xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#8B1538] to-[#B8264D] shadow-2xl">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <Loader2 className="h-10 w-10 text-[#8B1538] animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Loading Dashboard
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Fetching your latest data...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Error Loading Dashboard
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {error?.message || 'Unable to load dashboard data'}
          </p>
        </div>
      </div>
    );
  }

  if (isEmployeeStats(stats)) {
    // EMPLOYEE DASHBOARD
    const { pds, saln, compliance, deadlines, notifications } = stats.stats;

    return (
      <div className="space-y-8 pb-8">
        {/* Welcome Header */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={BLUR_FADE_VARIANTS}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            <AnimatedGradientText>{greeting}, {firstName}!</AnimatedGradientText>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Here&apos;s your compliance status and recent activity
          </p>
        </motion.div>

        {/* Compliance Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Compliance */}
          <motion.div custom={1} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <MagicCard gradientColor="rgba(139, 21, 56, 0.1)">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {compliance.overall ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Compliance Status</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {compliance.status === 'compliant' ? 'Compliant' : compliance.status === 'partial' ? 'Partial' : 'Non-Compliant'}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={compliance.overall ? 'default' : 'secondary'}
                  className={cn(
                    'w-full justify-center',
                    compliance.overall
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                  )}
                >
                  {compliance.overall ? 'All Requirements Met' : 'Action Required'}
                </Badge>
              </div>
            </MagicCard>
          </motion.div>

          {/* PDS Status */}
          <motion.div custom={2} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <MagicCard gradientColor="rgba(139, 21, 56, 0.1)">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-[#8B1538]" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">e-PDS</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {pds.status.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {pds.submittedAt ? (
                    <>Submitted: {new Date(pds.submittedAt).toLocaleDateString()}</>
                  ) : (
                    'Not submitted yet'
                  )}
                </div>
                <Link href="/dashboard/pds">
                  <ShimmerButton className="w-full h-9 text-sm">
                    View e-PDS
                  </ShimmerButton>
                </Link>
              </div>
            </MagicCard>
          </motion.div>

          {/* SALN Status */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <MagicCard gradientColor="rgba(139, 21, 56, 0.1)">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-[#8B1538]" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">e-SALN {saln.year}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {saln.status.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {saln.submittedAt ? (
                    <>Submitted: {new Date(saln.submittedAt).toLocaleDateString()}</>
                  ) : (
                    'Not submitted yet'
                  )}
                </div>
                <Link href="/dashboard/saln">
                  <ShimmerButton className="w-full h-9 text-sm">
                    View e-SALN
                  </ShimmerButton>
                </Link>
              </div>
            </MagicCard>
          </motion.div>
        </div>

        {/* Upcoming Deadlines */}
        {deadlines.length > 0 && (
          <motion.div custom={4} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#8B1538]" />
                  Upcoming Deadlines
                </h2>
              </div>
              <div className="space-y-3">
                {deadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      deadline.isUrgent
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className={cn('h-5 w-5', deadline.isUrgent ? 'text-red-500' : 'text-slate-500')} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {deadline.formType.toUpperCase()} {deadline.year}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Due: {new Date(deadline.deadlineDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={deadline.isUrgent ? 'destructive' : 'secondary'}>
                      {deadline.daysUntil} {deadline.daysUntil === 1 ? 'day' : 'days'} left
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Count */}
        {notifications.unread > 0 && (
          <motion.div custom={5} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <Link href="/dashboard/notifications">
              <div className="bg-gradient-to-r from-[#8B1538] to-[#B8264D] text-white rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">You have {notifications.unread} unread notification{notifications.unread !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-white/80">Click to view all notifications</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    );
  }

  if (isApplicantStats(stats)) {
    // APPLICANT DASHBOARD
    const { applications, recentApplications, positions, pds, notifications } = stats.stats;

    return (
      <div className="space-y-8 pb-8">
        {/* Welcome Header */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
            <AnimatedGradientText>{greeting}, {firstName}!</AnimatedGradientText>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Track your applications and find new opportunities
          </p>
        </motion.div>

        {/* Application Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Applications */}
          <motion.div custom={1} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <MagicCard gradientColor="rgba(139, 21, 56, 0.1)">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-[#8B1538]" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Active Applications</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {applications.active}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Total: {applications.total} application{applications.total !== 1 ? 's' : ''}
                </p>
              </div>
            </MagicCard>
          </motion.div>

          {/* Recommended Positions */}
          <motion.div custom={2} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <MagicCard gradientColor="rgba(139, 21, 56, 0.1)">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-[#8B1538]" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Recommended</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {positions.recommended}
                      </p>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/positions">
                  <ShimmerButton className="w-full h-9 text-sm">
                    Browse Positions
                  </ShimmerButton>
                </Link>
              </div>
            </MagicCard>
          </motion.div>

          {/* PDS Status */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <MagicCard gradientColor="rgba(139, 21, 56, 0.1)">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-[#8B1538]" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">e-PDS</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {pds.hasSubmission ? 'Submitted' : 'Not Submitted'}
                      </p>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/pds">
                  <ShimmerButton className="w-full h-9 text-sm">
                    {pds.hasSubmission ? 'View e-PDS' : 'Create e-PDS'}
                  </ShimmerButton>
                </Link>
              </div>
            </MagicCard>
          </motion.div>
        </div>

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <motion.div custom={4} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Recent Applications
                </h2>
                <Link href="/dashboard/applications">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {app.position.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {app.applicationNumber} • Applied {new Date(app.applicationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{app.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Count */}
        {notifications.unread > 0 && (
          <motion.div custom={5} initial="hidden" animate="visible" variants={BLUR_FADE_VARIANTS}>
            <Link href="/dashboard/notifications">
              <div className="bg-gradient-to-r from-[#8B1538] to-[#B8264D] text-white rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">You have {notifications.unread} unread notification{notifications.unread !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-white/80">Click to view all notifications</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}
