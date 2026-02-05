import { Document } from '@react-pdf/renderer';
import type { SALNData } from './types';
import { SALNPage1 } from './SALNPage1';
import { SALNPage2 } from './SALNPage2';
import { SALNPage3, shouldRenderSALNPage3 } from './SALNPage3';
import { SALNPage4, shouldRenderSALNPage4 } from './SALNPage4';
import { SALNAnnexB, shouldRenderAnnexB } from './SALNAnnexB';
import { SALNAnnexC, shouldRenderAnnexC } from './SALNAnnexC';

interface SALNDocumentProps {
  data: SALNData;
}

/**
 * SALN Document Component
 *
 * Orchestrates the complete SALN PDF document generation.
 * Supports both 2019 and 2025 CSC SALN formats.
 *
 * Document Structure:
 * - Page 1 (SALNPage1): Declarant info, Assets (Real & Personal Properties)
 * - Page 2 (SALNPage2): Liabilities, Business Interests, Relatives in Gov, Signatures
 *
 * 2025 Format Additional Pages:
 * - ANNEX B (SALNAnnexB): Overflow for declarant/joint properties (AS-1)
 * - ANNEX C (SALNAnnexC): Spouse & children exclusive properties (AS-2)
 *
 * 2019 Format Legacy Pages:
 * - Page 3 (SALNPage3): Continuation sheet for assets overflow
 * - Page 4 (SALNPage4): Continuation sheet for liabilities/business/relatives overflow
 *
 * @param props - Component props containing SALN data
 * @returns Complete SALN PDF document
 */
export function SALNDocument({ data }: SALNDocumentProps) {
  // Determine format version (default to 2019 for backward compatibility)
  const is2025Format = data.salnFormatVersion === 2025;

  return (
    <Document
      title={`SALN ${data.year} - ${data.declarantInfo.surname}, ${data.declarantInfo.firstName}`}
      subject="Statement of Assets, Liabilities and Net Worth"
      creator="TUPSAFE System"
      author={`${data.declarantInfo.surname}, ${data.declarantInfo.firstName}`}
    >
      {/* Main SALN Pages (Both Formats) */}
      <SALNPage1 data={data} />
      <SALNPage2 data={data} />

      {/* 2025 Format: ANNEX B & C for owner-based property separation */}
      {is2025Format && shouldRenderAnnexB(data) && <SALNAnnexB data={data} />}
      {is2025Format && shouldRenderAnnexC(data) && <SALNAnnexC data={data} />}

      {/* 2019 Format: Legacy continuation pages */}
      {!is2025Format && shouldRenderSALNPage3(data) && <SALNPage3 data={data} />}
      {!is2025Format && shouldRenderSALNPage4(data) && <SALNPage4 data={data} />}
    </Document>
  );
}
