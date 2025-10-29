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
      'Digital Personal Data Sheet system designed for TUP Manila faculty and staff with CSC compliance standards.',
    benefits: [
      'CSC-compliant form structure',
      'Version tracking for updates',
      'Academic rank integration',
      'Real-time validation feedback',
    ],
    icon: FileText,
  },
  {
    id: 'e-saln',
    title: 'e-SALN Processing',
    description:
      'Streamlined Statement of Assets, Liabilities, and Net Worth submission system aligned with university compliance requirements.',
    benefits: [
      'Automated net worth calculations',
      'Asset classification guidance',
      'Academic calendar integration',
      'Submission tracking system',
    ],
    icon: FileCheck,
    comingSoon: true,
  },
  {
    id: 'ai-assistant',
    title: 'AI Compliance Assistant',
    description:
      'Research implementation of intelligent guidance system to assist with compliance questions and form completion.',
    benefits: [
      'Policy guidance features',
      'Form completion assistance',
      'CSC regulation reference',
      'Contextual help system',
    ],
    icon: Brain,
    comingSoon: true,
  },
  {
    id: 'workflows',
    title: 'Automated Workflows',
    description:
      'Hierarchical approval system designed for TUP Manila organizational structure with department and college-level review processes.',
    benefits: [
      'Department-level approvals',
      'College-level oversight',
      'Deadline notification system',
      'Progress tracking interface',
    ],
    icon: Settings,
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    description:
      'Research-focused security architecture with audit trails, encryption, and role-based access aligned with university data protection standards.',
    benefits: [
      'Secure data transmission',
      'Complete audit logging',
      'Privacy compliance design',
      'Hierarchical access control',
    ],
    icon: Shield,
  },
  {
    id: 'analytics',
    title: 'Dashboard & Analytics',
    description:
      'Administrative reporting interface for TUP Manila HR personnel with compliance metrics and departmental insights.',
    benefits: [
      'Compliance tracking metrics',
      'Department-level reports',
      'Submission analytics',
      'Administrative dashboards',
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
  const gradient = { firstColor: '#8B1538', secondColor: '#0066B3' };

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
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#8B1538]/10 dark:bg-[#8B1538]/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <IconComponent className="h-6 w-6 text-[#8B1538] dark:text-[#E63946]" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
            </div>
            {feature.comingSoon && (
              <Badge variant="outline" className="text-xs text-[#0066B3] border-[#0066B3]">
                Research Proposal
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
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
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
              className="w-full group-hover:bg-[#8B1538] group-hover:text-white transition-all duration-300 border-[#8B1538]/20 text-[#8B1538] hover:border-[#8B1538]">
              View Details
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
      gradientColor="#8B1538"
      gradientOpacity={0.12}
      gradientFrom="#8B1538"
      gradientTo="#0066B3">
      <motion.div
        className="mb-3 flex justify-center"
        whileHover={{ scale: 1.1, rotate: 360 }}
        transition={{ duration: 0.5 }}>
        <IconComponent className="h-8 w-8 text-[#8B1538] dark:text-[#E63946]" />
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
    { icon: FileText, value: '6', label: 'Core Modules' },
    { icon: Users, value: 'TUP Manila', label: 'Focused' },
    { icon: Shield, value: 'CSC', label: 'Compliant Design' },
    { icon: Award, value: 'Research', label: 'Implementation' },
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
            <Badge className="bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#E63946]">
              System Architecture
            </Badge>
          </motion.div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Research-Driven{' '}
            <span className="bg-gradient-to-r from-[#8B1538] to-[#0066B3] bg-clip-text text-transparent">
              Implementation
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300">
            A comprehensive digital compliance system designed specifically for TUP Manila faculty and staff.
            This thesis project implements modern web technologies to streamline e-PDS and e-SALN processes
            in alignment with CSC standards.
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
              Built for TUP Manila&apos;s Digital Transformation
            </h3>
            <p className="mb-8 text-gray-600 dark:text-gray-300">
              This thesis explores how modern web technologies can streamline compliance workflows
              for university faculty and administrative personnel while maintaining CSC standards.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-[#8B1538] hover:bg-[#8B1538]/90 text-white">
                Explore Research Implementation
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538] hover:text-white">
                View Documentation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
