/**
 * PDS AcroForm filler — fills the government CS Form No. 212 (Revised 2025)
 * using named AcroForm fields instead of coordinate-based stamping.
 *
 * Loads the fillable template (`pds-fillable.pdf`), fills fields by name via
 * FormFiller.setText / setCheckbox / fillTable, flattens to static content,
 * appends any overflow continuation pages, and returns the final PDF bytes.
 *
 * Usage:
 *   const pdfBytes = await fillPDS(window.location.origin, pdsData);
 *   // pdfBytes is a Uint8Array suitable for creating a Blob/download link.
 */

import type { PDSData, Child, WorkExperience, CivilServiceEligibility, VoluntaryWork, Training } from './types';
import { FormFiller } from '../pdf-template/FormFiller';
import { loadAllFonts } from '../pdf-template/FontManager';
import { displayOrEmpty, formatDateMMDDYYYY, formatCurrency } from '../pdf-template/utils';
import { addOverflowPages } from './pds-overflow';
import type { OverflowSection } from './pds-overflow';
import {
  MAX_CHILDREN_ROWS,
  MAX_ELIGIBILITY_ROWS,
  MAX_WORK_EXPERIENCE_ROWS,
  MAX_VOLUNTARY_WORK_ROWS,
  MAX_TRAINING_ROWS,
  MAX_SKILLS_ROWS,
  MAX_RECOGNITIONS_ROWS,
  MAX_ASSOCIATIONS_ROWS,
} from './pds-constants';

// ---------------------------------------------------------------------------
// Date / sort helpers
// ---------------------------------------------------------------------------

function toTimestamp(date: Date | string | null | undefined): number {
  if (date === null || date === undefined) return Infinity;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime();
}

function sortWorkExperienceDesc(items: WorkExperience[]): WorkExperience[] {
  return [...items].sort((a, b) => {
    const dateToA = toTimestamp(a.dateTo);
    const dateToB = toTimestamp(b.dateTo);
    if (dateToB !== dateToA) return dateToB - dateToA;
    return toTimestamp(b.dateFrom) - toTimestamp(a.dateFrom);
  });
}

function sortEligibilityDesc(items: CivilServiceEligibility[]): CivilServiceEligibility[] {
  return [...items].sort((a, b) => {
    const dateA = a.dateOfExam ? new Date(String(a.dateOfExam)).getTime() : 0;
    const dateB = b.dateOfExam ? new Date(String(b.dateOfExam)).getTime() : 0;
    return dateB - dateA;
  });
}

function sortByDateDesc<T extends { dateFrom: Date | string; dateTo?: Date | string | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateToA = toTimestamp(a.dateTo);
    const dateToB = toTimestamp(b.dateTo);
    if (dateToB !== dateToA) return dateToB - dateToA;
    return toTimestamp(b.dateFrom) - toTimestamp(a.dateFrom);
  });
}

// ---------------------------------------------------------------------------
// Question mapping (2025 format with backward-compat fallbacks)
// ---------------------------------------------------------------------------

interface QuestionResolved {
  yes: boolean;
  details: string;
}

function resolveQuestion(
  data: PDSData,
  primaryBoolKey: string,
  primaryDetailKey: string,
  fallbackBoolKey?: string,
  fallbackDetailKey?: string
): QuestionResolved {
  const q = data.questions;
  const getVal = (obj: Record<string, unknown>, key: string): unknown => obj[key];

  const primary = getVal(q as unknown as Record<string, unknown>, primaryBoolKey) as boolean | undefined;
  const fallback = fallbackBoolKey
    ? (getVal(q as unknown as Record<string, unknown>, fallbackBoolKey) as boolean | undefined)
    : undefined;
  const yes = primary ?? fallback ?? false;

  const primaryDetail = getVal(q as unknown as Record<string, unknown>, primaryDetailKey) as string | undefined;
  const fallbackDetail = fallbackDetailKey
    ? (getVal(q as unknown as Record<string, unknown>, fallbackDetailKey) as string | undefined)
    : undefined;
  const details = displayOrEmpty(primaryDetail ?? fallbackDetail ?? '');

  return { yes, details };
}

// ---------------------------------------------------------------------------
// Checkbox evaluation
// ---------------------------------------------------------------------------

function evaluateCheckbox(key: string, data: PDSData): boolean {
  const pi = data.personalInfo;

  // Personal info checkboxes
  if (key === 'checkbox:sex:male') return pi.sex === 'male';
  if (key === 'checkbox:sex:female') return pi.sex === 'female';
  if (key === 'checkbox:civilStatus:single') return pi.civilStatus === 'single';
  if (key === 'checkbox:civilStatus:married') return pi.civilStatus === 'married';
  if (key === 'checkbox:civilStatus:widowed') return pi.civilStatus === 'widowed';
  if (key === 'checkbox:civilStatus:separated') return pi.civilStatus === 'separated';
  if (key === 'checkbox:citizenship:filipino') return pi.citizenship.type === 'Filipino';
  if (key === 'checkbox:citizenship:dual') return pi.citizenship.type === 'Dual';
  if (key === 'checkbox:citizenship:byBirth')
    return pi.citizenship.type === 'Dual' && pi.citizenship.acquisitionMethod === 'byBirth';
  if (key === 'checkbox:citizenship:byNaturalization')
    return pi.citizenship.type === 'Dual' && pi.citizenship.acquisitionMethod === 'byNaturalization';

  // Question checkboxes (yes/no pairs)
  const qMap: Record<string, QuestionResolved> = {
    'checkbox:Q34': resolveQuestion(data, 'Q34_related_to_authority', 'Q34_related_to_authority_details', 'Q34_criminal_charged', 'Q34_criminal_charged_details'),
    'checkbox:Q35a': resolveQuestion(data, 'Q35a_admin_offense', 'Q35a_admin_offense_details', 'Q35_criminal_convicted', 'Q35_criminal_convicted_details'),
    'checkbox:Q35b': resolveQuestion(data, 'Q35b_criminal_charged', 'Q35b_criminal_charged_details'),
    'checkbox:Q36': resolveQuestion(data, 'Q36_convicted_of_crime', 'Q36_convicted_of_crime_details'),
    'checkbox:Q37': resolveQuestion(data, 'Q37_separated_from_service', 'Q37_separated_from_service_details', 'Q36_separated_from_service', 'Q36_separated_from_service_details'),
    'checkbox:Q38a': resolveQuestion(data, 'Q38a_candidate_for_election', 'Q38a_candidate_for_election_details', 'Q37_candidate_for_election', 'Q37_candidate_for_election_details'),
    'checkbox:Q38b': resolveQuestion(data, 'Q38b_resigned_to_campaign', 'Q38b_resigned_to_campaign_details', 'Q38_resigned_from_government', 'Q38_resigned_from_government_details'),
    'checkbox:Q39': resolveQuestion(data, 'Q39_immigrant_status', 'Q39_immigrant_status_details', 'Q39_immigrant_or_acquired_residence', 'Q39_immigrant_or_acquired_residence_details'),
    'checkbox:Q40a': resolveQuestion(data, 'Q40a_indigenous_group', 'Q40a_indigenous_group_details', 'Q40_indigenous_group', 'Q40_indigenous_group_details'),
    'checkbox:Q40b': resolveQuestion(data, 'Q40b_disabled', 'Q40b_disabled_details', 'Q41_disabled', 'Q41_disabled_details'),
    'checkbox:Q40c': resolveQuestion(data, 'Q40c_solo_parent', 'Q40c_solo_parent_details', 'Q42_solo_parent', 'Q42_solo_parent_details'),
  };

  // Parse "checkbox:Q34:yes" -> prefix "checkbox:Q34", suffix "yes"
  const lastColon = key.lastIndexOf(':');
  const prefix = key.substring(0, lastColon);
  const suffix = key.substring(lastColon + 1);
  const resolved = qMap[prefix];
  if (resolved) {
    return suffix === 'yes' ? resolved.yes : !resolved.yes;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Prepare question detail fields (resolve fallbacks before filling)
// ---------------------------------------------------------------------------

function resolveQuestionDetailFields(data: PDSData): Record<string, string> {
  const result: Record<string, string> = {};

  const pairs: Array<{
    fieldKey: string;
    primaryBool: string;
    primaryDetail: string;
    fallbackBool?: string;
    fallbackDetail?: string;
  }> = [
    { fieldKey: 'questions.Q34_related_to_authority_details', primaryBool: 'Q34_related_to_authority', primaryDetail: 'Q34_related_to_authority_details', fallbackBool: 'Q34_criminal_charged', fallbackDetail: 'Q34_criminal_charged_details' },
    { fieldKey: 'questions.Q35a_admin_offense_details', primaryBool: 'Q35a_admin_offense', primaryDetail: 'Q35a_admin_offense_details', fallbackBool: 'Q35_criminal_convicted', fallbackDetail: 'Q35_criminal_convicted_details' },
    { fieldKey: 'questions.Q35b_criminal_charged_details', primaryBool: 'Q35b_criminal_charged', primaryDetail: 'Q35b_criminal_charged_details' },
    { fieldKey: 'questions.Q36_convicted_of_crime_details', primaryBool: 'Q36_convicted_of_crime', primaryDetail: 'Q36_convicted_of_crime_details' },
    { fieldKey: 'questions.Q37_separated_from_service_details', primaryBool: 'Q37_separated_from_service', primaryDetail: 'Q37_separated_from_service_details', fallbackBool: 'Q36_separated_from_service', fallbackDetail: 'Q36_separated_from_service_details' },
    { fieldKey: 'questions.Q38a_candidate_for_election_details', primaryBool: 'Q38a_candidate_for_election', primaryDetail: 'Q38a_candidate_for_election_details', fallbackBool: 'Q37_candidate_for_election', fallbackDetail: 'Q37_candidate_for_election_details' },
    { fieldKey: 'questions.Q38b_resigned_to_campaign_details', primaryBool: 'Q38b_resigned_to_campaign', primaryDetail: 'Q38b_resigned_to_campaign_details', fallbackBool: 'Q38_resigned_from_government', fallbackDetail: 'Q38_resigned_from_government_details' },
    { fieldKey: 'questions.Q39_immigrant_status_details', primaryBool: 'Q39_immigrant_status', primaryDetail: 'Q39_immigrant_status_details', fallbackBool: 'Q39_immigrant_or_acquired_residence', fallbackDetail: 'Q39_immigrant_or_acquired_residence_details' },
    { fieldKey: 'questions.Q40a_indigenous_group_details', primaryBool: 'Q40a_indigenous_group', primaryDetail: 'Q40a_indigenous_group_details', fallbackBool: 'Q40_indigenous_group', fallbackDetail: 'Q40_indigenous_group_details' },
    { fieldKey: 'questions.Q40b_disabled_details', primaryBool: 'Q40b_disabled', primaryDetail: 'Q40b_disabled_details', fallbackBool: 'Q41_disabled', fallbackDetail: 'Q41_disabled_details' },
    { fieldKey: 'questions.Q40c_solo_parent_details', primaryBool: 'Q40c_solo_parent', primaryDetail: 'Q40c_solo_parent_details', fallbackBool: 'Q42_solo_parent', fallbackDetail: 'Q42_solo_parent_details' },
  ];

  for (const p of pairs) {
    const resolved = resolveQuestion(data, p.primaryBool, p.primaryDetail, p.fallbackBool, p.fallbackDetail);
    result[p.fieldKey] = resolved.details;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Data prep helpers for tables
// ---------------------------------------------------------------------------

interface TableRowData {
  [key: string]: unknown;
}

function childrenToRows(children: Child[]): TableRowData[] {
  return children.map((c) => ({
    fullName: c.fullName,
    dateOfBirth: c.dateOfBirth,
  }));
}

function workExperienceToRows(items: WorkExperience[]): TableRowData[] {
  return sortWorkExperienceDesc(items).map((w) => ({
    dateFrom: w.dateFrom,
    dateTo: w.dateTo ?? 'PRESENT',
    positionTitle: w.positionTitle,
    departmentAgency: w.departmentAgency,
    monthlySalary: w.monthlySalary,
    salaryGrade: w.salaryGrade,
    statusOfAppointment: w.statusOfAppointment,
    isGovernment: w.isGovernment,
  }));
}

function eligibilityToRows(items: CivilServiceEligibility[]): TableRowData[] {
  return sortEligibilityDesc(items).map((e) => ({
    eligibilityName: e.eligibilityName,
    rating: e.rating != null ? String(e.rating) : '',
    dateOfExam: e.dateOfExam,
    placeOfExam: e.placeOfExam,
    licenseNo: e.licenseNo,
    licenseValidityDate: e.licenseValidityDate,
  }));
}

function voluntaryWorkToRows(items: VoluntaryWork[]): TableRowData[] {
  return sortByDateDesc(items).map((v) => ({
    organizationName: `${displayOrEmpty(v.organizationName)}${v.organizationAddress ? `, ${displayOrEmpty(v.organizationAddress)}` : ''}`,
    dateFrom: v.dateFrom,
    dateTo: v.dateTo,
    numberOfHours: v.numberOfHours != null ? String(v.numberOfHours) : '',
    positionNature: v.positionNature,
  }));
}

function trainingToRows(items: Training[]): TableRowData[] {
  return sortByDateDesc(items).map((t) => ({
    title: t.title,
    dateFrom: t.dateFrom,
    dateTo: t.dateTo,
    hours: t.hours != null ? String(t.hours) : '',
    typeOfLd: t.typeOfLd,
    conductedBy: t.conductedBy,
  }));
}

function skillsToRows(skills: string[]): TableRowData[] {
  return skills.map((s) => ({ value: s }));
}

function recognitionsToRows(items: PDSData['recognitions']): TableRowData[] {
  return items.map((r) => ({
    display: `${displayOrEmpty(r.title)}${r.year ? ` (${r.year})` : ''}${r.organization ? ` - ${displayOrEmpty(r.organization)}` : ''}`,
  }));
}

function associationsToRows(items: PDSData['associations']): TableRowData[] {
  return items.map((a) => ({
    display: `${displayOrEmpty(a.name)}${a.position ? ` - ${displayOrEmpty(a.position)}` : ''}${a.yearJoined ? ` (${a.yearJoined})` : ''}`,
  }));
}

function referencesToRows(items: PDSData['references']): TableRowData[] {
  return items.map((r) => ({
    name: r.name,
    address: r.address,
    telephoneNo: r.telephoneNo,
  }));
}

// ---------------------------------------------------------------------------
// Numeric formatting helpers
// ---------------------------------------------------------------------------

function formatHeight(value: number | null | undefined): string {
  if (value == null) return '';
  return parseFloat(String(value)).toFixed(2);
}

function formatWeight(value: number | null | undefined): string {
  if (value == null) return '';
  return parseFloat(String(value)).toFixed(2);
}

// ---------------------------------------------------------------------------
// Education period formatting
// ---------------------------------------------------------------------------

function formatEducationPeriod(value: Date | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string' && !/^\d{4}-/.test(value)) {
    return value; // Already a plain string like "2010"
  }
  return formatDateMMDDYYYY(value);
}

// ---------------------------------------------------------------------------
// AcroForm filling helpers
// ---------------------------------------------------------------------------

function fillPersonalInfo(filler: FormFiller, data: PDSData): void {
  const pi = data.personalInfo;

  filler.setText('personalInfo.surname', displayOrEmpty(pi.surname));
  filler.setText('personalInfo.firstName', displayOrEmpty(pi.firstName));
  filler.setText('personalInfo.middleName', displayOrEmpty(pi.middleName));
  filler.setText('personalInfo.nameExtension', displayOrEmpty(pi.nameExtension));
  filler.setText('personalInfo.dateOfBirth', formatDateMMDDYYYY(pi.dateOfBirth));
  filler.setText('personalInfo.placeOfBirth', displayOrEmpty(pi.placeOfBirth));
  filler.setText('personalInfo.heightM', formatHeight(pi.heightM));
  filler.setText('personalInfo.weightKg', formatWeight(pi.weightKg));
  filler.setText('personalInfo.bloodType', displayOrEmpty(pi.bloodType));
  filler.setText('personalInfo.gsisNo', displayOrEmpty(pi.gsisNo));
  filler.setText('personalInfo.pagibigNo', displayOrEmpty(pi.pagibigNo));
  filler.setText('personalInfo.philhealthNo', displayOrEmpty(pi.philhealthNo));
  filler.setText('personalInfo.sssNo', displayOrEmpty(pi.sssNo));
  filler.setText('personalInfo.tinNo', displayOrEmpty(pi.tinNo));
  filler.setText('personalInfo.agencyEmployeeNo', displayOrEmpty(pi.agencyEmployeeNo));
  filler.setText('personalInfo.philsysNo', displayOrEmpty(pi.philsysNo));
  filler.setText(
    'personalInfo.citizenship.details',
    pi.citizenship.type === 'Dual' ? displayOrEmpty(pi.citizenship.country || pi.citizenship.details) : ''
  );

  // Residential address — centered alignment with auto-fit
  const addressFit = { alignment: 'center' as const, minFontSize: 5 };
  const ra = pi.residentialAddress;
  if (ra) {
    filler.setTextWithFit('personalInfo.residentialAddress.houseNumber', displayOrEmpty(ra.houseNumber), addressFit);
    filler.setTextWithFit('personalInfo.residentialAddress.street', displayOrEmpty(ra.street), addressFit);
    filler.setTextWithFit('personalInfo.residentialAddress.subdivision', displayOrEmpty(ra.subdivision), addressFit);
    filler.setTextWithFit('personalInfo.residentialAddress.barangay', displayOrEmpty(ra.barangay), addressFit);
    filler.setTextWithFit('personalInfo.residentialAddress.city', displayOrEmpty(ra.city), addressFit);
    filler.setTextWithFit('personalInfo.residentialAddress.province', displayOrEmpty(ra.province), addressFit);
    filler.setTextWithFit('personalInfo.residentialAddress.zipCode', displayOrEmpty(ra.zipCode), addressFit);
  }

  // Permanent address — centered alignment with auto-fit
  const pa = pi.permanentAddress;
  if (pa) {
    filler.setTextWithFit('personalInfo.permanentAddress.houseNumber', displayOrEmpty(pa.houseNumber), addressFit);
    filler.setTextWithFit('personalInfo.permanentAddress.street', displayOrEmpty(pa.street), addressFit);
    filler.setTextWithFit('personalInfo.permanentAddress.subdivision', displayOrEmpty(pa.subdivision), addressFit);
    filler.setTextWithFit('personalInfo.permanentAddress.barangay', displayOrEmpty(pa.barangay), addressFit);
    filler.setTextWithFit('personalInfo.permanentAddress.city', displayOrEmpty(pa.city), addressFit);
    filler.setTextWithFit('personalInfo.permanentAddress.province', displayOrEmpty(pa.province), addressFit);
    filler.setTextWithFit('personalInfo.permanentAddress.zipCode', displayOrEmpty(pa.zipCode), addressFit);
  }

  filler.setText('personalInfo.telephoneNo', displayOrEmpty(pi.telephoneNo));
  filler.setText('personalInfo.mobileNo', displayOrEmpty(pi.mobileNo));
  filler.setTextWithFit('personalInfo.emailAddress', displayOrEmpty(pi.emailAddress), { minFontSize: 5 });
}

function fillFamilyBackground(filler: FormFiller, data: PDSData): void {
  const fb = data.familyBackground;

  // Spouse
  filler.setText('familyBackground.spouseSurname', displayOrEmpty(fb.spouseSurname));
  filler.setText('familyBackground.spouseFirstName', displayOrEmpty(fb.spouseFirstName));
  filler.setText('familyBackground.spouseMiddleName', displayOrEmpty(fb.spouseMiddleName));
  filler.setText('familyBackground.spouseNameExtension', displayOrEmpty(fb.spouseNameExtension));
  filler.setText('familyBackground.spouseOccupation', displayOrEmpty(fb.spouseOccupation));
  filler.setText('familyBackground.spouseEmployer', displayOrEmpty(fb.spouseEmployer));
  filler.setText('familyBackground.spouseBusinessAddress', displayOrEmpty(fb.spouseBusinessAddress));
  filler.setText('familyBackground.spouseTelephoneNo', displayOrEmpty(fb.spouseTelephoneNo));

  // Father
  filler.setText('familyBackground.fatherSurname', displayOrEmpty(fb.fatherSurname));
  filler.setText('familyBackground.fatherFirstName', displayOrEmpty(fb.fatherFirstName));
  filler.setText('familyBackground.fatherMiddleName', displayOrEmpty(fb.fatherMiddleName));
  filler.setText('familyBackground.fatherNameExtension', displayOrEmpty(fb.fatherNameExtension));

  // Mother
  filler.setText('familyBackground.motherMaidenSurname', displayOrEmpty(fb.motherMaidenSurname));
  filler.setText('familyBackground.motherFirstName', displayOrEmpty(fb.motherFirstName));
  filler.setText('familyBackground.motherMiddleName', displayOrEmpty(fb.motherMiddleName));
}

function fillEducation(filler: FormFiller, data: PDSData): void {
  const levels = ['elementary', 'secondary', 'vocational', 'college', 'graduate'] as const;
  const eduFit = { minFontSize: 4 };
  // Date fields are only ~30pt wide — need small font to fit MM/DD/YYYY
  const dateFit = { minFontSize: 4, alignment: 'center' as const };

  for (const level of levels) {
    const edu = data.education[level];
    if (!edu) continue;

    const prefix = `education.${level}`;
    filler.setTextWithFit(`${prefix}.schoolName`, displayOrEmpty(edu.schoolName), eduFit);
    filler.setTextWithFit(`${prefix}.degreeCourse`, displayOrEmpty(edu.degreeCourse), eduFit);
    filler.setTextWithFit(`${prefix}.periodFrom`, formatEducationPeriod(edu.periodFrom), dateFit);
    filler.setTextWithFit(`${prefix}.periodTo`, formatEducationPeriod(edu.periodTo), dateFit);
    filler.setTextWithFit(`${prefix}.highestLevelEarned`, displayOrEmpty(edu.highestLevelEarned), eduFit);
    filler.setTextWithFit(`${prefix}.yearGraduated`, edu.yearGraduated != null ? String(edu.yearGraduated) : '', dateFit);
    filler.setTextWithFit(`${prefix}.honorsReceived`, displayOrEmpty(edu.honorsReceived), eduFit);
  }
}

function fillQuestionDetails(filler: FormFiller, questionDetails: Record<string, string>): void {
  for (const [fieldKey, value] of Object.entries(questionDetails)) {
    filler.setText(fieldKey, value);
  }
}

function fillGovernmentId(filler: FormFiller, data: PDSData): void {
  if (!data.governmentId) return;
  filler.setText('governmentId.idType', displayOrEmpty(data.governmentId.idType));
  filler.setText('governmentId.idNumber', displayOrEmpty(data.governmentId.idNumber));
  filler.setText('governmentId.dateIssued', formatDateMMDDYYYY(data.governmentId.dateIssued));
  filler.setText('governmentId.placeIssued', displayOrEmpty(data.governmentId.placeIssued));
}

function fillCheckboxes(filler: FormFiller, data: PDSData): void {
  const pi = data.personalInfo;

  // Sex
  filler.setCheckbox('cb.sex.male', pi.sex === 'male');
  filler.setCheckbox('cb.sex.female', pi.sex === 'female');

  // Civil Status
  filler.setCheckbox('cb.civilStatus.single', pi.civilStatus === 'single');
  filler.setCheckbox('cb.civilStatus.married', pi.civilStatus === 'married');
  filler.setCheckbox('cb.civilStatus.widowed', pi.civilStatus === 'widowed');
  filler.setCheckbox('cb.civilStatus.separated', pi.civilStatus === 'separated');

  // Citizenship
  filler.setCheckbox('cb.citizenship.filipino', pi.citizenship.type === 'Filipino');
  filler.setCheckbox('cb.citizenship.dual', pi.citizenship.type === 'Dual');
  filler.setCheckbox(
    'cb.citizenship.byBirth',
    pi.citizenship.type === 'Dual' && 
    ((pi.citizenship.acquisitionMethod as string) === 'byBirth' || (pi.citizenship.acquisitionMethod as string) === 'by birth')
  );
  filler.setCheckbox(
    'cb.citizenship.byNaturalization',
    pi.citizenship.type === 'Dual' && 
    ((pi.citizenship.acquisitionMethod as string) === 'byNaturalization' || (pi.citizenship.acquisitionMethod as string) === 'by naturalization')
  );

  // Questions (Q34-Q40c)
  const questionKeys = [
    'Q34', 'Q35a', 'Q35b', 'Q36', 'Q37', 'Q38a', 'Q38b', 'Q39', 'Q40a', 'Q40b', 'Q40c',
  ] as const;

  // Build the resolved question map using the same evaluateCheckbox logic
  for (const qKey of questionKeys) {
    const yesKey = `checkbox:${qKey}:yes`;
    const yesValue = evaluateCheckbox(yesKey, data);

    filler.setCheckbox(`cb.${qKey}.yes`, yesValue);
    filler.setCheckbox(`cb.${qKey}.no`, !yesValue);
  }
}

function fillTables(filler: FormFiller, data: PDSData): void {
  // Many table columns are narrow (29-46pt) so need small min font to fit dates/text
  const tableFit = { minFontSize: 4 };

  // Children
  const childRows = childrenToRows(data.familyBackground.children).map((r) => ({
    fullName: displayOrEmpty(r.fullName),
    dateOfBirth: formatDateMMDDYYYY(r.dateOfBirth),
  }));
  filler.fillTable('children', childRows);

  // Civil Service Eligibilities
  const eligRows = eligibilityToRows(data.civilServiceEligibilities).map((r) => ({
    eligibilityName: displayOrEmpty(r.eligibilityName),
    rating: displayOrEmpty(r.rating),
    dateOfExam: formatDateMMDDYYYY(r.dateOfExam),
    placeOfExam: displayOrEmpty(r.placeOfExam),
    licenseNo: displayOrEmpty(r.licenseNo),
    licenseValidityDate: formatDateMMDDYYYY(r.licenseValidityDate),
  }));
  filler.fillTable('eligibilities', eligRows, undefined, tableFit);

  // Work Experience
  const workRows = workExperienceToRows(data.workExperiences).map((r) => ({
    dateFrom: formatDateMMDDYYYY(r.dateFrom),
    dateTo: r.dateTo === 'PRESENT' ? 'PRESENT' : formatDateMMDDYYYY(r.dateTo),
    positionTitle: displayOrEmpty(r.positionTitle),
    departmentAgency: displayOrEmpty(r.departmentAgency),
    monthlySalary: formatCurrency(r.monthlySalary),
    salaryGrade: displayOrEmpty(r.salaryGrade),
    statusOfAppointment: displayOrEmpty(r.statusOfAppointment),
    isGovernment: r.isGovernment ? 'Y' : 'N',
  }));
  filler.fillTable('workExperiences', workRows, undefined, tableFit);

  // Voluntary Work
  const volRows = voluntaryWorkToRows(data.voluntaryWorks).map((r) => ({
    organizationName: displayOrEmpty(r.organizationName),
    dateFrom: formatDateMMDDYYYY(r.dateFrom),
    dateTo: formatDateMMDDYYYY(r.dateTo),
    numberOfHours: displayOrEmpty(r.numberOfHours),
    positionNature: displayOrEmpty(r.positionNature),
  }));
  filler.fillTable('voluntaryWorks', volRows, undefined, tableFit);

  // Training / Learning & Development
  const trainRows = trainingToRows(data.trainings).map((r) => ({
    title: displayOrEmpty(r.title),
    dateFrom: formatDateMMDDYYYY(r.dateFrom),
    dateTo: formatDateMMDDYYYY(r.dateTo),
    hours: displayOrEmpty(r.hours),
    typeOfLd: displayOrEmpty(r.typeOfLd),
    conductedBy: displayOrEmpty(r.conductedBy),
  }));
  filler.fillTable('trainings', trainRows, undefined, tableFit);

  // Skills
  const skillRows = skillsToRows(data.skills).map((r) => ({
    value: displayOrEmpty(r.value),
  }));
  filler.fillTable('skills', skillRows, undefined, tableFit);

  // Recognitions
  const recogRows = recognitionsToRows(data.recognitions).map((r) => ({
    display: displayOrEmpty(r.display),
  }));
  filler.fillTable('recognitions', recogRows, undefined, tableFit);

  // Associations
  const assocRows = associationsToRows(data.associations).map((r) => ({
    display: displayOrEmpty(r.display),
  }));
  filler.fillTable('associations', assocRows, undefined, tableFit);

  // References
  const refRows = referencesToRows(data.references).map((r) => ({
    name: displayOrEmpty(r.name),
    address: displayOrEmpty(r.address),
    telephoneNo: displayOrEmpty(r.telephoneNo),
  }));
  filler.fillTable('references', refRows, undefined, tableFit);
}

// ---------------------------------------------------------------------------
// Build overflow sections for rows that exceed the template page
// ---------------------------------------------------------------------------

function buildOverflowSections(data: PDSData): OverflowSection[] {
  const sections: OverflowSection[] = [];

  // Children overflow
  if (data.familyBackground.children.length > MAX_CHILDREN_ROWS) {
    const overflow = data.familyBackground.children.slice(MAX_CHILDREN_ROWS);
    sections.push({
      title: 'CHILDREN (Continuation — Item 25)',
      columnHeaders: 'NAME                                           DATE OF BIRTH',
      rows: overflow.map((c) => ({
        text: `${displayOrEmpty(c.fullName).padEnd(48)}${formatDateMMDDYYYY(c.dateOfBirth)}`,
      })),
    });
  }

  // Eligibility overflow
  const eligRows = eligibilityToRows(data.civilServiceEligibilities);
  if (eligRows.length > MAX_ELIGIBILITY_ROWS) {
    const overflow = eligRows.slice(MAX_ELIGIBILITY_ROWS);
    sections.push({
      title: 'CIVIL SERVICE ELIGIBILITY (Continuation — Item 27)',
      columnHeaders: 'ELIGIBILITY                       RATING    DATE          PLACE                    LICENSE NO.  VALID UNTIL',
      rows: overflow.map((r) => ({
        text: `${displayOrEmpty(r.eligibilityName).padEnd(34)}${displayOrEmpty(r.rating).padEnd(10)}${formatDateMMDDYYYY(r.dateOfExam).padEnd(14)}${displayOrEmpty(r.placeOfExam).padEnd(25)}${displayOrEmpty(r.licenseNo).padEnd(13)}${formatDateMMDDYYYY(r.licenseValidityDate)}`,
      })),
    });
  }

  // Work experience overflow
  const workRows = workExperienceToRows(data.workExperiences);
  if (workRows.length > MAX_WORK_EXPERIENCE_ROWS) {
    const overflow = workRows.slice(MAX_WORK_EXPERIENCE_ROWS);
    sections.push({
      title: 'WORK EXPERIENCE (Continuation — Item 28)',
      columnHeaders: 'FROM           TO             POSITION                    DEPT/AGENCY                  SALARY       SG   STATUS   GOV',
      rows: overflow.map((r) => ({
        text: `${formatDateMMDDYYYY(r.dateFrom).padEnd(15)}${displayOrEmpty(r.dateTo).padEnd(15)}${displayOrEmpty(r.positionTitle).padEnd(28)}${displayOrEmpty(r.departmentAgency).padEnd(29)}${formatCurrency(r.monthlySalary).padEnd(13)}${displayOrEmpty(r.salaryGrade).padEnd(5)}${displayOrEmpty(r.statusOfAppointment).padEnd(9)}${r.isGovernment ? 'Y' : 'N'}`,
      })),
    });
  }

  // Voluntary work overflow
  const volRows = voluntaryWorkToRows(data.voluntaryWorks);
  if (volRows.length > MAX_VOLUNTARY_WORK_ROWS) {
    const overflow = volRows.slice(MAX_VOLUNTARY_WORK_ROWS);
    sections.push({
      title: 'VOLUNTARY WORK (Continuation — Item 29)',
      rows: overflow.map((r) => ({
        text: `${displayOrEmpty(r.organizationName).padEnd(40)}${formatDateMMDDYYYY(r.dateFrom).padEnd(14)}${formatDateMMDDYYYY(r.dateTo).padEnd(14)}${displayOrEmpty(r.numberOfHours).padEnd(8)}${displayOrEmpty(r.positionNature)}`,
      })),
    });
  }

  // Training overflow
  const trainRows = trainingToRows(data.trainings);
  if (trainRows.length > MAX_TRAINING_ROWS) {
    const overflow = trainRows.slice(MAX_TRAINING_ROWS);
    sections.push({
      title: 'TRAINING PROGRAMS (Continuation — Item 30)',
      rows: overflow.map((r) => ({
        text: `${displayOrEmpty(r.title).padEnd(40)}${formatDateMMDDYYYY(r.dateFrom).padEnd(14)}${formatDateMMDDYYYY(r.dateTo).padEnd(14)}${displayOrEmpty(r.hours).padEnd(8)}${displayOrEmpty(r.typeOfLd).padEnd(16)}${displayOrEmpty(r.conductedBy)}`,
      })),
    });
  }

  // Skills overflow
  if (data.skills.length > MAX_SKILLS_ROWS) {
    const overflow = data.skills.slice(MAX_SKILLS_ROWS);
    sections.push({
      title: 'SPECIAL SKILLS & HOBBIES (Continuation — Item 31)',
      rows: overflow.map((s) => ({ text: s })),
    });
  }

  // Recognitions overflow
  if (data.recognitions.length > MAX_RECOGNITIONS_ROWS) {
    const overflow = data.recognitions.slice(MAX_RECOGNITIONS_ROWS);
    sections.push({
      title: 'RECOGNITIONS / DISTINCTIONS (Continuation — Item 32)',
      rows: overflow.map((r) => ({
        text: `${displayOrEmpty(r.title)} (${r.year}) - ${displayOrEmpty(r.organization)}`,
      })),
    });
  }

  // Associations overflow
  if (data.associations.length > MAX_ASSOCIATIONS_ROWS) {
    const overflow = data.associations.slice(MAX_ASSOCIATIONS_ROWS);
    sections.push({
      title: 'ASSOCIATIONS / ORGANIZATIONS (Continuation — Item 33)',
      rows: overflow.map((a) => ({
        text: `${displayOrEmpty(a.name)}${a.position ? ` - ${a.position}` : ''}${a.yearJoined ? ` (${a.yearJoined})` : ''}`,
      })),
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Main fill function
// ---------------------------------------------------------------------------

/**
 * Fill the PDS government PDF template with data and return the result as
 * a Uint8Array.
 *
 * Uses the fillable AcroForm template (`pds-fillable.pdf`) with named fields.
 * Fields are filled by name, flattened to static content, and overflow pages
 * are appended for any sections that exceed the template limits.
 *
 * @param baseUrl  The base URL for fetching assets, typically
 *                 `window.location.origin`.  The template PDF will be loaded
 *                 from `${baseUrl}/templates/pds-fillable.pdf` and fonts
 *                 from `${baseUrl}/fonts/`.
 * @param pdsData  The complete PDS data object.
 * @returns        A Uint8Array containing the filled PDF document.
 */
export async function fillPDS(
  baseUrl: string,
  pdsData: PDSData
): Promise<Uint8Array> {
  // ------------------------------------------------------------------
  // 1. Load fillable template PDF and fonts in parallel
  // ------------------------------------------------------------------
  const [templateBuffer, fontBuffers] = await Promise.all([
    fetch(`${baseUrl}/templates/pds-fillable.pdf`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load PDS template: ${r.status}`);
      return r.arrayBuffer();
    }),
    loadAllFonts(baseUrl),
  ]);

  // ------------------------------------------------------------------
  // 2. Create FormFiller
  // ------------------------------------------------------------------
  const filler = await FormFiller.create(templateBuffer, fontBuffers);

  // ------------------------------------------------------------------
  // 3. Resolve question detail fields (with backward-compat fallbacks)
  // ------------------------------------------------------------------
  const questionDetails = resolveQuestionDetailFields(pdsData);

  // ------------------------------------------------------------------
  // 4. Fill static text fields by name
  // ------------------------------------------------------------------
  fillPersonalInfo(filler, pdsData);
  fillFamilyBackground(filler, pdsData);
  fillEducation(filler, pdsData);
  fillQuestionDetails(filler, questionDetails);
  fillGovernmentId(filler, pdsData);

  // ------------------------------------------------------------------
  // 5. Fill checkboxes by name
  // ------------------------------------------------------------------
  fillCheckboxes(filler, pdsData);

  // ------------------------------------------------------------------
  // 6. Fill tables by name
  // ------------------------------------------------------------------
  fillTables(filler, pdsData);

  // ------------------------------------------------------------------
  // 7. Photo (direct drawImage on page, not an AcroForm field)
  // ------------------------------------------------------------------
  if (pdsData.photoUrl) {
    await filler.drawImageFromUrl(
      filler.getPage(3),
      pdsData.photoUrl,
      { x: 540, y: 330, width: 55, height: 70 }
    );
  }

  // ------------------------------------------------------------------
  // 8. Flatten all form fields to static content (non-editable)
  // ------------------------------------------------------------------
  filler.flatten();

  // ------------------------------------------------------------------
  // 9. Add overflow continuation pages (after flatten, using drawText)
  // ------------------------------------------------------------------
  const overflowSections = buildOverflowSections(pdsData);
  if (overflowSections.length > 0) {
    addOverflowPages(filler, overflowSections);
  }

  // ------------------------------------------------------------------
  // 10. Save and return
  // ------------------------------------------------------------------
  return filler.save();
}
