import {
  User,
  AccountStatus,
  OnboardingStatus,
  Role,
  TraineeProfile,
  TrainerProfile,
  TrainerEvidence,
  VerificationStatus,
  Course,
  CourseStatus,
  Competency,
  TrainingNeed,
  MatchResult,
  Enrollment,
  EnrollmentStatus,
  Assessment,
  Attempt,
  Resource,
  Feedback,
  Announcement,
  Certificate,
  AuditEvent,
  NotificationItem,
  Application,
  ApplicationStatus,
  RegistrationDraft,
  TraineeApplicationPayload,
  TrainerApplicationPayload,
} from '../../domain/types';

export interface IUserRepository {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
  verifyCredentials(email: string, password: string): Promise<User | null>;
  updateOnboarding(userId: string, status: OnboardingStatus, step?: number): Promise<User>;
  getTraineeProfile(userId: string): Promise<TraineeProfile | null>;
  getTrainerProfile(userId: string): Promise<TrainerProfile | null>;
  updateUserStatus(id: string, status: AccountStatus): Promise<User>;
  updateUserRole(id: string, role: Role): Promise<User>;
  updateTraineeProfile(userId: string, data: Partial<TraineeProfile>): Promise<TraineeProfile>;
  updateTrainerProfile(userId: string, data: Partial<TrainerProfile>): Promise<TrainerProfile>;
  addTrainerEvidence(evidence: Omit<TrainerEvidence, 'id'>): Promise<TrainerEvidence>;
  updateTrainerEvidence(evidence: TrainerEvidence): Promise<TrainerEvidence>;
  verifyTrainerEvidence(evidenceId: string, status: VerificationStatus, verifiedBy: string): Promise<TrainerEvidence>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'synthetic'>): Promise<User>;
}

export interface ICourseRepository {
  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | null>;
  createCourse(course: Omit<Course, 'id' | 'version'>): Promise<Course>;
  updateCourse(course: Course): Promise<Course>;
  transitionCourseStatus(id: string, status: CourseStatus, reason?: string): Promise<Course>;
  assignTrainer(courseId: string, trainerId: string): Promise<Course>;
}

export interface ICompetencyRepository {
  getCompetencies(): Promise<Competency[]>;
  getCompetencyById(id: string): Promise<Competency | null>;
  createCompetency(competency: Omit<Competency, 'id'>): Promise<Competency>;
  updateCompetency(competency: Competency): Promise<Competency>;
  markAsReviewed(id: string): Promise<Competency>;
}

export interface ITrainingNeedRepository {
  getNeeds(): Promise<TrainingNeed[]>;
  getNeedById(id: string): Promise<TrainingNeed | null>;
  createNeed(need: Omit<TrainingNeed, 'id'>): Promise<TrainingNeed>;
  updateNeed(need: TrainingNeed): Promise<TrainingNeed>;
  saveMatchDecision(needId: string, trainerId: string, decision: 'accepted' | 'rejected' | 'overridden', note?: string): Promise<TrainingNeed>;
}

export interface IEnrollmentRepository {
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByTrainee(traineeId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  createEnrollment(traineeId: string, courseId: string): Promise<Enrollment>;
  updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<Enrollment>;
  updateAttendance(id: string, attendancePct: number): Promise<Enrollment>;
}

export interface IAssessmentRepository {
  getAssessments(): Promise<Assessment[]>;
  getAssessmentsByCourse(courseId: string): Promise<Assessment[]>;
  getAssessmentById(id: string): Promise<Assessment | null>;
  createAssessment(assessment: Omit<Assessment, 'id'>): Promise<Assessment>;
  updateAssessment(assessment: Assessment): Promise<Assessment>;
  getAttempts(traineeId?: string): Promise<Attempt[]>;
  submitAttempt(attempt: Omit<Attempt, 'id' | 'submittedAt'>): Promise<Attempt>;
}

export interface IResourceRepository {
  getResources(): Promise<Resource[]>;
  getResourcesByCourse(courseId: string): Promise<Resource[]>;
  createResource(resource: Omit<Resource, 'id' | 'uploadedAt'>): Promise<Resource>;
  deleteResource(id: string): Promise<boolean>;
}

export interface IFeedbackRepository {
  getFeedbacks(courseId?: string): Promise<Feedback[]>;
  submitFeedback(feedback: Omit<Feedback, 'id' | 'submittedAt'>): Promise<Feedback>;
}

export interface IAnnouncementRepository {
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncementById(id: string): Promise<Announcement | null>;
  createAnnouncement(announcement: Omit<Announcement, 'id' | 'publishedAt'>): Promise<Announcement>;
  updateAnnouncement(announcement: Announcement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<boolean>;
}

export interface ICertificateRepository {
  getCertificates(traineeId?: string): Promise<Certificate[]>;
  issueCertificate(certificate: Omit<Certificate, 'id' | 'issuedAt' | 'synthetic'>): Promise<Certificate>;
}

export interface IAuditRepository {
  getAuditEvents(): Promise<AuditEvent[]>;
  logAuditEvent(event: Omit<AuditEvent, 'id' | 'at'>): Promise<AuditEvent>;
}

export interface IApplicationRepository {
  getApplications(status?: ApplicationStatus): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | null>;
  getApplicationByUserId(userId: string): Promise<Application | null>;
  createApplication(app: Omit<Application, 'id' | 'submittedAt'>): Promise<Application>;
  decideApplication(
    id: string,
    decision: 'approved' | 'rejected' | 'needs_info',
    adminNote?: string,
    decidedBy?: string
  ): Promise<Application>;
  resubmitApplication(
    id: string,
    payload: TraineeApplicationPayload | TrainerApplicationPayload
  ): Promise<Application>;
}

export interface IRegistrationDraftRepository {
  getDraft(email: string, role: Role): Promise<RegistrationDraft | null>;
  saveDraft(draft: RegistrationDraft): Promise<void>;
  deleteDraft(email: string, role: Role): Promise<void>;
}

export interface INotificationRepository {
  getNotifications(userId: string): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  addNotification(
    notifData: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>
  ): Promise<NotificationItem>;
}

export interface IRepositories {
  users: IUserRepository;
  courses: ICourseRepository;
  competencies: ICompetencyRepository;
  trainingNeeds: ITrainingNeedRepository;
  enrollments: IEnrollmentRepository;
  assessments: IAssessmentRepository;
  resources: IResourceRepository;
  feedbacks: IFeedbackRepository;
  announcements: IAnnouncementRepository;
  certificates: ICertificateRepository;
  audit: IAuditRepository;
  notifications: INotificationRepository;
  applications: IApplicationRepository;
  registrationDrafts: IRegistrationDraftRepository;
  resetDatabase(): Promise<void>;
}
