/**
 * SALN Page 2 - Liabilities, Net Worth, Business Interests, Relatives in Government
 * CSC SALN Form 2019
 *
 * Contains:
 * - Liabilities (continuation from Page 1)
 * - Net Worth Calculation Box
 * - Business Interests and Financial Connections
 * - Relatives in Government Service (within 4th degree)
 * - Declaration Paragraphs
 * - Signature Section (Declarant and Spouse)
 * - Subscribed and Sworn Section
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

// CSC Legal Declaration Text
const DECLARATION_PARAGRAPH_1 =
  'I declare under oath that this Statement of Assets, Liabilities and Net Worth including the related disclosure required by R.A. No. 6713 and R.A. No. 3019, is a true, correct and complete statement of my assets, liabilities, net worth, business interests and financial connections, including those of my spouse and unmarried children below eighteen (18) years of age living in my household, as of the date indicated above; that I have diligently, accurately and in good faith, accomplished and submitted the same, and that the statement is subscribed and sworn to before an authority pursuant to the aforesaid laws.';

const DECLARATION_PARAGRAPH_2 =
  'I further authorize the Ombudsman or his/her duly authorized representative to obtain and secure from all appropriate government agencies, including the Bureau of Internal Revenue, such documents as may show my assets, liabilities, net worth, business interests and financial connections, to include those of my spouse and unmarried children below eighteen (18) years of age living in my household, for the purpose of verification and monitoring of compliance with R.A. No. 6713 and R.A. No. 3019.';

/**
 * Liabilities Section Component
 * Displays first 12 liabilities with subtotal
 */
function LiabilitiesSection({ data }: { data: SALNData }) {
  const liabilities = data.liabilities || [];
  const displayLiabilities = liabilities.slice(0, 12);
  const hasMore = liabilities.length > 12;

  // Calculate subtotal for displayed liabilities
  const subtotal = displayLiabilities.reduce(
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

      {/* Subtotal Row */}
      <View style={styles.subtotalRow}>
        <View style={[styles.tableCellNoBorder, styles.w75]}>
          <Text style={styles.subtotalLabel}>
            SUBTOTAL - LIABILITIES{hasMore ? ' (Page 2)' : ''}
          </Text>
        </View>
        <View style={[styles.currencyCellNoBorder, styles.w25]}>
          <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
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
 * Net Worth Calculation Box Component
 * Shows Total Assets - Total Liabilities = Net Worth
 */
function NetWorthBox({ data }: { data: SALNData }) {
  const totalAssets = data.totalAssets || 0;
  const totalLiabilities = data.totalLiabilities || 0;
  const netWorth = data.netWorth || 0;

  return (
    <View style={styles.netWorthBox}>
      {/* Total Assets */}
      <View style={styles.netWorthRow}>
        <Text style={styles.netWorthLabel}>TOTAL ASSETS:</Text>
        <Text style={styles.netWorthValue}>{formatCurrency(totalAssets)}</Text>
      </View>

      {/* Less: Total Liabilities */}
      <View style={styles.netWorthRow}>
        <Text style={styles.netWorthLabel}>LESS: TOTAL LIABILITIES:</Text>
        <Text style={styles.netWorthValue}>{formatCurrency(totalLiabilities)}</Text>
      </View>

      {/* Divider */}
      <View
        style={{
          borderBottomWidth: 2,
          borderBottomColor: SALN_COLORS.borderColor,
          marginVertical: 5,
        }}
      />

      {/* Net Worth */}
      <View style={styles.netWorthRow}>
        <Text style={[styles.netWorthLabel, { fontSize: 10 }]}>NET WORTH:</Text>
        <Text style={[styles.netWorthValue, { fontSize: 12 }]}>
          {formatCurrency(netWorth)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Business Interests Section Component
 * Displays first 8 business interests
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
 * Relatives in Government Section Component
 * Displays first 8 relatives
 */
function RelativesInGovSection({ data }: { data: SALNData }) {
  const relatives = data.relativesInGov || [];
  const displayRelatives = relatives.slice(0, 8);
  const hasMore = relatives.length > 8;

  return (
    <View>
      <Text style={styles.sectionHeader}>
        RELATIVES IN THE GOVERNMENT SERVICE (Within the Fourth Civil Degree of
        Consanguinity or Affinity)
      </Text>
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
 * Declaration Section Component
 * Two legal paragraphs required by CSC
 */
function DeclarationSection() {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.certificationText}>{DECLARATION_PARAGRAPH_1}</Text>
      <Text style={styles.certificationText}>{DECLARATION_PARAGRAPH_2}</Text>
    </View>
  );
}

/**
 * Signature Section Component
 * Two columns: Declarant and Spouse
 * Each with signature, Community Tax Cert, and Government ID fields
 */
function SignatureSection({ data }: { data: SALNData }) {
  const { declarantInfo, spouseInfo } = data;

  return (
    <View style={styles.signatureSection}>
      <View style={styles.signatureRow}>
        {/* Declarant Column */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Signature of Declarant</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Community Tax Cert. No.: _________________
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              Date / Place Issued: _________________
            </Text>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Government Issued ID:
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              ID Type: {displayOrEmpty(declarantInfo.governmentId?.type)}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              ID/License/Passport No.: {displayOrEmpty(declarantInfo.governmentId?.number)}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              Date/Place of Issuance:{' '}
              {declarantInfo.governmentId?.dateIssued
                ? formatDate(declarantInfo.governmentId.dateIssued)
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Spouse Column */}
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Signature of Spouse</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Community Tax Cert. No.: _________________
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              Date / Place Issued: _________________
            </Text>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Government Issued ID:
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              ID Type: {spouseInfo ? displayOrEmpty(spouseInfo.governmentId?.type) : 'N/A'}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              ID/License/Passport No.:{' '}
              {spouseInfo ? displayOrEmpty(spouseInfo.governmentId?.number) : 'N/A'}
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 2 },
              ]}
            >
              Date/Place of Issuance:{' '}
              {spouseInfo?.governmentId?.dateIssued
                ? formatDate(spouseInfo.governmentId.dateIssued)
                : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Subscribed and Sworn Section Component
 * Oath text and notary fields
 */
function SubscribedAndSwornSection() {
  return (
    <View style={{ marginTop: 15 }}>
      <Text style={styles.certificationTitle}>SUBSCRIBED AND SWORN</Text>

      <Text style={styles.certificationText}>
        SUBSCRIBED AND SWORN to before me this _______ day of ________________,
        20____, affiant(s) exhibiting his/her competent evidence(s) of identity as
        indicated above.
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
          Person Administering Oath
        </Text>

        {/* Notary Details in Two Columns */}
        <View style={{ flexDirection: 'row', marginTop: 10, gap: 20 }}>
          {/* Left Column */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              Name (in print): _____________________________
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 4 },
              ]}
            >
              Position / Title: _____________________________
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 4 },
              ]}
            >
              Address: _____________________________________
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 4 },
              ]}
            >
              PTR No.: _________________ Date/Place Issued: ________________
            </Text>
          </View>

          {/* Right Column */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.signatureLabel, { textAlign: 'left', fontSize: 6 }]}>
              IBP No.: _________________ Date/Place Issued: ________________
            </Text>
            <Text
              style={[
                styles.signatureLabel,
                { textAlign: 'left', fontSize: 6, marginTop: 4 },
              ]}
            >
              Roll of Attorneys No.: ___________________________________
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * SALN Page 2 - Main Component
 */
export function SALNPage2({ data }: SALNPage2Props) {
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Page Number */}
      <Text style={[styles.formInfo, { fontSize: 7, marginBottom: 5 }]}>
        Page 2 of 4
      </Text>

      {/* Liabilities Section */}
      <Text style={styles.sectionHeader}>LIABILITIES</Text>
      <LiabilitiesSection data={data} />

      {/* Net Worth Calculation Box */}
      <NetWorthBox data={data} />

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
    </Page>
  );
}
