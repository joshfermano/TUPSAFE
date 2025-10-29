'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Brain,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Clock,
  Users,
  CheckCircle,
  Shield,
  Search,
  HelpCircle,
  Zap,
  Bot,
  FileText,
  ArrowRight,
  Sparkles,
  Globe,
  Headphones,
  Star,
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
            <Brain className="h-4 w-4 mr-2" />
            Thesis Feature
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          AI Compliance Assistant
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          Academic research implementation of an AI-powered compliance assistant 
          for government use. This thesis project demonstrates how artificial intelligence 
          can support policy guidance, form completion assistance, and regulatory compliance 
          for Philippine civil service applications.
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
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538] hover:text-white px-8 py-4 text-lg">
            Research Documentation
            <BookOpen className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Clock, label: 'Available', value: '24/7' },
            { icon: MessageCircle, label: 'Languages', value: 'Multi' },
            { icon: Brain, label: 'AI Powered', value: 'Smart' },
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
      icon: Headphones,
      title: '24/7 Policy Guidance',
      description:
        'Get instant access to comprehensive policy information and regulatory guidance any time of day.',
      benefits: [
        'Round-the-clock availability',
        'Instant response times',
        'Comprehensive policy database',
        'Multi-language support',
      ],
    },
    {
      icon: HelpCircle,
      title: 'Form Completion Help',
      description:
        'Receive step-by-step assistance for completing PDS, SALN, and other government forms accurately.',
      benefits: [
        'Interactive form guidance',
        'Field-specific help',
        'Error prevention tips',
        'Best practice recommendations',
      ],
    },
    {
      icon: BookOpen,
      title: 'CSC Regulation Explanations',
      description:
        'Understand complex Civil Service Commission regulations with clear, simple explanations.',
      benefits: [
        'Plain language explanations',
        'Regulation summaries',
        'Update notifications',
        'Context-aware guidance',
      ],
    },
    {
      icon: Lightbulb,
      title: 'Contextual Recommendations',
      description:
        'Get personalized suggestions based on your specific role, department, and compliance requirements.',
      benefits: [
        'Role-based suggestions',
        'Personalized advice',
        'Proactive recommendations',
        'Smart insights',
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
            Research AI Implementation Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic prototype demonstrating AI capabilities specifically designed 
            for Philippine government compliance research and digital governance studies.
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

const UseCasesSection = () => {
  const useCases = [
    {
      title: 'Policy Clarification',
      description:
        'Get instant clarification on complex government policies and procedures.',
      examples: [
        '"What are the requirements for filing a SALN?"',
        '"How do I report business interests in my PDS?"',
        '"What is the deadline for submitting my annual forms?"',
      ],
      icon: Search,
    },
    {
      title: 'Form Assistance',
      description:
        'Receive step-by-step guidance for completing government forms.',
      examples: [
        '"How do I calculate my net worth for SALN?"',
        '"What should I include in my work experience section?"',
        '"Help me understand this form field"',
      ],
      icon: FileText,
    },
    {
      title: 'Compliance Checking',
      description:
        'Verify that your submissions meet all regulatory requirements.',
      examples: [
        '"Is my PDS complete and compliant?"',
        '"Did I miss any required disclosures?"',
        '"Are there any errors in my submission?"',
      ],
      icon: CheckCircle,
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
            Research Use Cases for AI Assistance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study of how AI assistance can support common government 
            compliance scenarios and regulatory questions in Philippine civil service.
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B1538]/10">
                    <useCase.icon className="h-5 w-5 text-[#8B1538]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {useCase.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Example Questions:
                  </h4>
                  {useCase.examples.map((example, exampleIndex) => (
                    <div
                      key={exampleIndex}
                      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        {example}
                      </p>
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

const AICapabilitiesSection = () => {
  const capabilities = [
    {
      icon: Brain,
      title: 'Advanced Language Understanding',
      description: 'Comprehends context and nuance in Filipino and English',
    },
    {
      icon: BookOpen,
      title: 'Comprehensive Knowledge Base',
      description: 'Trained on complete Philippine government regulations',
    },
    {
      icon: Zap,
      title: 'Instant Response',
      description: 'Get answers in seconds, not hours or days',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and confidential',
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Available in Filipino, English, and regional languages',
    },
    {
      icon: Star,
      title: 'Continuous Learning',
      description: 'Constantly updated with latest policies and regulations',
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
            Research AI Technology Implementation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Thesis research demonstrating advanced artificial intelligence implementation 
            specifically designed for Philippine government compliance and regulatory assistance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <MagicCard
                className="p-6 text-center h-full"
                gradientColor="#8B1538"
                gradientOpacity={0.05}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B1538]/10 mx-auto mb-4">
                  <capability.icon className="h-6 w-6 text-[#8B1538]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {capability.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {capability.description}
                </p>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const InteractionSection = () => (
  <section className="py-20 bg-gradient-to-br from-[#8B1538]/5 to-[#0066B3]/5 dark:from-[#8B1538]/10 dark:to-[#0066B3]/10">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Natural Conversation Interface
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Interact with our AI assistant using natural language, just like
          talking to a knowledgeable colleague.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Mock Chat Interface */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <Users className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-md">
                <p className="text-sm text-gray-900 dark:text-white">
                  I&apos;m confused about what to include in the &quot;Other
                  Information&quot; section of my PDS. Can you help?
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 justify-end">
              <div className="bg-[#8B1538] rounded-lg p-4 max-w-md">
                <p className="text-sm text-white">
                  I&apos;d be happy to help you with the &quot;Other
                  Information&quot; section! This section should include: •
                  Special skills and hobbies • Non-academic
                  distinctions/recognition • Membership in
                  association/organization Would you like me to explain each
                  category in detail?
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B1538]">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <Users className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-md">
                <p className="text-sm text-gray-900 dark:text-white">
                  Yes, please explain the special skills section. What counts as
                  a special skill?
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 justify-end">
              <div className="bg-[#8B1538] rounded-lg p-4 max-w-md">
                <p className="text-sm text-white">
                  Special skills include any relevant abilities that could
                  benefit your work performance: • Computer proficiency
                  (specific software) • Language skills and proficiency levels •
                  Technical certifications • Professional licenses • Specialized
                  training Focus on skills relevant to government service and
                  your role.
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B1538]">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Accurate Information</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Instant Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0066B3]" />
                <span>Secure & Private</span>
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
          Thesis Research on AI-Powered Government Assistance
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          This academic prototype demonstrates the potential future of government 
          compliance assistance through AI technology, supporting the Digital 
          Philippines agenda and government modernization research.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            asChild
            size="lg"
            className="bg-[#8B1538] hover:bg-[#8B1538]/90 text-white px-8 py-4">
            <Link href="/auth/signup">
              View Research Implementation
              <Sparkles className="ml-2 h-5 w-5" />
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
            <Clock className="h-4 w-4 text-green-500" />
            <span>Available 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#8B1538]" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0066B3]" />
            <span>Secure & Private</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default function AICompliancePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <KeyFeaturesSection />
      <UseCasesSection />
      <AICapabilitiesSection />
      <InteractionSection />
      <CTASection />
    </div>
  );
}
