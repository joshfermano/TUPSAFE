'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
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
  Landmark,
  Home,
  Car,
  Wallet,
  CreditCard,
  Building2,
  TrendingUp,
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
  DollarSign,
  Percent,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mock Data Types
interface SALNStatus {
  year: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  lastUpdated: Date;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  hasSubmitted: boolean;
}

interface SALNSection {
  id: string;
  title: string;
  description: string;
  amount: number;
  isComplete: boolean;
  icon: LucideIcon;
  items: number;
}

interface ActivityItem {
  id: string;
  action: string;
  section?: string;
  date: Date;
  type: 'create' | 'update' | 'submit' | 'approve';
}

interface YearSummary {
  year: number;
  netWorth: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

// Mock Data
const mockSALNStatus: SALNStatus = {
  year: 2025,
  status: 'draft',
  lastUpdated: new Date('2025-10-10'),
  netWorth: 4850000,
  totalAssets: 6500000,
  totalLiabilities: 1650000,
  hasSubmitted: true,
};

const mockSALNSections: SALNSection[] = [
  {
    id: 'real-property',
    title: 'Real Property',
    description: 'Land, buildings, and improvements',
    amount: 3500000,
    isComplete: true,
    icon: Home,
    items: 2,
  },
  {
    id: 'personal-property',
    title: 'Personal Property',
    description: 'Vehicles, jewelry, and other valuables',
    amount: 1200000,
    isComplete: true,
    icon: Car,
    items: 3,
  },
  {
    id: 'cash-investments',
    title: 'Cash & Investments',
    description: 'Bank deposits, stocks, bonds',
    amount: 1800000,
    isComplete: true,
    icon: Wallet,
    items: 5,
  },
  {
    id: 'liabilities',
    title: 'Liabilities',
    description: 'Loans, mortgages, and other debts',
    amount: 1650000,
    isComplete: false,
    icon: CreditCard,
    items: 2,
  },
  {
    id: 'business-interests',
    title: 'Business Interests',
    description: 'Financial interests in businesses',
    amount: 0,
    isComplete: true,
    icon: Building2,
    items: 0,
  },
];

const mockRecentActivity: ActivityItem[] = [
  {
    id: '1',
    action: 'Updated Real Property values',
    section: 'Assets',
    date: new Date('2025-10-10'),
    type: 'update',
  },
  {
    id: '2',
    action: 'Added new vehicle entry',
    section: 'Personal Property',
    date: new Date('2025-10-08'),
    type: 'update',
  },
  {
    id: '3',
    action: 'Created SALN for 2025',
    date: new Date('2025-10-01'),
    type: 'create',
  },
];

const mockYearSummaries: YearSummary[] = [
  { year: 2025, netWorth: 4850000, status: 'draft' },
  { year: 2024, netWorth: 4200000, status: 'approved' },
  { year: 2023, netWorth: 3800000, status: 'approved' },
];

export default function SalnPage() {
  const [salnStatus] = useState<SALNStatus>(mockSALNStatus);
  const [salnSections] = useState<SALNSection[]>(mockSALNSections);
  const [recentActivity] = useState<ActivityItem[]>(mockRecentActivity);
  const [yearSummaries] = useState<YearSummary[]>(mockYearSummaries);

  const hasExistingSALN = salnStatus.hasSubmitted;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: SALNStatus['status']) => {
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
        return Landmark;
    }
  };

  const getNetWorthChange = () => {
    if (yearSummaries.length < 2) return null;
    const currentYear = yearSummaries[0];
    const previousYear = yearSummaries[1];
    const change = currentYear.netWorth - previousYear.netWorth;
    const percentChange = (change / previousYear.netWorth) * 100;
    return { change, percentChange, isPositive: change >= 0 };
  };

  const netWorthChange = getNetWorthChange();

  // Empty State Component
  const EmptyState = () => (
    <div className="relative min-h-[70vh] flex items-center justify-center">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={40}
        ease={80}
        color="#0066B3"
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
            className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/60 dark:to-purple-950/60">
            <Landmark className="h-16 w-16 text-indigo-600 dark:text-indigo-400" />
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Start Your Statement of Assets
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            The Statement of Assets, Liabilities, and Net Worth (e-SALN) is your
            annual financial disclosure required for transparency and
            accountability.
          </p>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Automatic net worth calculation</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Track assets and liabilities</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Secure and confidential</span>
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
            background="linear-gradient(135deg, #0066B3 0%, #004B87 50%, #003461 100%)">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First SALN
          </ShimmerButton>
        </motion.div>
      </motion.div>
    </div>
  );

  // Main Content with Existing SALN
  if (!hasExistingSALN) {
    return <EmptyState />;
  }

  return (
    <div className="relative space-y-8 pb-8">
      {/* Animated Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        ease={80}
        color="#0066B3"
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
              e-SALN {salnStatus.year}
            </h1>
            {getStatusBadge(salnStatus.status)}
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Statement of Assets, Liabilities, and Net Worth
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <ShimmerButton
              className="h-11 px-6 shadow-lg shadow-indigo-500/20"
              shimmerColor="#ffffff"
              shimmerSize="0.08em"
              shimmerDuration="2.5s"
              borderRadius="0.75rem"
              background="linear-gradient(135deg, #0066B3 0%, #004B87 100%)">
              <Edit className="h-4 w-4 mr-2" />
              Update SALN
            </ShimmerButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Net Worth Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}>
        <NeonGradientCard
          className="overflow-hidden"
          borderSize={2}
          borderRadius={16}
          neonColors={{
            firstColor: '#0066B3',
            secondColor: '#004B87',
          }}>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Net Worth */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <BarChart3 className="h-4 w-4" />
                  Net Worth
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(salnStatus.netWorth)}
                  </span>
                </div>
                {netWorthChange && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      netWorthChange.isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                    {netWorthChange.isPositive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>
                      {netWorthChange.isPositive ? '+' : ''}
                      {formatCurrency(netWorthChange.change)} (
                      {netWorthChange.percentChange.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Total Assets */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4" />
                  Total Assets
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(salnStatus.totalAssets)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Real property, personal property, and investments
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CreditCard className="h-4 w-4" />
                  Total Liabilities
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(salnStatus.totalLiabilities)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Loans, mortgages, and other obligations
                </div>
              </div>
            </div>
          </div>
        </NeonGradientCard>
      </motion.div>

      {/* SALN Sections Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          SALN Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salnSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4 }}>
              <MagicCard
                className="relative p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
                gradientSize={200}
                gradientColor="#0066B3"
                gradientOpacity={0.1}>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-lg',
                      section.isComplete
                        ? 'bg-green-100 dark:bg-green-950/30'
                        : 'bg-indigo-100 dark:bg-indigo-950/30'
                    )}>
                    <section.icon
                      className={cn(
                        'h-6 w-6',
                        section.isComplete
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-[#0066B3] dark:text-[#0066B3]'
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

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(section.amount)}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {section.items} {section.items === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Year Summaries and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Year Summaries */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}>
          <InfoCard title="Historical Overview" icon={Calendar}>
            <div className="space-y-4">
              {yearSummaries.map((summary, index) => (
                <motion.div
                  key={summary.year}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50">
                      <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        SALN {summary.year}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatCurrency(summary.netWorth)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(summary.status)}
                </motion.div>
              ))}
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex-shrink-0">
                      <ActivityIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}>
        <InfoCard title="Quick Actions" icon={Landmark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="w-full justify-start hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all">
              <Eye className="h-4 w-4 mr-2" />
              View Full SALN
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
              Print SALN
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
              <Send className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </InfoCard>
      </motion.div>
    </div>
  );
}
