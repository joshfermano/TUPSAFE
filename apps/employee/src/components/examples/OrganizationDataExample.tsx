/**
 * Organization Data Hooks Usage Examples
 *
 * This file demonstrates how to use the organization data hooks
 * in various common scenarios within the employee portal.
 *
 * DO NOT import this file in production code - it's for reference only.
 */

'use client';

import { useState } from 'react';
import {
  useCollegesQuery,
  useOfficesQuery,
  useDepartmentsByCollegeQuery,
  useOpenPositionsQuery,
  useFeaturedPositionsQuery,
  usePositionsByDepartmentQuery,
  usePositionQuery,
} from '@/hooks';
import type { Department, Position } from '@/types/api';

// ============================================================================
// Example 1: Registration Form with College/Department Selection
// ============================================================================

export function RegistrationFormExample() {
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );

  // Fetch colleges
  const { data: colleges, isLoading: collegesLoading } = useCollegesQuery();

  // Fetch departments under selected college (only runs when college is selected)
  const {
    data: departments,
    isLoading: departmentsLoading,
    isFetching: departmentsFetching,
  } = useDepartmentsByCollegeQuery(selectedCollege);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="college" className="block text-sm font-medium">
          College
        </label>
        <select
          id="college"
          disabled={collegesLoading}
          value={selectedCollege || ''}
          onChange={(e) => {
            setSelectedCollege(e.target.value || null);
            setSelectedDepartment(null); // Reset department when college changes
          }}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">
            {collegesLoading ? 'Loading colleges...' : 'Select a college'}
          </option>
          {colleges?.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name} ({college.code})
            </option>
          ))}
        </select>
      </div>

      {selectedCollege && (
        <div>
          <label htmlFor="department" className="block text-sm font-medium">
            Department
          </label>
          <select
            id="department"
            disabled={departmentsLoading || departmentsFetching}
            value={selectedDepartment || ''}
            onChange={(e) => setSelectedDepartment(e.target.value || null)}
            className="mt-1 block w-full rounded-md border-gray-300"
          >
            <option value="">
              {departmentsLoading
                ? 'Loading departments...'
                : 'Select a department'}
            </option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Administrative Offices Selection
// ============================================================================

export function AdministrativeOfficeExample() {
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);

  const { data: offices, isLoading, error } = useOfficesQuery();

  if (error) {
    return (
      <div className="text-red-600">
        Error loading offices: {error.message}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="office" className="block text-sm font-medium">
        Administrative Office
      </label>
      <select
        id="office"
        disabled={isLoading}
        value={selectedOffice || ''}
        onChange={(e) => setSelectedOffice(e.target.value || null)}
        className="mt-1 block w-full rounded-md border-gray-300"
      >
        <option value="">
          {isLoading ? 'Loading offices...' : 'Select an office'}
        </option>
        {offices?.map((office) => (
          <option key={office.id} value={office.id}>
            {office.name} ({office.code})
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Example 3: Job Application - Browse Open Positions
// ============================================================================

export function OpenPositionsListExample() {
  const { data: positions, isLoading, error } = useOpenPositionsQuery();

  if (isLoading) {
    return <div>Loading open positions...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error loading positions: {error.message}
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="text-gray-500">No open positions at this time.</div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Open Positions ({positions.length})</h2>
      {positions.map((position) => (
        <PositionCard key={position.id} position={position} />
      ))}
    </div>
  );
}

// ============================================================================
// Example 4: Featured Positions for Homepage
// ============================================================================

export function FeaturedPositionsExample() {
  const { data: featuredPositions, isLoading } = useFeaturedPositionsQuery();

  if (isLoading || !featuredPositions || featuredPositions.length === 0) {
    return null;
  }

  return (
    <section className="bg-blue-50 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Featured Positions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featuredPositions.map((position) => (
          <FeaturedPositionCard key={position.id} position={position} />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Example 5: Positions by Department Filter
// ============================================================================

export function PositionsByDepartmentExample() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );

  const { data: colleges } = useCollegesQuery();
  const { data: positions, isLoading: positionsLoading } =
    usePositionsByDepartmentQuery(selectedDepartment);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="dept-filter" className="block text-sm font-medium">
          Filter by Department
        </label>
        <select
          id="dept-filter"
          value={selectedDepartment || ''}
          onChange={(e) => setSelectedDepartment(e.target.value || null)}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="">All Departments</option>
          {colleges?.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDepartment && (
        <div>
          {positionsLoading ? (
            <div>Loading positions...</div>
          ) : positions && positions.length > 0 ? (
            <div className="space-y-3">
              {positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          ) : (
            <div className="text-gray-500">
              No open positions in this department.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Position Detail View
// ============================================================================

export function PositionDetailExample({ positionId }: { positionId: string }) {
  const { data: position, isLoading, error } = usePositionQuery(positionId);

  if (isLoading) {
    return <div>Loading position details...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error loading position: {error.message}
      </div>
    );
  }

  if (!position) {
    return <div className="text-gray-500">Position not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{position.positionTitle}</h1>
        <p className="text-gray-600">{position.departmentName}</p>
        <div className="mt-2 flex gap-2">
          <span className="badge">{position.employmentCategory}</span>
          <span className="badge">{position.employmentType}</span>
          {position.isFeatured && (
            <span className="badge bg-yellow-400">Featured</span>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Description</h2>
        <p className="text-gray-700">{position.description}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Qualifications</h2>
        <ul className="list-disc list-inside space-y-1">
          {position.qualifications.map((qual, index) => (
            <li key={index}>{qual}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Responsibilities</h2>
        <ul className="list-disc list-inside space-y-1">
          {position.responsibilities.map((resp, index) => (
            <li key={index}>{resp}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Requirements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-medium">Education</h3>
            <ul className="list-disc list-inside text-sm">
              {position.requirements.education.map((edu, index) => (
                <li key={index}>{edu}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Experience</h3>
            <ul className="list-disc list-inside text-sm">
              {position.requirements.experience.map((exp, index) => (
                <li key={index}>{exp}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Skills</h3>
            <ul className="list-disc list-inside text-sm">
              {position.requirements.skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <span className="text-sm text-gray-600">Number of Openings:</span>
            <span className="ml-2 font-medium">
              {position.numberOfOpenings}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">
              Applications Received:
            </span>
            <span className="ml-2 font-medium">
              {position.applicationsReceived}
            </span>
          </div>
          {position.salaryGrade && (
            <div>
              <span className="text-sm text-gray-600">Salary Grade:</span>
              <span className="ml-2 font-medium">{position.salaryGrade}</span>
            </div>
          )}
          {position.applicationDeadline && (
            <div>
              <span className="text-sm text-gray-600">Deadline:</span>
              <span className="ml-2 font-medium">
                {new Date(position.applicationDeadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <button className="btn btn-primary w-full">Apply Now</button>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function PositionCard({ position }: { position: Position }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{position.positionTitle}</h3>
          <p className="text-sm text-gray-600">{position.departmentName}</p>
        </div>
        {position.isFeatured && (
          <span className="bg-yellow-400 text-xs px-2 py-1 rounded">
            Featured
          </span>
        )}
      </div>

      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
        {position.description}
      </p>

      <div className="mt-3 flex gap-2 flex-wrap">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {position.employmentCategory}
        </span>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          {position.employmentType}
        </span>
        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
          {position.numberOfOpenings} opening
          {position.numberOfOpenings !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Deadline:{' '}
          {position.applicationDeadline
            ? new Date(position.applicationDeadline).toLocaleDateString()
            : 'N/A'}
        </span>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          View Details →
        </button>
      </div>
    </div>
  );
}

function FeaturedPositionCard({ position }: { position: Position }) {
  return (
    <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-yellow-400 text-xs px-2 py-1 rounded font-semibold">
          Featured
        </span>
      </div>

      <h3 className="font-semibold text-lg">{position.positionTitle}</h3>
      <p className="text-sm text-gray-600">{position.departmentName}</p>

      <p className="text-sm text-gray-700 mt-2 line-clamp-3">
        {position.description}
      </p>

      <button className="mt-3 w-full btn btn-primary">Apply Now</button>
    </div>
  );
}
