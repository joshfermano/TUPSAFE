'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Lock,
  Eye,
  Users,
  CheckCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
  Database,
  Fingerprint,
  ShieldCheck,
  UserCheck,
  Globe,
  History,
  Scale,
  Award,
  Building,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { cn } from '@/lib/utils';
import Link from 'next/link';


const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-red-950 pt-32 pb-20">
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
            <Shield className="h-4 w-4 mr-2" />
            Research Feature
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Security & Compliance
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          Academic research implementation of government-grade security with complete audit trails, 
          end-to-end encryption, and comprehensive regulatory compliance monitoring.
          This thesis project demonstrates protection of sensitive government data using 
          advanced security standards required by Data Privacy Act 2012 and Philippine government regulations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#093FB4] hover:bg-[#093FB4]/90 text-white px-8 py-4 text-lg">
            Explore Security Research
            <ShieldCheck className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#093FB4] text-[#093FB4] hover:bg-[#093FB4] hover:text-white px-8 py-4 text-lg">
            View Documentation
            <Shield className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Lock, label: 'Encryption', value: '256-bit AES' },
            { icon: History, label: 'Audit Logs', value: 'Complete' },
            { icon: ShieldCheck, label: 'Compliance', value: '100%' },
          ].map((stat, index) => (
            <MagicCard
              key={stat.label}
              className="p-6 text-center"
              gradientColor="#DC2626"
              gradientOpacity={0.1}>
              <stat.icon className="h-8 w-8 text-red-600 mx-auto mb-2" />
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

const SecurityFeaturesSection = () => {
  const features = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description:
        'Military-grade 256-bit AES encryption protects data at rest and in transit with zero-knowledge architecture.',
      benefits: [
        '256-bit AES encryption',
        'TLS 1.3 for data in transit',
        'Zero-knowledge architecture',
        'Hardware security modules',
      ],
    },
    {
      icon: History,
      title: 'Complete Audit Logs',
      description:
        'Comprehensive audit trails track every action, access, and modification with immutable logging.',
      benefits: [
        'Immutable audit trails',
        'Real-time activity monitoring',
        'Compliance reporting',
        'Forensic investigation support',
      ],
    },
    {
      icon: Scale,
      title: 'Data Privacy Act Compliance',
      description:
        'Full compliance with Philippine Data Privacy Act and international privacy standards.',
      benefits: [
        'Data Privacy Act compliance',
        'GDPR alignment',
        'Privacy impact assessments',
        'Data subject rights management',
      ],
    },
    {
      icon: UserCheck,
      title: 'Role-Based Access Control',
      description:
        'Granular permission system ensures users access only what they need with least-privilege principles.',
      benefits: [
        'Granular permissions',
        'Least-privilege access',
        'Dynamic role assignment',
        'Access review workflows',
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
            Research Security Implementation Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic demonstration of comprehensive security measures designed to protect 
            sensitive government data and ensure regulatory compliance with Philippine 
            Data Privacy Act 2012 and Civil Service Commission requirements.
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
                neonColors={{ firstColor: '#DC2626', secondColor: '#EF4444' }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <feature.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
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

const ComplianceStandardsSection = () => {
  const standards = [
    {
      title: 'Data Privacy Act 2012',
      description:
        'Full compliance with Philippine data protection regulations',
      icon: Scale,
      requirements: [
        'Data subject consent management',
        'Privacy impact assessments',
        'Breach notification procedures',
        'Data retention policies',
      ],
    },
    {
      title: 'ISO 27001',
      description: 'International standard for information security management',
      icon: Award,
      requirements: [
        'Information security policies',
        'Risk assessment procedures',
        'Security incident management',
        'Continuous improvement',
      ],
    },
    {
      title: 'Government Standards',
      description: 'Adherence to Philippine government security requirements',
      icon: Building,
      requirements: [
        'Government Interoperability Framework',
        'National Privacy Commission guidelines',
        'Civil Service Commission requirements',
        'Anti-Money Laundering compliance',
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
            Research Compliance Standards Implementation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Academic study demonstrating implementation of the highest standards for 
            Philippine government data protection and regulatory compliance requirements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {standards.map((standard, index) => (
            <motion.div
              key={standard.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <Card className="p-8 h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <standard.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {standard.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {standard.description}
                </p>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Key Requirements:
                  </h4>
                  {standard.requirements.map((requirement, reqIndex) => (
                    <div key={reqIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {requirement}
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

const SecurityLayersSection = () => {
  const layers = [
    {
      title: 'Application Security',
      description: 'Secure coding practices and vulnerability management',
      icon: Settings,
      features: [
        'Code security scanning',
        'Dependency management',
        'Security testing',
        'Penetration testing',
      ],
    },
    {
      title: 'Network Security',
      description: 'Protected network infrastructure and traffic monitoring',
      icon: Globe,
      features: [
        'Firewall protection',
        'DDoS mitigation',
        'Network segmentation',
        'Traffic encryption',
      ],
    },
    {
      title: 'Identity & Access',
      description: 'Multi-factor authentication and identity verification',
      icon: Fingerprint,
      features: [
        'Multi-factor authentication',
        'Single sign-on',
        'Biometric verification',
        'Access analytics',
      ],
    },
    {
      title: 'Data Security',
      description: 'Encryption, backup, and data loss prevention',
      icon: Database,
      features: [
        'Data encryption',
        'Automated backups',
        'Data classification',
        'Loss prevention',
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
            Multi-Layer Security Architecture
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive security across all layers of the technology stack for
            complete protection.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <MagicCard
                className="p-6 h-full"
                gradientColor="#DC2626"
                gradientOpacity={0.05}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <layer.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {layer.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {layer.description}
                </p>

                <div className="space-y-2">
                  {layer.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {feature}
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

const ThreatProtectionSection = () => (
  <section className="py-20 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Advanced Threat Protection
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Proactive security monitoring and incident response to protect against
          evolving cyber threats.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            24/7 Security Monitoring
          </h3>
          <div className="space-y-6">
            {[
              {
                title: 'Real-time Threat Detection',
                description:
                  'AI-powered threat detection identifies suspicious activities instantly',
                icon: AlertTriangle,
              },
              {
                title: 'Incident Response',
                description:
                  'Automated response protocols minimize damage from security incidents',
                icon: Zap,
              },
              {
                title: 'Security Analytics',
                description:
                  'Advanced analytics provide insights into security patterns and risks',
                icon: Eye,
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                  <item.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
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
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Security Metrics Dashboard
          </h4>
          <div className="space-y-6">
            {[
              {
                label: 'Threat Detection Rate',
                value: '99.9%',
                color: 'green',
              },
              { label: 'Response Time', value: '< 5 min', color: 'blue' },
              { label: 'System Uptime', value: '99.99%', color: 'purple' },
              { label: 'Compliance Score', value: '100%', color: 'green' },
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {metric.label}
                </span>
                <Badge
                  className={cn(
                    'text-white',
                    metric.color === 'green' && 'bg-green-500',
                    metric.color === 'blue' && 'bg-blue-500',
                    metric.color === 'purple' && 'bg-purple-500'
                  )}>
                  {metric.value}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const AccessControlSection = () => {
  const roles = [
    {
      title: 'System Administrator',
      permissions: [
        'Full system access',
        'User management',
        'Security configuration',
        'Audit access',
      ],
      icon: Settings,
    },
    {
      title: 'HR Manager',
      permissions: [
        'Employee data access',
        'Approval workflows',
        'Report generation',
        'Department analytics',
      ],
      icon: Users,
    },
    {
      title: 'Employee',
      permissions: [
        'Personal data management',
        'Form submission',
        'Document viewing',
        'Profile updates',
      ],
      icon: UserCheck,
    },
    {
      title: 'Auditor',
      permissions: [
        'Read-only access',
        'Audit trail viewing',
        'Compliance reports',
        'Security logs',
      ],
      icon: Eye,
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
            Role-Based Access Control
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Granular permission system ensures users have access only to what
            they need for their role.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}>
              <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <role.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  {role.permissions.map((permission, permIndex) => (
                    <div key={permIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {permission}
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
          Thesis Research on Government Data Security
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          This academic prototype demonstrates how to protect sensitive government information 
          with advanced security measures. Research implementation of the highest levels of 
          data protection and regulatory compliance for Philippine government institutions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            asChild
            size="lg"
            className="bg-[#093FB4] hover:bg-[#093FB4]/90 text-white px-8 py-4">
            <Link href="/auth/signup">
              View Research Implementation
              <ShieldCheck className="ml-2 h-5 w-5" />
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
            <Lock className="h-4 w-4 text-green-500" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-500" />
            <span>Fully Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            <span>ISO 27001 Certified</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <SecurityFeaturesSection />
      <ComplianceStandardsSection />
      <SecurityLayersSection />
      <ThreatProtectionSection />
      <AccessControlSection />
      <CTASection />
    </div>
  );
}
