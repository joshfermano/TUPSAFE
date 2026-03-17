import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { reportStyles } from './ReportStyles';
import { ReportHeader, TableHeader, TableRow, EmptyTableRow, ReportFooter } from './ReportComponents';
import type { ReportDocumentProps } from './types';

/**
 * TUPSAFE Report PDF Document
 * Main document component for generating professional reports
 * Handles pagination with 25 rows per page
 */

const ROWS_PER_PAGE = 25;

/**
 * ReportDocument - Main PDF document component
 * Takes ReportData as props and generates a multi-page PDF report
 */
export const ReportDocument: React.FC<ReportDocumentProps> = ({ data }) => {
  const { headers, data: tableData, metadata } = data;

  // Calculate pagination
  const totalRows = tableData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));

  // Handle empty data case
  if (totalRows === 0) {
    return (
      <Document>
        <Page size="LEGAL" orientation="landscape" style={reportStyles.page}>
          {/* Header */}
          <ReportHeader metadata={metadata} />

          {/* Table with empty state */}
          <View style={reportStyles.table}>
            <TableHeader headers={headers} />
            <EmptyTableRow />
          </View>

          {/* Footer */}
          <ReportFooter pageNumber={1} totalPages={1} />
        </Page>
      </Document>
    );
  }

  // Generate pages with data
  const pages: React.ReactNode[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const startIndex = pageIndex * ROWS_PER_PAGE;
    const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
    const pageRows = tableData.slice(startIndex, endIndex);

    pages.push(
      <Page
        key={pageIndex}
        size="LEGAL"
        orientation="landscape"
        style={reportStyles.page}
      >
        {/* Header - shows on every page */}
        <ReportHeader metadata={metadata} />

        {/* Table */}
        <View style={reportStyles.table}>
          {/* Table header - shows on every page */}
          <TableHeader headers={headers} />

          {/* Table rows */}
          {pageRows.map((row, rowIndex) => {
            const isAlternate = rowIndex % 2 === 1;
            return (
              <TableRow
                key={startIndex + rowIndex}
                data={row}
                headers={headers}
                isAlternate={isAlternate}
              />
            );
          })}
        </View>

        {/* Footer - shows on every page */}
        <ReportFooter pageNumber={pageIndex + 1} totalPages={totalPages} />
      </Page>
    );
  }

  return <Document>{pages}</Document>;
};

/**
 * Helper function to calculate optimal column widths based on content
 * Can be used by calling components to customize column widths
 */
export function calculateColumnWidths(
  headers: string[],
  _data: Record<string, string | number>[]
): string[] {
  // Simple equal distribution for now
  // Can be enhanced to analyze content and adjust widths dynamically
  const equalWidth = `${100 / headers.length}%`;
  return headers.map(() => equalWidth);
}

/**
 * Helper function to validate report data before rendering
 */
export function validateReportData(data: ReportDocumentProps['data']): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!data.reportType) {
    errors.push('Report type is required');
  }

  if (!data.headers || data.headers.length === 0) {
    errors.push('Headers are required');
  }

  if (!data.data) {
    errors.push('Data array is required');
  }

  if (!data.metadata) {
    errors.push('Metadata is required');
  } else {
    if (!data.metadata.startDate) {
      errors.push('Start date is required in metadata');
    }
    if (!data.metadata.endDate) {
      errors.push('End date is required in metadata');
    }
    if (!data.metadata.generatedAt) {
      errors.push('Generated at timestamp is required in metadata');
    }
    if (!data.metadata.reportTitle) {
      errors.push('Report title is required in metadata');
    }
  }

  // Validate data structure
  if (data.data && data.headers) {
    const hasInvalidRows = data.data.some((row) => {
      return !data.headers.every((header) => header in row);
    });

    if (hasInvalidRows) {
      errors.push('Some data rows are missing required header fields');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
