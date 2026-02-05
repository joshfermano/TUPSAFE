/**
 * SALN PDF ANNEX C - Spouse & Children Sheet (AS-2)
 *
 * This page displays SEPARATE/EXCLUSIVE properties of spouse and unmarried
 * children below 18 years old living in the declarant's household:
 * - Real Properties where owner = 'spouse' OR 'child'
 * - Personal Properties where owner = 'spouse' OR 'child'
 * - Liabilities where owner = 'spouse' OR 'child'
 * - Business Interests where owner = 'spouse' OR 'child'
 *
 * Based on CSC SALN Form 2025 (AS-2 Additional Sheet for Spouse & Children)
 * Only renders for 2025 format SALNs when spouse/children have exclusive properties.
 *
 * @module SALNAnnexC
 */

import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import {
  styles,
  formatCurrency,
  SALN_COLORS,
  SALN_DIMENSIONS,
} from './SALNStyles';
import type {
  SALNData,
  RealProperty,
  PersonalProperty,
  Liability,
  BusinessInterest,
} from './types';

/**
 * Props for SALNAnnexC component
 */
interface SALNAnnexCProps {
  /**
   * Complete SALN data containing all declarant information and assets
   */
  data: SALNData;
}

/**
 * Filter properties for spouse/child ownership
 */
function isSpouseOrChildProperty(
  property: RealProperty | PersonalProperty | Liability | BusinessInterest
): boolean {
  return property.owner === 'spouse' || property.owner === 'child';
}

/**
 * Get owner display text for table
 * Shows "Spouse" or "Child: [name]" based on owner type
 */
function getOwnerDisplay(
  property: RealProperty | PersonalProperty | Liability | BusinessInterest
): string {
  if (property.owner === 'spouse') {
    return 'Spouse';
  }
  if (property.owner === 'child') {
    return property.childName ? `Child: ${property.childName}` : 'Child';
  }
  return 'N/A';
}

/**
 * SALN ANNEX C - Spouse & Children Sheet (AS-2)
 *
 * Displays exclusive/separate properties of the declarant's spouse
 * and unmarried children below 18 years of age living in declarant's household.
 *
 * Includes:
 * - Header with form title and 2025 format identifier
 * - Declarant identification (name, position, agency)
 * - Real Properties (all spouse/child items, numbered starting from 1)
 * - Personal Properties (all spouse/child items)
 * - Liabilities (spouse/child items)
 * - Business Interests (spouse/child items)
 * - Subtotals for each section
 * - Signature/Initial line at footer
 *
 * This page contains properties that are EXCLUSIVELY owned by spouse or children,
 * not joint properties (which go on ANNEX B).
 *
 * @param props - Component props containing SALN data
 * @returns PDF page component for ANNEX C (AS-2) spouse/children sheet
 */
export function SALNAnnexC({ data }: SALNAnnexCProps): React.ReactElement {
  // Filter properties by spouse/child ownership
  const spouseChildRealProps = data.realProperties.filter(
    isSpouseOrChildProperty
  );
  const spouseChildPersonalProps = data.personalProperties.filter(
    isSpouseOrChildProperty
  );
  const spouseChildLiabilities = data.liabilities.filter(
    isSpouseOrChildProperty
  );
  const spouseChildBusiness = data.businessInterests.filter(
    isSpouseOrChildProperty
  );

  // Calculate subtotals
  const realPropertiesSubtotal = spouseChildRealProps.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  const personalPropertiesSubtotal = spouseChildPersonalProps.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  const liabilitiesSubtotal = spouseChildLiabilities.reduce(
    (sum, liability) => sum + (liability.outstandingBalance || 0),
    0
  );

  // Calculate total assets for spouse/children
  const totalSpouseChildAssets =
    realPropertiesSubtotal + personalPropertiesSubtotal;

  // Calculate net worth for spouse/children section
  const spouseChildNetWorth = totalSpouseChildAssets - liabilitiesSubtotal;

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Page Header - Right aligned revision info */}
      <View style={[styles.formInfo, { marginBottom: 5 }]}>
        <Text>2025 SALN Form</Text>
        <Text>Per CSC Resolution No. _________</Text>
      </View>

      {/* Form Title */}
      <View style={styles.formHeader}>
        <Text style={[styles.bold, { fontSize: 10, marginBottom: 2 }]}>
          ANNEX C
        </Text>
        <Text style={[styles.bold, { fontSize: 9, marginBottom: 2 }]}>
          2025 SALN Form AS-2 (Spouse & Children)
        </Text>
        <Text style={styles.formTitle}>
          STATEMENT OF ASSETS, LIABILITIES AND NET WORTH
        </Text>
        <Text style={styles.formSubtitle}>As of December 31, {data.year}</Text>
        <Text
          style={[styles.formSubtitle, { fontStyle: 'italic', fontSize: 6 }]}
        >
          (Additional sheet/s for the exclusive properties of the
          declarant&apos;s spouse
        </Text>
        <Text
          style={[styles.formSubtitle, { fontStyle: 'italic', fontSize: 6 }]}
        >
          and unmarried children below eighteen (18) years of age living in
          declarant&apos;s household)
        </Text>
      </View>

      {/* Declarant Identification */}
      <View
        style={[
          styles.declarantInfo,
          { marginBottom: 10, borderWidth: SALN_DIMENSIONS.borderWidth },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.tableCell, { width: '15%' }]}>
            <Text style={[styles.bold, { fontSize: 7 }]}>NAME:</Text>
          </View>
          <View
            style={[
              styles.tableCell,
              { width: '25%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor },
            ]}
          >
            <Text style={{ fontSize: 7 }}>{data.declarantInfo.surname}</Text>
            <Text style={[styles.italic, { fontSize: 6 }]}>(Family Name)</Text>
          </View>
          <View
            style={[
              styles.tableCell,
              { width: '25%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor },
            ]}
          >
            <Text style={{ fontSize: 7 }}>{data.declarantInfo.firstName}</Text>
            <Text style={[styles.italic, { fontSize: 6 }]}>(First Name)</Text>
          </View>
          <View
            style={[
              styles.tableCell,
              { width: '10%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor },
            ]}
          >
            <Text style={{ fontSize: 7 }}>
              {data.declarantInfo.middleInitial || ''}
            </Text>
            <Text style={[styles.italic, { fontSize: 6 }]}>(M.I.)</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%' }]}>
            <Text style={[styles.bold, { fontSize: 7 }]}>POSITION:</Text>
            <Text style={{ fontSize: 7 }}>{data.declarantInfo.position}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.tableCell, { width: '15%' }]}>
            <Text style={[styles.bold, { fontSize: 7 }]}>AGENCY/OFFICE:</Text>
          </View>
          <View style={[styles.tableCell, { width: '85%' }]}>
            <Text style={{ fontSize: 7 }}>{data.declarantInfo.agency}</Text>
          </View>
        </View>
      </View>

      {/* Section Header */}
      <Text style={styles.sectionHeader}>
        ASSETS, LIABILITIES AND NET WORTH (SPOUSE & CHILDREN - EXCLUSIVE)
      </Text>

      {/* 1. ASSETS */}
      <Text style={[styles.bold, { fontSize: 8, marginTop: 5, marginBottom: 3 }]}>
        1. ASSETS (Spouse/Children Exclusive)
      </Text>

      {/* a. Real Properties - Spouse/Children */}
      {spouseChildRealProps.length > 0 && (
        <>
          <Text
            style={[styles.bold, { fontSize: 7, marginTop: 3, marginBottom: 2 }]}
          >
            a. Real Properties (Spouse/Children)
          </Text>

          {/* Real Properties Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>OWNER</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. lot, house and lot, condominium)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '10%' }]}>
                <Text style={styles.bold}>KIND</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. residential, commercial)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '14%' }]}>
                <Text style={styles.bold}>EXACT</Text>
                <Text style={styles.bold}>LOCATION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '10%' }]}>
                <Text style={styles.bold}>ASSESSED</Text>
                <Text style={styles.bold}>VALUE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '10%' }]}>
                <Text style={styles.bold}>CURRENT FAIR</Text>
                <Text style={styles.bold}>MARKET VALUE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '16%' }]}>
                <Text style={styles.bold}>ACQUISITION</Text>
                <View style={styles.row}>
                  <View style={[{ width: '40%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor }]}>
                    <Text style={styles.bold}>YEAR</Text>
                  </View>
                  <View style={{ width: '60%' }}>
                    <Text style={styles.bold}>MODE</Text>
                  </View>
                </View>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '16%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>ACQUISITION</Text>
                <Text style={styles.bold}>COST</Text>
              </View>
            </View>

            {/* Real Properties Rows */}
            {spouseChildRealProps.map((property, index) => (
              <View key={`real-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '12%' }]}>
                  <Text style={{ fontSize: 5 }}>{getOwnerDisplay(property)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '12%' }]}>
                  <Text>{property.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '10%' }]}>
                  <Text style={{ textTransform: 'capitalize' }}>
                    {property.kind || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.tableCell, { width: '14%' }]}>
                  <Text>{property.exactLocation || 'N/A'}</Text>
                </View>
                <View style={[styles.currencyCell, { width: '10%' }]}>
                  <Text>
                    {property.assessedValue
                      ? formatCurrency(property.assessedValue)
                      : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.currencyCell, { width: '10%' }]}>
                  <Text>
                    {property.currentFairMarketValue
                      ? formatCurrency(property.currentFairMarketValue)
                      : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.tableCell, { width: '16%' }]}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.tableCell,
                        { width: '40%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor, padding: 2 },
                      ]}
                    >
                      <Text>{property.acquisitionYear || 'N/A'}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '60%', padding: 2 }]}>
                      <Text>{property.acquisitionMode || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
                <View
                  style={[styles.currencyCell, { width: '16%', borderRightWidth: 0 }]}
                >
                  <Text>
                    {property.acquisitionCost
                      ? formatCurrency(property.acquisitionCost)
                      : formatCurrency(0)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Subtotal Row */}
            <View style={styles.subtotalRow}>
              <View
                style={[styles.tableCell, { width: '84%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalLabel}>
                  Subtotal (Real Properties - Spouse/Children):
                </Text>
              </View>
              <View
                style={[styles.currencyCell, { width: '16%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalValue}>
                  {formatCurrency(realPropertiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* b. Personal Properties - Spouse/Children */}
      {spouseChildPersonalProps.length > 0 && (
        <>
          <Text
            style={[styles.bold, { fontSize: 7, marginTop: 5, marginBottom: 2 }]}
          >
            b. Personal Properties (Spouse/Children)
          </Text>

          {/* Personal Properties Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '18%' }]}>
                <Text style={styles.bold}>OWNER</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '37%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '20%' }]}>
                <Text style={styles.bold}>YEAR ACQUIRED</Text>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>ACQUISITION</Text>
                <Text style={styles.bold}>COST/AMOUNT</Text>
              </View>
            </View>

            {/* Personal Properties Rows */}
            {spouseChildPersonalProps.map((property, index) => (
              <View key={`personal-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '18%' }]}>
                  <Text style={{ fontSize: 5 }}>{getOwnerDisplay(property)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '37%' }]}>
                  <Text>{property.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '20%' }]}>
                  <Text>{property.yearAcquired || 'N/A'}</Text>
                </View>
                <View
                  style={[styles.currencyCell, { width: '25%', borderRightWidth: 0 }]}
                >
                  <Text>
                    {property.acquisitionCost
                      ? formatCurrency(property.acquisitionCost)
                      : formatCurrency(0)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Subtotal Row */}
            <View style={styles.subtotalRow}>
              <View
                style={[styles.tableCell, { width: '75%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalLabel}>
                  Subtotal (Personal Properties - Spouse/Children):
                </Text>
              </View>
              <View
                style={[styles.currencyCell, { width: '25%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalValue}>
                  {formatCurrency(personalPropertiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Total Assets for Spouse/Children */}
      {(spouseChildRealProps.length > 0 ||
        spouseChildPersonalProps.length > 0) && (
        <View style={{ marginTop: 5, alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 7 }]}>
            TOTAL ASSETS (Spouse/Children): {formatCurrency(totalSpouseChildAssets)}
          </Text>
        </View>
      )}

      {/* 2. LIABILITIES - Spouse/Children */}
      {spouseChildLiabilities.length > 0 && (
        <>
          <Text
            style={[styles.bold, { fontSize: 8, marginTop: 8, marginBottom: 3 }]}
          >
            2. LIABILITIES (Spouse/Children)
          </Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '15%' }]}>
                <Text style={styles.bold}>OWNER</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '35%' }]}>
                <Text style={styles.bold}>NATURE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '30%' }]}>
                <Text style={styles.bold}>NAME OF CREDITORS</Text>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '20%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>OUTSTANDING</Text>
                <Text style={styles.bold}>BALANCE</Text>
              </View>
            </View>

            {/* Liabilities Rows */}
            {spouseChildLiabilities.map((liability, index) => (
              <View key={`liability-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '15%' }]}>
                  <Text style={{ fontSize: 5 }}>{getOwnerDisplay(liability)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '35%' }]}>
                  <Text>{liability.nature || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '30%' }]}>
                  <Text>{liability.creditorName || 'N/A'}</Text>
                </View>
                <View
                  style={[styles.currencyCell, { width: '20%', borderRightWidth: 0 }]}
                >
                  <Text>
                    {formatCurrency(liability.outstandingBalance || 0)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Subtotal Row */}
            <View style={styles.subtotalRow}>
              <View
                style={[styles.tableCell, { width: '80%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalLabel}>
                  TOTAL LIABILITIES (Spouse/Children):
                </Text>
              </View>
              <View
                style={[styles.currencyCell, { width: '20%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalValue}>
                  {formatCurrency(liabilitiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Net Worth for Spouse/Children */}
      {(spouseChildRealProps.length > 0 ||
        spouseChildPersonalProps.length > 0 ||
        spouseChildLiabilities.length > 0) && (
        <View style={[styles.netWorthBox, { marginTop: 8 }]}>
          <View style={styles.netWorthRow}>
            <Text style={styles.netWorthLabel}>
              NET WORTH (Spouse/Children):
            </Text>
            <Text style={styles.netWorthValue}>
              {formatCurrency(spouseChildNetWorth)}
            </Text>
          </View>
          <Text style={[styles.noteText, { textAlign: 'center' }]}>
            (Total Assets - Total Liabilities for Spouse/Children Exclusive
            Properties)
          </Text>
        </View>
      )}

      {/* Business Interests - Spouse/Children */}
      {spouseChildBusiness.length > 0 && (
        <>
          <Text
            style={[styles.bold, { fontSize: 8, marginTop: 8, marginBottom: 3 }]}
          >
            BUSINESS INTERESTS AND FINANCIAL CONNECTIONS (Spouse/Children)
          </Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>OWNER</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '23%' }]}>
                <Text style={styles.bold}>NAME OF ENTITY/</Text>
                <Text style={styles.bold}>BUSINESS ENTERPRISE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                <Text style={styles.bold}>BUSINESS ADDRESS</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                <Text style={styles.bold}>NATURE OF BUSINESS</Text>
                <Text style={styles.bold}>INTEREST &/OR</Text>
                <Text style={styles.bold}>FINANCIAL CONNECTION</Text>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '15%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>DATE OF</Text>
                <Text style={styles.bold}>ACQUISITION</Text>
              </View>
            </View>

            {/* Business Interests Rows */}
            {spouseChildBusiness.map((business, index) => (
              <View key={`business-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '12%' }]}>
                  <Text style={{ fontSize: 5 }}>{getOwnerDisplay(business)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '23%' }]}>
                  <Text>{business.entityName || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text>{business.businessAddress || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text>{business.natureOfBusiness || 'N/A'}</Text>
                </View>
                <View
                  style={[styles.tableCell, { width: '15%', borderRightWidth: 0 }]}
                >
                  <Text>
                    {business.dateOfAcquisition
                      ? typeof business.dateOfAcquisition === 'string'
                        ? new Date(business.dateOfAcquisition).getFullYear()
                        : business.dateOfAcquisition.getFullYear()
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Footer Note */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.noteText}>
          * This sheet contains EXCLUSIVE/SEPARATE properties of the
          declarant&apos;s spouse and unmarried children below 18 years old.
        </Text>
        <Text style={styles.noteText}>
          Joint properties are reported on ANNEX A and ANNEX B (if overflow).
        </Text>
        <Text style={styles.noteText}>
          All values on this sheet are SEPARATE from the main SALN totals and
          should be considered independently.
        </Text>
      </View>

      {/* Signature/Initial Line */}
      <View
        style={{
          marginTop: 15,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <View style={{ width: 200 }}>
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: SALN_COLORS.borderColor,
              marginBottom: 3,
              height: 25,
            }}
          />
          <Text style={[styles.italic, { fontSize: 6, textAlign: 'center' }]}>
            Signature/Initial of Declarant
          </Text>
        </View>
      </View>

      {/* Page Number */}
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
        fixed
      />
    </Page>
  );
}

/**
 * Helper function to determine if ANNEX C should be rendered
 *
 * Triggered when spouse/children have exclusive properties:
 * - Any Real Property where owner = 'spouse' or 'child'
 * - Any Personal Property where owner = 'spouse' or 'child'
 * - Any Liability where owner = 'spouse' or 'child'
 * - Any Business Interest where owner = 'spouse' or 'child'
 *
 * Only applies to 2025 format SALNs.
 *
 * @param data - SALN data to check
 * @returns True if ANNEX C is required
 *
 * @example
 * if (shouldRenderAnnexC(salnData)) {
 *   // Include SALNAnnexC in document
 * }
 */
export function shouldRenderAnnexC(data: SALNData): boolean {
  // Only render for 2025 format
  if (data.salnFormatVersion !== 2025) return false;

  // Check if any spouse/child exclusive properties exist
  const hasSpouseChildProps = [
    ...data.realProperties.filter(isSpouseOrChildProperty),
    ...data.personalProperties.filter(isSpouseOrChildProperty),
    ...data.liabilities.filter(isSpouseOrChildProperty),
    ...data.businessInterests.filter(isSpouseOrChildProperty),
  ];

  return hasSpouseChildProps.length > 0;
}

/**
 * Default export
 */
export default SALNAnnexC;
