/**
 * PDS Page 1 - Personal Information, Family Background & Educational Background
 * CS Form No. 212 (Revised 2025)
 *
 * Contains:
 * - Form header with CS Form No. 212 / Revised 2025
 * - Form title "PERSONAL DATA SHEET"
 * - WARNING text in RED
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
import type { PDSData, Address } from './types';

interface PDSPage1Props {
  data: PDSData;
}

// Helper to format full address
function formatAddress(address: Address): string {
  const parts = [
    address.houseNumber,
    address.street,
    address.subdivision,
    address.barangay,
    address.city,
    address.province,
    address.zipCode,
  ].filter(Boolean);
  return parts.join(', ') || '';
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

// Field with label above value
function LabeledField({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width?: string;
}) {
  return (
    <View style={[styles.fieldCell, width ? { width } : styles.flex1]}>
      <Text style={styles.labelSmall}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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

  // Children are rendered in the side-by-side layout with a minimum of 12 rows

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <Text style={styles.csFormNumber}>CS Form No. 212</Text>
        <Text style={[styles.csFormNumber, { marginBottom: 0 }]}>Revised 2025</Text>
      </View>

      {/* Form Title */}
      <Text style={styles.formTitle}>PERSONAL DATA SHEET</Text>

      {/* WARNING text */}
      <Text style={styles.warningText}>
        WARNING: Any misrepresentation made in the Personal Data Sheet and the
        Work Experience Sheet shall cause the filing of
        administrative/criminal case/s against the person concerned.
      </Text>

      {/* Instructions */}
      <View style={{ marginBottom: 5 }}>
        <Text style={[styles.labelSmall, styles.italic]}>
          READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS)
          BEFORE ACCOMPLISHING THE PDS FORM.
        </Text>
        <Text style={styles.labelSmall}>
          Print legibly. Tick appropriate boxes ( ) and use separate sheet if
          necessary. Indicate N/A if not applicable.{' '}
          <Text style={styles.bold}>DO NOT ABBREVIATE.</Text>
        </Text>
      </View>

      {/* Section I: PERSONAL INFORMATION */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>I. PERSONAL INFORMATION</Text>
        </View>

        {/* Item 1: Surname - Full Width */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>1. SURNAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.surname)}
            </Text>
          </View>
        </View>

        {/* Item 2: First Name + Name Extension - Full Width */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>2. FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCell, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.firstName)}
            </Text>
          </View>
          <View style={[styles.labelCell, { width: '18%' }]}>
            <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
          </View>
          <View style={[styles.fieldCellLast, { width: '12%' }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.nameExtension)}
            </Text>
          </View>
        </View>

        {/* Middle Name - Full Width */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>MIDDLE NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.middleName)}
            </Text>
          </View>
        </View>

        {/* TWO-COLUMN LAYOUT: LEFT (Items 3-15) | RIGHT (Items 16-21) */}
        <View style={styles.row}>
          {/* LEFT COLUMN (~50%) - Items 3-15 */}
          <View style={[styles.w50, { borderRightWidth: 0.5, borderRightColor: colors.borderColor }]}>
            {/* 3. DATE OF BIRTH */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>3. DATE OF BIRTH</Text>
                <Text style={[styles.labelSmall, styles.italic]}>(dd/mm/yyyy)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {formatDateMMDDYYYY(personalInfo.dateOfBirth)}
                </Text>
              </View>
            </View>

            {/* 4. PLACE OF BIRTH */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>4. PLACE OF BIRTH</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(personalInfo.placeOfBirth)}
                </Text>
              </View>
            </View>

            {/* 5. SEX AT BIRTH */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>5. SEX AT BIRTH</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <View style={styles.row}>
                  <View style={styles.checkboxRow}>
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

            {/* 6. CIVIL STATUS */}
            <View style={[styles.fieldRow, { minHeight: 30 }]}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>6. CIVIL STATUS</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <View style={[styles.column, { gap: 1 }]}>
                  <View style={styles.row}>
                    <View style={[styles.checkboxRow, { width: '50%' }]}>
                      <Checkbox checked={personalInfo.civilStatus === 'single'} />
                      <Text style={styles.labelSmall}>Single</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                      <Checkbox checked={personalInfo.civilStatus === 'married'} />
                      <Text style={styles.labelSmall}>Married</Text>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.checkboxRow, { width: '50%' }]}>
                      <Checkbox checked={personalInfo.civilStatus === 'widowed'} />
                      <Text style={styles.labelSmall}>Widowed</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                      <Checkbox checked={personalInfo.civilStatus === 'separated'} />
                      <Text style={styles.labelSmall}>Separated</Text>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.labelSmall}>Other/s:</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 7. HEIGHT */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>7. HEIGHT (m)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {personalInfo.heightM ? parseFloat(String(personalInfo.heightM)).toFixed(2) : ''}
                </Text>
              </View>
            </View>

            {/* 8. WEIGHT */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>8. WEIGHT (kg)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {personalInfo.weightKg ? parseFloat(String(personalInfo.weightKg)).toFixed(2) : ''}
                </Text>
              </View>
            </View>

            {/* 9. BLOOD TYPE */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>9. BLOOD TYPE</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(personalInfo.bloodType)}
                </Text>
              </View>
            </View>

            {/* 10. UMID ID NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>10. UMID ID NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.gsisNo)}</Text>
              </View>
            </View>

            {/* 11. PAG-IBIG ID NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>11. PAG-IBIG ID NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.pagibigNo)}</Text>
              </View>
            </View>

            {/* 12. PHILHEALTH NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>12. PHILHEALTH NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.philhealthNo)}</Text>
              </View>
            </View>

            {/* 13. PhilSys Number (PSN) */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>13. PhilSys Number (PSN)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.philsysNo)}</Text>
              </View>
            </View>

            {/* 14. TIN NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>14. TIN NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.tinNo)}</Text>
              </View>
            </View>

            {/* 15. AGENCY EMPLOYEE NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>15. AGENCY EMPLOYEE NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>{displayOrEmpty(personalInfo.agencyEmployeeNo)}</Text>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN (~50%) - Items 16-21 */}
          <View style={styles.w50}>
            {/* 16. CITIZENSHIP */}
            <View style={[styles.fieldRow, { minHeight: 30 }]}>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>16. CITIZENSHIP</Text>
                <View style={[styles.row, { marginTop: 2, gap: 8 }]}>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.citizenship?.type === 'Filipino'} />
                    <Text style={styles.valueSmall}>Filipino</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={personalInfo.citizenship?.type === 'Dual'} />
                    <Text style={styles.valueSmall}>Dual Citizenship</Text>
                  </View>
                </View>
                {personalInfo.citizenship?.type === 'Dual' && (
                  <View style={[styles.row, { marginTop: 2, marginLeft: 15, gap: 5 }]}>
                    <View style={styles.checkboxRow}>
                      <Checkbox checked={personalInfo.citizenship.details?.includes('birth') ?? false} />
                      <Text style={styles.valueSmall}>by birth</Text>
                    </View>
                    <View style={styles.checkboxRow}>
                      <Checkbox checked={personalInfo.citizenship.details?.includes('naturalization') ?? false} />
                      <Text style={styles.valueSmall}>by naturalization</Text>
                    </View>
                  </View>
                )}
                <Text style={[styles.labelSmall, { marginTop: 2 }]}>
                  Pls. indicate country:
                </Text>
              </View>
            </View>

            {/* Dual citizenship details row */}
            <View style={[styles.fieldRow, { minHeight: 18 }]}>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={[styles.labelSmall, styles.italic, { fontSize: 5 }]}>
                  If holder of dual citizenship, please indicate the details.
                </Text>
                <View style={{ borderBottomWidth: 0.5, borderBottomColor: colors.black, minHeight: 10, marginTop: 2 }}>
                  <Text style={styles.valueSmall}>
                    {personalInfo.citizenship?.type === 'Dual' ? displayOrEmpty(personalInfo.citizenship.details) : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* 17. RESIDENTIAL ADDRESS */}
            <View style={[styles.fieldRow, { minHeight: 12 }]}>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>17. RESIDENTIAL ADDRESS</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCell, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress?.houseNumber)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>House/Block/Lot No.</Text>
              </View>
              <View style={[styles.fieldCellLast, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress?.street)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Street</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCell, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress?.subdivision)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Subdivision/Village</Text>
              </View>
              <View style={[styles.fieldCellLast, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress?.barangay)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Barangay</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCell, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress?.city)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>City/Municipality</Text>
              </View>
              <View style={[styles.fieldCellLast, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.residentialAddress?.province)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Province</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCellLast, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 5 }]}>
                <Text style={[styles.labelSmall, { fontSize: 5 }]}>ZIP CODE</Text>
                <Text style={[styles.valueSmall, { marginLeft: 5 }]}>{displayOrEmpty(personalInfo.residentialAddress?.zipCode)}</Text>
              </View>
            </View>

            {/* 18. PERMANENT ADDRESS */}
            <View style={[styles.fieldRow, { minHeight: 12 }]}>
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={[styles.labelSmall, { fontWeight: 'bold' }]}>18. PERMANENT ADDRESS</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCell, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress?.houseNumber)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>House/Block/Lot No.</Text>
              </View>
              <View style={[styles.fieldCellLast, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress?.street)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Street</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCell, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress?.subdivision)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Subdivision/Village</Text>
              </View>
              <View style={[styles.fieldCellLast, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress?.barangay)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Barangay</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCell, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress?.city)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>City/Municipality</Text>
              </View>
              <View style={[styles.fieldCellLast, styles.w50]}>
                <Text style={[styles.valueSmall, styles.center]}>{displayOrEmpty(personalInfo.permanentAddress?.province)}</Text>
                <Text style={[styles.labelSmall, styles.center, { fontSize: 4.5, color: colors.labelTextDark }]}>Province</Text>
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldCellLast, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 5 }]}>
                <Text style={[styles.labelSmall, { fontSize: 5 }]}>ZIP CODE</Text>
                <Text style={[styles.valueSmall, { marginLeft: 5 }]}>{displayOrEmpty(personalInfo.permanentAddress?.zipCode)}</Text>
              </View>
            </View>

            {/* 19. TELEPHONE NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>19. TELEPHONE NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.valueSmall}>{displayOrEmpty(personalInfo.telephoneNo)}</Text>
              </View>
            </View>

            {/* 20. MOBILE NO. */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>20. MOBILE NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.valueSmall}>{displayOrEmpty(personalInfo.mobileNo)}</Text>
              </View>
            </View>

            {/* 21. E-MAIL ADDRESS */}
            <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.labelCell, styles.w40]}>
                <Text style={styles.labelSmall}>21. E-MAIL ADDRESS (if any)</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.valueSmall}>{displayOrEmpty(personalInfo.emailAddress)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section II: FAMILY BACKGROUND */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
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
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseSurname)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>FIRST NAME</Text>
              </View>
              <View style={[styles.fieldCell, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseFirstName)}
                </Text>
              </View>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
              </View>
              <View style={[styles.fieldCellLast, { width: '12%' }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseNameExtension)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>MIDDLE NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseMiddleName)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>OCCUPATION</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseOccupation)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>EMPLOYER/BUSINESS NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseEmployer)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>BUSINESS ADDRESS</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseBusinessAddress)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>TELEPHONE NO.</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.spouseTelephoneNo)}
                </Text>
              </View>
            </View>

            {/* Father Section */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%', backgroundColor: '#D9D9D9' }]}>
                <Text style={[styles.labelSmall, styles.bold]}>23. FATHER&apos;S SURNAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.fatherSurname)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>FIRST NAME</Text>
              </View>
              <View style={[styles.fieldCell, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.fatherFirstName)}
                </Text>
              </View>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
              </View>
              <View style={[styles.fieldCellLast, { width: '12%' }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.fatherNameExtension)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>MIDDLE NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.fatherMiddleName)}
                </Text>
              </View>
            </View>

            {/* Mother Section */}
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%', backgroundColor: '#D9D9D9' }]}>
                <Text style={[styles.labelSmall, styles.bold]}>24. MOTHER&apos;S MAIDEN NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.motherMaidenSurname)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>SURNAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.motherMaidenSurname)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>FIRST NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.motherFirstName)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, { width: '27%' }]}>
                <Text style={styles.labelSmall}>MIDDLE NAME</Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.value}>
                  {displayOrEmpty(familyBackground.motherMiddleName)}
                </Text>
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
                <View key={index} style={styles.fieldRowCompact}>
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
            <ContinueText align="right" marginTop={2} />
          </View>
        </View>
      </View>

      {/* Section III: EDUCATIONAL BACKGROUND - Full table */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
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
            <View key={level.key} style={[styles.fieldRow, { minHeight: 18 }]}>
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

        {/* Empty padding rows to fill table */}
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={`edu-empty-${index}`} style={[styles.fieldRow, { minHeight: 18 }]}>
            <View style={[styles.tableCell, styles.w15]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCell, styles.w20]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCell, styles.w15]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCell, { width: '6%' }]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCell, { width: '13%' }]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCell, { width: '10%' }]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
            <View style={[styles.tableCellNoBorder, { width: '15%' }]}>
              <Text style={styles.valueSmall}> </Text>
            </View>
          </View>
        ))}

        {/* Continue text for education */}
        <ContinueText align="right" marginTop={2} />
      </View>

      {/* Page footer with signature */}
      <PDSPageFooter pageNumber={1} totalPages={4} showSignature={true} />
    </Page>
  );
}

export default PDSPage1;
