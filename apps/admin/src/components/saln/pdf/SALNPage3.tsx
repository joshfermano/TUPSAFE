/**
 * SALN PDF Page 3 - Continuation Sheet for Real and Personal Properties
 *
 * This page displays overflow properties from Page 1:
 * - Real Properties (items 11+)
 * - Personal Properties (items 9+)
 *
 * Based on CSC SALN Form 2019 (Revised)
 * Official form structure matches Page 3 of the sample form
 *
 * @module SALNPage3
 */

import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles, formatCurrency } from './SALNStyles';
import type { SALNData } from './types';

/**
 * Props for SALNPage3 component
 */
interface SALNPage3Props {
  /**
   * Complete SALN data containing all declarant information and assets
   */
  data: SALNData;
}

/**
 * SALN Page 3 - Continuation Sheet
 *
 * Displays additional real and personal properties that don't fit on Page 1.
 * Includes:
 * - Header with form title and revision date
 * - Declarant identification (name, position, agency)
 * - Real Properties continuation (items 11+)
 * - Personal Properties continuation (items 9+)
 * - Subtotals for each section
 *
 * Conditional rendering:
 * - Real Properties section only renders if data.realProperties.length > 10
 * - Personal Properties section only renders if data.personalProperties.length > 8
 * - Page should not be rendered if both conditions are false (handled by parent)
 *
 * @param props - Component props containing SALN data
 * @returns PDF page component for continuation sheet
 */
export function SALNPage3({ data }: SALNPage3Props): React.ReactElement {
  // Slice arrays to get continuation items
  const continuationRealProperties = data.realProperties.slice(10); // Items 11+
  const continuationPersonalProperties = data.personalProperties.slice(8); // Items 9+

  // Calculate subtotals for continuation items only
  const realPropertiesSubtotal = continuationRealProperties.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  const personalPropertiesSubtotal = continuationPersonalProperties.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  // Determine if sections should be shown
  const showRealProperties = data.realProperties.length > 10;
  const showPersonalProperties = data.personalProperties.length > 8;

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Page Header - Right aligned revision info */}
      <View style={[styles.formInfo, { marginBottom: 5 }]}>
        <Text>Revised as of 2018</Text>
        <Text>Per CSC Resolution No. 1500088</Text>
        <Text>Promulgated on January 23, 2015</Text>
      </View>

      {/* Form Title */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          SWORN STATEMENT OF ASSETS, LIABILITIES AND NET WORTH
        </Text>
        <Text style={styles.formSubtitle}>
          As of December 31, {data.year}
        </Text>
        <Text style={[styles.formSubtitle, { fontStyle: 'italic', fontSize: 7 }]}>
          (Additional sheet/s for the declarant)
        </Text>
      </View>

      {/* Declarant Identification */}
      <View style={[styles.declarantInfo, { marginBottom: 10 }]}>
        <View style={styles.row}>
          <View style={[styles.tableCell, { width: '25%' }]}>
            <Text style={[styles.bold, { fontSize: 7 }]}>NAME:</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%', borderRightWidth: 0.5 }]}>
            <Text style={{ fontSize: 7 }}>
              {data.declarantInfo.surname}
            </Text>
            <Text style={[styles.italic, { fontSize: 6 }]}>(Family Name)</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%', borderRightWidth: 0.5 }]}>
            <Text style={{ fontSize: 7 }}>
              {data.declarantInfo.firstName}
            </Text>
            <Text style={[styles.italic, { fontSize: 6 }]}>(First Name)</Text>
          </View>
          <View style={[styles.tableCell, { width: '10%', borderRightWidth: 0.5 }]}>
            <Text style={{ fontSize: 7 }}>
              {data.declarantInfo.middleInitial || ''}
            </Text>
            <Text style={[styles.italic, { fontSize: 6 }]}>(M.I.)</Text>
          </View>
          <View style={[styles.tableCell, { width: '15%' }]}>
            <Text style={[styles.bold, { fontSize: 7 }]}>POSITION:</Text>
            <Text style={[styles.bold, { fontSize: 7 }]}>AGENCY/OFFICE:</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.tableCell, { width: '85%' }]} />
          <View style={[styles.tableCell, { width: '15%' }]}>
            <Text style={{ fontSize: 7 }}>{data.declarantInfo.position}</Text>
            <Text style={{ fontSize: 7 }}>{data.declarantInfo.agency}</Text>
          </View>
        </View>
      </View>

      {/* Section Header */}
      <Text style={styles.sectionHeader}>
        ASSETS, LIABILITIES AND NET WORTH
      </Text>

      {/* 1. ASSETS */}
      <Text style={[styles.bold, { fontSize: 8, marginTop: 5, marginBottom: 3 }]}>
        1. ASSETS
      </Text>

      {/* a. Real Properties Continuation */}
      {showRealProperties && (
        <>
          <Text style={[styles.bold, { fontSize: 7, marginTop: 3, marginBottom: 2 }]}>
            a. Real Properties
          </Text>

          {/* Real Properties Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '15%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. lot, house and lot, condominium and improvements)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '10%' }]}>
                <Text style={styles.bold}>KIND</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (e.g. residential, commercial, industrial, agricultural and mixed)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '15%' }]}>
                <Text style={styles.bold}>EXACT</Text>
                <Text style={styles.bold}>LOCATION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>ASSESSED</Text>
                <Text style={styles.bold}>VALUE</Text>
                <Text style={[styles.italic, { fontSize: 5 }]}>
                  (As found in the Tax Declaration of Real Property)
                </Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text style={styles.bold}>CURRENT FAIR</Text>
                <Text style={styles.bold}>MARKET VALUE</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '18%' }]}>
                <Text style={styles.bold}>ACQUISITION</Text>
                <View style={styles.row}>
                  <View style={[{ width: '40%', borderRightWidth: 0.5 }]}>
                    <Text style={styles.bold}>YEAR</Text>
                  </View>
                  <View style={{ width: '60%' }}>
                    <Text style={styles.bold}>MODE</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.tableHeaderCell, { width: '18%', borderRightWidth: 0 }]}>
                <Text style={styles.bold}>ACQUISITION</Text>
                <Text style={styles.bold}>COST</Text>
              </View>
            </View>

            {/* Real Properties Rows */}
            {continuationRealProperties.map((property, index) => (
              <View key={`real-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '15%' }]}>
                  <Text>{property.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '10%' }]}>
                  <Text style={{ textTransform: 'capitalize' }}>
                    {property.kind || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.tableCell, { width: '15%' }]}>
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
                <View style={[styles.tableCell, { width: '18%' }]}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.tableCell,
                        { width: '40%', borderRightWidth: 0.5, padding: 2 },
                      ]}
                    >
                      <Text>{property.acquisitionYear || 'N/A'}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '60%', padding: 2 }]}>
                      <Text>{property.acquisitionMode || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.currencyCell, { width: '18%', borderRightWidth: 0 }]}>
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
              <View style={[styles.tableCell, { width: '82%', borderRightWidth: 0 }]}>
                <Text style={styles.subtotalLabel}>Subtotal:</Text>
              </View>
              <View style={[styles.currencyCell, { width: '18%', borderRightWidth: 0 }]}>
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
          <Text style={[styles.bold, { fontSize: 7, marginTop: 5, marginBottom: 2 }]}>
            b. Personal Properties
          </Text>

          {/* Personal Properties Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, { width: '50%' }]}>
                <Text style={styles.bold}>DESCRIPTION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                <Text style={styles.bold}>YEAR ACQUIRED</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 0 }]}>
                <Text style={styles.bold}>ACQUISITION</Text>
                <Text style={styles.bold}>COST/AMOUNT</Text>
              </View>
            </View>

            {/* Personal Properties Rows */}
            {continuationPersonalProperties.map((property, index) => (
              <View key={`personal-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '50%' }]}>
                  <Text>{property.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, { width: '25%' }]}>
                  <Text>{property.yearAcquired || 'N/A'}</Text>
                </View>
                <View style={[styles.currencyCell, { width: '25%', borderRightWidth: 0 }]}>
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
              <View style={[styles.tableCell, { width: '75%', borderRightWidth: 0 }]}>
                <Text style={styles.subtotalLabel}>Subtotal:</Text>
              </View>
              <View style={[styles.currencyCell, { width: '25%', borderRightWidth: 0 }]}>
                <Text style={styles.subtotalValue}>
                  {formatCurrency(personalPropertiesSubtotal)}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Total Assets Note */}
      {(showRealProperties || showPersonalProperties) && (
        <View style={{ marginTop: 10, alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 7 }]}>
            TOTAL ASSETS (a+b): {formatCurrency(data.totalAssets)}
          </Text>
        </View>
      )}

      {/* Page Number */}
      <Text style={styles.pageNumber}>Page 3 of 4</Text>
    </Page>
  );
}

/**
 * Helper function to determine if Page 3 is needed
 *
 * @param data - SALN data to check
 * @returns True if continuation sheet is required
 *
 * @example
 * if (shouldRenderSALNPage3(salnData)) {
 *   // Include SALNPage3 in document
 * }
 */
export function shouldRenderSALNPage3(data: SALNData): boolean {
  return data.realProperties.length > 10 || data.personalProperties.length > 8;
}
