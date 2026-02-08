/**
 * PDS Page 2 - Civil Service Eligibility, Work Experience
 * CS Form No. 212 (Revised 2025)
 *
 * Contains:
 * - Section IV: Civil Service Eligibility
 * - Section V: Work Experience (sorted by date - latest first)
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  formatDateMMDDYYYY,
  formatCurrency,
  displayOrEmpty,
} from './PDSStyles';
import { SectionHeader, ContinueText, PDSPageFooter } from './PDSComponents';
import type { PDSData, WorkExperience, CivilServiceEligibility } from './types';

/**
 * Convert a date value to a numeric timestamp for sorting.
 * null/undefined = present (ongoing) = Infinity so it sorts to the top.
 */
function toTimestamp(date: Date | string | null | undefined): number {
  if (date === null || date === undefined) return Infinity;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime();
}

/**
 * Sort work experiences by date (latest first).
 * Primary: dateTo descending (null = present = top).
 * Secondary: dateFrom descending.
 */
function sortWorkExperienceDesc(items: WorkExperience[]): WorkExperience[] {
  return [...items].sort((a, b) => {
    const dateToA = toTimestamp(a.dateTo);
    const dateToB = toTimestamp(b.dateTo);
    if (dateToB !== dateToA) return dateToB - dateToA;
    const dateFromA = toTimestamp(a.dateFrom);
    const dateFromB = toTimestamp(b.dateFrom);
    return dateFromB - dateFromA;
  });
}

/**
 * Sort civil service eligibilities by dateOfExam descending.
 */
function sortEligibilityDesc(items: CivilServiceEligibility[]): CivilServiceEligibility[] {
  return [...items].sort((a, b) => {
    const dateA = a.dateOfExam ? new Date(a.dateOfExam).getTime() : 0;
    const dateB = b.dateOfExam ? new Date(b.dateOfExam).getTime() : 0;
    return dateB - dateA;
  });
}

interface PDSPage2Props {
  data: PDSData;
}

export function PDSPage2({ data }: PDSPage2Props) {
  const { civilServiceEligibilities, workExperiences } = data;

  const sortedEligibilities = sortEligibilityDesc(civilServiceEligibilities);
  const sortedWorkExperiences = sortWorkExperienceDesc(workExperiences);

  // Minimum rows to display for each section
  const minEligibilityRows = 7;
  const minWorkExperienceRows = 25;

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Section IV: Civil Service Eligibility */}
      <View style={styles.borderedSection}>
        <SectionHeader number="IV" title="CIVIL SERVICE ELIGIBILITY" />

        {/* Note */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.labelSmall}>
            27. CAREER SERVICE/ RA 1080 (BOARD/ BAR) UNDER SPECIAL LAWS/ CES/
            CSEE BARANGAY ELIGIBILITY / DRIVER&apos;S LICENSE
          </Text>
        </View>

        {/* Header Row */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w25]}>
            <Text style={[styles.labelSmall, styles.center]}>
              CAREER SERVICE/ RA 1080 (BOARD/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              BAR) UNDER SPECIAL LAWS/ CES/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              CSEE BARANGAY ELIGIBILITY /
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              DRIVER&apos;S LICENSE
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w10]}>
            <Text style={[styles.labelSmall, styles.center]}>RATING</Text>
            <Text style={[styles.labelSmall, styles.center]}>(If Applicable)</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>
              DATE OF EXAMINATION/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>CONFERMENT</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w20]}>
            <Text style={[styles.labelSmall, styles.center]}>
              PLACE OF EXAMINATION/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>CONFERMENT</Text>
          </View>
          <View style={[styles.tableCellHeader, { width: '15%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>LICENSE</Text>
            <Text style={[styles.labelSmall, styles.center]}>(if applicable)</Text>
            <View style={[styles.row, { marginTop: 2 }]}>
              <View style={[styles.tableCell, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>NUMBER</Text>
              </View>
              <View style={[styles.tableCellNoBorder, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>
                  VALID UNTIL
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.tableCellHeader,
              { width: '15%', borderRightWidth: 0 },
            ]}
          >
            <Text style={[styles.labelSmall, styles.center]}>N/A</Text>
          </View>
        </View>

        {/* Eligibility Rows */}
        {Array.from({
          length: Math.max(minEligibilityRows, sortedEligibilities.length),
        }).map((_, index) => {
          const eligibility = sortedEligibilities[index];
          return (
            <View key={index} style={styles.fieldRow}>
              <View style={[styles.tableCell, styles.w25]}>
                <Text style={styles.valueSmall}>
                  {eligibility ? displayOrEmpty(eligibility.eligibilityName) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.w10]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {eligibility?.rating ? String(eligibility.rating) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.w15]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {eligibility ? formatDateMMDDYYYY(eligibility.dateOfExam) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.w20]}>
                <Text style={styles.valueSmall}>
                  {eligibility ? displayOrEmpty(eligibility.placeOfExam) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, { width: '7.5%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {eligibility ? displayOrEmpty(eligibility.licenseNo) : ''}
                </Text>
              </View>
              <View style={[styles.tableCell, { width: '7.5%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {eligibility
                    ? formatDateMMDDYYYY(eligibility.licenseValidityDate)
                    : ''}
                </Text>
              </View>
              <View style={[styles.tableCellNoBorder, { width: '15%' }]}>
                <Text style={styles.valueSmall}></Text>
              </View>
            </View>
          );
        })}

        {/* Continuation note for eligibility */}
        <ContinueText align="right" marginTop={3} />
      </View>

      {/* Section V: Work Experience */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <SectionHeader number="V" title="WORK EXPERIENCE" />

        {/* Note */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.labelSmall}>
            28. (Include private employment. Start from your recent work)
            Description of duties should be indicated in the attached Work
            Experience sheet.
          </Text>
        </View>

        {/* Header Row */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, { width: '14%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              INCLUSIVE DATES
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>(mm/dd/yyyy)</Text>
            <View style={[styles.row, { marginTop: 2 }]}>
              <View style={[styles.tableCell, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>From</Text>
              </View>
              <View style={[styles.tableCellNoBorder, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>To</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tableCellHeader, styles.w20]}>
            <Text style={[styles.labelSmall, styles.center]}>
              POSITION TITLE
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (Write in full/Do not abbreviate)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w25]}>
            <Text style={[styles.labelSmall, styles.center]}>
              DEPARTMENT / AGENCY / OFFICE / COMPANY
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (Write in full/Do not abbreviate)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w10]}>
            <Text style={[styles.labelSmall, styles.center]}>MONTHLY</Text>
            <Text style={[styles.labelSmall, styles.center]}>SALARY</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w10]}>
            <Text style={[styles.labelSmall, styles.center]}>SALARY/</Text>
            <Text style={[styles.labelSmall, styles.center]}>JOB/ PAY</Text>
            <Text style={[styles.labelSmall, styles.center]}>GRADE</Text>
            <Text style={[styles.labelSmall, styles.center]}>(if applicable)</Text>
            <Text style={[styles.labelSmall, styles.center]}>&amp; STEP</Text>
            <Text style={[styles.labelSmall, styles.center]}>(Format</Text>
            <Text style={[styles.labelSmall, styles.center]}>&quot;00-0&quot;)/</Text>
            <Text style={[styles.labelSmall, styles.center]}>INCREMENT</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w10]}>
            <Text style={[styles.labelSmall, styles.center]}>STATUS OF</Text>
            <Text style={[styles.labelSmall, styles.center]}>APPOINTMENT</Text>
          </View>
          <View
            style={[styles.tableCellHeader, { width: '11%', borderRightWidth: 0 }]}
          >
            <Text style={[styles.labelSmall, styles.center]}>GOV&apos;T</Text>
            <Text style={[styles.labelSmall, styles.center]}>SERVICE</Text>
            <Text style={[styles.labelSmall, styles.center]}>(Y/ N)</Text>
          </View>
        </View>

        {/* Work Experience Rows - SORTED BY DATE, LATEST FIRST */}
        {Array.from({
          length: Math.max(minWorkExperienceRows, sortedWorkExperiences.length),
        }).map((_, index) => {
          const work = sortedWorkExperiences[index];
          return (
            <View key={index} style={[styles.fieldRow, { minHeight: 20 }]}>
              {/* Inclusive Dates - From */}
              <View style={[styles.tableCell, { width: '7%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {work ? formatDateMMDDYYYY(work.dateFrom) : ''}
                </Text>
              </View>
              {/* Inclusive Dates - To */}
              <View style={[styles.tableCell, { width: '7%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {work
                    ? work.dateTo
                      ? formatDateMMDDYYYY(work.dateTo)
                      : 'PRESENT'
                    : ''}
                </Text>
              </View>
              {/* Position Title */}
              <View style={[styles.tableCell, styles.w20]}>
                <Text style={styles.valueSmall}>
                  {work ? displayOrEmpty(work.positionTitle) : ''}
                </Text>
              </View>
              {/* Department/Agency/Office/Company */}
              <View style={[styles.tableCell, styles.w25]}>
                <Text style={styles.valueSmall}>
                  {work ? displayOrEmpty(work.departmentAgency) : ''}
                </Text>
              </View>
              {/* Monthly Salary */}
              <View style={[styles.tableCell, styles.w10]}>
                <Text style={[styles.valueSmall, styles.right]}>
                  {work?.monthlySalary ? formatCurrency(work.monthlySalary) : ''}
                </Text>
              </View>
              {/* Salary Grade */}
              <View style={[styles.tableCell, styles.w10]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {work ? displayOrEmpty(work.salaryGrade) : ''}
                </Text>
              </View>
              {/* Status of Appointment */}
              <View style={[styles.tableCell, styles.w10]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {work ? displayOrEmpty(work.statusOfAppointment) : ''}
                </Text>
              </View>
              {/* Gov't Service */}
              <View style={[styles.tableCellNoBorder, { width: '11%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {work ? (work.isGovernment ? 'Y' : 'N') : ''}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Continuation note for work experience */}
        <ContinueText align="right" marginTop={3} />
      </View>

      {/* Page footer */}
      <PDSPageFooter pageNumber={2} totalPages={4} showSignature={true} />
    </Page>
  );
}

export default PDSPage2;
