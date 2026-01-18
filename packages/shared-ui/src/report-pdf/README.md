# TUPSAFE Report PDF Generation

Professional PDF report generation components for TUPSAFE compliance, user, registration, and submission reports.

## Features

- **Legal landscape orientation** - Optimized for wide data tables
- **TUP Manila branding** - Official TUP Maroon (#8B1538) color scheme
- **Professional styling** - Alternating row colors, clean headers, proper spacing
- **Automatic pagination** - 25 rows per page with page numbers
- **Comprehensive headers** - Date ranges, filters, generation timestamp
- **Confidential footer** - Security notice on every page

## Usage

### Basic Example

```typescript
import { ReportDocument, ensureReportFontsRegistered } from '@tupsafe/shared-ui/report-pdf';
import { pdf } from '@react-pdf/renderer';

// Register fonts before generating PDF
ensureReportFontsRegistered();

// Prepare report data
const reportData = {
  reportType: 'users',
  headers: ['Employee ID', 'Name', 'Department', 'Status', 'Hire Date'],
  data: [
    {
      'Employee ID': 'TUP-2024-001',
      'Name': 'Juan Dela Cruz',
      'Department': 'Computer Engineering',
      'Status': 'Active',
      'Hire Date': '01/15/2024',
    },
    // ... more rows
  ],
  metadata: {
    reportTitle: 'Employee List Report',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    departmentName: 'Computer Engineering',
    generatedAt: new Date(),
    generatedBy: 'Admin User',
  },
};

// Generate PDF blob
const blob = await pdf(<ReportDocument data={reportData} />).toBlob();

// Download or save
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'employee-report.pdf';
link.click();
```

### Report Types

- `users` - Employee/user listing reports
- `registrations` - New registration reports
- `submissions` - PDS/SALN submission reports
- `compliance` - Compliance tracking reports

### Data Structure

```typescript
interface ReportData {
  reportType: 'users' | 'registrations' | 'submissions' | 'compliance';
  headers: string[]; // Column headers (must match data keys)
  data: Record<string, string | number>[]; // Array of row objects
  metadata: {
    reportTitle: string; // Main report title
    startDate: Date; // Report period start
    endDate: Date; // Report period end
    departmentName?: string; // Optional department filter
    collegeName?: string; // Optional college filter
    generatedAt: Date; // Generation timestamp
    generatedBy?: string; // Optional user who generated report
  };
}
```

### Validation

```typescript
import { validateReportData } from '@tupsafe/shared-ui/report-pdf';

const validation = validateReportData(reportData);

if (!validation.isValid) {
  console.error('Invalid report data:', validation.errors);
}
```

### Custom Column Widths

```typescript
import { calculateColumnWidths } from '@tupsafe/shared-ui/report-pdf';

// Auto-calculate optimal widths
const widths = calculateColumnWidths(headers, data);

// Or specify custom widths
const customWidths = ['15%', '30%', '25%', '15%', '15%'];
```

## Components

### ReportDocument
Main document component that generates the complete PDF.

### ReportHeader
Header with title, logo placeholders, date range, and filters.

### TableHeader
Column headers with TUP Maroon background.

### TableRow
Data rows with alternating background colors.

### ReportFooter
Fixed footer with confidential notice and page numbers.

### SectionHeader (Optional)
Section dividers for multi-section reports.

## Styling

All styles are defined in `ReportStyles.ts`:

- **TUP Maroon**: `#8B1538` (headers)
- **TUP Gold**: `#FFD700` (accent)
- **Alternate rows**: `#F5F5F5` (light gray)
- **Font**: Liberation Serif (professional, free)
- **Page size**: Legal (8.5" x 14")
- **Orientation**: Landscape
- **Rows per page**: 25

## Font Registration

Fonts must be registered before PDF generation:

```typescript
import { ensureReportFontsRegistered } from '@tupsafe/shared-ui/report-pdf';

// Call once per application lifecycle
ensureReportFontsRegistered();
```

Font files should be in `public/fonts/`:
- `liberation-serif-regular.woff`
- `liberation-serif-bold.woff`
- `liberation-serif-italic.woff`
- `liberation-serif-bold-italic.woff`

## Best Practices

1. **Always validate data** before rendering
2. **Register fonts** once at application startup
3. **Keep headers concise** for better table layout
4. **Use meaningful report titles** in metadata
5. **Include date ranges** for context
6. **Format dates consistently** using provided utilities
7. **Handle empty data** gracefully (built-in empty state)

## Related Files

- Similar pattern to `pds-pdf/` components
- Uses same Liberation Serif fonts
- Follows TUPSAFE coding standards
- Compatible with `@react-pdf/renderer` 3.x+

## Integration Examples

### Admin Dashboard Reports
```typescript
// apps/admin/src/app/reports/[type]/page.tsx
import { ReportDocument } from '@tupsafe/shared-ui/report-pdf';
```

### Compliance Reports
```typescript
// Generate monthly compliance report
const complianceData = {
  reportType: 'compliance',
  headers: ['Department', 'Total Employees', 'PDS Submitted', 'SALN Submitted', 'Compliance %'],
  // ... data from database query
};
```

## Troubleshooting

**Issue**: Fonts not loading
- **Solution**: Ensure `public/fonts/` contains Liberation Serif .woff files
- **Solution**: Call `ensureReportFontsRegistered()` before rendering

**Issue**: Table too wide
- **Solution**: Reduce column count or use custom widths
- **Solution**: Abbreviate header text

**Issue**: Data not showing
- **Solution**: Verify headers exactly match data object keys
- **Solution**: Run `validateReportData()` to check structure

**Issue**: Page breaks in wrong place
- **Solution**: Rows per page is set to 25 (optimal for landscape legal)
- **Solution**: Adjust `ROWS_PER_PAGE` constant in `ReportDocument.tsx` if needed

## License

Internal use - TUPSAFE TUP Manila
