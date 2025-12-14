/**
 * SALN PDF Page 4 - Continuation Sheet
 *
 * This page handles overflow data from Page 2:
 * - Liabilities (items 13+)
 * - Business Interests (items 9+)
 * - Relatives in Government (items 9+)
 *
 * Only renders if there is overflow data in any section.
 * Matches CSC SALN Form 2019 continuation sheet layout.
 *
 * @module SALNPage4
 */

import React from 'react';
import { Text, View, Page } from '@react-pdf/renderer';
import { styles, formatCurrency } from './SALNStyles';
import type { SALNData } from './types';

/**
 * Props for SALNPage4 component
 */
interface SALNPage4Props {
  data: SALNData;
}

/**
 * SALN Page 4: Continuation Sheet
 *
 * Displays overflow items from Page 2 sections:
 * - Liabilities continuation (if > 12 items)
 * - Business Interests continuation (if > 8 items)
 * - Relatives in Government continuation (if > 8 items)
 *
 * @param props - Component props
 * @returns Page 4 component or null if no overflow
 *
 * @example
 * ```tsx
 * <SALNPage4 data={salnData} />
 * ```
 */
export function SALNPage4({ data }: SALNPage4Props) {
  // Slice overflow items
  const liabilitiesContinuation = data.liabilities.slice(12);
  const businessInterestsContinuation = data.businessInterests.slice(8);
  const relativesContinuation = data.relativesInGov.slice(8);

  // Calculate subtotal for liabilities on this page
  const liabilitiesSubtotal = liabilitiesContinuation.reduce(
    (sum, liability) => sum + (liability.outstandingBalance || 0),
    0
  );

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>CONTINUATION SHEET</Text>
        <Text style={styles.formSubtitle}>
          STATEMENT OF ASSETS, LIABILITIES AND NET WORTH
        </Text>
        <Text style={styles.formSubtitle}>As of December 31, {data.year}</Text>
        <Text style={styles.formInfo}>Revised 2019</Text>
      </View>

      {/* Declarant Identification */}
      <View style={styles.declarantInfo}>
        <View style={styles.declarantRow}>
          <Text style={styles.declarantLabel}>NAME:</Text>
          <View style={[styles.declarantValue, styles.row]}>
            <Text style={[styles.flex1, { borderRightWidth: 0.5, paddingRight: 5 }]}>
              {data.declarantInfo.surname || 'N/A'}
              {'\n'}
              <Text style={{ fontSize: 6, fontStyle: 'italic' }}>(Family Name)</Text>
            </Text>
            <Text style={[styles.flex1, { borderRightWidth: 0.5, paddingHorizontal: 5 }]}>
              {data.declarantInfo.firstName || 'N/A'}
              {'\n'}
              <Text style={{ fontSize: 6, fontStyle: 'italic' }}>(First Name)</Text>
            </Text>
            <Text style={[{ width: '20%', paddingLeft: 5 }]}>
              {data.declarantInfo.middleInitial || 'N/A'}
              {'\n'}
              <Text style={{ fontSize: 6, fontStyle: 'italic' }}>(M.I.)</Text>
            </Text>
          </View>
        </View>
        <View style={styles.declarantRow}>
          <Text style={styles.declarantLabel}>POSITION:</Text>
          <Text style={styles.declarantValue}>{data.declarantInfo.position || 'N/A'}</Text>
        </View>
        <View style={styles.declarantRow}>
          <Text style={styles.declarantLabel}>AGENCY/OFFICE:</Text>
          <Text style={styles.declarantValue}>{data.declarantInfo.agency || 'N/A'}</Text>
        </View>
      </View>

      {/* Continuation - Liabilities Section */}
      {liabilitiesContinuation.length > 0 && (
        <View style={styles.marginTop10}>
          <Text style={styles.sectionHeader}>2. LIABILITIES (CONTINUATION)</Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.w40]}>NATURE</Text>
              <Text style={[styles.tableHeaderCell, styles.w40]}>NAME OF CREDITORS</Text>
              <Text style={[styles.tableHeaderCell, styles.w20, { borderRightWidth: 0 }]}>
                OUTSTANDING BALANCE
              </Text>
            </View>

            {/* Data Rows */}
            {liabilitiesContinuation.map((liability, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.w40]}>
                  {liability.nature || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w40]}>
                  {liability.creditorName || 'N/A'}
                </Text>
                <Text style={[styles.currencyCell, styles.w20, { borderRightWidth: 0 }]}>
                  {formatCurrency(liability.outstandingBalance || 0)}
                </Text>
              </View>
            ))}

            {/* Subtotal Row */}
            <View style={styles.subtotalRow}>
              <Text style={[styles.tableCell, styles.w80, styles.subtotalLabel]}>
                SUBTOTAL (Page 4):
              </Text>
              <Text style={[styles.currencyCell, styles.w20, { borderRightWidth: 0 }]}>
                <Text style={styles.subtotalValue}>
                  {formatCurrency(liabilitiesSubtotal)}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Continuation - Business Interests Section */}
      {businessInterestsContinuation.length > 0 && (
        <View style={styles.marginTop10}>
          <Text style={styles.sectionHeader}>
            BUSINESS INTERESTS AND FINANCIAL CONNECTIONS (CONTINUATION)
          </Text>
          <Text style={[styles.noteText, { textAlign: 'center', marginBottom: 3 }]}>
            (of Declarant / Declarant's spouse/ Unmarried Children Below Eighteen (18) years of Age Living in Declarant's Household)
          </Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.w30]}>
                NAME OF ENTITY/BUSINESS{'\n'}ENTERPRISE
              </Text>
              <Text style={[styles.tableHeaderCell, styles.w30]}>BUSINESS ADDRESS</Text>
              <Text style={[styles.tableHeaderCell, styles.w25]}>
                NATURE OF BUSINESS{'\n'}INTEREST &/OR FINANCIAL{'\n'}CONNECTION
              </Text>
              <Text style={[styles.tableHeaderCell, styles.w15, { borderRightWidth: 0 }]}>
                DATE OF ACQUISITION OF{'\n'}INTEREST OR CONNECTION
              </Text>
            </View>

            {/* Data Rows */}
            {businessInterestsContinuation.map((business, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.w30]}>
                  {business.entityName || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w30]}>
                  {business.businessAddress || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w25]}>
                  {business.natureOfBusiness || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w15, { borderRightWidth: 0 }]}>
                  {business.dateOfAcquisition
                    ? typeof business.dateOfAcquisition === 'string'
                      ? new Date(business.dateOfAcquisition).getFullYear()
                      : business.dateOfAcquisition.getFullYear()
                    : 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Continuation - Relatives in Government Section */}
      {relativesContinuation.length > 0 && (
        <View style={styles.marginTop10}>
          <Text style={styles.sectionHeader}>
            RELATIVES IN THE GOVERNMENT SERVICE (CONTINUATION)
          </Text>
          <Text style={[styles.noteText, { textAlign: 'center', marginBottom: 3 }]}>
            (Within the Fourth Degree of Consanguinity or Affinity. Include also Bilas, Balae and Inso)
          </Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.w30]}>NAME OF RELATIVE</Text>
              <Text style={[styles.tableHeaderCell, styles.w20]}>RELATIONSHIP</Text>
              <Text style={[styles.tableHeaderCell, styles.w20]}>POSITION</Text>
              <Text style={[styles.tableHeaderCell, styles.w30, { borderRightWidth: 0 }]}>
                NAME OF AGENCY/OFFICE AND ADDRESS
              </Text>
            </View>

            {/* Data Rows */}
            {relativesContinuation.map((relative, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.w30]}>
                  {relative.name || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w20]}>
                  {relative.relationship || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w20]}>
                  {relative.position || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.w30, { borderRightWidth: 0 }]}>
                  {relative.agencyAddress || 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer Note */}
      <View style={{ marginTop: 15 }}>
        <Text style={styles.noteText}>
          * This continuation sheet contains overflow data from the main SALN form (Page 2).
        </Text>
        <Text style={styles.noteText}>
          All values on this sheet are included in the totals calculated on the main form.
        </Text>
      </View>

      {/* Page Number */}
      <Text
        style={styles.pageNumber}
        render={({ pageNumber }) => `Page ${pageNumber}`}
        fixed
      />
    </Page>
  );
}

/**
 * Check if Page 4 should be rendered
 * Only render if there is overflow data in any section
 *
 * @param {SALNData} data - SALN data to check
 * @returns {boolean} True if page should be rendered
 *
 * @example
 * ```tsx
 * const salnData = { liabilities: [...], businessInterests: [...], relativesInGov: [...] };
 * const shouldRender = shouldRenderSALNPage4(salnData);
 * // true if any section has overflow
 * ```
 */
export function shouldRenderSALNPage4(data: SALNData): boolean {
  return (
    data.liabilities.length > 12 ||
    data.businessInterests.length > 8 ||
    data.relativesInGov.length > 8
  );
}

/**
 * Default export
 */
export default SALNPage4;
