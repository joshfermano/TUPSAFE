/**
 * TUP Manila Organizational Structure Seed File
 *
 * This script seeds the database with:
 * - 6 Colleges (as parent departments)
 * - 28 Academic Departments (linked to colleges)
 * - 20+ Administrative Offices
 * - Sample positions for testing
 *
 * Run: npm run seed:tup
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../../.env.local') });

import { db } from './db';
import { departments, positions } from './schema';
import { v7 as uuidv7 } from 'uuid';

// =====================================================
// ORGANIZATIONAL DATA
// =====================================================

/**
 * 6 COLLEGES (Parent Academic Units)
 * These are top-level academic organizational units
 */
const colleges = [
  {
    id: uuidv7(),
    name: 'College of Engineering',
    code: 'COE',
    officeType: 'academic' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'College of Industrial Technology',
    code: 'CIT',
    officeType: 'academic' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'College of Industrial Education',
    code: 'CIE',
    officeType: 'academic' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'College of Architecture and Fine Arts',
    code: 'CAFA',
    officeType: 'academic' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'College of Science',
    code: 'COS',
    officeType: 'academic' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'College of Liberal Arts',
    code: 'CLA',
    officeType: 'academic' as const,
    parentCollegeId: null,
    isActive: true,
  },
];

// Store college references for department linking
const collegeRefs = {
  COE: colleges[0].id,
  CIT: colleges[1].id,
  CIE: colleges[2].id,
  CAFA: colleges[3].id,
  COS: colleges[4].id,
  CLA: colleges[5].id,
};

/**
 * 28 ACADEMIC DEPARTMENTS
 * Organized by parent college
 */
const academicDepartments = [
  // ==========================================
  // COLLEGE OF ENGINEERING (COE) - 4 departments
  // ==========================================
  {
    id: uuidv7(),
    name: 'Civil Engineering Department',
    code: 'CE',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COE,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Mechanical Engineering Department',
    code: 'ME',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COE,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Electrical Engineering Department',
    code: 'EE',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COE,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Electronics Engineering Department',
    code: 'ECE',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COE,
    isActive: true,
  },

  // ==========================================
  // COLLEGE OF INDUSTRIAL TECHNOLOGY (CIT) - 8 departments
  // ==========================================
  {
    id: uuidv7(),
    name: 'Basic Industrial Technology Department',
    code: 'BIT',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Civil Engineering Technology Department',
    code: 'CET',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Electrical Engineering Technology Department',
    code: 'EET',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Electronics Engineering Technology Department',
    code: 'ECET',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Food and Apparel Technology Department',
    code: 'FAT',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Graphic Arts and Printing Technology Department',
    code: 'GAPT',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Mechanical Engineering Technology Department',
    code: 'MET',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Power Plant Engineering Technology Department',
    code: 'PPET',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIT,
    isActive: true,
  },

  // ==========================================
  // COLLEGE OF INDUSTRIAL EDUCATION (CIE) - 4 departments
  // ==========================================
  {
    id: uuidv7(),
    name: 'Professional Industrial Education Department',
    code: 'PIE',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIE,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Student Teaching Department',
    code: 'ST',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIE,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Technical Arts Department',
    code: 'TA',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIE,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Home Economics Department',
    code: 'HE',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CIE,
    isActive: true,
  },

  // ==========================================
  // COLLEGE OF ARCHITECTURE AND FINE ARTS (CAFA) - 3 departments
  // ==========================================
  {
    id: uuidv7(),
    name: 'Architecture Department',
    code: 'ARCH',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CAFA,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Fine Arts Department',
    code: 'FA',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CAFA,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Graphics Department',
    code: 'GRAPH',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CAFA,
    isActive: true,
  },

  // ==========================================
  // COLLEGE OF SCIENCE (COS) - 5 departments
  // ==========================================
  {
    id: uuidv7(),
    name: 'Computer Science Department',
    code: 'CS',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COS,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Information Technology Department',
    code: 'IT',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COS,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Information Systems Department',
    code: 'IS',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COS,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Environmental Science Department',
    code: 'ES',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COS,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Applied Science Department',
    code: 'AS',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.COS,
    isActive: true,
  },

  // ==========================================
  // COLLEGE OF LIBERAL ARTS (CLA) - 4 departments
  // ==========================================
  {
    id: uuidv7(),
    name: 'English Department',
    code: 'ENG',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CLA,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Filipino Department',
    code: 'FIL',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CLA,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Social Sciences Department',
    code: 'SS',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CLA,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Physical Education Department',
    code: 'PE',
    officeType: 'academic' as const,
    parentCollegeId: collegeRefs.CLA,
    isActive: true,
  },
];

/**
 * 20+ ADMINISTRATIVE OFFICES
 * University-wide support and administrative units
 */
const administrativeOffices = [
  // ==========================================
  // EXECUTIVE OFFICES
  // ==========================================
  {
    id: uuidv7(),
    name: 'Office of the President',
    code: 'PRES',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Board of Regents',
    code: 'BOR',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // ACADEMIC AFFAIRS
  // ==========================================
  {
    id: uuidv7(),
    name: 'Office of the Vice President for Academic Affairs',
    code: 'VPAA',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // ADMINISTRATION & FINANCE
  // ==========================================
  {
    id: uuidv7(),
    name: 'Office of the Vice President for Administration and Finance',
    code: 'VPAF',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Office of Accounting Services',
    code: 'ACCT',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Budget Office',
    code: 'BUDG',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Cash Disbursement Office',
    code: 'CASH',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Procurement Office',
    code: 'PROC',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // STUDENT SERVICES
  // ==========================================
  {
    id: uuidv7(),
    name: 'Office of Student Affairs',
    code: 'OSA',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Office of Admissions',
    code: 'ADM',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Office of the University Registrar',
    code: 'REG',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Career Guidance and Counseling Center',
    code: 'CGCC',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // TECHNOLOGY & INFORMATION SYSTEMS
  // ==========================================
  {
    id: uuidv7(),
    name: 'University Information Technology Center',
    code: 'UITC',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // HUMAN RESOURCES
  // ==========================================
  {
    id: uuidv7(),
    name: 'Office of Human Resource Development',
    code: 'HRD',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // ADMINISTRATIVE SERVICES
  // ==========================================
  {
    id: uuidv7(),
    name: 'Office for Administrative Services',
    code: 'ADMIN',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Office of Auxiliary Services',
    code: 'AUX',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // SUPPORT SERVICES
  // ==========================================
  {
    id: uuidv7(),
    name: 'University Library',
    code: 'LIB',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Gender and Development Office',
    code: 'GAD',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Physical Plant and Facilities Management',
    code: 'PPFM',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Security Office',
    code: 'SEC',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // RESEARCH & EXTENSION
  // ==========================================
  {
    id: uuidv7(),
    name: 'Research and Development Office',
    code: 'RDO',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
  {
    id: uuidv7(),
    name: 'Extension Services Office',
    code: 'ESO',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },

  // ==========================================
  // QUALITY ASSURANCE
  // ==========================================
  {
    id: uuidv7(),
    name: 'Quality Assurance Office',
    code: 'QAO',
    officeType: 'administrative' as const,
    parentCollegeId: null,
    isActive: true,
  },
];

/**
 * SAMPLE POSITIONS FOR TESTING
 * Academic and administrative positions
 */
const samplePositions = [
  // Academic Positions (Faculty)
  {
    id: uuidv7(),
    title: 'Professor III',
    gradeLevel: 26,
    departmentId: academicDepartments.find((d) => d.code === 'CE')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Associate Professor IV',
    gradeLevel: 24,
    departmentId: academicDepartments.find((d) => d.code === 'CS')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Assistant Professor II',
    gradeLevel: 18,
    departmentId: academicDepartments.find((d) => d.code === 'IT')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Instructor I',
    gradeLevel: 12,
    departmentId: academicDepartments.find((d) => d.code === 'ENG')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'College Dean',
    gradeLevel: 27,
    departmentId: collegeRefs.COE,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Department Chair',
    gradeLevel: 24,
    departmentId: academicDepartments.find((d) => d.code === 'ME')?.id,
    isActive: true,
  },

  // Administrative Positions (Staff)
  {
    id: uuidv7(),
    title: 'Administrative Officer V',
    gradeLevel: 18,
    departmentId: administrativeOffices.find((o) => o.code === 'OSA')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Administrative Officer III',
    gradeLevel: 15,
    departmentId: administrativeOffices.find((o) => o.code === 'ADM')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'IT Specialist II',
    gradeLevel: 15,
    departmentId: administrativeOffices.find((o) => o.code === 'UITC')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'HR Specialist II',
    gradeLevel: 15,
    departmentId: administrativeOffices.find((o) => o.code === 'HRD')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Accountant III',
    gradeLevel: 18,
    departmentId: administrativeOffices.find((o) => o.code === 'ACCT')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'Librarian II',
    gradeLevel: 15,
    departmentId: administrativeOffices.find((o) => o.code === 'LIB')?.id,
    isActive: true,
  },
  {
    id: uuidv7(),
    title: 'University Registrar',
    gradeLevel: 24,
    departmentId: administrativeOffices.find((o) => o.code === 'REG')?.id,
    isActive: true,
  },
];

// =====================================================
// SEED FUNCTION
// =====================================================

async function seedTupStructure() {
  console.log('🏛️  TUP Manila Organizational Structure Seeding\n');
  console.log('='.repeat(60));
  console.log('Starting database seeding for TUP Manila organizational data');
  console.log('='.repeat(60));
  console.log('');

  try {
    // ==========================================
    // STEP 1: Seed Colleges
    // ==========================================
    console.log('📚 Step 1: Seeding Colleges...');
    for (const college of colleges) {
      await db
        .insert(departments)
        .values({
          id: college.id,
          name: college.name,
          code: college.code,
          officeType: college.officeType,
          parentId: null, // Colleges have no parent
          parentCollegeId: null,
          isActive: college.isActive,
        })
        .onConflictDoNothing();
    }
    console.log(`   ✓ Seeded ${colleges.length} colleges`);
    colleges.forEach((c) => console.log(`     - ${c.name} (${c.code})`));
    console.log('');

    // ==========================================
    // STEP 2: Seed Academic Departments
    // ==========================================
    console.log('🏫 Step 2: Seeding Academic Departments...');
    for (const dept of academicDepartments) {
      await db
        .insert(departments)
        .values({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          officeType: dept.officeType,
          parentId: dept.parentCollegeId, // Link to parent college
          parentCollegeId: dept.parentCollegeId,
          isActive: dept.isActive,
        })
        .onConflictDoNothing();
    }
    console.log(
      `   ✓ Seeded ${academicDepartments.length} academic departments`
    );

    // Group by college for display
    const deptsByCollege = academicDepartments.reduce((acc, dept) => {
      const collegeName =
        colleges.find((c) => c.id === dept.parentCollegeId)?.name || 'Unknown';
      if (!acc[collegeName]) acc[collegeName] = [];
      acc[collegeName].push(dept);
      return acc;
    }, {} as Record<string, typeof academicDepartments>);

    Object.entries(deptsByCollege).forEach(([collegeName, depts]) => {
      console.log(`\n   ${collegeName}:`);
      depts.forEach((d) => console.log(`     - ${d.name} (${d.code})`));
    });
    console.log('');

    // ==========================================
    // STEP 3: Seed Administrative Offices
    // ==========================================
    console.log('🏢 Step 3: Seeding Administrative Offices...');
    for (const office of administrativeOffices) {
      await db
        .insert(departments)
        .values({
          id: office.id,
          name: office.name,
          code: office.code,
          officeType: office.officeType,
          parentId: null,
          parentCollegeId: null,
          isActive: office.isActive,
        })
        .onConflictDoNothing();
    }
    console.log(
      `   ✓ Seeded ${administrativeOffices.length} administrative offices`
    );
    administrativeOffices.forEach((o) =>
      console.log(`     - ${o.name} (${o.code})`)
    );
    console.log('');

    // ==========================================
    // STEP 4: Seed Sample Positions
    // ==========================================
    console.log('💼 Step 4: Seeding Sample Positions...');
    for (const position of samplePositions) {
      await db.insert(positions).values(position).onConflictDoNothing();
    }
    console.log(`   ✓ Seeded ${samplePositions.length} sample positions`);
    samplePositions.forEach((p) =>
      console.log(`     - ${p.title} (Grade Level: ${p.gradeLevel})`)
    );
    console.log('');

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('='.repeat(60));
    console.log('✅ TUP Manila organizational structure seeding completed!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 SEEDING SUMMARY:');
    console.log(`   - ${colleges.length} Colleges (Academic parent units)`);
    console.log(
      `   - ${academicDepartments.length} Academic Departments (under colleges)`
    );
    console.log(`   - ${administrativeOffices.length} Administrative Offices`);
    console.log(
      `   - ${samplePositions.length} Sample Positions (for testing)`
    );
    console.log('');
    console.log('🎯 ORGANIZATIONAL BREAKDOWN:');
    console.log('   Academic Structure:');
    console.log(
      `     - COE: ${
        academicDepartments.filter((d) => d.parentCollegeId === collegeRefs.COE)
          .length
      } departments`
    );
    console.log(
      `     - CIT: ${
        academicDepartments.filter((d) => d.parentCollegeId === collegeRefs.CIT)
          .length
      } departments`
    );
    console.log(
      `     - CIE: ${
        academicDepartments.filter((d) => d.parentCollegeId === collegeRefs.CIE)
          .length
      } departments`
    );
    console.log(
      `     - CAFA: ${
        academicDepartments.filter(
          (d) => d.parentCollegeId === collegeRefs.CAFA
        ).length
      } departments`
    );
    console.log(
      `     - COS: ${
        academicDepartments.filter((d) => d.parentCollegeId === collegeRefs.COS)
          .length
      } departments`
    );
    console.log(
      `     - CLA: ${
        academicDepartments.filter((d) => d.parentCollegeId === collegeRefs.CLA)
          .length
      } departments`
    );
    console.log('');
    console.log('🔍 NEXT STEPS:');
    console.log('   1. Run verification queries to confirm data integrity');
    console.log(
      '   2. Run `npm run db:studio` to view seeded data in Drizzle Studio'
    );
    console.log('   3. Create test users (employees and applicants) if needed');
    console.log(
      '   4. Test employee ID generation: SELECT generate_employee_id(CURRENT_DATE);'
    );
    console.log(
      '   5. Test applicant ID generation: SELECT generate_applicant_id();'
    );
    console.log('');
    console.log('📖 VERIFICATION QUERIES:');
    console.log('   -- Count colleges:');
    console.log(
      "   SELECT COUNT(*) FROM departments WHERE office_type = 'academic' AND parent_college_id IS NULL;"
    );
    console.log('');
    console.log('   -- Count academic departments:');
    console.log(
      "   SELECT COUNT(*) FROM departments WHERE office_type = 'academic' AND parent_college_id IS NOT NULL;"
    );
    console.log('');
    console.log('   -- Count administrative offices:');
    console.log(
      "   SELECT COUNT(*) FROM departments WHERE office_type = 'administrative';"
    );
    console.log('');
    console.log('   -- View full hierarchy:');
    console.log('   SELECT c.name AS college, d.name AS department, d.code');
    console.log('   FROM departments d');
    console.log('   LEFT JOIN departments c ON d.parent_college_id = c.id');
    console.log(
      "   WHERE d.office_type = 'academic' AND d.parent_college_id IS NOT NULL"
    );
    console.log('   ORDER BY c.name, d.name;');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding TUP Manila structure:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// =====================================================
// RUN SEED FUNCTION
// =====================================================

seedTupStructure();
