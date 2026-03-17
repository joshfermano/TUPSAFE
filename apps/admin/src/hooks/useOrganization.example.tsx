/**
 * Organization Management Hooks Usage Examples
 *
 * This file demonstrates how to use the React Query hooks for organization management.
 * These examples follow TUPSAFE's React Query v5 patterns with proper TypeScript typing.
 */

'use client';

import { useState } from 'react';
import {
  useOrganizations,
  useOrganizationDetail,
  useCollegeWithDepartments,
  useDepartmentsByCollege,
  useCreateCollege,
  useCreateDepartment,
  useCreateOffice,
  useUpdateOrganization,
  useDeleteOrganization,
  useReactivateOrganization,
} from './useOrganization';
import type {
  CreateCollegeInput,
  CreateDepartmentInput,
  CreateOfficeInput,
  UpdateDepartmentInput,
  OrganizationQuery,
} from '@tupsafe/types';

/**
 * Example 1: List all organizations with filters
 */
export function OrganizationListExample() {
  const [filters, setFilters] = useState<Partial<OrganizationQuery>>({
    type: 'all',
    includeInactive: false,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const { data, isLoading, error } = useOrganizations(filters);

  if (isLoading) return <div>Loading organizations...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Organizations</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as 'all' | 'college' | 'department' | 'office' })}
        >
          <option value="all">All Types</option>
          <option value="college">Colleges</option>
          <option value="department">Departments</option>
          <option value="office">Offices</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Results */}
      <div className="results">
        <section>
          <h3>Colleges ({data.colleges.length})</h3>
          {data.colleges.map((college) => (
            <div key={college.id}>
              <h4>{college.name} ({college.code})</h4>
              <p>Employees: {college.employeeCount}</p>
              <p>Positions: {college.positionCount}</p>
              <p>Departments: {college.childDepartmentCount || 0}</p>
            </div>
          ))}
        </section>

        <section>
          <h3>Departments ({data.departments.length})</h3>
          {data.departments.map((dept) => (
            <div key={dept.id}>
              <h4>{dept.name} ({dept.code})</h4>
              <p>Employees: {dept.employeeCount}</p>
            </div>
          ))}
        </section>

        <section>
          <h3>Offices ({data.offices.length})</h3>
          {data.offices.map((office) => (
            <div key={office.id}>
              <h4>{office.name} ({office.code})</h4>
              <p>Employees: {office.employeeCount}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

/**
 * Example 2: View organization detail
 */
export function OrganizationDetailExample({ id }: { id: string }) {
  const { data: org, isLoading, error } = useOrganizationDetail(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!org) return null;

  return (
    <div>
      <h1>{org.name}</h1>
      <p>Code: {org.code}</p>
      <p>Type: {org.officeType}</p>
      <p>Status: {org.isActive ? 'Active' : 'Inactive'}</p>
      <p>Employees: {org.employeeCount}</p>
      <p>Positions: {org.positionCount}</p>
      {org.childDepartmentCount !== undefined && (
        <p>Child Departments: {org.childDepartmentCount}</p>
      )}
    </div>
  );
}

/**
 * Example 3: View college with all departments
 */
export function CollegeWithDepartmentsExample({ collegeId }: { collegeId: string }) {
  const { data: college, isLoading, error } = useCollegeWithDepartments(collegeId);

  if (isLoading) return <div>Loading college...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!college) return null;

  return (
    <div>
      <h1>{college.name}</h1>
      <p>Total Employees: {college.totalEmployees}</p>
      <p>Total Positions: {college.totalPositions}</p>
      <p>Total Departments: {college.totalDepartments}</p>

      <h2>Departments</h2>
      {college.departments.map((dept) => (
        <div key={dept.id}>
          <h3>{dept.name} ({dept.code})</h3>
          <p>Employees: {dept.employeeCount}</p>
          <p>Positions: {dept.positionCount}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 4: Create a new college
 */
export function CreateCollegeExample() {
  const createCollege = useCreateCollege();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const collegeData: CreateCollegeInput = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
    };

    createCollege.mutate(collegeData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New College</h2>

      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="College of Engineering"
          required
        />
      </div>

      <div>
        <label htmlFor="code">Code:</label>
        <input
          type="text"
          id="code"
          name="code"
          placeholder="COE"
          required
        />
      </div>

      <button type="submit" disabled={createCollege.isPending}>
        {createCollege.isPending ? 'Creating...' : 'Create College'}
      </button>

      {createCollege.error && (
        <div className="error">{createCollege.error.message}</div>
      )}
    </form>
  );
}

/**
 * Example 5: Create a new department
 */
export function CreateDepartmentExample({ collegeId }: { collegeId: string }) {
  const createDepartment = useCreateDepartment();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const deptData: CreateDepartmentInput = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      parentCollegeId: collegeId,
    };

    createDepartment.mutate(deptData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Department</h2>

      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Computer Engineering Department"
          required
        />
      </div>

      <div>
        <label htmlFor="code">Code:</label>
        <input
          type="text"
          id="code"
          name="code"
          placeholder="CpE"
          required
        />
      </div>

      <button type="submit" disabled={createDepartment.isPending}>
        {createDepartment.isPending ? 'Creating...' : 'Create Department'}
      </button>
    </form>
  );
}

/**
 * Example 6: Create a new office
 */
export function CreateOfficeExample() {
  const createOffice = useCreateOffice();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const officeData: CreateOfficeInput = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
    };

    createOffice.mutate(officeData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Office</h2>

      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Human Resources Office"
          required
        />
      </div>

      <div>
        <label htmlFor="code">Code:</label>
        <input
          type="text"
          id="code"
          name="code"
          placeholder="HRO"
          required
        />
      </div>

      <button type="submit" disabled={createOffice.isPending}>
        {createOffice.isPending ? 'Creating...' : 'Create Office'}
      </button>
    </form>
  );
}

/**
 * Example 7: Update an organization
 */
export function UpdateOrganizationExample({ id }: { id: string }) {
  const updateOrg = useUpdateOrganization();
  const { data: org } = useOrganizationDetail(id);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updateData: UpdateDepartmentInput = {
      name: formData.get('name') as string || undefined,
      code: formData.get('code') as string || undefined,
    };

    updateOrg.mutate({ id, data: updateData });
  };

  return (
    <form onSubmit={handleUpdate}>
      <h2>Update Organization</h2>

      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={org?.name}
        />
      </div>

      <div>
        <label htmlFor="code">Code:</label>
        <input
          type="text"
          id="code"
          name="code"
          defaultValue={org?.code}
        />
      </div>

      <button type="submit" disabled={updateOrg.isPending}>
        {updateOrg.isPending ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}

/**
 * Example 8: Delete (deactivate) an organization
 */
export function DeleteOrganizationExample({ id, name }: { id: string; name: string }) {
  const deleteOrg = useDeleteOrganization();

  const handleSoftDelete = () => {
    if (confirm(`Are you sure you want to deactivate ${name}?`)) {
      deleteOrg.mutate({ id, hard: false });
    }
  };

  const handleHardDelete = () => {
    if (confirm(`PERMANENT DELETE: This will permanently remove ${name}. Are you sure?`)) {
      deleteOrg.mutate({ id, hard: true });
    }
  };

  return (
    <div>
      <h3>Danger Zone</h3>

      <button
        onClick={handleSoftDelete}
        disabled={deleteOrg.isPending}
        className="btn-warning"
      >
        Deactivate Organization
      </button>

      <button
        onClick={handleHardDelete}
        disabled={deleteOrg.isPending}
        className="btn-danger"
      >
        Permanently Delete
      </button>
    </div>
  );
}

/**
 * Example 9: Reactivate an organization
 */
export function ReactivateOrganizationExample({ id, name }: { id: string; name: string }) {
  const reactivateOrg = useReactivateOrganization();

  const handleReactivate = () => {
    if (confirm(`Reactivate ${name}?`)) {
      reactivateOrg.mutate(id);
    }
  };

  return (
    <button
      onClick={handleReactivate}
      disabled={reactivateOrg.isPending}
      className="btn-success"
    >
      {reactivateOrg.isPending ? 'Reactivating...' : 'Reactivate Organization'}
    </button>
  );
}

/**
 * Example 10: Departments dropdown for a college
 */
export function DepartmentDropdownExample({ collegeId }: { collegeId: string }) {
  const { data: departments, isLoading } = useDepartmentsByCollege(collegeId);
  const [selectedDept, setSelectedDept] = useState<string>('');

  if (isLoading) return <div>Loading departments...</div>;
  if (!departments) return null;

  return (
    <select
      value={selectedDept}
      onChange={(e) => setSelectedDept(e.target.value)}
    >
      <option value="">Select a department...</option>
      {departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name} ({dept.code})
        </option>
      ))}
    </select>
  );
}

/**
 * Example 11: Complete organization management page
 */
export function CompleteOrganizationManagementExample() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- example component, selectedOrg used for demonstration
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useOrganizations({
    type: 'all',
    includeInactive: false,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const _updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Deactivate
      deleteOrg.mutate({ id, hard: false });
    } else {
      // Would use reactivate mutation here
      console.log('Reactivate:', id);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;

  return (
    <div className="organization-management">
      <header>
        <h1>Organization Management</h1>
        <button onClick={() => setShowCreateModal(true)}>
          Create New Organization
        </button>
      </header>

      <div className="stats">
        <div className="stat-card">
          <h3>Total Organizations</h3>
          <p>{data.total}</p>
        </div>
        <div className="stat-card">
          <h3>Colleges</h3>
          <p>{data.colleges.length}</p>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <p>{data.departments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Offices</h3>
          <p>{data.offices.length}</p>
        </div>
      </div>

      <div className="organization-grid">
        {[...data.colleges, ...data.departments, ...data.offices].map((org) => (
          <div key={org.id} className="org-card">
            <h3>{org.name}</h3>
            <p className="code">{org.code}</p>
            <div className="stats">
              <span>👥 {org.employeeCount}</span>
              <span>💼 {org.positionCount}</span>
            </div>
            <div className="actions">
              <button onClick={() => setSelectedOrg(org.id)}>
                View Details
              </button>
              <button
                onClick={() => handleToggleStatus(org.id, org.isActive)}
                className={org.isActive ? 'btn-warning' : 'btn-success'}
              >
                {org.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal">
          <CreateCollegeExample />
          <button onClick={() => setShowCreateModal(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
