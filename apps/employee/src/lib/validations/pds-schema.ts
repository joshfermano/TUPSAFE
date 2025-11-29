import { z } from 'zod';
import { philippineAddressSchema } from './address';

/**
 * Comprehensive Zod Validation Schemas for Personal Data Sheet (PDS)
 * CS Form No. 212 Revised 2025
 *
 * Organized into 8 main sections following the official CSC form structure:
 * I. Personal Information (4 parts)
 * II. Family Background
 * III. Educational Background
 * IV. Civil Service Eligibility
 * V. Work Experience
 * VI. Voluntary Work
 * VII. Learning and Development Interventions
 * VIII. Other Information
 */

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

// Philippine phone number validation (landline and mobile)
const phoneRegex = /^(\+63|0)?[2-9]\d{1,2}-?\d{3}-?\d{4}$/;
const mobileRegex = /^(\+63|0)?9\d{2}-?\d{3}-?\d{4}$/;

// Government ID number formats
const gsisRegex = /^\d{2}-\d{7}-\d{1}$/; // Format: 12-3456789-0
const sssRegex = /^\d{2}-\d{7}-\d{1}$/; // Format: 34-5678901-2
const tinRegex = /^\d{3}-\d{3}-\d{3}-\d{3}$/; // Format: 123-456-789-000
const philhealthRegex = /^\d{2}-\d{9}-\d{1}$/; // Format: 12-345678901-2
const pagibigRegex = /^\d{4}-\d{4}-\d{4}$/; // Format: 1234-5678-9012

// Date validation helpers
const pastDateSchema = z.date().max(new Date(), 'Date cannot be in the future');

const optionalPastDateSchema = z
  .date()
  .max(new Date(), 'Date cannot be in the future')
  .nullable();

// ============================================================================
// SECTION I: PERSONAL INFORMATION
// ============================================================================

/**
 * Part 1: Basic Personal Information
 * Includes name, birth details, physical characteristics, and government IDs
 */
export const personalInfoBasicSchema = z.object({
  // Name fields
  surname: z
    .string()
    .min(1, 'Surname is required')
    .max(50, 'Surname must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-\.ñÑ]+$/, 'Invalid characters in surname'),

  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-\.ñÑ]+$/, 'Invalid characters in first name'),

  middleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-\.ñÑ]*$/, 'Invalid characters in middle name')
    .nullable()
    .optional(),

  nameExtension: z
    .enum(['Jr.', 'Sr.', 'II', 'III', 'IV', 'V', ''])
    .nullable()
    .optional(),

  // Birth information
  dateOfBirth: pastDateSchema.refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 18 && age <= 100;
    },
    { message: 'Age must be between 18 and 100 years' }
  ),

  placeOfBirth: z
    .string()
    .min(1, 'Place of birth is required')
    .max(100, 'Place of birth must not exceed 100 characters'),

  // Personal characteristics
  sex: z.enum(['male', 'female'], {
    required_error: 'Sex is required',
  }),

  civilStatus: z.enum(
    ['single', 'married', 'widowed', 'separated', 'divorced'],
    {
      required_error: 'Civil status is required',
    }
  ),

  // Physical characteristics (optional)
  heightM: z
    .number()
    .min(1.0, 'Height must be at least 1.00 meter')
    .max(2.5, 'Height must not exceed 2.50 meters')
    .nullable()
    .optional(),

  weightKg: z
    .number()
    .min(30, 'Weight must be at least 30 kg')
    .max(200, 'Weight must not exceed 200 kg')
    .nullable()
    .optional(),

  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''])
    .nullable()
    .optional(),

  // Government IDs (all optional but recommended)
  // Using union pattern: empty string OR valid format, then optional/nullable
  gsisNo: z
    .union([
      z.literal(''),
      z.string().regex(gsisRegex, 'Invalid GSIS ID format (XX-XXXXXXX-X)'),
    ])
    .optional()
    .nullable(),

  pagibigNo: z
    .union([
      z.literal(''),
      z
        .string()
        .regex(pagibigRegex, 'Invalid PAG-IBIG format (XXXX-XXXX-XXXX)'),
    ])
    .optional()
    .nullable(),

  philhealthNo: z
    .union([
      z.literal(''),
      z
        .string()
        .regex(philhealthRegex, 'Invalid PhilHealth format (XX-XXXXXXXXX-X)'),
    ])
    .optional()
    .nullable(),

  sssNo: z
    .union([
      z.literal(''),
      z.string().regex(sssRegex, 'Invalid SSS format (XX-XXXXXXX-X)'),
    ])
    .optional()
    .nullable(),

  tinNo: z
    .union([
      z.literal(''),
      z.string().regex(tinRegex, 'Invalid TIN format (XXX-XXX-XXX-XXX)'),
    ])
    .optional()
    .nullable(),

  agencyEmployeeNo: z
    .union([
      z.literal(''),
      z.string().max(50, 'Agency Employee No. must not exceed 50 characters'),
    ])
    .optional()
    .nullable(),

  // Citizenship
  citizenship: z.object({
    type: z.enum(['Filipino', 'Dual'], {
      required_error: 'Citizenship type is required',
    }),
    details: z
      .string()
      .max(100, 'Citizenship details must not exceed 100 characters')
      .optional(),
  }),
});

/**
 * Part 2: Residential Address
 * Uses the existing Philippine address schema
 */
export const residentialAddressSchema = philippineAddressSchema.extend({
  // Add any PDS-specific residential address fields if needed
});

/**
 * Part 3: Permanent Address
 * Uses the existing Philippine address schema
 */
export const permanentAddressSchema = philippineAddressSchema.extend({
  // Add any PDS-specific permanent address fields if needed
});

/**
 * Part 4: Contact Information
 * Using union pattern: empty string OR valid format, then optional/nullable
 */
export const contactInfoSchema = z.object({
  telephoneNo: z
    .union([
      z.literal(''),
      z
        .string()
        .regex(
          phoneRegex,
          'Invalid telephone number format (e.g., +63-2-8123-4567)'
        ),
    ])
    .optional()
    .nullable(),

  mobileNo: z
    .union([
      z.literal(''),
      z
        .string()
        .regex(
          mobileRegex,
          'Invalid mobile number format (e.g., +63-917-123-4567)'
        ),
    ])
    .optional()
    .nullable(),

  emailAddress: z
    .union([
      z.literal(''),
      z
        .string()
        .email('Invalid email address')
        .max(100, 'Email address must not exceed 100 characters'),
    ])
    .optional()
    .nullable(),
});

/**
 * Complete Personal Information Schema (All 4 parts combined)
 */
export const personalInfoSchema = personalInfoBasicSchema
  .merge(
    z.object({
      residentialAddress: residentialAddressSchema,
      permanentAddress: permanentAddressSchema,
    })
  )
  .merge(contactInfoSchema)
  .refine(
    (data) => data.citizenship.type !== 'Dual' || data.citizenship.details,
    {
      message: 'Please specify dual citizenship details',
      path: ['citizenship', 'details'],
    }
  );

// ============================================================================
// SECTION II: FAMILY BACKGROUND
// ============================================================================

/**
 * Spouse Information
 */
const spouseSchema = z.object({
  spouseSurname: z
    .string()
    .max(50, 'Surname must not exceed 50 characters')
    .nullable()
    .optional(),

  spouseFirstName: z
    .string()
    .max(50, 'First name must not exceed 50 characters')
    .nullable()
    .optional(),

  spouseMiddleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .nullable()
    .optional(),

  spouseNameExtension: z
    .enum(['Jr.', 'Sr.', 'II', 'III', 'IV', 'V', ''])
    .nullable()
    .optional(),

  spouseOccupation: z
    .string()
    .max(100, 'Occupation must not exceed 100 characters')
    .nullable()
    .optional(),

  spouseEmployer: z
    .string()
    .max(150, 'Employer name must not exceed 150 characters')
    .nullable()
    .optional(),

  spouseBusinessAddress: z
    .string()
    .max(200, 'Business address must not exceed 200 characters')
    .nullable()
    .optional(),

  spouseTelephoneNo: z
    .union([
      z.literal(''),
      z.string().regex(phoneRegex, 'Invalid telephone number format'),
    ])
    .optional()
    .nullable(),
});

/**
 * Parent Information
 */
const parentSchema = z.object({
  // Father's information
  fatherSurname: z
    .string()
    .max(50, 'Surname must not exceed 50 characters')
    .nullable()
    .optional(),

  fatherFirstName: z
    .string()
    .max(50, 'First name must not exceed 50 characters')
    .nullable()
    .optional(),

  fatherMiddleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .nullable()
    .optional(),

  // Mother's maiden name
  motherMaidenSurname: z
    .string()
    .max(50, 'Surname must not exceed 50 characters')
    .nullable()
    .optional(),

  motherFirstName: z
    .string()
    .max(50, 'First name must not exceed 50 characters')
    .nullable()
    .optional(),

  motherMiddleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .nullable()
    .optional(),
});

/**
 * Child Information
 * Maximum of 12 children as per CSC form
 */
export const childSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters'),

  dateOfBirth: pastDateSchema,
});

/**
 * Complete Family Background Schema
 */
export const familyBackgroundSchema = spouseSchema.merge(parentSchema).merge(
  z.object({
    children: z
      .array(childSchema)
      .max(12, 'Maximum of 12 children allowed')
      .default([]),
  })
);

// ============================================================================
// SECTION III: EDUCATIONAL BACKGROUND
// ============================================================================

/**
 * Education Entry Schema
 * Covers Elementary, Secondary, Vocational, College, and Graduate Studies
 */
export const educationSchema = z
  .object({
    level: z.enum(
      ['elementary', 'secondary', 'vocational', 'college', 'graduate'],
      {
        required_error: 'Education level is required',
      }
    ),

    schoolName: z
      .string()
      .min(1, 'School name is required')
      .max(200, 'School name must not exceed 200 characters'),

    degreeCourse: z
      .string()
      .max(150, 'Degree/Course must not exceed 150 characters')
      .nullable()
      .optional(),

    periodFrom: optionalPastDateSchema,

    periodTo: optionalPastDateSchema,

    highestLevelEarned: z
      .string()
      .max(100, 'Highest level/units earned must not exceed 100 characters')
      .nullable()
      .optional(),

    yearGraduated: z
      .number()
      .int('Year must be a whole number')
      .min(1950, 'Year must be 1950 or later')
      .max(new Date().getFullYear(), 'Year cannot be in the future')
      .nullable()
      .optional(),

    honorsReceived: z
      .string()
      .max(200, 'Scholarship/Honors must not exceed 200 characters')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // If periodFrom is provided, periodTo should be after periodFrom
      if (data.periodFrom && data.periodTo) {
        return data.periodTo >= data.periodFrom;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['periodTo'],
    }
  );

/**
 * Complete Educational Background Schema
 * All levels optional, but at least elementary is typically expected
 */
export const educationalBackgroundSchema = z.object({
  elementary: educationSchema.optional().nullable(),
  secondary: educationSchema.optional().nullable(),
  vocational: educationSchema.optional().nullable(),
  college: educationSchema.optional().nullable(),
  graduate: educationSchema.optional().nullable(),
});

// ============================================================================
// SECTION IV: CIVIL SERVICE ELIGIBILITY
// ============================================================================

/**
 * Civil Service Eligibility Entry Schema
 * Covers Career Service, RA 1080, Driver's License, PRC License, BAR/Board, etc.
 */
export const civilServiceSchema = z.object({
  eligibilityName: z
    .string()
    .min(1, 'Eligibility name is required')
    .max(200, 'Eligibility name must not exceed 200 characters'),

  rating: z
    .number()
    .min(0, 'Rating must be a positive number')
    .max(100, 'Rating must not exceed 100')
    .nullable()
    .optional(),

  dateOfExam: optionalPastDateSchema,

  placeOfExam: z
    .string()
    .max(150, 'Place of examination must not exceed 150 characters')
    .nullable()
    .optional(),

  licenseNo: z
    .string()
    .max(100, 'License number must not exceed 100 characters')
    .nullable()
    .optional(),

  licenseValidityDate: z.date().nullable().optional(),
});

// ============================================================================
// SECTION V: WORK EXPERIENCE
// ============================================================================

/**
 * Work Experience Entry Schema
 * Includes both government and private sector positions
 */
export const workExperienceSchema = z
  .object({
    positionTitle: z
      .string()
      .min(1, 'Position title is required')
      .max(150, 'Position title must not exceed 150 characters'),

    departmentAgency: z
      .string()
      .min(1, 'Department/Agency/Office/Company is required')
      .max(200, 'Department/Agency name must not exceed 200 characters'),

    monthlySalary: z
      .number()
      .min(0, 'Monthly salary must be a positive number')
      .nullable()
      .optional(),

    salaryGrade: z
      .string()
      .max(50, 'Salary grade must not exceed 50 characters')
      .nullable()
      .optional(),

    statusOfAppointment: z
      .string()
      .max(100, 'Status of appointment must not exceed 100 characters')
      .nullable()
      .optional(),

    isGovernment: z.boolean().default(false),

    dateFrom: pastDateSchema,

    dateTo: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      // If dateTo is provided, it should be after dateFrom
      if (data.dateTo) {
        return data.dateTo >= data.dateFrom;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['dateTo'],
    }
  );

// ============================================================================
// SECTION VI: VOLUNTARY WORK
// ============================================================================

/**
 * Voluntary Work Entry Schema
 */
export const voluntaryWorkSchema = z
  .object({
    organizationName: z
      .string()
      .min(1, 'Organization name is required')
      .max(200, 'Organization name must not exceed 200 characters'),

    organizationAddress: z
      .string()
      .max(250, 'Organization address must not exceed 250 characters')
      .nullable()
      .optional(),

    dateFrom: pastDateSchema,

    dateTo: z.date().nullable().optional(),

    numberOfHours: z
      .number()
      .int('Number of hours must be a whole number')
      .min(0, 'Number of hours must be a positive number')
      .nullable()
      .optional(),

    positionNature: z
      .string()
      .max(150, 'Position/Nature of work must not exceed 150 characters')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // If dateTo is provided, it should be after dateFrom
      if (data.dateTo) {
        return data.dateTo >= data.dateFrom;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['dateTo'],
    }
  );

// ============================================================================
// SECTION VII: LEARNING AND DEVELOPMENT INTERVENTIONS
// ============================================================================

/**
 * Training/Seminar Entry Schema
 * Learning and Development (L&D) Interventions
 */
export const trainingSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Training title is required')
      .max(250, 'Training title must not exceed 250 characters'),

    dateFrom: pastDateSchema,

    dateTo: pastDateSchema,

    hours: z
      .number()
      .int('Number of hours must be a whole number')
      .min(0, 'Number of hours must be a positive number')
      .nullable()
      .optional(),

    typeOfLd: z
      .string()
      .max(100, 'Type of L&D must not exceed 100 characters')
      .nullable()
      .optional(),

    conductedBy: z
      .string()
      .max(200, 'Conducted/Sponsored by must not exceed 200 characters')
      .nullable()
      .optional(),
  })
  .refine((data) => data.dateTo >= data.dateFrom, {
    message: 'End date must be after or equal to start date',
    path: ['dateTo'],
  });

// ============================================================================
// SECTION VIII: OTHER INFORMATION
// ============================================================================

/**
 * Special Skills and Hobbies
 */
const skillsSchema = z
  .array(
    z
      .string()
      .min(1, 'Skill/hobby must not be empty')
      .max(100, 'Skill/hobby must not exceed 100 characters')
  )
  .default([]);

/**
 * Non-Academic Distinctions/Recognition
 */
const recognitionSchema = z.object({
  title: z
    .string()
    .min(1, 'Recognition title is required')
    .max(200, 'Recognition title must not exceed 200 characters'),

  year: z
    .number()
    .int('Year must be a whole number')
    .min(1950, 'Year must be 1950 or later')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),

  organization: z
    .string()
    .min(1, 'Organization is required')
    .max(200, 'Organization must not exceed 200 characters'),
});

/**
 * Membership in Association/Organization
 */
const associationSchema = z.object({
  name: z
    .string()
    .min(1, 'Association/Organization name is required')
    .max(200, 'Name must not exceed 200 characters'),

  position: z
    .string()
    .max(100, 'Position must not exceed 100 characters')
    .optional(),

  yearJoined: z
    .number()
    .int('Year must be a whole number')
    .min(1950, 'Year must be 1950 or later')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional(),
});

/**
 * Character References
 * Minimum of 3 references required
 */
const referenceSchema = z.object({
  name: z
    .string()
    .min(1, 'Reference name is required')
    .max(100, 'Name must not exceed 100 characters'),

  address: z
    .string()
    .min(1, 'Address is required')
    .max(250, 'Address must not exceed 250 characters'),

  telephoneNo: z
    .union([
      z.literal(''),
      z.string().regex(phoneRegex, 'Invalid telephone number format'),
    ])
    .optional()
    .nullable(),
});

/**
 * CSC Form Questions (Questions 34-42)
 */
const questionsSchema = z.object({
  // Q34: Have you ever been formally charged?
  Q34_criminal_charged: z.boolean(),
  Q34_criminal_charged_details: z
    .string()
    .max(500, 'Details must not exceed 500 characters')
    .optional(),

  // Q35: Have you ever been convicted?
  Q35_criminal_convicted: z.boolean(),
  Q35_criminal_convicted_details: z
    .string()
    .max(500, 'Details must not exceed 500 characters')
    .optional(),

  // Q36: Have you ever been separated from service?
  Q36_separated_from_service: z.boolean(),
  Q36_separated_from_service_details: z
    .string()
    .max(500, 'Details must not exceed 500 characters')
    .optional(),

  // Q37: Have you ever been a candidate?
  Q37_candidate_for_election: z.boolean(),
  Q37_candidate_for_election_details: z
    .string()
    .max(500, 'Details must not exceed 500 characters')
    .optional(),

  // Q38: Have you resigned from government service?
  Q38_resigned_from_government: z.boolean(),
  Q38_resigned_from_government_details: z
    .string()
    .max(500, 'Details must not exceed 500 characters')
    .optional(),

  // Q39: Have you acquired immigrant status?
  Q39_immigrant_or_acquired_residence: z.boolean(),
  Q39_immigrant_or_acquired_residence_details: z
    .string()
    .max(500, 'Details must not exceed 500 characters')
    .optional(),

  // Q40: Are you a member of indigenous group?
  Q40_indigenous_group: z.boolean(),
  Q40_indigenous_group_details: z
    .string()
    .max(200, 'Details must not exceed 200 characters')
    .optional(),

  // Q41: Are you a person with disability?
  Q41_disabled: z.boolean(),
  Q41_disabled_details: z
    .string()
    .max(200, 'Details must not exceed 200 characters')
    .optional(),

  // Q42: Are you a solo parent?
  Q42_solo_parent: z.boolean(),
  Q42_solo_parent_details: z
    .string()
    .max(200, 'Details must not exceed 200 characters')
    .optional(),
});

/**
 * Complete Other Information Schema
 */
export const otherInformationSchema = z
  .object({
    skills: skillsSchema,
    recognitions: z.array(recognitionSchema).default([]),
    associations: z.array(associationSchema).default([]),
    questions: questionsSchema,
    references: z
      .array(referenceSchema)
      .min(3, 'You must provide at least 3 character references')
      .max(5, 'Maximum of 5 character references allowed'),
  })
  .refine(
    (data) => {
      // If Q34 is true, details must be provided
      if (data.questions.Q34_criminal_charged) {
        return !!data.questions.Q34_criminal_charged_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q34_criminal_charged_details'],
    }
  )
  .refine(
    (data) => {
      // If Q35 is true, details must be provided
      if (data.questions.Q35_criminal_convicted) {
        return !!data.questions.Q35_criminal_convicted_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q35_criminal_convicted_details'],
    }
  )
  .refine(
    (data) => {
      // If Q36 is true, details must be provided
      if (data.questions.Q36_separated_from_service) {
        return !!data.questions.Q36_separated_from_service_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q36_separated_from_service_details'],
    }
  )
  .refine(
    (data) => {
      // If Q37 is true, details must be provided
      if (data.questions.Q37_candidate_for_election) {
        return !!data.questions.Q37_candidate_for_election_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q37_candidate_for_election_details'],
    }
  )
  .refine(
    (data) => {
      // If Q38 is true, details must be provided
      if (data.questions.Q38_resigned_from_government) {
        return !!data.questions.Q38_resigned_from_government_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q38_resigned_from_government_details'],
    }
  )
  .refine(
    (data) => {
      // If Q39 is true, details must be provided
      if (data.questions.Q39_immigrant_or_acquired_residence) {
        return !!data.questions.Q39_immigrant_or_acquired_residence_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q39_immigrant_or_acquired_residence_details'],
    }
  )
  .refine(
    (data) => {
      // If Q40 is true, details must be provided
      if (data.questions.Q40_indigenous_group) {
        return !!data.questions.Q40_indigenous_group_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q40_indigenous_group_details'],
    }
  )
  .refine(
    (data) => {
      // If Q41 is true, details must be provided
      if (data.questions.Q41_disabled) {
        return !!data.questions.Q41_disabled_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q41_disabled_details'],
    }
  )
  .refine(
    (data) => {
      // If Q42 is true, details must be provided
      if (data.questions.Q42_solo_parent) {
        return !!data.questions.Q42_solo_parent_details;
      }
      return true;
    },
    {
      message: 'Please provide details',
      path: ['questions', 'Q42_solo_parent_details'],
    }
  );

// ============================================================================
// COMPLETE PDS SCHEMA
// ============================================================================

/**
 * Complete Personal Data Sheet Schema
 * Combines all 8 sections into a comprehensive form
 */
export const completePdsSchema = z.object({
  // Section I: Personal Information
  personalInfo: personalInfoSchema,

  // Section II: Family Background
  family: familyBackgroundSchema,

  // Section III: Educational Background
  education: educationalBackgroundSchema,

  // Section IV: Civil Service Eligibility
  eligibility: z.array(civilServiceSchema).default([]),

  // Section V: Work Experience
  workExperience: z.array(workExperienceSchema).default([]),

  // Section VI: Voluntary Work
  voluntaryWork: z.array(voluntaryWorkSchema).default([]),

  // Section VII: Learning and Development
  learningDevelopment: z.array(trainingSchema).default([]),

  // Section VIII: Other Information
  otherInfo: otherInformationSchema,
});

// ============================================================================
// STEP-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Citizenship schema for step validation
 */
const citizenshipSchema = z.object({
  type: z.enum(['Filipino', 'Dual'], {
    required_error: 'Citizenship type is required',
  }),
  details: z
    .string()
    .max(100, 'Citizenship details must not exceed 100 characters')
    .optional(),
});

/**
 * Step 1: Personal Basic (Required fields only)
 * Used for validating the minimum required personal information
 */
export const step1RequiredSchema = z.object({
  surname: z
    .string()
    .min(1, 'Surname is required')
    .max(50, 'Surname must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-\.ñÑ]+$/, 'Invalid characters in surname'),

  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s\-\.ñÑ]+$/, 'Invalid characters in first name'),

  dateOfBirth: z
    .date({ required_error: 'Date of birth is required' })
    .max(new Date(), 'Date cannot be in the future')
    .refine(
      (date) => {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 18 && age <= 100;
      },
      { message: 'Age must be between 18 and 100 years' }
    ),

  placeOfBirth: z
    .string()
    .min(1, 'Place of birth is required')
    .max(100, 'Place of birth must not exceed 100 characters'),

  sex: z.enum(['male', 'female'], {
    required_error: 'Sex is required',
  }),

  civilStatus: z.enum(
    ['single', 'married', 'widowed', 'separated', 'divorced'],
    {
      required_error: 'Civil status is required',
    }
  ),

  citizenship: citizenshipSchema,
});

/**
 * Step 2: Addresses Schema
 * Optional but validated if provided
 */
export const step2AddressSchema = z.object({
  residentialAddress: residentialAddressSchema.optional(),
  permanentAddress: permanentAddressSchema.optional(),
});

/**
 * Step 3: Contact Information Schema
 * Optional but validated if provided
 */
export const step3ContactSchema = contactInfoSchema;

/**
 * Step 4: Family Background Schema
 * Optional but validated if provided
 */
export const step4FamilySchema = familyBackgroundSchema;

/**
 * Step 5: Educational Background Schema
 * Optional but validated if provided
 */
export const step5EducationSchema = educationalBackgroundSchema;

/**
 * Step 6: Civil Service Eligibility Schema
 * Optional array but validated if provided
 */
export const step6EligibilitySchema = z.array(civilServiceSchema).default([]);

/**
 * Step 7: Work Experience Schema
 * Optional array but validated if provided
 */
export const step7WorkExperienceSchema = z
  .array(workExperienceSchema)
  .default([]);

/**
 * Step 8: Voluntary Work Schema
 * Optional array but validated if provided
 */
export const step8VoluntaryWorkSchema = z
  .array(voluntaryWorkSchema)
  .default([]);

/**
 * Step 9: Learning and Development Schema
 * Optional array but validated if provided
 */
export const step9TrainingSchema = z.array(trainingSchema).default([]);

/**
 * Step 10: Other Information Schema
 * Required with minimum 3 references
 */
export const step10OtherInfoSchema = otherInformationSchema;

/**
 * Step validators object for use in form navigation
 * Maps step index to corresponding validation schema
 */
export const stepValidators = {
  0: step1RequiredSchema, // Personal Basic (required)
  1: step2AddressSchema, // Addresses (optional but validated)
  2: step3ContactSchema, // Contact (optional but validated)
  3: step4FamilySchema, // Family (optional but validated)
  4: step5EducationSchema, // Education (optional but validated)
  5: step6EligibilitySchema, // Eligibility (optional array)
  6: step7WorkExperienceSchema, // Work Experience (optional array)
  7: step8VoluntaryWorkSchema, // Voluntary Work (optional array)
  8: step9TrainingSchema, // Training (optional array)
  9: step10OtherInfoSchema, // Other Info (required references)
} as const;

/**
 * Type for step validator keys
 */
export type StepIndex = keyof typeof stepValidators;

/**
 * Validate a specific step's data
 * @param stepIndex - The step index (0-9)
 * @param data - The data to validate for that step
 * @returns Object with success boolean and optional errors
 */
export function validateStep(
  stepIndex: StepIndex,
  data: unknown
): { success: boolean; errors?: z.ZodError } {
  const validator = stepValidators[stepIndex];
  if (!validator) {
    return { success: false };
  }

  const result = validator.safeParse(data);
  if (result.success) {
    return { success: true };
  }
  return { success: false, errors: result.error };
}

/**
 * Check if a step is required
 * @param stepIndex - The step index (0-9)
 * @returns boolean indicating if the step has required fields
 */
export function isStepRequired(stepIndex: StepIndex): boolean {
  // Only step 0 (Personal Basic) and step 9 (Other Info with references) are required
  return stepIndex === 0 || stepIndex === 9;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type PersonalInfoBasic = z.infer<typeof personalInfoBasicSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type FamilyBackground = z.infer<typeof familyBackgroundSchema>;
export type Child = z.infer<typeof childSchema>;
export type Education = z.infer<typeof educationSchema>;
export type EducationalBackground = z.infer<typeof educationalBackgroundSchema>;
export type CivilService = z.infer<typeof civilServiceSchema>;
export type WorkExperience = z.infer<typeof workExperienceSchema>;
export type VoluntaryWork = z.infer<typeof voluntaryWorkSchema>;
export type Training = z.infer<typeof trainingSchema>;
export type OtherInformation = z.infer<typeof otherInformationSchema>;
export type Recognition = z.infer<typeof recognitionSchema>;
export type Association = z.infer<typeof associationSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type CompletePdsData = z.infer<typeof completePdsSchema>;

// Step-specific types
export type Step1Data = z.infer<typeof step1RequiredSchema>;
export type Step2Data = z.infer<typeof step2AddressSchema>;
export type Step3Data = z.infer<typeof step3ContactSchema>;
export type Step4Data = z.infer<typeof step4FamilySchema>;
export type Step5Data = z.infer<typeof step5EducationSchema>;
export type Step6Data = z.infer<typeof step6EligibilitySchema>;
export type Step7Data = z.infer<typeof step7WorkExperienceSchema>;
export type Step8Data = z.infer<typeof step8VoluntaryWorkSchema>;
export type Step9Data = z.infer<typeof step9TrainingSchema>;
export type Step10Data = z.infer<typeof step10OtherInfoSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an empty PDS data object with default values
 */
export function createEmptyPds(): Partial<CompletePdsData> {
  return {
    personalInfo: {
      surname: '',
      firstName: '',
      middleName: null,
      nameExtension: null,
      dateOfBirth: new Date(),
      placeOfBirth: '',
      sex: 'male',
      civilStatus: 'single',
      heightM: null,
      weightKg: null,
      bloodType: null,
      gsisNo: null,
      pagibigNo: null,
      philhealthNo: null,
      sssNo: null,
      tinNo: null,
      agencyEmployeeNo: null,
      citizenship: {
        type: 'Filipino',
      },
      residentialAddress: {
        houseNumber: '',
        streetName: '',
        subdivision: '',
        barangay: '',
        cityMunicipality: '',
        province: '',
        zipCode: '',
        region: '',
      },
      permanentAddress: {
        houseNumber: '',
        streetName: '',
        subdivision: '',
        barangay: '',
        cityMunicipality: '',
        province: '',
        zipCode: '',
        region: '',
      },
      telephoneNo: null,
      mobileNo: null,
      emailAddress: null,
    },
    family: {
      spouseSurname: null,
      spouseFirstName: null,
      spouseMiddleName: null,
      spouseNameExtension: null,
      spouseOccupation: null,
      spouseEmployer: null,
      spouseBusinessAddress: null,
      spouseTelephoneNo: null,
      fatherSurname: null,
      fatherFirstName: null,
      fatherMiddleName: null,
      motherMaidenSurname: null,
      motherFirstName: null,
      motherMiddleName: null,
      children: [],
    },
    education: {
      elementary: null,
      secondary: null,
      vocational: null,
      college: null,
      graduate: null,
    },
    eligibility: [],
    workExperience: [],
    voluntaryWork: [],
    learningDevelopment: [],
    otherInfo: {
      skills: [],
      recognitions: [],
      associations: [],
      questions: {
        Q34_criminal_charged: false,
        Q35_criminal_convicted: false,
        Q36_separated_from_service: false,
        Q37_candidate_for_election: false,
        Q38_resigned_from_government: false,
        Q39_immigrant_or_acquired_residence: false,
        Q40_indigenous_group: false,
        Q41_disabled: false,
        Q42_solo_parent: false,
      },
      references: [],
    },
  };
}

/**
 * Validate a specific PDS section
 * @param section - The section key to validate
 * @param data - The data to validate
 * @returns boolean indicating if the section is valid
 */
export function validatePdsSection(
  section: keyof CompletePdsData,
  data: unknown
): boolean {
  try {
    switch (section) {
      case 'personalInfo':
        personalInfoSchema.parse(data);
        return true;
      case 'family':
        familyBackgroundSchema.parse(data);
        return true;
      case 'education':
        educationalBackgroundSchema.parse(data);
        return true;
      case 'eligibility':
        z.array(civilServiceSchema).parse(data);
        return true;
      case 'workExperience':
        z.array(workExperienceSchema).parse(data);
        return true;
      case 'voluntaryWork':
        z.array(voluntaryWorkSchema).parse(data);
        return true;
      case 'learningDevelopment':
        z.array(trainingSchema).parse(data);
        return true;
      case 'otherInfo':
        otherInformationSchema.parse(data);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Calculate section completion progress
 * @param data - Partial PDS data
 * @returns Record of section names to completion percentage (0-100)
 */
export function getPdsSectionProgress(
  data: Partial<CompletePdsData>
): Record<string, number> {
  const progress: Record<string, number> = {};

  // Personal Info (required fields)
  if (data.personalInfo) {
    const requiredFields = [
      'surname',
      'firstName',
      'dateOfBirth',
      'placeOfBirth',
      'sex',
      'civilStatus',
    ];
    const addressFields = ['barangay', 'cityMunicipality', 'province'];

    const personalFieldsFilled = requiredFields.filter(
      (field) => !!data.personalInfo?.[field as keyof PersonalInfo]
    ).length;

    const residentialFilled = addressFields.filter(
      (field) =>
        !!data.personalInfo?.residentialAddress?.[
          field as keyof typeof data.personalInfo.residentialAddress
        ]
    ).length;

    const permanentFilled = addressFields.filter(
      (field) =>
        !!data.personalInfo?.permanentAddress?.[
          field as keyof typeof data.personalInfo.permanentAddress
        ]
    ).length;

    const totalRequiredFields =
      requiredFields.length + addressFields.length * 2;
    const totalFilled =
      personalFieldsFilled + residentialFilled + permanentFilled;

    progress.personalInfo = Math.round(
      (totalFilled / totalRequiredFields) * 100
    );
  } else {
    progress.personalInfo = 0;
  }

  // Family Background (all optional, so check if any field is filled)
  if (data.family) {
    const familyFields = Object.entries(data.family).filter(
      ([key, value]) => key !== 'children' && value !== null && value !== ''
    );
    const childrenCount = data.family.children?.length || 0;
    progress.family = familyFields.length > 0 || childrenCount > 0 ? 100 : 0;
  } else {
    progress.family = 0;
  }

  // Education (at least elementary expected)
  if (data.education) {
    const levels = Object.values(data.education).filter((edu) => edu !== null);
    progress.education = levels.length > 0 ? 100 : 0;
  } else {
    progress.education = 0;
  }

  // Eligibility (optional)
  progress.eligibility =
    data.eligibility && data.eligibility.length > 0 ? 100 : 0;

  // Work Experience (optional)
  progress.workExperience =
    data.workExperience && data.workExperience.length > 0 ? 100 : 0;

  // Voluntary Work (optional)
  progress.voluntaryWork =
    data.voluntaryWork && data.voluntaryWork.length > 0 ? 100 : 0;

  // Learning & Development (optional)
  progress.learningDevelopment =
    data.learningDevelopment && data.learningDevelopment.length > 0 ? 100 : 0;

  // Other Info (requires at least 3 references)
  if (data.otherInfo) {
    const hasRequiredReferences = (data.otherInfo.references?.length || 0) >= 3;
    progress.otherInfo = hasRequiredReferences ? 100 : 0;
  } else {
    progress.otherInfo = 0;
  }

  return progress;
}

/**
 * Calculate overall PDS completion percentage
 * @param data - Partial PDS data
 * @returns Completion percentage (0-100)
 */
export function getOverallPdsProgress(data: Partial<CompletePdsData>): number {
  const sectionProgress = getPdsSectionProgress(data);
  const sections = Object.values(sectionProgress);
  const total = sections.reduce((sum, progress) => sum + progress, 0);
  return Math.round(total / sections.length);
}

/**
 * Check if PDS is ready for submission
 * @param data - Complete PDS data
 * @returns boolean indicating if PDS meets minimum requirements
 */
export function isPdsReadyForSubmission(
  data: Partial<CompletePdsData>
): boolean {
  try {
    // Validate required sections
    if (!data.personalInfo) return false;
    if (!data.otherInfo) return false;
    if ((data.otherInfo.references?.length || 0) < 3) return false;

    // Validate personal info is complete
    personalInfoSchema.parse(data.personalInfo);

    // Validate other info is complete
    otherInformationSchema.parse(data.otherInfo);

    return true;
  } catch {
    return false;
  }
}
