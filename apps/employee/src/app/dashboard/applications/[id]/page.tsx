'use client';

import { useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../../components/ui/alert-dialog';
import { cn } from '../../../../lib/utils';
import {
  useApplicationQuery,
  useWithdrawApplicationMutation,
} from '../../../../hooks/useApplicationsQuery';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { ShineBorder } from '../../../../components/ui/shine-border';
import AnimatedGradientText from '../../../../components/ui/animated-gradient-text';
import { toast } from 'sonner';
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from '@tupsafe/types';

/**
 * Status badge color mapping (consistent with @tupsafe/types)
 */
const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  under_review: 'bg-blue-100 text-blue-700 border-blue-200',
  shortlisted: 'bg-purple-100 text-purple-700 border-purple-200',
  for_interview: 'bg-amber-100 text-amber-700 border-amber-200',
  interviewed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  for_final_review: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  withdrawn: 'bg-slate-100 text-slate-700 border-slate-200',
  hired: 'bg-green-100 text-green-700 border-green-200',
};

/**
 * Get status label from shared types
 */
const getStatusLabel = (status: string): string => {
  return (
    APPLICATION_STATUS_LABELS[status as ApplicationStatus] ||
    status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};

/**
 * Timeline component for status history
 */
function StatusTimeline({
  history,
}: {
  history: Array<{
    id: string;
    previousStatus: string | null;
    newStatus: string;
    changedAt: string;
    notes: string | null;
    changedBy: string;
  }>;
}) {
  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <BlurFade key={item.id} delay={0.1 * index} inView>
          <div className="relative flex gap-4">
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
            )}

            {/* Status icon */}
            <div
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                statusColors[item.newStatus] || 'bg-gray-100 border-gray-200'
              )}>
              {item.newStatus === 'accepted' || item.newStatus === 'hired' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : item.newStatus === 'rejected' ||
                item.newStatus === 'withdrawn' ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>

            {/* Status details */}
            <div className="flex-1 space-y-1 pb-8">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {getStatusLabel(item.newStatus)}
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(item.changedAt), 'MMM dd, yyyy h:mm a')}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Updated by {item.changedBy}
              </p>
              {item.notes && (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        </BlurFade>
      ))}
    </div>
  );
}

/**
 * Application Details Page
 */
export default function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const {
    data: application,
    isLoading,
    error,
  } = useApplicationQuery(resolvedParams.id);
  const withdrawMutation = useWithdrawApplicationMutation();

  const handleWithdraw = async () => {
    try {
      await withdrawMutation.mutateAsync(resolvedParams.id);
      toast.success('Application withdrawn successfully');
      setWithdrawDialogOpen(false);
      router.push('/dashboard/applications');
    } catch (_error) {
      toast.error('Failed to withdraw application');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B1538]" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <BlurFade delay={0.2} inView>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="text-red-800 dark:text-red-400">
              {error
                ? 'Failed to load application details'
                : 'Application not found'}
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/applications">Back to Applications</Link>
            </Button>
          </div>
        </Card>
      </BlurFade>
    );
  }

  const canWithdraw = application.status === 'pending';

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <BlurFade delay={0.05} inView>
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/dashboard/applications">
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Link>
        </Button>
      </BlurFade>

      {/* Header */}
      <BlurFade delay={0.1} inView>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <AnimatedGradientText>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {application.position.title}
              </h1>
            </AnimatedGradientText>
            <p className="text-slate-600 dark:text-slate-400">
              Application #{application.applicationNumber}
            </p>
          </div>
          <div className="flex gap-3">
            <Badge
              className={cn(
                'border text-base px-4 py-1',
                statusColors[application.status] ||
                  'bg-gray-100 text-gray-800 border-gray-200'
              )}
              variant="outline">
              {getStatusLabel(application.status)}
            </Badge>
            {canWithdraw && (
              <AlertDialog
                open={withdrawDialogOpen}
                onOpenChange={setWithdrawDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Withdraw Application
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to withdraw this application? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending}
                      className="bg-red-600 hover:bg-red-700">
                      {withdrawMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Withdrawing...
                        </>
                      ) : (
                        'Withdraw'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
              shineColor={['#8B1538', '#B8264D', '#D4345F']}
              borderWidth={2}>
              <Card className="border-0">
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Position Details
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-[#8B1538]" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Department
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {application.position.department.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#8B1538]" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Employment Category
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {application.position.employmentCategory?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    {application.position.salaryRangeMin &&
                      application.position.salaryRangeMax && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-[#8B1538]" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Salary Range
                            </p>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              ₱
                              {application.position.salaryRangeMin.toLocaleString()}{' '}
                              - ₱
                              {application.position.salaryRangeMax.toLocaleString()}
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
                          {application.position.numberOfOpenings} position(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {application.position.description}
                      </p>
                    </div>

                    {application.position.qualifications.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Qualifications
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                          {application.position.qualifications.map(
                            (qual, index) => (
                              <li key={index}>{qual}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {application.position.responsibilities.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Responsibilities
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                          {application.position.responsibilities.map(
                            (resp, index) => (
                              <li key={index}>{resp}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {application.position.requirements && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Requirements
                        </h3>

                        {application.position.requirements.education &&
                         application.position.requirements.education.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                              Education
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                              {application.position.requirements.education.map(
                                (edu, index) => (
                                  <li key={index}>{edu}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {application.position.requirements.experience &&
                         application.position.requirements.experience.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                              Experience
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                              {application.position.requirements.experience.map(
                                (exp, index) => (
                                  <li key={index}>{exp}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {application.position.requirements.skills &&
                         application.position.requirements.skills.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1.5">
                              Skills
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                              {application.position.requirements.skills.map(
                                (skill, index) => (
                                  <li key={index}>{skill}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </ShineBorder>
          </BlurFade>

          {/* Interview Information */}
          {application.interviewDate && (
            <BlurFade delay={0.2} inView>
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Interview Scheduled
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Date & Time:</strong>{' '}
                      {format(
                        new Date(application.interviewDate),
                        'MMMM dd, yyyy h:mm a'
                      )}
                    </p>
                    {application.interviewLocation && (
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Location:</strong>{' '}
                        {application.interviewLocation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </BlurFade>
          )}

          {/* Submitted Documents */}
          <BlurFade delay={0.25} inView>
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Submitted Documents
                </h2>
                <div className="space-y-3">
                  {application.pdsSubmissionId && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#8B1538]" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Personal Data Sheet (PDS)
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/dashboard/pds/view/${application.pdsSubmissionId}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                  {application.resumeUrl && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#8B1538]" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Resume/CV
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </BlurFade>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Info */}
          <BlurFade delay={0.3} inView>
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Application Info
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Applied On
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {format(
                          new Date(application.applicationDate),
                          'MMMM dd, yyyy'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last Updated
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {format(
                          new Date(application.updatedAt),
                          'MMMM dd, yyyy'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </BlurFade>

          {/* Status Timeline */}
          <BlurFade delay={0.35} inView>
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Status History
                </h2>
                <StatusTimeline history={application.statusHistory} />
              </div>
            </Card>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
