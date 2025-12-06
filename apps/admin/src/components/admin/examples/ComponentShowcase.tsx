'use client';

/**
 * Component Showcase
 *
 * Demonstrates usage of ReviewDialog, ConfirmationDialog, and SectionCard components.
 * This file serves as both documentation and a testing ground for the components.
 *
 * To view: Import this component in any page and render it.
 */

import * as React from 'react';
import { User, GraduationCap, Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ReviewDialog,
  ConfirmationDialog,
  SectionCard,
  SectionCardField,
  SectionCardGrid,
} from '@/components/admin';

export function ComponentShowcase() {
  // ReviewDialog state
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewLoading, setReviewLoading] = React.useState(false);

  // ConfirmationDialog states
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmWithKeywordOpen, setConfirmWithKeywordOpen] = React.useState(false);
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  // Mock data for SectionCard examples
  const personalData = {
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    middleName: 'Santos',
    dateOfBirth: 'January 15, 1990',
    civilStatus: 'Married',
    citizenship: 'Filipino',
  };

  const contactData = {
    email: 'juan.delacruz@tup.edu.ph',
    phone: '(02) 8123-4567',
    mobile: '+63 912 345 6789',
    address: '123 Rizal Avenue, Manila, Philippines',
  };

  const education = [
    {
      id: 1,
      school: 'Technological University of the Philippines',
      degree: 'Master of Engineering',
      year: '2015',
      honors: 'Cum Laude',
    },
    {
      id: 2,
      school: 'University of the Philippines',
      degree: 'Bachelor of Science in Engineering',
      year: '2012',
      honors: 'Magna Cum Laude',
    },
  ];

  const workExperience = [
    {
      id: 1,
      position: 'Associate Professor',
      company: 'TUP Manila - College of Engineering',
      startDate: 'June 2015',
      endDate: 'Present',
      description: 'Teaching undergraduate and graduate courses in mechanical engineering.',
    },
    {
      id: 2,
      position: 'Assistant Professor',
      company: 'TUP Manila - College of Engineering',
      startDate: 'July 2012',
      endDate: 'May 2015',
      description: 'Conducted research and taught engineering courses.',
    },
  ];

  // ReviewDialog handlers
  const handleApprove = async (notes?: string) => {
    setReviewLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setReviewLoading(false);
    console.log('Approved with notes:', notes);
  };

  const handleReject = async (notes: string) => {
    setReviewLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setReviewLoading(false);
    console.log('Rejected with notes:', notes);
  };

  // ConfirmationDialog handlers
  const handleDelete = async () => {
    setConfirmLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setConfirmLoading(false);
    toast.success('User deleted successfully');
    console.log('User deleted');
  };

  const handleDeleteAll = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success('All submissions deleted');
    console.log('All submissions deleted');
  };

  const handleEdit = (section: string) => {
    toast.info(`Editing ${section}`);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Component Showcase</h1>
        <p className="mt-2 text-muted-foreground">
          Demonstration of ReviewDialog, ConfirmationDialog, and SectionCard components
        </p>
      </div>

      <Separator />

      {/* ReviewDialog Demo */}
      <Card>
        <CardHeader>
          <CardTitle>ReviewDialog Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A comprehensive dialog for reviewing PDS/SALN submissions with three action options:
            Approve, Reject, or Request Changes.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setReviewOpen(true)}>Open Review Dialog</Button>
            <Button variant="outline" onClick={() => setReviewOpen(true)}>
              Review Submission
            </Button>
          </div>

          <ReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            submissionId="demo-123"
            submissionType="pds"
            currentStatus="pending"
            employeeName="Juan Dela Cruz"
            onApprove={handleApprove}
            onReject={handleReject}
            isSubmitting={reviewLoading}
          />
        </CardContent>
      </Card>

      {/* ConfirmationDialog Demo */}
      <Card>
        <CardHeader>
          <CardTitle>ConfirmationDialog Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A generic confirmation dialog for destructive or important actions, with optional
            keyword confirmation.
          </p>
          <div className="flex gap-3">
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Delete User (Simple)
            </Button>
            <Button variant="destructive" onClick={() => setConfirmWithKeywordOpen(true)}>
              Delete All (With Keyword)
            </Button>
          </div>

          {/* Simple Confirmation */}
          <ConfirmationDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete User Account?"
            description="This action cannot be undone. The user will no longer have access to the system."
            variant="danger"
            confirmText="Delete User"
            onConfirm={handleDelete}
            isLoading={confirmLoading}
          />

          {/* With Keyword Confirmation */}
          <ConfirmationDialog
            open={confirmWithKeywordOpen}
            onOpenChange={setConfirmWithKeywordOpen}
            title="Delete All Submissions?"
            description="This will permanently delete ALL submissions in the system. This action cannot be undone and will affect all users."
            variant="danger"
            requireConfirmation
            confirmationKeyword="DELETE ALL"
            confirmText="Delete Everything"
            onConfirm={handleDeleteAll}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* SectionCard Demo */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">SectionCard Component Examples</h2>
        <p className="mb-6 text-muted-foreground">
          Reusable card components for displaying form sections with optional collapse/expand and
          edit functionality.
        </p>

        <div className="space-y-6">
          {/* Simple Section Card */}
          <SectionCard title="Personal Information" icon={<User className="h-5 w-5" />}>
            <SectionCardGrid columns={2}>
              <SectionCardField label="First Name" value={personalData.firstName} />
              <SectionCardField label="Last Name" value={personalData.lastName} />
              <SectionCardField label="Middle Name" value={personalData.middleName} />
              <SectionCardField label="Date of Birth" value={personalData.dateOfBirth} />
              <SectionCardField label="Civil Status" value={personalData.civilStatus} />
              <SectionCardField label="Citizenship" value={personalData.citizenship} />
            </SectionCardGrid>
          </SectionCard>

          {/* Section with Edit Button */}
          <SectionCard
            title="Contact Information"
            icon={<Mail className="h-5 w-5" />}
            onEdit={() => handleEdit('Contact Information')}
            editLabel="Edit Contact"
          >
            <SectionCardGrid columns={2}>
              <SectionCardField
                label="Email Address"
                value={
                  <a
                    href={`mailto:${contactData.email}`}
                    className="text-primary hover:underline"
                  >
                    {contactData.email}
                  </a>
                }
              />
              <SectionCardField label="Phone Number" value={contactData.phone} />
              <SectionCardField label="Mobile Number" value={contactData.mobile} />
            </SectionCardGrid>
            <div className="mt-4">
              <SectionCardField
                label="Address"
                value={
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <span>{contactData.address}</span>
                  </div>
                }
              />
            </div>
          </SectionCard>

          {/* Collapsible Section */}
          <SectionCard
            title="Educational Background"
            icon={<GraduationCap className="h-5 w-5" />}
            collapsible
            defaultCollapsed
            onEdit={() => handleEdit('Educational Background')}
            editLabel="Edit Education"
          >
            <div className="space-y-6">
              {education.map((edu) => (
                <div key={edu.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <SectionCardGrid columns={2}>
                    <SectionCardField label="School" value={edu.school} />
                    <SectionCardField label="Degree" value={edu.degree} />
                    <SectionCardField label="Year Graduated" value={edu.year} />
                    <SectionCardField label="Honors" value={edu.honors} />
                  </SectionCardGrid>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Collapsible with Complex Content */}
          <SectionCard
            title="Work Experience"
            icon={<Briefcase className="h-5 w-5" />}
            collapsible
            onEdit={() => handleEdit('Work Experience')}
          >
            <div className="space-y-6">
              {workExperience.map((exp) => (
                <div key={exp.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <h4 className="mb-3 text-lg font-semibold">{exp.position}</h4>
                  <SectionCardGrid columns={2}>
                    <SectionCardField label="Company/Institution" value={exp.company} />
                    <SectionCardField
                      label="Duration"
                      value={`${exp.startDate} - ${exp.endDate}`}
                    />
                  </SectionCardGrid>
                  {exp.description && (
                    <div className="mt-3">
                      <dt className="mb-1 text-sm font-medium text-muted-foreground">
                        Description
                      </dt>
                      <dd className="text-sm text-muted-foreground">{exp.description}</dd>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Section with Custom Grid Columns */}
          <SectionCard title="Three Column Layout" collapsible defaultCollapsed>
            <SectionCardGrid columns={3}>
              <SectionCardField label="Column 1" value="Value 1" />
              <SectionCardField label="Column 2" value="Value 2" />
              <SectionCardField label="Column 3" value="Value 3" />
              <SectionCardField label="Column 4" value="Value 4" />
              <SectionCardField label="Column 5" value="Value 5" />
              <SectionCardField label="Column 6" value="Value 6" />
            </SectionCardGrid>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
