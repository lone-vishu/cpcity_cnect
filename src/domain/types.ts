export type Role = 'trainee' | 'trainer' | 'admin';

export type AccountStatus = 'pending' | 'needs_info' | 'approved' | 'rejected' | 'suspended';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'complete';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  centreId: string;
  createdAt: string;
  synthetic: true;
  onboardingStatus?: OnboardingStatus;
  onboardingStep?: number;
  demoQuickAccess?: boolean;
  passwordHash?: string;
}

export interface TraineeCertificate {
  id: string;
  title: string;
  issuer: string;
  issuedYear: number;
  fileName?: string;
}

export interface TraineeProfile {
  userId: string;
  designation: string;
  qualifications: string[];
  experience: string[];
  interests: string[];
  skills: string[];
  certificates: TraineeCertificate[];
}

export interface AvailabilityWindow {
  id: string;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
  notes?: string;
  preferredModes?: DeliveryMode[];
  from?: string;
  to?: string;
}

export type EvidenceType = 'certification' | 'delivered_course' | 'qualification' | 'publication';
export type VerificationStatus = 'unverified' | 'verified';

export interface TrainerEvidence {
  id: string;
  trainerId: string;
  competencyId: string;
  type: EvidenceType;
  count: number;
  years: number;
  sourceNote: string;
  verifiedStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  title?: string;
  details?: string;
  status?: string;
}

export interface TrainerProfile {
  userId: string;
  bio: string;
  subjects: string[];
  qualifications: string[];
  evidence: TrainerEvidence[];
  availability: AvailabilityWindow[];
  centreId: string;
}

export interface Centre {
  id: string;
  name: string;
  code: string;
}

export type CompetencyLevel = 1 | 2 | 3 | 4;
export type CompetencyReviewStatus = 'demo' | 'reviewed';

export interface Competency {
  id: string;
  name: string;
  domain: string;
  level: CompetencyLevel;
  description: string;
  source: string;
  version: string;
  reviewStatus: CompetencyReviewStatus;
}

export type DeliveryMode = 'in_person' | 'online' | 'blended';

export type CourseStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'archived';

export interface Course {
  id: string;
  title: string;
  subject: string;
  objectives: string[];
  competencyIds: string[];
  prerequisites: string[];
  deliveryMode: DeliveryMode;
  centreId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  trainerId?: string;
  status: CourseStatus;
  version: number;
  rejectionReason?: string;
}

export type TrainingNeedStatus = 'open' | 'matched' | 'closed';

export interface DateWindow {
  startDate: string;
  endDate: string;
}

export interface TrainingNeed {
  id: string;
  title: string;
  requiredCompetencyIds: string[];
  targetCentreId: string;
  deliveryMode: DeliveryMode;
  window: DateWindow;
  createdBy: string;
  status: TrainingNeedStatus;
  matchedTrainerId?: string;
}

export type MatchDecision = 'accepted' | 'rejected' | 'overridden';

export interface MatchFactorBreakdown {
  competency: number; // 0-100 normalized
  qualification: number; // 0-100 normalized
  priorDelivery: number; // 0-100 normalized
  availabilityFit: number; // 0-100 normalized
}

export interface MatchResult {
  needId?: string;
  courseId?: string;
  trainerId: string;
  trainerName: string;
  trainerEmail?: string;
  trainerCentreId: string;
  score: number; // 0 - 100 overall weighted
  breakdown: MatchFactorBreakdown;
  evidence: TrainerEvidence[];
  missingInfo: string[];
  explanation: string;
  decision?: MatchDecision;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

export type EnrollmentStatus = 'requested' | 'enrolled' | 'waitlisted' | 'completed' | 'dropped';

export interface Enrollment {
  id: string;
  traineeId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  attendancePct: number;
  completedAt?: string;
}

export type ResourceType = 'video' | 'slides' | 'document' | 'link';
export type ResourceVisibility = 'enrolled' | 'public_trainees' | 'trainers_only';

export interface FileMetadata {
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;
}

export interface Resource {
  id: string;
  courseId?: string;
  trainerId: string;
  type: ResourceType;
  title: string;
  description: string;
  fileMeta?: FileMetadata;
  visibility: ResourceVisibility;
  uploadedAt: string;
}

export type AssessmentStatus = 'draft' | 'published' | 'closed';

export interface MCQ {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  competencyId?: string;
  explanation: string;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  deadline: string;
  durationMin: number;
  questions: MCQ[];
  status: AssessmentStatus;
}

export interface Attempt {
  id: string;
  assessmentId: string;
  traineeId: string;
  answers: number[];
  score: number; // percentage 0-100
  submittedAt: string;
}

export interface Feedback {
  id: string;
  courseId: string;
  traineeId: string;
  rating: number; // 1-5
  comment: string;
  submittedAt: string;
}

export type AnnouncementType = 'notice' | 'announcement' | 'achievement' | 'new_content';

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  body: string;
  publishedBy: string;
  publishedAt: string;
  pinned: boolean;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  traineeId: string;
  traineeName: string;
  issuedAt: string;
  code: string;
  synthetic: true;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  at: string;
  meta?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ----------------------------------------------------
// Registration & Application Data Models
// ----------------------------------------------------
export type ApplicationStatus = 'submitted' | 'needs_info' | 'approved' | 'rejected';

export interface QualificationEntry {
  id?: string;
  degree: string;
  institution: string;
  year: number | string;
  field: string;
}

export interface ExperienceEntry {
  id?: string;
  organization: string;
  role: string;
  fromYear: number | string;
  toYear?: number | string;
  current?: boolean;
  description: string;
}

export interface SkillEntry {
  name: string;
  level: CompetencyLevel;
}

export interface ApplicationCertificateEntry {
  id?: string;
  title: string;
  issuer: string;
  year: number | string;
  credentialId?: string;
  file?: { name: string; size: number; type: string };
  fileMeta?: FileMetadata;
}

export interface TraineeApplicationPayload {
  name?: string;
  email?: string;
  password?: string;
  centreId?: string;
  designation: string;
  consentGiven?: boolean;
  qualifications: QualificationEntry[];
  experience: ExperienceEntry[];
  isFresher?: boolean;
  skills: SkillEntry[];
  interests: string[];
  certificates: ApplicationCertificateEntry[];
}

export interface DeclaredCompetencyEntry {
  competencyId?: string;
  id?: string;
  name?: string;
  domain?: string;
  level: CompetencyLevel;
}

export interface ApplicationEvidenceEntry {
  id?: string;
  competencyId: string;
  type: EvidenceType;
  count: number;
  years?: number;
  sourceNote?: string;
  notes?: string;
  file?: { name: string; size: number; type: string } | FileMetadata;
  fileMeta?: FileMetadata;
  verifiedStatus?: VerificationStatus;
}

export interface TrainerApplicationPayload {
  name?: string;
  email?: string;
  password?: string;
  centreId: string;
  deliveryModes: DeliveryMode[] | string[];
  consentGiven?: boolean;
  qualifications: QualificationEntry[];
  subjects: string[];
  competencies?: DeclaredCompetencyEntry[];
  declaredCompetencies?: DeclaredCompetencyEntry[];
  evidence: ApplicationEvidenceEntry[];
  experience: ExperienceEntry[] | any[];
  availability: AvailabilityWindow[] | any[];
  preferredCentres: string[];
  bio?: string;
}

export interface Application {
  id: string;
  userId: string;
  role: Role;
  revision: number;
  status: ApplicationStatus;
  payload: TraineeApplicationPayload | TrainerApplicationPayload;
  adminNote?: string;
  decidedBy?: string;
  decidedAt?: string;
  submittedAt: string;
}

export interface RegistrationDraft {
  email: string;
  role: Role;
  step: number;
  payload: Partial<TraineeApplicationPayload | TrainerApplicationPayload>;
  updatedAt: string;
}

export interface Credential {
  userId: string;
  passwordHash: string;
  updatedAt: string;
}

