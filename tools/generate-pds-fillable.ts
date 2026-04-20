/**
 * generate-pds-fillable.ts
 *
 * Node.js script that reads the PDS field map and stamps named AcroForm fields
 * onto the government PDS PDF template (CS Form No. 212, Revised 2025).
 *
 * Usage:
 *   cd C:/Personal/TUPSAFE && npx tsx tools/generate-pds-fillable.ts
 *
 * Output:
 *   apps/employee/public/templates/pds-fillable.pdf
 *   apps/admin/public/templates/pds-fillable.pdf
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFFont } from 'pdf-lib';
import * as fontkit from 'fontkit';

// ---------------------------------------------------------------------------
// Inline type definitions (mirrors pdf-template/types.ts)
// ---------------------------------------------------------------------------

interface FieldPosition {
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  alignment?: 'left' | 'center' | 'right';
  fontVariant?: 'regular' | 'bold' | 'italic' | 'boldItalic';
  transform?: 'uppercase' | 'capitalize';
}

interface CheckboxPosition {
  x: number;
  y: number;
  size: number;
  style?: 'checkmark' | 'x' | 'fill';
}

interface TableColumn {
  x: number;
  width: number;
  fontSize: number;
  alignment?: 'left' | 'center' | 'right';
  fontVariant?: 'regular' | 'bold';
  accessor: string;
  formatter?: string;
}

interface TableConfig {
  startY: number;
  rowHeight: number;
  maxRows: number;
  columns: TableColumn[];
}

interface PageFieldMap {
  pageIndex: number;
  fields: Record<string, FieldPosition>;
  checkboxes: Record<string, CheckboxPosition>;
  images: Record<string, { x: number; y: number; width: number; height: number }>;
  tables: Record<string, TableConfig>;
}

// ---------------------------------------------------------------------------
// Inline constants (mirrors pds-constants.ts)
// ---------------------------------------------------------------------------

const FONT_SIZE_NORMAL = 8;
const FONT_SIZE_SMALL = 7;
const FONT_SIZE_TABLE = 6.5;
const FONT_SIZE_CHECKBOX = 10;

const MAX_CHILDREN_ROWS = 12;
const MAX_ELIGIBILITY_ROWS = 7;
const MAX_WORK_EXPERIENCE_ROWS = 28;
const MAX_VOLUNTARY_WORK_ROWS = 7;
const MAX_TRAINING_ROWS = 21;
const MAX_SKILLS_ROWS = 7;
const MAX_RECOGNITIONS_ROWS = 7;
const MAX_ASSOCIATIONS_ROWS = 7;
const MAX_REFERENCE_ROWS = 3;

// ---------------------------------------------------------------------------
// Helper factories (mirrors pds-field-map.ts helpers)
// ---------------------------------------------------------------------------

function field(
  x: number,
  y: number,
  maxWidth: number,
  opts?: Partial<FieldPosition>,
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
// Field map — reproduced verbatim from pds-field-map.ts
// ---------------------------------------------------------------------------

const P1_VAL = 155;
const P1_RIGHT_VAL = 475;
const P2_LEFT = 30;
const P3_LEFT = 30;
const P4_LEFT = 30;
const P4_YES_CB = 435;
const P4_NO_CB = 500;
const P4_DETAIL = 455;

// ---- PAGE 1 fields ----

const page1Fields: Record<string, FieldPosition> = {
  'personalInfo.surname': field(P1_VAL, 673, 220, { transform: 'uppercase' }),
  'personalInfo.firstName': field(P1_VAL, 658, 190, { transform: 'uppercase' }),
  'personalInfo.nameExtension': field(350, 658, 60, { transform: 'uppercase', fontSize: FONT_SIZE_SMALL }),
  'personalInfo.middleName': field(P1_VAL, 645, 220, { transform: 'uppercase' }),
  'personalInfo.dateOfBirth': field(P1_VAL, 628, 140),
  'personalInfo.placeOfBirth': field(P1_VAL, 608, 210),
  'personalInfo.heightM': field(P1_VAL, 555, 100),
  'personalInfo.weightKg': field(P1_VAL, 542, 100),
  'personalInfo.bloodType': field(P1_VAL, 530, 100),
  'personalInfo.gsisNo': field(P1_VAL, 518, 150),
  'personalInfo.pagibigNo': field(P1_VAL, 505, 150),
  'personalInfo.philhealthNo': field(P1_VAL, 493, 150),
  'personalInfo.philsysNo': field(P1_VAL, 478, 150),
  'personalInfo.tinNo': field(P1_VAL, 465, 150),
  'personalInfo.agencyEmployeeNo': field(P1_VAL, 453, 150),
  'personalInfo.citizenship.details': field(P1_RIGHT_VAL, 600, 110, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.houseNumber': field(410, 565, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.street': field(510, 565, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.subdivision': field(410, 553, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.barangay': field(510, 553, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.city': field(410, 540, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.province': field(510, 540, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.residentialAddress.zipCode': field(410, 530, 60, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.houseNumber': field(410, 505, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.street': field(510, 505, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.subdivision': field(410, 493, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.barangay': field(510, 493, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.city': field(410, 480, 90, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.province': field(510, 480, 80, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.permanentAddress.zipCode': field(410, 470, 60, { fontSize: FONT_SIZE_SMALL }),
  'personalInfo.telephoneNo': field(P1_RIGHT_VAL, 460, 110),
  'personalInfo.mobileNo': field(P1_RIGHT_VAL, 448, 110),
  'personalInfo.emailAddress': field(P1_RIGHT_VAL, 435, 110, { fontSize: FONT_SIZE_SMALL }),
  'familyBackground.spouseSurname': field(P1_VAL, 428, 200, { transform: 'uppercase' }),
  'familyBackground.spouseFirstName': field(P1_VAL, 417, 150, { transform: 'uppercase' }),
  'familyBackground.spouseNameExtension': field(350, 417, 50, { transform: 'uppercase', fontSize: FONT_SIZE_SMALL }),
  'familyBackground.spouseMiddleName': field(P1_VAL, 406, 200, { transform: 'uppercase' }),
  'familyBackground.spouseOccupation': field(P1_VAL, 395, 200),
  'familyBackground.spouseEmployer': field(P1_VAL, 384, 200),
  'familyBackground.spouseBusinessAddress': field(P1_VAL, 373, 200),
  'familyBackground.spouseTelephoneNo': field(P1_VAL, 362, 200),
  'familyBackground.fatherSurname': field(P1_VAL, 348, 200, { transform: 'uppercase' }),
  'familyBackground.fatherFirstName': field(P1_VAL, 337, 150, { transform: 'uppercase' }),
  'familyBackground.fatherNameExtension': field(350, 337, 50, { transform: 'uppercase', fontSize: FONT_SIZE_SMALL }),
  'familyBackground.fatherMiddleName': field(P1_VAL, 326, 200, { transform: 'uppercase' }),
  'familyBackground.motherMaidenSurname': field(P1_VAL, 300, 200, { transform: 'uppercase' }),
  'familyBackground.motherFirstName': field(P1_VAL, 289, 200, { transform: 'uppercase' }),
  'familyBackground.motherMiddleName': field(P1_VAL, 278, 200, { transform: 'uppercase' }),
};

// ---- PAGE 1 education fields ----

const educationFields: Record<string, FieldPosition> = {
  'education.elementary.schoolName': field(165, 210, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.elementary.degreeCourse': field(300, 210, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.elementary.periodFrom': field(418, 210, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.periodTo': field(448, 210, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.highestLevelEarned': field(480, 210, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.yearGraduated': field(530, 210, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.elementary.honorsReceived': field(562, 210, 35, { fontSize: FONT_SIZE_TABLE }),
  'education.secondary.schoolName': field(165, 185, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.secondary.degreeCourse': field(300, 185, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.secondary.periodFrom': field(418, 185, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.periodTo': field(448, 185, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.highestLevelEarned': field(480, 185, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.yearGraduated': field(530, 185, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.secondary.honorsReceived': field(562, 185, 35, { fontSize: FONT_SIZE_TABLE }),
  'education.vocational.schoolName': field(165, 155, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.vocational.degreeCourse': field(300, 155, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.vocational.periodFrom': field(418, 155, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.periodTo': field(448, 155, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.highestLevelEarned': field(480, 155, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.yearGraduated': field(530, 155, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.vocational.honorsReceived': field(562, 155, 35, { fontSize: FONT_SIZE_TABLE }),
  'education.college.schoolName': field(165, 130, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.college.degreeCourse': field(300, 130, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.college.periodFrom': field(418, 130, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.periodTo': field(448, 130, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.highestLevelEarned': field(480, 130, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.yearGraduated': field(530, 130, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.college.honorsReceived': field(562, 130, 35, { fontSize: FONT_SIZE_TABLE }),
  'education.graduate.schoolName': field(165, 105, 130, { fontSize: FONT_SIZE_TABLE }),
  'education.graduate.degreeCourse': field(300, 105, 110, { fontSize: FONT_SIZE_TABLE }),
  'education.graduate.periodFrom': field(418, 105, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.periodTo': field(448, 105, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.highestLevelEarned': field(480, 105, 45, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.yearGraduated': field(530, 105, 28, { fontSize: FONT_SIZE_TABLE, alignment: 'center' }),
  'education.graduate.honorsReceived': field(562, 105, 35, { fontSize: FONT_SIZE_TABLE }),
};

// ---- PAGE 1 checkboxes ----

const page1Checkboxes: Record<string, CheckboxPosition> = {
  'checkbox:sex:male': checkbox(186, 598),
  'checkbox:sex:female': checkbox(276, 598),
  'checkbox:civilStatus:single': checkbox(186, 580),
  'checkbox:civilStatus:married': checkbox(276, 580),
  'checkbox:civilStatus:widowed': checkbox(186, 568),
  'checkbox:civilStatus:separated': checkbox(276, 568),
  'checkbox:citizenship:filipino': checkbox(432, 625),
  'checkbox:citizenship:dual': checkbox(518, 625),
  'checkbox:citizenship:byBirth': checkbox(432, 612),
  'checkbox:citizenship:byNaturalization': checkbox(518, 612),
};

// ---- PAGE 1 tables ----

const childrenTable: TableConfig = {
  startY: 425,
  rowHeight: 11,
  maxRows: MAX_CHILDREN_ROWS,
  columns: [
    { x: 378, width: 145, fontSize: FONT_SIZE_TABLE, accessor: 'fullName', alignment: 'left' },
    { x: 528, width: 58, fontSize: FONT_SIZE_TABLE, accessor: 'dateOfBirth', alignment: 'center' },
  ],
};

// ---- PAGE 2 tables ----

const eligibilityTable: TableConfig = {
  startY: 720,
  rowHeight: 14,
  maxRows: MAX_ELIGIBILITY_ROWS,
  columns: [
    { x: P2_LEFT, width: 180, fontSize: FONT_SIZE_TABLE, accessor: 'eligibilityName' },
    { x: 215, width: 45, fontSize: FONT_SIZE_TABLE, accessor: 'rating', alignment: 'center' },
    { x: 265, width: 65, fontSize: FONT_SIZE_TABLE, accessor: 'dateOfExam', alignment: 'center' },
    { x: 335, width: 100, fontSize: FONT_SIZE_TABLE, accessor: 'placeOfExam' },
    { x: 440, width: 70, fontSize: FONT_SIZE_TABLE, accessor: 'licenseNo', alignment: 'center' },
    { x: 515, width: 65, fontSize: FONT_SIZE_TABLE, accessor: 'licenseValidityDate', alignment: 'center' },
  ],
};

const workExperienceTable: TableConfig = {
  startY: 540,
  rowHeight: 14,
  maxRows: MAX_WORK_EXPERIENCE_ROWS,
  columns: [
    { x: P2_LEFT, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateFrom', alignment: 'center' },
    { x: 88, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateTo', alignment: 'center' },
    { x: 148, width: 110, fontSize: FONT_SIZE_TABLE, accessor: 'positionTitle' },
    { x: 262, width: 120, fontSize: FONT_SIZE_TABLE, accessor: 'departmentAgency' },
    { x: 387, width: 60, fontSize: FONT_SIZE_TABLE, accessor: 'monthlySalary', alignment: 'right' },
    { x: 450, width: 35, fontSize: FONT_SIZE_TABLE, accessor: 'salaryGrade', alignment: 'center' },
    { x: 490, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'statusOfAppointment', alignment: 'center' },
    { x: 550, width: 30, fontSize: FONT_SIZE_TABLE, accessor: 'isGovernment', alignment: 'center' },
  ],
};

// ---- PAGE 3 tables ----

const voluntaryWorkTable: TableConfig = {
  startY: 728,
  rowHeight: 14,
  maxRows: MAX_VOLUNTARY_WORK_ROWS,
  columns: [
    { x: P3_LEFT, width: 190, fontSize: FONT_SIZE_TABLE, accessor: 'organizationName' },
    { x: 225, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateFrom', alignment: 'center' },
    { x: 285, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateTo', alignment: 'center' },
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
    { x: 225, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateFrom', alignment: 'center' },
    { x: 285, width: 55, fontSize: FONT_SIZE_TABLE, accessor: 'dateTo', alignment: 'center' },
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

// ---- PAGE 4 fields ----

const page4Fields: Record<string, FieldPosition> = {
  'questions.Q34_related_to_authority_details': field(P4_DETAIL, 715, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q35a_admin_offense_details': field(P4_DETAIL, 680, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q35b_criminal_charged_details': field(P4_DETAIL, 648, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q36_convicted_of_crime_details': field(P4_DETAIL, 600, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q37_separated_from_service_details': field(P4_DETAIL, 565, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q38a_candidate_for_election_details': field(P4_DETAIL, 535, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q38b_resigned_to_campaign_details': field(P4_DETAIL, 508, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q39_immigrant_status_details': field(P4_DETAIL, 480, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q40a_indigenous_group_details': field(P4_DETAIL, 435, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q40b_disabled_details': field(P4_DETAIL, 410, 130, { fontSize: FONT_SIZE_SMALL }),
  'questions.Q40c_solo_parent_details': field(P4_DETAIL, 388, 130, { fontSize: FONT_SIZE_SMALL }),
  'governmentId.idType': field(155, 108, 200),
  'governmentId.idNumber': field(155, 95, 200),
  'governmentId.dateIssued': field(155, 82, 100),
  'governmentId.placeIssued': field(260, 82, 100),
};

// ---- PAGE 4 checkboxes ----

const page4Checkboxes: Record<string, CheckboxPosition> = {
  'checkbox:Q34:yes': checkbox(P4_YES_CB, 738),
  'checkbox:Q34:no': checkbox(P4_NO_CB, 738),
  'checkbox:Q35a:yes': checkbox(P4_YES_CB, 690),
  'checkbox:Q35a:no': checkbox(P4_NO_CB, 690),
  'checkbox:Q35b:yes': checkbox(P4_YES_CB, 658),
  'checkbox:Q35b:no': checkbox(P4_NO_CB, 658),
  'checkbox:Q36:yes': checkbox(P4_YES_CB, 610),
  'checkbox:Q36:no': checkbox(P4_NO_CB, 610),
  'checkbox:Q37:yes': checkbox(P4_YES_CB, 575),
  'checkbox:Q37:no': checkbox(P4_NO_CB, 575),
  'checkbox:Q38a:yes': checkbox(P4_YES_CB, 545),
  'checkbox:Q38a:no': checkbox(P4_NO_CB, 545),
  'checkbox:Q38b:yes': checkbox(P4_YES_CB, 518),
  'checkbox:Q38b:no': checkbox(P4_NO_CB, 518),
  'checkbox:Q39:yes': checkbox(P4_YES_CB, 490),
  'checkbox:Q39:no': checkbox(P4_NO_CB, 490),
  'checkbox:Q40a:yes': checkbox(P4_YES_CB, 445),
  'checkbox:Q40a:no': checkbox(P4_NO_CB, 445),
  'checkbox:Q40b:yes': checkbox(P4_YES_CB, 420),
  'checkbox:Q40b:no': checkbox(P4_NO_CB, 420),
  'checkbox:Q40c:yes': checkbox(P4_YES_CB, 398),
  'checkbox:Q40c:no': checkbox(P4_NO_CB, 398),
};

// ---- PAGE 4 tables ----

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

// ---------------------------------------------------------------------------
// Assembled page configs (same structure as PDS_TEMPLATE_CONFIG.pages)
// ---------------------------------------------------------------------------

const pageConfigs: PageFieldMap[] = [
  {
    pageIndex: 0,
    fields: { ...page1Fields, ...educationFields },
    checkboxes: page1Checkboxes,
    images: {},
    tables: { children: childrenTable },
  },
  {
    pageIndex: 1,
    fields: {},
    checkboxes: {},
    images: {},
    tables: { eligibilities: eligibilityTable, workExperiences: workExperienceTable },
  },
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
  {
    pageIndex: 3,
    fields: page4Fields,
    checkboxes: page4Checkboxes,
    images: { photo: { x: 540, y: 330, width: 55, height: 70 } },
    tables: { references: referencesTable },
  },
];

// ---------------------------------------------------------------------------
// Checkbox name converter: "checkbox:sex:male" -> "cb.sex.male"
// ---------------------------------------------------------------------------

function cbFieldName(rawKey: string): string {
  // Strip "checkbox:" prefix, replace remaining colons with dots
  return 'cb.' + rawKey.replace(/^checkbox:/, '').replace(/:/g, '.');
}

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const ROOT = path.resolve(__dirname, '..');
  const templatePath = path.join(ROOT, 'apps/employee/public/templates/pds-cs-form-212-2025.pdf');
  const fontPath = path.join(ROOT, 'apps/employee/public/fonts/liberation-serif-regular.ttf');
  const outEmployee = path.join(ROOT, 'apps/employee/public/templates/pds-fillable.pdf');
  const outAdmin = path.join(ROOT, 'apps/admin/public/templates/pds-fillable.pdf');

  // Verify source files exist
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template PDF not found: ${templatePath}`);
  }
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found: ${fontPath}`);
  }

  console.log('Loading template PDF...');
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Register fontkit and embed the font
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(fontPath);
  const font: PDFFont = await pdfDoc.embedFont(fontBytes);

  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  let textFieldCount = 0;
  let checkboxCount = 0;
  let tableCellCount = 0;

  // Process each page config
  for (const pageConfig of pageConfigs) {
    const page = pages[pageConfig.pageIndex];
    if (!page) {
      console.warn(`Page index ${pageConfig.pageIndex} does not exist in template, skipping.`);
      continue;
    }

    // --- Static text fields ---
    for (const [fieldName, pos] of Object.entries(pageConfig.fields)) {
      const tf = form.createTextField(fieldName);
      tf.addToPage(page, {
        x: pos.x,
        y: pos.y - 2,
        width: pos.maxWidth,
        height: pos.fontSize + 6,
      });
      tf.setFontSize(pos.fontSize);
      // tf.updateAppearances(font); -- skip during generation, applied at fill time
      textFieldCount++;
    }

    // --- Checkboxes ---
    for (const [rawKey, pos] of Object.entries(pageConfig.checkboxes)) {
      const name = cbFieldName(rawKey);
      const cb = form.createCheckBox(name);
      cb.addToPage(page, {
        x: pos.x,
        y: pos.y - 2,
        width: 10,
        height: 10,
      });
      checkboxCount++;
    }

    // --- Table rows ---
    for (const [tableName, tableConfig] of Object.entries(pageConfig.tables)) {
      for (let row = 0; row < tableConfig.maxRows; row++) {
        for (const col of tableConfig.columns) {
          const fieldName = `tbl.${tableName}.${row}.${col.accessor}`;
          const rowY = tableConfig.startY - row * tableConfig.rowHeight;
          const tf = form.createTextField(fieldName);
          tf.addToPage(page, {
            x: col.x,
            y: rowY - 2,
            width: col.width,
            height: tableConfig.rowHeight,
          });
          tf.setFontSize(col.fontSize);
          // tf.updateAppearances(font); -- skip during generation, applied at fill time
          tableCellCount++;
        }
      }
    }
  }

  // --- Make ALL fields transparent (no border, no background) ---
  console.log('Making all field widgets transparent...');
  for (const field of form.getFields()) {
    const widgets = field.acroField.getWidgets();
    for (const widget of widgets) {
      // Set border to zero width: /Border [0 0 0]
      widget.dict.set(PDFName.of('Border'), pdfDoc.context.obj([0, 0, 0]));

      // Remove background and border color from MK (appearance characteristics)
      const mkDict = widget.dict.lookup(PDFName.of('MK'));
      if (mkDict && typeof (mkDict as Record<string, unknown>).delete === 'function') {
        (mkDict as { delete: (key: PDFName) => void }).delete(PDFName.of('BG'));
        (mkDict as { delete: (key: PDFName) => void }).delete(PDFName.of('BC'));
      }
    }
  }

  // --- Save ---
  console.log('Saving fillable PDF...');
  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(outEmployee, pdfBytes);
  console.log(`  -> ${outEmployee}`);

  // Ensure admin templates directory exists
  const adminTemplatesDir = path.dirname(outAdmin);
  if (!fs.existsSync(adminTemplatesDir)) {
    fs.mkdirSync(adminTemplatesDir, { recursive: true });
  }
  fs.writeFileSync(outAdmin, pdfBytes);
  console.log(`  -> ${outAdmin}`);

  // --- Summary ---
  const totalFields = textFieldCount + checkboxCount + tableCellCount;
  console.log('');
  console.log('=== PDS Fillable PDF Generation Complete ===');
  console.log(`  Text fields:  ${textFieldCount}`);
  console.log(`  Checkboxes:   ${checkboxCount}`);
  console.log(`  Table cells:  ${tableCellCount}`);
  console.log(`  Total fields: ${totalFields}`);
  console.log('');
  console.log('Page breakdown:');
  for (const pc of pageConfigs) {
    const fCount = Object.keys(pc.fields).length;
    const cCount = Object.keys(pc.checkboxes).length;
    let tCount = 0;
    for (const tc of Object.values(pc.tables)) {
      tCount += tc.maxRows * tc.columns.length;
    }
    console.log(`  Page ${pc.pageIndex}: ${fCount} text, ${cCount} checkboxes, ${tCount} table cells`);
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
