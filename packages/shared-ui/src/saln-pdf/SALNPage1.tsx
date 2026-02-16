/**
 * SALN Page 1 - Main Page
 * CSC SALN Form 2025
 *
 * Contains:
 * - CSC header
 * - Form title and subtitle
 * - Compliance checkboxes
 * - Declarant information
 * - Spouse information (always shown, empty if no spouse)
 * - Filing type checkboxes
 * - Multiple marriages section
 * - Unmarried children below 18 years table
 * - Assets section with real and personal properties
 * - Total assets row
 * - Signature/Initial line
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  SALN_COLORS,
  SALN_FONT_SIZES,
  formatCurrency,
  formatDate,
  displayOrEmpty,
} from './SALNStyles';
import type { SALNData } from './types';

interface SALNPage1Props {
  data: SALNData;
}

/**
 * Checkbox component for filing type selection
 * Shows filled checkbox or empty checkbox
 */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <Text style={{ fontSize: SALN_FONT_SIZES.fieldValue, marginRight: 3 }}>
      {checked ? '[\u2713]' : '[  ]'}
    </Text>
  );
}

/**
 * Capitalize property kind for display
 */
function capitalizeKind(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/**
 * Filter properties for ANNEX A display
 * Only includes declarant and joint properties for main page
 */
function filterAnnexAProperties<T extends { owner?: string }>(
  properties: T[]
): T[] {
  return properties.filter(
    (p) => !p.owner || p.owner === 'declarant' || p.owner === 'joint'
  );
}

export function SALNPage1({ data }: SALNPage1Props) {
  const {
    year,
    filingType,
    declarantInfo,
    spouseInfo,
    realProperties = [],
    personalProperties = [],
    complianceType,
    complianceDate,
    hasMultipleMarriages,
    previousSpouseNames,
    spousePosition,
    spouseAgency,
    spouseOfficeAddress,
    unmarriedChildren,
  } = data;

  // Ensure children is always an array (handle null/undefined)
  const children = data.children || [];

  // Filter properties for ANNEX A (only declarant/joint)
  const annexARealProperties = filterAnnexAProperties(realProperties);
  const annexAPersonalProperties = filterAnnexAProperties(personalProperties);

  // Limit real properties to first 10 items for page 1
  const displayedRealProperties = annexARealProperties.slice(0, 10);
  const hasMoreRealProperties = annexARealProperties.length > 10;

  // Calculate subtotal for displayed real properties
  const realPropertiesSubtotal = displayedRealProperties.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  // Limit personal properties to first 8 items for page 1
  const displayedPersonalProperties = annexAPersonalProperties.slice(0, 8);
  const hasMorePersonalProperties = annexAPersonalProperties.length > 8;

  // Calculate subtotal for displayed personal properties
  const personalPropertiesSubtotal = displayedPersonalProperties.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  // Total assets (real + personal subtotals)
  const totalAssetsPage1 = realPropertiesSubtotal + personalPropertiesSubtotal;

  // Children data may come from either unmarriedChildren or children
  const childrenData = (unmarriedChildren && unmarriedChildren.length > 0)
    ? unmarriedChildren
    : children;

  return (
    <Page size="LETTER" style={styles.page}>
      {/* ============================================================ */}
      {/* 1. CSC Header - Top Right                                    */}
      {/* ============================================================ */}
      <Text
        style={{
          position: 'absolute',
          top: 10,
          right: 20,
          fontSize: 6,
          fontStyle: 'italic',
          textAlign: 'right',
        }}>
        2025 SALN Form{'\n'}
        Per CSC Resolution No. __________{'\n'}
        Promulgated on __________
      </Text>

      {/* ============================================================ */}
      {/* 2. Form Title + Subtitle                                     */}
      {/* ============================================================ */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          SWORN STATEMENT OF ASSETS, LIABILITIES, AND NET WORTH
        </Text>
        <Text style={styles.formSubtitle}>
          (As required by R.A. No. 6713)
        </Text>
      </View>

      {/* ============================================================ */}
      {/* 3. COMPLIANCE FOR: Checkboxes                                */}
      {/* ============================================================ */}
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.complianceLabel}>COMPLIANCE FOR:</Text>
        <View style={[styles.row, { flexWrap: 'wrap', gap: 10 }]}>
          <View style={[styles.row, { alignItems: 'center', marginRight: 10 }]}>
            <Checkbox checked={complianceType === 'assumption'} />
            <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
              Assumption of office as of {complianceType === 'assumption' && complianceDate ? formatDate(complianceDate) : '__________'}
            </Text>
          </View>
          <View style={[styles.row, { alignItems: 'center', marginRight: 10 }]}>
            <Checkbox checked={complianceType === 'annual'} />
            <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
              Annual filing as of December 31, {year || '____'}
            </Text>
          </View>
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Checkbox checked={complianceType === 'exit'} />
            <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
              Exit as of {complianceType === 'exit' && complianceDate ? formatDate(complianceDate) : '__________'}
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 4. DECLARANT Info Section                                     */}
      {/* ============================================================ */}
      <View style={styles.declarantInfo}>
        <Text style={[styles.labelSmall, styles.bold, { marginBottom: 5 }]}>
          DECLARANT:
        </Text>

        {/* Name Row: Family Name / First Name / M.I. */}
        <View style={styles.declarantRow}>
          <View style={{ width: '30%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>Family Name</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(declarantInfo.surname)}
            </Text>
          </View>
          <View style={{ width: '30%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>First Name</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(declarantInfo.firstName)}
            </Text>
          </View>
          <View style={{ width: '40%' }}>
            <Text style={styles.labelSmall}>M.I.</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(declarantInfo.middleInitial)}
            </Text>
          </View>
        </View>

        {/* Position and Agency Row */}
        <View style={styles.declarantRow}>
          <View style={{ width: '50%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>Position</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(declarantInfo.position)}
            </Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.labelSmall}>Agency/Office</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(declarantInfo.agency)}
            </Text>
          </View>
        </View>

        {/* Office Address Row */}
        <View style={styles.declarantRow}>
          <View style={{ width: '100%' }}>
            <Text style={styles.labelSmall}>Office Address</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(declarantInfo.officeAddress)}
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 5. SPOUSE Info Section (always shown, empty if no spouse)     */}
      {/* ============================================================ */}
      <View style={styles.declarantInfo}>
        <Text style={[styles.labelSmall, styles.bold, { marginBottom: 5 }]}>
          SPOUSE:
        </Text>

        {/* Name Row */}
        <View style={styles.declarantRow}>
          <View style={{ width: '30%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>Family Name</Text>
            <Text style={styles.declarantValue}>
              {spouseInfo ? displayOrEmpty(spouseInfo.surname) : 'N/A'}
            </Text>
          </View>
          <View style={{ width: '30%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>First Name</Text>
            <Text style={styles.declarantValue}>
              {spouseInfo ? displayOrEmpty(spouseInfo.firstName) : 'N/A'}
            </Text>
          </View>
          <View style={{ width: '40%' }}>
            <Text style={styles.labelSmall}>M.I.</Text>
            <Text style={styles.declarantValue}>
              {spouseInfo ? displayOrEmpty(spouseInfo.middleInitial) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Position and Agency Row (footnote i: only declared if spouse is public official) */}
        <View style={styles.declarantRow}>
          <View style={{ width: '50%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>Position</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(spousePosition || spouseInfo?.position)}
            </Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.labelSmall}>Agency/Office</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(spouseAgency || spouseInfo?.agency)}
            </Text>
          </View>
        </View>

        {/* Office Address Row */}
        <View style={styles.declarantRow}>
          <View style={{ width: '100%' }}>
            <Text style={styles.labelSmall}>Office Address</Text>
            <Text style={styles.declarantValue}>
              {displayOrEmpty(spouseOfficeAddress || spouseInfo?.officeAddress)}
            </Text>
          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 6 & 7. Filing Notice Text + Filing Type Checkboxes            */}
      {/* ============================================================ */}
      <Text style={styles.filingNoticeText}>
        SPOUSES, WHO ARE BOTH PUBLIC OFFICIALS OR EMPLOYEES, MAY FILE THE SALN JOINTLY OR SEPARATELY.
      </Text>
      <Text style={[styles.filingNoticeText, { marginTop: 0 }]}>
        THE DECLARANT SHALL CHECK THE APPROPRIATE BOX
      </Text>

      {/* 8. Filing Type Checkboxes */}
      <View style={[styles.row, { marginBottom: 8, alignItems: 'center', justifyContent: 'center' }]}>
        <View style={[styles.row, { alignItems: 'center', marginRight: 15 }]}>
          <Checkbox checked={filingType === 'joint'} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
            Joint Filing
          </Text>
        </View>
        <View style={[styles.row, { alignItems: 'center', marginRight: 15 }]}>
          <Checkbox checked={filingType === 'separate'} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
            Separate Filing
          </Text>
        </View>
        <View style={[styles.row, { alignItems: 'center' }]}>
          <Checkbox checked={filingType === 'not_applicable'} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
            Not Applicable
          </Text>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 9. Multiple Marriages Section                                 */}
      {/* ============================================================ */}
      <View style={[styles.declarantInfo, { marginTop: 5 }]}>
        <Text style={[styles.labelSmall, styles.bold, { marginBottom: 5 }]}>
          IF WITH MULTIPLE MARRIAGES, INDICATE THE NAME/S OF FORMER SPOUSE/S:
        </Text>
        {hasMultipleMarriages ? (
          <Text style={styles.declarantValue}>
            {displayOrEmpty(previousSpouseNames)}
          </Text>
        ) : (
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Checkbox checked={true} />
            <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>
              Not Applicable
            </Text>
          </View>
        )}
      </View>

      {/* ============================================================ */}
      {/* 10. Unmarried Children Below 18 Years Section                 */}
      {/* ============================================================ */}
      <View style={[styles.subSectionHeader, { marginTop: 5 }]}>
        <Text>
          UNMARRIED CHILDREN BELOW EIGHTEEN (18) YEARS OF AGE LIVING IN DECLARANT&apos;S HOUSEHOLD
        </Text>
      </View>

      {/* Children Table */}
      {childrenData.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, { width: '70%' }]}>
              <Text>NAME OF CHILD</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: '30%' }]}>
              <Text style={styles.center}>AGE</Text>
            </View>
          </View>
          {childrenData.map((child, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '70%' }]}>
                <Text>{displayOrEmpty(child.name)}</Text>
              </View>
              <View style={[styles.tableCell, { width: '30%' }]}>
                <Text style={styles.center}>{child.age}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, { width: '70%' }]}>
              <Text>NAME OF CHILD</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: '30%' }]}>
              <Text style={styles.center}>AGE</Text>
            </View>
          </View>
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No unmarried children below 18 years old</Text>
          </View>
        </View>
      )}

      {/* ============================================================ */}
      {/* 11. Assets Section Header                                     */}
      {/* ============================================================ */}
      <View style={styles.sectionHeader}>
        <Text>ASSETS, LIABILITIES AND NET WORTH</Text>
      </View>
      <View style={{ paddingHorizontal: 4, marginBottom: 3 }}>
        <Text style={{ fontSize: SALN_FONT_SIZES.noteText, fontStyle: 'italic', textAlign: 'center' }}>
          (Including those of the spouse and unmarried children below eighteen (18) years of age living in declarant&apos;s household)
        </Text>
      </View>

      {/* Numbered heading: 1. ASSETS */}
      <View style={{ marginBottom: 3, marginTop: 3 }}>
        <Text style={{ fontSize: SALN_FONT_SIZES.sectionHeader, fontWeight: 'bold' }}>
          1. ASSETS
        </Text>
      </View>

      {/* ============================================================ */}
      {/* Real Properties Section                                       */}
      {/* ============================================================ */}
      <View style={styles.subSectionHeader}>
        <Text>a. Real Properties</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.tableHeaderCell, { width: '12%' }]}>
            <Text>DESCRIPTION</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '10%' }]}>
            <Text>KIND</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '16%' }]}>
            <Text>EXACT LOCATION</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '12%' }]}>
            <Text>ASSESSED VALUE</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '12%' }]}>
            <Text>CURRENT FAIR MARKET VALUE</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '8%' }]}>
            <Text>ACQ. YEAR</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '15%' }]}>
            <Text>ACQ. MODE</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '15%' }]}>
            <Text>ACQ. COST</Text>
          </View>
        </View>

        {displayedRealProperties.length > 0 ? (
          displayedRealProperties.map((property, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '12%' }]}>
                <Text>{displayOrEmpty(property.description)}</Text>
              </View>
              <View style={[styles.tableCell, { width: '10%' }]}>
                <Text>{capitalizeKind(property.kind)}</Text>
              </View>
              <View style={[styles.tableCell, { width: '16%' }]}>
                <Text>{displayOrEmpty(property.exactLocation)}</Text>
              </View>
              <View style={[styles.currencyCell, { width: '12%' }]}>
                <Text>{formatCurrency(property.assessedValue || 0)}</Text>
              </View>
              <View style={[styles.currencyCell, { width: '12%' }]}>
                <Text>
                  {formatCurrency(property.currentFairMarketValue || 0)}
                </Text>
              </View>
              <View style={[styles.tableCell, { width: '8%' }]}>
                <Text style={styles.center}>{property.acquisitionYear}</Text>
              </View>
              <View style={[styles.tableCell, { width: '15%' }]}>
                <Text>{displayOrEmpty(property.acquisitionMode)}</Text>
              </View>
              <View style={[styles.currencyCell, { width: '15%' }]}>
                <Text>{formatCurrency(property.acquisitionCost || 0)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No real properties declared</Text>
          </View>
        )}

        {/* Subtotal Row */}
        {displayedRealProperties.length > 0 && (
          <View style={styles.subtotalRow}>
            <View style={[styles.tableCell, { width: '85%' }]}>
              <Text style={styles.subtotalLabel}>Subtotal:</Text>
            </View>
            <View style={[styles.currencyCellNoBorder, { width: '15%' }]}>
              <Text style={styles.subtotalValue}>
                {formatCurrency(realPropertiesSubtotal)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Note if more real properties exist */}
      {hasMoreRealProperties && (
        <Text style={styles.noteText}>(Continued on Page 3)</Text>
      )}

      {/* ============================================================ */}
      {/* Personal Properties Section                                   */}
      {/* ============================================================ */}
      <View style={[styles.subSectionHeader, { marginTop: 5 }]}>
        <Text>b. Personal Properties</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.tableHeaderCell, { width: '50%' }]}>
            <Text>DESCRIPTION</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '25%' }]}>
            <Text>YEAR ACQUIRED</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '25%' }]}>
            <Text>ACQUISITION COST</Text>
          </View>
        </View>

        {displayedPersonalProperties.length > 0 ? (
          displayedPersonalProperties.map((property, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '50%' }]}>
                <Text>{displayOrEmpty(property.description)}</Text>
              </View>
              <View style={[styles.tableCell, { width: '25%' }]}>
                <Text style={styles.center}>{property.yearAcquired}</Text>
              </View>
              <View style={[styles.currencyCell, { width: '25%' }]}>
                <Text>{formatCurrency(property.acquisitionCost || 0)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>
              No personal properties declared
            </Text>
          </View>
        )}

        {/* Subtotal Row */}
        {displayedPersonalProperties.length > 0 && (
          <View style={styles.subtotalRow}>
            <View style={[styles.tableCell, { width: '75%' }]}>
              <Text style={styles.subtotalLabel}>Subtotal:</Text>
            </View>
            <View style={[styles.currencyCellNoBorder, { width: '25%' }]}>
              <Text style={styles.subtotalValue}>
                {formatCurrency(personalPropertiesSubtotal)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Note if more personal properties exist */}
      {hasMorePersonalProperties && (
        <Text style={styles.noteText}>(Continued on Page 3)</Text>
      )}

      {/* ============================================================ */}
      {/* 12. TOTAL ASSETS Row                                          */}
      {/* ============================================================ */}
      <View style={styles.totalAssetsRow}>
        <Text style={{ fontSize: SALN_FONT_SIZES.sectionHeader, fontWeight: 'bold', marginRight: 10 }}>
          TOTAL ASSETS:
        </Text>
        <Text style={{ fontSize: SALN_FONT_SIZES.currencyValue, fontWeight: 'bold', color: SALN_COLORS.currencyBlack }}>
          {formatCurrency(totalAssetsPage1)}
        </Text>
      </View>

      {/* ============================================================ */}
      {/* 13. Signature/Initial Line at Bottom                          */}
      {/* ============================================================ */}
      <View style={styles.signatureInitialRight}>
        <View style={{ width: 180 }}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: SALN_COLORS.borderColor, height: 25, marginBottom: 3 }} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel, textAlign: 'center', fontStyle: 'italic' }}>
            Signature/Initial of Declarant
          </Text>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 14. Page Footer                                               */}
      {/* ============================================================ */}
      <Text
        style={[
          styles.pageNumber,
          { position: 'absolute', bottom: 10, textAlign: 'center' },
        ]}
        fixed>
        Page 1 of ___
      </Text>
    </Page>
  );
}

export default SALNPage1;
