'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck,
  Calculator,
  Bell,
  Archive,
  DollarSign,
  Home,
  Car,
  Briefcase,
  CheckCircle,
  Shield,
  Clock,
  ArrowRight,
  PieChart,
  TrendingUp,
  FileText,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import Link from 'next/link';



const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-[#8B1538]/5 via-white to-[#0066B3]/5 dark:from-gray-950 dark:via-gray-900 dark:to-[#8B1538]/20 pt-32 pb-20">
    {/* Background Pattern */}
    <div className="absolute inset-0 bg-grid-pattern opacity-30" />

    <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6">
          <Badge className="bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#8B1538] px-4 py-2 text-sm font-medium">
            <FileCheck className="h-4 w-4 mr-2" />
            Thesis Feature
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          e-SALN Processing
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          Academic prototype of digital Statement of Assets, Liabilities, and Net Worth management
          with automated calculations, compliance checks, and deadline tracking.
          Research implementation supporting transparency and anti-corruption compliance 
          as required by Philippine government regulations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#8B1538] hover:bg-[#8B1538]/90 text-white px-8 py-4 text-lg">
            View Prototype
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538] hover:text-white px-8 py-4 text-lg">
            Research Documentation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Calculator, label: 'Auto-Calculate', value: 'Net Worth' },
            { icon: Bell, label: 'Deadline', value: 'Tracking' },
            { icon: Archive, label: 'Audit-Ready', value: 'Reports' },
          ].map((stat, index) => (
            <MagicCard
              key={stat.label}
              className="p-6 text-center"
              gradientColor="#8B1538"
              gradientOpacity={0.1}>
              <stat.icon className="h-8 w-8 text-[#8B1538] mx-auto mb-2" />
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
      icon: Calculator,
      title: 'Automated Net Worth Calculations',
      description:
        'Intelligent calculation engine automatically computes your net worth based on assets and liabilities with real-time updates.',
      benefits: [
        'Real-time calculations',
        'Error-free math',
        'Currency formatting',
        'Historical tracking',
      ],
    },
    {
      icon: PieChart,
      title: 'Asset Classification Assistance',
      description:
        'Smart categorization helps you properly classify assets and liabilities according to government standards.',
      benefits: [
        'Smart categorization',
        'Compliance guidance',
        'Asset valuation help',
        'Documentation support',
      ],
    },
    {
      icon: Bell,
      title: 'Deadline Tracking & Reminders',
      description:
        'Never miss a SALN submission deadline with automated reminders and progress tracking.',
      benefits: [
        'Automated reminders',
        'Progress tracking',
        'Calendar integration',
        'Multiple notification channels',
      ],
    },
    {
      icon: Archive,
      title: 'Audit-Ready Documentation',
      description:
        'Generate comprehensive, audit-ready reports that meet all transparency and accountability requirements.',
      benefits: [
        'Compliance reports',
        'Audit trail',
        'PDF generation',
        'Historical records',
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
            Thesis Research SALN Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic demonstration of comprehensive e-SALN management capabilities 
            designed to support transparency, accountability, and anti-corruption 
            compliance in Philippine government institutions.
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
                neonColors={{ firstColor: '#8B1538', secondColor: '#0066B3' }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#8B1538]/10">
                    <feature.icon className="h-6 w-6 text-[#8B1538]" />
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

const AssetCategoriesSection = () => {
  const categories = [
    {
      title: 'Real Properties',
      description: 'Land, buildings, and other immovable assets',
      icon: Home,
      items: [
        'Residential properties',
        'Commercial buildings',
        'Agricultural land',
        'Vacant lots',
      ],
    },
    {
      title: 'Personal Properties',
      description: 'Movable assets and valuable items',
      icon: Car,
      items: ['Vehicles', 'Jewelry', 'Electronics', 'Furniture & fixtures'],
    },
    {
      title: 'Cash & Investments',
      description: 'Liquid assets and financial instruments',
      icon: DollarSign,
      items: [
        'Bank deposits',
        'Stocks & bonds',
        'Investment funds',
        'Insurance policies',
      ],
    },
    {
      title: 'Business Interests',
      description: 'Business ownership and professional interests',
      icon: Briefcase,
      items: [
        'Business shares',
        'Partnership interests',
        'Professional practice',
        'Consulting work',
      ],
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
            Asset Categories & Management
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive asset categorization with intelligent classification
            assistance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <MagicCard
                className="p-6 h-full"
                gradientColor="#8B1538"
                gradientOpacity={0.05}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B1538]/10">
                    <category.icon className="h-5 w-5 text-[#8B1538]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {category.description}
                </p>

                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
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

const ComplianceSection = () => {
  const requirements = [
    {
      title: 'Anti-Corruption Compliance',
      description:
        'Full compliance with Republic Act 3019 (Anti-Graft and Corrupt Practices Act)',
      icon: Shield,
      features: [
        'Conflict of interest checks',
        'Source of wealth validation',
        'Transparency reports',
      ],
    },
    {
      title: 'Ombudsman Standards',
      description: 'Meets all requirements set by the Office of the Ombudsman',
      icon: CheckCircle,
      features: [
        'Standardized format',
        'Complete documentation',
        'Audit-ready submission',
      ],
    },
    {
      title: 'Code of Conduct',
      description:
        'Aligned with the Code of Conduct and Ethical Standards for Public Officials',
      icon: FileText,
      features: [
        'Ethical guidelines',
        'Public service standards',
        'Accountability measures',
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
            Research on Compliance & Transparency
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study demonstrating implementation of transparency and
            accountability standards required by Philippine anti-corruption laws 
            and Data Privacy Act 2012 compliance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {requirements.map((requirement, index) => (
            <motion.div
              key={requirement.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <Card className="p-8 h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#8B1538]/10">
                    <requirement.icon className="h-6 w-6 text-[#8B1538]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {requirement.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {requirement.description}
                </p>

                <div className="space-y-3">
                  {requirement.features.map((feature, featureIndex) => (
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

const WorkflowSection = () => {
  const steps = [
    {
      step: 1,
      title: 'Asset Inventory',
      description:
        'List all your assets including real properties, personal properties, and investments.',
      icon: Home,
    },
    {
      step: 2,
      title: 'Liability Assessment',
      description:
        'Record all liabilities including loans, mortgages, and other financial obligations.',
      icon: Calculator,
    },
    {
      step: 3,
      title: 'Net Worth Calculation',
      description:
        'System automatically calculates your net worth with real-time validation.',
      icon: TrendingUp,
    },
    {
      step: 4,
      title: 'Review & Submit',
      description:
        'Review your complete SALN, digitally sign, and submit for compliance.',
      icon: FileCheck,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#8B1538]/5 to-[#0066B3]/5 dark:from-[#8B1538]/10 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple SALN Workflow
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Follow our streamlined process to complete your SALN accurately and
            efficiently.
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8B1538] text-white mx-auto">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-[#8B1538] text-xs font-bold text-[#8B1538]">
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

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description:
        'Reduce SALN preparation time by 80% with automated calculations and smart forms.',
    },
    {
      icon: CheckCircle,
      title: 'Ensure Accuracy',
      description:
        'Eliminate calculation errors with built-in validation and real-time checks.',
    },
    {
      icon: Shield,
      title: 'Maintain Compliance',
      description:
        'Stay compliant with all transparency and anti-corruption requirements.',
    },
    {
      icon: Archive,
      title: 'Keep Records',
      description:
        'Maintain comprehensive records for audit purposes and transparency.',
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
            Research Benefits of Digital e-SALN
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study of the potential benefits of modernizing SALN management 
            through digital transformation in Philippine government institutions.
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8B1538]/10 mx-auto mb-6">
                <benefit.icon className="h-8 w-8 text-[#8B1538]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {benefit.description}
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
          Thesis Research on Digital SALN Transformation
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          This research prototype demonstrates how digital transformation can enhance 
          SALN management processes while ensuring full transparency and compliance 
          with Philippine government regulations and anti-corruption measures.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            asChild
            size="lg"
            className="bg-[#8B1538] hover:bg-[#8B1538]/90 text-white px-8 py-4">
            <Link href="/auth/signup">
              View Research Implementation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538] hover:text-white px-8 py-4">
            <Link href="/features">
              Explore Study Components
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Transparency Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0066B3]" />
            <span>Secure & Auditable</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span>Quick & Easy</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default function SALNPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <KeyFeaturesSection />
      <AssetCategoriesSection />
      <ComplianceSection />
      <WorkflowSection />
      <BenefitsSection />
      <CTASection />
    </div>
  );
}
