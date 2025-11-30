/**
 * PDS Form Section Components
 *
 * Section-based components matching the CS Form No. 212 structure.
 * Each section represents one complete page of the PDS form.
 *
 * Section Structure:
 * - Section I: Personal Information (basic, contact, addresses)
 * - Section II: Family Background (spouse, parents, children)
 * - Section III: Educational Background (all education levels)
 * - Section IV: Civil Service Eligibility & Work Experience
 * - Section V: Voluntary Work & Learning Development
 * - Section VI: Other Information (skills, questions, references)
 */

import { lazy } from 'react';

// Lazy load section components for code splitting
export const SectionI = lazy(() =>
  import('./SectionI').then((m) => ({ default: m.SectionI }))
);
export const SectionII = lazy(() =>
  import('./SectionII').then((m) => ({ default: m.SectionII }))
);
export const SectionIII = lazy(() =>
  import('./SectionIII').then((m) => ({ default: m.SectionIII }))
);
export const SectionIV = lazy(() =>
  import('./SectionIV').then((m) => ({ default: m.SectionIV }))
);
export const SectionV = lazy(() =>
  import('./SectionV').then((m) => ({ default: m.SectionV }))
);
export const SectionVI = lazy(() =>
  import('./SectionVI').then((m) => ({ default: m.SectionVI }))
);
