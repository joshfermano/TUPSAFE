'use client';

// React and Next.js
import { useMemo, memo, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';

// Motion and Animation
import { motion } from 'framer-motion';

// API Hooks
import { useAuth, usePds } from '@tupsafe/mock-data/api';

// Enhanced UI Components from shared-ui
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedCardContent,
  EnhancedBackground,
  AnimatedGradientText,
  NumberTicker,
  BlurFade,
  Badge,
} from '@tupsafe/shared-ui';

// Local Components
import { InfoCard } from '@/components/dashboard/InfoCard';

// Utils
import { cn } from '@/lib/utils';

// Icons
import {
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Heart,
  Award,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Calendar,
  Plus,
  Edit,
  Send,
  TrendingUp,
  Archive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Type Definitions
interface PDSSection {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  icon: LucideIcon;
  completionPercentage: number;
}

interface ActivityItem {
  id: string;
  action: string;
  section?: string;
  date: Date;
  type: 'create' | 'update' | 'submit' | 'approve';
}

// Constants
const MOCK_PDS_SECTIONS: PDSSection[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic biographical data and family background',
    isComplete: true,
    icon: User,
    completionPercentage: 100,
  },
  {
    id: 'education',
    title: 'Educational Background',
    description: 'Elementary, Secondary, Vocational, College, Graduate Studies',
    isComplete: true,
    icon: GraduationCap,
    completionPercentage: 100,
  },
  {
    id: 'work-experience',
    title: 'Work Experience',
    description: 'Previous employment history and positions held',
    isComplete: true,
    icon: Briefcase,
    completionPercentage: 100,
  },
  {
    id: 'voluntary-work',
    title: 'Voluntary Work & Training',
    description: 'Civic organizations and professional development',
    isComplete: false,
    icon: Heart,
    completionPercentage: 60,
  },
  {
    id: 'other-info',
    title: 'Other Information',
    description: 'Special skills, recognition, membership in organizations',
    isComplete: true,
    icon: Award,
    completionPercentage: 100,
  },
];

const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    action: 'Updated Educational Background',
    section: 'Education',
    date: new Date('2025-10-10'),
    type: 'update',
  },
  {
    id: '2',
    action: 'Completed Personal Information section',
    section: 'Personal Info',
    date: new Date('2025-10-08'),
    type: 'update',
  },
  {
    id: '3',
    action: 'Created new PDS draft',
    date: new Date('2025-10-01'),
    type: 'create',
  },
];

// Memoized Components
const EmptyState = memo(function EmptyState() {
  return (
    <EnhancedBackground
      effect="dots"
      intensity="low"
      className="relative min-h-[70vh] flex items-center justify-center"
      respectReducedMotion>
      <motion.div
        className="max-w-2xl mx-auto text-center space-y-8 p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <motion.div
          className="relative w-32 h-32 mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-tup-crimson-light/20 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-tup-crimson-subtle to-tup-crimson-subtle dark:from-primary/60 dark:to-tup-crimson-dark/60">
            <FileText className="h-16 w-16 text-primary dark:text-tup-crimson-light" />
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Start Your Personal Data Sheet
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            The Personal Data Sheet (e-PDS) is a comprehensive record of your
            personal, educational, and professional information required by the
            Civil Service Commission.
          </p>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}>
          {[
            'Easy to fill out step-by-step',
            'Auto-save as you progress',
            'Digital signature support',
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>{feature}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}>
          <Link href="/dashboard/pds/create">
            <EnhancedButton variant="shimmer" size="lg" className="px-8 py-6">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First PDS
            </EnhancedButton>
          </Link>
        </motion.div>
      </motion.div>
    </EnhancedBackground>
  );
});

// Memoized Section Card
const SectionCard = memo(function SectionCard({
  section,
  index,
}: {
  section: PDSSection;
  index: number;
}) {
  const IconComponent = section.icon;

  return (
    <BlurFade delay={0.5 + index * 0.05} duration={0.4}>
      <EnhancedCard
        variant="magic"
        gradientSize={150}
        gradientOpacity={0.03}
        className="relative p-6 cursor-pointer hover:shadow-xl transition-all duration-300 h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300',
              section.isComplete
                ? 'bg-green-100 dark:bg-green-950/30'
                : 'bg-tup-crimson-subtle dark:bg-primary/30'
            )}>
            <IconComponent
              className={cn(
                'h-6 w-6',
                section.isComplete
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-primary dark:text-tup-crimson-light'
              )}
            />
          </div>
          <Badge
            className={
              section.isComplete
                ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
            }>
            {section.isComplete ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </>
            )}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {section.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {section.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Progress</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {section.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                section.isComplete
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                  : 'bg-gradient-tup'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${section.completionPercentage}%` }}
              transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
            />
          </div>
        </div>
      </EnhancedCard>
    </BlurFade>
  );
});

// Main Component
export default function PDSPage() {
  const { user } = useAuth();
  const { submissions, latest, loading, error } = usePds(user?.id || '');

  const hasExistingPDS = submissions.length > 0;

  // Memoized status badge renderer
  const getStatusBadge = useCallback(
    (
      status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reviewing'
    ): React.ReactNode => {
      const variants = {
        draft: {
          icon: Clock,
          label: 'Draft',
          className:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
        },
        submitted: {
          icon: Send,
          label: 'Submitted',
          className:
            'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
        },
        reviewing: {
          icon: Eye,
          label: 'Under Review',
          className:
            'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
        },
        approved: {
          icon: CheckCircle2,
          label: 'Approved',
          className:
            'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
        },
        rejected: {
          icon: AlertCircle,
          label: 'Rejected',
          className:
            'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
        },
      };

      const config = variants[status] || variants.draft;
      const IconComponent = config.icon;

      return (
        <Badge className={cn('font-semibold', config.className)}>
          <IconComponent className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
    []
  );

  // Memoized activity icon getter
  const getActivityIcon = useCallback((type: ActivityItem['type']): LucideIcon => {
    const icons = {
      create: Plus,
      update: Edit,
      submit: Send,
      approve: CheckCircle2,
    };
    return icons[type] || FileText;
  }, []);

  // Memoized completion data
  const completionData = useMemo(() => {
    if (!latest) return { percentage: 0, daysAgo: 0 };

    return {
      percentage: 85,
      daysAgo: Math.floor(
        (new Date().getTime() - new Date(latest.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    };
  }, [latest]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading PDS data...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Error Loading PDS
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!hasExistingPDS) {
    return <EmptyState />;
  }

  // Main Content
  return (
    <div className="relative space-y-8 pb-8">
      {/* Subtle Background Effect */}
      <EnhancedBackground
        effect="dots"
        intensity="low"
        className="fixed inset-0 -z-10"
        respectReducedMotion
      />

      {/* Page Header */}
      <BlurFade delay={0} duration={0.5}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AnimatedGradientText
                className="text-3xl sm:text-4xl font-bold"
                colorFrom="#8B1538"
                colorTo="#B8264D"
                speed={1.5}>
                Personal Data Sheet (e-PDS)
              </AnimatedGradientText>
              {latest && getStatusBadge(latest.status)}
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your personal information required by the Civil Service
              Commission
            </p>
          </div>

          <Link href="/dashboard/pds/edit">
            <EnhancedButton variant="shimmer" size="lg">
              <Edit className="h-4 w-4 mr-2" />
              Update PDS
            </EnhancedButton>
          </Link>
        </div>
      </BlurFade>

      {/* Status Overview Card */}
      <BlurFade delay={0.1} duration={0.5}>
        <EnhancedCard
          variant="magic"
          gradientSize={200}
          gradientOpacity={0.05}
          className="overflow-hidden p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Progress */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <TrendingUp className="h-4 w-4" />
                Completion Progress
              </div>
              <div className="flex items-end gap-2">
                <NumberTicker
                  value={completionData.percentage}
                  className="text-4xl font-bold text-slate-900 dark:text-slate-100"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  % Complete
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-tup rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionData.percentage}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Last Updated */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                Last Updated
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {latest &&
                  new Date(latest.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {completionData.daysAgo} days ago
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <FileCheck className="h-4 w-4" />
                Current Status
              </div>
              <div className="flex flex-col gap-3">
                {latest && getStatusBadge(latest.status)}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {latest?.status === 'draft' &&
                    'Continue editing and submit for review when ready'}
                  {latest?.status === 'submitted' &&
                    'Your PDS has been submitted for review'}
                  {latest?.status === 'reviewing' &&
                    'Your PDS is under review by HR personnel'}
                  {latest?.status === 'approved' &&
                    'Your PDS has been approved and is now official'}
                  {latest?.status === 'rejected' &&
                    'Please review feedback and resubmit'}
                </p>
              </div>
            </div>
          </div>
        </EnhancedCard>
      </BlurFade>

      {/* PDS Sections Grid */}
      <BlurFade delay={0.2} duration={0.5}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          PDS Sections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_PDS_SECTIONS.map((section, index) => (
            <SectionCard key={section.id} section={section} index={index} />
          ))}
        </div>
      </BlurFade>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <BlurFade delay={0.3} duration={0.5} className="lg:col-span-2">
          <InfoCard title="Quick Actions" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Link href="/dashboard/pds/view" className="w-full">
                <EnhancedButton variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Submissions
                </EnhancedButton>
              </Link>
              <Link href="/dashboard/pds/archive" className="w-full">
                <EnhancedButton variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  View Archive
                </EnhancedButton>
              </Link>
              <EnhancedButton variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </EnhancedButton>
              <EnhancedButton variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Print PDS
              </EnhancedButton>
              <EnhancedButton
                variant="shiny"
                className="w-full justify-start sm:col-span-2 md:col-span-1">
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </EnhancedButton>
            </div>
          </InfoCard>
        </BlurFade>

        {/* Recent Activity */}
        <BlurFade delay={0.35} duration={0.5}>
          <InfoCard title="Recent Activity" icon={Clock}>
            <div className="space-y-4">
              {MOCK_RECENT_ACTIVITY.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tup-crimson-subtle dark:bg-primary/30 flex-shrink-0">
                      <ActivityIcon className="h-4 w-4 text-primary dark:text-tup-crimson-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activity.action}
                      </p>
                      {activity.section && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {activity.section}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {activity.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </InfoCard>
        </BlurFade>
      </div>
    </div>
  );
}
