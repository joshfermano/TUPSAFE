/**
 * PDS Page 4 - Questions 34-42, References, Declaration & Signature
 * CS Form No. 212 (Revised 2017)
 *
 * Contains:
 * - Questions 34-42 (Yes/No with details)
 * - References section (3 persons)
 * - Government Issued ID section
 * - Declaration with oath
 * - Signature box (blank for wet signature)
 * - Right thumb mark box
 * - Photo box (passport size)
 * - Subscribed and sworn section
 */

import { Page, View, Text } from '@react-pdf/renderer';
import { styles, displayOrEmpty, formatDateMMDDYYYY } from './PDSStyles';
import type { PDSData, Reference, GovernmentID, PDSQuestions } from './types';

interface PDSPage4Props {
  data: PDSData;
}

// Checkbox component
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={checked ? styles.checkboxChecked : styles.checkbox}>
      {checked && <Text style={styles.checkMark}>X</Text>}
    </View>
  );
}

// Yes/No question row component
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
          <Text style={[styles.labelSmall, styles.italic]}>{subQuestion}</Text>
        )}
      </View>
      <View style={[styles.fieldCell, styles.w15]}>
        <View style={[styles.row, { justifyContent: 'center' }]}>
          <View style={styles.checkboxRow}>
            <Checkbox checked={yesChecked} />
            <Text style={styles.labelSmall}>YES</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Checkbox checked={!yesChecked} />
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

// Reference row component
function ReferenceRow({ reference, index }: { reference?: Reference; index: number }) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.tableCell, styles.w40]}>
        <Text style={styles.value}>{reference?.name || ''}</Text>
      </View>
      <View style={[styles.tableCell, styles.w40]}>
        <Text style={styles.valueSmall}>{reference?.address || ''}</Text>
      </View>
      <View style={[styles.tableCellNoBorder, styles.w20]}>
        <Text style={styles.value}>{reference?.telephoneNo || ''}</Text>
      </View>
    </View>
  );
}

export function PDSPage4({ data }: PDSPage4Props) {
  const { questions, references, governmentId } = data;

  // Map the existing questions interface to the CS Form 212 questions
  // Note: The type interface may need updating to match exact form questions
  const q34Related = questions.Q34_criminal_charged ?? false;
  const q34Details = questions.Q34_criminal_charged_details ?? '';

  const q35aAdminOffense = questions.Q35_criminal_convicted ?? false;
  const q35aDetails = questions.Q35_criminal_convicted_details ?? '';

  const q35bCriminalCharged = questions.Q34_criminal_charged ?? false;
  const q35bDetails = questions.Q34_criminal_charged_details ?? '';

  const q36Convicted = questions.Q35_criminal_convicted ?? false;
  const q36Details = questions.Q35_criminal_convicted_details ?? '';

  const q37Separated = questions.Q36_separated_from_service ?? false;
  const q37Details = questions.Q36_separated_from_service_details ?? '';

  const q38aCandidate = questions.Q37_candidate_for_election ?? false;
  const q38aDetails = questions.Q37_candidate_for_election_details ?? '';

  const q38bResigned = questions.Q38_resigned_from_government ?? false;
  const q38bDetails = questions.Q38_resigned_from_government_details ?? '';

  const q39Immigrant = questions.Q39_immigrant_or_acquired_residence ?? false;
  const q39Details = questions.Q39_immigrant_or_acquired_residence_details ?? '';

  const q40Indigenous = questions.Q40_indigenous_group ?? false;
  const q40Details = questions.Q40_indigenous_group_details ?? '';

  const q41Disabled = questions.Q41_disabled ?? false;
  const q41Details = questions.Q41_disabled_details ?? '';

  const q42SoloParent = questions.Q42_solo_parent ?? false;
  const q42Details = questions.Q42_solo_parent_details ?? '';

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Questions Section Header */}
      <View style={styles.borderedSection}>
        {/* Question 34 */}
        <QuestionRow
          number="34"
          question="Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be appointed,"
          subQuestion="a. within the third degree? b. within the fourth degree (for Local Government Unit - Loss Elective Official)?"
          yesChecked={q34Related}
          details={q34Details}
        />

        {/* Question 35a */}
        <QuestionRow
          number="35a"
          question="Have you ever been found guilty of any administrative offense?"
          yesChecked={q35aAdminOffense}
          details={q35aDetails}
        />

        {/* Question 35b */}
        <QuestionRow
          number="35b"
          question="Have you been criminally charged before any court?"
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
          number="38a"
          question="Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?"
          yesChecked={q38aCandidate}
          details={q38aDetails}
        />

        {/* Question 38b */}
        <QuestionRow
          number="38b"
          question="Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?"
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

        {/* Question 40 */}
        <QuestionRow
          number="40"
          question="Pursuant to: (a) Indigenous People's Act (RA No. 8371); (b) Magna Carta for Disabled Persons (RA No. 7277); and (c) Solo Parents Welfare Act of 2000 (RA No. 8972), please answer the following items:"
          subQuestion="Are you a member of any indigenous group?"
          yesChecked={q40Indigenous}
          details={q40Details}
        />

        {/* Question 41 */}
        <QuestionRow
          number="41"
          question="Are you a person with disability?"
          yesChecked={q41Disabled}
          details={q41Details}
        />

        {/* Question 42 */}
        <QuestionRow
          number="42"
          question="Are you a solo parent?"
          yesChecked={q42SoloParent}
          details={q42Details}
        />
      </View>

      {/* References Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>REFERENCES</Text>
          <Text style={[styles.labelSmall, { color: '#ffffff' }]}>
            (Person not related by consanguinity or affinity to applicant / appointee)
          </Text>
        </View>

        {/* References header */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w40]}>
            <Text style={[styles.labelSmall, styles.center]}>NAME</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w40]}>
            <Text style={[styles.labelSmall, styles.center]}>ADDRESS</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w20]}>
            <Text style={[styles.labelSmall, styles.center]}>TEL. NO.</Text>
          </View>
        </View>

        {/* Reference rows (3 required) */}
        {Array.from({ length: 3 }).map((_, index) => (
          <ReferenceRow
            key={index}
            reference={references[index]}
            index={index}
          />
        ))}
      </View>

      {/* Government Issued ID Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>
              43. GOVERNMENT ISSUED ID
            </Text>
            <Text style={[styles.labelSmall, styles.italic]}>
              (i.e. Passport, GSIS, SSS, PRC, Driver&apos;s License, etc.)
            </Text>
            <Text style={[styles.labelSmall, styles.italic]}>
              PLEASE INDICATE ID Number and Date of Issuance
            </Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <View style={styles.row}>
              <View style={[styles.column, styles.w50]}>
                <Text style={styles.labelSmall}>Government Issued ID:</Text>
                <Text style={styles.value}>
                  {displayOrEmpty(governmentId?.idType)}
                </Text>
              </View>
              <View style={[styles.column, styles.w50]}>
                <Text style={styles.labelSmall}>ID/License/Passport No.:</Text>
                <Text style={styles.value}>
                  {displayOrEmpty(governmentId?.idNumber)}
                </Text>
              </View>
            </View>
            <View style={[styles.row, styles.marginTop5]}>
              <View style={[styles.column, styles.w50]}>
                <Text style={styles.labelSmall}>Date of Issuance:</Text>
                <Text style={styles.value}>
                  {formatDateMMDDYYYY(governmentId?.dateIssued)}
                </Text>
              </View>
              <View style={[styles.column, styles.w50]}>
                <Text style={styles.labelSmall}>Place of Issuance:</Text>
                <Text style={styles.value}>
                  {displayOrEmpty(governmentId?.placeIssued)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Declaration and Signature Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={[styles.row, { padding: 5 }]}>
          {/* Left side - Declaration */}
          <View style={[styles.column, styles.w60]}>
            <Text style={styles.declarationText}>
              I declare under oath that I have personally accomplished this Personal
              Data Sheet which is a true, correct and complete statement pursuant to
              the provisions of pertinent laws, rules and regulations of the Republic
              of the Philippines. I authorize the agency head/authorized
              representative to verify/validate the contents stated herein. I agree
              that any misrepresentation made in this document and its attachments
              shall cause the filing of administrative/criminal case/s against me.
            </Text>

            {/* Signature Row */}
            <View style={[styles.row, styles.marginTop10]}>
              <View style={[styles.column, { alignItems: 'center', flex: 1 }]}>
                {/* BLANK Signature Box for wet signature */}
                <View style={styles.signatureBox}>
                  {/* Empty - user will sign after printing */}
                </View>
                <Text style={[styles.labelSmall, styles.center, styles.marginTop5]}>
                  Signature (Sign inside the box)
                </Text>
              </View>
              <View style={[styles.column, { alignItems: 'center', flex: 1 }]}>
                <View style={{ height: 50, justifyContent: 'flex-end' }}>
                  <Text style={styles.value}>
                    _________________________________
                  </Text>
                </View>
                <Text style={[styles.labelSmall, styles.center, styles.marginTop5]}>
                  Date Accomplished
                </Text>
              </View>
            </View>
          </View>

          {/* Right side - Photo and Thumbmark */}
          <View style={[styles.column, styles.w40, { alignItems: 'center' }]}>
            {/* Photo Box */}
            <View style={styles.photoBox}>
              <Text style={[styles.labelSmall, styles.center]}>
                ID picture taken within
              </Text>
              <Text style={[styles.labelSmall, styles.center]}>
                the last 6 months
              </Text>
              <Text style={[styles.labelSmall, styles.center]}>
                3.5 cm x 4.5 cm
              </Text>
              <Text style={[styles.labelSmall, styles.center]}>
                (passport size)
              </Text>
            </View>
            <Text style={[styles.labelSmall, styles.center, styles.marginTop5]}>
              Photo
            </Text>

            {/* Right Thumb Mark Box */}
            <View style={[styles.thumbmarkBox, styles.marginTop10]}>
              {/* Empty - user will provide thumbmark after printing */}
            </View>
            <Text style={[styles.labelSmall, styles.center, styles.marginTop5]}>
              Right Thumbmark
            </Text>
          </View>
        </View>
      </View>

      {/* Subscribed and Sworn Section */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={{ padding: 5 }}>
          <Text style={styles.subscribeText}>
            SUBSCRIBED AND SWORN to before me this ________ day of ________________, ________,
          </Text>
          <Text style={[styles.subscribeText, styles.marginTop5]}>
            affiant exhibiting his/her validly issued government ID as indicated above.
          </Text>

          <View style={[styles.row, styles.marginTop10, { justifyContent: 'space-around' }]}>
            <View style={styles.column}>
              <Text style={styles.labelSmall}>Community Tax Certificate No.:</Text>
              <Text style={styles.value}>_________________________</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.labelSmall}>Issued at:</Text>
              <Text style={styles.value}>_________________________</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.labelSmall}>Issued on:</Text>
              <Text style={styles.value}>_________________________</Text>
            </View>
          </View>

          <View style={[styles.marginTop10, { alignItems: 'center' }]}>
            <View style={{ height: 40 }} />
            <Text style={styles.value}>
              _______________________________________________
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              Person Administering Oath
            </Text>
          </View>
        </View>
      </View>

      {/* Page footer */}
      <View style={styles.pageNumber}>
        <Text style={styles.noteText}>CS FORM 212 (Revised 2017), Page 4 of 4</Text>
      </View>
    </Page>
  );
}

export default PDSPage4;
