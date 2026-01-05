/**
 * PDS Document Wrapper Component
 * CS Form No. 212 (Revised 2025)
 *
 * Combines all 4 pages of the Personal Data Sheet into a single PDF document
 */

import { Document } from '@react-pdf/renderer';
import { PDSPage1 } from './PDSPage1';
import { PDSPage2 } from './PDSPage2';
import { PDSPage3 } from './PDSPage3';
import { PDSPage4 } from './PDSPage4';
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
 *
 * @param data - Complete PDS data structure conforming to PDSData type
 * @returns PDF Document with all 4 pages
 */
export function PDSDocument({ data }: PDSDocumentProps) {
  // CRITICAL VALIDATIONS - These should never fail if usePDSPdf validated properly
  if (!data) {
    throw new Error('PDSDocument: data prop is required');
  }

  if (!data.personalInfo) {
    throw new Error('PDSDocument: data.personalInfo is required');
  }

  if (!data.personalInfo.surname || !data.personalInfo.firstName) {
    throw new Error(
      'PDSDocument: data.personalInfo must include surname and firstName'
    );
  }

  // Defensive checks for nested structures - ensure arrays exist
  const safeData: PDSData = {
    ...data,
    familyBackground: data.familyBackground || { children: [] },
    education: data.education || {
      elementary: null,
      secondary: null,
      vocational: null,
      college: null,
      graduate: null,
    },
    civilServiceEligibilities: data.civilServiceEligibilities || [],
    workExperiences: data.workExperiences || [],
    voluntaryWorks: data.voluntaryWorks || [],
    trainings: data.trainings || [],
    skills: data.skills || [],
    recognitions: data.recognitions || [],
    associations: data.associations || [],
    references: data.references || [],
    questions: data.questions || {
      Q34_criminal_charged: false,
      Q35_criminal_convicted: false,
      Q36_separated_from_service: false,
      Q37_candidate_for_election: false,
      Q38_resigned_from_government: false,
      Q39_immigrant_or_acquired_residence: false,
      Q40_indigenous_group: false,
      Q41_disabled: false,
      Q42_solo_parent: false,
    },
  };

  // Log warnings for missing optional data
  if (!data.familyBackground) {
    console.warn('PDSDocument: familyBackground is missing, using defaults');
  }
  if (!data.education) {
    console.warn('PDSDocument: education is missing, using defaults');
  }
  if (!data.questions) {
    console.warn('PDSDocument: questions are missing, using defaults');
  }

  return (
    <Document
      title={`PDS - ${safeData.personalInfo.surname}, ${safeData.personalInfo.firstName}`}
      author="TUPSAFE - TUP Manila"
      subject="Personal Data Sheet (CS Form No. 212)"
      keywords="PDS, Civil Service, CS Form 212, Personal Data Sheet, TUP Manila"
      creator="TUPSAFE System"
      producer="@react-pdf/renderer"
    >
      <PDSPage1 data={safeData} />
      <PDSPage2 data={safeData} />
      <PDSPage3 data={safeData} />
      <PDSPage4 data={safeData} />
    </Document>
  );
}

export default PDSDocument;
