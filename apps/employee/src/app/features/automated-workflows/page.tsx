'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  GitBranch,
  Bell,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  UserCheck,
  Zap,
  Shield,
  FileText,
  Timer,
  Calendar,
  Target,
  TrendingUp,
  Layers,
  Filter,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950 pt-32 pb-20">
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
            <Settings className="h-4 w-4 mr-2" />
            Research Feature
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Automated Workflows
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          Academic research on transforming government processes through
          intelligent workflow automation. This thesis project demonstrates
          custom approval chains, automated deadline management, and progress
          tracking with advanced business rules designed for Philippine
          government efficiency and digital transformation studies.
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
            <Play className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#093FB4] text-[#093FB4] hover:bg-[#093FB4] hover:text-white px-8 py-4 text-lg">
            Explore Study Components
            <Settings className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: GitBranch, label: 'Multi-Level', value: 'Approvals' },
            { icon: Timer, label: 'Automated', value: 'Reminders' },
            { icon: BarChart3, label: 'Progress', value: 'Tracking' },
          ].map((stat) => (
            <MagicCard
              key={stat.label}
              className="p-6 text-center"
              gradientColor="#D97706"
              gradientOpacity={0.1}>
              <stat.icon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
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

const KeyFeaturesSection = () => {
  const features = [
    {
      icon: GitBranch,
      title: 'Multi-Level Approval Chains',
      description:
        'Create sophisticated approval workflows with multiple reviewers, conditional routing, and parallel processing.',
      benefits: [
        'Configurable approval levels',
        'Conditional routing logic',
        'Parallel approval processing',
        'Escalation mechanisms',
      ],
    },
    {
      icon: Bell,
      title: 'Automated Deadline Reminders',
      description:
        'Never miss important deadlines with intelligent reminder systems and proactive notifications.',
      benefits: [
        'Smart reminder scheduling',
        'Multiple notification channels',
        'Escalation protocols',
        'Calendar integration',
      ],
    },
    {
      icon: Filter,
      title: 'Custom Workflow Rules',
      description:
        'Define business rules that automatically route documents and trigger actions based on your requirements.',
      benefits: [
        'Rule-based automation',
        'Dynamic routing',
        'Action triggers',
        'Condition-based processing',
      ],
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking Dashboards',
      description:
        'Monitor workflow performance with real-time dashboards and comprehensive analytics.',
      benefits: [
        'Real-time progress tracking',
        'Performance metrics',
        'Bottleneck identification',
        'Workflow optimization',
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
            Research Workflow Implementation Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic demonstration of comprehensive workflow automation
            capabilities designed to research optimization of Philippine
            government processes and digital transformation efficiency.
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
                neonColors={{ firstColor: '#D97706', secondColor: '#F59E0B' }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <feature.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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

const WorkflowTypesSection = () => {
  const workflowTypes = [
    {
      title: 'Document Approval',
      description:
        'Streamline approval processes for PDS, SALN, and other government documents',
      icon: FileText,
      steps: ['Submit', 'Review', 'Approve', 'Archive'],
      color: 'blue',
    },
    {
      title: 'Leave Management',
      description:
        'Automate leave requests, approvals, and tracking across departments',
      icon: Calendar,
      steps: ['Request', 'Supervisor Review', 'HR Approval', 'Schedule'],
      color: 'green',
    },
    {
      title: 'Budget Approval',
      description:
        'Multi-level budget review and approval workflows with financial controls',
      icon: Target,
      steps: ['Submit', 'Department Head', 'Finance Review', 'Final Approval'],
      color: 'purple',
    },
    {
      title: 'Policy Review',
      description:
        'Collaborative policy development and review processes with stakeholder input',
      icon: Layers,
      steps: ['Draft', 'Stakeholder Review', 'Legal Review', 'Approval'],
      color: 'orange',
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green:
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange:
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pre-Built Workflow Templates
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Start with proven workflow templates designed for common government
            processes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {workflowTypes.map((workflow, index) => (
            <motion.div
              key={workflow.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <Card className="p-8 h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      colorClasses[workflow.color]
                    )}>
                    <workflow.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {workflow.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {workflow.description}
                </p>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Workflow Steps:
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {workflow.steps.map((step, stepIndex) => (
                      <React.Fragment key={stepIndex}>
                        <Badge variant="outline" className="text-xs">
                          {step}
                        </Badge>
                        {stepIndex < workflow.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AutomationBenefitsSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Time Savings',
      description:
        'Reduce manual processing time by up to 80% with intelligent automation',
      metric: '80%',
    },
    {
      icon: CheckCircle,
      title: 'Improved Accuracy',
      description:
        'Eliminate human errors with automated validation and routing',
      metric: '99.9%',
    },
    {
      icon: TrendingUp,
      title: 'Better Compliance',
      description:
        'Ensure consistent adherence to government policies and procedures',
      metric: '100%',
    },
    {
      icon: Users,
      title: 'Enhanced Collaboration',
      description:
        'Improve team coordination with transparent workflow visibility',
      metric: '95%',
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
            Research Benefits & Academic Results
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study examining the potential impact of workflow automation
            on Philippine government efficiency and productivity through digital
            transformation.
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
                gradientColor="#D97706"
                gradientOpacity={0.05}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
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

const ConfigurationSection = () => (
  <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Easy Configuration & Management
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Set up and manage workflows with our intuitive drag-and-drop
          interface.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Visual Workflow Builder
          </h3>
          <div className="space-y-4">
            {[
              'Drag-and-drop workflow designer',
              'Pre-built action blocks',
              'Conditional logic configuration',
              'Integration with government systems',
              'Real-time testing and validation',
              'Version control and rollback',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white">
                <Play className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Start
                </div>
                <div className="text-xs text-gray-500">Workflow trigger</div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-500 text-white">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Review
                </div>
                <div className="text-xs text-gray-500">Supervisor approval</div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500 text-white">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Complete
                </div>
                <div className="text-xs text-gray-500">Final approval</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-20 bg-white dark:bg-gray-950">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Thesis Research on Government Workflow Automation
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          This academic prototype demonstrates how government processes can be
          transformed through intelligent automation, supporting Digital
          Philippines initiatives and government modernization research for
          improved efficiency and compliance.
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
            <Zap className="h-4 w-4 text-orange-500" />
            <span>Quick Setup</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Secure & Reliable</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-purple-500" />
            <span>Fully Customizable</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default function AutomatedWorkflowsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <KeyFeaturesSection />
      <WorkflowTypesSection />
      <AutomationBenefitsSection />
      <ConfigurationSection />
      <CTASection />
    </div>
  );
}
