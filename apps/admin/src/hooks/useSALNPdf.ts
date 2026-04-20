/**
 * SALN PDF Generation Hook
 *
 * Provides functionality for generating, downloading, and previewing
 * SALN (Statement of Assets, Liabilities and Net Worth) forms as PDF documents.
 *
 * Uses dynamic imports for @react-pdf/renderer and SALN PDF components
 * to avoid loading ~50KB+ of PDF libraries on pages that don't
 * immediately need PDF generation.
 *
 * Components are imported from the shared package via local re-exports.
 *
 * @module hooks/useSALNPdf
 */

import { useState, useCallback } from 'react';
import type { SALNData } from '@/components/saln/pdf';
import { validateSALNData } from '@/lib/utils/saln-validation';

// ============================================================================
// Types
// ============================================================================

export interface UseSALNPdfReturn {
  /**
   * Generate a PDF blob from SALN data
   * @param salnData - The SALN data to generate PDF from
   * @returns Promise resolving to a Blob containing the PDF
   */
  generatePDF: (salnData: SALNData) => Promise<Blob>;

  /**
   * Generate PDF and trigger browser download
   * @param salnData - The SALN data to generate PDF from
   * @param filename - Optional custom filename (defaults to SALN_LastName_FirstName_Year.pdf)
   */
  downloadPDF: (salnData: SALNData, filename?: string) => Promise<void>;

  /**
   * Generate PDF and open in a new browser tab
   * @param salnData - The SALN data to generate PDF from
   */
  openPDFInNewTab: (salnData: SALNData) => Promise<void>;

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
 * Generate a default filename for the SALN PDF
 * Format: SALN_LastName_FirstName_Year.pdf
 * Throws error if required fields are missing
 */
function generateDefaultFilename(salnData: SALNData): string {
  const surname = salnData.declarantInfo.surname;
  const firstName = salnData.declarantInfo.firstName;
  const year = salnData.year;

  if (!surname || !firstName) {
    throw new Error(
      'Cannot generate PDF: Name fields are required. Please ensure surname and first name are filled in the SALN submission.'
    );
  }

  if (!year) {
    throw new Error(
      'Cannot generate PDF: Year is required. Please specify the SALN year.'
    );
  }

  // Sanitize names for filename (remove special characters)
  const sanitizedSurname = surname.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '');

  return `SALN_${sanitizedSurname}_${sanitizedFirstName}_${year}.pdf`;
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
 * Hook for generating SALN PDF documents
 *
 * PDF libraries (@react-pdf/renderer, SALN document components) are loaded
 * on-demand via dynamic imports when generatePDF is first called, keeping
 * the initial page bundle lean.
 *
 * @returns Object containing PDF generation functions and state
 *
 * @example
 * ```tsx
 * import { useSALNPdf } from '@/hooks/useSALNPdf';
 * import { toast } from 'sonner';
 *
 * function SALNActions({ salnData }: { salnData: SALNData }) {
 *   const { downloadPDF, openPDFInNewTab, isGenerating, error } = useSALNPdf();
 *
 *   const handleDownload = async () => {
 *     try {
 *       await downloadPDF(salnData);
 *       toast.success('PDF downloaded successfully');
 *     } catch (error) {
 *       toast.error('Failed to generate PDF');
 *     }
 *   };
 *
 *   const handlePreview = async () => {
 *     try {
 *       await openPDFInNewTab(salnData);
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
export function useSALNPdf(): UseSALNPdfReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generate a PDF blob from SALN data
   * Dynamically imports @react-pdf/renderer and SALN components on first call
   */
  const generatePDF = useCallback(async (salnData: SALNData): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Validate data before generating PDF
      const validation = validateSALNData(salnData);

      if (!validation.isValid) {
        const errorMessages = validation.errors
          .map((e: string) => `${e}`)
          .join('; ');
        throw new Error(`Cannot generate PDF - ${errorMessages}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('PDF Generation Warnings:', validation.warnings);
      }

      // Dynamically import pdf-lib template filler via deep subpath
      // (NOT the barrel — barrel must stay free of pdf-lib transitive imports)
      const { fillSALN } = await import('@tupsafe/shared-ui/saln-template/saln-filler');

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : '';

      // Fill the government PDF template with data using pdf-lib
      const pdfBytes = await fillSALN(baseUrl, salnData);

      // Cast: pdf-lib returns Uint8Array<ArrayBufferLike>, Blob needs ArrayBuffer
      return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
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
    async (salnData: SALNData, filename?: string): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate the PDF blob
        const blob = await generatePDF(salnData);

        // Use provided filename or generate default
        const finalFilename = filename || generateDefaultFilename(salnData);

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
    async (salnData: SALNData): Promise<void> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Generate the PDF blob
        const blob = await generatePDF(salnData);

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

export default useSALNPdf;
