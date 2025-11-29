/**
 * PDS Document Wrapper Component
 * CS Form No. 212 (Revised 2025)
 *
 * Combines all 4 pages of the Personal Data Sheet into a single PDF document
 */

import { Document } from '@react-pdf/renderer';
import PDSPage1 from './PDSPage1';
import PDSPage2 from './PDSPage2';
import PDSPage3 from './PDSPage3';
import PDSPage4 from './PDSPage4';
import type { PDSData } from './types';

interface PDSDocumentProps {
  data: PDSData;
}

/**
 * PDSDocument - Main wrapper component for the complete PDS PDF
 *
 * This component wraps all 4 pages of the Civil Service Commission
 * Personal Data Sheet (CS Form No. 212) into a single PDF document.
 *
 * Pages:
 * - Page 1: Personal Information & Family Background
 * - Page 2: Educational Background, Civil Service Eligibility & Work Experience
 * - Page 3: Voluntary Work, Training Programs & Other Information
 * - Page 4: Questions (34-42), References, Government ID & Declaration
 */
export function PDSDocument({ data }: PDSDocumentProps) {
  return (
    <Document
      title={`PDS - ${data.personalInfo.surname}, ${data.personalInfo.firstName}`}
      author="TUPSAFE - TUP Manila"
      subject="Personal Data Sheet (CS Form No. 212)"
      keywords="PDS, Civil Service, CS Form 212, Personal Data Sheet"
      creator="TUPSAFE System"
      producer="@react-pdf/renderer"
    >
      <PDSPage1 data={data} />
      <PDSPage2 data={data} />
      <PDSPage3 data={data} />
      <PDSPage4 data={data} />
    </Document>
  );
}

export default PDSDocument;
