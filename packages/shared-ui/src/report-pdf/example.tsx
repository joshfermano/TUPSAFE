/**
 * TUPSAFE Report PDF - Usage Examples
 *
 * This file demonstrates how to use the report PDF components
 * for various report types in the TUPSAFE system.
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import {
  ReportDocument,
  ensureReportFontsRegistered,
  validateReportData,
  type ReportData,
} from './index';

/**
 * Example 1: Employee List Report
 */
export async function generateEmployeeListReport(): Promise<Blob> {
  // Register fonts (call once per app lifecycle)
  ensureReportFontsRegistered();

  const reportData: ReportData = {
    reportType: 'users',
    headers: [
      'Employee ID',
      'Name',
      'Department',
      'Position',
      'Status',
      'Hire Date',
    ],
    data: [
      {
        'Employee ID': 'TUP-2024-001',
        'Name': 'Juan Dela Cruz',
        'Department': 'Computer Engineering',
        'Position': 'Associate Professor',
        'Status': 'Active',
        'Hire Date': '01/15/2024',
      },
      {
        'Employee ID': 'TUP-2024-002',
        'Name': 'Maria Santos',
        'Department': 'Computer Engineering',
        'Position': 'Assistant Professor',
        'Status': 'Active',
        'Hire Date': '02/01/2024',
      },
      // Add more employees...
    ],
    metadata: {
      reportTitle: 'Employee List Report',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      departmentName: 'Computer Engineering',
      generatedAt: new Date(),
      generatedBy: 'HR Administrator',
    },
  };

  // Validate data before rendering
  const validation = validateReportData(reportData);
  if (!validation.isValid) {
    throw new Error(`Invalid report data: ${validation.errors.join(', ')}`);
  }

  // Generate PDF blob
  const blob = await pdf(<ReportDocument data={reportData} />).toBlob();
  return blob;
}

/**
 * Example 2: PDS Submission Report
 */
export async function generatePDSSubmissionReport(
  startDate: Date,
  endDate: Date,
  departmentName?: string
): Promise<Blob> {
  ensureReportFontsRegistered();

  const reportData: ReportData = {
    reportType: 'submissions',
    headers: [
      'Submission ID',
      'Employee Name',
      'Employee ID',
      'Department',
      'Submitted On',
      'Status',
      'Reviewed By',
    ],
    data: [
      {
        'Submission ID': 'PDS-2024-001',
        'Employee Name': 'Juan Dela Cruz',
        'Employee ID': 'TUP-2024-001',
        'Department': 'Computer Engineering',
        'Submitted On': '03/15/2024',
        'Status': 'Approved',
        'Reviewed By': 'Department Head',
      },
      {
        'Submission ID': 'PDS-2024-002',
        'Employee Name': 'Maria Santos',
        'Employee ID': 'TUP-2024-002',
        'Department': 'Computer Engineering',
        'Submitted On': '03/16/2024',
        'Status': 'Pending',
        'Reviewed By': 'N/A',
      },
      // Add more submissions...
    ],
    metadata: {
      reportTitle: 'PDS Submission Report',
      startDate,
      endDate,
      departmentName,
      generatedAt: new Date(),
      generatedBy: 'HR Manager',
    },
  };

  const blob = await pdf(<ReportDocument data={reportData} />).toBlob();
  return blob;
}

/**
 * Example 3: Compliance Summary Report
 */
export async function generateComplianceReport(): Promise<Blob> {
  ensureReportFontsRegistered();

  const reportData: ReportData = {
    reportType: 'compliance',
    headers: [
      'Department',
      'Total Employees',
      'PDS Submitted',
      'SALN Submitted',
      'PDS %',
      'SALN %',
      'Overall %',
    ],
    data: [
      {
        'Department': 'Computer Engineering',
        'Total Employees': 45,
        'PDS Submitted': 43,
        'SALN Submitted': 41,
        'PDS %': 95.6,
        'SALN %': 91.1,
        'Overall %': 93.3,
      },
      {
        'Department': 'Electrical Engineering',
        'Total Employees': 38,
        'PDS Submitted': 38,
        'SALN Submitted': 36,
        'PDS %': 100.0,
        'SALN %': 94.7,
        'Overall %': 97.4,
      },
      // Add more departments...
    ],
    metadata: {
      reportTitle: 'Department Compliance Summary',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      collegeName: 'College of Engineering',
      generatedAt: new Date(),
      generatedBy: 'Dean\'s Office',
    },
  };

  const blob = await pdf(<ReportDocument data={reportData} />).toBlob();
  return blob;
}

/**
 * Example 4: New Registration Report
 */
export async function generateRegistrationReport(
  startDate: Date,
  endDate: Date
): Promise<Blob> {
  ensureReportFontsRegistered();

  const reportData: ReportData = {
    reportType: 'registrations',
    headers: [
      'Registration Date',
      'Applicant Name',
      'Email',
      'Position Applied',
      'Department',
      'Application Status',
      'Verification Status',
    ],
    data: [
      {
        'Registration Date': '01/10/2024',
        'Applicant Name': 'Pedro Reyes',
        'Email': 'pedro.reyes@example.com',
        'Position Applied': 'Instructor I',
        'Department': 'Computer Engineering',
        'Application Status': 'Under Review',
        'Verification Status': 'Verified',
      },
      {
        'Registration Date': '01/12/2024',
        'Applicant Name': 'Ana Garcia',
        'Email': 'ana.garcia@example.com',
        'Position Applied': 'Assistant Professor',
        'Department': 'Electrical Engineering',
        'Application Status': 'Shortlisted',
        'Verification Status': 'Verified',
      },
      // Add more registrations...
    ],
    metadata: {
      reportTitle: 'New Applicant Registrations',
      startDate,
      endDate,
      generatedAt: new Date(),
      generatedBy: 'HR Recruiter',
    },
  };

  const blob = await pdf(<ReportDocument data={reportData} />).toBlob();
  return blob;
}

/**
 * Helper: Download PDF blob
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Helper: Open PDF in new tab
 */
export function openPDFInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * Complete usage example with error handling
 */
export async function generateAndDownloadReport(
  reportType: 'employee' | 'pds' | 'compliance' | 'registration'
): Promise<void> {
  try {
    let blob: Blob;
    let filename: string;

    switch (reportType) {
      case 'employee':
        blob = await generateEmployeeListReport();
        filename = `employee-list-${Date.now()}.pdf`;
        break;
      case 'pds':
        blob = await generatePDSSubmissionReport(
          new Date('2024-01-01'),
          new Date('2024-12-31')
        );
        filename = `pds-submissions-${Date.now()}.pdf`;
        break;
      case 'compliance':
        blob = await generateComplianceReport();
        filename = `compliance-summary-${Date.now()}.pdf`;
        break;
      case 'registration':
        blob = await generateRegistrationReport(
          new Date('2024-01-01'),
          new Date('2024-12-31')
        );
        filename = `new-registrations-${Date.now()}.pdf`;
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    downloadPDF(blob, filename);
    console.log(`Report generated successfully: ${filename}`);
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
}
