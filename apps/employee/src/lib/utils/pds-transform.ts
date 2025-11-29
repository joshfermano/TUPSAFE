/**
 * PDS Data Transformation Utilities
 *
 * Transforms PDS data from the API/database format to the PDF generation format.
 * The PDF generator expects a specific PDSData structure that differs from
 * the database schema structure.
 */

import type { PDSData } from '../../components/pds/pdf/types';

/**
 * Transform mock/API PDS data to PDF-compatible format
 *
 * @param data - The complete PDS data from API (mock data structure)
 * @returns PDSData formatted for PDF generation
 */
export function transformPdsForPdf(data: any): PDSData {
  // Handle both direct structure and nested submission structure
  const personalInfo = data.personalInfo || {};
  const familyBackground = data.familyBackground || data.family || {};
  const children = data.children || familyBackground.children || [];
  const education = data.education || {};
  const civilService = data.civilService || data.eligibility || [];
  const workExperience = data.workExperience || [];
  const voluntaryWork = data.voluntaryWork || [];
  const training = data.training || data.learningDevelopment || [];
  const otherInfo = data.otherInfo || {};

  // Transform address format
  const transformAddress = (addr: any) => {
    if (!addr) return {};
    return {
      houseNumber: addr.houseNumber || addr.house_number || null,
      street: addr.street || addr.streetName || null,
      subdivision: addr.subdivision || null,
      barangay: addr.barangay || null,
      city: addr.city || addr.cityMunicipality || null,
      province: addr.province || null,
      zipCode: addr.zipCode || addr.zip_code || null,
    };
  };

  // Transform education by level
  const transformEducation = () => {
    // Handle object format (keyed by level)
    if (
      education &&
      typeof education === 'object' &&
      !Array.isArray(education)
    ) {
      return {
        elementary: education.elementary
          ? {
              level: 'elementary' as const,
              schoolName: education.elementary.schoolName || '',
              degreeCourse: education.elementary.degreeCourse || null,
              periodFrom: education.elementary.periodFrom || null,
              periodTo: education.elementary.periodTo || null,
              highestLevelEarned:
                education.elementary.highestLevelEarned || null,
              yearGraduated: education.elementary.yearGraduated || null,
              honorsReceived: education.elementary.honorsReceived || null,
            }
          : null,
        secondary: education.secondary
          ? {
              level: 'secondary' as const,
              schoolName: education.secondary.schoolName || '',
              degreeCourse: education.secondary.degreeCourse || null,
              periodFrom: education.secondary.periodFrom || null,
              periodTo: education.secondary.periodTo || null,
              highestLevelEarned:
                education.secondary.highestLevelEarned || null,
              yearGraduated: education.secondary.yearGraduated || null,
              honorsReceived: education.secondary.honorsReceived || null,
            }
          : null,
        vocational: education.vocational
          ? {
              level: 'vocational' as const,
              schoolName: education.vocational.schoolName || '',
              degreeCourse: education.vocational.degreeCourse || null,
              periodFrom: education.vocational.periodFrom || null,
              periodTo: education.vocational.periodTo || null,
              highestLevelEarned:
                education.vocational.highestLevelEarned || null,
              yearGraduated: education.vocational.yearGraduated || null,
              honorsReceived: education.vocational.honorsReceived || null,
            }
          : null,
        college: education.college
          ? {
              level: 'college' as const,
              schoolName: education.college.schoolName || '',
              degreeCourse: education.college.degreeCourse || null,
              periodFrom: education.college.periodFrom || null,
              periodTo: education.college.periodTo || null,
              highestLevelEarned: education.college.highestLevelEarned || null,
              yearGraduated: education.college.yearGraduated || null,
              honorsReceived: education.college.honorsReceived || null,
            }
          : null,
        graduate: education.graduate
          ? {
              level: 'graduate' as const,
              schoolName: education.graduate.schoolName || '',
              degreeCourse: education.graduate.degreeCourse || null,
              periodFrom: education.graduate.periodFrom || null,
              periodTo: education.graduate.periodTo || null,
              highestLevelEarned: education.graduate.highestLevelEarned || null,
              yearGraduated: education.graduate.yearGraduated || null,
              honorsReceived: education.graduate.honorsReceived || null,
            }
          : null,
      };
    }

    // Handle array format
    if (Array.isArray(education)) {
      const result: Record<string, any> = {};
      education.forEach((edu: any) => {
        if (edu.level) {
          result[edu.level] = {
            level: edu.level,
            schoolName: edu.schoolName || '',
            degreeCourse: edu.degreeCourse || null,
            periodFrom: edu.periodFrom || null,
            periodTo: edu.periodTo || null,
            highestLevelEarned: edu.highestLevelEarned || null,
            yearGraduated: edu.yearGraduated || null,
            honorsReceived: edu.honorsReceived || null,
          };
        }
      });
      return result;
    }

    return {
      elementary: null,
      secondary: null,
      vocational: null,
      college: null,
      graduate: null,
    };
  };

  // Transform questions to the PDF format
  const transformQuestions = () => {
    const questions = otherInfo.questions || {};
    return {
      Q34_criminal_charged: questions.Q34_criminal_charged || false,
      Q34_criminal_charged_details:
        questions.Q34_criminal_charged_details || undefined,
      Q35_criminal_convicted: questions.Q35_criminal_convicted || false,
      Q35_criminal_convicted_details:
        questions.Q35_criminal_convicted_details || undefined,
      Q36_separated_from_service: questions.Q36_separated_from_service || false,
      Q36_separated_from_service_details:
        questions.Q36_separated_from_service_details || undefined,
      Q37_candidate_for_election: questions.Q37_candidate_for_election || false,
      Q37_candidate_for_election_details:
        questions.Q37_candidate_for_election_details || undefined,
      Q38_resigned_from_government:
        questions.Q38_resigned_from_government || false,
      Q38_resigned_from_government_details:
        questions.Q38_resigned_from_government_details || undefined,
      Q39_immigrant_or_acquired_residence:
        questions.Q39_immigrant_or_acquired_residence || false,
      Q39_immigrant_or_acquired_residence_details:
        questions.Q39_immigrant_or_acquired_residence_details || undefined,
      Q40_indigenous_group: questions.Q40_indigenous_group || false,
      Q40_indigenous_group_details:
        questions.Q40_indigenous_group_details || undefined,
      Q41_disabled: questions.Q41_disabled || false,
      Q41_disabled_details: questions.Q41_disabled_details || undefined,
      Q42_solo_parent: questions.Q42_solo_parent || false,
      Q42_solo_parent_details: questions.Q42_solo_parent_details || undefined,
    };
  };

  return {
    id: data.id || data.submission?.id || '',
    submittedAt: data.submittedAt || data.submission?.submittedAt || null,
    version: data.version || data.submission?.version || 1,

    personalInfo: {
      surname: personalInfo.surname || '',
      firstName: personalInfo.firstName || '',
      middleName: personalInfo.middleName || null,
      nameExtension: personalInfo.nameExtension || null,
      dateOfBirth: personalInfo.dateOfBirth || new Date(),
      placeOfBirth: personalInfo.placeOfBirth || '',
      sex: personalInfo.sex || 'male',
      civilStatus: personalInfo.civilStatus || 'single',
      heightM: personalInfo.heightM || null,
      weightKg: personalInfo.weightKg || null,
      bloodType: personalInfo.bloodType || null,
      gsisNo: personalInfo.gsisNo || null,
      pagibigNo: personalInfo.pagibigNo || null,
      philhealthNo: personalInfo.philhealthNo || null,
      sssNo: personalInfo.sssNo || null,
      tinNo: personalInfo.tinNo || null,
      agencyEmployeeNo: personalInfo.agencyEmployeeNo || null,
      citizenship: personalInfo.citizenship || { type: 'Filipino' },
      residentialAddress: transformAddress(personalInfo.residentialAddress),
      permanentAddress: transformAddress(personalInfo.permanentAddress),
      telephoneNo: personalInfo.telephoneNo || null,
      mobileNo: personalInfo.mobileNo || null,
      emailAddress: personalInfo.emailAddress || null,
    },

    familyBackground: {
      spouseSurname: familyBackground.spouseSurname || null,
      spouseFirstName: familyBackground.spouseFirstName || null,
      spouseMiddleName: familyBackground.spouseMiddleName || null,
      spouseNameExtension: familyBackground.spouseNameExtension || null,
      spouseOccupation: familyBackground.spouseOccupation || null,
      spouseEmployer: familyBackground.spouseEmployer || null,
      spouseBusinessAddress: familyBackground.spouseBusinessAddress || null,
      spouseTelephoneNo: familyBackground.spouseTelephoneNo || null,
      fatherSurname: familyBackground.fatherSurname || null,
      fatherFirstName: familyBackground.fatherFirstName || null,
      fatherMiddleName: familyBackground.fatherMiddleName || null,
      fatherNameExtension: familyBackground.fatherNameExtension || null,
      motherMaidenSurname: familyBackground.motherMaidenSurname || null,
      motherFirstName: familyBackground.motherFirstName || null,
      motherMiddleName: familyBackground.motherMiddleName || null,
      children: Array.isArray(children)
        ? children.map((child: any) => ({
            fullName: child.fullName || '',
            dateOfBirth: child.dateOfBirth || new Date(),
          }))
        : [],
    },

    education: transformEducation(),

    civilServiceEligibilities: Array.isArray(civilService)
      ? civilService.map((cs: any) => ({
          eligibilityName: cs.eligibilityName || '',
          rating: cs.rating || null,
          dateOfExam: cs.dateOfExam || null,
          placeOfExam: cs.placeOfExam || null,
          licenseNo: cs.licenseNo || null,
          licenseValidityDate: cs.licenseValidityDate || null,
        }))
      : [],

    workExperiences: Array.isArray(workExperience)
      ? workExperience.map((work: any) => ({
          dateFrom: work.dateFrom || new Date(),
          dateTo: work.dateTo || null,
          positionTitle: work.positionTitle || '',
          departmentAgency: work.departmentAgency || '',
          monthlySalary: work.monthlySalary || null,
          salaryGrade: work.salaryGrade || null,
          statusOfAppointment: work.statusOfAppointment || null,
          isGovernment: work.isGovernment || false,
        }))
      : [],

    voluntaryWorks: Array.isArray(voluntaryWork)
      ? voluntaryWork.map((vol: any) => ({
          organizationName: vol.organizationName || '',
          organizationAddress: vol.organizationAddress || null,
          dateFrom: vol.dateFrom || new Date(),
          dateTo: vol.dateTo || null,
          numberOfHours: vol.numberOfHours || null,
          positionNature: vol.positionNature || null,
        }))
      : [],

    trainings: Array.isArray(training)
      ? training.map((t: any) => ({
          title: t.title || '',
          dateFrom: t.dateFrom || new Date(),
          dateTo: t.dateTo || new Date(),
          hours: t.hours || null,
          typeOfLd: t.typeOfLd || null,
          conductedBy: t.conductedBy || null,
        }))
      : [],

    skills: otherInfo.skills || [],
    recognitions: Array.isArray(otherInfo.recognitions)
      ? otherInfo.recognitions.map((r: any) => ({
          title: r.title || '',
          year: r.year || 0,
          organization: r.organization || '',
        }))
      : [],
    associations: Array.isArray(otherInfo.associations)
      ? otherInfo.associations.map((a: any) => ({
          name: a.name || '',
          position: a.position || undefined,
          yearJoined: a.yearJoined || undefined,
        }))
      : [],

    questions: transformQuestions(),

    references: Array.isArray(otherInfo.references)
      ? otherInfo.references.map((ref: any) => ({
          name: ref.name || '',
          address: ref.address || '',
          telephoneNo: ref.telephoneNo || undefined,
        }))
      : [],

    governmentId: data.governmentId || undefined,
    photoUrl: data.photoUrl || null,
  };
}

/**
 * Generate a filename for PDS PDF based on the data
 *
 * @param pdsData - The PDS data
 * @returns A formatted filename string
 */
export function generatePdsFilename(pdsData: PDSData): string {
  const lastName = pdsData.personalInfo.surname || 'Unknown';
  const firstName = pdsData.personalInfo.firstName || 'Unknown';
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Sanitize names for filename
  const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '');

  return `PDS_${sanitizedLastName}_${sanitizedFirstName}_${date}.pdf`;
}
