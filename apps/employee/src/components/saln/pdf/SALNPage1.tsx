/**
 * SALN Page 1 - Main Page
 * CSC SALN Form 2019
 *
 * Contains:
 * - Form header and title
 * - Filing type checkboxes
 * - Declarant information
 * - Spouse information (if joint filing)
 * - Unmarried children below 18 years
 * - Real properties (first 10 items)
 * - Personal properties (first 8 items)
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  SALN_COLORS,
  SALN_FONT_SIZES,
  formatCurrency,
  formatDate,
  displayOrEmpty,
  calculateAge,
} from './SALNStyles';
import type { SALNData } from './types';

interface SALNPage1Props {
  data: SALNData;
}

/**
 * Checkbox component for filing type selection
 * Shows filled checkbox (☑) or empty checkbox (☐)
 */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <Text style={{ fontSize: SALN_FONT_SIZES.fieldValue, marginRight: 3 }}>
      {checked ? '☑' : '☐'}
    </Text>
  );
}

/**
 * Capitalize property kind for display
 */
function capitalizeKind(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function SALNPage1({ data }: SALNPage1Props) {
  const {
    year,
    filingType,
    declarantInfo,
    spouseInfo,
    children = [],
    realProperties = [],
    personalProperties = [],
  } = data;

  // Limit real properties to first 10 items for page 1
  const displayedRealProperties = realProperties.slice(0, 10);
  const hasMoreRealProperties = realProperties.length > 10;

  // Calculate subtotal for displayed real properties
  const realPropertiesSubtotal = displayedRealProperties.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  // Limit personal properties to first 8 items for page 1
  const displayedPersonalProperties = personalProperties.slice(0, 8);
  const hasMorePersonalProperties = personalProperties.length > 8;

  // Calculate subtotal for displayed personal properties
  const personalPropertiesSubtotal = displayedPersonalProperties.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          STATEMENT OF ASSETS, LIABILITIES AND NET WORTH
        </Text>
        <Text style={styles.formSubtitle}>
          (As of {year ? year.toString() : '_____________'})
        </Text>
        <Text style={styles.formInfo}>Revised 2019</Text>
        <Text style={[styles.formSubtitle, { fontSize: SALN_FONT_SIZES.legalText }]}>
          PURSUANT TO REPUBLIC ACT NO. 6713 AND REPUBLIC ACT NO. 3019
        </Text>
      </View>

      {/* Filing Type */}
      <View style={[styles.row, { marginBottom: 8, alignItems: 'center' }]}>
        <View style={[styles.row, { alignItems: 'center', marginRight: 15 }]}>
          <Checkbox checked={filingType === 'joint'} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>Joint Filing</Text>
        </View>
        <View style={[styles.row, { alignItems: 'center', marginRight: 15 }]}>
          <Checkbox checked={filingType === 'separate'} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>Separate Filing</Text>
        </View>
        <View style={[styles.row, { alignItems: 'center' }]}>
          <Checkbox checked={filingType === 'not_applicable'} />
          <Text style={{ fontSize: SALN_FONT_SIZES.fieldLabel }}>Not Applicable</Text>
        </View>
      </View>

      {/* Declarant Information */}
      <View style={styles.declarantInfo}>
        <Text style={[styles.labelSmall, styles.bold, { marginBottom: 5 }]}>
          DECLARANT:
        </Text>

        {/* Name Row */}
        <View style={styles.declarantRow}>
          <View style={{ width: '30%', paddingRight: 5 }}>
            <Text style={styles.labelSmall}>Surname</Text>
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
            <Text style={styles.labelSmall}>Middle Initial</Text>
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

      {/* Spouse Information (if joint filing) */}
      {filingType === 'joint' && spouseInfo && (
        <View style={styles.declarantInfo}>
          <Text style={[styles.labelSmall, styles.bold, { marginBottom: 5 }]}>
            SPOUSE:
          </Text>

          {/* Name Row */}
          <View style={styles.declarantRow}>
            <View style={{ width: '30%', paddingRight: 5 }}>
              <Text style={styles.labelSmall}>Surname</Text>
              <Text style={styles.declarantValue}>
                {displayOrEmpty(spouseInfo.surname)}
              </Text>
            </View>
            <View style={{ width: '30%', paddingRight: 5 }}>
              <Text style={styles.labelSmall}>First Name</Text>
              <Text style={styles.declarantValue}>
                {displayOrEmpty(spouseInfo.firstName)}
              </Text>
            </View>
            <View style={{ width: '40%' }}>
              <Text style={styles.labelSmall}>Middle Initial</Text>
              <Text style={styles.declarantValue}>
                {displayOrEmpty(spouseInfo.middleInitial)}
              </Text>
            </View>
          </View>

          {/* Position and Agency Row */}
          <View style={styles.declarantRow}>
            <View style={{ width: '50%', paddingRight: 5 }}>
              <Text style={styles.labelSmall}>Position</Text>
              <Text style={styles.declarantValue}>
                {displayOrEmpty(spouseInfo.position)}
              </Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={styles.labelSmall}>Agency/Office</Text>
              <Text style={styles.declarantValue}>
                {displayOrEmpty(spouseInfo.agency)}
              </Text>
            </View>
          </View>

          {/* Office Address Row */}
          <View style={styles.declarantRow}>
            <View style={{ width: '100%' }}>
              <Text style={styles.labelSmall}>Office Address</Text>
              <Text style={styles.declarantValue}>
                {displayOrEmpty(spouseInfo.officeAddress)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Unmarried Children Below 18 Years Section */}
      <View style={[styles.subSectionHeader, { marginTop: 5 }]}>
        <Text>UNMARRIED CHILDREN BELOW EIGHTEEN (18) YEARS OF AGE</Text>
      </View>

      {/* Children Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.tableHeaderCell, { width: '50%' }]}>
            <Text>NAME</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '30%' }]}>
            <Text>DATE OF BIRTH</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '20%' }]}>
            <Text style={styles.center}>AGE</Text>
          </View>
        </View>

        {children && children.length > 0 ? (
          children.map((child, index) => {
            const age = calculateAge(child.dateOfBirth);
            return (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '50%' }]}>
                  <Text>{displayOrEmpty(child.name)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '30%' }]}>
                  <Text>{formatDate(child.dateOfBirth)}</Text>
                </View>
                <View style={[styles.tableCell, { width: '20%' }]}>
                  <Text style={styles.center}>{age}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No children below 18 years old</Text>
          </View>
        )}
      </View>

      {/* Assets Section Header */}
      <View style={styles.sectionHeader}>
        <Text>ASSETS</Text>
      </View>

      {/* Real Properties Section */}
      <View style={styles.subSectionHeader}>
        <Text>A. REAL PROPERTIES</Text>
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
                <Text>{formatCurrency(property.currentFairMarketValue || 0)}</Text>
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
              <Text style={styles.subtotalLabel}>
                SUBTOTAL (Real Properties - Page 1)
              </Text>
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

      {/* Personal Properties Section */}
      <View style={[styles.subSectionHeader, { marginTop: 5 }]}>
        <Text>B. PERSONAL PROPERTIES</Text>
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
            <Text style={styles.emptyText}>No personal properties declared</Text>
          </View>
        )}

        {/* Subtotal Row */}
        {displayedPersonalProperties.length > 0 && (
          <View style={styles.subtotalRow}>
            <View style={[styles.tableCell, { width: '75%' }]}>
              <Text style={styles.subtotalLabel}>
                SUBTOTAL (Personal Properties - Page 1)
              </Text>
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

      {/* Page Footer */}
      <Text
        style={[
          styles.pageNumber,
          { position: 'absolute', bottom: 10, textAlign: 'center' },
        ]}
        render={({ pageNumber }) => `Page ${pageNumber}`}
        fixed
      />
    </Page>
  );
}

export default SALNPage1;
