import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../../.env.local') });
import { db } from './db';
import {
  profiles,
  departments,
  positions,
  pdsSubmissions,
  pdsPersonalInfo,
  pdsFamilyBackground,
  pdsChildren,
  pdsEducation,
  pdsCivilService,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsTraining,
  pdsOtherInfo,
  salnSubmissions,
  salnRealProperties,
  salnPersonalProperties,
  salnLiabilities,
  salnBusinessInterests,
  salnRelativesInGov,
} from './schema';
import {
  mockDepartments,
  mockPositions,
  mockProfiles,
} from '../../mock-data/src/data/users';
import {
  mockPdsSubmissions,
  mockPdsPersonalInfo as rawPdsPersonalInfo,
  mockPdsFamilyBackground,
  mockPdsChildren as rawPdsChildren,
  mockPdsEducation as rawPdsEducation,
  mockPdsCivilService as rawPdsCivilService,
  mockPdsWorkExperience as rawPdsWorkExperience,
  mockPdsVoluntaryWork as rawPdsVoluntaryWork,
  mockPdsTraining as rawPdsTraining,
  mockPdsOtherInfo,
} from '../../mock-data/src/data/pds';
import {
  mockSalnSubmissions,
  mockSalnRealProperties as rawSalnRealProperties,
  mockSalnPersonalProperties as rawSalnPersonalProperties,
  mockSalnLiabilities as rawSalnLiabilities,
  mockSalnBusinessInterests as rawSalnBusinessInterests,
  mockSalnRelativesInGov,
} from '../../mock-data/src/data/saln';

// Helper function to convert Date to string (YYYY-MM-DD)
function dateToString(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
}

// Helper function to convert number to decimal string
function toDecimal(num: number | null | undefined): string | undefined {
  if (num == null) return undefined;
  return num.toString();
}

// Convert mock data to database format
const mockPdsPersonalInfo = rawPdsPersonalInfo.map((info) => ({
  ...info,
  dateOfBirth: dateToString(info.dateOfBirth)!,
  heightM: toDecimal(info.heightM),
  weightKg: toDecimal(info.weightKg),
}));

const mockPdsChildren = rawPdsChildren.map((child) => ({
  ...child,
  dateOfBirth: dateToString(child.dateOfBirth)!,
}));

const mockPdsEducation = rawPdsEducation.map((edu) => ({
  ...edu,
  periodFrom: dateToString(edu.periodFrom),
  periodTo: dateToString(edu.periodTo),
}));

const mockPdsCivilService = rawPdsCivilService.map((cs) => ({
  ...cs,
  rating: toDecimal(cs.rating),
  dateOfExam: dateToString(cs.dateOfExam),
  licenseValidityDate: dateToString(cs.licenseValidityDate),
}));

const mockPdsWorkExperience = rawPdsWorkExperience.map((work) => ({
  ...work,
  monthlySalary: toDecimal(work.monthlySalary),
  dateFrom: dateToString(work.dateFrom)!,
  dateTo: dateToString(work.dateTo),
}));

const mockPdsVoluntaryWork = rawPdsVoluntaryWork.map((vol) => ({
  ...vol,
  dateFrom: dateToString(vol.dateFrom)!,
  dateTo: dateToString(vol.dateTo),
}));

const mockPdsTraining = rawPdsTraining.map((training) => ({
  ...training,
  dateFrom: dateToString(training.dateFrom)!,
  dateTo: dateToString(training.dateTo)!,
}));

const mockSalnRealProperties = rawSalnRealProperties.map((prop) => ({
  ...prop,
  assessedValue: toDecimal(prop.assessedValue)!,
  currentFairMarketValue: toDecimal(prop.currentFairMarketValue)!,
  acquisitionCost: toDecimal(prop.acquisitionCost)!,
}));

const mockSalnPersonalProperties = rawSalnPersonalProperties.map((prop) => ({
  ...prop,
  acquisitionCost: toDecimal(prop.acquisitionCost)!,
}));

const mockSalnLiabilities = rawSalnLiabilities.map((liability) => ({
  ...liability,
  outstandingBalance: toDecimal(liability.outstandingBalance)!,
}));

const mockSalnBusinessInterests = rawSalnBusinessInterests.map((business) => ({
  ...business,
  dateOfAcquisition: dateToString(business.dateOfAcquisition)!,
}));

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. Seed Departments
    console.log('📁 Seeding departments...');
    for (const dept of mockDepartments) {
      await db.insert(departments).values(dept).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockDepartments.length} departments\n`);

    // 2. Seed Positions
    console.log('💼 Seeding positions...');
    for (const position of mockPositions) {
      await db.insert(positions).values(position).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockPositions.length} positions\n`);

    // 3. Seed Profiles (Users)
    // Note: In production, profiles are created via Supabase Auth trigger
    // This is for development/testing only
    console.log('👤 Seeding user profiles...');
    for (const profile of mockProfiles) {
      await db.insert(profiles).values(profile).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockProfiles.length} user profiles\n`);

    // 4. Seed PDS Submissions
    console.log('📄 Seeding PDS submissions...');
    for (const submission of mockPdsSubmissions) {
      await db.insert(pdsSubmissions).values(submission).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockPdsSubmissions.length} PDS submissions\n`);

    // 5. Seed PDS Personal Info
    console.log('👨 Seeding PDS personal info...');
    for (const info of mockPdsPersonalInfo) {
      await db.insert(pdsPersonalInfo).values(info).onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockPdsPersonalInfo.length} PDS personal info records\n`
    );

    // 6. Seed PDS Family Background
    console.log('👪 Seeding PDS family background...');
    for (const family of mockPdsFamilyBackground) {
      await db.insert(pdsFamilyBackground).values(family).onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockPdsFamilyBackground.length} PDS family records\n`
    );

    // 7. Seed PDS Children
    console.log('👶 Seeding PDS children...');
    for (const child of mockPdsChildren) {
      await db.insert(pdsChildren).values(child).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockPdsChildren.length} PDS children records\n`);

    // 8. Seed PDS Education
    console.log('🎓 Seeding PDS education...');
    for (const edu of mockPdsEducation) {
      await db.insert(pdsEducation).values(edu).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockPdsEducation.length} PDS education records\n`);

    // 9. Seed PDS Civil Service
    console.log('📜 Seeding PDS civil service eligibility...');
    for (const cs of mockPdsCivilService) {
      await db.insert(pdsCivilService).values(cs).onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockPdsCivilService.length} PDS civil service records\n`
    );

    // 10. Seed PDS Work Experience
    console.log('💼 Seeding PDS work experience...');
    for (const work of mockPdsWorkExperience) {
      await db.insert(pdsWorkExperience).values(work).onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockPdsWorkExperience.length} PDS work experience records\n`
    );

    // 11. Seed PDS Voluntary Work
    console.log('🤝 Seeding PDS voluntary work...');
    for (const vol of mockPdsVoluntaryWork) {
      await db.insert(pdsVoluntaryWork).values(vol).onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockPdsVoluntaryWork.length} PDS voluntary work records\n`
    );

    // 12. Seed PDS Training
    console.log('📚 Seeding PDS training...');
    for (const training of mockPdsTraining) {
      await db.insert(pdsTraining).values(training).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockPdsTraining.length} PDS training records\n`);

    // 13. Seed PDS Other Info
    console.log('ℹ️ Seeding PDS other info...');
    for (const other of mockPdsOtherInfo) {
      await db.insert(pdsOtherInfo).values(other).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockPdsOtherInfo.length} PDS other info records\n`);

    // 14. Seed SALN Submissions
    console.log('💰 Seeding SALN submissions...');
    for (const saln of mockSalnSubmissions) {
      await db.insert(salnSubmissions).values(saln).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockSalnSubmissions.length} SALN submissions\n`);

    // 15. Seed SALN Real Properties
    console.log('🏠 Seeding SALN real properties...');
    for (const prop of mockSalnRealProperties) {
      await db.insert(salnRealProperties).values(prop).onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockSalnRealProperties.length} SALN real properties\n`
    );

    // 16. Seed SALN Personal Properties
    console.log('🚗 Seeding SALN personal properties...');
    for (const prop of mockSalnPersonalProperties) {
      await db
        .insert(salnPersonalProperties)
        .values(prop)
        .onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockSalnPersonalProperties.length} SALN personal properties\n`
    );

    // 17. Seed SALN Liabilities
    console.log('💳 Seeding SALN liabilities...');
    for (const liability of mockSalnLiabilities) {
      await db.insert(salnLiabilities).values(liability).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${mockSalnLiabilities.length} SALN liabilities\n`);

    // 18. Seed SALN Business Interests
    console.log('🏢 Seeding SALN business interests...');
    for (const business of mockSalnBusinessInterests) {
      await db
        .insert(salnBusinessInterests)
        .values(business)
        .onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockSalnBusinessInterests.length} SALN business interests\n`
    );

    // 19. Seed SALN Relatives in Government
    console.log('👔 Seeding SALN relatives in government...');
    for (const relative of mockSalnRelativesInGov) {
      await db
        .insert(salnRelativesInGov)
        .values(relative)
        .onConflictDoNothing();
    }
    console.log(
      `✓ Seeded ${mockSalnRelativesInGov.length} SALN relatives in government\n`
    );

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   - ${mockDepartments.length} departments`);
    console.log(`   - ${mockPositions.length} positions`);
    console.log(`   - ${mockProfiles.length} user profiles`);
    console.log(
      `   - ${mockPdsSubmissions.length} PDS submissions (with all related data)`
    );
    console.log(
      `   - ${mockSalnSubmissions.length} SALN submissions (with all related data)`
    );
    console.log('\n🎯 Next Steps:');
    console.log('   1. Run `npm run db:studio` to view seeded data');
    console.log('   2. Apply RLS policies from sql/rls-policies.sql');
    console.log('   3. Set up Supabase Storage buckets');
    console.log('   4. Test authentication flow\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seed function
seed();
