import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import {
  styles,
  PDS_COLORS,
  PDS_DIMENSIONS,
  PDS_FONT_SIZES,
} from './PDSStyles';

/**
 * PDS Reusable Components for CS Form No. 212 (Revised 2025)
 * These components are used across all pages of the PDS PDF
 */

/* ========== PAGE HEADER ========== */

/**
 * PDSPageHeader - Top-left corner "CS Form No. 212" and "Revised 2025"
 */
export const PDSPageHeader: React.FC = () => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 10,
        left: 20,
        flexDirection: 'column',
      }}
    >
      <Text style={styles.csFormNumber}>CS Form No. 212</Text>
      <Text style={styles.csFormNumber}>Revised 2025</Text>
    </View>
  );
};

/* ========== FORM TITLE ========== */

/**
 * PDSFormTitle - Main form title with warning and instructions
 * Shows on Page 1 only
 */
export const PDSFormTitle: React.FC = () => {
  return (
    <View style={styles.formHeader}>
      <Text style={styles.formTitle}>PERSONAL DATA SHEET</Text>
      <Text style={styles.warningText}>
        WARNING: Any misrepresentation made in the Personal Data Sheet and the
        Work Experience Sheet shall cause the filing of administrative/criminal
        case/s against the person concerned.
      </Text>
      <Text style={styles.formSubtitle}>
        READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS)
        BEFORE ACCOMPLISHING THE PDS FORM.
      </Text>
      <Text style={{ ...styles.formSubtitle, marginTop: 2 }}>
        Print legibly. Tick appropriate boxes ( ☑ ) and use
        <Text style={styles.bold}> N/A </Text>
        if not applicable.
        <Text style={styles.bold}> DO NOT ABBREVIATE.</Text>
      </Text>
    </View>
  );
};

/* ========== SECTION HEADERS ========== */

/**
 * SectionHeader - Yellow/Orange header for sections I-VIII
 * Format: "I. PERSONAL INFORMATION"
 */
interface SectionHeaderProps {
  number: string; // "I", "II", "III", etc.
  title: string; // "PERSONAL INFORMATION", etc.
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  number,
  title,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <Text>
        {number}. {title}
      </Text>
    </View>
  );
};

/**
 * SubSectionHeader - Light gray header for table columns and sub-sections
 */
interface SubSectionHeaderProps {
  title: string;
  colSpan?: number;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export const SubSectionHeader: React.FC<SubSectionHeaderProps> = ({
  title,
  width,
  align = 'center',
}) => {
  const alignStyle =
    align === 'left'
      ? { textAlign: 'left' as const }
      : align === 'right'
        ? { textAlign: 'right' as const }
        : {};

  return (
    <View
      style={[styles.subSectionHeader, width ? { width } : {}, alignStyle]}
    >
      <Text>{title}</Text>
    </View>
  );
};

/* ========== TABLE ROWS ========== */

/**
 * TableRow - Standard data row with borders
 */
interface TableRowProps {
  children: React.ReactNode;
  height?: number;
  minHeight?: number;
  noBorder?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  height,
  minHeight = PDS_DIMENSIONS.rowHeight,
  noBorder = false,
}) => {
  return (
    <View
      style={[
        noBorder ? styles.tableRowNoBorder : styles.tableRow,
        height ? { height } : {},
        { minHeight },
      ]}
    >
      {children}
    </View>
  );
};

/**
 * EmptyTableRow - Empty row with guaranteed minimum height
 * Creates 'columns' number of empty cells with borders
 */
interface EmptyTableRowProps {
  columns: number;
  height?: number;
  columnWidths?: (string | number)[];
}

export const EmptyTableRow: React.FC<EmptyTableRowProps> = ({
  columns,
  height = PDS_DIMENSIONS.emptyRowHeight,
  columnWidths,
}) => {
  const cells = Array.from({ length: columns }, (_, i) => (
    <View
      key={i}
      style={[
        styles.tableCell,
        columnWidths && columnWidths[i]
          ? { width: columnWidths[i] }
          : { flex: 1 },
        i === columns - 1 ? { borderRightWidth: 0 } : {}, // No border on last cell
      ]}
    />
  ));

  return (
    <View style={[styles.tableRow, { height, minHeight: height }]}>{cells}</View>
  );
};

/* ========== CELL COMPONENTS ========== */

/**
 * FieldCell - White background for data values
 */
interface CellProps {
  children?: React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  flex?: number;
  noBorder?: boolean;
  bold?: boolean;
}

export const FieldCell: React.FC<CellProps> = ({
  children,
  width,
  align = 'left',
  flex,
  noBorder = false,
  bold = false,
}) => {
  const alignStyle =
    align === 'center'
      ? styles.center
      : align === 'right'
        ? styles.right
        : {};

  return (
    <View
      style={[
        noBorder ? styles.tableCellNoBorder : styles.tableCell,
        width ? { width } : {},
        flex ? { flex } : {},
        { backgroundColor: PDS_COLORS.white },
      ]}
    >
      <Text
        style={[
          styles.fieldValueNormal,
          alignStyle,
          bold ? styles.bold : {},
        ]}
      >
        {children || ''}
      </Text>
    </View>
  );
};

/**
 * LabelCell - Light gray background for field labels
 * Smaller font size
 */
export const LabelCell: React.FC<CellProps> = ({
  children,
  width,
  align = 'left',
  flex,
  noBorder = false,
}) => {
  const alignStyle =
    align === 'center'
      ? styles.center
      : align === 'right'
        ? styles.right
        : {};

  return (
    <View
      style={[
        styles.labelCell,
        noBorder ? { borderRightWidth: 0 } : {},
        width ? { width } : {},
        flex ? { flex } : {},
      ]}
    >
      <Text style={[styles.fieldLabel, alignStyle]}>
        {children || ''}
      </Text>
    </View>
  );
};

/* ========== CONTINUE TEXT ========== */

/**
 * ContinueText - "(Continue on separate sheet if necessary)"
 * RED (#FF0000) italic text
 */
interface ContinueTextProps {
  align?: 'center' | 'right';
  marginTop?: number;
}

export const ContinueText: React.FC<ContinueTextProps> = ({
  align = 'center',
  marginTop = 5,
}) => {
  const alignStyle =
    align === 'center'
      ? { textAlign: 'center' as const }
      : { textAlign: 'right' as const };

  return (
    <View style={{ marginTop }}>
      <Text style={[styles.continueText, alignStyle]}>
        (Continue on separate sheet if necessary)
      </Text>
    </View>
  );
};

/* ========== PAGE FOOTER ========== */

/**
 * PDSPageFooter - Bottom section with signature, date, and page number
 * Left: "SIGNATURE" with line
 * Center: "(wet signature/e-signature/digital certificate)"
 * Right: "DATE" with line
 * Bottom right: "CS FORM 212 (Revised 2025), Page X of 4"
 */
interface PDSPageFooterProps {
  pageNumber: number;
  totalPages?: number;
  showSignature?: boolean;
}

export const PDSPageFooter: React.FC<PDSPageFooterProps> = ({
  pageNumber,
  totalPages = 4,
  showSignature = true,
}) => {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 10,
        left: PDS_DIMENSIONS.pagePadding,
        right: PDS_DIMENSIONS.pagePadding,
      }}
    >
      {/* Signature and Date Row */}
      {showSignature && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 3,
            alignItems: 'flex-end',
          }}
        >
          {/* Signature Section - Left */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: PDS_FONT_SIZES.footerText }}>
              SIGNATURE
            </Text>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: PDS_COLORS.black,
                width: 150,
                marginTop: 15,
              }}
            />
          </View>

          {/* Center Note */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: PDS_FONT_SIZES.noteText,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              (wet signature/e-signature/digital certificate)
            </Text>
          </View>

          {/* Date Section - Right */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: PDS_FONT_SIZES.footerText }}>DATE</Text>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: PDS_COLORS.black,
                width: 150,
                marginTop: 15,
              }}
            />
          </View>
        </View>
      )}

      {/* Page Number - Bottom Right */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: showSignature ? 5 : 0,
        }}
      >
        <Text
          style={{
            fontSize: PDS_FONT_SIZES.footerText,
            fontStyle: 'italic',
          }}
        >
          CS FORM 212 (Revised 2025), Page {pageNumber} of {totalPages}
        </Text>
      </View>
    </View>
  );
};

/* ========== CHECKBOX ========== */

/**
 * CheckboxField - Square checkbox (filled if checked) with label
 */
interface CheckboxFieldProps {
  checked: boolean;
  label: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  checked,
  label,
}) => {
  return (
    <View style={styles.checkboxRow}>
      <View style={checked ? styles.checkboxChecked : styles.checkbox}>
        {checked && (
          <Text style={{ fontSize: 6, color: PDS_COLORS.white }}>✓</Text>
        )}
      </View>
      <Text style={{ fontSize: PDS_FONT_SIZES.fieldValue }}>{label}</Text>
    </View>
  );
};

/* ========== SPECIALIZED COMPONENTS ========== */

/**
 * PhotoBox - For ID photo (4.5cm x 3.5cm)
 * Shows "PHOTO" text if no image provided
 */
interface PhotoBoxProps {
  imageUrl?: string;
}

export const PhotoBox: React.FC<PhotoBoxProps> = ({ imageUrl }) => {
  return (
    <View style={styles.photoBox}>
      {imageUrl ? (
        <Text style={{ fontSize: PDS_FONT_SIZES.noteText }}>
          [Photo: {imageUrl}]
        </Text>
      ) : (
        <Text
          style={{
            fontSize: PDS_FONT_SIZES.sectionHeader,
            fontWeight: 'bold',
            color: '#CCCCCC',
          }}
        >
          PHOTO
        </Text>
      )}
    </View>
  );
};

/**
 * ThumbmarkBox - For right thumb mark
 */
interface ThumbmarkBoxProps {
  imageUrl?: string;
}

export const ThumbmarkBox: React.FC<ThumbmarkBoxProps> = ({ imageUrl }) => {
  return (
    <View style={styles.thumbmarkBox}>
      {imageUrl ? (
        <Text style={{ fontSize: PDS_FONT_SIZES.noteText }}>
          [Thumbmark: {imageUrl}]
        </Text>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: PDS_FONT_SIZES.noteText,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            RIGHT
          </Text>
          <Text
            style={{
              fontSize: PDS_FONT_SIZES.noteText,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            THUMBMARK
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * SignatureBox - For signature area
 */
interface SignatureBoxProps {
  signatureUrl?: string;
}

export const SignatureBox: React.FC<SignatureBoxProps> = ({
  signatureUrl,
}) => {
  return (
    <View style={styles.signatureBox}>
      {signatureUrl ? (
        <Text style={{ fontSize: PDS_FONT_SIZES.noteText }}>
          [Signature: {signatureUrl}]
        </Text>
      ) : (
        <Text
          style={{
            fontSize: PDS_FONT_SIZES.noteText,
            color: '#CCCCCC',
          }}
        >
          [Signature]
        </Text>
      )}
    </View>
  );
};

/* ========== HELPER COMPONENTS ========== */

/**
 * SectionDivider - Adds spacing between sections
 */
interface SectionDividerProps {
  height?: number;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  height = 10,
}) => {
  return <View style={{ height }} />;
};

/**
 * TableHeaderRow - Creates a header row with multiple columns
 */
interface TableHeaderRowProps {
  columns: { title: string; width?: string | number; align?: 'left' | 'center' | 'right' }[];
}

export const TableHeaderRow: React.FC<TableHeaderRowProps> = ({ columns }) => {
  return (
    <TableRow noBorder>
      {columns.map((col, index) => (
        <SubSectionHeader
          key={index}
          title={col.title}
          width={col.width}
          align={col.align}
        />
      ))}
    </TableRow>
  );
};

/**
 * DeclarationText - For declaration section (Section VIII)
 */
interface DeclarationTextProps {
  children: React.ReactNode;
}

export const DeclarationText: React.FC<DeclarationTextProps> = ({
  children,
}) => {
  return <Text style={styles.declarationText}>{children}</Text>;
};

/**
 * FieldWithLabel - Standard field with label above value
 * Used in personal information section
 */
interface FieldWithLabelProps {
  label: string;
  value: string | React.ReactNode;
  width?: string | number;
  flex?: number;
}

export const FieldWithLabel: React.FC<FieldWithLabelProps> = ({
  label,
  value,
  width,
  flex,
}) => {
  return (
    <View
      style={[
        styles.fieldCell,
        width ? { width } : {},
        flex ? { flex } : {},
        { flexDirection: 'column' },
      ]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || ''}</Text>
    </View>
  );
};

/**
 * MultiColumnRow - Creates a row with multiple field cells
 */
interface MultiColumnRowProps {
  children: React.ReactNode;
  height?: number;
}

export const MultiColumnRow: React.FC<MultiColumnRowProps> = ({
  children,
  height,
}) => {
  return <TableRow height={height}>{children}</TableRow>;
};

/**
 * InstructionText - For special instructions (italic, smaller font)
 */
interface InstructionTextProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const InstructionText: React.FC<InstructionTextProps> = ({
  children,
  align = 'left',
}) => {
  const alignStyle =
    align === 'center'
      ? styles.center
      : align === 'right'
        ? styles.right
        : {};

  return (
    <Text
      style={[
        styles.noteText,
        alignStyle,
        { marginTop: 3, marginBottom: 3 },
      ]}
    >
      {children}
    </Text>
  );
};
