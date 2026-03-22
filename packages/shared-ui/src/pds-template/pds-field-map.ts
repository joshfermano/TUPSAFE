/**
 * PDS field map — maps PDSData dot-paths to (x, y) positions on the
 * government PDF template.  CS Form No. 212 (Revised 2025), LETTER size.
 *
 * COORDINATE SYSTEM:
 *   pdf-lib origin is BOTTOM-LEFT.
 *   Page size = 612 x 792 pts.
 *   y = 792 means top of page; y = 0 means bottom.
 *
 * Coordinates calibrated against the actual template PDF using a 10pt red grid
 * overlay diagnostic.  Last calibration: 2026-03-22.
 */

import type { TemplateConfig, FieldPosition, CheckboxPosition, TableConfig } from '../pdf-template/types';
import {
  FONT_SIZE_NORMAL,
  FONT_SIZE_SMALL,
  FONT_SIZE_TABLE,
  FONT_SIZE_CHECKBOX,
  MAX_CHILDREN_ROWS,
  MAX_ELIGIBILITY_ROWS,
  MAX_WORK_EXPERIENCE_ROWS,
  MAX_VOLUNTARY_WORK_ROWS,
  MAX_TRAINING_ROWS,
  MAX_SKILLS_ROWS,
  MAX_RECOGNITIONS_ROWS,
  MAX_ASSOCIATIONS_ROWS,
  MAX_REFERENCE_ROWS,
} from './pds-constants';

// ---------------------------------------------------------------------------
// Helpers — shorthand factories so the map is less verbose
// ---------------------------------------------------------------------------

function field(
  x: number,
  y: number,
  maxWidth: number,
  opts?: Partial<FieldPosition>
): FieldPosition {
  return {
    x,
    y,
    maxWidth,
    fontSize: opts?.fontSize ?? FONT_SIZE_NORMAL,
    alignment: opts?.alignment ?? 'left',
    fontVariant: opts?.fontVariant ?? 'regular',
    transform: opts?.transform,
  };
}

function checkbox(x: number, y: number, size?: number): CheckboxPosition {
  return { x, y, size: size ?? FONT_SIZE_CHECKBOX, style: 'checkmark' };
}

// ---------------------------------------------------------------------------
// PAGE 1 — Layout reference (from 10pt red grid overlay, 2026-03-22)
// ---------------------------------------------------------------------------
//
// "I. PERSONAL INFORMATION" gray header bar      ~ y=690
//
// Left column label area:  x = 30 to ~155
// Left column value area:  x = ~155 to ~375
// Right column label area: x = ~375 to ~475
// Right column value area: x = ~475 to ~585
//
// Section II header "II. FAMILY BACKGROUND"       ~ y=440
// Section III header "III. EDUCATIONAL BACKGROUND" ~ y=265
// ---------------------------------------------------------------------------

// Left column value start
const P1_VAL = 155;

// Right column value start
const P1_RIGHT_VAL = 475;

// -- PAGE 2 ------------------------------------------------------------------
const P2_LEFT = 30;

// -- PAGE 3 ------------------------------------------------------------------
const P3_LEFT = 30;

// -- PAGE 4 ------------------------------------------------------------------
const P4_LEFT = 30;
const P4_YES_CB = 435;   // X for YES checkbox
const P4_NO_CB = 500;    // X for NO checkbox
const P4_DETAIL = 455;   // X for "If YES, give details" value

// ============================================================================
// PAGE 1 — Personal Information, Family Background, Education
// ============================================================================

const page1Fields: Record<string, FieldPosition> = {
  // -- ITEM 1: Surname --
  'personalInfo.surname': field(P1_VAL, 673, 220, { transform: 'uppercase' }),

  // -- ITEM 2: First Name / Name Extension / Middle Name --
  'personalInfo.firstName': field(P1_VAL, 658, 190, { transform: 'uppercase' }),
  'personalInfo.nameExtension': field(350, 658, 60, { transform: 'uppercase', fontSize: FONT_SIZE_SMALL }),
  'personalInfo.middleName': field(P1_VAL, 645, 220, { transform: 'uppercase' }),

  // -- ITEM 3: Date of Birth (mm/dd/yyyy) --
  'personalInfo.dateOfBirth': field(P1_VAL, 628, 140),

  // -- ITEM 4: Place of Birth --
  'personalInfo.placeOfBirth': field(P1_VAL, 608, 210),

  // -- ITEM 7: Height (m) --
  'personalInfo.heightM': field(P1_VAL, 555, 100),

  // -- ITEM 8: Weight (kg) --
  'personalInfo.weightKg': field(P1_VAL, 542, 100),

  // -- ITEM 9: Blood Type --
  'personalInfo.bloodType': field(P1_VAL, 530, 100),

  // -- ITEM 10: UMID ID NO. (mapped from gsisNo field) --
  'personalInfo.gsisNo': field(P1_VAL, 518, 150),

  // -- ITEM 11: PAG-IBIG ID NO. --
  'personalInfo.pagibigNo': field(P1_VAL, 505, 150),

  // -- ITEM 12: PHILHEALTH NO. --
  'personalInfo.philhealthNo': field(P1_VAL, 493, 150),

  // -- ITEM 13: PhilSys Number (PSN) --
  'personalInfo.philsysNo': field(P1_VAL, 478, 150),

  // -- ITEM 14: TIN NO. --
  'personalInfo.tinNo': field(P1_VAL, 465, 150),

  // -- ITEM 15: AGENCY EMPLOYEE NO. --
  'personalInfo.agencyEmployeeNo': field(P1_VAL, 453, 150),

  // -- RIGHT COLUMN (items 16-21) --

  // ITEM 16: Citizenship — dual citizenship country
  'personalInfo.citizenship.details': field(P1_RIGHT_VAL, 600, 110, { fontSize: FONT_SIZE_SMALL }),

  // ITEM 17: Residential Address
  // Header at y=580, sub-fields in 2-column grid
  'personalInfo.residentialAddress.houseNumber': field(410, 565, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.street': field(510, 565, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.subdivision': field(410, 553, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.barangay': field(510, 553, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.city': field(410, 540, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.province': field(510, 540, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.zipCode': field(410, 530, 60, { fontSize: FONT_SIZE_SMALL }),

  // ITEM 18: Permanent Address
  // Header at y=518, sub-fields in 2-column grid
  'personalInfo.permanentAddress.houseNumber': field(410, 505, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.street': field(510, 505, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.subdivision': field(410, 493, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.barangay': field(510, 493, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.city': field(410, 480, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.province': field(510, 480, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.zipCode': field(410, 470, 60, { fontSize: FONT_SIZE_SMALL }),

  // ITEM 19: Telephone No.
  'personalInfo.telephoneNo': field(P1_RIGHT_VAL, 460, 110),

  // ITEM 20: Mobile No.
  'personalInfo.mobileNo': field(P1_RIGHT_VAL, 448, 110),

  // ITEM 21: E-Mail Address
  'personalInfo.emailAddress': field(P1_RIGHT_VAL, 435, 110, { fontSize: FONT_SIZE_SMALL }),

  // =========================================================================
  // FAMILY BACKGROUND (Section II) — header at y=440
  // =========================================================================

  // ITEM 22: Spouse
  'familyBackground.spouseSurname': field(P1_VAL, 428, 200, { transform: 'uppercase' }),
  'familyBackground.spouseFirstName': field(P1_VAL, 417, 150, { transform: 'uppercase' }),
  'familyBackground.spouseNameExtension': field(350, 417, 50, { transform: 'uppercase', fontSize: FONT_SIZE_SMALL }),
  'familyBackground.spouseMiddleName': field(P1_VAL, 406, 200, { transform: 'uppercase' }),
  'familyBackground.spouseOccupation': field(P1_VAL, 395, 200),
  'familyBackground.spouseEmployer': field(P1_VAL, 384, 200),
  'familyBackground.spouseBusinessAddress': field(P1_VAL, 373, 200),
  'familyBackground.spouseTelephoneNo': field(P1_VAL, 362, 200),

  // ITEM 24: Father
  'familyBackground.fatherSurname': field(P1_VAL, 348, 200, { transform: 'uppercase' }),
  'familyBackground.fatherFirstName': field(P1_VAL, 337, 150, { transform: 'uppercase' }),
  'familyBackground.fatherNameExtension': field(350, 337, 50, { transform: 'uppercase', fontSize: FONT_SIZE_SMALL }),
  'familyBackground.fatherMiddleName': field(P1_VAL, 326, 200, { transform: 'uppercase' }),

  // ITEM 25: Mother's Maiden Name — header at y=310
  'familyBackground.motherMaidenSurname': field(P1_VAL, 300, 200, { transform: 'uppercase' }),
  'familyBackground.motherFirstName': field(P1_VAL, 289, 200, { transform: 'uppercase' }),
  'familyBackground.motherMiddleName': field(P1_VAL, 278, 200, { transform: 'uppercase' }),
};

const page1Checkboxes: Record<string, CheckboxPosition> = {
  // ITEM 5: Sex at Birth — y=598
  'checkbox:sex:male': checkbox(186, 598),
  'checkbox:sex:female': checkbox(276, 598),

  // ITEM 6: Civil Status
  // Row 1: Single / Married at y=580
  // Row 2: Widowed / Separated at y=568
  'checkbox:civilStatus:single': checkbox(186, 580),
  'checkbox:civilStatus:married': checkbox(276, 580),
  'checkbox:civilStatus:widowed': checkbox(186, 568),
  'checkbox:civilStatus:separated': checkbox(276, 568),

  // ITEM 16: Citizenship — y=625
  // Filipino / Dual Citizenship checkboxes
  // by birth / by naturalization at y=612
  'checkbox:citizenship:filipino': checkbox(432, 625),
  'checkbox:citizenship:dual': checkbox(518, 625),
  'checkbox:citizenship:byBirth': checkbox(432, 612),
  'checkbox:citizenship:byNaturalization': checkbox(518, 612),
};

// ITEM 23: Children table (right side of Family Background)
// Header "23. NAME of CHILDREN" at y=430
// First data row at y=425
const childrenTable: TableConfig = {
  startY: 425,
  rowHeight: 11,
  maxRows: MAX_CHILDREN_ROWS,
  columns: [
    { x: 378, width: 145, fontSize: FONT_SIZE_TABLE, accessor: 'fullName', alignment: 'left' },
    { x: 528, width: 58, fontSize: FONT_SIZE_TABLE, accessor: 'dateOfBirth', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

// ITEM 26: Education table
// "III. EDUCATIONAL BACKGROUND" header at y=265
// Column headers at y=240
// Row positions (value baselines):
//   ELEMENTARY:       y=210
//   SECONDARY:        y=185
//   VOCATIONAL:       y=155
//   COLLEGE:          y=130
//   GRADUATE STUDIES: y=105
//
// Column x positions from grid:
//   NAME OF SCHOOL:   x=165, width=130
//   DEGREE/COURSE:    x=300, width=110
//   Period From:      x=418, width=28
//   Period To:        x=448, width=28
//   HIGHEST LEVEL:    x=480, width=45
//   YEAR GRADUATED:   x=530, width=28
//   HONORS:           x=562, width=35
const educationFields: Record<string, FieldPosition> = {
  // Elementary — y=210
  'education.elementary.schoolName': field(165, 210, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.elementary.degreeCourse': field(300, 210, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.elementary.periodFrom': field(418, 210, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.periodTo': field(448, 210, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.highestLevelEarned': field(480, 210, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.yearGraduated': field(530, 210, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.honorsReceived': field(562, 210, 35, { fontSize: FONT_SIZE_TABLE }),

  // Secondary — y=185
  'education.secondary.schoolName': field(165, 185, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.secondary.degreeCourse': field(300, 185, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.secondary.periodFrom': field(418, 185, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.periodTo': field(448, 185, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.highestLevelEarned': field(480, 185, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.yearGraduated': field(530, 185, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.honorsReceived': field(562, 185, 35, { fontSize: FONT_SIZE_TABLE }),

  // Vocational / Trade Course — y=155
  'education.vocational.schoolName': field(165, 155, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.vocational.degreeCourse': field(300, 155, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.vocational.periodFrom': field(418, 155, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.periodTo': field(448, 155, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.highestLevelEarned': field(480, 155, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.yearGraduated': field(530, 155, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.honorsReceived': field(562, 155, 35, { fontSize: FONT_SIZE_TABLE }),

  // College — y=130
  'education.college.schoolName': field(165, 130, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.college.degreeCourse': field(300, 130, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.college.periodFrom': field(418, 130, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.periodTo': field(448, 130, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.highestLevelEarned': field(480, 130, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.yearGraduated': field(530, 130, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.honorsReceived': field(562, 130, 35, { fontSize: FONT_SIZE_TABLE }),

  // Graduate Studies — y=105
  'education.graduate.schoolName': field(165, 105, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.graduate.degreeCourse': field(300, 105, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.graduate.periodFrom': field(418, 105, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.periodTo': field(448, 105, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.highestLevelEarned': field(480, 105, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.yearGraduated': field(530, 105, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.honorsReceived': field(562, 105, 35, { fontSize: FONT_SIZE_TABLE }),
};

// ============================================================================
// PAGE 2 — Civil Service Eligibility & Work Experience
// ============================================================================
//
// "IV. CIVIL SERVICE ELIGIBILITY" header at y=770
// Column header row at y=745
// First data row at y=720, row height=14, max 7 rows
//
// "V. WORK EXPERIENCE" header at y=598
// Column header rows at y=575, sub-headers at y=560
// First data row at y=540, row height=14, max 25 rows

const eligibilityTable: TableConfig = {
  startY: 720,
  rowHeight: 14,
  maxRows: MAX_ELIGIBILITY_ROWS,
  columns: [
    { x: P2_LEFT, width: 180, fontSize: FONT_SIZE_TABLE, accessor: 'eligibilityName' },
    { x: 215, width: 45, fontSize: FONT_SIZE_TABLE, accessor: 'rating', alignment: 'center' },
    { x: 265, width: 65, fontSize: FONT_SIZE_TABLE, accessor: 'dateOfExam', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 335, width: 100, fontSize: FONT_SIZE_TABLE, accessor: 'placeOfExam' },
    { x: 440, width: 70, fontSize: FONT_SIZE_TABLE, accessor: 'licenseNo', alignment: 'center' },
    { x: 515, width: 65, fontSize: FONT_SIZE_TABLE, accessor: 'licenseValidityDate', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

const workExperienceTable: TableConfig = {
  startY: 540,
  rowHeight: 14,
  maxRows: MAX_WORK_EXPERIENCE_ROWS,
  columns: [
    { x: P2_LEFT, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateFrom', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 88, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateTo', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 148, width: 110, fontSize: FONT_SIZE_TABLE, accessor: 'positionTitle' },
    { x: 262, width: 120, fontSize: FONT_SIZE_TABLE, accessor: 'departmentAgency' },
    { x: 387, width: 60, fontSize: FONT_SIZE_TABLE, accessor: 'monthlySalary', alignment: 'right', formatter: 'currency' },
    { x: 450, width: 35, fontSize: FONT_SIZE_TABLE, accessor: 'salaryGrade', alignment: 'center' },
    { x: 490, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'statusOfAppointment', alignment: 'center' },
    { x: 550, width: 30, fontSize: FONT_SIZE_TABLE, accessor: 'isGovernment', alignment: 'center', formatter: 'boolean_yn' },
  ],
};

// ============================================================================
// PAGE 3 — Voluntary Work, Training, Other Information
// ============================================================================
//
// "VI. VOLUNTARY WORK" header at y=770
// Column headers at y=748
// First data row at y=728, row height=14, max 7 rows
//
// "VII. LEARNING AND DEVELOPMENT" header at y=595
// Column headers at y=575
// First data row at y=555, row height=14, max 18 rows
//
// "VIII. OTHER INFORMATION" header at y=285
// First data row at y=265, row height=14, max 7 rows per sub-table

const voluntaryWorkTable: TableConfig = {
  startY: 728,
  rowHeight: 14,
  maxRows: MAX_VOLUNTARY_WORK_ROWS,
  columns: [
    { x: P3_LEFT, width: 190, fontSize: FONT_SIZE_TABLE, accessor: 'organizationName' },
    { x: 225, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateFrom', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 285, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateTo', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 345, width: 40, fontSize: FONT_SIZE_TABLE, accessor: 'numberOfHours', alignment: 'center' },
    { x: 390, width: 190, fontSize: FONT_SIZE_TABLE, accessor: 'positionNature' },
  ],
};

const trainingTable: TableConfig = {
  startY: 555,
  rowHeight: 14,
  maxRows: MAX_TRAINING_ROWS,
  columns: [
    { x: P3_LEFT, width: 190, fontSize: FONT_SIZE_TABLE, accessor: 'title' },
    { x: 225, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateFrom', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 285, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateTo', alignment: 'center', formatter: 'dateMMDDYYYY' },
    { x: 345, width: 40, fontSize: FONT_SIZE_TABLE, accessor: 'hours', alignment: 'center' },
    { x: 390, width: 80, fontSize: FONT_SIZE_TABLE, accessor: 'typeOfLd', alignment: 'center' },
    { x: 475, width: 105, fontSize: FONT_SIZE_TABLE, accessor: 'conductedBy' },
  ],
};

const skillsTable: TableConfig = {
  startY: 265,
  rowHeight: 14,
  maxRows: MAX_SKILLS_ROWS,
  columns: [
    { x: P3_LEFT, width: 190, fontSize: FONT_SIZE_TABLE, accessor: 'value' },
  ],
};

const recognitionsTable: TableConfig = {
  startY: 265,
  rowHeight: 14,
  maxRows: MAX_RECOGNITIONS_ROWS,
  columns: [
    { x: 225, width: 175, fontSize: FONT_SIZE_TABLE, accessor: 'display' },
  ],
};

const associationsTable: TableConfig = {
  startY: 265,
  rowHeight: 14,
  maxRows: MAX_ASSOCIATIONS_ROWS,
  columns: [
    { x: 405, width: 175, fontSize: FONT_SIZE_TABLE, accessor: 'display' },
  ],
};

// ============================================================================
// PAGE 4 — Questions 34-40, References, Government ID, Declaration
// ============================================================================
//
// Question blocks (items 34-40):
//   YES checkbox X = 435, NO checkbox X = 500
//   Detail text X = 455, width = 130
//
// Q34 text at y=752
//   a. third degree checkboxes at y=738
//   b. fourth degree checkboxes at y=726
//   Detail at y=715
//
// Q35a checkboxes at y=690, detail at y=680
// Q35b checkboxes at y=658, detail at y=648, date filed at y=638, status at y=628
// Q36 checkboxes at y=610, detail at y=600
// Q37 checkboxes at y=575, detail at y=565
// Q38a checkboxes at y=545, detail at y=535
// Q38b checkboxes at y=518, detail at y=508
// Q39 checkboxes at y=490, detail at y=480
// Q40a checkboxes at y=445, detail at y=435
// Q40b checkboxes at y=420, detail at y=410
// Q40c checkboxes at y=398, detail at y=388
//
// "41. REFERENCES" header at y=355
// Column headers at y=340
// First data row at y=325, row height=18, max 3 rows
//
// Photo box: x=540, y=330, width=55, height=70
//
// "Government Issued ID" header at y=120
// ID Type at y=108, ID No. at y=95, Date/Place Issue at y=82

const page4Fields: Record<string, FieldPosition> = {
  // Q34 details
  'questions.Q34_related_to_authority_details': field(P4_DETAIL, 715, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q35a details
  'questions.Q35a_admin_offense_details': field(P4_DETAIL, 680, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q35b details (may have date filed + status below)
  'questions.Q35b_criminal_charged_details': field(P4_DETAIL, 648, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q36 details
  'questions.Q36_convicted_of_crime_details': field(P4_DETAIL, 600, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q37 details
  'questions.Q37_separated_from_service_details': field(P4_DETAIL, 565, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q38a details
  'questions.Q38a_candidate_for_election_details': field(P4_DETAIL, 535, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q38b details
  'questions.Q38b_resigned_to_campaign_details': field(P4_DETAIL, 508, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q39 details
  'questions.Q39_immigrant_status_details': field(P4_DETAIL, 480, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q40a details
  'questions.Q40a_indigenous_group_details': field(P4_DETAIL, 435, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q40b details
  'questions.Q40b_disabled_details': field(P4_DETAIL, 410, 130, { fontSize: FONT_SIZE_SMALL }),

  // Q40c details
  'questions.Q40c_solo_parent_details': field(P4_DETAIL, 388, 130, { fontSize: FONT_SIZE_SMALL }),

  // Government ID (Item 42) — bottom section
  'governmentId.idType': field(155, 108, 200),
  'governmentId.idNumber': field(155, 95, 200),
  'governmentId.dateIssued': field(155, 82, 100),
  'governmentId.placeIssued': field(260, 82, 100),
};

const page4Checkboxes: Record<string, CheckboxPosition> = {
  // Q34 — the form has sub-parts a (third degree, y=738) and b (fourth degree, y=726).
  // The filler resolves a single Q34 boolean, so we place YES/NO on the "a" row.
  'checkbox:Q34:yes': checkbox(P4_YES_CB, 738),
  'checkbox:Q34:no': checkbox(P4_NO_CB, 738),

  // Q35a at y=690
  'checkbox:Q35a:yes': checkbox(P4_YES_CB, 690),
  'checkbox:Q35a:no': checkbox(P4_NO_CB, 690),

  // Q35b at y=658
  'checkbox:Q35b:yes': checkbox(P4_YES_CB, 658),
  'checkbox:Q35b:no': checkbox(P4_NO_CB, 658),

  // Q36 at y=610
  'checkbox:Q36:yes': checkbox(P4_YES_CB, 610),
  'checkbox:Q36:no': checkbox(P4_NO_CB, 610),

  // Q37 at y=575
  'checkbox:Q37:yes': checkbox(P4_YES_CB, 575),
  'checkbox:Q37:no': checkbox(P4_NO_CB, 575),

  // Q38a at y=545
  'checkbox:Q38a:yes': checkbox(P4_YES_CB, 545),
  'checkbox:Q38a:no': checkbox(P4_NO_CB, 545),

  // Q38b at y=518
  'checkbox:Q38b:yes': checkbox(P4_YES_CB, 518),
  'checkbox:Q38b:no': checkbox(P4_NO_CB, 518),

  // Q39 at y=490
  'checkbox:Q39:yes': checkbox(P4_YES_CB, 490),
  'checkbox:Q39:no': checkbox(P4_NO_CB, 490),

  // Q40a at y=445
  'checkbox:Q40a:yes': checkbox(P4_YES_CB, 445),
  'checkbox:Q40a:no': checkbox(P4_NO_CB, 445),

  // Q40b at y=420
  'checkbox:Q40b:yes': checkbox(P4_YES_CB, 420),
  'checkbox:Q40b:no': checkbox(P4_NO_CB, 420),

  // Q40c at y=398
  'checkbox:Q40c:yes': checkbox(P4_YES_CB, 398),
  'checkbox:Q40c:no': checkbox(P4_NO_CB, 398),
};

const referencesTable: TableConfig = {
  startY: 325,
  rowHeight: 18,
  maxRows: MAX_REFERENCE_ROWS,
  columns: [
    { x: P4_LEFT, width: 230, fontSize: FONT_SIZE_TABLE, accessor: 'name' },
    { x: 265, width: 200, fontSize: FONT_SIZE_TABLE, accessor: 'address' },
    { x: 470, width: 110, fontSize: FONT_SIZE_TABLE, accessor: 'telephoneNo' },
  ],
};

// ============================================================================
// Full template config
// ============================================================================

export const PDS_TEMPLATE_CONFIG: TemplateConfig = {
  templatePath: 'templates/pds-cs-form-212-2025.pdf',
  pages: [
    // ---- PAGE 1 (index 0) ----
    {
      pageIndex: 0,
      fields: {
        ...page1Fields,
        ...educationFields,
      },
      checkboxes: page1Checkboxes,
      images: {},
      tables: {
        children: childrenTable,
      },
    },
    // ---- PAGE 2 (index 1) ----
    {
      pageIndex: 1,
      fields: {},
      checkboxes: {},
      images: {},
      tables: {
        eligibilities: eligibilityTable,
        workExperiences: workExperienceTable,
      },
    },
    // ---- PAGE 3 (index 2) ----
    {
      pageIndex: 2,
      fields: {},
      checkboxes: {},
      images: {},
      tables: {
        voluntaryWorks: voluntaryWorkTable,
        trainings: trainingTable,
        skills: skillsTable,
        recognitions: recognitionsTable,
        associations: associationsTable,
      },
    },
    // ---- PAGE 4 (index 3) ----
    {
      pageIndex: 3,
      fields: page4Fields,
      checkboxes: page4Checkboxes,
      images: {
        photo: { x: 540, y: 330, width: 55, height: 70 },
      },
      tables: {
        references: referencesTable,
      },
    },
  ],
};
