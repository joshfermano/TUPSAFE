/**
 * SALN Page 2 - Liabilities, Net Worth, Business Interests, Relatives in Government
 * CSC SALN Form 2025
 *
 * Contains:
 * - Liabilities (continuation from Page 1)
 * - Net Worth Calculation (Single Line format)
 * - Business Interests and Financial Connections
 * - Relatives in Government Service (within 4th degree)
 * - Declaration Paragraphs
 * - Signature Section (Dual Gov IDs)
 * - Subscribed and Sworn Section
 * - Footnotes
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  formatCurrency,
  formatDate,
  displayOrEmpty,
  SALN_COLORS,
} from './SALNStyles';
import type { SALNData } from './types';

interface SALNPage2Props {
  data: SALNData;
}

/**
 * Checkbox component for selections
 */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <Text style={{ fontSize: 7, marginRight: 3 }}>
      {checked ? '\u2611' : '\u2610'}
    </Text>
  );
}

const DECLARATION_PARAGRAPH_1 =
  'I hereby certify that these are true and correct statements of my assets, liabilities, net worth, business interests and financial connections, including those of my spouse and unmarried children below eighteen (18) years of age living in my household, and that to the best of my knowledge, the above-enumerated are names of my relatives in the government within the fourth civil degree of consanguinity or affinity.';

const DECLARATION_PARAGRAPH_2 =
  'I hereby authorize the Ombudsman or his/her duly authorized representative to obtain and secure from all appropriate government agencies, including the Bureau of Internal Revenue such documents that may show my assets, liabilities, net worth, business interests and financial connections, to include those of my spouse and unmarried children below 18 years of age living with me in my household covering previous years to include the year I first assumed office in government.';

/**
 * Liabilities Section Component
 * Displays first 12 liabilities with total
 */
function LiabilitiesSection({ data }: { data: SALNData }) {
  const liabilities = data.liabilities || [];
  const displayLiabilities = liabilities.slice(0, 12);
  const hasMore = liabilities.length > 12;

  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + (liability.outstandingBalance || 0),
    0
  );

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <View style={[styles.tableHeaderCell, styles.w40]}>
          <Text>NATURE</Text>
        </View>
        <View style={[styles.tableHeaderCell, styles.w35]}>
          <Text>NAME OF CREDITORS</Text>
        </View>
        <View style={[styles.tableHeaderCell, styles.w25]}>
          <Text>OUTSTANDING BALANCE</Text>
        </View>
      </View>

      {/* Liability Rows */}
      {displayLiabilities.map((liability, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={[styles.tableCell, styles.w40]}>
            <Text>{displayOrEmpty(liability.nature)}</Text>
          </View>
          <View style={[styles.tableCell, styles.w35]}>
            <Text>{displayOrEmpty(liability.creditorName)}</Text>
          </View>
          <View style={[styles.currencyCell, styles.w25]}>
            <Text>{formatCurrency(liability.outstandingBalance || 0)}</Text>
          </View>
        </View>
      ))}

      {/* Empty rows if less than 12 */}
      {displayLiabilities.length < 12 &&
        Array.from({ length: 12 - displayLiabilities.length }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.tableRow}>
            <View style={[styles.tableCell, styles.w40]}>
              <Text> </Text>
            </View>
            <View style={[styles.tableCell, styles.w35]}>
              <Text> </Text>
            </View>
            <View style={[styles.currencyCell, styles.w25]}>
              <Text> </Text>
            </View>
          </View>
        ))}

      {/* Total Row */}
      <View style={styles.subtotalRow}>
        <View style={[styles.tableCellNoBorder, styles.w75]}>
          <Text style={styles.subtotalLabel}>
            TOTAL LIABILITIES:
          </Text>
        </View>
        <View style={[styles.currencyCellNoBorder, styles.w25]}>
          <Text style={styles.subtotalValue}>
            {formatCurrency(totalLiabilities)}
          </Text>
        </View>
      </View>

      {/* Continuation Note */}
      {hasMore && (
        <View style={{ padding: 3 }}>
          <Text style={styles.noteText}>(Continued on Page 4)</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Net Worth Line Component
 * Single line format: NET WORTH: Total Assets less Total Liabilities = P{amount}
 */
function NetWorthLine({ data }: { data: SALNData }) {
  // Calculate Real Properties Total (Declarant/Joint only) - USE CURRENT FAIR MARKET VALUE
  const declarantRealProps = data.realProperties.filter(
    (p) => p.owner === 'declarant' || p.owner === 'joint' || !p.owner
  );
  const realPropertiesTotal = declarantRealProps.reduce(
    (sum, prop) => sum + (prop.currentFairMarketValue || 0),
    0
  );

  // Calculate Personal Properties Total (Declarant/Joint only) - USE ACQUISITION COST
  const declarantPersonalProps = data.personalProperties.filter(
    (p) => p.owner === 'declarant' || p.owner === 'joint' || !p.owner
  );
  const personalPropertiesTotal = declarantPersonalProps.reduce(
    (sum, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  // Calculate Total Assets
  const totalAssets = realPropertiesTotal + personalPropertiesTotal;

  // Calculate Total Liabilities
  const totalLiabilities = (data.liabilities || []).reduce(
    (sum, liability) => sum + (liability.outstandingBalance || 0),
    0
  );

  // Calculate Net Worth
  const netWorth = totalAssets - totalLiabilities;

  return (
    <View style={styles.netWorthLine}>
      <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
        NET WORTH: Total Assets less Total Liabilities = {formatCurrency(netWorth)}
      </Text>
    </View>
  );
}

/**
 * Business Interests Section Component
 * Displays first 8 business interests with "I/We do not have" checkbox support
 */
function BusinessInterestsSection({ data }: { data: SALNData }) {
  const businessInterests = data.businessInterests || [];
  const displayBusinessInterests = businessInterests.slice(0, 8);
  const hasMore = businessInterests.length > 8;

  return (
    <View>
      <Text style={styles.sectionHeader}>
        BUSINESS INTERESTS AND FINANCIAL CONNECTIONS
      </Text>

      <Text style={{ fontSize: 6, textAlign: 'center', fontStyle: 'italic', marginBottom: 3 }}>
        (of Declarant /Declarant&apos;s spouse/ Unmarried Children Below Eighteen (18) years of Age Living in Declarant&apos;s Household)
      </Text>

      {data.hasNoBusinessInterests ? (
        <View style={{
          padding: 8,
          borderWidth: 0.5,
          borderColor: SALN_COLORS.borderColor,
          marginBottom: 5
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox checked={true} />
            <Text style={{ fontSize: 7 }}>
              I/We do not have any business interest or financial connection
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.w25]}>
              <Text>NAME OF ENTITY / BUSINESS ENTERPRISE</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.w30]}>
              <Text>BUSINESS ADDRESS</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.w25]}>
              <Text>NATURE OF BUSINESS INTEREST / CONNECTION</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.w20]}>
              <Text>DATE OF ACQUISITION OF INTEREST / CONNECTION</Text>
            </View>
          </View>

          {/* Business Interest Rows */}
          {displayBusinessInterests.map((business, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.w25]}>
                <Text>{displayOrEmpty(business.entityName)}</Text>
              </View>
              <View style={[styles.tableCell, styles.w30]}>
                <Text>{displayOrEmpty(business.businessAddress)}</Text>
              </View>
              <View style={[styles.tableCell, styles.w25]}>
                <Text>{displayOrEmpty(business.natureOfBusiness)}</Text>
              </View>
              <View style={[styles.tableCell, styles.w20]}>
                <Text style={styles.center}>
                  {business.dateOfAcquisition
                    ? formatDate(business.dateOfAcquisition)
                    : 'N/A'}
                </Text>
              </View>
            </View>
          ))}

          {/* Empty rows if less than 8 */}
          {displayBusinessInterests.length < 8 &&
            Array.from({ length: 8 - displayBusinessInterests.length }).map(
              (_, index) => (
                <View key={`empty-${index}`} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.w25]}>
                    <Text> </Text>
                  </View>
                  <View style={[styles.tableCell, styles.w30]}>
                    <Text> </Text>
                  </View>
                  <View style={[styles.tableCell, styles.w25]}>
                    <Text> </Text>
                  </View>
                  <View style={[styles.tableCell, styles.w20]}>
                    <Text> </Text>
                  </View>
                </View>
              )
            )}
        </View>
      )}

      {/* Continuation Note */}
      {hasMore && !data.hasNoBusinessInterests && (
        <View style={{ padding: 3 }}>
          <Text style={styles.noteText}>(Continued on Page 4)</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Relatives in Government Section Component
 * Displays first 8 relatives with "I/We do not have" checkbox support
 */
function RelativesInGovSection({ data }: { data: SALNData }) {
  const relatives = data.relativesInGov || [];
  const displayRelatives = relatives.slice(0, 8);
  const hasMore = relatives.length > 8;

  return (
    <View>
      <Text style={styles.sectionHeader}>
        RELATIVES IN THE GOVERNMENT SERVICE
      </Text>

      <Text style={{ fontSize: 6, textAlign: 'center', fontStyle: 'italic', marginBottom: 3 }}>
        (Within the Fourth Degree of Consanguinity or Affinity. Include also Bilas, Balae and Inso)
        <Text style={{ fontSize: 5, verticalAlign: 'super' }}> iv</Text>
      </Text>

      {data.hasNoRelativesInGov ? (
        <View style={{
          padding: 8,
          borderWidth: 0.5,
          borderColor: SALN_COLORS.borderColor,
          marginBottom: 5
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox checked={true} />
            <Text style={{ fontSize: 7 }}>
              I/We do not know of any relative/s in the government service
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.w25]}>
              <Text>NAME</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.w15]}>
              <Text>RELATIONSHIP</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.w25]}>
              <Text>POSITION</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.w35]}>
              <Text>NAME OF AGENCY / OFFICE AND ADDRESS</Text>
            </View>
          </View>

          {/* Relative Rows */}
          {displayRelatives.map((relative, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.w25]}>
                <Text>{displayOrEmpty(relative.name)}</Text>
              </View>
              <View style={[styles.tableCell, styles.w15]}>
                <Text>{displayOrEmpty(relative.relationship)}</Text>
              </View>
              <View style={[styles.tableCell, styles.w25]}>
                <Text>{displayOrEmpty(relative.position)}</Text>
              </View>
              <View style={[styles.tableCell, styles.w35]}>
                <Text>{displayOrEmpty(relative.agencyAddress)}</Text>
              </View>
            </View>
          ))}

          {/* Empty rows if less than 8 */}
          {displayRelatives.length < 8 &&
            Array.from({ length: 8 - displayRelatives.length }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.w25]}>
                  <Text> </Text>
                </View>
                <View style={[styles.tableCell, styles.w15]}>
                  <Text> </Text>
                </View>
                <View style={[styles.tableCell, styles.w25]}>
                  <Text> </Text>
                </View>
                <View style={[styles.tableCell, styles.w35]}>
                  <Text> </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Continuation Note */}
      {hasMore && !data.hasNoRelativesInGov && (
        <View style={{ padding: 3 }}>
          <Text style={styles.noteText}>(Continued on Page 4)</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Declaration Section Component
 * Legal paragraphs per CSC 2025 SALN form
 * Includes Date field before signature section
 */
function DeclarationSection() {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.certificationText}>{DECLARATION_PARAGRAPH_1}</Text>
      <Text style={styles.certificationText}>{DECLARATION_PARAGRAPH_2}</Text>

      {/* Date field */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 5 }}>
        <Text style={{ fontSize: 7, fontWeight: 'bold' }}>Date: </Text>
        <View style={{
          borderBottomWidth: 1,
          borderBottomColor: SALN_COLORS.borderColor,
          width: 150,
          height: 12,
        }} />
      </View>
    </View>
  );
}

/**
 * Signature Section Component
 * Two side-by-side columns, BOTH labeled "Signature of Declarant"
 * Left column: First government ID, Right column: Second government ID
 */
function SignatureSection({ data }: { data: SALNData }) {
  const {
    governmentIdType,
    governmentIdNumber,
    governmentIdDateIssued,
    governmentId2,
    governmentIdType2,
    governmentIdNumber2,
    governmentIdDateIssued2,
  } = data;

  // Resolve second government ID from either object or individual fields
  const govId2Type = governmentId2?.type || governmentIdType2 || '';
  const govId2Number = governmentId2?.number || governmentIdNumber2 || '';
  const govId2DateIssued = governmentId2?.dateIssued || governmentIdDateIssued2 || '';

  return (
    <View style={styles.signatureSection}>
      <View style={styles.signatureRow}>
        {/* Left Column - First Government ID */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Signature of Declarant</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Government Issued ID: {governmentIdType ? displayOrEmpty(governmentIdType) : '_________________'}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              ID No.: {governmentIdNumber ? displayOrEmpty(governmentIdNumber) : '_________________'}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              Date Issued: {governmentIdDateIssued ? formatDate(governmentIdDateIssued) : '_________________'}
            </Text>
          </View>
        </View>

        {/* Right Column - Second Government ID */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Signature of Declarant</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Government Issued ID: {govId2Type ? displayOrEmpty(govId2Type) : '_________________'}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              ID No.: {govId2Number ? displayOrEmpty(govId2Number) : '_________________'}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              Date Issued: {govId2DateIssued ? formatDate(govId2DateIssued) : '_________________'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Subscribed and Sworn Section Component
 * Simplified oath text referencing government-issued ID card
 * Simplified notary section with signature line and label
 */
function SubscribedAndSwornSection() {
  return (
    <View style={{ marginTop: 15 }}>
      <Text style={styles.certificationTitle}>SUBSCRIBED AND SWORN</Text>

      <Text style={styles.certificationText}>
        SUBSCRIBED AND SWORN to before me this ____ day of ________, affiant exhibiting
        to me the above-stated government-issued identification card.
      </Text>

      <View style={{ marginTop: 15 }}>
        {/* Notary Signature */}
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: SALN_COLORS.borderColor,
            width: '50%',
            height: 40,
            marginBottom: 3,
          }}
        />
        <Text
          style={[styles.signatureLabel, { textAlign: 'left', fontStyle: 'normal' }]}
        >
          (Person Administering Oath)
        </Text>
      </View>
    </View>
  );
}

/**
 * Footnotes Section Component
 * Renders four footnotes at the bottom of Page 2
 */
function FootnotesSection() {
  return (
    <View style={styles.footnoteSection}>
      <Text style={styles.footnoteText}>
        i Position, Agency, and Address shall only be declared if the spouse is a public official or employee.
      </Text>
      <Text style={styles.footnoteText}>
        ii Additional sheets may be used by the declarant, if necessary.
      </Text>
      <Text style={styles.footnoteText}>
        iii Capital or paraphernal assets, and liabilities of the declarant&apos;s spouse, and properties of children below 18 years of age and living in the declarant&apos;s household shall be disclosed using the additional sheets provided.
      </Text>
      <Text style={styles.footnoteText}>
        iv Balae refers to the parent of one&apos;s son or daughter-in-law; Bilas refers to a brother-in-law&apos;s wife or sister-in-law&apos;s husband; Inso refers to the appellation for the wife of an elder brother or male cousin.
      </Text>
    </View>
  );
}

/**
 * SALN Page 2 - Main Component
 * Renders the complete Page 2 with all sections
 */
export function SALNPage2({ data }: SALNPage2Props) {
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Page Number */}
      <Text style={[styles.formInfo, { fontSize: 7, marginBottom: 5 }]}>
        Page 2 of ___
      </Text>

      {/* Liabilities Section Header */}
      <Text style={styles.sectionHeader}>
        2. LIABILITIES
      </Text>
      <LiabilitiesSection data={data} />

      {/* Net Worth */}
      <NetWorthLine data={data} />

      {/* Business Interests Section */}
      <BusinessInterestsSection data={data} />

      {/* Relatives in Government Section */}
      <RelativesInGovSection data={data} />

      {/* Declaration Paragraphs */}
      <DeclarationSection />

      {/* Signature Section */}
      <SignatureSection data={data} />

      {/* Subscribed and Sworn Section */}
      <SubscribedAndSwornSection />

      {/* Footnotes */}
      <FootnotesSection />
    </Page>
  );
}
