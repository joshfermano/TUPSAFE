'use client';

// React and Next.js
import { useMemo, memo, useCallback } from 'react';
import Link from 'next/link';

// Motion and Animation
import { motion } from 'framer-motion';

// API Hooks
import { useAuth, usePds } from '@tupsafe/mock-data/api';

// Enhanced UI Components from shared-ui
import {
  NumberTicker,
  BlurFade,
  Badge,
} from '@tupsafe/shared-ui';

// Local UI Components
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
      {/* Icon Container */}
      <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800">
        <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Text Content */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Start Your Personal Data Sheet
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The Personal Data Sheet (e-PDS) is a comprehensive record of your
          personal, educational, and professional information required by the
          Civil Service Commission.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link href="/dashboard/pds/create">
          <Button className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
            <Plus className="h-4 w-4" />
            Create Your First PDS
          </Button>
        </Link>
      </div>
    </div>
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
    <Card className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all border-slate-200 dark:border-slate-800 h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300',
              'bg-white dark:bg-slate-800'
            )}>
            <IconComponent
              className={cn(
                'h-6 w-6',
                section.isComplete
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-red-500 dark:text-red-500'
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
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-tup'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${section.completionPercentage}%` }}
              transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <BlurFade delay={0.1} duration={0.5}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
                Personal Data Sheet (e-PDS)
              </h1>
              {latest && getStatusBadge(latest.status)}
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your personal information required by the Civil Service
              Commission
            </p>
          </div>


        </div>
      </BlurFade>

      {/* Quick Actions */}
      <BlurFade delay={0.2} duration={0.5}>
        <InfoCard title="Quick Actions" icon={FileText}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            <Link href="/dashboard/pds/view" className="w-full">
              <Button
                variant="outline"
                className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-primary/40 transition-colors">
                <Eye className="h-3.5 w-3.5 mr-2" />
                View Submissions
              </Button>
            </Link>
            <Link href="/dashboard/pds/archive" className="w-full">
              <Button
                variant="outline"
                className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                <Archive className="h-3.5 w-3.5 mr-2" />
                View Archive
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
              <Download className="h-3.5 w-3.5 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors">
              <Printer className="h-3.5 w-3.5 mr-2" />
              Print PDS
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-xs border-slate-200 dark:border-slate-700 hover:border-primary/40 transition-colors">
              <Send className="h-3.5 w-3.5 mr-2" />
              Submit for Review
            </Button>
          </div>
        </InfoCard>
      </BlurFade>

      {/* Status Overview Card */}
      <BlurFade delay={0.3} duration={0.5}>
        <Card className="border-slate-200 dark:border-slate-800 hover:border-primary/20 transition-colors">
          <CardContent className="p-5">
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
          </CardContent>
        </Card>
      </BlurFade>

      {/* PDS Sections Grid */}
      <BlurFade delay={0.4} duration={0.5}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            PDS Sections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PDS_SECTIONS.map((section, index) => (
              <SectionCard key={section.id} section={section} index={index} />
            ))}
          </div>
        </div>
      </BlurFade>

      {/* Historical Context and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Historical Context (if needed - placeholder for consistency) */}
        <BlurFade delay={0.5} duration={0.5} className="lg:col-span-2">
          <InfoCard title="Submission History" icon={Calendar}>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>View your complete PDS submission history and track changes over time.</p>
            </div>
          </InfoCard>
        </BlurFade>

        {/* Recent Activity */}
        <BlurFade delay={0.6} duration={0.5}>
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
