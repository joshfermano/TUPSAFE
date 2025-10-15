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
    id: string;
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
export declare const mockDepartments: Department[];
export declare const mockPositions: Position[];
export declare const mockProfiles: Profile[];
export declare function getDepartmentById(id: string): Department | undefined;
export declare function getPositionById(id: string): Position | undefined;
export declare function getProfileById(id: string): Profile | undefined;
export declare function getProfilesByDepartment(departmentId: string): Profile[];
export declare function getProfilesByRole(role: Role): Profile[];
export declare function getDepartmentsByParent(parentId: string | null): Department[];
export declare function getPositionsByDepartment(departmentId: string): Position[];
export declare function generateMockProfile(firstName: string, lastName: string, middleName: string | null, role: Role, departmentId: string, positionId: string): Profile;
export declare function generateMockDepartment(name: string, code: string, parentId?: string | null): Department;
export declare function generateMockPosition(title: string, gradeLevel: number | null, departmentId: string): Position;
export declare const mockDataSummary: {
    departments: number;
    positions: number;
    profiles: number;
    roles: {
        employee: number;
        hr: number;
        admin: number;
        supervisor: number;
        auditor: number;
    };
};
