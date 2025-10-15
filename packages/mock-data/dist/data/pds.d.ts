export type SubmissionStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
export type Sex = 'male' | 'female';
export type CivilStatus = 'single' | 'married' | 'widowed' | 'separated' | 'divorced';
export type EducationLevel = 'elementary' | 'secondary' | 'vocational' | 'college' | 'graduate';
export interface PdsSubmission {
    id: string;
    userId: string;
    version: number;
    status: SubmissionStatus;
    submittedAt: Date | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    isLatest: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PdsPersonalInfo {
    id: string;
    pdsSubmissionId: string;
    surname: string;
    firstName: string;
    middleName: string | null;
    nameExtension: string | null;
    dateOfBirth: Date;
    placeOfBirth: string;
    sex: Sex;
    civilStatus: CivilStatus;
    heightM: number | null;
    weightKg: number | null;
    bloodType: string | null;
    gsisNo: string | null;
    pagibigNo: string | null;
    philhealthNo: string | null;
    sssNo: string | null;
    tinNo: string | null;
    agencyEmployeeNo: string | null;
    citizenship: {
        type: 'Filipino' | 'Dual';
        details?: string;
    };
    residentialAddress: {
        street: string;
        city: string;
        province: string;
        zipCode: string;
    };
    permanentAddress: {
        street: string;
        city: string;
        province: string;
        zipCode: string;
    };
    telephoneNo: string | null;
    mobileNo: string | null;
    emailAddress: string | null;
}
export interface PdsFamilyBackground {
    id: string;
    pdsSubmissionId: string;
    spouseSurname: string | null;
    spouseFirstName: string | null;
    spouseMiddleName: string | null;
    spouseNameExtension: string | null;
    spouseOccupation: string | null;
    spouseEmployer: string | null;
    spouseBusinessAddress: string | null;
    spouseTelephoneNo: string | null;
    fatherSurname: string | null;
    fatherFirstName: string | null;
    fatherMiddleName: string | null;
    motherMaidenSurname: string | null;
    motherFirstName: string | null;
    motherMiddleName: string | null;
}
export interface PdsChildren {
    id: string;
    pdsSubmissionId: string;
    fullName: string;
    dateOfBirth: Date;
}
export interface PdsEducation {
    id: string;
    pdsSubmissionId: string;
    level: EducationLevel;
    schoolName: string;
    degreeCourse: string | null;
    periodFrom: Date | null;
    periodTo: Date | null;
    highestLevelEarned: string | null;
    yearGraduated: number | null;
    honorsReceived: string | null;
}
export interface PdsCivilService {
    id: string;
    pdsSubmissionId: string;
    eligibilityName: string;
    rating: number | null;
    dateOfExam: Date | null;
    placeOfExam: string | null;
    licenseNo: string | null;
    licenseValidityDate: Date | null;
}
export interface PdsWorkExperience {
    id: string;
    pdsSubmissionId: string;
    positionTitle: string;
    departmentAgency: string;
    monthlySalary: number | null;
    salaryGrade: string | null;
    statusOfAppointment: string | null;
    isGovernment: boolean;
    dateFrom: Date;
    dateTo: Date | null;
}
export interface PdsVoluntaryWork {
    id: string;
    pdsSubmissionId: string;
    organizationName: string;
    organizationAddress: string | null;
    dateFrom: Date;
    dateTo: Date | null;
    numberOfHours: number | null;
    positionNature: string | null;
}
export interface PdsTraining {
    id: string;
    pdsSubmissionId: string;
    title: string;
    dateFrom: Date;
    dateTo: Date;
    hours: number | null;
    typeOfLd: string | null;
    conductedBy: string | null;
}
export interface PdsOtherInfo {
    id: string;
    pdsSubmissionId: string;
    skills: string[];
    recognitions: Array<{
        title: string;
        year: number;
        organization: string;
    }>;
    associations: Array<{
        name: string;
        position?: string;
        yearJoined?: number;
    }>;
    questions: Record<string, boolean | string>;
    references: Array<{
        name: string;
        address: string;
        telephoneNo?: string;
    }>;
}
export declare const mockPdsSubmissions: PdsSubmission[];
export declare const mockPdsPersonalInfo: PdsPersonalInfo[];
export declare const mockPdsFamilyBackground: PdsFamilyBackground[];
export declare const mockPdsChildren: PdsChildren[];
export declare const mockPdsEducation: PdsEducation[];
export declare const mockPdsCivilService: PdsCivilService[];
export declare const mockPdsWorkExperience: PdsWorkExperience[];
export declare const mockPdsVoluntaryWork: PdsVoluntaryWork[];
export declare const mockPdsTraining: PdsTraining[];
export declare const mockPdsOtherInfo: PdsOtherInfo[];
export declare function getPdsSubmissionById(id: string): PdsSubmission | undefined;
export declare function getPdsSubmissionsByUserId(userId: string): PdsSubmission[];
export declare function getPdsPersonalInfoBySubmissionId(submissionId: string): PdsPersonalInfo | undefined;
export declare function getPdsFamilyBackgroundBySubmissionId(submissionId: string): PdsFamilyBackground | undefined;
export declare function getPdsChildrenBySubmissionId(submissionId: string): PdsChildren[];
export declare function getPdsEducationBySubmissionId(submissionId: string): PdsEducation[];
export declare function getPdsCivilServiceBySubmissionId(submissionId: string): PdsCivilService[];
export declare function getPdsWorkExperienceBySubmissionId(submissionId: string): PdsWorkExperience[];
export declare function getPdsVoluntaryWorkBySubmissionId(submissionId: string): PdsVoluntaryWork[];
export declare function getPdsTrainingBySubmissionId(submissionId: string): PdsTraining[];
export declare function getPdsOtherInfoBySubmissionId(submissionId: string): PdsOtherInfo | undefined;
export declare function getCompletePdsSubmission(submissionId: string): {
    submission: PdsSubmission;
    personalInfo: PdsPersonalInfo | undefined;
    familyBackground: PdsFamilyBackground | undefined;
    children: PdsChildren[];
    education: PdsEducation[];
    civilService: PdsCivilService[];
    workExperience: PdsWorkExperience[];
    voluntaryWork: PdsVoluntaryWork[];
    training: PdsTraining[];
    otherInfo: PdsOtherInfo | undefined;
} | null;
export declare const mockPdsDataSummary: {
    submissions: number;
    personalInfo: number;
    familyBackground: number;
    children: number;
    education: number;
    civilService: number;
    workExperience: number;
    voluntaryWork: number;
    training: number;
    otherInfo: number;
    statuses: {
        draft: number;
        submitted: number;
        reviewing: number;
        approved: number;
        rejected: number;
    };
};
