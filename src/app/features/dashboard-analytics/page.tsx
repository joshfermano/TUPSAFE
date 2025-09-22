'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  ArrowRight,
  Building,
  Activity,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { cn } from '@/lib/utils';
import Link from 'next/link';


const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 pt-32 pb-20">
    {/* Background Pattern */}
    <div className="absolute inset-0 bg-grid-pattern opacity-30" />

    <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6">
          <Badge className="bg-[#093FB4]/10 text-[#093FB4] dark:bg-[#093FB4]/20 dark:text-blue-400 px-4 py-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 mr-2" />
            Research Feature
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Dashboard & Analytics
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          Academic research implementation of comprehensive reporting and analytics with real-time 
          compliance metrics and organizational insights. This thesis project demonstrates data-driven 
          decision making with powerful visualization tools and government dashboards designed for 
          Philippine public administration research.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#093FB4] hover:bg-[#093FB4]/90 text-white px-8 py-4 text-lg">
            View Research Implementation
            <BarChart3 className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#093FB4] text-[#093FB4] hover:bg-[#093FB4] hover:text-white px-8 py-4 text-lg">
            Explore Study Components
            <BarChart3 className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Activity, label: 'Real-Time', value: 'Metrics' },
            { icon: PieChart, label: 'Custom', value: 'Reports' },
            { icon: TrendingUp, label: 'Performance', value: 'Analytics' },
          ].map((stat, index) => (
            <MagicCard
              key={stat.label}
              className="p-6 text-center"
              gradientColor="#F59E0B"
              gradientOpacity={0.1}>
              <stat.icon className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </MagicCard>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

const AnalyticsFeaturesSection = () => {
  const features = [
    {
      icon: Activity,
      title: 'Real-Time Compliance Metrics',
      description:
        'Monitor compliance status across your organization with live dashboards and instant alerts.',
      benefits: [
        'Live compliance tracking',
        'Instant alert notifications',
        'Department-level metrics',
        'Trend analysis',
      ],
    },
    {
      icon: FileText,
      title: 'Custom Report Generation',
      description:
        'Create tailored reports for different stakeholders with flexible formatting and scheduling.',
      benefits: [
        'Drag-and-drop report builder',
        'Automated scheduling',
        'Multiple export formats',
        'Stakeholder-specific views',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description:
        'Deep insights into organizational performance with predictive analytics and benchmarking.',
      benefits: [
        'Performance benchmarking',
        'Predictive analytics',
        'Efficiency metrics',
        'Comparative analysis',
      ],
    },
    {
      icon: Building,
      title: 'Executive Dashboards',
      description:
        'High-level dashboards designed for executives with strategic insights and KPI monitoring.',
      benefits: [
        'Strategic KPI tracking',
        'Executive summaries',
        'Visual data storytelling',
        'Mobile-optimized views',
      ],
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Research Analytics Implementation Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic demonstration of powerful analytics tools designed to provide actionable 
            insights for Philippine government decision-making and digital transformation research.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <NeonGradientCard
                className="h-full p-8"
                borderSize={2}
                borderRadius={16}
                neonColors={{ firstColor: '#F59E0B', secondColor: '#D97706' }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <feature.icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </NeonGradientCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DashboardPreviewSection = () => (
  <section className="py-20 bg-gray-50 dark:bg-gray-900">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Interactive Dashboard Preview
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Experience the power of data visualization with our comprehensive
          dashboard interface.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Compliance Overview Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time insights into organizational compliance status
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Compliance Rate',
              value: '94.2%',
              change: '+2.1%',
              icon: CheckCircle,
              color: 'green',
            },
            {
              title: 'Pending Reviews',
              value: '127',
              change: '-15',
              icon: Clock,
              color: 'yellow',
            },
            {
              title: 'Overdue Items',
              value: '8',
              change: '-3',
              icon: AlertCircle,
              color: 'red',
            },
            {
              title: 'Active Users',
              value: '1,247',
              change: '+89',
              icon: Users,
              color: 'blue',
            },
          ].map((metric, index) => (
            <MagicCard
              key={metric.title}
              className="p-4"
              gradientColor="#F59E0B"
              gradientOpacity={0.05}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs mt-1',
                      metric.color === 'green' && 'text-green-600',
                      metric.color === 'yellow' && 'text-yellow-600',
                      metric.color === 'red' && 'text-red-600',
                      metric.color === 'blue' && 'text-blue-600'
                    )}>
                    {metric.change.startsWith('+') ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    metric.color === 'green' &&
                      'bg-green-100 dark:bg-green-900/30',
                    metric.color === 'yellow' &&
                      'bg-yellow-100 dark:bg-yellow-900/30',
                    metric.color === 'red' && 'bg-red-100 dark:bg-red-900/30',
                    metric.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30'
                  )}>
                  <metric.icon
                    className={cn(
                      'h-5 w-5',
                      metric.color === 'green' &&
                        'text-green-600 dark:text-green-400',
                      metric.color === 'yellow' &&
                        'text-yellow-600 dark:text-yellow-400',
                      metric.color === 'red' &&
                        'text-red-600 dark:text-red-400',
                      metric.color === 'blue' &&
                        'text-blue-600 dark:text-blue-400'
                    )}
                  />
                </div>
              </div>
            </MagicCard>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Submission Trends
              </h4>
              <LineChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Interactive line chart visualization
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Department Breakdown
              </h4>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-48 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Interactive pie chart visualization
              </p>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  </section>
);

const ReportingCapabilitiesSection = () => {
  const reportTypes = [
    {
      title: 'Compliance Reports',
      description:
        'Comprehensive compliance status reports for auditors and management',
      icon: CheckCircle,
      features: [
        'Compliance scorecards',
        'Exception reports',
        'Trend analysis',
        'Risk assessments',
      ],
    },
    {
      title: 'Performance Reports',
      description:
        'Organizational performance metrics and efficiency indicators',
      icon: TrendingUp,
      features: [
        'KPI dashboards',
        'Efficiency metrics',
        'Benchmarking',
        'Goal tracking',
      ],
    },
    {
      title: 'Operational Reports',
      description: 'Day-to-day operational insights and workflow analytics',
      icon: Activity,
      features: [
        'Workflow analytics',
        'Processing times',
        'Bottleneck analysis',
        'Resource utilization',
      ],
    },
    {
      title: 'Executive Reports',
      description: 'High-level strategic reports for executive decision-making',
      icon: Award,
      features: [
        'Executive summaries',
        'Strategic metrics',
        'ROI analysis',
        'Risk management',
      ],
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Research Reporting Capabilities Implementation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study demonstrating detailed reporting capabilities tailored to different 
            government stakeholders and administrative decision-making needs in Philippine public service.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reportTypes.map((report, index) => (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <Card className="p-8 h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <report.icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {report.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {report.description}
                </p>

                <div className="space-y-3">
                  {report.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const VisualizationTypesSection = () => {
  const visualizations = [
    {
      title: 'Bar Charts',
      icon: BarChart3,
      description: 'Compare data across categories',
    },
    {
      title: 'Line Charts',
      icon: LineChart,
      description: 'Track trends over time',
    },
    {
      title: 'Pie Charts',
      icon: PieChart,
      description: 'Show proportional data',
    },
    { title: 'Heat Maps', icon: Target, description: 'Visualize data density' },
    {
      title: 'Gauges',
      icon: Activity,
      description: 'Display performance metrics',
    },
    {
      title: 'Tables',
      icon: FileText,
      description: 'Detailed data presentation',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Rich Data Visualizations
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from a variety of visualization types to best represent your
            data and insights.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualizations.map((viz, index) => (
            <motion.div
              key={viz.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <MagicCard
                className="p-6 text-center h-full"
                gradientColor="#F59E0B"
                gradientOpacity={0.05}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
                  <viz.icon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {viz.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {viz.description}
                </p>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Automated reporting reduces manual effort by 90%',
      metric: '90%',
    },
    {
      icon: CheckCircle,
      title: 'Improve Accuracy',
      description: 'Real-time data ensures accuracy and reduces errors',
      metric: '99.9%',
    },
    {
      icon: TrendingUp,
      title: 'Better Decisions',
      description: 'Data-driven insights lead to improved outcomes',
      metric: '3x',
    },
    {
      icon: Users,
      title: 'Increase Transparency',
      description: 'Stakeholder access to relevant information',
      metric: '100%',
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Research Benefits & Academic Impact Study
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic analysis of the potential benefits of implementing comprehensive 
            analytics in Philippine government organizations through digital transformation research.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center">
              <MagicCard
                className="p-6 h-full"
                gradientColor="#F59E0B"
                gradientOpacity={0.05}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {benefit.metric}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-20 bg-gray-50 dark:bg-gray-900">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Thesis Research on Government Data Analytics
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          This academic prototype demonstrates how to transform government data into actionable insights 
          through comprehensive analytics and reporting. Research implementation supporting informed 
          decision-making and digital governance for Philippine public administration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            asChild
            size="lg"
            className="bg-[#093FB4] hover:bg-[#093FB4]/90 text-white px-8 py-4">
            <Link href="/auth/signup">
              View Research Implementation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#093FB4] text-[#093FB4] hover:bg-[#093FB4] hover:text-white px-8 py-4">
            <Link href="/features">
              Explore Study Components
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Real-Time Data</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span>Rich Visualizations</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-purple-500" />
            <span>Export Ready</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default function DashboardAnalyticsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <AnalyticsFeaturesSection />
      <DashboardPreviewSection />
      <ReportingCapabilitiesSection />
      <VisualizationTypesSection />
      <BenefitsSection />
      <CTASection />
    </div>
  );
}
