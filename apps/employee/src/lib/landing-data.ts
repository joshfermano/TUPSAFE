/**
 * Landing Page Content Data
 * Centralized content for TUPSAFE landing page sections
 */

import {
  FileText,
  Shield,
  Users,
  BarChart3,
  Clock,
  Award,
  CheckCircle,
  TrendingUp,
  FileCheck,
  Bell,
  Zap,
  Lock,
  Calendar,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Stats Section Data
export interface Stat {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
  suffix?: string;
  description: string;
}

export const stats: Stat[] = [
  {
    id: 'compliance',
    icon: Award,
    value: '100',
    suffix: '%',
    label: 'CSC Compliance',
    description: 'Fully aligned with Civil Service Commission standards',
  },
  {
    id: 'time-saved',
    icon: Clock,
    value: '75',
    suffix: '%',
    label: 'Time Saved',
    description: 'Average reduction in form completion time',
  },
  {
    id: 'modules',
    icon: FileText,
    value: '6',
    label: 'Core Modules',
    description: 'Integrated system components',
  },
  {
    id: 'availability',
    icon: Globe,
    value: '24',
    suffix: '/7',
    label: 'Availability',
    description: 'Always accessible from anywhere',
  },
];

// Benefits Section Data
export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
}

export const benefits: Benefit[] = [
  {
    id: 'save-time',
    title: 'Save Time',
    description:
      'Streamlined digital forms eliminate manual paperwork and reduce submission time by up to 75%.',
    icon: Clock,
    highlights: [
      'Auto-filled personal information',
      'Real-time validation',
      'Quick draft saving',
      'One-click submissions',
    ],
  },
  {
    id: 'ensure-compliance',
    title: 'Ensure Compliance',
    description:
      'Built-in CSC standards guarantee your submissions meet all regulatory requirements.',
    icon: Shield,
    highlights: [
      'CSC-compliant templates',
      'Automatic format checking',
      'Deadline reminders',
      'Audit trail maintenance',
    ],
  },
  {
    id: 'track-progress',
    title: 'Track Progress',
    description:
      'Real-time status updates keep you informed throughout the submission and approval process.',
    icon: TrendingUp,
    highlights: [
      'Live status notifications',
      'Approval workflow visibility',
      'Historical submissions',
      'Performance analytics',
    ],
  },
  {
    id: 'stay-organized',
    title: 'Stay Organized',
    description:
      'Centralized dashboard provides easy access to all your compliance documents and deadlines.',
    icon: BarChart3,
    highlights: [
      'Document management',
      'Calendar integration',
      'Version control',
      'Quick search & filter',
    ],
  },
  {
    id: 'go-paperless',
    title: 'Go Paperless',
    description:
      'Digital-first approach reduces environmental impact while improving efficiency and security.',
    icon: FileCheck,
    highlights: [
      'Secure cloud storage',
      'Instant retrieval',
      'Easy sharing',
      'Eco-friendly solution',
    ],
  },
];

// How It Works Section Data
export interface Step {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  details: string[];
}

export const steps: Step[] = [
  {
    id: 'sign-up',
    step: 1,
    title: 'Sign Up & Verify',
    description:
      'Create your account using your TUP Manila credentials and verify your identity.',
    icon: Users,
    details: [
      'Use your institutional email',
      'Complete profile verification',
      'Set up two-factor authentication',
      'Access granted within 24 hours',
    ],
  },
  {
    id: 'fill-forms',
    step: 2,
    title: 'Fill Out Forms',
    description:
      'Complete your e-PDS or e-SALN using our intuitive, step-by-step interface.',
    icon: FileText,
    details: [
      'Auto-populated fields',
      'Real-time validation',
      'Save drafts anytime',
      'Guided form completion',
    ],
  },
  {
    id: 'submit',
    step: 3,
    title: 'Review & Submit',
    description:
      'Review your information for accuracy, then submit securely to the appropriate department.',
    icon: CheckCircle,
    details: [
      'Comprehensive review screen',
      'Error detection',
      'Digital signature',
      'Instant submission confirmation',
    ],
  },
  {
    id: 'track',
    step: 4,
    title: 'Track & Update',
    description:
      'Monitor approval status in real-time and receive notifications at every stage.',
    icon: Bell,
    details: [
      'Live status updates',
      'Email notifications',
      'Approval workflow tracking',
      'Update submissions as needed',
    ],
  },
];

// Testimonials Section Data
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  quote: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: 'faculty-1',
    name: 'Dr. Maria Santos',
    role: 'Associate Professor',
    department: 'College of Engineering',
    avatar: '/avatars/faculty-1.jpg',
    quote:
      'TUPSAFE has transformed how we handle compliance. What used to take hours now takes minutes. The auto-save feature and real-time validation give me peace of mind.',
    rating: 5,
  },
  {
    id: 'dept-head-1',
    name: 'Prof. Juan Dela Cruz',
    role: 'Department Head',
    department: 'Department of Computer Science',
    avatar: '/avatars/dept-head-1.jpg',
    quote:
      'As a department head, reviewing submissions has never been easier. The approval workflow is intuitive, and I can track compliance rates at a glance. Excellent system!',
    rating: 5,
  },
  {
    id: 'hr-admin-1',
    name: 'Ms. Anna Reyes',
    role: 'HR Administrator',
    department: 'Human Resources Office',
    avatar: '/avatars/hr-admin-1.jpg',
    quote:
      'The analytics dashboard provides invaluable insights. We can now identify compliance gaps early and send targeted reminders. This system is a game-changer for our office.',
    rating: 5,
  },
];

// FAQ Section Data
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'pds' | 'saln' | 'technical';
}

export const faqs: FAQ[] = [
  {
    id: 'who-can-use',
    question: 'Who can use TUPSAFE?',
    answer:
      'TUPSAFE is designed for TUP Manila faculty, staff, and administrators. Applicants can also use the system to submit their PDS during the recruitment process. Access is granted based on your institutional email and role.',
    category: 'general',
  },
  {
    id: 'data-security',
    question: 'Is my personal data secure?',
    answer:
      'Yes, absolutely. TUPSAFE implements enterprise-grade security including end-to-end encryption, role-based access control, secure cloud storage, and comprehensive audit logging. All data is stored in compliance with CSC data protection standards.',
    category: 'technical',
  },
  {
    id: 'pds-update',
    question: 'How often should I update my PDS?',
    answer:
      'You should update your PDS whenever there are significant changes to your personal information, education, work experience, or other relevant details. TUP Manila typically requires annual reviews, and the system will send you reminders before deadlines.',
    category: 'pds',
  },
  {
    id: 'saln-deadline',
    question: 'What happens if I miss the SALN submission deadline?',
    answer:
      'The system will send you reminders 30, 14, and 7 days before the deadline. If you miss a deadline, you should contact your department head or HR immediately to discuss late submission procedures. The system maintains a record of all submission timestamps.',
    category: 'saln',
  },
  {
    id: 'auto-save',
    question: 'Does the system save my progress automatically?',
    answer:
      'Yes! TUPSAFE automatically saves your form progress every 30 seconds as a draft. You can safely close your browser and return later to continue where you left off. All drafts are saved securely in your account.',
    category: 'technical',
  },
  {
    id: 'mobile-access',
    question: 'Can I access TUPSAFE from my mobile device?',
    answer:
      'Absolutely. TUPSAFE is fully responsive and optimized for mobile devices, tablets, and desktops. You can complete and submit forms from any device with an internet connection and a modern web browser.',
    category: 'general',
  },
];

// CTA Section Data
export interface CTAData {
  title: string;
  subtitle: string;
  description: string;
  primaryButton: {
    text: string;
    href: string;
  };
  secondaryButton: {
    text: string;
    href: string;
  };
  features: {
    icon: LucideIcon;
    text: string;
  }[];
}

export const ctaData: CTAData = {
  title: 'Ready to Streamline Your Compliance?',
  subtitle: 'Join TUP Manila faculty and staff using TUPSAFE',
  description:
    'Experience the future of digital compliance management. Save time, ensure accuracy, and stay organized with our comprehensive e-PDS and e-SALN system.',
  primaryButton: {
    text: 'Get Started Today',
    href: '/dashboard',
  },
  secondaryButton: {
    text: 'Schedule a Demo',
    href: '/contact',
  },
  features: [
    { icon: Zap, text: 'Quick Setup' },
    { icon: Lock, text: 'Secure & Private' },
    { icon: Calendar, text: 'Automated Reminders' },
  ],
};
