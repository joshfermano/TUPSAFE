// Profile Certifications - shared types for employee and admin apps

export type CertificationVerificationStatus =
  | 'pending'
  | 'verified'
  | 'rejected';

export interface CertificationFileData {
  id: string;
  certificationId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string | null;
  createdAt: string;
}

export interface ProfileCertificationData {
  id: string;
  userId: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  hours: number | null;
  typeOfLd: string | null;
  conductedBy: string | null;
  verificationStatus: CertificationVerificationStatus;
  verificationNotes: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  files: CertificationFileData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificationRequest {
  title: string;
  dateFrom: string;
  dateTo: string;
  hours?: number | null;
  typeOfLd?: string | null;
  conductedBy?: string | null;
}

export interface UpdateCertificationRequest {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  hours?: number | null;
  typeOfLd?: string | null;
  conductedBy?: string | null;
}

export interface VerifyCertificationRequest {
  status: 'verified' | 'rejected';
  notes?: string;
}
