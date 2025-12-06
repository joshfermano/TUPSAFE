/**
 * PDS Page 1 - Personal Information & Family Background
 * CS Form No. 212 (Revised 2025)
 *
 * Contains:
 * - Form header
 * - Section I: Personal Information
 * - Section II: Family Background
 * - Section III: Children (if space permits, otherwise continues on page 2)
 */

import { Page, View, Text } from '@react-pdf/renderer';
import {
  styles,
  colors,
  formatDateMMDDYYYY,
  displayOrEmpty,
} from './PDSStyles';
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
        {checked && <Text style={styles.checkMark}>✓</Text>}
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
  const { personalInfo, familyBackground } = data;

  return (
    <Page size="LEGAL" style={styles.page}>
      {/* Header */}
      <View style={styles.formHeader}>
        <Text style={styles.csFormNumber}>CS Form No. 212</Text>
        <Text style={styles.csFormNumber}>Revised 2025</Text>
      </View>

      <Text style={styles.formTitle}>PERSONAL DATA SHEET</Text>
      <Text style={styles.formSubtitle}>
        WARNING: Any misrepresentation made in the Personal Data Sheet and the
        Work Experience Sheet shall cause the filing of administrative/criminal
        case/s against the person concerned.
      </Text>
      <Text style={styles.noteText}>
        READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS)
        BEFORE ACCOMPLISHING THE PDS FORM.
      </Text>

      {/* Print legibly instruction */}
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

      <View style={[styles.row, styles.marginTop5]}>
        <Text style={[styles.labelSmall, { flex: 1 }]}>
          1. CS ID No.{' '}
          <Text style={styles.value}>(Do not fill up. For CSC use only)</Text>
        </Text>
      </View>

      {/* Section I: Personal Information */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>I. PERSONAL INFORMATION</Text>
        </View>

        {/* Row 1: Name */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>2. SURNAME</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.surname)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>FIRST NAME</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.firstName)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w10]}>
            <Text style={styles.labelSmall}>NAME EXTN.</Text>
            <Text style={[styles.labelSmall, styles.italic]}>
              (JR., SR, etc.)
            </Text>
          </View>
          <View style={[styles.fieldCellLast, styles.w10]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.nameExtension)}
            </Text>
          </View>
        </View>

        {/* Row 2: Middle Name */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>MIDDLE NAME</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.middleName)}
            </Text>
          </View>
        </View>

        {/* Field 3: Date of Birth (standalone) */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>3. DATE OF BIRTH</Text>
            <Text style={[styles.labelSmall, styles.italic]}>(mm/dd/yyyy)</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {formatDateMMDDYYYY(personalInfo.dateOfBirth)}
            </Text>
          </View>
        </View>

        {/* Row 4: Place of Birth */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>4. PLACE OF BIRTH</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.placeOfBirth)}
            </Text>
          </View>
        </View>

        {/* Field 5: Sex */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>5. SEX</Text>
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

        {/* Field 6: Civil Status */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>6. CIVIL STATUS</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <View style={styles.row}>
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
            </View>
          </View>
        </View>

        {/* Field 7: Height */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>7. HEIGHT (m)</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {personalInfo.heightM ? personalInfo.heightM.toFixed(2) : ''}
            </Text>
          </View>
        </View>

        {/* Field 8: Weight */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>8. WEIGHT (kg)</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {personalInfo.weightKg ? personalInfo.weightKg.toString() : ''}
            </Text>
          </View>
        </View>

        {/* Field 9: Blood Type */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>9. BLOOD TYPE</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.bloodType)}
            </Text>
          </View>
        </View>

        {/* Field 10: GSIS ID NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>10. GSIS ID NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.gsisNo)}
            </Text>
          </View>
        </View>

        {/* Field 11: PAG-IBIG ID NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>11. PAG-IBIG ID NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.pagibigNo)}
            </Text>
          </View>
        </View>

        {/* Field 12: PHILHEALTH NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>12. PHILHEALTH NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.philhealthNo)}
            </Text>
          </View>
        </View>

        {/* Field 13: SSS NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>13. SSS NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.sssNo)}
            </Text>
          </View>
        </View>

        {/* Field 14: TIN NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>14. TIN NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.tinNo)}
            </Text>
          </View>
        </View>

        {/* Field 15: Agency Employee No. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>15. AGENCY EMPLOYEE NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.value}>
              {displayOrEmpty(personalInfo.agencyEmployeeNo)}
            </Text>
          </View>
        </View>

        {/* Field 16: CITIZENSHIP (separate row after Field 15) */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w20]}>
            <Text style={styles.labelSmall}>16. CITIZENSHIP</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <View style={[styles.row, { gap: 15 }]}>
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
                <View style={[styles.row, { marginLeft: 10 }]}>
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
            </View>
          </View>
        </View>

        {personalInfo.citizenship.type === 'Dual' &&
          personalInfo.citizenship.details && (
            <View style={styles.fieldRow}>
              <View style={[styles.labelCell, styles.w20]}>
                <Text style={styles.labelSmall}>
                  If holder of dual citizenship, please indicate country:
                </Text>
              </View>
              <View style={[styles.fieldCellLast, { flex: 1 }]}>
                <Text style={styles.valueSmall}>
                  {displayOrEmpty(personalInfo.citizenship.details)}
                </Text>
              </View>
            </View>
          )}

        {/* Field 17: RESIDENTIAL ADDRESS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.labelSmall}>17. RESIDENTIAL ADDRESS</Text>
        </View>

        {/* House/Block/Lot No. and Street */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>House/Block/Lot No.</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.houseNumber)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Street</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.street)}
            </Text>
          </View>
        </View>

        {/* Subdivision/Village and Barangay */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Subdivision/Village</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.subdivision)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Barangay</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.barangay)}
            </Text>
          </View>
        </View>

        {/* City/Municipality, Province, ZIP CODE */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>City/Municipality</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.city)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>Province</Text>
          </View>
          <View style={[styles.fieldCell, styles.w20]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.province)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w10]}>
            <Text style={styles.labelSmall}>ZIP CODE</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.residentialAddress?.zipCode)}
            </Text>
          </View>
        </View>

        {/* Field 18: PERMANENT ADDRESS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.labelSmall}>18. PERMANENT ADDRESS</Text>
        </View>

        {/* House/Block/Lot No. and Street */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>House/Block/Lot No.</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.houseNumber)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Street</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.street)}
            </Text>
          </View>
        </View>

        {/* Subdivision/Village and Barangay */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Subdivision/Village</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.subdivision)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>Barangay</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.barangay)}
            </Text>
          </View>
        </View>

        {/* City/Municipality, Province, ZIP CODE */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>City/Municipality</Text>
          </View>
          <View style={[styles.fieldCell, styles.w25]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.city)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w15]}>
            <Text style={styles.labelSmall}>Province</Text>
          </View>
          <View style={[styles.fieldCell, styles.w20]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.province)}
            </Text>
          </View>
          <View style={[styles.labelCell, styles.w10]}>
            <Text style={styles.labelSmall}>ZIP CODE</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.permanentAddress?.zipCode)}
            </Text>
          </View>
        </View>

        {/* Field 19: TELEPHONE NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>19. TELEPHONE NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.telephoneNo)}
            </Text>
          </View>
        </View>

        {/* Field 20: MOBILE NO. */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>20. MOBILE NO.</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.mobileNo)}
            </Text>
          </View>
        </View>

        {/* Field 21: E-MAIL ADDRESS (if any) */}
        <View style={styles.fieldRow}>
          <View style={[styles.labelCell, styles.w25]}>
            <Text style={styles.labelSmall}>21. E-MAIL ADDRESS (if any)</Text>
          </View>
          <View style={[styles.fieldCellLast, { flex: 1 }]}>
            <Text style={styles.valueSmall}>
              {displayOrEmpty(personalInfo.emailAddress)}
            </Text>
          </View>
        </View>
      </View>

      {/* Section II: Family Background */}
      <View style={[styles.borderedSection, styles.marginTop5]}>
        <View style={styles.sectionHeader}>
          <Text>22-25. II. FAMILY BACKGROUND</Text>
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
            <Text style={styles.labelSmall}>24. MOTHER&apos;S MAIDEN NAME</Text>
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

        {/* Children rows (show up to 12, minimum 4 empty rows) */}
        {Array.from({
          length: Math.max(4, familyBackground.children.length),
        }).map((_, index) => {
          const child = familyBackground.children[index];
          return (
            <View key={index} style={styles.fieldRow}>
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
      </View>

      {/* Page footer */}
      <View style={styles.pageNumber}>
        <Text style={styles.noteText}>
          CS FORM 212 (Revised 2025), Page 1 of 4
        </Text>
      </View>
    </Page>
  );
}

export default PDSPage1;
