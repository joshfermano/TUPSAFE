'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { InfoCard, InfoItem } from '@/components/dashboard/InfoCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { MagicCard } from '@/components/ui/magic-card';
import { Particles } from '@/components/ui/particles';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mock Data Types
interface PDSStatus {
  completionPercentage: number;
  lastUpdated: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  hasSubmitted: boolean;
}

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

// Mock Data
const mockPDSStatus: PDSStatus = {
  completionPercentage: 85,
  lastUpdated: new Date('2025-10-10'),
  status: 'draft',
  hasSubmitted: true,
};

const mockPDSSections: PDSSection[] = [
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

const mockRecentActivity: ActivityItem[] = [
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

export default function PDSPage() {
  const [pdsStatus] = useState<PDSStatus>(mockPDSStatus);
  const [pdsSections] = useState<PDSSection[]>(mockPDSSections);
  const [recentActivity] = useState<ActivityItem[]>(mockRecentActivity);

  const hasExistingPDS = pdsStatus.hasSubmitted;

  const getStatusBadge = (status: PDSStatus['status']) => {
    const variants = {
      draft: {
        variant: 'secondary' as const,
        icon: Clock,
        label: 'Draft',
        className:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
      },
      submitted: {
        variant: 'default' as const,
        icon: Send,
        label: 'Submitted',
        className:
          'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      },
      approved: {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: 'Approved',
        className:
          'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
      },
      rejected: {
        variant: 'destructive' as const,
        icon: AlertCircle,
        label: 'Rejected',
        className: '',
      },
    };

    const config = variants[status];
    const IconComponent = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={cn('font-semibold', config.className)}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return Plus;
      case 'update':
        return Edit;
      case 'submit':
        return Send;
      case 'approve':
        return CheckCircle2;
      default:
        return FileText;
    }
  };

  // Empty State Component
  const EmptyState = () => (
    <div className="relative min-h-[70vh] flex items-center justify-center">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={40}
        ease={80}
        color="#8B1538"
        size={0.5}
        staticity={50}
        refresh={false}
      />
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] -z-10'
        )}
      />

      <motion.div
        className="max-w-2xl mx-auto text-center space-y-8 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <motion.div
          className="relative w-32 h-32 mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-950/60">
            <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400" />
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
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Easy to fill out step-by-step</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Auto-save as you progress</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Digital signature support</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}>
          <ShimmerButton
            className="shadow-2xl hover:shadow-3xl transition-all duration-300 px-8 py-6 text-base"
            shimmerColor="#ffffff"
            shimmerSize="0.1em"
            shimmerDuration="2s"
            borderRadius="0.75rem"
            background="linear-gradient(135deg, #8B1538 0%, #0066B3 50%, #004B87 100%)">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First PDS
          </ShimmerButton>
        </motion.div>
      </motion.div>
    </div>
  );

  // Main Content with Existing PDS
  if (!hasExistingPDS) {
    return <EmptyState />;
  }

  return (
    <div className="relative space-y-8 pb-8">
      {/* Animated Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        ease={80}
        color="#8B1538"
        size={0.6}
        staticity={45}
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

      {/* Page Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Personal Data Sheet (e-PDS)
            </h1>
            {getStatusBadge(pdsStatus.status)}
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your personal information required by the Civil Service
            Commission
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ShimmerButton
              className="h-11 px-6 shadow-lg shadow-blue-500/20"
              shimmerColor="#ffffff"
              shimmerSize="0.08em"
              shimmerDuration="2.5s"
              borderRadius="0.75rem"
              background="linear-gradient(135deg, #8B1538 0%, #0066B3 100%)">
              <Edit className="h-4 w-4 mr-2" />
              Update PDS
            </ShimmerButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Status Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}>
        <NeonGradientCard
          className="overflow-hidden"
          borderSize={2}
          borderRadius={16}
          neonColors={{
            firstColor: '#8B1538',
            secondColor: '#0066B3',
          }}>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Completion Progress */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4" />
                  Completion Progress
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                    {pdsStatus.completionPercentage}%
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Complete
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pdsStatus.completionPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
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
                  {pdsStatus.lastUpdated.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {Math.floor(
                    (new Date().getTime() - pdsStatus.lastUpdated.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days ago
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <FileCheck className="h-4 w-4" />
                  Current Status
                </div>
                <div className="flex flex-col gap-3">
                  {getStatusBadge(pdsStatus.status)}
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {pdsStatus.status === 'draft' &&
                      'Continue editing and submit for review when ready'}
                    {pdsStatus.status === 'submitted' &&
                      'Your PDS is under review by HR personnel'}
                    {pdsStatus.status === 'approved' &&
                      'Your PDS has been approved and is now official'}
                    {pdsStatus.status === 'rejected' &&
                      'Please review feedback and resubmit'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </NeonGradientCard>
      </motion.div>

      {/* PDS Sections Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          PDS Sections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdsSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4 }}>
              <MagicCard
                className="relative p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
                gradientSize={200}
                gradientColor="#8B1538"
                gradientOpacity={0.1}>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-lg',
                      section.isComplete
                        ? 'bg-green-100 dark:bg-green-950/30'
                        : 'bg-blue-100 dark:bg-blue-950/30'
                    )}>
                    <section.icon
                      className={cn(
                        'h-6 w-6',
                        section.isComplete
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-blue-600 dark:text-blue-400'
                      )}
                    />
                  </div>
                  {section.isComplete ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {section.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Progress
                    </span>
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
                          : 'bg-gradient-to-r from-[#8B1538] to-[#0066B3]'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${section.completionPercentage}%` }}
                      transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                    />
                  </div>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}>
          <InfoCard title="Quick Actions" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                <Eye className="h-4 w-4 mr-2" />
                View Full PDS
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all">
                <Printer className="h-4 w-4 mr-2" />
                Print PDS
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all">
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            </div>
          </InfoCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}>
          <InfoCard title="Recent Activity" icon={Clock}>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/30 flex-shrink-0">
                      <ActivityIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
        </motion.div>
      </div>
    </div>
  );
}
