import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['trainee', 'trainer'], {
    errorMap: () => ({ message: 'Please select either Trainee or Trainer' }),
  }),
  centreId: z.string().min(1, 'Please select your centre'),
});
export type SignupFormData = z.infer<typeof SignupSchema>;

export const CourseFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  objectives: z.array(z.string().min(1)).min(1, 'At least one objective is required'),
  competencyIds: z.array(z.string()).min(1, 'Select at least one competency'),
  prerequisites: z.array(z.string()).default([]),
  deliveryMode: z.enum(['in_person', 'online', 'blended']),
  centreId: z.string().min(1, 'Please select a centre'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200, 'Capacity cannot exceed 200'),
  trainerId: z.string().optional(),
});
export type CourseFormData = z.infer<typeof CourseFormSchema>;

export const TrainingNeedSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  requiredCompetencyIds: z.array(z.string()).min(1, 'Select at least one competency'),
  targetCentreId: z.string().min(1, 'Please select target centre'),
  deliveryMode: z.enum(['in_person', 'online', 'blended']),
  startDate: z.string().min(1, 'Window start date is required'),
  endDate: z.string().min(1, 'Window end date is required'),
});
export type TrainingNeedFormData = z.infer<typeof TrainingNeedSchema>;

export const ResourceUploadSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  type: z.enum(['video', 'slides', 'document', 'link']),
  visibility: z.enum(['enrolled', 'public_trainees', 'trainers_only']),
  courseId: z.string().optional(),
  linkUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
export type ResourceUploadFormData = z.infer<typeof ResourceUploadSchema>;

export const MCQSchema = z.object({
  id: z.string(),
  prompt: z.string().min(5, 'Question prompt is required'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'At least 2 options required'),
  correctIndex: z.number().int().min(0),
  competencyId: z.string().optional(),
  explanation: z.string().min(5, 'Explanation is required'),
});

export const AssessmentFormSchema = z.object({
  title: z.string().min(5, 'Title is required'),
  courseId: z.string().min(1, 'Please select a course'),
  deadline: z.string().min(1, 'Deadline date is required'),
  durationMin: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  questions: z.array(MCQSchema).min(1, 'At least one question is required'),
});
export type AssessmentFormData = z.infer<typeof AssessmentFormSchema>;

export const FeedbackSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be 1 to 5').max(5),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
});
export type FeedbackFormData = z.infer<typeof FeedbackSchema>;

export const AnnouncementSchema = z.object({
  type: z.enum(['notice', 'announcement', 'achievement', 'new_content']),
  title: z.string().min(5, 'Title is required'),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  pinned: z.boolean().default(false),
});
export type AnnouncementFormData = z.infer<typeof AnnouncementSchema>;

export const TrainerEvidenceSchema = z.object({
  competencyId: z.string().min(1, 'Select a competency'),
  type: z.enum(['certification', 'delivered_course', 'qualification', 'publication']),
  count: z.number().int().min(0, 'Count must be 0 or more'),
  years: z.number().min(0, 'Years must be 0 or more'),
  sourceNote: z.string().min(5, 'Source note or citation is required'),
});
export type TrainerEvidenceFormData = z.infer<typeof TrainerEvidenceSchema>;

export const TraineeProfileSchema = z.object({
  designation: z.string().min(2, 'Designation is required'),
  qualifications: z.array(z.string()),
  experience: z.array(z.string()),
  interests: z.array(z.string()),
  skills: z.array(z.string()),
});
export type TraineeProfileFormData = z.infer<typeof TraineeProfileSchema>;

export const MatchingWeightsSchema = z.object({
  competencyOverlap: z.number().min(0).max(100),
  qualificationRelevance: z.number().min(0).max(100),
  priorDelivery: z.number().min(0).max(100),
  availabilityCentreFit: z.number().min(0).max(100),
}).refine(
  (data) => {
    const sum = data.competencyOverlap + data.qualificationRelevance + data.priorDelivery + data.availabilityCentreFit;
    return sum === 100;
  },
  {
    message: 'Weights must sum exactly to 100%',
    path: ['competencyOverlap'],
  }
);

// ----------------------------------------------------
// Registration & Onboarding Schemas
// ----------------------------------------------------
export const RoleAwareLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['trainee', 'trainer', 'admin']).optional(),
  rememberMe: z.boolean().optional(),
});
export type RoleAwareLoginFormData = z.infer<typeof RoleAwareLoginSchema>;

export const QualificationEntrySchema = z.object({
  id: z.string(),
  degree: z.string().min(2, 'Degree/Certificate title is required'),
  institution: z.string().min(2, 'Institution or University is required'),
  year: z.number().int().min(1960).max(2030),
  field: z.string().min(2, 'Field of study or specialization is required'),
});

export const ExperienceEntrySchema = z.object({
  id: z.string(),
  organization: z.string().min(2, 'Organization or department is required'),
  role: z.string().min(2, 'Role or operational posting is required'),
  fromYear: z.number().int().min(1960).max(2030),
  toYear: z.number().int().min(1960).max(2030).optional(),
  current: z.boolean().default(false),
  description: z.string().min(5, 'Brief responsibilities description is required'),
});

export const SkillEntrySchema = z.object({
  name: z.string().min(2, 'Skill name is required'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const TraineeAccountStepSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  centreId: z.string().min(1, 'Please select your regional training centre'),
  designation: z.string().min(2, 'Current designation or post is required'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to profile data processing' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const TrainerAccountStepSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  centreId: z.string().min(1, 'Please select your regional centre station'),
  deliveryModes: z.array(z.enum(['in_person', 'online', 'blended'])).min(1, 'Select at least one delivery mode offered'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to profile data processing' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

