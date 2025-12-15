/**
 * Department Mutations - Usage Examples
 *
 * This file demonstrates how to use the department mutation functions.
 * These are NOT actual tests - just examples showing the API usage.
 *
 * For actual testing, use Jest/Vitest with proper test database setup.
 */

import {
  createCollege,
  createDepartment,
  createOffice,
  updateDepartment,
  softDeleteDepartment,
  hardDeleteDepartment,
  reactivateDepartment,
  isDepartmentCodeUnique,
} from './departments';

// ============================================================================
// Example 1: Creating a College
// ============================================================================
async function exampleCreateCollege() {
  try {
    const college = await createCollege({
      name: 'College of Engineering',
      code: 'COE',
    });

    console.log('Created college:', college);
    // Output: { id: '...', name: 'College of Engineering', code: 'COE', ... }
  } catch (error) {
    console.error('Failed to create college:', error);
    // Error: Department code 'COE' already exists. Please use a unique code.
  }
}

// ============================================================================
// Example 2: Creating a Department Under a College
// ============================================================================
async function exampleCreateDepartment() {
  try {
    const department = await createDepartment({
      name: 'Computer Science Department',
      code: 'BSCS',
      parentCollegeId: '550e8400-e29b-41d4-a716-446655440000', // COE ID
    });

    console.log('Created department:', department);
  } catch (error) {
    console.error('Failed to create department:', error);
    // Possible errors:
    // - Parent college with ID '...' not found
    // - Department code 'BSCS' already exists
    // - Cannot create department under inactive college
  }
}

// ============================================================================
// Example 3: Creating an Administrative Office
// ============================================================================
async function exampleCreateOffice() {
  try {
    // Create top-level administrative office
    const hrOffice = await createOffice({
      name: 'Human Resources Office',
      code: 'HRO',
    });

    console.log('Created HR office:', hrOffice);

    // Create sub-office under HR
    const hrRecords = await createOffice({
      name: 'HR Records Office',
      code: 'HRO-REC',
      parentId: hrOffice.id,
    });

    console.log('Created HR Records sub-office:', hrRecords);
  } catch (error) {
    console.error('Failed to create office:', error);
  }
}

// ============================================================================
// Example 4: Updating a Department
// ============================================================================
async function exampleUpdateDepartment() {
  try {
    // Update department name and code
    const updated = await updateDepartment(
      '550e8400-e29b-41d4-a716-446655440000',
      {
        name: 'Computer Science and Information Technology Department',
        code: 'CSIT',
      }
    );

    console.log('Updated department:', updated);

    // Move department to different college
    const moved = await updateDepartment(
      '550e8400-e29b-41d4-a716-446655440000',
      {
        parentCollegeId: 'new-college-id',
      }
    );

    console.log('Moved department:', moved);

    // Deactivate department
    const deactivated = await updateDepartment(
      '550e8400-e29b-41d4-a716-446655440000',
      {
        isActive: false,
      }
    );

    console.log('Deactivated department:', deactivated);
  } catch (error) {
    console.error('Failed to update department:', error);
    // Possible errors:
    // - Department with ID '...' not found
    // - Department code 'CSIT' already exists
    // - Circular reference detected
    // - Cannot change office type because this department has 3 child department(s)
  }
}

// ============================================================================
// Example 5: Soft Deleting a Department
// ============================================================================
async function exampleSoftDeleteDepartment() {
  try {
    await softDeleteDepartment('550e8400-e29b-41d4-a716-446655440000');

    console.log('Department soft deleted (deactivated)');
  } catch (error) {
    console.error('Failed to soft delete department:', error);
    // Possible errors:
    // - Department with ID '...' not found
    // - Department is already inactive
    // - Cannot deactivate department. There are 5 active employee(s) assigned
    // - Cannot deactivate department. There are 3 active position(s)
  }
}

// ============================================================================
// Example 6: Hard Deleting a Department (Permanent)
// ============================================================================
async function exampleHardDeleteDepartment() {
  try {
    // WARNING: This is permanent and irreversible!
    await hardDeleteDepartment('550e8400-e29b-41d4-a716-446655440000');

    console.log('Department permanently deleted');
  } catch (error) {
    console.error('Failed to hard delete department:', error);
    // Possible errors:
    // - Department with ID '...' not found
    // - Cannot permanently delete department. There are 5 employee record(s)
    // - Cannot permanently delete department. There are 3 position record(s)
    // - Cannot permanently delete college. There are 4 department(s) under this college
  }
}

// ============================================================================
// Example 7: Reactivating a Soft-Deleted Department
// ============================================================================
async function exampleReactivateDepartment() {
  try {
    const reactivated = await reactivateDepartment(
      '550e8400-e29b-41d4-a716-446655440000'
    );

    console.log('Department reactivated:', reactivated);
  } catch (error) {
    console.error('Failed to reactivate department:', error);
    // Possible errors:
    // - Department with ID '...' not found
    // - Department is already active
    // - Cannot reactivate department. Parent office is inactive
  }
}

// ============================================================================
// Example 8: Checking Department Code Uniqueness
// ============================================================================
async function exampleCheckCodeUniqueness() {
  try {
    // Check if code is available for new department
    const isAvailable = await isDepartmentCodeUnique('BSCS');
    console.log('Is BSCS available?', isAvailable); // false (already exists)

    // Check if code is available for update (excluding current department)
    const isAvailableForUpdate = await isDepartmentCodeUnique(
      'CSIT',
      '550e8400-e29b-41d4-a716-446655440000'
    );
    console.log('Is CSIT available for update?', isAvailableForUpdate); // true

    // Use in form validation
    if (!isAvailable) {
      console.log('Code already in use, please choose another');
    }
  } catch (error) {
    console.error('Failed to check code uniqueness:', error);
  }
}

// ============================================================================
// Example 9: Complete Workflow - Creating College Hierarchy
// ============================================================================
async function exampleCompleteWorkflow() {
  try {
    // Step 1: Create a college
    const college = await createCollege({
      name: 'College of Science',
      code: 'COS',
    });

    console.log('Step 1: Created college:', college.name);

    // Step 2: Create departments under the college
    const csDept = await createDepartment({
      name: 'Computer Science Department',
      code: 'BSCS',
      parentCollegeId: college.id,
    });

    const itDept = await createDepartment({
      name: 'Information Technology Department',
      code: 'BSIT',
      parentCollegeId: college.id,
    });

    console.log('Step 2: Created departments:', csDept.name, itDept.name);

    // Step 3: Later, rename a department
    const renamed = await updateDepartment(csDept.id, {
      name: 'Computer Science and Cybersecurity Department',
      code: 'CS-CYBER',
    });

    console.log('Step 3: Renamed department:', renamed.name);

    // Step 4: If needed, soft delete (deactivate)
    await softDeleteDepartment(itDept.id);

    console.log('Step 4: Soft deleted IT department');

    // Step 5: Reactivate if needed
    const reactivated = await reactivateDepartment(itDept.id);

    console.log('Step 5: Reactivated department:', reactivated.name);
  } catch (error) {
    console.error('Workflow failed:', error);
  }
}

// ============================================================================
// Example 10: Error Handling Best Practices
// ============================================================================
async function exampleErrorHandling() {
  try {
    const department = await createDepartment({
      name: 'Computer Science',
      code: 'BSCS',
      parentCollegeId: 'invalid-id',
    });

    console.log('Created:', department);
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('not found')) {
        console.error('Parent college does not exist');
      } else if (error.message.includes('already exists')) {
        console.error('Department code is already in use');
      } else if (error.message.includes('inactive')) {
        console.error('Parent college is inactive');
      } else {
        console.error('Unexpected error:', error.message);
      }
    }
  }
}

// Export examples for documentation
export {
  exampleCreateCollege,
  exampleCreateDepartment,
  exampleCreateOffice,
  exampleUpdateDepartment,
  exampleSoftDeleteDepartment,
  exampleHardDeleteDepartment,
  exampleReactivateDepartment,
  exampleCheckCodeUniqueness,
  exampleCompleteWorkflow,
  exampleErrorHandling,
};
