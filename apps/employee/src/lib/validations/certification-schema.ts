import { z } from 'zod';

// Base object shape — no refinement so that .partial() is available on it
const certificationBaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),
  dateFrom: z.string().min(1, 'Start date is required'),
  dateTo: z.string().min(1, 'End date is required'),
  hours: z.number().int().min(0).nullable().optional(),
  typeOfLd: z.string().max(100).nullable().optional(),
  conductedBy: z.string().max(500).nullable().optional(),
});

// Create schema: all required fields present, date range must be valid
export const createCertificationSchema = certificationBaseSchema.refine(
  (data) => new Date(data.dateFrom) <= new Date(data.dateTo),
  { message: 'Start date must be before or equal to end date', path: ['dateTo'] }
);

// Partial shape for update validation
const certificationPartialSchema = certificationBaseSchema.partial();
type CertificationPartial = z.infer<typeof certificationPartialSchema>;

// Update schema: all fields optional, date range only validated when both are present
export const updateCertificationSchema = certificationPartialSchema.refine(
  (data: CertificationPartial) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date', path: ['dateTo'] }
);

export type CreateCertificationFormData = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationFormData = z.infer<typeof updateCertificationSchema>;
