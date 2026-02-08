import { Document } from '@react-pdf/renderer';
import type { SALNData } from './types';
import { SALNPage1 } from './SALNPage1';
import { SALNPage2 } from './SALNPage2';
import { SALNAnnexB, shouldRenderAnnexB } from './SALNAnnexB';
import { SALNAnnexC, shouldRenderAnnexC } from './SALNAnnexC';

interface SALNDocumentProps {
  data: SALNData;
}

/**
 * SALN Document Component
 *
 * Orchestrates the complete SALN PDF document generation.
 * Uses CSC 2025 SALN format for all submissions.
 *
 * Document Structure:
 * - Page 1 (SALNPage1): Declarant info, Assets (Real & Personal Properties)
 * - Page 2 (SALNPage2): Liabilities, Business Interests, Relatives in Gov, Signatures
 * - ANNEX B (SALNAnnexB): Overflow for declarant/joint properties (AS-1)
 * - ANNEX C (SALNAnnexC): Spouse & children exclusive properties (AS-2)
 *
 * @param props - Component props containing SALN data
 * @returns Complete SALN PDF document
 */
export function SALNDocument({ data }: SALNDocumentProps) {
  return (
    <Document
      title={`SALN ${data.year} - ${data.declarantInfo.surname}, ${data.declarantInfo.firstName}`}
      subject="Statement of Assets, Liabilities and Net Worth"
      creator="TUPSAFE System"
      author={`${data.declarantInfo.surname}, ${data.declarantInfo.firstName}`}
    >
      {/* Main SALN Pages */}
      <SALNPage1 data={data} />
      <SALNPage2 data={data} />

      {/* ANNEX B & C for owner-based property separation */}
      {shouldRenderAnnexB(data) && <SALNAnnexB data={data} />}
      {shouldRenderAnnexC(data) && <SALNAnnexC data={data} />}
    </Document>
  );
}
