/**
 * PDS template filling module — barrel index (types + pure constants only).
 *
 * IMPORTANT: This barrel must NOT re-export anything that transitively imports
 * `pdf-lib`.  Turbopack / Next.js dev server resolves the entire module graph
 * of every barrel export, so a single runtime re-export of `fillPDS` or
 * `addOverflowPages` causes `pdf-lib` to be required at page-load time.
 *
 * Runtime entry points (fillPDS, addOverflowPages, PDS_TEMPLATE_CONFIG) are
 * accessible via deep subpath imports:
 *
 *   // Dynamic import in hooks (deferred until user triggers PDF generation):
 *   const { fillPDS } = await import('@tupsafe/shared-ui/pds-template/pds-filler');
 */

// Re-export all PDS types (erased at compile time — no runtime cost)
export type {
  PDSData,
  PersonalInfo,
  FamilyBackground,
  Child,
  Education,
  CivilServiceEligibility,
  WorkExperience,
  VoluntaryWork,
  Training,
  Recognition,
  Association,
  Reference,
  PDSQuestions,
  GovernmentID,
  Address,
} from './types';

// Overflow types (type-only, erased at compile time)
export type { OverflowSection, OverflowRow } from './pds-overflow';

// Pure constants (no pdf-lib dependency)
export {
  PDS_PAGE_WIDTH,
  PDS_PAGE_HEIGHT,
  LEGAL_WIDTH,
  LEGAL_HEIGHT,
  MAX_CHILDREN_ROWS,
  MAX_EDUCATION_ROWS,
  MAX_ELIGIBILITY_ROWS,
  MAX_WORK_EXPERIENCE_ROWS,
  MAX_VOLUNTARY_WORK_ROWS,
  MAX_TRAINING_ROWS,
  MAX_SKILLS_ROWS,
  MAX_RECOGNITIONS_ROWS,
  MAX_ASSOCIATIONS_ROWS,
  MAX_REFERENCE_ROWS,
} from './pds-constants';
