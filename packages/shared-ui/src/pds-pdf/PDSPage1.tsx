/**
 * PDS Page 1 - Personal Information, Family Background & Educational Background
 * CS Form No. 212 (Revised 2025)
 *
 * Contains:
 * - Form header with CS Form No. 212 / Revised 2025
 * - Form title "PERSONAL DATA SHEET"
 * - WARNING text
 * - Instructions with "DO NOT ABBREVIATE"
 * - Section I: Personal Information (items 1-21)
 * - Section II: Family Background (items 22-25)
 * - Section III: Educational Background (item 26) - full table with education levels
 * - Page footer with signature line and page number
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  colors,
  formatDateMMDDYYYY,
  displayOrEmpty,
} from './PDSStyles';
import { ContinueText, PDSPageFooter } from './PDSComponents';
import type { PDSData } from './types';

interface PDSPage1Props {
  data: PDSData;
}

// Checkbox component using bordered View elements
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkboxContainer}>
      <View
        style={[
          styles.checkbox,
          checked ? { backgroundColor: colors.black } : {},
        ]}>
        {checked && <Text style={styles.checkMark}>&#x2713;</Text>}
      </View>
    </View>
  );
}

export function PDSPage1({ data }: PDSPage1Props) {
  const { personalInfo, familyBackground, education } = data;

  // Education levels for the table
  type EducationKey = keyof typeof education;
  const educationLevels: { key: EducationKey; label: string }[] =
    [
      { key: 'elementary', label: 'ELEMENTARY' },
      { key: 'secondary', label: 'SECONDARY' },
      { key: 'vocational', label: 'VOCATIONAL /' },
      { key: 'college', label: 'COLLEGE' },
      { key: 'graduate', label: 'GRADUATE STUDIES' },
    ];

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <Text style={styles.csFormNumber}>CS Form No. 212</Text>
        <Text style={[styles.csFormNumber, { marginBottom: 0 }]}>Revised 2025</Text>
      </View>

      {/* Form Title */}
      <Text style={[styles.formTitle, { marginBottom: 3, marginTop: 2 }]}>PERSONAL DATA SHEET</Text>

      {/* WARNING text - bold italic, left-aligned */}
      <View style={{ marginBottom: 2 }}>
        <Text style={{ fontSize: 6, fontStyle: 'italic' }}>
          <Text style={styles.bold}>WARNING: </Text>
          <Text>Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</Text>
        </Text>
      </View>

      {/* Instructions */}
      <View style={{ marginBottom: 2 }}>
        <Text style={{ fontSize: 6, fontWeight: 'bold', fontStyle: 'italic' }}>
          READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.
        </Text>
        <Text style={{ fontSize: 6 }}>
          Print legibly. Tick appropriate boxes (  ) and use separate sheet if necessary. Indicate N/A if not applicable.{'  '}
          <Text style={styles.bold}>DO NOT ABBREVIATE.</Text>
        </Text>
      </View>

      {/* ============================================================= */}
      {/* Section I: PERSONAL INFORMATION                               */}
      {/* ============================================================= */}
      <View style={[styles.borderedSection, { marginTop: 2 }]}>
        <View style={styles.sectionHeader}>
          <Text>I. PERSONAL INFORMATION</Text>
        </View>

        {/* Row: 1. SURNAME */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>1. SURNAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.surname)}</Text>
          </View>
        </View>

        {/* Row: 2. FIRST NAME | NAME EXTENSION */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>2. FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCell, { flex: 1 }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.firstName)}</Text>
          </View>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
          </View>
          <View style={[styles.fieldCellLast, { width: '14%' }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.nameExtension)}</Text>
          </View>
        </View>

        {/* Row: MIDDLE NAME */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>MIDDLE NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.middleName)}</Text>
          </View>
        </View>

        {/* ============================================================= */}
        {/* Block: Items 3-5 (left 50%) | Item 16 Citizenship (right 50%) */}
        {/* ============================================================= */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
          {/* LEFT 50%: Items 3, 4, 5 */}
          <View style={{ width: '50%' }}>
            {/* 3. DATE OF BIRTH */}
            <View style={{ flexDirection: 'row', minHeight: 16, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>3. DATE OF BIRTH</Text>
                <Text style={[styles.labelSmall, styles.italic]}>(dd/mm/yyyy)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{formatDateMMDDYYYY(personalInfo.dateOfBirth)}</Text>
              </View>
            </View>
            {/* 4. PLACE OF BIRTH */}
            <View style={{ flexDirection: 'row', minHeight: 16, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>4. PLACE OF BIRTH</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.placeOfBirth)}</Text>
              </View>
            </View>
            {/* 5. SEX AT BIRTH */}
            <View style={{ flexDirection: 'row', minHeight: 16 }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>5. SEX AT BIRTH</Text>
              </View>
              <View style={{ flex: 1, padding: 2, justifyContent: 'center' }}>
                <View style={[styles.row]}>
                  <View style={[styles.checkboxRow, { width: '50%' }]}>
                    <Checkbox checked={personalInfo.sex === 'male'} />
                    <Text style={styles.labelSmall}>Male</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.sex === 'female'} />
                    <Text style={styles.labelSmall}>Female</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT 50%: Item 16 CITIZENSHIP */}
          <View style={{ width: '50%', borderLeftWidth: 0.5, borderLeftColor: colors.borderColor }}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {/* Left label column */}
              <View style={[styles.labelCell, { width: '45%' }]}>
                <Text style={styles.labelSmall}>16. CITIZENSHIP</Text>
                <Text style={[styles.labelSmall, { marginTop: 4 }]}> </Text>
                <Text style={[styles.labelSmall, styles.italic]}>If holder of dual citizenship,</Text>
                <Text style={[styles.labelSmall, styles.italic]}>please indicate the details.</Text>
                <Text style={[styles.labelSmall, { marginTop: 4 }]}>Pls. indicate country:</Text>
              </View>
              {/* Right value column */}
              <View style={{ width: '55%', padding: 2, justifyContent: 'flex-start' }}>
                <View style={[styles.row, { gap: 6, marginBottom: 2 }]}>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.citizenship.type === 'Filipino'} />
                    <Text style={styles.labelSmall}>Filipino</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.citizenship.type === 'Dual'} />
                    <Text style={styles.labelSmall}>Dual Citizenship</Text>
                  </View>
                </View>
                <View style={[styles.row, { gap: 6, marginBottom: 2 }]}>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.citizenship.details?.includes('by birth') ?? false} />
                    <Text style={styles.labelSmall}>by birth</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.citizenship.details?.includes('by naturalization') ?? false} />
                    <Text style={styles.labelSmall}>by naturalization</Text>
                  </View>
                </View>
                <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.black, minHeight: 10, marginTop: 2 }}>
                  <Text style={styles.valueSmall}>
                    {personalInfo.citizenship.type === 'Dual' ? displayOrEmpty(personalInfo.citizenship.details) : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================= */}
        {/* Block: Items 6-8 (left 50%) | 17 Residential Address (right)  */}
        {/* ============================================================= */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
          {/* LEFT 50%: Items 6, 7, 8 */}
          <View style={{ width: '50%' }}>
            {/* 6. CIVIL STATUS */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>6. CIVIL STATUS</Text>
              </View>
              <View style={{ flex: 1, padding: 4, justifyContent: 'center' }}>
                <View style={[styles.row, { marginBottom: 5 }]}>
                  <View style={[styles.checkboxRow, { width: '50%' }]}>
                    <Checkbox checked={personalInfo.civilStatus === 'single'} />
                    <Text style={styles.labelSmall}>Single</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.civilStatus === 'married'} />
                    <Text style={styles.labelSmall}>Married</Text>
                  </View>
                </View>
                <View style={[styles.row, { marginBottom: 5 }]}>
                  <View style={[styles.checkboxRow, { width: '50%' }]}>
                    <Checkbox checked={personalInfo.civilStatus === 'widowed'} />
                    <Text style={styles.labelSmall}>Widowed</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.civilStatus === 'separated'} />
                    <Text style={styles.labelSmall}>Separated</Text>
                  </View>
                </View>
                <View style={[styles.row, { alignItems: 'center' }]}>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.civilStatus !== 'single' && personalInfo.civilStatus !== 'married' && personalInfo.civilStatus !== 'widowed' && personalInfo.civilStatus !== 'separated' && !!personalInfo.civilStatus} />
                    <Text style={[styles.labelSmall, { marginRight: 2 }]}>Other/s:</Text>
                  </View>
                  <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.black, flex: 1, minHeight: 8 }}>
                    <Text style={styles.valueSmall}></Text>
                  </View>
                </View>
              </View>
            </View>
            {/* 7. HEIGHT */}
            <View style={{ flexDirection: 'row', minHeight: 16, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>7. HEIGHT (m)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {personalInfo.heightM ? parseFloat(String(personalInfo.heightM)).toFixed(2) : ''}
                </Text>
              </View>
            </View>
            {/* 8. WEIGHT */}
            <View style={{ flexDirection: 'row', minHeight: 16, flex: 1 }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>8. WEIGHT (kg)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {personalInfo.weightKg ? parseFloat(String(personalInfo.weightKg)).toFixed(2) : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* RIGHT 50%: 17. RESIDENTIAL ADDRESS */}
          <View style={{ width: '50%', borderLeftWidth: 0.5, borderLeftColor: colors.borderColor }}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {/* Left label column — address label + ZIP CODE label */}
              <View style={{ width: '30%', borderRightWidth: 0.5, borderRightColor: colors.borderColor, backgroundColor: colors.labelCellBg }}>
                <View style={{ flex: 1, padding: 2, justifyContent: 'center' }}>
                  <Text style={styles.labelSmall}>17. RESIDENTIAL ADDRESS</Text>
                </View>
                <View style={{ padding: 2, justifyContent: 'center' }}>
                  <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>ZIP CODE</Text>
                </View>
              </View>
              {/* Right grid column */}
              <View style={{ width: '70%' }}>
                {/* House/Block/Lot No. | Street */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, flex: 1 }}>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2, borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress.houseNumber)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>House/Block/Lot No.</Text>
                  </View>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress.street)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Street</Text>
                  </View>
                </View>
                {/* Subdivision/Village | Barangay */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, flex: 1 }}>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2, borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress.subdivision)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Subdivision/Village</Text>
                  </View>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress.barangay)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Barangay</Text>
                  </View>
                </View>
                {/* City/Municipality | Province */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, flex: 1 }}>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2, borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress.city)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>City/Municipality</Text>
                  </View>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress.province)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Province</Text>
                  </View>
                </View>
                {/* ZIP CODE value — no gray background */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 2, minHeight: 14 }}>
                  <Text style={styles.value}>{displayOrEmpty(personalInfo.residentialAddress.zipCode)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================= */}
        {/* Block: Items 9-12 (left 50%) | 18 Permanent Address (right)   */}
        {/* ============================================================= */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
          {/* LEFT 50%: Items 9, 10, 11, 12 */}
          <View style={{ width: '50%' }}>
            {/* 9. BLOOD TYPE */}
            <View style={{ flexDirection: 'row', minHeight: 16, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>9. BLOOD TYPE</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.bloodType)}</Text>
              </View>
            </View>
            {/* 10. UMID ID NO. */}
            <View style={{ flexDirection: 'row', minHeight: 16, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>10. UMID ID NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.gsisNo)}</Text>
              </View>
            </View>
            {/* 11. PAG-IBIG ID NO. */}
            <View style={{ flexDirection: 'row', minHeight: 16, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>11. PAG-IBIG ID NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.pagibigNo)}</Text>
              </View>
            </View>
            {/* 12. PHILHEALTH NO. */}
            <View style={{ flexDirection: 'row', minHeight: 18, borderBottomWidth: 0.5, borderBottomColor: colors.borderColor }}>
              <View style={[styles.labelCell, { width: '36%' }]}>
                <Text style={styles.labelSmall}>12. PHILHEALTH NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.philhealthNo)}</Text>
              </View>
            </View>
          </View>

          {/* RIGHT 50%: 18. PERMANENT ADDRESS */}
          <View style={{ width: '50%', borderLeftWidth: 0.5, borderLeftColor: colors.borderColor }}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {/* Left label column — address label + ZIP CODE label */}
              <View style={{ width: '30%', borderRightWidth: 0.5, borderRightColor: colors.borderColor, backgroundColor: colors.labelCellBg }}>
                <View style={{ flex: 1, padding: 2, justifyContent: 'center' }}>
                  <Text style={styles.labelSmall}>18. PERMANENT ADDRESS</Text>
                </View>
                <View style={{ padding: 2, justifyContent: 'center' }}>
                  <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>ZIP CODE</Text>
                </View>
              </View>
              {/* Right grid column */}
              <View style={{ width: '70%' }}>
                {/* House/Block/Lot No. | Street */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, flex: 1 }}>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2, borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress.houseNumber)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>House/Block/Lot No.</Text>
                  </View>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress.street)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Street</Text>
                  </View>
                </View>
                {/* Subdivision/Village | Barangay */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, flex: 1 }}>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2, borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress.subdivision)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Subdivision/Village</Text>
                  </View>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress.barangay)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Barangay</Text>
                  </View>
                </View>
                {/* City/Municipality | Province */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderColor, flex: 1 }}>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2, borderRightWidth: 0.5, borderRightColor: colors.borderColor }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress.city)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>City/Municipality</Text>
                  </View>
                  <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress.province)}</Text>
                    <Text style={[styles.labelSmall, styles.italic, styles.center]}>Province</Text>
                  </View>
                </View>
                {/* ZIP CODE value — no gray background */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 2, minHeight: 14 }}>
                  <Text style={styles.value}>{displayOrEmpty(personalInfo.permanentAddress.zipCode)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Row: 13 PhilSys Number | 19 TELEPHONE NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>13. PhilSys Number (PSN):</Text>
          </View>
          <View style={[styles.fieldCell, { width: '32%' }]}>
            <Text style={[styles.value, { fontSize: 7 }]}>{displayOrEmpty(personalInfo.philsysNo)}</Text>
          </View>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>19. TELEPHONE NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.telephoneNo)}</Text>
          </View>
        </View>

        {/* Row: 14 TIN NO. | 20 MOBILE NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>14. TIN NO.</Text>
          </View>
          <View style={[styles.fieldCell, { width: '32%' }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.tinNo)}</Text>
          </View>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>20. MOBILE NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.mobileNo)}</Text>
          </View>
        </View>

        {/* Row: 15 AGENCY EMPLOYEE NO. | 21 E-MAIL ADDRESS */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>15. AGENCY EMPLOYEE NO.</Text>
          </View>
          <View style={[styles.fieldCell, { width: '32%' }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.agencyEmployeeNo)}</Text>
          </View>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>21. E-MAIL ADDRESS (if any)</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>{displayOrEmpty(personalInfo.emailAddress)}</Text>
          </View>
        </View>
      </View>

      {/* ============================================================= */}
      {/* Section II: FAMILY BACKGROUND                                 */}
      {/* ============================================================= */}
      <View style={[styles.borderedSection, { marginTop: 2 }]}>
        <View style={styles.sectionHeader}>
          <Text>II. FAMILY BACKGROUND</Text>
        </View>

        {/* Side-by-side layout: LEFT = Spouse/Father/Mother, RIGHT = Children */}
        <View style={styles.row}>
          {/* LEFT SIDE: Spouse, Father, Mother (~55%) */}
          <View style={[styles.w55, { borderRightWidth: 0.5, borderRightColor: colors.borderColor }]}>
            {/* Spouse Section */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%', backgroundColor: '#D9D9D9' }]}>
                <Text style={[styles.labelSmall, styles.bold]}>22. SPOUSE&apos;S SURNAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseSurname)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>FIRST NAME</Text>
              </View>
              <View style={[styles.fieldCell, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseFirstName)}</Text>
              </View>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
              </View>
              <View style={[styles.fieldCellLast, { width: '12%' }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseNameExtension)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>MIDDLE NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseMiddleName)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>OCCUPATION</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseOccupation)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>EMPLOYER/BUSINESS NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseEmployer)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>BUSINESS ADDRESS</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseBusinessAddress)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>TELEPHONE NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.spouseTelephoneNo)}</Text>
              </View>
            </View>

            {/* Father Section */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%', backgroundColor: '#D9D9D9' }]}>
                <Text style={[styles.labelSmall, styles.bold]}>23. FATHER&apos;S SURNAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.fatherSurname)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>FIRST NAME</Text>
              </View>
              <View style={[styles.fieldCell, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.fatherFirstName)}</Text>
              </View>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
              </View>
              <View style={[styles.fieldCellLast, { width: '12%' }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.fatherNameExtension)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>MIDDLE NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.fatherMiddleName)}</Text>
              </View>
            </View>

            {/* Mother Section */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%', backgroundColor: '#D9D9D9' }]}>
                <Text style={[styles.labelSmall, styles.bold]}>24. MOTHER&apos;S MAIDEN NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.motherMaidenSurname)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>SURNAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.motherMaidenSurname)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>FIRST NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.motherFirstName)}</Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>MIDDLE NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(familyBackground.motherMiddleName)}</Text>
              </View>
            </View>
          </View>

          {/* RIGHT SIDE: Children Table (~45%) */}
          <View style={styles.w45}>
            {/* Children Header */}
            <View style={styles.subSectionHeader}>
              <Text style={[styles.labelSmall, { fontSize: 6 }]}>
                25. NAME of CHILDREN (Write full name and list all)
              </Text>
            </View>

            {/* Children column headers */}
            <View style={styles.fieldRow}>
              <View style={[styles.tableCellHeader, styles.w60]}>
                <Text style={[styles.labelSmall, styles.center]}>NAME</Text>
              </View>
              <View style={[styles.tableCellHeader, { flex: 1, borderRightWidth: 0 }]}>
                <Text style={[styles.labelSmall, styles.center]}>
                  DATE OF BIRTH{'\n'}(dd/mm/yyyy)
                </Text>
              </View>
            </View>

            {/* Children rows */}
            {Array.from({ length: Math.max(12, familyBackground.children.length) }).map((_, index) => {
              const child = familyBackground.children[index];
              return (
                <View key={index} style={[styles.fieldRowCompact, { height: 14, maxHeight: 14 }]}>
                  <View style={[styles.tableCell, styles.w60]}>
                    <Text style={styles.value}>
                      {child ? displayOrEmpty(child.fullName) : ''}
                    </Text>
                  </View>
                  <View style={[styles.tableCellNoBorder, { flex: 1 }]}>
                    <Text style={[styles.value, styles.center]}>
                      {child ? formatDateMMDDYYYY(child.dateOfBirth) : ''}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Continue text for children */}
            <ContinueText align="right" marginTop={0} />
          </View>
        </View>
      </View>

      {/* ============================================================= */}
      {/* Section III: EDUCATIONAL BACKGROUND                           */}
      {/* ============================================================= */}
      <View style={[styles.borderedSection, { marginTop: 1 }]}>
        <View style={styles.sectionHeader}>
          <Text>III. EDUCATIONAL BACKGROUND</Text>
        </View>

        {/* Sub-header note */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.labelSmall}>
            26. (Write in full the school name, degree/course, etc.)
          </Text>
        </View>

        {/* Education table header row */}
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
              BASIC EDUCATION/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              DEGREE/COURSE
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (Write in full)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { width: '12%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              PERIOD OF
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>ATTENDANCE</Text>
            <View style={[styles.row, { marginTop: 1 }]}>
              <View style={[styles.tableCell, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>From</Text>
              </View>
              <View style={[styles.tableCellNoBorder, styles.w50]}>
                <Text style={[styles.labelSmall, styles.center]}>To</Text>
              </View>
            </View>
          </View>
          <View style={[styles.tableCellHeader, { width: '13%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              HIGHEST LEVEL/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              UNITS EARNED
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              (if not graduated)
            </Text>
          </View>
          <View style={[styles.tableCellHeader, { width: '10%' }]}>
            <Text style={[styles.labelSmall, styles.center]}>YEAR</Text>
            <Text style={[styles.labelSmall, styles.center]}>GRADUATED</Text>
          </View>
          <View
            style={[
              styles.tableCellHeader,
              { width: '15%', borderRightWidth: 0 },
            ]}>
            <Text style={[styles.labelSmall, styles.center]}>
              SCHOLARSHIP/
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>
              ACADEMIC HONORS
            </Text>
            <Text style={[styles.labelSmall, styles.center]}>RECEIVED</Text>
          </View>
        </View>

        {/* Education data rows */}
        {educationLevels.map((level) => {
          const edu = education[level.key];
          return (
            <View key={level.key} style={[styles.fieldRow, { minHeight: 14 }]}>
              {/* Level */}
              <View style={[styles.tableCell, styles.w15]}>
                <Text style={[styles.valueSmall, styles.bold]}>{level.label}</Text>
              </View>
              {/* School Name */}
              <View style={[styles.tableCell, styles.w20]}>
                <Text style={styles.valueSmall}>
                  {edu ? displayOrEmpty(edu.schoolName) : ''}
                </Text>
              </View>
              {/* Degree/Course */}
              <View style={[styles.tableCell, styles.w15]}>
                <Text style={styles.valueSmall}>
                  {edu ? displayOrEmpty(edu.degreeCourse) : ''}
                </Text>
              </View>
              {/* Period From */}
              <View style={[styles.tableCell, { width: '6%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {edu?.periodFrom
                    ? typeof edu.periodFrom === 'string'
                      ? edu.periodFrom
                      : formatDateMMDDYYYY(edu.periodFrom)
                    : ''}
                </Text>
              </View>
              {/* Period To */}
              <View style={[styles.tableCell, { width: '6%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {edu?.periodTo
                    ? typeof edu.periodTo === 'string'
                      ? edu.periodTo
                      : formatDateMMDDYYYY(edu.periodTo)
                    : ''}
                </Text>
              </View>
              {/* Highest Level/Units Earned */}
              <View style={[styles.tableCell, { width: '13%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {edu ? displayOrEmpty(edu.highestLevelEarned) : ''}
                </Text>
              </View>
              {/* Year Graduated */}
              <View style={[styles.tableCell, { width: '10%' }]}>
                <Text style={[styles.valueSmall, styles.center]}>
                  {edu?.yearGraduated ? String(edu.yearGraduated) : ''}
                </Text>
              </View>
              {/* Scholarship/Honors */}
              <View style={[styles.tableCellNoBorder, { width: '15%' }]}>
                <Text style={styles.valueSmall}>
                  {edu ? displayOrEmpty(edu.honorsReceived) : ''}
                </Text>
              </View>
            </View>
          );
        })}


        {/* Continue text for education */}
        <ContinueText align="right" marginTop={2} />
      </View>

      {/* Page footer with signature */}
      <PDSPageFooter pageNumber={1} totalPages={4} showSignature={true} />
    </Page>
  );
}

export default PDSPage1;
