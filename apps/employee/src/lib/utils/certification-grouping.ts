import type { ProfileCertificationData } from '@tupsafe/types';

/**
 * Group certifications by the year extracted from `dateFrom`.
 * Returns a Map sorted by year descending (newest first).
 */
export function groupCertificationsByYear(
  certifications: ProfileCertificationData[]
): Map<number, ProfileCertificationData[]> {
  const groups = new Map<number, ProfileCertificationData[]>();

  for (const cert of certifications) {
    const year = parseInt(cert.dateFrom.slice(0, 4), 10);
    const existing = groups.get(year) || [];
    existing.push(cert);
    groups.set(year, existing);
  }

  return new Map(
    [...groups.entries()].sort(([a], [b]) => b - a)
  );
}
