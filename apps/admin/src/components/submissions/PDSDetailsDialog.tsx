/**
 * PDS Details Dialog
 *
 * Comprehensive view of PDS submission with all sections in tabs
 */

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle, XCircle, User, Users, GraduationCap, Briefcase, Award } from 'lucide-react';
import { usePDSDetails } from '@/hooks/useSubmissions';
import { format } from 'date-fns';

interface PDSDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function PDSDetailsDialog({
  open,
  onOpenChange,
  submissionId,
  onApprove,
  onReject,
}: PDSDetailsDialogProps) {
  const { data: pdsData, isLoading } = usePDSDetails(submissionId);

  const canApproveReject =
    pdsData?.submission.status === 'submitted' ||
    pdsData?.submission.status === 'reviewing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : pdsData ? (
          <>
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-2xl">
                    {pdsData.employee.firstName} {pdsData.employee.lastName}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {pdsData.employee.employeeId && (
                      <span>{pdsData.employee.employeeId}</span>
                    )}
                    {pdsData.employee.department && (
                      <>
                        <span>•</span>
                        <span>{pdsData.employee.department.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      pdsData.submission.status === 'approved'
                        ? 'default'
                        : pdsData.submission.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {pdsData.submission.status}
                  </Badge>
                  <Badge variant="outline">CY {pdsData.submission.year}</Badge>
                  <span className="text-xs text-muted-foreground">v{pdsData.submission.version}</span>
                </div>
              </div>
            </DialogHeader>

            <Separator />

            {/* Content Tabs */}
            <ScrollArea className="flex-1 px-6">
              <Tabs defaultValue="personal" className="pb-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">
                    <User className="h-4 w-4 mr-2" />
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="family">
                    <Users className="h-4 w-4 mr-2" />
                    Family
                  </TabsTrigger>
                  <TabsTrigger value="education">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Education
                  </TabsTrigger>
                  <TabsTrigger value="work">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Work
                  </TabsTrigger>
                  <TabsTrigger value="other">
                    <Award className="h-4 w-4 mr-2" />
                    Other
                  </TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <PersonalInfoSection data={pdsData.pdsData.personalInfo} />
                </TabsContent>

                {/* Family Background Tab */}
                <TabsContent value="family" className="space-y-4 mt-4">
                  <FamilyBackgroundSection
                    familyData={pdsData.pdsData.familyBackground}
                    childrenData={pdsData.pdsData.children}
                  />
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4 mt-4">
                  <EducationSection education={pdsData.pdsData.education} />
                </TabsContent>

                {/* Work Experience Tab */}
                <TabsContent value="work" className="space-y-4 mt-4">
                  <WorkExperienceSection
                    workExperience={pdsData.pdsData.workExperience}
                    voluntaryWork={pdsData.pdsData.voluntaryWork}
                  />
                </TabsContent>

                {/* Other Information Tab */}
                <TabsContent value="other" className="space-y-4 mt-4">
                  <OtherInfoSection
                    civilService={pdsData.pdsData.civilService}
                    training={pdsData.pdsData.training}
                    otherInfo={pdsData.pdsData.otherInfo}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>

            {/* Footer Actions */}
            {canApproveReject && (
              <>
                <Separator />
                <div className="px-6 py-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onReject}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button onClick={onApprove} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PersonalInfoSection({ data }: { data: any }) {
  if (!data) return <div className="text-muted-foreground">No data available</div>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoField label="First Name" value={data.firstName} />
      <InfoField label="Middle Name" value={data.middleName} />
      <InfoField label="Last Name" value={data.lastName} />
      <InfoField label="Name Extension" value={data.nameExtension} />
      <InfoField label="Date of Birth" value={data.dateOfBirth} />
      <InfoField label="Place of Birth" value={data.placeOfBirth} />
      <InfoField label="Sex" value={data.sex} />
      <InfoField label="Civil Status" value={data.civilStatus} />
      <InfoField label="Height (m)" value={data.height} />
      <InfoField label="Weight (kg)" value={data.weight} />
      <InfoField label="Blood Type" value={data.bloodType} />
      <InfoField label="GSIS ID No." value={data.gsisIdNo} />
      <InfoField label="Pag-IBIG ID No." value={data.pagibigIdNo} />
      <InfoField label="PhilHealth No." value={data.philhealthNo} />
      <InfoField label="SSS No." value={data.sssNo} />
      <InfoField label="TIN" value={data.tinNo} />
    </div>
  );
}

function FamilyBackgroundSection({
  familyData,
  childrenData,
}: {
  familyData: any;
  childrenData: any[];
}) {
  return (
    <div className="space-y-6">
      {familyData?.spouse && (
        <div>
          <h3 className="font-semibold mb-3">Spouse Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Name" value={familyData.spouse.name} />
            <InfoField label="Occupation" value={familyData.spouse.occupation} />
            <InfoField label="Employer" value={familyData.spouse.employer} />
            <InfoField label="Business Address" value={familyData.spouse.businessAddress} />
          </div>
        </div>
      )}

      {childrenData && childrenData.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Children</h3>
          <div className="space-y-2">
            {childrenData.map((child: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-3 grid grid-cols-2 gap-4">
                <InfoField label="Name" value={child.name} />
                <InfoField label="Date of Birth" value={child.dateOfBirth} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EducationSection({ education }: { education: any[] }) {
  if (!education || education.length === 0) {
    return <div className="text-muted-foreground">No education records</div>;
  }

  return (
    <div className="space-y-3">
      {education.map((edu: any, idx: number) => (
        <div key={idx} className="border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Level" value={edu.level} />
            <InfoField label="School Name" value={edu.schoolName} />
            <InfoField label="Degree/Course" value={edu.degreeCourse} />
            <InfoField label="Period" value={`${edu.from} - ${edu.to}`} />
            <InfoField label="Units Earned" value={edu.unitsEarned} />
            <InfoField label="Year Graduated" value={edu.yearGraduated} />
            <InfoField label="Honors" value={edu.honors} />
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkExperienceSection({
  workExperience,
  voluntaryWork,
}: {
  workExperience: any[];
  voluntaryWork: any[];
}) {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="work">
        <AccordionTrigger>Work Experience ({workExperience?.length || 0})</AccordionTrigger>
        <AccordionContent>
          {workExperience && workExperience.length > 0 ? (
            <div className="space-y-3">
              {workExperience.map((work: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Position" value={work.position} />
                    <InfoField label="Company" value={work.company} />
                    <InfoField label="Period" value={`${work.from} - ${work.to}`} />
                    <InfoField label="Salary" value={work.monthlySalary} />
                    <InfoField label="Grade" value={work.salaryGrade} />
                    <InfoField label="Status" value={work.statusOfAppointment} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No work experience</div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="voluntary">
        <AccordionTrigger>Voluntary Work ({voluntaryWork?.length || 0})</AccordionTrigger>
        <AccordionContent>
          {voluntaryWork && voluntaryWork.length > 0 ? (
            <div className="space-y-3">
              {voluntaryWork.map((vol: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Organization" value={vol.organization} />
                    <InfoField label="Position" value={vol.position} />
                    <InfoField label="Period" value={`${vol.from} - ${vol.to}`} />
                    <InfoField label="Hours" value={vol.numberOfHours} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No voluntary work</div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function OtherInfoSection({
  civilService,
  training,
  otherInfo,
}: {
  civilService: any[];
  training: any[];
  otherInfo: any;
}) {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="civil-service">
        <AccordionTrigger>Civil Service Eligibility ({civilService?.length || 0})</AccordionTrigger>
        <AccordionContent>
          {civilService && civilService.length > 0 ? (
            <div className="space-y-3">
              {civilService.map((cs: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Eligibility" value={cs.eligibility} />
                    <InfoField label="Rating" value={cs.rating} />
                    <InfoField label="Date of Exam" value={cs.dateOfExam} />
                    <InfoField label="Place of Exam" value={cs.placeOfExam} />
                    <InfoField label="License No." value={cs.licenseNumber} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No civil service eligibility</div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="training">
        <AccordionTrigger>Training Programs ({training?.length || 0})</AccordionTrigger>
        <AccordionContent>
          {training && training.length > 0 ? (
            <div className="space-y-3">
              {training.map((tr: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Title" value={tr.title} />
                    <InfoField label="Sponsor" value={tr.sponsor} />
                    <InfoField label="Period" value={`${tr.from} - ${tr.to}`} />
                    <InfoField label="Hours" value={tr.numberOfHours} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No training programs</div>
          )}
        </AccordionContent>
      </AccordionItem>

      {otherInfo && (
        <AccordionItem value="other">
          <AccordionTrigger>Other Information</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Skills" value={otherInfo.skills?.join(', ')} />
              <InfoField label="Recognitions" value={otherInfo.recognitions?.join(', ')} />
              <InfoField label="Organizations" value={otherInfo.organizations?.join(', ')} />
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}
