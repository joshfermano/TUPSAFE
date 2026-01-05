/**
 * PDS PDF Generation Hook
 *
 * Provides functionality for generating, downloading, and previewing
 * PDS (Personal Data Sheet) forms as PDF documents.
 *
 * Uses @react-pdf/renderer for client-side PDF generation.
 *
 * @module hooks/usePDSPdf
 */

import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDSDocument, ensurePDSFontsRegistered } from '@tupsafe/shared-ui/pds-pdf';
import type { PDSData } from '@tupsafe/shared-ui/pds-pdf';
import { validatePDSForPDF } from '../lib/utils/pds-validation';

// ============================================================================
// Types
// ============================================================================

export interface UsePDSPdfReturn {
  /**
   * Generate a PDF blob from PDS data
   * @param pdsData - The PDS data to generate PDF from
   * @returns Promise resolving to a Blob containing the PDF
   */
  generatePDF: (pdsData: PDSData) => Promise<Blob>;

  /**
   * Generate PDF and trigger browser download
   * @param pdsData - The PDS data to generate PDF from
   * @param filename - Optional custom filename (defaults to PDS_LastName_FirstName_Date.pdf)
   */
  downloadPDF: (pdsData: PDSData, filename?: string) => Promise<void>;

  /**
   * Generate PDF and open in a new browser tab
   * @param pdsData - The PDS data to generate PDF from
   */
  openPDFInNewTab: (pdsData: PDSData) => Promise<void>;

  /**
   * Whether a PDF generation operation is in progress
   */
  isGenerating: boolean;

  /**
   * Error that occurred during PDF generation, if any
   */
  error: Error | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a default filename for the PDS PDF
 * Format: PDS_LastName_FirstName_YYYYMMDD.pdf
 * Throws error if required name fields are missing
 */
function generateDefaultFilename(pdsData: PDSData): string {
  const lastName = pdsData.personalInfo.surname;
  const firstName = pdsData.personalInfo.firstName;

  if (!lastName || !firstName) {
    throw new Error('Cannot generate PDF: Name fields are required. Please ensure surname and first name are filled in the PDS submission.');
  }

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Sanitize names for filename (remove special characters)
  const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '');

  return `PDS_${sanitizedLastName}_${sanitizedFirstName}_${date}.pdf`;
}

/**
 * Trigger a browser download for a blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for generating PDS PDF documents
 *
 * Provides three main functions:
 * - generatePDF: Creates a PDF blob from PDS data
 * - downloadPDF: Generates and downloads the PDF
 * - openPDFInNewTab: Generates and opens PDF in a new tab
 *
 * @returns Object containing PDF generation functions and state
 *
 * @example
 * ```tsx
 * import { usePDSPdf } from '@/hooks/usePDSPdf';
 * import { toast } from 'sonner';
 *
 * function PDSActions({ pdsData }: { pdsData: PDSData }) {
 *   const { downloadPDF, openPDFInNewTab, isGenerating, error } = usePDSPdf();
 *
 *   const handleDownload = async () => {
 *     try {
 *       await downloadPDF(pdsData, 'my-pds.pdf');
 *       toast.success('PDF downloaded successfully');
 *     } catch (error) {
 *       toast.error('Failed to generate PDF');
 *     }
 *   };
 *
 *   const handlePreview = async () => {
 *     try {
 *       await openPDFInNewTab(pdsData);
 *     } catch (error) {
 *       toast.error('Failed to open PDF preview');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleDownload} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Download PDF'}
 *       </button>
 *       <button onClick={handlePreview} disabled={isGenerating}>
 *         Preview PDF
 *       </button>
 *       {error && <p className="text-red-500">{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePDSPdf(): UsePDSPdfReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate a PDF blob from PDS data
   */
  const generatePDF = useCallback(async (pdsData: PDSData): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      // STEP 1: Validate that pdsData is not null or undefined
      if (!pdsData) {
        throw new Error('Cannot generate PDF: PDS data is null or undefined');
      }

      // STEP 2: Validate critical structure exists
      if (!pdsData.personalInfo) {
        throw new Error('Cannot generate PDF: Personal information is missing');
      }

      // STEP 3: Validate required fields using validator
      const validation = validatePDSForPDF(pdsData);

      if (!validation.isValid) {
        const errorMessages = validation.errors
          .map(e => `${e.field}: ${e.message}`)
          .join('; ');
        throw new Error(`Cannot generate PDF - ${errorMessages}`);
      }

      // STEP 4: Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('PDF Generation Warnings:', validation.warnings);
      }

      // STEP 5: Ensure required nested structures exist
      if (!pdsData.familyBackground) {
        console.warn('Family background is missing, using empty structure');
        pdsData.familyBackground = {
          children: [],
        };
      }

      if (!pdsData.education) {
        console.warn('Education is missing, using empty structure');
        pdsData.education = {
          elementary: null,
          secondary: null,
          vocational: null,
          college: null,
          graduate: null,
        };
      }

      if (!pdsData.questions) {
        console.warn('Questions are missing, using default structure');
        pdsData.questions = {
          Q34_criminal_charged: false,
          Q35_criminal_convicted: false,
          Q36_separated_from_service: false,
          Q37_candidate_for_election: false,
          Q38_resigned_from_government: false,
          Q39_immigrant_or_acquired_residence: false,
          Q40_indigenous_group: false,
          Q41_disabled: false,
          Q42_solo_parent: false,
        };
      }

      // STEP 6: Ensure arrays exist
      pdsData.civilServiceEligibilities = pdsData.civilServiceEligibilities || [];
      pdsData.workExperiences = pdsData.workExperiences || [];
      pdsData.voluntaryWorks = pdsData.voluntaryWorks || [];
      pdsData.trainings = pdsData.trainings || [];
      pdsData.skills = pdsData.skills || [];
      pdsData.recognitions = pdsData.recognitions || [];
      pdsData.associations = pdsData.associations || [];
      pdsData.references = pdsData.references || [];

      // Get base URL for font paths and ensure fonts are registered
      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : '';
      ensurePDSFontsRegistered(baseUrl);

      // Create the PDF document element
      const document = PDSDocument({ data: pdsData });

      // Generate the PDF blob using @react-pdf/renderer
      const blob = await pdf(document).toBlob();

      return blob;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to generate PDF');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate PDF and trigger browser download
   */
  const downloadPDF = useCallback(
    async (pdsData: PDSData, filename?: string): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate the PDF blob
        const blob = await generatePDF(pdsData);

        // Use provided filename or generate default
        const finalFilename = filename || generateDefaultFilename(pdsData);

        // Trigger the download
        triggerDownload(blob, finalFilename);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to download PDF');
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePDF]
  );

  /**
   * Generate PDF and open in a new browser tab
   */
  const openPDFInNewTab = useCallback(
    async (pdsData: PDSData): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate the PDF blob
        const blob = await generatePDF(pdsData);

        // Create an object URL for the blob
        const url = URL.createObjectURL(blob);

        // Open in a new tab
        const newTab = window.open(url, '_blank');

        if (!newTab) {
          throw new Error(
            'Failed to open new tab. Please allow pop-ups for this site.'
          );
        }

        // Clean up the object URL after a delay
        // Note: We delay cleanup to ensure the PDF loads in the new tab
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to open PDF preview');
        setError(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePDF]
  );

  return {
    generatePDF,
    downloadPDF,
    openPDFInNewTab,
    isGenerating,
    error,
  };
}

export default usePDSPdf;
