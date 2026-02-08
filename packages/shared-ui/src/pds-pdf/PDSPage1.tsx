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

// Compact address renderer for 2025 format
// Row 1: House/Block/Lot No. | Subdivision/Village | City/Municipality
// Row 2: Street | Barangay | Province
function AddressBlock({
  itemNumber,
  label,
  address,
}: {
  itemNumber: string;
  label: string;
  address: Address;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: colors.borderColor,
        minHeight: 45,
        maxHeight: 50,
      }}>
      <View style={[styles.labelCell, styles.w20]}>
        <Text style={styles.labelSmall}>
          {itemNumber}. {label}
        </Text>
      </View>
      <View style={[styles.fieldCellLast, { flex: 1, padding: 2 }]}>
        {/* Row 1: House/Block/Lot No. | Subdivision/Village | City/Municipality */}
        <View style={[styles.row, { height: 14 }]}>
          <View style={{ flex: 1, paddingRight: 3 }}>
            <Text style={styles.valueSingleLine}>
              {displayOrEmpty(address?.houseNumber)}
            </Text>
            <Text
              style={[styles.labelSmall, styles.center, { fontSize: 4 }]}>
              House/Block/Lot No.
            </Text>
          </View>
          <View style={{ flex: 1, paddingRight: 3 }}>
            <Text style={styles.valueSingleLine}>
              {displayOrEmpty(address?.subdivision)}
            </Text>
            <Text
              style={[styles.labelSmall, styles.center, { fontSize: 4 }]}>
              Subdivision/Village
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.valueSingleLine}>
              {displayOrEmpty(address?.city)}
            </Text>
            <Text
              style={[styles.labelSmall, styles.center, { fontSize: 4 }]}>
              City/Municipality
            </Text>
          </View>
        </View>
        {/* Row 2: Street | Barangay | Province */}
        <View style={[styles.row, { height: 14, marginTop: 2 }]}>
          <View style={{ flex: 1, paddingRight: 3 }}>
            <Text style={styles.valueSingleLine}>
              {displayOrEmpty(address?.street)}
            </Text>
            <Text
              style={[styles.labelSmall, styles.center, { fontSize: 4 }]}>
              Street
            </Text>
          </View>
          <View style={{ flex: 1, paddingRight: 3 }}>
            <Text style={styles.valueSingleLine}>
              {displayOrEmpty(address?.barangay)}
            </Text>
            <Text
              style={[styles.labelSmall, styles.center, { fontSize: 4 }]}>
              Barangay
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.valueSingleLine}>
              {displayOrEmpty(address?.province)}
            </Text>
            <Text
              style={[styles.labelSmall, styles.center, { fontSize: 4 }]}>
              Province
            </Text>
          </View>
        </View>
        {/* ZIP CODE */}
        <View
          style={[
            styles.row,
            {
              height: 10,
              marginTop: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
            },
          ]}>
          <Text style={[styles.labelSmall, { fontSize: 5 }]}>ZIP CODE:</Text>
          <Text
            style={[styles.valueSingleLine, { marginLeft: 3, width: 40 }]}>
            {displayOrEmpty(address?.zipCode)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function PDSPage1({ data }: PDSPage1Props) {
  const { personalInfo, familyBackground, education } = data;

  // Education levels to render in the table
  const educationLevels: {
    key: 'elementary' | 'secondary' | 'vocational' | 'college' | 'graduate';
    label: string;
  }[] = [
    { key: 'elementary', label: 'ELEMENTARY' },
    { key: 'secondary', label: 'SECONDARY' },
    { key: 'vocational', label: 'VOCATIONAL /\nTRADE COURSE' },
    { key: 'college', label: 'COLLEGE' },
    { key: 'graduate', label: 'GRADUATE STUDIES' },
  ];

  // Children rows: minimum 4 to save space for education table
  const childrenRowCount = Math.max(4, familyBackground.children.length);

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Header - CS Form No. 212 / Revised 2025 */}
      <View style={styles.formHeader}>
        <Text style={styles.csFormNumber}>CS Form No. 212</Text>
        <Text style={styles.csFormNumber}>Revised 2025</Text>
      </View>

      {/* Form Title */}
      <Text style={styles.formTitle}>PERSONAL DATA SHEET</Text>

      {/* WARNING Text in RED */}
      <Text style={styles.warningText}>
        WARNING: Any misrepresentation made in the Personal Data Sheet and the
        Work Experience Sheet shall cause the filing of administrative/criminal
        case/s against the person concerned.
      </Text>

      {/* Instructions */}
      <Text style={styles.noteText}>
        READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS)
        BEFORE ACCOMPLISHING THE PDS FORM.
      </Text>

      {/* Print legibly instruction with checkbox example */}
      <View style={[styles.row, styles.marginTop5, { alignItems: 'center' }]}>
        <Text style={styles.labelSmall}>
          Print legibly. Tick appropriate boxes (
        </Text>
        <View style={styles.checkbox} />
        <Text style={styles.labelSmall}>
          ) and use separate sheet if necessary. Indicate N/A if not applicable.
          DO NOT ABBREVIATE.
        </Text>
      </View>

      {/* CS ID No. instruction */}
      <View style={[styles.row, styles.marginTop5]}>
        <Text style={[styles.labelSmall, { flex: 1 }]}>
          1. CS ID No.{' '}
          <Text style={styles.value}>(Do not fill up. For CSC use only)</Text>
        </Text>
      </View>

      {/* Section I: PERSONAL INFORMATION */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>I. PERSONAL INFORMATION</Text>
        </View>

        {/* Item 1: Surname */}
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

        {/* Item 2: First Name | NAME EXTENSION | MIDDLE NAME */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>2. FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCell, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.firstName)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>NAME EXTENSION (JR., SR)</Text>
          </View>
          <View style={[styles.fieldCell, styles.w10]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.nameExtension)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w10]}>
            <Text style={styles.labelSmall}>MIDDLE NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w15]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.middleName)}
            </Text>
          </View>
        </View>

        {/* Item 3: Date of Birth | Item 4: Place of Birth */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>3. DATE OF BIRTH</Text>
            <Text style={[styles.labelSmall, styles.italic]}>(mm/dd/yyyy)</Text>
          </View>
          <View style={[styles.fieldCell, styles.w30]}>
            <Text style={styles.value}>
              {formatDateMMDDYYYY(personalInfo.dateOfBirth)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>4. PLACE OF BIRTH</Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w30]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.placeOfBirth)}
            </Text>
          </View>
        </View>

        {/* Item 5: Sex at Birth | Item 6: Civil Status */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>5. SEX AT BIRTH</Text>
          </View>
          <View style={[styles.fieldCell, styles.w30]}>
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
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>6. CIVIL STATUS</Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w30]}>
            <View style={[styles.row, { flexWrap: 'wrap', gap: 2 }]}>
              <View style={styles.checkboxRow}>
                <Checkbox checked={personalInfo.civilStatus === 'single'} />
                <Text style={styles.labelSmall}>Single</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox checked={personalInfo.civilStatus === 'married'} />
                <Text style={styles.labelSmall}>Married</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox checked={personalInfo.civilStatus === 'widowed'} />
                <Text style={styles.labelSmall}>Widowed</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox checked={personalInfo.civilStatus === 'separated'} />
                <Text style={styles.labelSmall}>Separated</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox checked={personalInfo.civilStatus === 'divorced'} />
                <Text style={styles.labelSmall}>Divorced</Text>
              </View>
              <View style={[styles.row, { alignItems: 'center' }]}>
                <Text style={[styles.labelSmall, { marginRight: 2 }]}>
                  Other/s:
                </Text>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.black,
                    width: 40,
                    minHeight: 8,
                  }}>
                  <Text style={styles.valueSmall}></Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Items 7-12: HEIGHT | WEIGHT | BLOOD TYPE | UMID ID NO. | PAG-IBIG ID NO. | PHILHEALTH NO. (all on one row) */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldCell, { width: '10%' }]}>
            <Text style={styles.labelSmall}>7. HEIGHT (m)</Text>
            <Text style={styles.value}>
              {personalInfo.heightM
                ? parseFloat(String(personalInfo.heightM)).toFixed(2)
                : ''}
            </Text>
          </View>
          <View style={[styles.fieldCell, { width: '10%' }]}>
            <Text style={styles.labelSmall}>8. WEIGHT (kg)</Text>
            <Text style={styles.value}>
              {personalInfo.weightKg
                ? parseFloat(String(personalInfo.weightKg)).toFixed(2)
                : ''}
            </Text>
          </View>
          <View style={[styles.fieldCell, { width: '10%' }]}>
            <Text style={styles.labelSmall}>9. BLOOD TYPE</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.bloodType)}
            </Text>
          </View>
          <View style={[styles.fieldCell, { width: '23%' }]}>
            <Text style={styles.labelSmall}>10. UMID ID NO.</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.gsisNo)}
            </Text>
          </View>
          <View style={[styles.fieldCell, { width: '23%' }]}>
            <Text style={styles.labelSmall}>11. PAG-IBIG ID NO.</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.pagibigNo)}
            </Text>
          </View>
          <View style={[styles.fieldCellLast, { width: '24%' }]}>
            <Text style={styles.labelSmall}>12. PHILHEALTH NO.</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.philhealthNo)}
            </Text>
          </View>
        </View>

        {/* Items 13-15: PhilSys Number (PSN) | TIN NO. | AGENCY EMPLOYEE NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldCell, styles.w33]}>
            <Text style={styles.labelSmall}>13. PhilSys Number (PSN):</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.philsysNo)}
            </Text>
          </View>
          <View style={[styles.fieldCell, styles.w33]}>
            <Text style={styles.labelSmall}>14. TIN NO.</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.tinNo)}
            </Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.labelSmall}>15. AGENCY EMPLOYEE NO.</Text>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.agencyEmployeeNo)}
            </Text>
          </View>
        </View>

        {/* Item 16: Citizenship */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>16. CITIZENSHIP</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <View style={[styles.row, { gap: 15, alignItems: 'center' }]}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  checked={personalInfo.citizenship.type === 'Filipino'}
                />
                <Text style={styles.valueSmall}>Filipino</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox checked={personalInfo.citizenship.type === 'Dual'} />
                <Text style={styles.valueSmall}>Dual Citizenship</Text>
              </View>
              {personalInfo.citizenship.type === 'Dual' && (
                <View
                  style={[
                    styles.row,
                    { marginLeft: 10, alignItems: 'center' },
                  ]}>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      checked={
                        personalInfo.citizenship.details?.includes(
                          'by birth'
                        ) ?? false
                      }
                    />
                    <Text style={styles.valueSmall}>by birth</Text>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      checked={
                        personalInfo.citizenship.details?.includes(
                          'by naturalization'
                        ) ?? false
                      }
                    />
                    <Text style={styles.valueSmall}>by naturalization</Text>
                  </View>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.labelSmall}>Pls. indicate country:</Text>
                <Text
                  style={[
                    styles.valueSmall,
                    { borderBottomWidth: 1, borderBottomColor: 'black' },
                  ]}>
                  {personalInfo.citizenship.type === 'Dual'
                    ? displayOrEmpty(personalInfo.citizenship.details)
                    : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Item 17: RESIDENTIAL ADDRESS (2025 column order) */}
        <AddressBlock
          itemNumber="17"
          label="RESIDENTIAL ADDRESS"
          address={personalInfo.residentialAddress}
        />

        {/* Item 18: PERMANENT ADDRESS (2025 column order) */}
        <AddressBlock
          itemNumber="18"
          label="PERMANENT ADDRESS"
          address={personalInfo.permanentAddress}
        />

        {/* Items 19-20: Telephone No. and Mobile No. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>19. TELEPHONE NO.</Text>
          </View>
          <View style={[styles.fieldCell, styles.w30]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.telephoneNo)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>20. MOBILE NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w30]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.mobileNo)}
            </Text>
          </View>
        </View>

        {/* Item 21: Email Address */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>21. E-MAIL ADDRESS (if any)</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.emailAddress)}
            </Text>
          </View>
        </View>
      </View>

      {/* Section II: FAMILY BACKGROUND */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>II. FAMILY BACKGROUND</Text>
        </View>

        {/* Spouse Section */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>22. SPOUSE&apos;S SURNAME</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseSurname)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseFirstName)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w10]}>
            <Text style={styles.labelSmall}>NAME EXTN.</Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w10]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseNameExtension)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>MIDDLE NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseMiddleName)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>OCCUPATION</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseOccupation)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>EMPLOYER/BUSINESS NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseEmployer)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>BUSINESS ADDRESS</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.spouseBusinessAddress)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
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
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>23. FATHER&apos;S SURNAME</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.fatherSurname)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.fatherFirstName)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w10]}>
            <Text style={styles.labelSmall}>NAME EXTN.</Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w10]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.fatherNameExtension)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
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
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>
              24. MOTHER&apos;S MAIDEN NAME
            </Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.motherMaidenSurname)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.motherFirstName)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>MIDDLE NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(familyBackground.motherMiddleName)}
            </Text>
          </View>
        </View>

        {/* Children Section */}
        <View style={styles.subSectionHeader}>
          <Text>25. NAME OF CHILDREN (Write full name and list all)</Text>
        </View>

        {/* Children header row */}
        <View style={styles.fieldRow}>
          <View style={[styles.tableCellHeader, styles.w70]}>
            <Text style={[styles.labelSmall, styles.center]}>NAME</Text>
          </View>
          <View style={[styles.tableCellHeader, { flex: 1 }]}>
            <Text style={[styles.labelSmall, styles.center]}>
              DATE OF BIRTH (mm/dd/yyyy)
            </Text>
          </View>
        </View>

        {/* Children rows (reduced to max(4, actual count) to save space for education) */}
        {Array.from({ length: childrenRowCount }).map((_, index) => {
          const child = familyBackground.children[index];
          return (
            <View key={index} style={styles.fieldRowCompact}>
              <View style={[styles.tableCell, styles.w70]}>
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
                <Text style={styles.valueSmall}>{level.label}</Text>
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
