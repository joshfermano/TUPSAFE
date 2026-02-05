/**
 * SALN PDF ANNEX B - Declarant Continuation Sheet (AS-1)
 *
 * This page displays overflow properties belonging to the DECLARANT specifically:
 * - Real Properties (items 11+) where owner = 'declarant' OR 'joint' OR undefined
 * - Personal Properties (items 9+) where owner = 'declarant' OR 'joint' OR undefined
 *
 * Based on CSC SALN Form 2025 (AS-1 Additional Sheet for Declarant)
 * Only renders for 2025 format SALNs when declarant/joint properties exceed limits.
 *
 * @module SALNAnnexB
 */

import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles, formatCurrency, SALN_COLORS, SALN_DIMENSIONS } from './SALNStyles';
import type { SALNData, RealProperty, PersonalProperty } from './types';

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
  property: RealProperty | PersonalProperty
): boolean {
  return (
    property.owner === 'declarant' ||
    property.owner === 'joint' ||
    !property.owner
  );
}

/**
 * Get owner display text for table
 */
function getOwnerDisplay(property: RealProperty | PersonalProperty): string {
  if (!property.owner || property.owner === 'declarant') {
    return 'Declarant';
  }
  if (property.owner === 'joint') {
    return 'Joint';
  }
  return 'Declarant';
}

/**
 * SALN ANNEX B - Declarant Continuation Sheet (AS-1)
 *
 * Displays additional real and personal properties for the declarant
 * that don't fit on ANNEX A (Page 1).
 *
 * Includes:
 * - Header with form title and 2025 format identifier
 * - Declarant identification (name, position, agency)
 * - Real Properties continuation (items 11+)
 * - Personal Properties continuation (items 9+)
 * - Subtotals for each section
 * - Signature/Initial line at footer
 *
 * Conditional rendering:
 * - Real Properties section only renders if declarant/joint properties > 10
 * - Personal Properties section only renders if declarant/joint properties > 8
 * - Page should not be rendered if both conditions are false (handled by parent)
 *
 * @param props - Component props containing SALN data
 * @returns PDF page component for ANNEX B (AS-1) continuation sheet
 */
export function SALNAnnexB({ data }: SALNAnnexBProps): React.ReactElement {
  // Filter properties by declarant/joint ownership
  const declarantRealProps = data.realProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantPersonalProps = data.personalProperties.filter(
    isDeclarantOrJointProperty
  );

  // Get overflow items (items 11+ for real, 9+ for personal)
  const overflowRealProps = declarantRealProps.slice(10);
  const overflowPersonalProps = declarantPersonalProps.slice(8);

  // Calculate subtotals for overflow items only
  const realPropertiesSubtotal = overflowRealProps.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  const personalPropertiesSubtotal = overflowPersonalProps.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  // Determine which sections should be shown
  const showRealProperties = overflowRealProps.length > 0;
  const showPersonalProperties = overflowPersonalProps.length > 0;

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
        ASSETS (CONTINUATION - DECLARANT)
      </Text>

      {/* a. Real Properties Continuation */}
      {showRealProperties && (
        <>
          <Text
            style={[styles.bold, { fontSize: 7, marginTop: 5, marginBottom: 2 }]}
          >
            a. Real Properties (Continuation)
          </Text>

          {/* Real Properties Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '10%' }]}>
                <Text style={styles.bold}>OWNER</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. lot, house and lot, condominium and improvements)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '10%' }]}>
                <Text style={styles.bold}>KIND</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. residential, commercial, industrial, agricultural and
                  mixed)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '14%' }]}>
                <Text style={styles.bold}>EXACT</Text>
                <Text style={styles.bold}>LOCATION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '11%' }]}>
                <Text style={styles.bold}>ASSESSED</Text>
                <Text style={styles.bold}>VALUE</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (As found in the Tax Declaration)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '11%' }]}>
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
            {overflowRealProps.map((property, index) => (
              <View key={`real-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '10%' }]}>
                  <Text>{getOwnerDisplay(property)}</Text>
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
                <View style={[styles.currencyCell, { width: '11%' }]}>
                  <Text>
                    {property.assessedValue
                      ? formatCurrency(property.assessedValue)
                      : 'N/A'}
                  </Text>
                </View>
                <View style={[styles.currencyCell, { width: '11%' }]}>
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
                  Subtotal (Real Properties - Continuation):
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

      {/* b. Personal Properties Continuation */}
      {showPersonalProperties && (
        <>
          <Text
            style={[styles.bold, { fontSize: 7, marginTop: 5, marginBottom: 2 }]}
          >
            b. Personal Properties (Continuation)
          </Text>

          {/* Personal Properties Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '15%' }]}>
                <Text style={styles.bold}>OWNER</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '40%' }]}>
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
            {overflowPersonalProps.map((property, index) => (
              <View key={`personal-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '15%' }]}>
                  <Text>{getOwnerDisplay(property)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '40%' }]}>
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
                  Subtotal (Personal Properties - Continuation):
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

      {/* Footer Note */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.noteText}>
          * This continuation sheet contains overflow data for the
          declarant&apos;s assets from ANNEX A.
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
 * Triggered when declarant's/joint properties exceed ANNEX A limits:
 * - Real Properties > 10 items
 * - Personal Properties > 8 items
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
  // Only render for 2025 format
  if (data.salnFormatVersion !== 2025) return false;

  // Filter properties by declarant/joint ownership
  const declarantRealProps = data.realProperties.filter(
    isDeclarantOrJointProperty
  );
  const declarantPersonalProps = data.personalProperties.filter(
    isDeclarantOrJointProperty
  );

  return declarantRealProps.length > 10 || declarantPersonalProps.length > 8;
}

/**
 * Default export
 */
export default SALNAnnexB;
