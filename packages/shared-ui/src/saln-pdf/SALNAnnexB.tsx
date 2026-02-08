/**
 * SALN PDF ANNEX B - Declarant Continuation Sheet (AS-1)
 *
 * This page displays overflow/continuation data belonging to the DECLARANT:
 * - Real Properties (items 11+) where owner = 'declarant' OR 'joint' OR undefined
 * - Personal Properties (items 9+) where owner = 'declarant' OR 'joint' OR undefined
 * - Liabilities (items 13+) where owner = 'declarant' OR 'joint' OR undefined
 * - Business Interests (items 9+) where owner = 'declarant' OR 'joint' OR undefined
 *
 * Based on CSC SALN Form 2025 (AS-1 Additional Sheet for Declarant)
 * Only renders for 2025 format SALNs when declarant/joint items exceed main page limits.
 *
 * The official CSC 2025 ANNEX B (AS-1) form does NOT include an OWNER column;
 * ownership is implied by being on this sheet (= declarant/joint).
 *
 * @module SALNAnnexB
 */

import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles, formatCurrency, SALN_COLORS, SALN_DIMENSIONS } from './SALNStyles';
import type {
  SALNData,
  RealProperty,
  PersonalProperty,
  Liability,
  BusinessInterest,
} from './types';

/**
 * Props for SALNAnnexB component
 */
interface SALNAnnexBProps {
  /**
   * Complete SALN data containing all declarant information and assets
   */
  data: SALNData;
}

/**
 * Filter properties for declarant/joint ownership
 * Includes properties where owner is 'declarant', 'joint', or undefined/null
 */
function isDeclarantOrJointProperty(
  property: RealProperty | PersonalProperty | Liability | BusinessInterest
): boolean {
  return (
    property.owner === 'declarant' ||
    property.owner === 'joint' ||
    !property.owner
  );
}

/**
 * Calculate subtotals for ANNEX B continuation items
 * These should be added to the main SALN totals
 */
export function calculateAnnexBSubtotals(data: SALNData): {
  realPropertiesSubtotal: number;
  personalPropertiesSubtotal: number;
  totalAssetsSubtotal: number;
  liabilitiesSubtotal: number;
  businessInterestsCount: number;
} {
  // Filter properties by declarant/joint ownership
  const declarantRealProps = data.realProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantPersonalProps = data.personalProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantLiabilities = data.liabilities.filter(
    isDeclarantOrJointProperty
  );
  const declarantBusiness = data.businessInterests.filter(
    isDeclarantOrJointProperty
  );

  // Get overflow items (items 11+ for real, 9+ for personal, 13+ for liabilities, 9+ for business)
  const overflowRealProps = declarantRealProps.slice(10);
  const overflowPersonalProps = declarantPersonalProps.slice(8);
  const overflowLiabilities = declarantLiabilities.slice(12);
  const overflowBusiness = declarantBusiness.slice(8);

  // Calculate subtotals - USE CURRENT FAIR MARKET VALUE for real properties
  const realPropertiesSubtotal = overflowRealProps.reduce(
    (sum, prop) => sum + (prop.currentFairMarketValue || 0),
    0
  );

  const personalPropertiesSubtotal = overflowPersonalProps.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  const totalAssetsSubtotal = realPropertiesSubtotal + personalPropertiesSubtotal;

  const liabilitiesSubtotal = overflowLiabilities.reduce(
    (sum, liability) => sum + (liability.outstandingBalance || 0),
    0
  );

  const businessInterestsCount = overflowBusiness.length;

  return {
    realPropertiesSubtotal,
    personalPropertiesSubtotal,
    totalAssetsSubtotal,
    liabilitiesSubtotal,
    businessInterestsCount,
  };
}

/**
 * SALN ANNEX B - Declarant Continuation Sheet (AS-1)
 *
 * Displays additional assets, liabilities, and business interests for the declarant
 * that don't fit on ANNEX A (Page 1).
 *
 * Includes:
 * - Header with form title and 2025 format identifier
 * - Declarant identification (name, position, agency)
 * - 1. ASSETS section:
 *   - a. Real Properties continuation (items 11+)
 *   - b. Personal Properties continuation (items 9+)
 *   - TOTAL ASSETS subtotal
 * - 2. LIABILITIES section (items 13+)
 * - BUSINESS INTERESTS AND FINANCIAL CONNECTIONS (items 9+)
 * - Signature/Initial line at footer
 *
 * No OWNER column is rendered per the official CSC 2025 form specification.
 *
 * @param props - Component props containing SALN data
 * @returns PDF page component for ANNEX B (AS-1) continuation sheet
 */
export function SALNAnnexB({ data }: SALNAnnexBProps): React.ReactElement {
  // Use the exported calculation function for consistency
  const subtotals = calculateAnnexBSubtotals(data);
  const realPropertiesSubtotal = subtotals.realPropertiesSubtotal;
  const personalPropertiesSubtotal = subtotals.personalPropertiesSubtotal;
  const liabilitiesSubtotal = subtotals.liabilitiesSubtotal;

  // Filter properties by declarant/joint ownership
  const declarantRealProps = data.realProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantPersonalProps = data.personalProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantLiabilities = data.liabilities.filter(
    isDeclarantOrJointProperty
  );
  const declarantBusiness = data.businessInterests.filter(
    isDeclarantOrJointProperty
  );

  // Get overflow items (items 11+ for real, 9+ for personal, 13+ for liabilities, 9+ for business)
  const overflowRealProps = declarantRealProps.slice(10);
  const overflowPersonalProps = declarantPersonalProps.slice(8);
  const overflowLiabilities = declarantLiabilities.slice(12);
  const overflowBusiness = declarantBusiness.slice(8);

  // Determine which sections should be shown
  const showRealProperties = overflowRealProps.length > 0;
  const showPersonalProperties = overflowPersonalProps.length > 0;
  const showLiabilities = overflowLiabilities.length > 0;
  const showBusinessInterests = overflowBusiness.length > 0;

  // Calculate total assets (real + personal subtotals from this annex)
  const totalAssetsSubtotal = realPropertiesSubtotal + personalPropertiesSubtotal;

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
          ANNEX B
        </Text>
        <Text style={[styles.bold, { fontSize: 9, marginBottom: 2 }]}>
          SALN Form AS-1 (Declarant)
        </Text>
        <Text style={styles.formTitle}>
          SWORN STATEMENT OF ASSETS, LIABILITIES AND NET WORTH
        </Text>
        <Text style={styles.formSubtitle}>As of December 31, {data.year}</Text>
        <Text
          style={[styles.formSubtitle, { fontStyle: 'italic', fontSize: 7 }]}
        >
          (Additional sheet/s for the declarant)
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
        ASSETS, LIABILITIES AND NET WORTH
      </Text>

      {/* 1. ASSETS */}
      {(showRealProperties || showPersonalProperties) && (
        <Text style={[styles.bold, { fontSize: 8, marginTop: 5, marginBottom: 3 }]}>
          1. ASSETS (Continuation)
        </Text>
      )}

      {/* a. Real Properties Continuation */}
      {showRealProperties && (
        <>
          <Text
            style={[styles.bold, { fontSize: 7, marginTop: 3, marginBottom: 2 }]}
          >
            a. Real Properties (Continuation)
          </Text>

          {/* Real Properties Table */}
          <View style={styles.table}>
            {/* Table Header - No OWNER column per official CSC 2025 form */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '14%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. lot, house and lot, condominium and improvements)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>KIND</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. residential, commercial, industrial, agricultural and
                  mixed)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '16%' }]}>
                <Text style={styles.bold}>EXACT</Text>
                <Text style={styles.bold}>LOCATION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>ASSESSED</Text>
                <Text style={styles.bold}>VALUE</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (As found in the Tax Declaration)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>CURRENT FAIR</Text>
                <Text style={styles.bold}>MARKET VALUE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '16%' }]}>
                <Text style={styles.bold}>ACQUISITION</Text>
                <View style={styles.row}>
                  <View style={[{ width: '37.5%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor }]}>
                    <Text style={styles.bold}>YEAR</Text>
                  </View>
                  <View style={{ width: '62.5%' }}>
                    <Text style={styles.bold}>MODE</Text>
                  </View>
                </View>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '18%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>ACQUISITION</Text>
                <Text style={styles.bold}>COST</Text>
              </View>
            </View>

            {/* Real Properties Rows */}
            {overflowRealProps.map((property, index) => (
              <View key={`real-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '14%' }]}>
                  <Text>{property.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '12%' }]}>
                  <Text style={{ textTransform: 'capitalize' }}>
                    {property.kind || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.tableCell, { width: '16%' }]}>
                  <Text>{property.exactLocation || 'N/A'}</Text>
                </View>
                <View style={[styles.currencyCell, { width: '12%' }]}>
                  <Text>
                    {property.assessedValue
                      ? formatCurrency(property.assessedValue)
                      : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.currencyCell, { width: '12%' }]}>
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
                        { width: '37.5%', borderRightWidth: 0.5, borderRightColor: SALN_COLORS.borderColor, padding: 2 },
                      ]}
                    >
                      <Text>{property.acquisitionYear || 'N/A'}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '62.5%', padding: 2 }]}>
                      <Text>{property.acquisitionMode || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
                <View
                  style={[styles.currencyCell, { width: '18%', borderRightWidth: 0 }]}
                >
                  <Text>
                    {property.acquisitionCost
                      ? formatCurrency(property.acquisitionCost)
                      : formatCurrency(0)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Subtotal Row - Current Fair Market Value */}
            <View style={styles.subtotalRow}>
              <View
                style={[styles.tableCell, { width: '82%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalLabel}>
                  Subtotal (Real Properties - Current Fair Market Value):
                </Text>
              </View>
              <View
                style={[styles.currencyCell, { width: '18%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalValue}>
                  {formatCurrency(realPropertiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* b. Personal Properties Continuation */}
      {showPersonalProperties && (
        <>
          <Text
            style={[styles.bold, { fontSize: 7, marginTop: 5, marginBottom: 2 }]}
          >
            b. Personal Properties (Continuation)
          </Text>

          {/* Personal Properties Table - No OWNER column per official CSC 2025 form */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '45%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                <Text style={styles.bold}>YEAR ACQUIRED</Text>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '30%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>ACQUISITION</Text>
                <Text style={styles.bold}>COST/AMOUNT</Text>
              </View>
            </View>

            {/* Personal Properties Rows */}
            {overflowPersonalProps.map((property, index) => (
              <View key={`personal-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '45%' }]}>
                  <Text>{property.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text>{property.yearAcquired || 'N/A'}</Text>
                </View>
                <View
                  style={[styles.currencyCell, { width: '30%', borderRightWidth: 0 }]}
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
                style={[styles.tableCell, { width: '70%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalLabel}>
                  Subtotal (Personal Properties - Continuation):
                </Text>
              </View>
              <View
                style={[styles.currencyCell, { width: '30%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalValue}>
                  {formatCurrency(personalPropertiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* TOTAL ASSETS Row - Sum of real + personal subtotals from this annex */}
      {(showRealProperties || showPersonalProperties) && (
        <View style={{ marginTop: 5, alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 7 }]}>
            TOTAL ASSETS (Continuation): {formatCurrency(totalAssetsSubtotal)}
          </Text>
        </View>
      )}

      {/* 2. LIABILITIES */}
      {showLiabilities && (
        <>
          <Text
            style={[styles.bold, { fontSize: 8, marginTop: 8, marginBottom: 3 }]}
          >
            2. LIABILITIES (Continuation)
          </Text>

          <View style={styles.table}>
            {/* Table Header - No OWNER column per official CSC 2025 form */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '40%' }]}>
                <Text style={styles.bold}>NATURE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '35%' }]}>
                <Text style={styles.bold}>NAME OF CREDITORS</Text>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>OUTSTANDING</Text>
                <Text style={styles.bold}>BALANCE</Text>
              </View>
            </View>

            {/* Liabilities Rows */}
            {overflowLiabilities.map((liability, index) => (
              <View key={`liability-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '40%' }]}>
                  <Text>{liability.nature || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '35%' }]}>
                  <Text>{liability.creditorName || 'N/A'}</Text>
                </View>
                <View
                  style={[styles.currencyCell, { width: '25%', borderRightWidth: 0 }]}
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
                style={[styles.tableCell, { width: '75%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalLabel}>
                  TOTAL LIABILITIES (Continuation):
                </Text>
              </View>
              <View
                style={[styles.currencyCell, { width: '25%', borderRightWidth: 0 }]}
              >
                <Text style={styles.subtotalValue}>
                  {formatCurrency(liabilitiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* BUSINESS INTERESTS AND FINANCIAL CONNECTIONS */}
      {showBusinessInterests && (
        <>
          <Text
            style={[styles.bold, { fontSize: 8, marginTop: 8, marginBottom: 3 }]}
          >
            BUSINESS INTERESTS AND FINANCIAL CONNECTIONS (Continuation)
          </Text>

          <View style={styles.table}>
            {/* Table Header - No OWNER column per official CSC 2025 form */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                <Text style={styles.bold}>NAME OF ENTITY/</Text>
                <Text style={styles.bold}>BUSINESS ENTERPRISE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '30%' }]}>
                <Text style={styles.bold}>BUSINESS ADDRESS</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                <Text style={styles.bold}>NATURE OF BUSINESS</Text>
                <Text style={styles.bold}>INTEREST &/OR</Text>
                <Text style={styles.bold}>FINANCIAL CONNECTION</Text>
              </View>
              <View
                style={[styles.tableHeaderCell, { width: '20%', borderRightWidth: 0 }]}
              >
                <Text style={styles.bold}>DATE OF</Text>
                <Text style={styles.bold}>ACQUISITION</Text>
              </View>
            </View>

            {/* Business Interests Rows */}
            {overflowBusiness.map((business, index) => (
              <View key={`business-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text>{business.entityName || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '30%' }]}>
                  <Text>{business.businessAddress || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text>{business.natureOfBusiness || 'N/A'}</Text>
                </View>
                <View
                  style={[styles.tableCell, { width: '20%', borderRightWidth: 0 }]}
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
          * This continuation sheet contains overflow data for the
          declarant&apos;s assets, liabilities, and business interests from ANNEX A.
        </Text>
        <Text style={styles.noteText}>
          All values on this sheet are included in the totals calculated on
          ANNEX A.
        </Text>
      </View>

      {/* Signature/Initial Line */}
      <View
        style={{
          marginTop: 20,
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
 * Helper function to determine if ANNEX B should be rendered
 *
 * Triggered when declarant's/joint items exceed ANNEX A limits:
 * - Real Properties > 10 items
 * - Personal Properties > 8 items
 * - Liabilities > 12 items
 * - Business Interests > 8 items
 *
 * Only applies to 2025 format SALNs.
 *
 * @param data - SALN data to check
 * @returns True if ANNEX B is required
 *
 * @example
 * if (shouldRenderAnnexB(salnData)) {
 *   // Include SALNAnnexB in document
 * }
 */
export function shouldRenderAnnexB(data: SALNData): boolean {
  // Filter items by declarant/joint ownership
  const declarantRealProps = data.realProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantPersonalProps = data.personalProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantLiabilities = data.liabilities.filter(
    isDeclarantOrJointProperty
  );
  const declarantBusiness = data.businessInterests.filter(
    isDeclarantOrJointProperty
  );

  return (
    declarantRealProps.length > 10 ||
    declarantPersonalProps.length > 8 ||
    declarantLiabilities.length > 12 ||
    declarantBusiness.length > 8
  );
}

/**
 * Default export
 */
export default SALNAnnexB;
