'use client';

/**
 * PDS View Detail Page
 * CS Form No. 212 Revised 2025 - Read-Only View
 *
 * Design: Clean, minimalistic, modern, premium
 * Layout: Collapsible sections with compact two-column grid
 * Theme: TUP red accent - oklch(0.55_0.22_15)
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePds, useAuth } from '@tupsafe/mock-data/api';
import { format } from 'date-fns';
import {
  Download,
  Printer,
  Edit,
  ChevronRight,
  ChevronDown,
  User,
  MapPin,
  Phone,
  Users,
  GraduationCap,
  Award,
  Briefcase,
  Heart,
  BookOpen,
  Star,
} from 'lucide-react';

// UI Components
import { BlurFade } from '@/components/ui/blur-fade';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { CompletePdsData } from '@/lib/validations/pds-schema';

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const STATUS_CONFIG = {
  draft: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    label: 'Draft',
  },
  submitted: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    label: 'Submitted',
  },
  reviewing: {
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
    label: 'Under Review',
  },
  approved: {
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    label: 'Approved',
  },
  rejected: {
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    label: 'Rejected',
  },
};

// ============================================================================
// FIELD DISPLAY COMPONENT
// ============================================================================

interface FieldProps {
  label: string;
  value?: string | number | boolean | null;
  fullWidth?: boolean;
}

const Field = React.memo(({ label, value, fullWidth = false }: FieldProps) => {
  const displayValue = value === null || value === undefined || value === ''
    ? 'N/A'
    : typeof value === 'boolean'
    ? value ? 'Yes' : 'No'
    : String(value);

  return (
    <div className={cn("space-y-1", fullWidth && "md:col-span-2")}>
      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</p>
      <p className="text-sm text-slate-900 dark:text-slate-100">{displayValue}</p>
    </div>
  );
});

Field.displayName = 'Field';

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  delay?: number;
}

const Section = React.memo(({ title, icon: Icon, children, defaultOpen = false, delay = 0 }: SectionProps) => {
  return (
    <BlurFade delay={delay}>
      <Collapsible defaultOpen={defaultOpen}>
        <Card className="p-5 hover:border-[oklch(0.55_0.22_15)] dark:hover:border-[oklch(0.65_0.24_15)] transition-colors">
          <CollapsibleTrigger className="flex justify-between items-center w-full group">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-[oklch(0.55_0.22_15)] dark:text-[oklch(0.65_0.24_15)]" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Separator className="my-4" />
            {children}
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </BlurFade>
  );
});

Section.displayName = 'Section';

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading PDS details...</p>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PDSViewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, getCompleteSubmission, loading } = usePds(user?.id || '');

  const pdsId = params?.id as string;
  const submission = useMemo(
    () => submissions.find(s => s.id === pdsId),
    [submissions, pdsId]
  );

  const pdsData = useMemo(
    () => getCompleteSubmission(pdsId),
    [pdsId, getCompleteSubmission]
  ) as any;

  const canEdit = submission?.status === 'draft' || submission?.status === 'rejected';

  if (loading || !submission || !pdsData) {
    return <LoadingState />;
  }

  const submissionYear = submission.submittedAt
    ? new Date(submission.submittedAt).getFullYear()
    : new Date(submission.createdAt).getFullYear();

  const statusConfig = STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG];

  const handleEdit = () => router.push(`/dashboard/pds/edit/${pdsId}`);
  const handleDownload = () => console.log('Download PDF:', pdsId);
  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <BlurFade delay={0.05}>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/pds/view" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            PDS
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">View Details</span>
        </div>
      </BlurFade>

      {/* Header */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Personal Data Sheet {submissionYear}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Version {submission.version} • Submitted {format(new Date(submission.submittedAt || submission.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("px-2 py-0.5", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            {canEdit && (
              <Button size="sm" className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </BlurFade>

      {/* I. PERSONAL INFORMATION */}
      <Section title="I. Personal Information" icon={User} defaultOpen delay={0.15}>
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Surname" value={pdsData.personalInfo?.surname} />
            <Field label="First Name" value={pdsData.personalInfo?.firstName} />
            <Field label="Middle Name" value={pdsData.personalInfo?.middleName} />
            <Field label="Name Extension" value={pdsData.personalInfo?.nameExtension} />
            <Field label="Date of Birth" value={pdsData.personalInfo?.dateOfBirth ? format(new Date(pdsData.personalInfo.dateOfBirth), 'MMM d, yyyy') : 'N/A'} />
            <Field label="Place of Birth" value={pdsData.personalInfo?.placeOfBirth} />
            <Field label="Sex" value={pdsData.personalInfo?.sex} />
            <Field label="Civil Status" value={pdsData.personalInfo?.civilStatus} />
            <Field label="Height (m)" value={pdsData.personalInfo?.heightM} />
            <Field label="Weight (kg)" value={pdsData.personalInfo?.weightKg} />
            <Field label="Blood Type" value={pdsData.personalInfo?.bloodType} />
            <Field label="Citizenship" value={pdsData.personalInfo?.citizenship ? `${pdsData.personalInfo.citizenship.type}${pdsData.personalInfo.citizenship.details ? ` - ${pdsData.personalInfo.citizenship.details}` : ''}` : undefined} />
          </div>

          {/* Government IDs */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Government IDs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="GSIS ID No." value={pdsData.personalInfo?.gsisNo} />
              <Field label="PAG-IBIG ID No." value={pdsData.personalInfo?.pagibigNo} />
              <Field label="PhilHealth No." value={pdsData.personalInfo?.philhealthNo} />
              <Field label="SSS No." value={pdsData.personalInfo?.sssNo} />
              <Field label="TIN" value={pdsData.personalInfo?.tinNo} />
              <Field label="Agency Employee No." value={pdsData.personalInfo?.agencyEmployeeNo} />
            </div>
          </div>

          {/* Residential Address */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              Residential Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="House/Block/Lot No." value={pdsData.personalInfo?.residentialAddress?.houseNumber} />
              <Field label="Street" value={pdsData.personalInfo?.residentialAddress?.streetName} />
              <Field label="Subdivision/Village" value={pdsData.personalInfo?.residentialAddress?.subdivision} />
              <Field label="Barangay" value={pdsData.personalInfo?.residentialAddress?.barangay} />
              <Field label="City/Municipality" value={pdsData.personalInfo?.residentialAddress?.cityMunicipality} />
              <Field label="Province" value={pdsData.personalInfo?.residentialAddress?.province} />
              <Field label="Region" value={pdsData.personalInfo?.residentialAddress?.region} />
              <Field label="Zip Code" value={pdsData.personalInfo?.residentialAddress?.zipCode} />
            </div>
          </div>

          {/* Permanent Address */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              Permanent Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="House/Block/Lot No." value={pdsData.personalInfo?.permanentAddress?.houseNumber} />
              <Field label="Street" value={pdsData.personalInfo?.permanentAddress?.streetName} />
              <Field label="Subdivision/Village" value={pdsData.personalInfo?.permanentAddress?.subdivision} />
              <Field label="Barangay" value={pdsData.personalInfo?.permanentAddress?.barangay} />
              <Field label="City/Municipality" value={pdsData.personalInfo?.permanentAddress?.cityMunicipality} />
              <Field label="Province" value={pdsData.personalInfo?.permanentAddress?.province} />
              <Field label="Region" value={pdsData.personalInfo?.permanentAddress?.region} />
              <Field label="Zip Code" value={pdsData.personalInfo?.permanentAddress?.zipCode} />
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Phone className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Telephone No." value={pdsData.personalInfo?.telephoneNo} />
              <Field label="Mobile No." value={pdsData.personalInfo?.mobileNo} />
              <Field label="Email Address" value={pdsData.personalInfo?.emailAddress} fullWidth />
            </div>
          </div>
        </div>
      </Section>

      {/* II. FAMILY BACKGROUND */}
      <Section title="II. Family Background" icon={Users} delay={0.2}>
        <div className="space-y-4">
          {/* Spouse */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Spouse Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Surname" value={pdsData.family?.spouseSurname || pdsData.familyBackground?.spouseSurname} />
              <Field label="First Name" value={pdsData.family?.spouseFirstName || pdsData.familyBackground?.spouseFirstName} />
              <Field label="Middle Name" value={pdsData.family?.spouseMiddleName || pdsData.familyBackground?.spouseMiddleName} />
              <Field label="Name Extension" value={pdsData.family?.spouseNameExtension || pdsData.familyBackground?.spouseNameExtension} />
              <Field label="Occupation" value={pdsData.family?.spouseOccupation || pdsData.familyBackground?.spouseOccupation} />
              <Field label="Employer/Business Name" value={pdsData.family?.spouseEmployer || pdsData.familyBackground?.spouseEmployer} />
              <Field label="Business Address" value={pdsData.family?.spouseBusinessAddress || pdsData.familyBackground?.spouseBusinessAddress} fullWidth />
              <Field label="Telephone No." value={pdsData.family?.spouseTelephoneNo || pdsData.familyBackground?.spouseTelephoneNo} />
            </div>
          </div>

          {/* Parents */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Father&apos;s Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Surname" value={pdsData.family?.fatherSurname || pdsData.familyBackground?.fatherSurname} />
              <Field label="First Name" value={pdsData.family?.fatherFirstName || pdsData.familyBackground?.fatherFirstName} />
              <Field label="Middle Name" value={pdsData.family?.fatherMiddleName || pdsData.familyBackground?.fatherMiddleName} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Mother&apos;s Maiden Name</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Surname" value={pdsData.family?.motherMaidenSurname || pdsData.familyBackground?.motherMaidenSurname} />
              <Field label="First Name" value={pdsData.family?.motherFirstName || pdsData.familyBackground?.motherFirstName} />
              <Field label="Middle Name" value={pdsData.family?.motherMiddleName || pdsData.familyBackground?.motherMiddleName} />
            </div>
          </div>

          {/* Children */}
          {(pdsData.family?.children || pdsData.children) && (pdsData.family?.children || pdsData.children || []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Children</h3>
              <div className="space-y-2">
                {(pdsData.family?.children || pdsData.children || []).map((child: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-6">{index + 1}.</span>
                    <span className="text-sm text-slate-900 dark:text-slate-100 flex-1">{child.fullName}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {child.dateOfBirth ? format(new Date(child.dateOfBirth), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* III. EDUCATIONAL BACKGROUND */}
      <Section title="III. Educational Background" icon={GraduationCap} delay={0.25}>
        <div className="space-y-3">
          {(pdsData.education && typeof pdsData.education === 'object' && !Array.isArray(pdsData.education)) ? (
            ['elementary', 'secondary', 'vocational', 'college', 'graduate'].map((level) => {
              const edu = pdsData.education?.[level as keyof typeof pdsData.education];
              if (!edu) return null;

              return (
                <div key={level} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 capitalize text-slate-900 dark:text-slate-100">{level}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="School Name" value={edu.schoolName} fullWidth />
                    <Field label="Degree/Course" value={edu.degreeCourse} />
                    <Field label="Period From" value={edu.periodFrom ? format(new Date(edu.periodFrom), 'yyyy') : 'N/A'} />
                    <Field label="Period To" value={edu.periodTo ? format(new Date(edu.periodTo), 'yyyy') : 'N/A'} />
                    <Field label="Highest Level/Units Earned" value={edu.highestLevelEarned} />
                    <Field label="Year Graduated" value={edu.yearGraduated} />
                    <Field label="Scholarship/Honors Received" value={edu.honorsReceived} fullWidth />
                  </div>
                </div>
              );
            })
          ) : Array.isArray(pdsData.education) && pdsData.education.length > 0 ? (
            pdsData.education.map((edu: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 capitalize text-slate-900 dark:text-slate-100">{edu.level}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="School Name" value={edu.schoolName} fullWidth />
                  <Field label="Degree/Course" value={edu.degreeCourse} />
                  <Field label="Period From" value={edu.periodFrom ? format(new Date(edu.periodFrom), 'yyyy') : 'N/A'} />
                  <Field label="Period To" value={edu.periodTo ? format(new Date(edu.periodTo), 'yyyy') : 'N/A'} />
                  <Field label="Highest Level/Units Earned" value={edu.highestLevelEarned} />
                  <Field label="Year Graduated" value={edu.yearGraduated} />
                  <Field label="Scholarship/Honors Received" value={edu.honorsReceived} fullWidth />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No educational background available</p>
          )}
        </div>
      </Section>

      {/* IV. CIVIL SERVICE ELIGIBILITY */}
      {((pdsData.eligibility && pdsData.eligibility.length > 0) || (pdsData.civilService && pdsData.civilService.length > 0)) && (
        <Section title="IV. Civil Service Eligibility" icon={Award} delay={0.3}>
          <div className="space-y-3">
            {(pdsData.eligibility || pdsData.civilService || []).map((elig: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Career Service/RA 1080/Board/Bar/Examination" value={elig.eligibilityName} fullWidth />
                  <Field label="Rating" value={elig.rating} />
                  <Field label="Date of Examination/Conferment" value={elig.dateOfExam ? format(new Date(elig.dateOfExam), 'MMM d, yyyy') : 'N/A'} />
                  <Field label="Place of Examination/Conferment" value={elig.placeOfExam} fullWidth />
                  <Field label="License No." value={elig.licenseNo} />
                  <Field label="License Validity Date" value={elig.licenseValidityDate ? format(new Date(elig.licenseValidityDate), 'MMM d, yyyy') : 'N/A'} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* V. WORK EXPERIENCE */}
      {pdsData.workExperience && pdsData.workExperience.length > 0 && (
        <Section title="V. Work Experience" icon={Briefcase} delay={0.35}>
          <div className="space-y-3">
            {pdsData.workExperience.map((work: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Position Title" value={work.positionTitle} fullWidth />
                  <Field label="Department/Agency/Office/Company" value={work.departmentAgency} fullWidth />
                  <Field label="From" value={work.dateFrom ? format(new Date(work.dateFrom), 'MMM yyyy') : 'N/A'} />
                  <Field label="To" value={work.dateTo ? format(new Date(work.dateTo), 'MMM yyyy') : 'Present'} />
                  <Field label="Monthly Salary" value={work.monthlySalary ? `₱${work.monthlySalary.toLocaleString()}` : 'N/A'} />
                  <Field label="Salary Grade" value={work.salaryGrade} />
                  <Field label="Status of Appointment" value={work.statusOfAppointment} />
                  <Field label="Government Service" value={work.isGovernment} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* VI. VOLUNTARY WORK */}
      {pdsData.voluntaryWork && pdsData.voluntaryWork.length > 0 && (
        <Section title="VI. Voluntary Work" icon={Heart} delay={0.4}>
          <div className="space-y-3">
            {pdsData.voluntaryWork.map((vol: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Name & Address of Organization" value={`${vol.organizationName || ''}${vol.organizationAddress ? ` - ${vol.organizationAddress}` : ''}`} fullWidth />
                  <Field label="From" value={vol.dateFrom ? format(new Date(vol.dateFrom), 'MMM yyyy') : 'N/A'} />
                  <Field label="To" value={vol.dateTo ? format(new Date(vol.dateTo), 'MMM yyyy') : 'Present'} />
                  <Field label="Number of Hours" value={vol.numberOfHours} />
                  <Field label="Position/Nature of Work" value={vol.positionNature} fullWidth />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* VII. LEARNING & DEVELOPMENT */}
      {((pdsData.learningDevelopment && pdsData.learningDevelopment.length > 0) || (pdsData.training && pdsData.training.length > 0)) && (
        <Section title="VII. Learning and Development Interventions" icon={BookOpen} delay={0.45}>
          <div className="space-y-3">
            {(pdsData.learningDevelopment || pdsData.training || []).map((training: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Title of Learning and Development Interventions" value={training.title} fullWidth />
                  <Field label="From" value={training.dateFrom ? format(new Date(training.dateFrom), 'MMM d, yyyy') : 'N/A'} />
                  <Field label="To" value={training.dateTo ? format(new Date(training.dateTo), 'MMM d, yyyy') : 'N/A'} />
                  <Field label="Number of Hours" value={training.hours} />
                  <Field label="Type of LD" value={training.typeOfLd} />
                  <Field label="Conducted/Sponsored By" value={training.conductedBy} fullWidth />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* VIII. OTHER INFORMATION */}
      <Section title="VIII. Other Information" icon={Star} delay={0.5}>
        <div className="space-y-4">
          {/* Special Skills */}
          {pdsData.otherInfo?.skills && pdsData.otherInfo.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Special Skills and Hobbies</h3>
              <div className="flex flex-wrap gap-2">
                {pdsData.otherInfo.skills.map((skill: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recognitions */}
          {pdsData.otherInfo?.recognitions && pdsData.otherInfo.recognitions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Non-Academic Distinctions/Recognition</h3>
              <div className="space-y-2">
                {pdsData.otherInfo.recognitions.map((rec: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Field label="Title" value={rec.title} />
                      <Field label="Year" value={rec.year} />
                      <Field label="Organization" value={rec.organization} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Associations */}
          {pdsData.otherInfo?.associations && pdsData.otherInfo.associations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Membership in Association/Organization</h3>
              <div className="space-y-2">
                {pdsData.otherInfo.associations.map((assoc: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Field label="Name" value={assoc.name} />
                      <Field label="Position" value={assoc.position} />
                      <Field label="Year Joined" value={assoc.yearJoined} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Supplementary Questions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Have you ever been formally charged?" value={pdsData.otherInfo?.questions?.Q34_criminal_charged} />
                {pdsData.otherInfo?.questions?.Q34_criminal_charged && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q34_criminal_charged_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Have you ever been convicted?" value={pdsData.otherInfo?.questions?.Q35_criminal_convicted} />
                {pdsData.otherInfo?.questions?.Q35_criminal_convicted && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q35_criminal_convicted_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Have you ever been separated from service?" value={pdsData.otherInfo?.questions?.Q36_separated_from_service} />
                {pdsData.otherInfo?.questions?.Q36_separated_from_service && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q36_separated_from_service_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Have you ever been a candidate?" value={pdsData.otherInfo?.questions?.Q37_candidate_for_election} />
                {pdsData.otherInfo?.questions?.Q37_candidate_for_election && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q37_candidate_for_election_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Have you resigned from government service?" value={pdsData.otherInfo?.questions?.Q38_resigned_from_government} />
                {pdsData.otherInfo?.questions?.Q38_resigned_from_government && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q38_resigned_from_government_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Have you acquired immigrant status?" value={pdsData.otherInfo?.questions?.Q39_immigrant_or_acquired_residence} />
                {pdsData.otherInfo?.questions?.Q39_immigrant_or_acquired_residence && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q39_immigrant_or_acquired_residence_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Are you a member of indigenous group?" value={pdsData.otherInfo?.questions?.Q40_indigenous_group} />
                {pdsData.otherInfo?.questions?.Q40_indigenous_group && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q40_indigenous_group_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Are you a person with disability?" value={pdsData.otherInfo?.questions?.Q41_disabled} />
                {pdsData.otherInfo?.questions?.Q41_disabled && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q41_disabled_details} fullWidth />
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <Field label="Are you a solo parent?" value={pdsData.otherInfo?.questions?.Q42_solo_parent} />
                {pdsData.otherInfo?.questions?.Q42_solo_parent && (
                  <Field label="Details" value={pdsData.otherInfo.questions.Q42_solo_parent_details} fullWidth />
                )}
              </div>
            </div>
          </div>

          {/* References */}
          {pdsData.otherInfo?.references && pdsData.otherInfo.references.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Character References</h3>
              <div className="space-y-2">
                {pdsData.otherInfo.references.map((ref: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Field label="Name" value={ref.name} />
                      <Field label="Address" value={ref.address} />
                      <Field label="Telephone No." value={ref.telephoneNo} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
