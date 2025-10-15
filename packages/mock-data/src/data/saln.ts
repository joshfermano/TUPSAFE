import { v7 as uuidv7 } from 'uuid';
import type { SalnSubmission } from '@smartgov/database';

// Type definitions based on the database schema
export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected';
export type PropertyKind =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural'
  | 'mixed';
export type FilingType = 'joint' | 'separate' | 'not_applicable';

export interface SalnRealProperty {
  id: string;
  salnSubmissionId: string;
  description: string;
  kind: PropertyKind;
  exactLocation: string;
  assessedValue: number;
  currentFairMarketValue: number;
  acquisitionYear: number;
  acquisitionMode: string;
  acquisitionCost: number;
}

export interface SalnPersonalProperty {
  id: string;
  salnSubmissionId: string;
  description: string;
  yearAcquired: number;
  acquisitionCost: number;
}

export interface SalnLiability {
  id: string;
  salnSubmissionId: string;
  nature: string;
  creditorName: string;
  outstandingBalance: number;
}

export interface SalnBusinessInterest {
  id: string;
  salnSubmissionId: string;
  entityName: string;
  businessAddress: string;
  natureOfBusiness: string;
  dateOfAcquisition: Date;
}

export interface SalnRelativeInGov {
  id: string;
  salnSubmissionId: string;
  name: string;
  relationship: string;
  position: string;
  agencyAddress: string;
}

// Mock SALN Submissions
export const mockSalnSubmissions: SalnSubmission[] = [
  {
    id: '01927d4e-8b45-9000-0001-000000000001',
    userId: '01927d4e-8b45-7f52-b123-456789abcdef',
    year: 2024,
    status: 'approved',
    totalAssets: '8750000.00',
    totalLiabilities: '2500000.00',
    netWorth: '6250000.00',
    submittedAt: new Date('2024-04-15T10:00:00Z'),
    approvedBy: '01927d4e-8b45-7f52-b123-456789abcde2',
    approvedAt: new Date('2024-04-20T14:30:00Z'),
    filingType: 'separate',
    createdAt: new Date('2024-04-01T08:00:00Z'),
    updatedAt: new Date('2024-04-20T14:30:00Z'),
  },
  {
    id: '01927d4e-8b45-9000-0001-000000000002',
    userId: '01927d4e-8b45-7f52-b123-456789abcdef',
    year: 2023,
    status: 'approved',
    totalAssets: '8200000.00',
    totalLiabilities: '2800000.00',
    netWorth: '5400000.00',
    submittedAt: new Date('2023-04-10T09:30:00Z'),
    approvedBy: '01927d4e-8b45-7f52-b123-456789abcde2',
    approvedAt: new Date('2023-04-15T16:00:00Z'),
    filingType: 'separate',
    createdAt: new Date('2023-03-25T07:15:00Z'),
    updatedAt: new Date('2023-04-15T16:00:00Z'),
  },
  {
    id: '01927d4e-8b45-9000-0001-000000000003',
    userId: '01927d4e-8b45-7f52-b123-456789abcde0',
    year: 2024,
    status: 'submitted',
    totalAssets: '5600000.00',
    totalLiabilities: '1800000.00',
    netWorth: '3800000.00',
    submittedAt: new Date('2024-04-12T11:15:00Z'),
    approvedBy: null,
    approvedAt: null,
    filingType: 'joint',
    createdAt: new Date('2024-04-05T09:00:00Z'),
    updatedAt: new Date('2024-04-12T11:15:00Z'),
  },
  {
    id: '01927d4e-8b45-9000-0001-000000000004',
    userId: '01927d4e-8b45-7f52-b123-456789abcde1',
    year: 2024,
    status: 'reviewing',
    totalAssets: '12500000.00',
    totalLiabilities: '3200000.00',
    netWorth: '9300000.00',
    submittedAt: new Date('2024-04-08T14:45:00Z'),
    approvedBy: null,
    approvedAt: null,
    filingType: 'separate',
    createdAt: new Date('2024-03-30T10:30:00Z'),
    updatedAt: new Date('2024-04-08T14:45:00Z'),
  },
  {
    id: '01927d4e-8b45-9000-0001-000000000005',
    userId: '01927d4e-8b45-7f52-b123-456789abcde4',
    year: 2024,
    status: 'draft',
    totalAssets: '15000000.00',
    totalLiabilities: '4500000.00',
    netWorth: '10500000.00',
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    filingType: 'joint',
    createdAt: new Date('2024-04-20T13:00:00Z'),
    updatedAt: new Date('2024-04-25T15:30:00Z'),
  },
  {
    id: '01927d4e-8b45-9000-0001-000000000006',
    userId: '01927d4e-8b45-7f52-b123-456789abcde7',
    year: 2024,
    status: 'rejected',
    totalAssets: '6800000.00',
    totalLiabilities: '2100000.00',
    netWorth: '4700000.00',
    submittedAt: new Date('2024-04-05T12:20:00Z'),
    approvedBy: '01927d4e-8b45-7f52-b123-456789abcde2',
    approvedAt: new Date('2024-04-10T09:45:00Z'),
    filingType: 'separate',
    createdAt: new Date('2024-03-28T11:00:00Z'),
    updatedAt: new Date('2024-04-10T09:45:00Z'),
  },
];

// Mock SALN Real Properties
export const mockSalnRealProperties: SalnRealProperty[] = [
  // Juan dela Cruz properties
  {
    id: '01927d4e-8b45-9100-0001-000000000001',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    description: '3-bedroom house and lot',
    kind: 'residential',
    exactLocation: '123 Kamagong Street, Brgy. San Antonio, Quezon City',
    assessedValue: 2500000.0,
    currentFairMarketValue: 4500000.0,
    acquisitionYear: 2015,
    acquisitionMode: 'Purchase',
    acquisitionCost: 3200000.0,
  },
  {
    id: '01927d4e-8b45-9100-0001-000000000002',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    description: 'Vacant lot',
    kind: 'residential',
    exactLocation: '456 Narra Avenue, Brgy. Maligaya, Antipolo City',
    assessedValue: 800000.0,
    currentFairMarketValue: 1200000.0,
    acquisitionYear: 2020,
    acquisitionMode: 'Purchase',
    acquisitionCost: 950000.0,
  },
  // Maria Santos properties
  {
    id: '01927d4e-8b45-9100-0001-000000000003',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    description: '2-bedroom condominium unit',
    kind: 'residential',
    exactLocation: 'Unit 1205, Sampaguita Tower, Pasig City',
    assessedValue: 1800000.0,
    currentFairMarketValue: 2800000.0,
    acquisitionYear: 2018,
    acquisitionMode: 'Purchase',
    acquisitionCost: 2200000.0,
  },
  {
    id: '01927d4e-8b45-9100-0001-000000000004',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    description: 'Ancestral house',
    kind: 'residential',
    exactLocation: '789 Mahogany Street, Brgy. Pinyahan, Bataan',
    assessedValue: 1200000.0,
    currentFairMarketValue: 1800000.0,
    acquisitionYear: 2010,
    acquisitionMode: 'Inheritance',
    acquisitionCost: 0.0,
  },
  // Jose Rizal properties
  {
    id: '01927d4e-8b45-9100-0001-000000000005',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    description: '4-bedroom house and lot',
    kind: 'residential',
    exactLocation: '789 Narra Street, Brgy. Bagong Bayan, Manila',
    assessedValue: 3500000.0,
    currentFairMarketValue: 6500000.0,
    acquisitionYear: 2012,
    acquisitionMode: 'Purchase',
    acquisitionCost: 4800000.0,
  },
  {
    id: '01927d4e-8b45-9100-0001-000000000006',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    description: 'Medical clinic building',
    kind: 'commercial',
    exactLocation: '321 Health Street, Brgy. Poblacion, Calamba, Laguna',
    assessedValue: 2800000.0,
    currentFairMarketValue: 4200000.0,
    acquisitionYear: 2019,
    acquisitionMode: 'Purchase',
    acquisitionCost: 3500000.0,
  },
  // Grace Poe properties
  {
    id: '01927d4e-8b45-9100-0001-000000000007',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    description: '5-bedroom house and lot',
    kind: 'residential',
    exactLocation: '654 Malunggay Street, Brgy. San Miguel, San Juan City',
    assessedValue: 5200000.0,
    currentFairMarketValue: 8500000.0,
    acquisitionYear: 2005,
    acquisitionMode: 'Purchase',
    acquisitionCost: 6200000.0,
  },
  {
    id: '01927d4e-8b45-9100-0001-000000000008',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    description: 'Farm land',
    kind: 'agricultural',
    exactLocation: '987 Mabini Street, Brgy. Centro, Iloilo City',
    assessedValue: 2500000.0,
    currentFairMarketValue: 3800000.0,
    acquisitionYear: 2010,
    acquisitionMode: 'Inheritance',
    acquisitionCost: 0.0,
  },
];

// Mock SALN Personal Properties
export const mockSalnPersonalProperties: SalnPersonalProperty[] = [
  // Juan dela Cruz personal properties
  {
    id: '01927d4e-8b45-9200-0001-000000000001',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    description: '2022 Toyota Camry',
    yearAcquired: 2022,
    acquisitionCost: 1800000.0,
  },
  {
    id: '01927d4e-8b45-9200-0001-000000000002',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    description: 'Jewelry and Watches Collection',
    yearAcquired: 2020,
    acquisitionCost: 350000.0,
  },
  {
    id: '01927d4e-8b45-9200-0001-000000000003',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    description: 'Electronics and Appliances',
    yearAcquired: 2021,
    acquisitionCost: 450000.0,
  },
  // Maria Santos personal properties
  {
    id: '01927d4e-8b45-9200-0001-000000000004',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    description: '2020 Honda CR-V',
    yearAcquired: 2020,
    acquisitionCost: 1650000.0,
  },
  {
    id: '01927d4e-8b45-9200-0001-000000000005',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    description: 'Furniture and Fixtures',
    yearAcquired: 2018,
    acquisitionCost: 280000.0,
  },
  // Jose Rizal personal properties
  {
    id: '01927d4e-8b45-9200-0001-000000000006',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    description: '2023 BMW X5',
    yearAcquired: 2023,
    acquisitionCost: 4200000.0,
  },
  {
    id: '01927d4e-8b45-9200-0001-000000000007',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    description: 'Medical Equipment for Private Practice',
    yearAcquired: 2019,
    acquisitionCost: 1200000.0,
  },
  {
    id: '01927d4e-8b45-9200-0001-000000000008',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    description: 'Art Collection',
    yearAcquired: 2021,
    acquisitionCost: 600000.0,
  },
  // Grace Poe personal properties
  {
    id: '01927d4e-8b45-9200-0001-000000000009',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    description: '2024 Mercedes-Benz GLE',
    yearAcquired: 2024,
    acquisitionCost: 5200000.0,
  },
  {
    id: '01927d4e-8b45-9200-0001-000000000010',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    description: 'Investment Portfolio (Stocks and Bonds)',
    yearAcquired: 2015,
    acquisitionCost: 2500000.0,
  },
];

// Mock SALN Liabilities
export const mockSalnLiabilities: SalnLiability[] = [
  // Juan dela Cruz liabilities
  {
    id: '01927d4e-8b45-9300-0001-000000000001',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    nature: 'Home Mortgage Loan',
    creditorName: 'BPI Family Savings Bank',
    outstandingBalance: 1800000.0,
  },
  {
    id: '01927d4e-8b45-9300-0001-000000000002',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    nature: 'Car Loan',
    creditorName: 'Toyota Motor Philippines',
    outstandingBalance: 650000.0,
  },
  {
    id: '01927d4e-8b45-9300-0001-000000000003',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    nature: 'Credit Card',
    creditorName: 'BDO Unibank',
    outstandingBalance: 50000.0,
  },
  // Maria Santos liabilities
  {
    id: '01927d4e-8b45-9300-0001-000000000004',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    nature: 'Condominium Loan',
    creditorName: 'Metrobank',
    outstandingBalance: 1200000.0,
  },
  {
    id: '01927d4e-8b45-9300-0001-000000000005',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    nature: 'Personal Loan',
    creditorName: 'Security Bank',
    outstandingBalance: 350000.0,
  },
  {
    id: '01927d4e-8b45-9300-0001-000000000006',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    nature: 'Credit Card',
    creditorName: 'Citibank Philippines',
    outstandingBalance: 250000.0,
  },
  // Jose Rizal liabilities
  {
    id: '01927d4e-8b45-9300-0001-000000000007',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    nature: 'Clinic Equipment Loan',
    creditorName: 'Rizal Commercial Banking Corporation',
    outstandingBalance: 2200000.0,
  },
  {
    id: '01927d4e-8b45-9300-0001-000000000008',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    nature: 'Car Loan',
    creditorName: 'BMW Financial Services',
    outstandingBalance: 1000000.0,
  },
  // Grace Poe liabilities
  {
    id: '01927d4e-8b45-9300-0001-000000000009',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    nature: 'Investment Property Loan',
    creditorName: 'Philippine National Bank',
    outstandingBalance: 3500000.0,
  },
  {
    id: '01927d4e-8b45-9300-0001-000000000010',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    nature: 'Business Loan',
    creditorName: 'Land Bank of the Philippines',
    outstandingBalance: 1000000.0,
  },
];

// Mock SALN Business Interests
export const mockSalnBusinessInterests: SalnBusinessInterest[] = [
  {
    id: '01927d4e-8b45-9400-0001-000000000001',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    entityName: 'Santos Educational Services',
    businessAddress: '789 Learning Street, Quezon City',
    natureOfBusiness: 'Tutorial and Review Services',
    dateOfAcquisition: new Date('2015-08-15'),
  },
  {
    id: '01927d4e-8b45-9400-0001-000000000002',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    entityName: 'Rizal Medical Clinic',
    businessAddress: '321 Health Street, Calamba, Laguna',
    natureOfBusiness: 'Medical Services and Consultation',
    dateOfAcquisition: new Date('2019-03-10'),
  },
  {
    id: '01927d4e-8b45-9400-0001-000000000003',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    entityName: 'Poe Agricultural Ventures',
    businessAddress: '987 Farm Road, Iloilo City',
    natureOfBusiness: 'Agricultural Production and Trading',
    dateOfAcquisition: new Date('2012-06-20'),
  },
  {
    id: '01927d4e-8b45-9400-0001-000000000004',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    entityName: 'Grace Poe Foundation',
    businessAddress: '111 Service Avenue, Makati City',
    natureOfBusiness: 'Non-profit Educational Foundation',
    dateOfAcquisition: new Date('2008-12-01'),
  },
];

// Mock SALN Relatives in Government
export const mockSalnRelativesInGov: SalnRelativeInGov[] = [
  {
    id: '01927d4e-8b45-9500-0001-000000000001',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000001',
    name: 'Pedro M. dela Cruz',
    relationship: 'Father',
    position: 'Retired Principal',
    agencyAddress: 'Former DepEd Quezon City Division',
  },
  {
    id: '01927d4e-8b45-9500-0001-000000000002',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    name: 'Antonio R. Gonzales',
    relationship: 'Father',
    position: 'Engineering Assistant',
    agencyAddress: 'DPWH Central Office, Manila',
  },
  {
    id: '01927d4e-8b45-9500-0001-000000000003',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000003',
    name: 'Carmen R. Santos',
    relationship: 'Sister',
    position: 'Budget Officer II',
    agencyAddress: 'Department of Budget and Management, Manila',
  },
  {
    id: '01927d4e-8b45-9500-0001-000000000004',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000004',
    name: 'Francisco E. Rizal',
    relationship: 'Brother',
    position: 'City Health Officer',
    agencyAddress: 'Calamba City Health Office, Laguna',
  },
  {
    id: '01927d4e-8b45-9500-0001-000000000005',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    name: 'Fernando P. Poe',
    relationship: 'Father',
    position: 'Retired Senator',
    agencyAddress: 'Former Senate of the Philippines',
  },
  {
    id: '01927d4e-8b45-9500-0001-000000000006',
    salnSubmissionId: '01927d4e-8b45-9000-0001-000000000005',
    name: 'Neil T. Poe',
    relationship: 'Spouse',
    position: 'Consultant',
    agencyAddress: 'Civil Aviation Authority of the Philippines',
  },
];

// Helper functions
export function getSalnSubmissionById(id: string): SalnSubmission | undefined {
  return mockSalnSubmissions.find((saln) => saln.id === id);
}

export function getSalnSubmissionsByUserId(userId: string): SalnSubmission[] {
  return mockSalnSubmissions.filter((saln) => saln.userId === userId);
}

export function getSalnSubmissionsByYear(year: number): SalnSubmission[] {
  return mockSalnSubmissions.filter((saln) => saln.year === year);
}

export function getSalnRealPropertiesBySubmissionId(
  submissionId: string
): SalnRealProperty[] {
  return mockSalnRealProperties.filter(
    (prop) => prop.salnSubmissionId === submissionId
  );
}

export function getSalnPersonalPropertiesBySubmissionId(
  submissionId: string
): SalnPersonalProperty[] {
  return mockSalnPersonalProperties.filter(
    (prop) => prop.salnSubmissionId === submissionId
  );
}

export function getSalnLiabilitiesBySubmissionId(
  submissionId: string
): SalnLiability[] {
  return mockSalnLiabilities.filter(
    (liability) => liability.salnSubmissionId === submissionId
  );
}

export function getSalnBusinessInterestsBySubmissionId(
  submissionId: string
): SalnBusinessInterest[] {
  return mockSalnBusinessInterests.filter(
    (business) => business.salnSubmissionId === submissionId
  );
}

export function getSalnRelativesInGovBySubmissionId(
  submissionId: string
): SalnRelativeInGov[] {
  return mockSalnRelativesInGov.filter(
    (relative) => relative.salnSubmissionId === submissionId
  );
}

export function getCompleteSalnSubmission(submissionId: string) {
  const submission = getSalnSubmissionById(submissionId);
  if (!submission) return null;

  const realProperties = getSalnRealPropertiesBySubmissionId(submissionId);
  const personalProperties =
    getSalnPersonalPropertiesBySubmissionId(submissionId);
  const liabilities = getSalnLiabilitiesBySubmissionId(submissionId);
  const businessInterests =
    getSalnBusinessInterestsBySubmissionId(submissionId);
  const relativesInGov = getSalnRelativesInGovBySubmissionId(submissionId);

  // Recalculate totals (should match submission totals)
  const totalRealPropertyValue = realProperties.reduce(
    (sum, prop) => sum + prop.currentFairMarketValue,
    0
  );
  const totalPersonalPropertyValue = personalProperties.reduce(
    (sum, prop) => sum + prop.acquisitionCost,
    0
  );
  const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;
  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + liability.outstandingBalance,
    0
  );
  const netWorth = totalAssets - totalLiabilities;

  return {
    submission,
    realProperties,
    personalProperties,
    liabilities,
    businessInterests,
    relativesInGov,
    calculations: {
      totalRealPropertyValue,
      totalPersonalPropertyValue,
      totalAssets,
      totalLiabilities,
      netWorth,
    },
  };
}

// Generate additional mock SALN data for a user
export function generateMockSalnSubmission(
  userId: string,
  year: number,
  status: SubmissionStatus = 'draft',
  filingType: FilingType = 'separate'
): SalnSubmission {
  // Generate realistic financial data based on government salary ranges
  const baseAssets = Math.floor(Math.random() * 5000000) + 2000000; // 2M to 7M
  const baseLiabilities = Math.floor(Math.random() * 2000000) + 500000; // 500K to 2.5M

  return {
    id: uuidv7(),
    userId,
    year,
    status,
    totalAssets: baseAssets.toFixed(2),
    totalLiabilities: baseLiabilities.toFixed(2),
    netWorth: (baseAssets - baseLiabilities).toFixed(2),
    submittedAt: status !== 'draft' ? new Date() : null,
    approvedBy:
      status === 'approved' ? '01927d4e-8b45-7f52-b123-456789abcde2' : null,
    approvedAt: status === 'approved' ? new Date() : null,
    filingType,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Generate mock real property
export function generateMockRealProperty(
  salnSubmissionId: string,
  description: string,
  kind: PropertyKind,
  location: string,
  acquisitionYear: number
): SalnRealProperty {
  const acquisitionCost = Math.floor(Math.random() * 3000000) + 1000000; // 1M to 4M
  const appreciationRate = 1.2 + Math.random() * 0.5; // 20% to 70% appreciation
  const assessedValue = acquisitionCost * 0.8; // Assessed at 80% of acquisition

  return {
    id: uuidv7(),
    salnSubmissionId,
    description,
    kind,
    exactLocation: location,
    assessedValue,
    currentFairMarketValue: acquisitionCost * appreciationRate,
    acquisitionYear,
    acquisitionMode: Math.random() > 0.8 ? 'Inheritance' : 'Purchase',
    acquisitionCost: acquisitionCost,
  };
}

// Philippine cities and provinces for generating realistic addresses
export const philippineCities = [
  { city: 'Quezon City', province: 'Metro Manila', zipCode: '1100' },
  { city: 'Manila', province: 'Metro Manila', zipCode: '1000' },
  { city: 'Makati', province: 'Metro Manila', zipCode: '1200' },
  { city: 'Pasig', province: 'Metro Manila', zipCode: '1600' },
  { city: 'Taguig', province: 'Metro Manila', zipCode: '1630' },
  { city: 'Cebu City', province: 'Cebu', zipCode: '6000' },
  { city: 'Davao City', province: 'Davao del Sur', zipCode: '8000' },
  { city: 'Iloilo City', province: 'Iloilo', zipCode: '5000' },
  { city: 'Baguio City', province: 'Benguet', zipCode: '2600' },
  { city: 'Cagayan de Oro', province: 'Misamis Oriental', zipCode: '9000' },
  { city: 'Zamboanga City', province: 'Zamboanga del Sur', zipCode: '7000' },
  { city: 'Antipolo', province: 'Rizal', zipCode: '1870' },
  { city: 'Calamba', province: 'Laguna', zipCode: '4027' },
  { city: 'Imus', province: 'Cavite', zipCode: '4103' },
  { city: 'Bacoor', province: 'Cavite', zipCode: '4102' },
];

// Common Filipino family names
export const filipinoSurnames = [
  'dela Cruz',
  'Santos',
  'Reyes',
  'Garcia',
  'Gonzales',
  'Rodriguez',
  'Hernandez',
  'Martinez',
  'Lopez',
  'Perez',
  'Ramos',
  'Flores',
  'Rivera',
  'Torres',
  'Ramirez',
  'Cruz',
  'Morales',
  'Gutierrez',
  'Ortiz',
  'Vargas',
  'Castro',
  'Romero',
  'Jimenez',
  'Herrera',
  'Medina',
  'Aguilar',
  'Guerrero',
  'Vega',
  'Soto',
  'Mendoza',
  'Salazar',
  'Bautista',
  'Aquino',
  'Fernandez',
  'Villanueva',
  'Rosario',
  'Mercado',
  'Castillo',
  'Pascual',
  'Navarro',
  'Campos',
  'Cabrera',
  'Valdez',
  'Alvarez',
  'Diaz',
  'Moreno',
];

// Common Filipino given names
export const filipinoGivenNames = {
  male: [
    'Juan',
    'Jose',
    'Antonio',
    'Manuel',
    'Francisco',
    'Pedro',
    'Carlos',
    'Miguel',
    'Rafael',
    'Fernando',
    'Roberto',
    'Ricardo',
    'Eduardo',
    'Luis',
    'Alejandro',
    'Diego',
    'Andres',
    'Felipe',
    'Joaquin',
    'Emilio',
    'Vicente',
    'Sergio',
    'Alberto',
    'Mario',
    'Jorge',
    'Raul',
    'Arturo',
    'Oscar',
    'Victor',
    'Cesar',
    'Ernesto',
  ],
  female: [
    'Maria',
    'Ana',
    'Carmen',
    'Rosa',
    'Elena',
    'Isabel',
    'Teresa',
    'Patricia',
    'Luz',
    'Gloria',
    'Esperanza',
    'Concepcion',
    'Dolores',
    'Francisca',
    'Remedios',
    'Josefa',
    'Soledad',
    'Pilar',
    'Mercedes',
    'Cristina',
    'Beatriz',
    'Margarita',
    'Victoria',
    'Amparo',
    'Corazon',
    'Milagros',
    'Socorro',
    'Paz',
    'Fe',
    'Caridad',
  ],
};

// Export summary
export const mockSalnDataSummary = {
  submissions: mockSalnSubmissions.length,
  realProperties: mockSalnRealProperties.length,
  personalProperties: mockSalnPersonalProperties.length,
  liabilities: mockSalnLiabilities.length,
  businessInterests: mockSalnBusinessInterests.length,
  relativesInGov: mockSalnRelativesInGov.length,
  years: Array.from(new Set(mockSalnSubmissions.map((s) => s.year))).sort(),
  statuses: {
    draft: mockSalnSubmissions.filter((s) => s.status === 'draft').length,
    submitted: mockSalnSubmissions.filter((s) => s.status === 'submitted')
      .length,
    reviewing: mockSalnSubmissions.filter((s) => s.status === 'reviewing')
      .length,
    approved: mockSalnSubmissions.filter((s) => s.status === 'approved').length,
    rejected: mockSalnSubmissions.filter((s) => s.status === 'rejected').length,
  },
  filingTypes: {
    joint: mockSalnSubmissions.filter((s) => s.filingType === 'joint').length,
    separate: mockSalnSubmissions.filter((s) => s.filingType === 'separate')
      .length,
    not_applicable: mockSalnSubmissions.filter(
      (s) => s.filingType === 'not_applicable'
    ).length,
  },
  totalNetWorth: mockSalnSubmissions.reduce(
    (sum, s) => sum + Number(s.netWorth || 0),
    0
  ),
  averageNetWorth:
    mockSalnSubmissions.reduce((sum, s) => sum + Number(s.netWorth || 0), 0) /
    mockSalnSubmissions.length,
};
