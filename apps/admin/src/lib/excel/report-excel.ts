import ExcelJS from 'exceljs';

/**
 * Report types supported by the Excel export utility
 */
type ReportType = 'users' | 'registrations' | 'submissions' | 'compliance';

/**
 * Metadata for the Excel report
 */
interface ReportMetadata {
  startDate: Date;
  endDate: Date;
  departmentName?: string;
}

/**
 * TUP Maroon brand color
 */
const TUP_MAROON = '8B1538';
const LIGHT_GRAY = 'F5F5F5';
const WHITE = 'FFFFFF';

/**
 * Format date to readable string
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format datetime to readable string
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * Get report title based on report type
 */
function getReportTitle(reportType: ReportType): string {
  const titles: Record<ReportType, string> = {
    users: 'USERS',
    registrations: 'REGISTRATIONS',
    submissions: 'SUBMISSIONS',
    compliance: 'COMPLIANCE',
  };
  return `TUPSAFE ${titles[reportType]} REPORT`;
}

/**
 * Calculate optimal column width based on content
 */
function calculateColumnWidth(header: string, data: (string | number)[]): number {
  const headerLength = header.length;
  const maxDataLength = data.reduce((max: number, value) => {
    const valueLength = String(value).length;
    return valueLength > max ? valueLength : max;
  }, 0);

  // Add padding and set minimum width
  const optimalWidth = Math.max(headerLength, maxDataLength as number) + 2;
  return Math.min(Math.max(optimalWidth, 10), 50); // Min 10, Max 50
}

/**
 * Generates an Excel report with TUP branding and professional styling
 *
 * @param reportType - Type of report being generated
 * @param headers - Column headers for the data
 * @param data - Array of data objects to include in the report
 * @param metadata - Report metadata including date range and optional department
 * @returns Promise resolving to Excel file as Buffer
 *
 * @example
 * ```typescript
 * const buffer = await generateExcelReport(
 *   'users',
 *   ['Name', 'Email', 'Role', 'Status'],
 *   [
 *     { Name: 'John Doe', Email: 'john@tup.edu.ph', Role: 'Employee', Status: 'Active' },
 *     { Name: 'Jane Smith', Email: 'jane@tup.edu.ph', Role: 'HR', Status: 'Active' }
 *   ],
 *   {
 *     startDate: new Date('2024-01-01'),
 *     endDate: new Date('2024-12-31'),
 *     departmentName: 'Computer Science'
 *   }
 * );
 * ```
 */
export async function generateExcelReport(
  reportType: ReportType,
  headers: string[],
  data: Record<string, string | number>[],
  metadata: ReportMetadata
): Promise<Buffer> {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report', {
    pageSetup: {
      fitToPage: true,
      orientation: 'landscape',
      paperSize: 9, // A4
    },
  });

  // Set workbook properties
  workbook.creator = 'TUPSAFE System';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  let currentRow = 1;

  // ============================================
  // TITLE ROW
  // ============================================
  const titleRow = worksheet.getRow(currentRow);
  titleRow.height = 30;

  // Merge cells for title
  worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
  const titleCell = worksheet.getCell(currentRow, 1);
  titleCell.value = getReportTitle(reportType);
  titleCell.font = {
    name: 'Calibri',
    size: 16,
    bold: true,
    color: { argb: WHITE },
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: TUP_MAROON },
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  titleCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  currentRow++;

  // ============================================
  // PERIOD ROW
  // ============================================
  const periodRow = worksheet.getRow(currentRow);
  periodRow.height = 20;

  worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
  const periodCell = worksheet.getCell(currentRow, 1);
  periodCell.value = `Period: ${formatDate(metadata.startDate)} - ${formatDate(metadata.endDate)}`;
  periodCell.font = {
    name: 'Calibri',
    size: 11,
    italic: true,
  };
  periodCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  periodCell.border = {
    left: { style: 'thin' },
    right: { style: 'thin' },
  };

  currentRow++;

  // ============================================
  // DEPARTMENT ROW (if applicable)
  // ============================================
  if (metadata.departmentName) {
    const deptRow = worksheet.getRow(currentRow);
    deptRow.height = 20;

    worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
    const deptCell = worksheet.getCell(currentRow, 1);
    deptCell.value = `Department: ${metadata.departmentName}`;
    deptCell.font = {
      name: 'Calibri',
      size: 11,
      italic: true,
    };
    deptCell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    deptCell.border = {
      left: { style: 'thin' },
      right: { style: 'thin' },
    };

    currentRow++;
  }

  // ============================================
  // GENERATED ROW
  // ============================================
  const generatedRow = worksheet.getRow(currentRow);
  generatedRow.height = 20;

  worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
  const generatedCell = worksheet.getCell(currentRow, 1);
  generatedCell.value = `Generated: ${formatDateTime(new Date())}`;
  generatedCell.font = {
    name: 'Calibri',
    size: 10,
    italic: true,
    color: { argb: '666666' },
  };
  generatedCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  generatedCell.border = {
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  currentRow++;

  // Add empty row for spacing
  currentRow++;

  // ============================================
  // HEADER ROW
  // ============================================
  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 25;

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: WHITE },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: TUP_MAROON },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Freeze the header row (after metadata rows)
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: currentRow,
      topLeftCell: `A${currentRow + 1}`,
      activeCell: `A${currentRow + 1}`,
    },
  ];

  currentRow++;

  // ============================================
  // DATA ROWS
  // ============================================
  data.forEach((record, recordIndex) => {
    const dataRow = worksheet.getRow(currentRow);
    dataRow.height = 20;

    // Alternating row colors
    const isEvenRow = recordIndex % 2 === 0;
    const backgroundColor = isEvenRow ? WHITE : LIGHT_GRAY;

    // Get values in order using Object.values() to match the order of keys
    const values = Object.values(record);

    headers.forEach((header, columnIndex) => {
      const cell = dataRow.getCell(columnIndex + 1);
      const value = values[columnIndex];

      // Handle different value types
      if (typeof value === 'number') {
        cell.value = value;
        cell.numFmt = '#,##0.00';
      } else {
        cell.value = value || '';
      }

      cell.font = {
        name: 'Calibri',
        size: 11,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: backgroundColor },
      };
      cell.alignment = {
        horizontal: typeof value === 'number' ? 'right' : 'left',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    currentRow++;
  });

  // ============================================
  // AUTO-FIT COLUMN WIDTHS
  // ============================================
  headers.forEach((header, index) => {
    const columnData = data.map((record) => Object.values(record)[index]);
    const columnWidth = calculateColumnWidth(header, columnData);
    worksheet.getColumn(index + 1).width = columnWidth;
  });

  // Add a summary row if data exists
  if (data.length > 0) {
    currentRow++; // Empty row for spacing
    const summaryRow = worksheet.getRow(currentRow);
    summaryRow.height = 20;

    worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
    const summaryCell = worksheet.getCell(currentRow, 1);
    summaryCell.value = `Total Records: ${data.length}`;
    summaryCell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
    };
    summaryCell.alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
    summaryCell.border = {
      top: { style: 'double' },
    };
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Helper function to trigger Excel file download in browser
 *
 * @param buffer - Excel file buffer
 * @param filename - Name for the downloaded file
 */
export function downloadExcelFile(buffer: Buffer, filename: string): void {
  const blob = new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate filename for Excel report
 *
 * @param reportType - Type of report
 * @param metadata - Report metadata
 * @returns Formatted filename
 */
export function generateReportFilename(
  reportType: ReportType,
  metadata: ReportMetadata
): string {
  const dateStr = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-');

  const deptStr = metadata.departmentName
    ? `_${metadata.departmentName.replace(/\s+/g, '-')}`
    : '';

  return `TUPSAFE_${reportType.toUpperCase()}_Report${deptStr}_${dateStr}.xlsx`;
}
