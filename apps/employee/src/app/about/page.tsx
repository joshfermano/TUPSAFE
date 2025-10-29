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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
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
        'Intelligent guidance system for CSC compliance requirements and policy interpretation for university employees.',
      color: 'text-purple-600',
    },
    {
      icon: Workflow,
      title: 'Workflow Automation',
      description:
        'Automated review processes, deadline tracking, and hierarchical approval workflows aligned with TUP Manila structure.',
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
        'Complete audit trails and transparency mechanisms for institutional accountability and compliance tracking.',
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
        'Academic thesis project for Technological University of the Philippines Manila, focusing on digital transformation in higher education institutions.',
    },
    {
      icon: BookOpen,
      title: 'Research Methodology',
      description:
        'Mixed-methods approach combining qualitative user research with quantitative analysis of current TUP Manila compliance processes, system usability testing, and digital adoption metrics.',
    },
    {
      icon: Building2,
      title: 'Institutional Context',
      description:
        'Designed specifically for TUP Manila&apos;s organizational structure: colleges, departments, faculty members, administrative staff, and HR personnel with role-based access control.',
    },
    {
      icon: Award,
      title: 'Academic Contribution',
      description:
        'Research contributing to digital governance in Philippine higher education institutions, demonstrating scalable solutions for university compliance systems.',
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
              'fill-tup/5 stroke-tup/10',
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
              <motion.div 
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8">
                <Badge className="bg-gradient-tup border-0 text-white mb-6">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Academic Thesis Project
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
                  About <span className="text-tup font-extrabold drop-shadow-lg">TUPSAFE</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  A thesis research project for Technological University of the Philippines Manila,
                  focused on digitalizing e-PDS and e-SALN compliance processes for university
                  employees through modern web technologies and AI-powered assistance.
                </p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">CSC Compliant</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <Shield className="h-4 w-4 text-tup" />
                  <span className="text-sm font-medium">
                    Government Standards
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <Award className="h-4 w-4 text-tup" />
                  <span className="text-sm font-medium">Academic Research</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-full">
                  <Shield className="h-4 w-4 text-tup" />
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
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Project <span className="text-tup">Overview</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                TUPSAFE (TUP System for Automated Filing and e-Compliance) represents
                a paradigm shift in how TUP Manila employees—including faculty members,
                professors, and administrative staff—manage CSC compliance requirements.
                This thesis project addresses the critical need for digital transformation
                in university administrative processes through innovative technology solutions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <motion.div 
                variants={scaleIn}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <NeonGradientCard className="p-8 h-full">
                  <Target className="h-12 w-12 text-tup mb-6" />
                  <h3 className="text-2xl font-bold mb-4">
                    Research Objectives
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Streamline e-PDS and e-SALN submission processes for TUP Manila employees
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Implement AI-powered CSC compliance guidance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        Ensure government-grade security with role-based access control
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Support TUP Manila&apos;s organizational hierarchy (Colleges → Departments)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Enhance transparency and accountability in university compliance</span>
                    </li>
                  </ul>
                </NeonGradientCard>
              </motion.div>

              <motion.div 
                variants={scaleIn}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}>
                <NeonGradientCard className="p-8 h-full">
                  <Users className="h-12 w-12 text-tup mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Target Users & Scope</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>TUP Manila faculty members (professors, instructors)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Administrative staff and university personnel</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Department heads and college deans (oversight)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>HR personnel and university administrators</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Multi-college organizational hierarchy support</span>
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
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Research <span className="text-tup">Scope</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                This thesis research encompasses comprehensive digitalization of
                CSC compliance processes within TUP Manila&apos;s institutional context,
                focusing on user experience, security, and regulatory adherence for
                university employees.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchAreas.map((area, index) => (
                <motion.div
                  key={area.title}
                  variants={scaleIn}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}>
                  <MagicCard className="p-6 h-full group cursor-pointer">
                    <area.icon className={cn('h-10 w-10 mb-4', area.color)} />
                    <h3 className="text-xl font-bold mb-3 group-hover:text-tup transition-colors">
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
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Academic <span className="text-tup">Context</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                This thesis project contributes to the growing body of research
                on digital governance in Philippine higher education institutions,
                demonstrating how universities can modernize compliance processes
                while maintaining CSC regulatory standards.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {academicContext.map((context, index) => (
                <motion.div
                  key={context.title}
                  variants={scaleIn}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}>
                  <Card className="p-8 h-full glass-tup border-tup/20 hover:border-tup/40 transition-all duration-300">
                    <context.icon className="h-12 w-12 text-tup mb-6" />
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
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Technical <span className="text-tup">Innovation</span>
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
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}>
                  <MagicCard className="p-8 h-full">
                    <innovation.icon className="h-12 w-12 text-tup mb-6" />
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
      <section className="py-20 bg-gradient-tup text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto">
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-16">
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
              <motion.div 
                variants={scaleIn}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <Heart className="h-12 w-12 text-white mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-white/90 leading-relaxed mb-6">
                    To revolutionize TUP Manila&apos;s compliance processes through
                    innovative digital solutions that enhance efficiency,
                    transparency, and employee experience while maintaining the
                    highest standards of security and CSC regulatory compliance.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm">
                        Innovation in University Administration
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
                      <span className="text-sm">Employee-Centric Design</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div 
                variants={scaleIn}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}>
                <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <Zap className="h-12 w-12 text-white mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-white/90 leading-relaxed mb-6">
                    To establish a new standard for digital governance in Philippine
                    higher education institutions, where university compliance processes
                    are seamlessly integrated, transparent, and accessible to all employees
                    through cutting-edge technology and user-centered design.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-blue-300" />
                      <span className="text-sm">Digital-First University</span>
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
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join the Digital{' '}
              <span className="text-tup">Transformation</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Be part of the research shaping the future of university administration
              in the Philippines. Experience the next generation of compliance
              management systems designed specifically for higher education institutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-tup group">
                Explore TUPSAFE Platform
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-tup-outline">
                View Research Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
