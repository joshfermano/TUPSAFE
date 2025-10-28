'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  FileText,
  Shield,
  Users,
  Brain,
  Settings,
  BarChart3,
  CheckCircle,
  Clock,
  FileCheck,
  Award,
} from 'lucide-react';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Feature {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const features: Feature[] = [
  {
    id: 'e-pds',
    title: 'e-PDS Management',
    description:
      'Complete digital Personal Data Sheet system with CSC compliance, version control, and automated validation.',
    benefits: [
      'CSC-compliant form validation',
      'Automatic version tracking',
      'Digital signature support',
      'Real-time error detection',
    ],
    icon: FileText,
  },
  {
    id: 'e-saln',
    title: 'e-SALN Processing',
    description:
      'Streamlined Statement of Assets, Liabilities, and Net Worth management with automated calculations and compliance checks.',
    benefits: [
      'Automated net worth calculations',
      'Asset classification assistance',
      'Deadline tracking & reminders',
      'Audit-ready documentation',
    ],
    icon: FileCheck,
  },
  {
    id: 'ai-assistant',
    title: 'AI Compliance Assistant',
    description:
      'Intelligent guidance system providing instant answers to compliance questions and form completion assistance.',
    benefits: [
      '24/7 policy guidance',
      'Form completion help',
      'CSC regulation explanations',
      'Contextual recommendations',
    ],
    icon: Brain,
  },
  {
    id: 'workflows',
    title: 'Automated Workflows',
    description:
      'Smart approval chains, review processes, and deadline management with configurable business rules.',
    benefits: [
      'Multi-level approval chains',
      'Automated deadline reminders',
      'Custom workflow rules',
      'Progress tracking dashboards',
    ],
    icon: Settings,
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    description:
      'Enterprise-grade security with complete audit trails, data encryption, and regulatory compliance monitoring.',
    benefits: [
      'End-to-end encryption',
      'Complete audit logs',
      'Data Privacy Act compliance',
      'Role-based access control',
    ],
    icon: Shield,
  },
  {
    id: 'analytics',
    title: 'Dashboard & Analytics',
    description:
      'Comprehensive reporting and analytics with real-time compliance metrics and organizational insights.',
    benefits: [
      'Real-time compliance metrics',
      'Custom report generation',
      'Performance analytics',
      'Executive dashboards',
    ],
    icon: BarChart3,
  },
];


// Feature ID to URL mapping
const featureRoutes: Record<string, string> = {
  'e-pds': '/features/pds',
  'e-saln': '/features/saln',
  'ai-assistant': '/features/ai-compliance',
  'workflows': '/features/automated-workflows',
  'security': '/features/security-compliance',
  'analytics': '/features/dashboard-analytics',
};

const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({
  feature,
  index,
}) => {
  const IconComponent = feature.icon;
  const gradient = { firstColor: '#093FB4', secondColor: '#1E40AF' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group">
      <NeonGradientCard
        className="h-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        borderSize={2}
        borderRadius={16}
        neonColors={gradient}>
        <div className="flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#093FB4]/10 dark:bg-[#093FB4]/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <IconComponent className="h-6 w-6 text-[#093FB4] dark:text-blue-400" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
            </div>
            {feature.comingSoon && (
              <Badge variant="outline" className="text-xs">
                Coming Soon
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="mb-4 flex-grow text-sm text-gray-600 dark:text-gray-300">
            {feature.description}
          </p>

          {/* Benefits */}
          <div className="mb-4 space-y-2">
            {feature.benefits.map((benefit, benefitIndex) => (
              <motion.div
                key={benefitIndex}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1 + benefitIndex * 0.05,
                }}
                viewport={{ once: true }}>
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {benefit}
                </span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <Link href={featureRoutes[feature.id] || '#'} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full group-hover:bg-[#093FB4] group-hover:text-white transition-all duration-300">
              Learn More
            </Button>
          </Link>
        </div>
      </NeonGradientCard>
    </motion.div>
  );
};

const StatsCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  index: number;
}> = ({ icon: IconComponent, value, label, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}>
    <MagicCard
      className="p-6 text-center transition-all duration-300 hover:scale-105"
      gradientColor="#093FB4"
      gradientOpacity={0.1}
      gradientFrom="#093FB4"
      gradientTo="#1E40AF">
      <motion.div
        className="mb-3 flex justify-center"
        whileHover={{ scale: 1.1, rotate: 360 }}
        transition={{ duration: 0.5 }}>
        <IconComponent className="h-8 w-8 text-[#093FB4] dark:text-blue-400" />
      </motion.div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </MagicCard>
  </motion.div>
);

export default function FeaturesSection() {
  const stats = [
    { icon: Users, value: '50K+', label: 'Government Users' },
    { icon: FileCheck, value: '99.9%', label: 'Compliance Rate' },
    { icon: Clock, value: '75%', label: 'Time Savings' },
    { icon: Award, value: 'CSC', label: 'Certified' },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-white py-24 dark:bg-gray-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}>
          <motion.div
            className="mb-4 inline-block"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}>
            <Badge className="bg-[#093FB4]/10 text-[#093FB4] dark:bg-[#093FB4]/20 dark:text-blue-400">
              Comprehensive Solutions
            </Badge>
          </motion.div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Comprehensive Compliance{' '}
            <span className="bg-gradient-to-r from-[#093FB4] to-blue-600 bg-clip-text text-transparent">
              Solutions
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300">
            Everything you need for seamless government compliance workflows.
            Streamline your processes with our comprehensive suite of tools
            designed specifically for Philippine government requirements.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard key={stat.label} {...stat} index={index} />
          ))}
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}>
          <div className="mx-auto max-w-2xl">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Ready to Transform Your Compliance Workflow?
            </h3>
            <p className="mb-8 text-gray-600 dark:text-gray-300">
              Join thousands of government employees who have streamlined their
              compliance processes with TUPSAFE.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-[#093FB4] hover:bg-[#093FB4]/90 text-white">
                Explore All Features
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-[#093FB4] text-[#093FB4] hover:bg-[#093FB4] hover:text-white">
                Schedule Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
