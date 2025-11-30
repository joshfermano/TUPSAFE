/**
 * PDS Page 2 - Educational Background, Civil Service Eligibility, Work Experience
 * CS Form No. 212 (Revised 2017)
 *
 * Contains:
 * - Section III: Educational Background
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
import type { PDSData, Education } from './types';

interface PDSPage2Props {
  data: PDSData;
}

// Helper to get year from date
function getYear(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.getFullYear().toString();
}

// Education row component
function EducationRow({
  level,
  education,
}: {
  level: string;
  education?: Education | null;
}) {
  return (
    <View style={styles.fieldRow}>
      {/* Level */}
      <View style={[styles.tableCell, styles.w15]}>
        <Text style={styles.labelSmall}>{level}</Text>
      </View>
      {/* Name of School */}
      <View style={[styles.tableCell, styles.w20]}>
        <Text style={styles.valueSmall}>
          {education ? displayOrEmpty(education.schoolName) : ''}
        </Text>
      </View>
      {/* Basic Education/Degree/Course */}
      <View style={[styles.tableCell, styles.w15]}>
        <Text style={styles.valueSmall}>
          {education ? displayOrEmpty(education.degreeCourse) : ''}
        </Text>
      </View>
      {/* Period of Attendance - From */}
      <View style={[styles.tableCell, { width: '7%' }]}>
        <Text style={[styles.valueSmall, styles.center]}>
          {education ? getYear(education.periodFrom) : ''}
        </Text>
      </View>
      {/* Period of Attendance - To */}
      <View style={[styles.tableCell, { width: '7%' }]}>
        <Text style={[styles.valueSmall, styles.center]}>
          {education ? getYear(education.periodTo) : ''}
        </Text>
      </View>
      {/* Highest Level/Units Earned */}
      <View style={[styles.tableCell, styles.w15]}>
        <Text style={styles.valueSmall}>
          {education ? displayOrEmpty(education.highestLevelEarned) : ''}
        </Text>
      </View>
      {/* Year Graduated */}
      <View style={[styles.tableCell, { width: '8%' }]}>
        <Text style={[styles.valueSmall, styles.center]}>
          {education?.yearGraduated ? String(education.yearGraduated) : ''}
        </Text>
      </View>
      {/* Scholarship/Academic Honors */}
      <View style={[styles.tableCellNoBorder, { width: '13%' }]}>
        <Text style={styles.valueSmall}>
          {education ? displayOrEmpty(education.honorsReceived) : ''}
        </Text>
      </View>
    </View>
  );
}

export function PDSPage2({ data }: PDSPage2Props) {
  const { education, civilServiceEligibilities, workExperiences } = data;

  // Work experiences should already be sorted, display in order received
  // (latest date on top - sorted by dateTo DESC, then dateFrom DESC)
  const sortedWorkExperiences = workExperiences;

  // Minimum rows to display for each section
  const minEligibilityRows = 4;
  const minWorkExperienceRows = 7;

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Section III: Educational Background */}
      <View style={styles.borderedSection}>
        <View style={styles.sectionHeader}>
          <Text>26. III. EDUCATIONAL BACKGROUND</Text>
        </View>

        {/* Header Row */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>LEVEL</Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w20]}>
            <Text style={[styles.labelSmall, styles.center]}>
              NAME OF SCHOOL
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (Write in full)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>
              BASIC EDUCATION/DEGREE/COURSE
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (Write in full)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { width: '14%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              PERIOD OF ATTENDANCE
            </Text>
            <View style={[styles.row, { marginTop: 2 }]}>
              <View style={[styles.tableCell, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>From</Text>
              </View>
              <View style={[styles.tableCellNoBorder, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>To</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>
              HIGHEST LEVEL/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>UNITS EARNED</Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (if not graduated)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { width: '8%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>YEAR</Text>
            <Text style={[styles.labelSmall, styles.center]}>GRADUATED</Text>
          </View>
          <View
            style={[
              styles.tableCellHeader,
              { width: '13%', borderRightWidth: 0 },
            ]}
          >
            <Text style={[styles.labelSmall, styles.center]}>
              SCHOLARSHIP/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              ACADEMIC HONORS
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>RECEIVED</Text>
          </View>
        </View>

        {/* Education Rows */}
        <EducationRow level="ELEMENTARY" education={education.elementary} />
        <EducationRow level="SECONDARY" education={education.secondary} />
        <EducationRow
          level="VOCATIONAL/TRADE COURSE"
          education={education.vocational}
        />
        <EducationRow level="COLLEGE" education={education.college} />
        <EducationRow
          level="GRADUATE STUDIES"
          education={education.graduate}
        />
      </View>

      {/* Section IV: Civil Service Eligibility */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>
            27. IV. CIVIL SERVICE ELIGIBILITY
          </Text>
        </View>

        {/* Note */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.labelSmall}>
            (Career Service/ RA 1080 (BOARD/BAR) Under Special Laws/ CES/ CSEE
            Barangay Eligibility / Driver&apos;s License under RA 10054)
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
              DRIVER&apos;S LICENSE UNDER RA 10054
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
          <View style={[styles.tableCellHeader, styles.w15]}>
            <Text style={[styles.labelSmall, styles.center]}>LICENSE</Text>
            <Text style={[styles.labelSmall, styles.center]}>(if applicable)</Text>
            <View style={[styles.row, { marginTop: 2 }]}>
              <View style={[styles.tableCell, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>NUMBER</Text>
              </View>
              <View style={[styles.tableCellNoBorder, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>
                  Date of Validity
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Eligibility Rows */}
        {Array.from({
          length: Math.max(minEligibilityRows, civilServiceEligibilities.length),
        }).map((_, index) => {
          const eligibility = civilServiceEligibilities[index];
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
              <View style={[styles.tableCellNoBorder, { width: '7.5%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {eligibility
                    ? formatDateMMDDYYYY(eligibility.licenseValidityDate)
                    : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Section V: Work Experience */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>
            28. V. WORK EXPERIENCE
          </Text>
        </View>

        {/* Note */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.labelSmall}>
            (Include private employment. Start from your recent work) Description
            of duties should be indicated in the attached Work Experience Sheet.
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
            <View key={index} style={styles.fieldRow}>
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
      </View>

      {/* Continuation note */}
      <View style={styles.marginTop5}>
        <Text style={styles.noteText}>
          (Continue on separate sheet if necessary)
        </Text>
      </View>

      {/* Page footer */}
      <View style={styles.pageNumber}>
        <Text style={styles.noteText}>
          CS FORM 212 (Revised 2025), Page 2 of 4
        </Text>
      </View>
    </Page>
  );
}

export default PDSPage2;
