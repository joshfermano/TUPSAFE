'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { GridPattern } from '@/components/ui/grid-pattern';
import { Meteors } from '@/components/ui/meteors';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import {
  GraduationCap,
  Shield,
  Database,
  Cpu,
  Users,
  Target,
  BookOpen,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle,
  Award,
  FileText,
  Brain,
  Workflow,
  Eye,
  Scale,
  Building2,
  Lightbulb,
  Heart,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const researchAreas = [
    {
      icon: FileText,
      title: 'e-PDS Digitalization',
      description:
        'Digital transformation of Personal Data Sheets with automated validation and CSC compliance.',
      color: 'text-blue-600',
    },
    {
      icon: Scale,
      title: 'e-SALN Automation',
      description:
        'Streamlined Statement of Assets, Liabilities, and Net Worth submissions with real-time calculations.',
      color: 'text-emerald-600',
    },
    {
      icon: Brain,
      title: 'AI Compliance Assistant',
      description:
        'Intelligent guidance system for government compliance requirements and policy interpretation.',
      color: 'text-purple-600',
    },
    {
      icon: Workflow,
      title: 'Workflow Automation',
      description:
        'Automated review processes, deadline management, and approval workflows for efficiency.',
      color: 'text-orange-600',
    },
    {
      icon: Lock,
      title: 'Security & Compliance',
      description:
        'Enterprise-grade security implementing Data Privacy Act 2012 and government standards.',
      color: 'text-red-600',
    },
    {
      icon: Eye,
      title: 'Audit & Transparency',
      description:
        'Complete audit trails and transparency mechanisms for government accountability.',
      color: 'text-cyan-600',
    },
  ];

  const technicalInnovations = [
    {
      icon: Cpu,
      title: 'Modern Architecture',
      description:
        'Next.js 15, React 19, TypeScript with Server-Side Rendering',
      features: ['Edge Computing', 'Type Safety', 'Performance Optimized'],
    },
    {
      icon: Database,
      title: 'Secure Database',
      description: 'PostgreSQL with Row Level Security via Supabase',
      features: [
        'RLS Implementation',
        'Real-time Updates',
        'Automated Backups',
      ],
    },
    {
      icon: Shield,
      title: 'Government-Grade Security',
      description: 'Multi-factor authentication and compliance standards',
      features: ['MFA Integration', 'DICT Standards', 'ISO 27001 Ready'],
    },
    {
      icon: Globe,
      title: 'Accessibility First',
      description: 'WCAG 2.1 AA compliant with responsive design',
      features: [
        'Screen Reader Support',
        'Mobile Optimized',
        'Keyboard Navigation',
      ],
    },
  ];

  const academicContext = [
    {
      icon: GraduationCap,
      title: 'Thesis Research',
      description:
        'This Thesis are focusing on digital transformation in Philippine government institutions.',
    },
    {
      icon: BookOpen,
      title: 'Research Methodology',
      description:
        'Qualitative and quantitative analysis of current government processes and digital adoption.',
    },
    {
      icon: Building2,
      title: 'Government Partnership',
      description:
        'Collaboration with Civil Service Commission for compliance and validation requirements.',
    },
    {
      icon: Award,
      title: 'Academic Excellence',
      description:
        'Research contributing to digital governance and public administration modernization.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0">
          <GridPattern
            width={40}
            height={40}
            x={-1}
            y={-1}
            className={cn(
              'fill-government/5 stroke-government/10',
              '[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]'
            )}
          />
          <Meteors number={15} />
        </div>

        <div className="relative z-10">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <motion.div
              initial="initial"
              animate={isVisible ? 'animate' : 'initial'}
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto">
              <motion.div variants={fadeInUp} className="mb-8">
                <Badge className="bg-gradient-government border-0 text-white mb-6">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Academic Thesis Project
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
                  About <span className="text-government font-extrabold drop-shadow-lg">SmartGov</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  A comprehensive research project focused on digitalizing
                  Philippine government compliance processes through modern web
                  technologies and AI-powered assistance.
                </p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">CSC Compliant</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <Shield className="h-4 w-4 text-government" />
                  <span className="text-sm font-medium">
                    Government Standards
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <Award className="h-4 w-4 text-government" />
                  <span className="text-sm font-medium">Academic Research</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <Shield className="h-4 w-4 text-government" />
                  <span className="text-sm font-medium">
                    ISO Standards
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Project Overview Section */}
      <section className="py-20 bg-accent/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Project <span className="text-government">Overview</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                SmartGov represents a paradigm shift in how Philippine
                government employees interact with compliance requirements. This
                thesis project addresses the critical need for digital
                transformation in government institutions through innovative
                technology solutions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <motion.div variants={scaleIn}>
                <NeonGradientCard className="p-8 h-full">
                  <Target className="h-12 w-12 text-government mb-6" />
                  <h3 className="text-2xl font-bold mb-4">
                    Research Objectives
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Streamline e-PDS and e-SALN submission processes
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Implement AI-powered compliance guidance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Ensure government-grade security and audit trails
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Enhance transparency and accountability</span>
                    </li>
                  </ul>
                </NeonGradientCard>
              </motion.div>

              <motion.div variants={scaleIn}>
                <NeonGradientCard className="p-8 h-full">
                  <Users className="h-12 w-12 text-government mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Target Impact</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>1.8M+ Philippine government employees</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Reduce processing time by 75%</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Eliminate paper-based workflows</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Improve compliance accuracy to 99%+</span>
                    </li>
                  </ul>
                </NeonGradientCard>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Research Scope Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Research <span className="text-government">Scope</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Our research encompasses comprehensive digitalization of
                government compliance processes with a focus on user experience,
                security, and regulatory adherence.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchAreas.map((area, index) => (
                <motion.div
                  key={area.title}
                  variants={scaleIn}
                  transition={{ delay: index * 0.1 }}>
                  <MagicCard className="p-6 h-full group cursor-pointer">
                    <area.icon className={cn('h-10 w-10 mb-4', area.color)} />
                    <h3 className="text-xl font-bold mb-3 group-hover:text-government transition-colors">
                      {area.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {area.description}
                    </p>
                  </MagicCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Academic Context Section */}
      <section className="py-20 bg-accent/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Academic <span className="text-government">Context</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                This thesis project contributes to the growing body of research
                on digital governance and public administration modernization in
                developing countries.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {academicContext.map((context, index) => (
                <motion.div
                  key={context.title}
                  variants={scaleIn}
                  transition={{ delay: index * 0.15 }}>
                  <Card className="p-8 h-full glass-government border-government/20 hover:border-government/40 transition-all duration-300">
                    <context.icon className="h-12 w-12 text-government mb-6" />
                    <h3 className="text-xl font-bold mb-4">{context.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {context.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technical Innovation Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Technical <span className="text-government">Innovation</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Leveraging cutting-edge web technologies to build a secure,
                scalable, and user-friendly platform that meets the highest
                government standards.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {technicalInnovations.map((innovation, index) => (
                <motion.div
                  key={innovation.title}
                  variants={scaleIn}
                  transition={{ delay: index * 0.1 }}>
                  <MagicCard className="p-8 h-full">
                    <innovation.icon className="h-12 w-12 text-government mb-6" />
                    <h3 className="text-xl font-bold mb-4">
                      {innovation.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {innovation.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {innovation.features.map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </MagicCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gradient-government text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Mission & Vision
              </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                Driving digital transformation in Philippine government
                institutions through innovative research and technology
                solutions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div variants={scaleIn}>
                <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <Heart className="h-12 w-12 text-white mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-white/90 leading-relaxed mb-6">
                    To revolutionize government compliance processes through
                    innovative digital solutions that enhance efficiency,
                    transparency, and citizen services while maintaining the
                    highest standards of security and regulatory compliance.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm">
                        Innovation in Public Service
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-blue-300" />
                      <span className="text-sm">
                        Security & Compliance First
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-green-300" />
                      <span className="text-sm">Citizen-Centric Design</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={scaleIn}>
                <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <Zap className="h-12 w-12 text-white mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-white/90 leading-relaxed mb-6">
                    To establish a new standard for digital governance in the
                    Philippines, where government processes are seamlessly
                    integrated, transparent, and accessible to all citizens
                    through cutting-edge technology and user-centered design.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-blue-300" />
                      <span className="text-sm">Digital-First Government</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Eye className="h-4 w-4 text-green-300" />
                      <span className="text-sm">Transparent & Accountable</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm">Excellence in Service</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join the Digital{' '}
              <span className="text-government">Transformation</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Be part of the research that&apos;s shaping the future of
              Philippine government services. Experience the next generation of
              compliance management systems.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-government group">
                Explore SmartGov Platform
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-government-outline">
                View Research Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
