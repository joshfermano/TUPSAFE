import { z } from 'zod';

/**
 * Philippine Address Validation Schema
 *
 * Validates addresses according to Philippine administrative structure:
 * - Region (optional for statistical purposes)
 * - Province (required)
 * - City/Municipality (required)
 * - Barangay (required - smallest administrative division)
 * - Street/House details (optional but recommended)
 * - ZIP Code (4 digits)
 */

// ZIP Code validation (Philippine ZIP codes are 4 digits)
const zipCodeRegex = /^\d{4}$/;

// Philippine Address Schema
export const philippineAddressSchema = z.object({
  // Optional street/house details
  houseNumber: z
    .string()
    .max(50, 'House/Block/Lot number must not exceed 50 characters')
    .optional()
    .or(z.literal('')),

  streetName: z
    .string()
    .max(100, 'Street name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),

  subdivision: z
    .string()
    .max(100, 'Subdivision/Village name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),

  // Required administrative divisions
  barangay: z
    .string()
    .min(1, 'Barangay is required')
    .max(100, 'Barangay name must not exceed 100 characters'),

  cityMunicipality: z
    .string()
    .min(1, 'City/Municipality is required')
    .max(100, 'City/Municipality name must not exceed 100 characters'),

  province: z
    .string()
    .min(1, 'Province is required')
    .max(100, 'Province name must not exceed 100 characters'),

  // ZIP Code (4 digits)
  zipCode: z
    .string()
    .regex(zipCodeRegex, 'ZIP code must be exactly 4 digits')
    .optional()
    .or(z.literal('')),

  // Optional region (for statistical purposes)
  region: z
    .string()
    .max(50, 'Region name must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
});

// Type export
export type PhilippineAddress = z.infer<typeof philippineAddressSchema>;

// Schema for forms that require multiple addresses (e.g., PDS)
export const multipleAddressSchema = z.object({
  permanentAddress: philippineAddressSchema,
  residentialAddress: philippineAddressSchema,
  // Flag to indicate if residential is same as permanent
  sameAsPermanent: z.boolean().default(false),
});

export type MultipleAddressFormData = z.infer<typeof multipleAddressSchema>;

// Helper function to create an empty address object
export const createEmptyAddress = (): PhilippineAddress => ({
  houseNumber: '',
  streetName: '',
  subdivision: '',
  barangay: '',
  cityMunicipality: '',
  province: '',
  zipCode: '',
  region: '',
});

// Helper function to format address for display
export const formatAddress = (address: PhilippineAddress): string => {
  const parts: string[] = [];

  // House number and street
  if (address.houseNumber) {
    parts.push(address.houseNumber);
  }
  if (address.streetName) {
    parts.push(address.streetName);
  }

  // Subdivision
  if (address.subdivision) {
    parts.push(address.subdivision);
  }

  // Barangay (always present)
  parts.push(`Brgy. ${address.barangay}`);

  // City/Municipality (always present)
  parts.push(address.cityMunicipality);

  // Province (always present)
  parts.push(address.province);

  // ZIP Code
  if (address.zipCode) {
    parts.push(address.zipCode);
  }

  return parts.join(', ');
};

// Helper function to check if address is complete
export const isAddressComplete = (address: PhilippineAddress): boolean => {
  return !!(address.barangay && address.cityMunicipality && address.province);
};

// Helper function to validate if two addresses are the same
export const areAddressesEqual = (
  addr1: PhilippineAddress,
  addr2: PhilippineAddress
): boolean => {
  return (
    addr1.houseNumber === addr2.houseNumber &&
    addr1.streetName === addr2.streetName &&
    addr1.subdivision === addr2.subdivision &&
    addr1.barangay === addr2.barangay &&
    addr1.cityMunicipality === addr2.cityMunicipality &&
    addr1.province === addr2.province &&
    addr1.zipCode === addr2.zipCode &&
    addr1.region === addr2.region
  );
};
