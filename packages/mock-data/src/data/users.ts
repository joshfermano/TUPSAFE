import { v7 as uuidv7 } from 'uuid';

// Type definitions based on the database schema
export type Role = 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Position {
  id: string;
  title: string;
  gradeLevel: number | null;
  departmentId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Profile {
  id: string; // References Supabase auth.users.id
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  role: Role;
  departmentId: string | null;
  positionId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock departments representing Philippine government agencies
export const mockDepartments: Department[] = [
  {
    id: '01927d4e-8b45-7000-0001-000000000001',
    name: 'Department of Science and Technology',
    code: 'DOST',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000002',
    name: 'Department of Education',
    code: 'DEPED',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000003',
    name: 'Department of Health',
    code: 'DOH',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000004',
    name: 'Department of Finance',
    code: 'DOF',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000005',
    name: 'Office of the President',
    code: 'OP',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000006',
    name: 'Senate of the Philippines',
    code: 'SENATE',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000007',
    name: 'Department of Public Works and Highways',
    code: 'DPWH',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000008',
    name: 'Office of the Vice President',
    code: 'OVP',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000009',
    name: 'Philippine National Police',
    code: 'PNP',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000010',
    name: 'Department of Agriculture',
    code: 'DA',
    parentId: null,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // Sub-departments/bureaus
  {
    id: '01927d4e-8b45-7000-0001-000000000011',
    name: 'Science Education Institute',
    code: 'SEI',
    parentId: '01927d4e-8b45-7000-0001-000000000001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000012',
    name: 'Philippine Council for Health Research and Development',
    code: 'PCHRD',
    parentId: '01927d4e-8b45-7000-0001-000000000001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000013',
    name: 'Bureau of Internal Revenue',
    code: 'BIR',
    parentId: '01927d4e-8b45-7000-0001-000000000004',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000014',
    name: 'Bureau of Customs',
    code: 'BOC',
    parentId: '01927d4e-8b45-7000-0001-000000000004',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7000-0001-000000000015',
    name: 'Food and Drug Administration',
    code: 'FDA',
    parentId: '01927d4e-8b45-7000-0001-000000000003',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
];

// Mock positions with salary grades
export const mockPositions: Position[] = [
  // DOST positions
  {
    id: '01927d4e-8b45-7100-0001-000000000001',
    title: 'Science Research Specialist II',
    gradeLevel: 22,
    departmentId: '01927d4e-8b45-7000-0001-000000000001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000002',
    title: 'Research Director',
    gradeLevel: 27,
    departmentId: '01927d4e-8b45-7000-0001-000000000001',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // DEPED positions
  {
    id: '01927d4e-8b45-7100-0001-000000000003',
    title: 'Teacher III',
    gradeLevel: 18,
    departmentId: '01927d4e-8b45-7000-0001-000000000002',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000004',
    title: 'Schools Division Superintendent',
    gradeLevel: 30,
    departmentId: '01927d4e-8b45-7000-0001-000000000002',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // DOH positions
  {
    id: '01927d4e-8b45-7100-0001-000000000005',
    title: 'Medical Officer IV',
    gradeLevel: 24,
    departmentId: '01927d4e-8b45-7000-0001-000000000003',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000006',
    title: 'Chief of Hospital',
    gradeLevel: 28,
    departmentId: '01927d4e-8b45-7000-0001-000000000003',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // DOF positions
  {
    id: '01927d4e-8b45-7100-0001-000000000007',
    title: 'Revenue Officer V',
    gradeLevel: 24,
    departmentId: '01927d4e-8b45-7000-0001-000000000004',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000008',
    title: 'Assistant Secretary',
    gradeLevel: 30,
    departmentId: '01927d4e-8b45-7000-0001-000000000004',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // OP positions
  {
    id: '01927d4e-8b45-7100-0001-000000000009',
    title: 'Presidential Assistant',
    gradeLevel: 29,
    departmentId: '01927d4e-8b45-7000-0001-000000000005',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000010',
    title: 'Executive Secretary',
    gradeLevel: 31,
    departmentId: '01927d4e-8b45-7000-0001-000000000005',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // Senate positions
  {
    id: '01927d4e-8b45-7100-0001-000000000011',
    title: 'Legislative Staff Officer V',
    gradeLevel: 24,
    departmentId: '01927d4e-8b45-7000-0001-000000000006',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000012',
    title: 'Secretary General',
    gradeLevel: 32,
    departmentId: '01927d4e-8b45-7000-0001-000000000006',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // DPWH positions
  {
    id: '01927d4e-8b45-7100-0001-000000000013',
    title: 'Engineer III',
    gradeLevel: 22,
    departmentId: '01927d4e-8b45-7000-0001-000000000007',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000014',
    title: 'District Engineer',
    gradeLevel: 26,
    departmentId: '01927d4e-8b45-7000-0001-000000000007',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // OVP positions
  {
    id: '01927d4e-8b45-7100-0001-000000000015',
    title: 'Administrative Officer V',
    gradeLevel: 24,
    departmentId: '01927d4e-8b45-7000-0001-000000000008',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000016',
    title: 'Chief of Staff',
    gradeLevel: 30,
    departmentId: '01927d4e-8b45-7000-0001-000000000008',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // PNP positions
  {
    id: '01927d4e-8b45-7100-0001-000000000017',
    title: 'Police Officer III',
    gradeLevel: 18,
    departmentId: '01927d4e-8b45-7000-0001-000000000009',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000018',
    title: 'Police Colonel',
    gradeLevel: 26,
    departmentId: '01927d4e-8b45-7000-0001-000000000009',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  // DA positions
  {
    id: '01927d4e-8b45-7100-0001-000000000019',
    title: 'Agriculturist II',
    gradeLevel: 18,
    departmentId: '01927d4e-8b45-7000-0001-000000000010',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7100-0001-000000000020',
    title: 'Regional Technical Director',
    gradeLevel: 27,
    departmentId: '01927d4e-8b45-7000-0001-000000000010',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
];

// Mock user profiles with Filipino names and realistic data
export const mockProfiles: Profile[] = [
  {
    id: '01927d4e-8b45-7f52-b123-456789abcdef', // References auth user
    employeeId: 'DOST-2023-001',
    firstName: 'Juan',
    lastName: 'dela Cruz',
    middleName: 'Mercado',
    role: 'employee',
    departmentId: '01927d4e-8b45-7000-0001-000000000001',
    positionId: '01927d4e-8b45-7100-0001-000000000001',
    isActive: true,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde0',
    employeeId: 'DEPED-2023-047',
    firstName: 'Maria',
    lastName: 'Santos',
    middleName: 'Gonzales',
    role: 'hr',
    departmentId: '01927d4e-8b45-7000-0001-000000000002',
    positionId: '01927d4e-8b45-7100-0001-000000000004',
    isActive: true,
    createdAt: new Date('2024-05-15T00:00:00Z'),
    updatedAt: new Date('2024-05-15T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde1',
    employeeId: 'DOH-2024-089',
    firstName: 'Jose',
    lastName: 'Rizal',
    middleName: 'Protacio',
    role: 'supervisor',
    departmentId: '01927d4e-8b45-7000-0001-000000000003',
    positionId: '01927d4e-8b45-7100-0001-000000000006',
    isActive: true,
    createdAt: new Date('2024-07-10T00:00:00Z'),
    updatedAt: new Date('2024-07-10T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde2',
    employeeId: 'DOF-2024-125',
    firstName: 'Ana',
    lastName: 'Luna',
    middleName: 'Bautista',
    role: 'auditor',
    departmentId: '01927d4e-8b45-7000-0001-000000000004',
    positionId: '01927d4e-8b45-7100-0001-000000000008',
    isActive: true,
    createdAt: new Date('2024-08-20T00:00:00Z'),
    updatedAt: new Date('2024-08-20T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde3',
    employeeId: 'OP-2024-001',
    firstName: 'Rodrigo',
    lastName: 'Duterte',
    middleName: 'Roa',
    role: 'admin',
    departmentId: '01927d4e-8b45-7000-0001-000000000005',
    positionId: '01927d4e-8b45-7100-0001-000000000010',
    isActive: true,
    createdAt: new Date('2024-04-01T00:00:00Z'),
    updatedAt: new Date('2024-04-01T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde4',
    employeeId: 'SENATE-2024-033',
    firstName: 'Grace',
    lastName: 'Poe',
    middleName: 'Llamanzares',
    role: 'employee',
    departmentId: '01927d4e-8b45-7000-0001-000000000006',
    positionId: '01927d4e-8b45-7100-0001-000000000011',
    isActive: true,
    createdAt: new Date('2024-03-15T00:00:00Z'),
    updatedAt: new Date('2024-03-15T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde5',
    employeeId: 'DPWH-2024-078',
    firstName: 'Manuel',
    lastName: 'Villar',
    middleName: 'Bamba',
    role: 'supervisor',
    departmentId: '01927d4e-8b45-7000-0001-000000000007',
    positionId: '01927d4e-8b45-7100-0001-000000000014',
    isActive: true,
    createdAt: new Date('2024-09-05T00:00:00Z'),
    updatedAt: new Date('2024-09-05T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde6',
    employeeId: 'OVP-2024-012',
    firstName: 'Leni',
    lastName: 'Robredo',
    middleName: 'Gerona',
    role: 'hr',
    departmentId: '01927d4e-8b45-7000-0001-000000000008',
    positionId: '01927d4e-8b45-7100-0001-000000000016',
    isActive: true,
    createdAt: new Date('2024-02-28T00:00:00Z'),
    updatedAt: new Date('2024-02-28T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde7',
    employeeId: 'PNP-2024-156',
    firstName: 'Panfilo',
    lastName: 'Lacson',
    middleName: 'Morena',
    role: 'employee',
    departmentId: '01927d4e-8b45-7000-0001-000000000009',
    positionId: '01927d4e-8b45-7100-0001-000000000018',
    isActive: true,
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-01-20T00:00:00Z'),
  },
  {
    id: '01927d4e-8b45-7f52-b123-456789abcde8',
    employeeId: 'DA-2024-203',
    firstName: 'Francis',
    lastName: 'Pangilinan',
    middleName: 'Nepomuceno',
    role: 'employee',
    departmentId: '01927d4e-8b45-7000-0001-000000000010',
    positionId: '01927d4e-8b45-7100-0001-000000000020',
    isActive: true,
    createdAt: new Date('2024-10-12T00:00:00Z'),
    updatedAt: new Date('2024-10-12T00:00:00Z'),
  },
];

// Helper functions for mock data
export function getDepartmentById(id: string): Department | undefined {
  return mockDepartments.find((dept) => dept.id === id);
}

export function getPositionById(id: string): Position | undefined {
  return mockPositions.find((pos) => pos.id === id);
}

export function getProfileById(id: string): Profile | undefined {
  return mockProfiles.find((profile) => profile.id === id);
}

export function getProfilesByDepartment(departmentId: string): Profile[] {
  return mockProfiles.filter(
    (profile) => profile.departmentId === departmentId
  );
}

export function getProfilesByRole(role: Role): Profile[] {
  return mockProfiles.filter((profile) => profile.role === role);
}

export function getDepartmentsByParent(parentId: string | null): Department[] {
  return mockDepartments.filter((dept) => dept.parentId === parentId);
}

export function getPositionsByDepartment(departmentId: string): Position[] {
  return mockPositions.filter((pos) => pos.departmentId === departmentId);
}

// Generate additional mock users for testing
export function generateMockProfile(
  firstName: string,
  lastName: string,
  middleName: string | null,
  role: Role,
  departmentId: string,
  positionId: string
): Profile {
  const employeeIdPrefix = getDepartmentById(departmentId)?.code || 'GOV';
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return {
    id: uuidv7(),
    employeeId: `${employeeIdPrefix}-${year}-${randomNum}`,
    firstName,
    lastName,
    middleName,
    role,
    departmentId,
    positionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateMockDepartment(
  name: string,
  code: string,
  parentId: string | null = null
): Department {
  return {
    id: uuidv7(),
    name,
    code,
    parentId,
    isActive: true,
    createdAt: new Date(),
  };
}

export function generateMockPosition(
  title: string,
  gradeLevel: number | null,
  departmentId: string
): Position {
  return {
    id: uuidv7(),
    title,
    gradeLevel,
    departmentId,
    isActive: true,
    createdAt: new Date(),
  };
}

// Export summary
export const mockDataSummary = {
  departments: mockDepartments.length,
  positions: mockPositions.length,
  profiles: mockProfiles.length,
  roles: {
    employee: mockProfiles.filter((p) => p.role === 'employee').length,
    hr: mockProfiles.filter((p) => p.role === 'hr').length,
    admin: mockProfiles.filter((p) => p.role === 'admin').length,
    supervisor: mockProfiles.filter((p) => p.role === 'supervisor').length,
    auditor: mockProfiles.filter((p) => p.role === 'auditor').length,
  },
};
