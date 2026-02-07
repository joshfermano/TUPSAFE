/**
 * PDS Page 3 - Voluntary Work, Training, and Other Information
 * CS Form No. 212 (Revised 2025)
 *
 * Contains:
 * - Section VI: Voluntary Work or Involvement in Civic/Non-Government/People/Voluntary Organizations
 * - Section VII: Learning and Development (L&D) Interventions/Training Programs Attended
 * - Section VIII: Other Information (Skills, Recognitions, Associations)
 */

import { Page, View, Text } from '@react-pdf/renderer';
import { styles, formatDateMMDDYYYY, displayOrEmpty } from './PDSStyles';
import { PDSPageFooter, ContinueText } from './PDSComponents';
import type { PDSData, VoluntaryWork, Training } from './types';

interface PDSPage3Props {
  data: PDSData;
}

// Minimum rows to display for each section
const MIN_VOLUNTARY_WORK_ROWS = 7;
const MIN_TRAINING_ROWS = 18;
const MIN_OTHER_INFO_ROWS = 7;

/**
 * Sort array by date (latest first)
 * Uses dateFrom for sorting
 */
function sortByDateDesc<T extends { dateFrom: Date | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.dateFrom);
    const dateB = new Date(b.dateFrom);
    return dateB.getTime() - dateA.getTime();
  });
}

export function PDSPage3({ data }: PDSPage3Props) {
  const { voluntaryWorks, trainings, skills, recognitions, associations } = data;

  // Sort voluntary works and trainings by date (latest first)
  const sortedVoluntaryWorks = sortByDateDesc(voluntaryWorks);
  const sortedTrainings = sortByDateDesc(trainings);

  // Calculate rows needed for each section
  const voluntaryWorkRows = Math.max(MIN_VOLUNTARY_WORK_ROWS, sortedVoluntaryWorks.length);
  const trainingRows = Math.max(MIN_TRAINING_ROWS, sortedTrainings.length);
  const otherInfoRows = Math.max(
    MIN_OTHER_INFO_ROWS,
    skills.length,
    recognitions.length,
    associations.length
  );

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Section VI: Voluntary Work */}
      <View style={styles.borderedSection}>
        <View style={styles.sectionHeader}>
          <Text>
            VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE /
            VOLUNTARY ORGANIZATION/S
          </Text>
        </View>

        {/* Voluntary Work Table Header */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w40]}>
            <Text style={[styles.labelSmall, styles.center]}>
              29. NAME &amp; ADDRESS OF ORGANIZATION
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (Write in full)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w20]}>
            <Text style={[styles.labelSmall, styles.center]}>
              INCLUSIVE DATES
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (mm/dd/yyyy)
            </Text>
            <View style={[styles.row, { marginTop: 2 }]}>
              <View style={[styles.flex1, { borderRightWidth: 0.5, borderRightColor: '#000' }]}>
                <Text style={[styles.labelSmall, styles.center]}>From</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.labelSmall, styles.center]}>To</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>
              NUMBER OF HOURS
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { flex: 1 }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              POSITION / NATURE OF WORK
            </Text>
          </View>
        </View>

        {/* Voluntary Work Data Rows */}
        {Array.from({ length: voluntaryWorkRows }).map((_, index) => {
          const work: VoluntaryWork | undefined = sortedVoluntaryWorks[index];
          const isLastCell = true;
          return (
            <View key={`voluntary-${index}`} style={styles.fieldRow}>
              <View style={[styles.tableCell, styles.w40]}>
                <Text style={styles.valueSmall}>
                  {work
                    ? `${displayOrEmpty(work.organizationName)}${
                        work.organizationAddress
                          ? `, ${displayOrEmpty(work.organizationAddress)}`
                          : ''
                      }`
                    : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.w20]}>
                <View style={styles.row}>
                  <View style={[styles.flex1, { borderRightWidth: 0.5, borderRightColor: '#000', padding: 1 }]}>
                    <Text style={[styles.valueSmall, styles.center]}>
                      {work ? formatDateMMDDYYYY(work.dateFrom) : ''}
                    </Text>
                  </View>
                  <View style={[styles.flex1, { padding: 1 }]}>
                    <Text style={[styles.valueSmall, styles.center]}>
                      {work && work.dateTo ? formatDateMMDDYYYY(work.dateTo) : ''}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.tableCell, styles.w15]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {work?.numberOfHours ? String(work.numberOfHours) : ''}
                </Text>
              </View>
              <View style={[isLastCell ? styles.tableCellNoBorder : styles.tableCell, { flex: 1 }]}>
                <Text style={styles.valueSmall}>
                  {work ? displayOrEmpty(work.positionNature) : ''}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Continuation note for Voluntary Work */}
        <ContinueText align="right" marginTop={3} />
      </View>

      {/* Section VII: Learning and Development */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>
            VII. LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS
            ATTENDED
          </Text>
        </View>
        <View style={styles.subSectionHeader}>
          <Text style={styles.labelSmall}>
            (Start from the most recent L&amp;D/training program and include only the
            relevant L&amp;D/training taken for the last five (5) years for Division
            Chief/Executive/Managerial positions)
          </Text>
        </View>

        {/* Training Table Header */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w33]}>
            <Text style={[styles.labelSmall, styles.center]}>
              30. TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/TRAINING PROGRAMS
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (Write in full)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w20]}>
            <Text style={[styles.labelSmall, styles.center]}>
              INCLUSIVE DATES OF ATTENDANCE
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (mm/dd/yyyy)
            </Text>
            <View style={[styles.row, { marginTop: 2 }]}>
              <View style={[styles.flex1, { borderRightWidth: 0.5, borderRightColor: '#000' }]}>
                <Text style={[styles.labelSmall, styles.center]}>From</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.labelSmall, styles.center]}>To</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tableCellHeader, styles.w10]}>
            <Text style={[styles.labelSmall, styles.center]}>
              NUMBER OF HOURS
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>
              Type of LD
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (Managerial/ Supervisory/ Technical/etc)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { flex: 1 }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              CONDUCTED/ SPONSORED BY
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (Write in full)
            </Text>
          </View>
        </View>

        {/* Training Data Rows */}
        {Array.from({ length: trainingRows }).map((_, index) => {
          const training: Training | undefined = sortedTrainings[index];
          const isLastCell = true;
          return (
            <View key={`training-${index}`} style={styles.fieldRow}>
              <View style={[styles.tableCell, styles.w33]}>
                <Text style={styles.valueSmall}>
                  {training ? displayOrEmpty(training.title) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.w20]}>
                <View style={styles.row}>
                  <View style={[styles.flex1, { borderRightWidth: 0.5, borderRightColor: '#000', padding: 1 }]}>
                    <Text style={[styles.valueSmall, styles.center]}>
                      {training ? formatDateMMDDYYYY(training.dateFrom) : ''}
                    </Text>
                  </View>
                  <View style={[styles.flex1, { padding: 1 }]}>
                    <Text style={[styles.valueSmall, styles.center]}>
                      {training ? formatDateMMDDYYYY(training.dateTo) : ''}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.tableCell, styles.w10]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {training?.hours ? String(training.hours) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.w15]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {training ? displayOrEmpty(training.typeOfLd) : ''}
                </Text>
              </View>
              <View style={[isLastCell ? styles.tableCellNoBorder : styles.tableCell, { flex: 1 }]}>
                <Text style={styles.valueSmall}>
                  {training ? displayOrEmpty(training.conductedBy) : ''}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Continuation note for Training */}
        <ContinueText align="right" marginTop={3} />
      </View>

      {/* Section VIII: Other Information */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>VIII. OTHER INFORMATION</Text>
        </View>

        {/* Other Information Table Header */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w33]}>
            <Text style={[styles.labelSmall, styles.center]}>
              31. SPECIAL SKILLS and HOBBIES
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w33]}>
            <Text style={[styles.labelSmall, styles.center]}>
              32. NON-ACADEMIC DISTINCTIONS / RECOGNITION
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (Write in full)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { flex: 1 }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              33. MEMBERSHIP IN ASSOCIATION/ORGANIZATION
            </Text>
            <Text style={[styles.labelSmall, styles.center, styles.italic]}>
              (Write in full)
            </Text>
          </View>
        </View>

        {/* Other Information Data Rows */}
        {Array.from({ length: otherInfoRows }).map((_, index) => {
          const skill = skills[index];
          const recognition = recognitions[index];
          const association = associations[index];
          const isLastCell = true;

          return (
            <View key={`other-${index}`} style={styles.fieldRow}>
              {/* Skills Column */}
              <View style={[styles.tableCell, styles.w33]}>
                <Text style={styles.valueSmall}>
                  {skill ? displayOrEmpty(skill) : ''}
                </Text>
              </View>

              {/* Recognitions Column */}
              <View style={[styles.tableCell, styles.w33]}>
                <Text style={styles.valueSmall}>
                  {recognition
                    ? `${displayOrEmpty(recognition.title)}${
                        recognition.year ? ` (${recognition.year})` : ''
                      }${
                        recognition.organization
                          ? ` - ${displayOrEmpty(recognition.organization)}`
                          : ''
                      }`
                    : ''}
                </Text>
              </View>

              {/* Associations Column */}
              <View style={[isLastCell ? styles.tableCellNoBorder : styles.tableCell, { flex: 1 }]}>
                <Text style={styles.valueSmall}>
                  {association
                    ? `${displayOrEmpty(association.name)}${
                        association.position
                          ? ` - ${displayOrEmpty(association.position)}`
                          : ''
                      }${
                        association.yearJoined
                          ? ` (${association.yearJoined})`
                          : ''
                      }`
                    : ''}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Continuation note for Other Information */}
        <ContinueText align="right" marginTop={3} />
      </View>

      {/* Page footer with signature and page number */}
      <PDSPageFooter pageNumber={3} totalPages={4} showSignature={true} />
    </Page>
  );
}

export default PDSPage3;
