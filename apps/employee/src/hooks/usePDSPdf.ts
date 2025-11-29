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
import { PDSDocument } from '../components/pds/pdf';
import { ensurePDFFontsRegistered } from '@/components/pds/pdf/PDSStyles';
import type { PDSData } from '../components/pds/pdf/types';

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
 */
function generateDefaultFilename(pdsData: PDSData): string {
  const lastName = pdsData.personalInfo.surname || 'Unknown';
  const firstName = pdsData.personalInfo.firstName || 'Unknown';
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
      // Get base URL for font paths and ensure fonts are registered
      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : '';
      ensurePDFFontsRegistered(baseUrl);

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
