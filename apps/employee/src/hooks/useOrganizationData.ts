/**
 * Organization Data Hook
 *
 * React Query hooks for fetching colleges, departments, offices, positions, and open positions
 * from the database with proper caching, loading states, and error handling.
 *
 * @module hooks/useOrganizationData
 */

import { useQuery } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

export interface College {
  id: string;
  name: string;
  code: string;
  officeType: 'academic';
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  officeType: 'academic';
  parentCollegeId: string;
  isActive: boolean;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  officeType: 'administrative';
  isActive: boolean;
}

export interface Position {
  id: string;
  title: string;
  gradeLevel: number | null;
  departmentId: string | null;
  isActive: boolean;
}

export interface OpenPosition {
  id: string;
  positionTitle: string;
  positionCode: string;
  departmentId: string | null;
  employmentCategory: 'faculty' | 'administrative';
  description: string;
  qualifications: string[];
  salaryGrade: string | null;
  status: 'open' | 'closed' | 'filled' | 'cancelled';
  applicationDeadline: string;
  numberOfOpenings: number;
  isFeatured: boolean;
}

// ============================================================================
// Query Key Factories
// ============================================================================

export const organizationKeys = {
  all: ['organization'] as const,
  colleges: () => [...organizationKeys.all, 'colleges'] as const,
  departments: () => [...organizationKeys.all, 'departments'] as const,
  departmentsByCollege: (collegeId: string) =>
    [...organizationKeys.departments(), collegeId] as const,
  offices: () => [...organizationKeys.all, 'offices'] as const,
  positions: () => [...organizationKeys.all, 'positions'] as const,
  positionsByOrganization: (organizationId: string) =>
    [...organizationKeys.positions(), organizationId] as const,
  openPositions: () => [...organizationKeys.all, 'openPositions'] as const,
  openPositionsByCategory: (category: 'faculty' | 'administrative' | 'all') =>
    [...organizationKeys.openPositions(), category] as const,
};

// ============================================================================
// Mock Data Functions (Replace with real API calls)
// ============================================================================

// Mock colleges data
const mockColleges: College[] = [
  { id: '1', name: 'College of Engineering', code: 'COE', officeType: 'academic', isActive: true },
  { id: '2', name: 'College of Science', code: 'COS', officeType: 'academic', isActive: true },
  { id: '3', name: 'College of Liberal Arts', code: 'CLA', officeType: 'academic', isActive: true },
  { id: '4', name: 'College of Industrial Technology', code: 'CIT', officeType: 'academic', isActive: true },
  { id: '5', name: 'College of Industrial Education', code: 'CIE', officeType: 'academic', isActive: true },
  { id: '6', name: 'College of Architecture and Fine Arts', code: 'CAFA', officeType: 'academic', isActive: true },
];

// Mock departments data
const mockDepartments: Record<string, Department[]> = {
  '1': [
    { id: '101', name: 'Department of Civil Engineering', code: 'CE', officeType: 'academic', parentCollegeId: '1', isActive: true },
    { id: '102', name: 'Department of Electrical Engineering', code: 'EE', officeType: 'academic', parentCollegeId: '1', isActive: true },
    { id: '103', name: 'Department of Mechanical Engineering', code: 'ME', officeType: 'academic', parentCollegeId: '1', isActive: true },
    { id: '104', name: 'Department of Electronics Engineering', code: 'ECE', officeType: 'academic', parentCollegeId: '1', isActive: true },
  ],
  '2': [
    { id: '201', name: 'Department of Mathematics', code: 'MATH', officeType: 'academic', parentCollegeId: '2', isActive: true },
    { id: '202', name: 'Department of Physics', code: 'PHY', officeType: 'academic', parentCollegeId: '2', isActive: true },
    { id: '203', name: 'Department of Chemistry', code: 'CHEM', officeType: 'academic', parentCollegeId: '2', isActive: true },
    { id: '204', name: 'Department of Biology', code: 'BIO', officeType: 'academic', parentCollegeId: '2', isActive: true },
  ],
  '3': [
    { id: '301', name: 'Department of English', code: 'ENG', officeType: 'academic', parentCollegeId: '3', isActive: true },
    { id: '302', name: 'Department of Filipino', code: 'FIL', officeType: 'academic', parentCollegeId: '3', isActive: true },
    { id: '303', name: 'Department of Social Sciences', code: 'SS', officeType: 'academic', parentCollegeId: '3', isActive: true },
  ],
  '4': [
    { id: '401', name: 'Department of Computer Technology', code: 'CT', officeType: 'academic', parentCollegeId: '4', isActive: true },
    { id: '402', name: 'Department of Automotive Technology', code: 'AT', officeType: 'academic', parentCollegeId: '4', isActive: true },
  ],
  '5': [
    { id: '501', name: 'Department of Industrial Education', code: 'IE', officeType: 'academic', parentCollegeId: '5', isActive: true },
    { id: '502', name: 'Department of Technology Education', code: 'TE', officeType: 'academic', parentCollegeId: '5', isActive: true },
  ],
  '6': [
    { id: '601', name: 'Department of Architecture', code: 'ARCH', officeType: 'academic', parentCollegeId: '6', isActive: true },
    { id: '602', name: 'Department of Fine Arts', code: 'FA', officeType: 'academic', parentCollegeId: '6', isActive: true },
  ],
};

// Mock offices data
const mockOffices: Office[] = [
  { id: '701', name: 'Office of the University President', code: 'PRES', officeType: 'administrative', isActive: true },
  { id: '702', name: 'Human Resources Office', code: 'HRO', officeType: 'administrative', isActive: true },
  { id: '703', name: 'Finance Office', code: 'FIN', officeType: 'administrative', isActive: true },
  { id: '704', name: 'Registrar Office', code: 'REG', officeType: 'administrative', isActive: true },
  { id: '705', name: 'Library Services', code: 'LIB', officeType: 'administrative', isActive: true },
  { id: '706', name: 'Information and Communications Technology Office', code: 'ICTO', officeType: 'administrative', isActive: true },
  { id: '707', name: 'Facilities Management Office', code: 'FMO', officeType: 'administrative', isActive: true },
  { id: '708', name: 'Student Affairs Office', code: 'SAO', officeType: 'administrative', isActive: true },
  { id: '709', name: 'Research and Development Office', code: 'RDO', officeType: 'administrative', isActive: true },
  { id: '710', name: 'Planning and Development Office', code: 'PDO', officeType: 'administrative', isActive: true },
  { id: '711', name: 'Quality Assurance Office', code: 'QAO', officeType: 'administrative', isActive: true },
  { id: '712', name: 'Extension Services Office', code: 'ESO', officeType: 'administrative', isActive: true },
  { id: '713', name: 'Guidance and Counseling Office', code: 'GCO', officeType: 'administrative', isActive: true },
  { id: '714', name: 'Medical and Dental Services', code: 'MDS', officeType: 'administrative', isActive: true },
  { id: '715', name: 'Campus Security Office', code: 'CSO', officeType: 'administrative', isActive: true },
  { id: '716', name: 'Procurement Office', code: 'PROC', officeType: 'administrative', isActive: true },
  { id: '717', name: 'Accounting Office', code: 'ACCT', officeType: 'administrative', isActive: true },
  { id: '718', name: 'Budget Office', code: 'BUDG', officeType: 'administrative', isActive: true },
  { id: '719', name: 'Scholarship and Financial Assistance Office', code: 'SFAO', officeType: 'administrative', isActive: true },
  { id: '720', name: 'Alumni Relations Office', code: 'ARO', officeType: 'administrative', isActive: true },
  { id: '721', name: 'Public Affairs and Communications Office', code: 'PACO', officeType: 'administrative', isActive: true },
  { id: '722', name: 'Legal Affairs Office', code: 'LAO', officeType: 'administrative', isActive: true },
  { id: '723', name: 'Internal Audit Office', code: 'IAO', officeType: 'administrative', isActive: true },
];

// Mock positions data
const mockPositions: Record<string, Position[]> = {
  '1': [
    { id: 'pos-101', title: 'Professor IV', gradeLevel: 27, departmentId: '1', isActive: true },
    { id: 'pos-102', title: 'Associate Professor IV', gradeLevel: 25, departmentId: '1', isActive: true },
    { id: 'pos-103', title: 'Assistant Professor IV', gradeLevel: 23, departmentId: '1', isActive: true },
    { id: 'pos-104', title: 'Instructor III', gradeLevel: 18, departmentId: '1', isActive: true },
  ],
  '702': [
    { id: 'pos-201', title: 'Administrative Officer V', gradeLevel: 24, departmentId: '702', isActive: true },
    { id: 'pos-202', title: 'HR Specialist III', gradeLevel: 18, departmentId: '702', isActive: true },
    { id: 'pos-203', title: 'HR Assistant', gradeLevel: 11, departmentId: '702', isActive: true },
  ],
};

// Mock open positions data
const mockOpenPositions: OpenPosition[] = [
  {
    id: 'open-1',
    positionTitle: 'Assistant Professor - Computer Engineering',
    positionCode: 'FAC-2025-001',
    departmentId: '104',
    employmentCategory: 'faculty',
    description: 'Teaching position for Computer Engineering department',
    qualifications: ['PhD in Computer Engineering or related field', 'At least 2 years teaching experience'],
    salaryGrade: 'SG 23',
    status: 'open',
    applicationDeadline: '2025-12-31T23:59:59Z',
    numberOfOpenings: 2,
    isFeatured: true,
  },
  {
    id: 'open-2',
    positionTitle: 'Administrative Officer III - HR Office',
    positionCode: 'ADM-2025-001',
    departmentId: '702',
    employmentCategory: 'administrative',
    description: 'Administrative support for Human Resources Office',
    qualifications: ['Bachelor\'s degree in HR Management or related field', 'At least 1 year experience'],
    salaryGrade: 'SG 18',
    status: 'open',
    applicationDeadline: '2025-11-30T23:59:59Z',
    numberOfOpenings: 1,
    isFeatured: false,
  },
];

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchColleges(): Promise<College[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // TODO: Replace with actual API call
  // const response = await fetch('/api/colleges');
  // return response.json();
  return mockColleges;
}

async function fetchDepartmentsByCollege(collegeId: string): Promise<Department[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/departments?collegeId=${collegeId}`);
  // return response.json();
  return mockDepartments[collegeId] || [];
}

async function fetchOffices(): Promise<Office[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // TODO: Replace with actual API call
  // const response = await fetch('/api/offices');
  // return response.json();
  return mockOffices;
}

async function fetchPositionsByOrganization(organizationId: string): Promise<Position[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/positions?organizationId=${organizationId}`);
  // return response.json();
  return mockPositions[organizationId] || [];
}

async function fetchOpenPositions(category: 'faculty' | 'administrative' | 'all' = 'all'): Promise<OpenPosition[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/open-positions?category=${category}`);
  // return response.json();

  if (category === 'all') {
    return mockOpenPositions;
  }
  return mockOpenPositions.filter((pos) => pos.employmentCategory === category);
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Fetch all colleges (academic offices without parent)
 */
export function useColleges() {
  return useQuery({
    queryKey: organizationKeys.colleges(),
    queryFn: fetchColleges,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (previously cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch departments for a specific college
 */
export function useDepartmentsByCollege(collegeId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.departmentsByCollege(collegeId || ''),
    queryFn: () => fetchDepartmentsByCollege(collegeId || ''),
    enabled: !!collegeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch all administrative offices
 */
export function useOffices() {
  return useQuery({
    queryKey: organizationKeys.offices(),
    queryFn: fetchOffices,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch positions for a specific organization (college/office)
 */
export function usePositionsByOrganization(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.positionsByOrganization(organizationId || ''),
    queryFn: () => fetchPositionsByOrganization(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch all open job positions for applicants
 */
export function useOpenPositions(category: 'faculty' | 'administrative' | 'all' = 'all') {
  return useQuery({
    queryKey: organizationKeys.openPositionsByCategory(category),
    queryFn: () => fetchOpenPositions(category),
    staleTime: 5 * 60 * 1000, // 5 minutes (more frequent for job postings)
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true, // Refetch on focus for job listings
  });
}
