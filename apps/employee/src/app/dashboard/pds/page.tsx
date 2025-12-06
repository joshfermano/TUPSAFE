'use client';

// React and Next.js
import { useMemo, memo, useCallback } from 'react';
import Link from 'next/link';

// Motion and Animation
import { motion } from 'framer-motion';

// API Hooks
import { useAuth } from '../../../providers/AuthProvider';
import { usePds } from '@tupsafe/mock-data/api';
import { usePDSPdf } from '../../../hooks/usePDSPdf';
import { transformPdsForPdf } from '../../../lib/utils/pds-transformations';
import { toast } from 'sonner';

// Enhanced UI Components from shared-ui
import {
  NumberTicker,
  BlurFade,
  Badge,
  MagicCard,
  ShimmerButton,
  InteractiveHoverButton,
  BorderBeam,
  ShineBorder,
  AnimatedGradientText,
} from '@tupsafe/shared-ui';

// Local UI Components
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Tooltip } from '../../../components/ui/tooltip';
import { Progress } from '../../../components/ui/progress';

// Local Components
import { DeadlineSection } from '../../../components/dashboard/DeadlineSection';

// Utils
import { cn } from '../../../lib/utils';

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
  Loader2,
  Info,
  Users,
  BookOpen,
  Target,
  Bell,
  HelpCircle,
  ExternalLink,
  Activity,
  ChevronRight,
  Sparkles,
  Shield,
  ListChecks,
  BookMarked,
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
  type: 'create' | 'update' | 'submit' | 'approve' | 'review';
  icon: LucideIcon;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  href?: string;
  priority: 'high' | 'medium' | 'low';
}

// Constants - 9 PDS Sections as per CSC Format
const PDS_SECTIONS: PDSSection[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic biographical data and contact details',
    isComplete: true,
    icon: User,
    completionPercentage: 100,
  },
  {
    id: 'family-background',
    title: 'Family Background',
    description: 'Spouse and children information',
    isComplete: true,
    icon: Users,
    completionPercentage: 100,
  },
  {
    id: 'educational-background',
    title: 'Educational Background',
    description: 'Elementary, secondary, vocational, college, graduate studies',
    isComplete: true,
    icon: GraduationCap,
    completionPercentage: 100,
  },
  {
    id: 'civil-service',
    title: 'Civil Service Eligibility',
    description: 'Government examinations and professional licenses',
    isComplete: true,
    icon: Shield,
    completionPercentage: 100,
  },
  {
    id: 'work-experience',
    title: 'Work Experience',
    description: 'Employment history and positions held',
    isComplete: true,
    icon: Briefcase,
    completionPercentage: 100,
  },
  {
    id: 'voluntary-work',
    title: 'Voluntary Work',
    description: 'Civic and non-government organization involvement',
    isComplete: false,
    icon: Heart,
    completionPercentage: 60,
  },
  {
    id: 'learning-development',
    title: 'Learning & Development',
    description: 'Training programs and seminars attended',
    isComplete: true,
    icon: BookOpen,
    completionPercentage: 100,
  },
  {
    id: 'other-info',
    title: 'Other Information',
    description: 'Special skills, recognition, organization membership',
    isComplete: true,
    icon: Award,
    completionPercentage: 100,
  },
  {
    id: 'references',
    title: 'References',
    description: 'Character references (not relatives)',
    isComplete: true,
    icon: ListChecks,
    completionPercentage: 100,
  },
];

// Mock Recent Activity
const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    action: 'PDS approved by HR',
    date: new Date('2025-12-05'),
    type: 'approve',
    icon: CheckCircle2,
  },
  {
    id: '2',
    action: 'Under review by admin',
    section: 'All Sections',
    date: new Date('2025-12-03'),
    type: 'review',
    icon: Eye,
  },
  {
    id: '3',
    action: 'Updated Educational Background',
    section: 'Education',
    date: new Date('2025-10-10'),
    type: 'update',
    icon: Edit,
  },
  {
    id: '4',
    action: 'Completed Personal Information section',
    section: 'Personal Info',
    date: new Date('2025-10-08'),
    type: 'update',
    icon: CheckCircle2,
  },
  {
    id: '5',
    action: 'Created new PDS draft',
    date: new Date('2025-10-01'),
    type: 'create',
    icon: Plus,
  },
];

// Memoized Components
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      <BlurFade delay={0.1}>
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 blur-xl" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <FileText className="h-12 w-12 text-primary" />
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="text-center space-y-3 max-w-md">
          <AnimatedGradientText className="text-2xl font-bold">
            Start Your Personal Data Sheet
          </AnimatedGradientText>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The Personal Data Sheet (e-PDS) is a comprehensive record of your
            personal, educational, and professional information required by the
            Civil Service Commission.
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.3}>
        <Link href="/dashboard/pds/create">
          <ShimmerButton className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First PDS
          </ShimmerButton>
        </Link>
      </BlurFade>
    </div>
  );
});

// Stats Card Component
const StatsCard = memo(function StatsCard({
  title,
  value,
  suffix,
  icon: Icon,
  delay,
  color = 'primary',
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  delay: number;
  color?: 'primary' | 'green' | 'blue' | 'amber';
}) {
  const colorStyles = {
    primary: {
      bg: 'bg-primary/10 dark:bg-primary/20',
      text: 'text-primary',
      gradient: 'from-primary/5 to-primary/10',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-950/30',
      text: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-50 to-green-100',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-50 to-blue-100',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-50 to-amber-100',
    },
  };

  const style = colorStyles[color];

  return (
    <BlurFade delay={delay}>
      <MagicCard className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              style.bg
            )}>
            <Icon className={cn('h-5 w-5', style.text)} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <NumberTicker
              value={value}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            />
            {suffix && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </MagicCard>
    </BlurFade>
  );
});

// Section Progress Card
const SectionProgressCard = memo(function SectionProgressCard({
  section,
  index,
}: {
  section: PDSSection;
  index: number;
}) {
  const IconComponent = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}>
      <Card className="h-full border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                section.isComplete
                  ? 'bg-green-100 dark:bg-green-950/30'
                  : 'bg-amber-100 dark:bg-amber-950/30'
              )}>
              <IconComponent
                className={cn(
                  'h-5 w-5',
                  section.isComplete
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                )}
              />
            </div>
            <Badge
              className={cn(
                'text-xs',
                section.isComplete
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
              )}>
              {section.isComplete ? 'Complete' : 'In Progress'}
            </Badge>
          </div>

          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {section.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
            {section.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Progress
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {section.completionPercentage}%
              </span>
            </div>
            <div className="relative h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  section.isComplete
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${section.completionPercentage}%` }}
                transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Activity Item Component
const ActivityItemCard = memo(function ActivityItemCard({
  activity,
  index,
}: {
  activity: ActivityItem;
  index: number;
}) {
  const Icon = activity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
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
});

// Next Steps Component
const NextStepsCard = memo(function NextStepsCard({
  status,
}: {
  status: string;
}) {
  const getNextSteps = useCallback((): NextStep[] => {
    switch (status) {
      case 'draft':
        return [
          {
            id: '1',
            title: 'Complete all sections',
            description: 'Ensure all 9 sections are filled out completely',
            priority: 'high',
          },
          {
            id: '2',
            title: 'Review your information',
            description: 'Double-check all entered data for accuracy',
            action: 'Review',
            href: '/dashboard/pds/view',
            priority: 'high',
          },
          {
            id: '3',
            title: 'Submit for approval',
            description: 'Send your PDS to HR for review',
            action: 'Submit',
            priority: 'medium',
          },
        ];
      case 'submitted':
      case 'reviewing':
        return [
          {
            id: '1',
            title: 'Wait for review',
            description: 'HR is currently reviewing your submission',
            priority: 'medium',
          },
          {
            id: '2',
            title: 'Check for updates',
            description: 'Monitor your notifications for feedback',
            priority: 'low',
          },
        ];
      case 'rejected':
        return [
          {
            id: '1',
            title: 'Review feedback',
            description: 'Check the rejection reason from HR',
            priority: 'high',
          },
          {
            id: '2',
            title: 'Make corrections',
            description: 'Update the required sections',
            action: 'Edit',
            href: '/dashboard/pds/edit',
            priority: 'high',
          },
          {
            id: '3',
            title: 'Resubmit',
            description: 'Submit your corrected PDS',
            priority: 'medium',
          },
        ];
      case 'approved':
        return [
          {
            id: '1',
            title: 'Download PDF',
            description: 'Get your official PDS document',
            action: 'Download',
            priority: 'medium',
          },
          {
            id: '2',
            title: 'Keep updated',
            description: 'Update your PDS when information changes',
            priority: 'low',
          },
        ];
      default:
        return [];
    }
  }, [status]);

  const steps = getNextSteps();

  return (
    <BlurFade delay={0.5}>
      <MagicCard className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Next Steps
          </h3>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'p-3 rounded-lg border',
                step.priority === 'high'
                  ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20'
                  : step.priority === 'medium'
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
              )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {step.title}
                    </span>
                    {step.priority === 'high' && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs px-1.5 py-0">
                        Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
                {step.action && step.href && (
                  <Link href={step.href}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs">
                      {step.action}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </MagicCard>
    </BlurFade>
  );
});

// Help Resources Component
const HelpResourcesCard = memo(function HelpResourcesCard() {
  const resources = [
    {
      id: '1',
      title: 'CSC Guidelines',
      description: 'Official PDS instructions',
      icon: BookMarked,
      href: 'https://www.csc.gov.ph',
    },
    {
      id: '2',
      title: 'Video Tutorial',
      description: 'How to fill out your PDS',
      icon: Eye,
      href: '#',
    },
    {
      id: '3',
      title: 'FAQ',
      description: 'Common questions answered',
      icon: HelpCircle,
      href: '#',
    },
    {
      id: '4',
      title: 'Contact Support',
      description: 'Get help from HR',
      icon: Activity,
      href: '#',
    },
  ];

  return (
    <BlurFade delay={0.6}>
      <MagicCard className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Help & Resources
          </h3>
        </div>

        <div className="space-y-2">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Link
                key={resource.id}
                href={resource.href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {resource.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {resource.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-600 group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </MagicCard>
    </BlurFade>
  );
});

// Submission History Timeline
const SubmissionHistoryTimeline = memo(function SubmissionHistoryTimeline({
  submissions,
}: {
  submissions: any[];
}) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">
        No submission history available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.slice(0, 5).map((submission, index) => (
        <motion.div
          key={submission.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-colors">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                PDS v{submission.version}
              </p>
              <Badge
                className={cn(
                  'text-xs',
                  submission.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                    : submission.status === 'rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      : submission.status === 'reviewing'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
                        : submission.status === 'submitted'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                )}>
                {submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {new Date(submission.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {submission.status === 'approved' && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// Main Component
export default function PDSPage() {
  const { user } = useAuth();
  const { submissions, latest, getCompleteSubmission, loading, error } = usePds(
    user?.id || ''
  );
  const { downloadPDF, openPDFInNewTab, isGenerating } = usePDSPdf();

  const hasExistingPDS = submissions.length > 0;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!hasExistingPDS || !latest) {
      return {
        completionPercentage: 0,
        totalSubmissions: 0,
        pendingReviews: 0,
        approvalRate: 0,
      };
    }

    const totalSubmissions = submissions.length;
    const approvedCount = submissions.filter((s) => s.status === 'approved')
      .length;
    const pendingReviews = submissions.filter(
      (s) => s.status === 'submitted' || s.status === 'reviewing'
    ).length;

    // Calculate completion based on sections
    const completedSections = PDS_SECTIONS.filter((s) => s.isComplete).length;
    const completionPercentage = Math.round(
      (completedSections / PDS_SECTIONS.length) * 100
    );

    const approvalRate =
      totalSubmissions > 0
        ? Math.round((approvedCount / totalSubmissions) * 100)
        : 0;

    return {
      completionPercentage,
      totalSubmissions,
      pendingReviews,
      approvalRate,
    };
  }, [hasExistingPDS, latest, submissions]);

  // Check if deadline is urgent (< 7 days)
  const isDeadlineUrgent = useMemo(() => {
    // Mock deadline check - replace with actual deadline logic
    const mockDeadline = new Date('2025-12-15');
    const today = new Date();
    const daysRemaining = Math.ceil(
      (mockDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining > 0 && daysRemaining < 7;
  }, []);

  // Check if PDF download/print is allowed (only when approved)
  const canDownloadPDF = latest?.status === 'approved';

  // Get status-specific message for PDF restriction
  const getPdfRestrictionMessage = useCallback(() => {
    switch (latest?.status) {
      case 'draft':
        return 'Please submit your PDS for approval first';
      case 'submitted':
      case 'reviewing':
        return 'PDF will be available after admin approval';
      case 'rejected':
        return 'Please address feedback and resubmit for approval';
      default:
        return 'PDF available after admin approval';
    }
  }, [latest?.status]);

  // Handler for downloading the latest PDS as PDF
  const handleDownloadPDF = useCallback(async () => {
    if (!latest) {
      toast.error('No PDS available', {
        description: 'Please create a PDS first.',
      });
      return;
    }

    const pdsData = getCompleteSubmission(latest.id);
    if (!pdsData) {
      toast.error('PDS data not available', {
        description: 'Unable to generate PDF. Please try again.',
      });
      return;
    }

    try {
      const pdfData = transformPdsForPdf({
        ...pdsData,
        id: latest.id,
        submittedAt: latest.submittedAt,
        version: latest.version,
      });

      toast.loading('Generating PDF...', { id: 'pdf-download' });
      await downloadPDF(pdfData);
      toast.success('PDF downloaded successfully', {
        id: 'pdf-download',
        description: `PDS_${pdfData.personalInfo.surname}_${pdfData.personalInfo.firstName}.pdf`,
      });
    } catch (err) {
      toast.error('Failed to generate PDF', {
        id: 'pdf-download',
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }, [latest, getCompleteSubmission, downloadPDF]);

  // Handler for printing the latest PDS (opens in new tab)
  const handlePrintPDS = useCallback(async () => {
    if (!latest) {
      toast.error('No PDS available', {
        description: 'Please create a PDS first.',
      });
      return;
    }

    const pdsData = getCompleteSubmission(latest.id);
    if (!pdsData) {
      toast.error('PDS data not available', {
        description: 'Unable to generate PDF for printing. Please try again.',
      });
      return;
    }

    try {
      const pdfData = transformPdsForPdf({
        ...pdsData,
        id: latest.id,
        submittedAt: latest.submittedAt,
        version: latest.version,
      });

      toast.loading('Preparing print preview...', { id: 'pdf-print' });
      await openPDFInNewTab(pdfData);
      toast.success('PDF opened in new tab', {
        id: 'pdf-print',
        description:
          'Use the browser print function (Ctrl+P / Cmd+P) to print.',
      });
    } catch (err) {
      toast.error('Failed to open print preview', {
        id: 'pdf-print',
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }, [latest, getCompleteSubmission, openPDFInNewTab]);

  // Memoized status badge renderer
  const getStatusBadge = useCallback(
    (
      status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reviewing',
      size: 'default' | 'large' = 'default'
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
        <Badge
          className={cn(
            'font-semibold',
            size === 'large' && 'px-4 py-2 text-base',
            config.className
          )}>
          <IconComponent
            className={cn('mr-1', size === 'large' ? 'h-5 w-5' : 'h-3 w-3')}
          />
          {config.label}
        </Badge>
      );
    },
    []
  );

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

  // Main Content
  return (
    <div className="space-y-6 pb-8">
      {/* 1. Page Header */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <AnimatedGradientText className="text-3xl sm:text-4xl font-bold">
              Personal Data Sheet (e-PDS)
            </AnimatedGradientText>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your personal information required by the Civil Service
              Commission
            </p>
          </div>
          {latest && (
            <div className="flex items-center gap-3">
              {getStatusBadge(latest.status, 'large')}
              <div className="text-right">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Last updated
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {new Date(latest.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </BlurFade>

      {/* Empty State - Show when no PDS exists */}
      {!hasExistingPDS ? (
        <EmptyState />
      ) : (
        <>
          {/* 2. Deadline Alert Banner (Conditional) */}
          {isDeadlineUrgent && (
            <BlurFade delay={0.15}>
              <ShineBorder
                borderWidth={2}
                duration={5}
                shineColor={['#ef4444', '#f97316', '#ef4444']}
                className="rounded-xl">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-5 rounded-xl">
                  <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 flex-shrink-0">
                        <Bell className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-1">
                          Deadline Approaching
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Only{' '}
                          <NumberTicker
                            value={6}
                            className="inline-block font-bold text-red-600 dark:text-red-400"
                          />{' '}
                          days remaining to submit your PDS
                        </p>
                      </div>
                    </div>
                    <ShimmerButton
                      className="gap-2"
                      background="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                      shimmerColor="#fca5a5">
                      <Send className="h-4 w-4" />
                      Submit Now
                    </ShimmerButton>
                  </div>
                </div>
              </ShineBorder>
            </BlurFade>
          )}

          {/* Deadline Section - Persistent */}
          <DeadlineSection formType="pds" />

          {/* 3. Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Completion"
              value={stats.completionPercentage}
              suffix="%"
              icon={TrendingUp}
              delay={0.2}
              color="primary"
            />
            <StatsCard
              title="Total Submissions"
              value={stats.totalSubmissions}
              icon={FileText}
              delay={0.25}
              color="blue"
            />
            <StatsCard
              title="Pending Reviews"
              value={stats.pendingReviews}
              icon={Clock}
              delay={0.3}
              color="amber"
            />
            <StatsCard
              title="Approval Rate"
              value={stats.approvalRate}
              suffix="%"
              icon={CheckCircle2}
              delay={0.35}
              color="green"
            />
          </div>

          {/* 4. Enhanced Quick Actions Panel */}
          <BlurFade delay={0.4}>
            <MagicCard className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <Link href="/dashboard/pds/create" className="w-full">
                  <ShimmerButton className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create New PDS
                  </ShimmerButton>
                </Link>

                <Link href="/dashboard/pds/view" className="w-full">
                  <InteractiveHoverButton className="w-full">
                    <Eye className="h-4 w-4 mr-2 inline" />
                    View Submissions
                  </InteractiveHoverButton>
                </Link>

                <Link href="/dashboard/pds/archive" className="w-full">
                  <InteractiveHoverButton className="w-full border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                    <Archive className="h-4 w-4 mr-2 inline" />
                    View Archive
                  </InteractiveHoverButton>
                </Link>

                <Tooltip
                  content={getPdfRestrictionMessage()}
                  disabled={canDownloadPDF}>
                  <Button
                    onClick={canDownloadPDF ? handleDownloadPDF : undefined}
                    disabled={isGenerating || !latest || !canDownloadPDF}
                    variant="outline"
                    className={cn(
                      'w-full border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      canDownloadPDF &&
                        'hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                    )}>
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </Tooltip>

                <Tooltip
                  content={getPdfRestrictionMessage()}
                  disabled={canDownloadPDF}>
                  <Button
                    onClick={canDownloadPDF ? handlePrintPDS : undefined}
                    disabled={isGenerating || !latest || !canDownloadPDF}
                    variant="outline"
                    className={cn(
                      'w-full border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      canDownloadPDF &&
                        'hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                    )}>
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Print PDS
                  </Button>
                </Tooltip>
              </div>

              {/* PDF Restriction Notice */}
              {!canDownloadPDF && latest && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-3 pl-1">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>{getPdfRestrictionMessage()}</span>
                </div>
              )}
            </MagicCard>
          </BlurFade>

          {/* Main Grid (2/3 + 1/3) */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* 5. Current Status Card */}
              <BlurFade delay={0.45}>
                <div className="relative">
                  <MagicCard className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <BorderBeam
                      size={250}
                      duration={12}
                      delay={0}
                      colorFrom="var(--primary)"
                      colorTo="var(--tup-crimson-dark)"
                    />

                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                        <FileCheck className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Current Status
                      </h3>
                    </div>

                    {latest && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(latest.status, 'large')}
                            {latest.status === 'reviewing' && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: 'linear',
                                }}>
                                <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </motion.div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Version {latest.version}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              Last updated{' '}
                              {new Date(latest.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                              Overall Progress
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {stats.completionPercentage}%
                            </span>
                          </div>
                          <Progress
                            value={stats.completionPercentage}
                            className="h-3"
                          />
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {latest.status === 'draft' &&
                              'Continue editing and submit for review when ready. Ensure all sections are complete and accurate.'}
                            {latest.status === 'submitted' &&
                              'Your PDS has been submitted for review. HR will review your submission shortly.'}
                            {latest.status === 'reviewing' &&
                              'Your PDS is currently under review by HR personnel. You will be notified once the review is complete.'}
                            {latest.status === 'approved' &&
                              'Congratulations! Your PDS has been approved and is now official. You can download or print your approved PDS.'}
                            {latest.status === 'rejected' &&
                              'Your PDS requires revisions. Please review the feedback from HR and make the necessary corrections before resubmitting.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </MagicCard>
                </div>
              </BlurFade>

              {/* 6. PDS Sections Progress Grid */}
              <BlurFade delay={0.5}>
                <MagicCard className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      PDS Sections
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PDS_SECTIONS.map((section, index) => (
                      <SectionProgressCard
                        key={section.id}
                        section={section}
                        index={index}
                      />
                    ))}
                  </div>
                </MagicCard>
              </BlurFade>

              {/* 7. Submission History Timeline */}
              <BlurFade delay={0.55}>
                <MagicCard className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Submission History
                      </h3>
                    </div>
                    <Link href="/dashboard/pds/view">
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <SubmissionHistoryTimeline submissions={submissions} />
                </MagicCard>
              </BlurFade>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* 8. Activity Feed */}
              <BlurFade delay={0.6}>
                <div className="sticky top-6">
                  <MagicCard className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Recent Activity
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {MOCK_RECENT_ACTIVITY.map((activity, index) => (
                        <ActivityItemCard
                          key={activity.id}
                          activity={activity}
                          index={index}
                        />
                      ))}
                    </div>
                  </MagicCard>
                </div>
              </BlurFade>

              {/* 9. Next Steps/Recommendations */}
              <NextStepsCard status={latest?.status || 'draft'} />

              {/* 10. Help & Resources */}
              <HelpResourcesCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
