/**
 * Type definitions for PDS PDF generation
 * Matches the CS Form No. 212 (Revised 2025) structure
 */

// Address type
export interface Address {
  houseNumber?: string | null;
  street?: string | null;
  subdivision?: string | null;
  barangay?: string | null;
  city?: string | null;
  province?: string | null;
  zipCode?: string | null;
}

// Personal Information
export interface PersonalInfo {
  surname: string;
  firstName: string;
  middleName?: string | null;
  nameExtension?: string | null;
  dateOfBirth: Date | string;
  placeOfBirth: string;
  sex: 'male' | 'female';
  civilStatus: 'single' | 'married' | 'widowed' | 'separated' | 'divorced';
  heightM?: number | null;
  weightKg?: number | null;
  bloodType?: string | null;
  gsisNo?: string | null;
  pagibigNo?: string | null;
  philhealthNo?: string | null;
  sssNo?: string | null;
  tinNo?: string | null;
  agencyEmployeeNo?: string | null;
  philsysNo?: string | null; // PhilSys Number (PSN) - CS Form 212 Item 13
  citizenship: {
    type: 'Filipino' | 'Dual';
    details?: string;
  };
  residentialAddress: Address;
  permanentAddress: Address;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  emailAddress?: string | null;
}

// Family Background
export interface FamilyBackground {
  // Spouse
  spouseSurname?: string | null;
  spouseFirstName?: string | null;
  spouseMiddleName?: string | null;
  spouseNameExtension?: string | null;
  spouseOccupation?: string | null;
  spouseEmployer?: string | null;
  spouseBusinessAddress?: string | null;
  spouseTelephoneNo?: string | null;
  // Father
  fatherSurname?: string | null;
  fatherFirstName?: string | null;
  fatherMiddleName?: string | null;
  fatherNameExtension?: string | null;
  // Mother
  motherMaidenSurname?: string | null;
  motherFirstName?: string | null;
  motherMiddleName?: string | null;
  // Children
  children: Child[];
}

export interface Child {
  fullName: string;
  dateOfBirth: Date | string;
}

// Education
export interface Education {
  level: 'elementary' | 'secondary' | 'vocational' | 'college' | 'graduate';
  schoolName: string;
  degreeCourse?: string | null;
  periodFrom?: Date | string | null;
  periodTo?: Date | string | null;
  highestLevelEarned?: string | null;
  yearGraduated?: number | null;
  honorsReceived?: string | null;
}

// Civil Service Eligibility
export interface CivilServiceEligibility {
  eligibilityName: string;
  rating?: number | null;
  dateOfExam?: Date | string | null;
  placeOfExam?: string | null;
  licenseNo?: string | null;
  licenseValidityDate?: Date | string | null;
}

// Work Experience
export interface WorkExperience {
  dateFrom: Date | string;
  dateTo?: Date | string | null;
  positionTitle: string;
  departmentAgency: string;
  monthlySalary?: number | null;
  salaryGrade?: string | null;
  statusOfAppointment?: string | null;
  isGovernment: boolean;
}

// Voluntary Work
export interface VoluntaryWork {
  organizationName: string;
  organizationAddress?: string | null;
  dateFrom: Date | string;
  dateTo?: Date | string | null;
  numberOfHours?: number | null;
  positionNature?: string | null;
}

// Training/Learning & Development
export interface Training {
  title: string;
  dateFrom: Date | string;
  dateTo: Date | string;
  hours?: number | null;
  typeOfLd?: string | null;
  conductedBy?: string | null;
}

// Recognition/Distinction
export interface Recognition {
  title: string;
  year: number;
  organization: string;
}

// Association/Organization Membership
export interface Association {
  name: string;
  position?: string;
  yearJoined?: number;
}

// Reference
export interface Reference {
  name: string;
  address: string;
  telephoneNo?: string;
}

// Questions (34-42) — CS Form No. 212 Revised 2025
export interface PDSQuestions {
  // Q34: Related by consanguinity/affinity to appointing authority
  Q34_related_to_authority: boolean;
  Q34_related_to_authority_details?: string;
  // Q35a: Found guilty of any administrative offense
  Q35a_admin_offense: boolean;
  Q35a_admin_offense_details?: string;
  // Q35b: Criminally charged before any court
  Q35b_criminal_charged: boolean;
  Q35b_criminal_charged_details?: string;
  // Q36: Convicted of any crime or violation
  Q36_convicted_of_crime: boolean;
  Q36_convicted_of_crime_details?: string;
  // Q37: Separated from service
  Q37_separated_from_service: boolean;
  Q37_separated_from_service_details?: string;
  // Q38a: Candidate in national/local election
  Q38a_candidate_for_election: boolean;
  Q38a_candidate_for_election_details?: string;
  // Q38b: Resigned from gov't to campaign
  Q38b_resigned_to_campaign: boolean;
  Q38b_resigned_to_campaign_details?: string;
  // Q39: Acquired immigrant/permanent resident status
  Q39_immigrant_status: boolean;
  Q39_immigrant_status_details?: string;
  // Q40a: Member of indigenous group
  Q40a_indigenous_group: boolean;
  Q40a_indigenous_group_details?: string;
  // Q40b: Person with disability
  Q40b_disabled: boolean;
  Q40b_disabled_details?: string;
  // Q40c: Solo parent
  Q40c_solo_parent: boolean;
  Q40c_solo_parent_details?: string;

  // Backward compatibility: old field names from existing submissions (optional)
  Q34_criminal_charged?: boolean;
  Q34_criminal_charged_details?: string;
  Q35_criminal_convicted?: boolean;
  Q35_criminal_convicted_details?: string;
  Q36_separated_from_service?: boolean;
  Q36_separated_from_service_details?: string;
  Q37_candidate_for_election?: boolean;
  Q37_candidate_for_election_details?: string;
  Q38_resigned_from_government?: boolean;
  Q38_resigned_from_government_details?: string;
  Q39_immigrant_or_acquired_residence?: boolean;
  Q39_immigrant_or_acquired_residence_details?: string;
  Q40_indigenous_group?: boolean;
  Q40_indigenous_group_details?: string;
  Q41_disabled?: boolean;
  Q41_disabled_details?: string;
  Q42_solo_parent?: boolean;
  Q42_solo_parent_details?: string;
}

// Government ID for signature section
export interface GovernmentID {
  idType?: string | null;
  idNumber?: string | null;
  dateIssued?: Date | string | null;
  placeIssued?: string | null;
}

// Complete PDS Data structure
export interface PDSData {
  // Submission metadata
  id: string;
  submittedAt?: Date | string | null;
  version?: number;

  // Section I: Personal Information
  personalInfo: PersonalInfo;

  // Section II: Family Background
  familyBackground: FamilyBackground;

  // Section III: Educational Background
  education: {
    elementary?: Education | null;
    secondary?: Education | null;
    vocational?: Education | null;
    college?: Education | null;
    graduate?: Education | null;
  };

  // Section IV: Civil Service Eligibility
  civilServiceEligibilities: CivilServiceEligibility[];

  // Section V: Work Experience
  workExperiences: WorkExperience[];

  // Section VI: Voluntary Work
  voluntaryWorks: VoluntaryWork[];

  // Section VII: Learning & Development
  trainings: Training[];

  // Section VIII: Other Information
  skills: string[];
  recognitions: Recognition[];
  associations: Association[];

  // Questions 34-42
  questions: PDSQuestions;

  // References
  references: Reference[];

  // Government ID for signature
  governmentId?: GovernmentID;

  // Photo URL (optional)
  photoUrl?: string | null;
}
