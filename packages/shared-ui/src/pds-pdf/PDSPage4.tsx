/**
 * PDS Page 4 - Questions 34-42, References, Declaration & Signature
 * CS Form No. 212 (Revised 2025)
 *
 * Contains:
 * - Questions 34-42 (Yes/No with details)
 * - Question 40 subsections (a. Indigenous, b. Disability, c. Solo Parent)
 * - References section (3 persons)
 * - Government Issued ID section
 * - Declaration with oath
 * - Signature box (blank for wet signature)
 * - Right thumb mark box
 * - Photo box (passport size)
 * - Subscribed and sworn section
 * - Page footer (CS FORM 212 Revised 2025, Page 4 of 4)
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  PDS_COLORS,
  displayOrEmpty,
  formatDateMMDDYYYY,
} from './PDSStyles';
import type { PDSData, Reference } from './types';
import {
  PDSPageFooter,
  PhotoBox,
  ThumbmarkBox,
  SignatureBox,
  DeclarationText,
} from './PDSComponents';

interface PDSPage4Props {
  data: PDSData;
}

/**
 * Yes/No question row component with detail field
 */
function QuestionRow({
  number,
  question,
  subQuestion,
  yesChecked,
  details,
}: {
  number: string;
  question: string;
  subQuestion?: string;
  yesChecked: boolean;
  details?: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.labelCell, styles.w60]}>
        <Text style={styles.labelSmall}>
          {number}. {question}
        </Text>
        {subQuestion && (
          <Text style={[styles.labelSmall, styles.italic, { marginTop: 2 }]}>
            {subQuestion}
          </Text>
        )}
      </View>
      <View style={[styles.fieldCell, styles.w15]}>
        <View style={[styles.row, { justifyContent: 'center', gap: 5 }]}>
          <View style={styles.checkboxRow}>
            <View style={yesChecked ? styles.checkboxChecked : styles.checkbox}>
              {yesChecked && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.labelSmall}>YES</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={!yesChecked ? styles.checkboxChecked : styles.checkbox}>
              {!yesChecked && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.labelSmall}>NO</Text>
          </View>
        </View>
      </View>
      <View style={[styles.fieldCellLast, styles.w25]}>
        <Text style={styles.labelSmall}>If YES, give details:</Text>
        <Text style={styles.valueSmall}>{displayOrEmpty(details)}</Text>
      </View>
    </View>
  );
}

/**
 * Reference row component for table
 */
function ReferenceRow({ reference }: { reference?: Reference }) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.tableCell, styles.w33]}>
        <Text style={styles.value}>{reference?.name || ''}</Text>
      </View>
      <View style={[styles.tableCell, styles.w33]}>
        <Text style={styles.valueSmall}>{reference?.address || ''}</Text>
      </View>
      <View style={[styles.tableCellNoBorder, { flex: 1 }]}>
        <Text style={styles.value}>{reference?.telephoneNo || ''}</Text>
      </View>
    </View>
  );
}

export function PDSPage4({ data }: PDSPage4Props) {
  const { questions, references, governmentId } = data;

  // Map questions to CS Form 212 Revised 2025 format
  // Note: The existing interface may need updating to match the 2025 form exactly
  // For now, we map existing fields to the closest equivalents

  // Question 34: Related by consanguinity/affinity
  const q34Related = questions.Q34_related_to_authority ?? questions.Q34_criminal_charged ?? false;
  const q34Details = questions.Q34_related_to_authority_details ?? questions.Q34_criminal_charged_details ?? '';

  // Question 35a: Administrative offense
  const q35aAdminOffense = questions.Q35a_admin_offense ?? questions.Q35_criminal_convicted ?? false;
  const q35aDetails = questions.Q35a_admin_offense_details ?? questions.Q35_criminal_convicted_details ?? '';

  // Question 35b: Criminally charged
  const q35bCriminalCharged = questions.Q35b_criminal_charged ?? false;
  const q35bDetails = questions.Q35b_criminal_charged_details ?? '';

  // Question 36: Convicted of crime
  const q36Convicted = questions.Q36_convicted_of_crime ?? false;
  const q36Details = questions.Q36_convicted_of_crime_details ?? '';

  // Question 37: Separated from service
  const q37Separated = questions.Q37_separated_from_service ?? questions.Q36_separated_from_service ?? false;
  const q37Details = questions.Q37_separated_from_service_details ?? questions.Q36_separated_from_service_details ?? '';

  // Question 38a: Candidate in election
  const q38aCandidate = questions.Q38a_candidate_for_election ?? questions.Q37_candidate_for_election ?? false;
  const q38aDetails = questions.Q38a_candidate_for_election_details ?? questions.Q37_candidate_for_election_details ?? '';

  // Question 38b: Resigned to campaign
  const q38bResigned = questions.Q38b_resigned_to_campaign ?? questions.Q38_resigned_from_government ?? false;
  const q38bDetails = questions.Q38b_resigned_to_campaign_details ?? questions.Q38_resigned_from_government_details ?? '';

  // Question 39: Immigrant/permanent resident
  const q39Immigrant = questions.Q39_immigrant_status ?? questions.Q39_immigrant_or_acquired_residence ?? false;
  const q39Details = questions.Q39_immigrant_status_details ?? questions.Q39_immigrant_or_acquired_residence_details ?? '';

  // Question 40a: Indigenous group member
  const q40aIndigenous = questions.Q40a_indigenous_group ?? questions.Q40_indigenous_group ?? false;
  const q40aDetails = questions.Q40a_indigenous_group_details ?? questions.Q40_indigenous_group_details ?? '';

  // Question 40b: Person with disability
  const q40bDisabled = questions.Q40b_disabled ?? questions.Q41_disabled ?? false;
  const q40bDetails = questions.Q40b_disabled_details ?? questions.Q41_disabled_details ?? '';

  // Question 40c: Solo parent
  const q40cSoloParent = questions.Q40c_solo_parent ?? questions.Q42_solo_parent ?? false;
  const q40cDetails = questions.Q40c_solo_parent_details ?? questions.Q42_solo_parent_details ?? '';

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Questions Section */}
      <View style={styles.borderedSection}>
        {/* Question 34 */}
        <QuestionRow
          number="34"
          question="Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be appointed,"
          subQuestion="a. within the third degree?    b. within the fourth degree (for Local Government Unit - Career Employees)?"
          yesChecked={q34Related}
          details={q34Details}
        />

        {/* Question 35a */}
        <QuestionRow
          number="35"
          question="a. Have you ever been found guilty of any administrative offense?"
          yesChecked={q35aAdminOffense}
          details={q35aDetails}
        />

        {/* Question 35b */}
        <QuestionRow
          number=""
          question="b. Have you been criminally charged before any court?"
          yesChecked={q35bCriminalCharged}
          details={q35bDetails}
        />

        {/* Question 36 */}
        <QuestionRow
          number="36"
          question="Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?"
          yesChecked={q36Convicted}
          details={q36Details}
        />

        {/* Question 37 */}
        <QuestionRow
          number="37"
          question="Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?"
          yesChecked={q37Separated}
          details={q37Details}
        />

        {/* Question 38a */}
        <QuestionRow
          number="38"
          question="a. Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?"
          yesChecked={q38aCandidate}
          details={q38aDetails}
        />

        {/* Question 38b */}
        <QuestionRow
          number=""
          question="b. Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?"
          yesChecked={q38bResigned}
          details={q38bDetails}
        />

        {/* Question 39 */}
        <QuestionRow
          number="39"
          question="Have you acquired the status of an immigrant or permanent resident of another country?"
          yesChecked={q39Immigrant}
          details={q39Details}
        />

        {/* Question 40 Header */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { flex: 1 }]}>
            <Text style={styles.labelSmall}>
              40. Pursuant to: (a) Indigenous People&apos;s Act (RA 8371); (b)
              Magna Carta for Disabled Persons (RA 7277, as amended); and (c)
              Expanded Solo Parents Welfare Act (RA 11861), please answer the
              following items:
            </Text>
          </View>
        </View>

        {/* Question 40a */}
        <QuestionRow
          number=""
          question="a. Are you a member of any indigenous group?"
          yesChecked={q40aIndigenous}
          details={q40aDetails}
        />

        {/* Question 40b */}
        <QuestionRow
          number=""
          question="b. Are you a person with disability?"
          yesChecked={q40bDisabled}
          details={q40bDetails}
        />

        {/* Question 40c */}
        <QuestionRow
          number=""
          question="c. Are you a solo parent?"
          yesChecked={q40cSoloParent}
          details={q40cDetails}
        />
      </View>

      {/* 41. REFERENCES Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={[styles.fieldRow, { backgroundColor: '#D9D9D9' }]}>
          <View style={[styles.labelCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>
              41. REFERENCES
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.subSectionHeader,
            { textAlign: 'left', paddingLeft: 5 },
          ]}
        >
          <Text style={styles.labelSmall}>
            (Person not related by consanguinity or affinity to applicant /
            appointee)
          </Text>
        </View>

        {/* Table Header */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w33]}>
            <Text style={[styles.labelSmall, styles.center]}>NAME</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w33]}>
            <Text style={[styles.labelSmall, styles.center]}>
              OFFICE / RESIDENTIAL ADDRESS
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { flex: 1 }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              CONTACT NO. AND/OR EMAIL
            </Text>
          </View>
        </View>

        {/* Reference rows (3 required) */}
        {Array.from({ length: 3 }).map((_, index) => (
          <ReferenceRow key={index} reference={references[index]} />
        ))}
      </View>

      {/* 42. GOVERNMENT ISSUED ID Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={[styles.fieldRow, { backgroundColor: '#D9D9D9' }]}>
          <View style={[styles.labelCell, { flex: 1, borderRightWidth: 0 }]}>
            <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>
              42. Government Issued ID (i.e.Passport, GSIS, SSS, PRC, Driver&apos;s License, etc.)
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.subSectionHeader,
            { textAlign: 'left', paddingLeft: 5 },
          ]}
        >
          <Text style={styles.labelSmall}>
            PLEASE INDICATE ID Number and Date of Issuance
          </Text>
        </View>

        {/* Government Issued ID */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Government Issued ID:</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(governmentId?.idType)}
            </Text>
          </View>
        </View>

        {/* ID/License/Passport No. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>ID/License/Passport No.:</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(governmentId?.idNumber)}
            </Text>
          </View>
        </View>

        {/* Date/Place of Issuance */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Date/Place of Issuance:</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {formatDateMMDDYYYY(governmentId?.dateIssued)}
              {governmentId?.placeIssued
                ? ` / ${displayOrEmpty(governmentId.placeIssued)}`
                : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* DECLARATION Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={[styles.row, { padding: 5 }]}>
          {/* Left side - Declaration text and signature */}
          <View style={[styles.column, styles.w60]}>
            <DeclarationText>
              I declare under oath that I have personally accomplished this
              Personal Data Sheet which is a true, correct, and complete
              statement pursuant to the provisions of pertinent laws, rules, and
              regulations of the Republic of the Philippines. I authorize the
              agency head/authorized representative to verify/validate the
              contents stated herein. I agree that any misrepresentation made in
              this document and its attachments shall cause the filing of
              administrative/criminal case/s against me.
            </DeclarationText>

            {/* Signature and Date Row */}
            <View style={[styles.row, styles.marginTop10]}>
              {/* Signature Box */}
              <View style={[styles.column, { alignItems: 'center', flex: 1 }]}>
                <SignatureBox />
                <Text style={[styles.labelSmall, styles.center, { marginTop: 5 }]}>
                  Signature
                </Text>
                <Text
                  style={[
                    styles.noteText,
                    styles.center,
                    styles.italic,
                    { marginTop: 2 },
                  ]}
                >
                  (wet signature/e-signature/digital certificate)
                </Text>
              </View>

              {/* Date Accomplished */}
              <View
                style={[
                  styles.column,
                  { alignItems: 'center', flex: 1, marginTop: 20 },
                ]}
              >
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: PDS_COLORS.black,
                    width: 150,
                    height: 30,
                  }}
                />
                <Text style={[styles.labelSmall, styles.center, { marginTop: 5 }]}>
                  Date Accomplished
                </Text>
              </View>
            </View>
          </View>

          {/* Right side - Photo and Thumbmark */}
          <View style={[styles.column, styles.w40, { alignItems: 'center' }]}>
            {/* Photo Box */}
            <Text style={[styles.labelSmall, styles.center, styles.bold, { marginBottom: 3, fontSize: 7 }]}>PHOTO</Text>
            <PhotoBox imageUrl={data.photoUrl ?? undefined} />
            <Text style={[styles.labelSmall, styles.center, { marginTop: 5 }]}>
              Passport-sized unfiltered digital
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              picture taken within the last 6 months
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              4.5 cm. X 3.5 cm
            </Text>

            {/* Right Thumb Mark Box */}
            <View style={{ marginTop: 10 }}>
              <ThumbmarkBox />
              <Text style={[styles.labelSmall, styles.center, styles.bold, { marginTop: 3 }]}>RIGHT THUMBMARK</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SUBSCRIBED AND SWORN Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={{ padding: 5 }}>
          <Text style={styles.declarationText}>
            SUBSCRIBED AND SWORN to before me this ____________________, affiant
            exhibiting his/her validly issued government ID as indicated above.
          </Text>

          <View style={[styles.marginTop10, { alignItems: 'center' }]}>
            <View style={{ height: 40 }} />
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: PDS_COLORS.black,
                width: 200,
              }}
            />
            <Text style={[styles.labelSmall, styles.center, { marginTop: 5 }]}>
              Person Administering Oath
            </Text>
            <Text
              style={[
                styles.noteText,
                styles.center,
                styles.italic,
                { marginTop: 2 },
              ]}
            >
              (wet signature/e-signature/digital certificate except for notary
              public)
            </Text>
          </View>
        </View>
      </View>

      {/* Page Footer */}
      <PDSPageFooter pageNumber={4} totalPages={4} showSignature={false} />
    </Page>
  );
}

export default PDSPage4;
