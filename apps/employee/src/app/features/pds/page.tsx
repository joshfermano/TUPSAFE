'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  CheckCircle,
  Shield,
  Clock,
  Users,
  Download,
  Edit,
  Eye,
  ArrowRight,
  Star,
  Zap,
  Lock,
  FileCheck,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { Separator } from '@/components/ui/separator';
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
            <FileText className="h-4 w-4 mr-2" />
            Core Feature
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          e-PDS Management
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          This thesis project demonstrates a comprehensive digital Personal Data Sheet system 
          with CSC compliance, version control, and automated validation. Research implementation 
          of secure, government-appropriate e-PDS management for Philippine civil service.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#093FB4] hover:bg-[#093FB4]/90 text-white px-8 py-4 text-lg">
            Explore e-PDS System
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#093FB4] text-[#093FB4] hover:bg-[#093FB4] hover:text-white px-8 py-4 text-lg">
            View Documentation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: CheckCircle, label: 'CSC Compliant', value: '100%' },
            { icon: Shield, label: 'Secure', value: 'End-to-End' },
            { icon: Clock, label: 'Time Saved', value: '75%' },
          ].map((stat, index) => (
            <MagicCard
              key={stat.label}
              className="p-6 text-center"
              gradientColor="#093FB4"
              gradientOpacity={0.1}>
              <stat.icon className="h-8 w-8 text-[#093FB4] mx-auto mb-2" />
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
      icon: FileCheck,
      title: 'CSC-Compliant Form Validation',
      description:
        'Real-time validation against Civil Service Commission standards ensures your PDS meets all regulatory requirements.',
      benefits: [
        'Automatic field validation',
        'CSC format compliance',
        'Error prevention',
        'Regulatory updates',
      ],
    },
    {
      icon: Clock,
      title: 'Automatic Version Tracking',
      description:
        'Complete audit trail of all changes with immutable version history for compliance and accountability.',
      benefits: [
        'Change history tracking',
        'Version comparison',
        'Rollback capability',
        'Audit compliance',
      ],
    },
    {
      icon: Lock,
      title: 'Digital Signature Support',
      description:
        'Cryptographic digital signatures ensure document authenticity and legal validity for your submissions.',
      benefits: [
        'Legal validity',
        'Authentication',
        'Non-repudiation',
        'Secure submission',
      ],
    },
    {
      icon: AlertCircle,
      title: 'Real-Time Error Detection',
      description:
        'Intelligent error detection prevents submission issues and guides you through corrections.',
      benefits: [
        'Instant validation',
        'Smart suggestions',
        'Error highlighting',
        'Guided corrections',
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
            Research Implementation Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic demonstration of comprehensive e-PDS management capabilities 
            designed for Philippine government compliance and efficiency research.
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
                neonColors={{ firstColor: '#093FB4', secondColor: '#1E40AF' }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#093FB4]/10">
                    <feature.icon className="h-6 w-6 text-[#093FB4]" />
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

const UseCasesSection = () => {
  const useCases = [
    {
      title: 'New Government Employee',
      description:
        'Create your first PDS with guided assistance and validation.',
      steps: [
        'Complete personal information section',
        'Add educational background',
        'Include work experience',
        'Submit for HR review',
      ],
      icon: Users,
    },
    {
      title: 'Annual PDS Update',
      description:
        'Update your existing PDS with new information and certifications.',
      steps: [
        'Load previous PDS version',
        'Update changed information',
        'Add new certifications',
        'Submit updated version',
      ],
      icon: Edit,
    },
    {
      title: 'Promotion Application',
      description: 'Prepare comprehensive PDS for promotion considerations.',
      steps: [
        'Review current PDS',
        'Add recent achievements',
        'Include performance records',
        'Generate official PDF',
      ],
      icon: Star,
    },
  ];

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
            Research Use Case Scenarios
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study of how government employees would interact with 
            digital e-PDS systems in various compliance scenarios.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <Card className="p-8 h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#093FB4]/10">
                    <useCase.icon className="h-5 w-5 text-[#093FB4]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {useCase.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="space-y-3">
                  {useCase.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#093FB4]/10 text-xs font-medium text-[#093FB4]">
                        {stepIndex + 1}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {step}
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

const TechnicalSpecsSection = () => {
  const specs = [
    {
      category: 'Compliance & Standards',
      items: [
        'CSC PDS Form 212 (Revised 2017) compliant',
        'Data Privacy Act 2012 adherent',
        'ISO 27001 security standards',
        'Government Interoperability Framework (GIF)',
      ],
    },
    {
      category: 'Security Features',
      items: [
        '256-bit AES encryption at rest',
        'TLS 1.3 encryption in transit',
        'Multi-factor authentication',
        'Role-based access control (RBAC)',
      ],
    },
    {
      category: 'Integration Capabilities',
      items: [
        'HRMIS integration ready',
        'CSC online services compatible',
        'Office 365 SSO support',
        'RESTful API endpoints',
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
            Technical Research Implementation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Prototype system architecture demonstrating government-grade security 
            and compliance standards for academic research purposes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specs.map((spec, index) => (
            <motion.div
              key={spec.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <MagicCard
                className="p-8 h-full"
                gradientColor="#093FB4"
                gradientOpacity={0.05}>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {spec.category}
                </h3>
                <div className="space-y-4">
                  {spec.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GettingStartedSection = () => {
  const steps = [
    {
      step: 1,
      title: 'Create Account',
      description:
        'Sign up with your government email and verify your identity.',
      icon: Users,
    },
    {
      step: 2,
      title: 'Start Your PDS',
      description:
        'Begin filling out your Personal Data Sheet with our guided interface.',
      icon: FileText,
    },
    {
      step: 3,
      title: 'Review & Validate',
      description:
        'Our system validates your information against CSC requirements.',
      icon: CheckCircle,
    },
    {
      step: 4,
      title: 'Submit Securely',
      description:
        'Digitally sign and submit your PDS for review and approval.',
      icon: Shield,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#093FB4]/5 to-blue-50 dark:from-[#093FB4]/10 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Getting Started is Easy
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Follow these simple steps to create and submit your e-PDS.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center">
              <div className="relative mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#093FB4] text-white mx-auto">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-[#093FB4] text-xs font-bold text-[#093FB4]">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
          Thesis Research on Digital PDS Modernization
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          This academic prototype demonstrates the potential for modernizing 
          Personal Data Sheet management in Philippine government institutions 
          through digital transformation research.
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
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>CSC Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span>Quick Setup</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default function PDSPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <KeyFeaturesSection />
      <UseCasesSection />
      <TechnicalSpecsSection />
      <GettingStartedSection />
      <CTASection />
    </div>
  );
}
