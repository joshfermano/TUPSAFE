'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Building2,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  Briefcase,
  FileText,
  GraduationCap,
  Award,
  Target,
  FileWarning,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import { Textarea } from '../../../../components/ui/textarea';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { cn } from '../../../../lib/utils';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { ShineBorder } from '../../../../components/ui/shine-border';
import { ShimmerButton } from '../../../../components/ui/shimmer-button';
import AnimatedGradientText from '../../../../components/ui/animated-gradient-text';
import { BorderBeam } from '../../../../components/ui/border-beam';
import {
  usePositionQuery,
  useApplyForPositionMutation,
} from '../../../../hooks/usePositionsQuery';
import { toast } from 'sonner';

/**
 * Hook to fetch latest PDS submission
 */
function useLatestPDS() {
  const [latestPDS, setLatestPDS] = useState<{
    id: string;
    status: string;
    year: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestPDS() {
      try {
        const response = await fetch('/api/pds/latest');
        if (!response.ok) {
          if (response.status === 401) {
            setLatestPDS(null);
            return;
          }
          throw new Error('Failed to fetch PDS');
        }
        const result = await response.json();
        setLatestPDS(result.data);
      } catch (err) {
        console.error('Error fetching latest PDS:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch PDS');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLatestPDS();
  }, []);

  return { latestPDS, isLoading, error };
}

/**
 * Application form component with PDS requirement
 */
function ApplicationForm({
  positionId,
  pdsSubmissionId,
  onSuccess,
}: {
  positionId: string;
  pdsSubmissionId: string;
  onSuccess: () => void;
}) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const applyMutation = useApplyForPositionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (coverLetter.trim().length < 50) {
      toast.error('Cover letter must be at least 50 characters long');
      return;
    }

    try {
      await applyMutation.mutateAsync({
        positionId,
        coverLetter: coverLetter.trim(),
        resumeUrl: resumeUrl.trim() || undefined,
        pdsSubmissionId, // Always included
      });
      toast.success('Application submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">PDS will be attached to your application</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverLetter">
          Cover Letter <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="coverLetter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Tell us why you're the perfect fit for this position..."
          rows={8}
          className="resize-none"
          required
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Minimum 50 characters ({coverLetter.length}/50)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resumeUrl">Resume URL (Optional)</Label>
        <Input
          id="resumeUrl"
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://example.com/your-resume.pdf"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Provide a link to your resume or CV
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={applyMutation.isPending || coverLetter.trim().length < 50}
          className="flex-1 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#B8264D] hover:to-[#8B1538]">
          {applyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Position Details Page
 */
export default function PositionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const {
    data: position,
    isLoading,
    error,
    refetch,
  } = usePositionQuery(resolvedParams.id);

  const { latestPDS, isLoading: pdsLoading } = useLatestPDS();

  // Check if user has a valid PDS to apply
  const hasPDS = !!latestPDS;
  const pdsStatus = latestPDS?.status;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B1538]" />
      </div>
    );
  }

  if (error || !position) {
    return (
      <BlurFade delay={0.2} inView>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="text-red-800 dark:text-red-400">
              {error ? 'Failed to load position details' : 'Position not found'}
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/positions">Back to Positions</Link>
            </Button>
          </div>
        </Card>
      </BlurFade>
    );
  }

  const daysUntilDeadline = position.daysUntilDeadline;
  const isUrgent = daysUntilDeadline <= 7;

  return (
    <div className="space-y-8 pb-8">
      {/* Back Button */}
      <BlurFade delay={0.05} inView>
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/dashboard/positions">
            <ArrowLeft className="h-4 w-4" />
            Back to Positions
          </Link>
        </Button>
      </BlurFade>

      {/* Header */}
      <BlurFade delay={0.1} inView>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 flex-1">
              <AnimatedGradientText>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {position.positionTitle}
                </h1>
              </AnimatedGradientText>
              <p className="text-slate-600 dark:text-slate-400">
                {position.positionCode}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {position.isFeatured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {position.hasApplied && (
                <Badge
                  className="bg-green-100 text-green-800 border-green-200"
                  variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Applied
                </Badge>
              )}
            </div>
          </div>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Position Details */}
          <BlurFade delay={0.15} inView>
            <ShineBorder
              className="overflow-hidden rounded-xl"
              shineColor={
                position.isFeatured
                  ? ['#FFD700', '#FFA500', '#FF6347']
                  : ['#8B1538', '#B8264D', '#D4345F']
              }
              borderWidth={position.isFeatured ? 3 : 2}>
              {position.isFeatured && (
                <BorderBeam size={250} duration={12} delay={9} />
              )}
              <Card className="border-0">
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Position Overview
                  </h2>

                  {/* Key Details Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-[#8B1538]" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Department
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {position.departmentName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-[#8B1538]" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Employment Category
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {position.employmentCategory}
                        </p>
                      </div>
                    </div>

                    {position.salaryRangeMin && position.salaryRangeMax && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-[#8B1538]" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Salary Range
                          </p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            ₱{position.salaryRangeMin.toLocaleString()} - ₱
                            {position.salaryRangeMax.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#8B1538]" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Openings
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {position.numberOfOpenings} position(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 col-span-2">
                      <Calendar className="h-5 w-5 text-[#8B1538]" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Application Deadline
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {format(
                              new Date(position.applicationDeadline),
                              'MMMM dd, yyyy'
                            )}
                          </p>
                          {isUrgent && (
                            <Badge variant="destructive" className="ml-auto">
                              <Clock className="h-3 w-3 mr-1" />
                              {daysUntilDeadline}{' '}
                              {daysUntilDeadline === 1 ? 'day' : 'days'} left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#8B1538]" />
                      Description
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {position.description}
                    </p>
                  </div>

                  <Separator />

                  {/* Qualifications */}
                  {position.qualifications &&
                    position.qualifications.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-[#8B1538]" />
                          Qualifications
                        </h3>
                        <ul className="space-y-2">
                          {position.qualifications.map((qual, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">
                                {qual}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <Separator />

                  {/* Responsibilities */}
                  {position.responsibilities &&
                    position.responsibilities.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Target className="h-4 w-4 text-[#8B1538]" />
                          Key Responsibilities
                        </h3>
                        <ul className="space-y-2">
                          {position.responsibilities.map((resp, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm">
                              <Award className="h-4 w-4 text-[#8B1538] mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">
                                {resp}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Requirements */}
                  {position.requirements && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          Requirements
                        </h3>

                        {position.requirements.education &&
                          position.requirements.education.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Education
                              </h4>
                              <ul className="space-y-1">
                                {position.requirements.education.map(
                                  (item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-slate-600 dark:text-slate-400 pl-4">
                                      • {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {position.requirements.experience &&
                          position.requirements.experience.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Experience
                              </h4>
                              <ul className="space-y-1">
                                {position.requirements.experience.map(
                                  (item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-slate-600 dark:text-slate-400 pl-4">
                                      • {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {position.requirements.skills &&
                          position.requirements.skills.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Skills
                              </h4>
                              <ul className="space-y-1">
                                {position.requirements.skills.map(
                                  (item, index) => (
                                    <li
                                      key={index}
                                      className="text-sm text-slate-600 dark:text-slate-400 pl-4">
                                      • {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </ShineBorder>
          </BlurFade>

          {/* Application Form - Only show if user has PDS */}
          {showApplicationForm && !position.hasApplied && hasPDS && latestPDS && (
            <BlurFade delay={0.2} inView>
              <Card>
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Submit Your Application
                  </h2>
                  <ApplicationForm
                    positionId={resolvedParams.id}
                    pdsSubmissionId={latestPDS.id}
                    onSuccess={() => {
                      refetch();
                      setShowApplicationForm(false);
                    }}
                  />
                </div>
              </Card>
            </BlurFade>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status */}
          <BlurFade delay={0.25} inView>
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Application Status
                </h2>

                {position.hasApplied ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Application Submitted
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Status:{' '}
                          {position.applicationStatus?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/applications">
                        View My Applications
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* PDS Requirement Check */}
                    {pdsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking PDS status...
                      </div>
                    ) : !hasPDS ? (
                      // No PDS - Show CTA to create one
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <FileWarning className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">
                              PDS Required
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                              You need to complete your Personal Data Sheet (PDS) before applying to this position.
                            </p>
                          </div>
                        </div>
                        <Button asChild className="w-full bg-[#8B1538] hover:bg-[#6B0F2A]">
                          <Link href="/dashboard/pds/create">
                            <FileText className="h-4 w-4 mr-2" />
                            Create Your PDS
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      // Has PDS - Show apply button
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                              PDS Ready
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Your PDS ({latestPDS?.year}) will be attached to your application.
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Ready to take the next step in your career?
                        </p>
                        {showApplicationForm ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowApplicationForm(false)}>
                            Cancel
                          </Button>
                        ) : (
                          <ShimmerButton
                            className="w-full"
                            onClick={() => setShowApplicationForm(true)}
                            shimmerColor="#8B1538"
                            shimmerSize="0.1em"
                            borderRadius="0.5rem"
                            background="linear-gradient(to right, #8B1538, #B8264D)">
                            Apply Now
                          </ShimmerButton>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </BlurFade>

          {/* Quick Stats */}
          <BlurFade delay={0.3} inView>
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Quick Stats
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Applications Received
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {position.applicationsReceived}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Days Until Deadline
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        isUrgent
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-900 dark:text-slate-100'
                      )}>
                      {daysUntilDeadline}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Posted
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {format(new Date(position.postedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
