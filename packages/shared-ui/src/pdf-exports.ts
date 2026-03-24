/**
 * PDF-specific type exports from @tupsafe/shared-ui
 *
 * IMPORTANT: This barrel must NOT statically import pdf-lib or @react-pdf/renderer
 * modules. Those are heavy dependencies that should only load via dynamic import()
 * or subpath imports:
 *   import { fillPDS } from '@tupsafe/shared-ui/pds-template';
 *   import { fillSALN } from '@tupsafe/shared-ui/saln-template';
 *   import { ReportDocument } from '@tupsafe/shared-ui/report-pdf';
 *
 * Only TYPE exports are safe here (erased at compile time).
 *
 * @module pdf-exports
 */

// ============================================================================
// PDS Types (type-only, no runtime cost)
// ============================================================================
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
  GovernmentID as PDSGovernmentID,
  Address,
} from './pds-template';

// ============================================================================
// SALN Types (type-only, no runtime cost)
// ============================================================================
export type {
  SALNData,
  DeclarantInfo,
  SpouseInfo,
  ChildInfo,
  RealProperty,
  PersonalProperty,
  Liability,
  BusinessInterest,
  RelativeInGov,
  GovernmentID,
  FilingType,
  ComplianceType,
  PropertyOwner,
  UnmarriedChild,
} from './saln-template';

// ============================================================================
// Report PDF Types (type-only, no runtime cost)
// ============================================================================
export type {
  ReportType,
  ReportData,
  ReportMetadata,
  ReportDocumentProps,
  ReportHeaderProps,
  ReportTableProps,
  ReportFooterProps,
} from './report-pdf/types';
