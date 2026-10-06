import { repositories } from '../data';
import {
  User,
  AccountStatus,
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
  OnboardingStatus,
} from '../domain/types';
import { MatchingWeightsConfig, APP_CONFIG } from '../config/app.config';
import { runTrainerMatch, MatchingTarget, TrainerWithProfile } from '../domain/matching/trainerMatcher';

// ----------------------------------------------------
// User Service
// ----------------------------------------------------
export const userService = {
  getUsers: () => repositories.users.getUsers(),
  getUserById: (id: string) => repositories.users.getUserById(id),
  getUserByEmail: (email: string) => repositories.users.getUserByEmail(email),
  getTraineeProfile: (userId: string) => repositories.users.getTraineeProfile(userId),
  getTrainerProfile: (userId: string) => repositories.users.getTrainerProfile(userId),
  updateUserStatus: (id: string, status: AccountStatus) => repositories.users.updateUserStatus(id, status),
  updateUserRole: (id: string, role: Role) => repositories.users.updateUserRole(id, role),
  updateTraineeProfile: (userId: string, data: Partial<TraineeProfile>) =>
    repositories.users.updateTraineeProfile(userId, data),
  updateTrainerProfile: (userId: string, data: Partial<TrainerProfile>) =>
    repositories.users.updateTrainerProfile(userId, data),
  addTrainerEvidence: (evidence: Omit<TrainerEvidence, 'id'>) =>
    repositories.users.addTrainerEvidence(evidence),
  updateTrainerEvidence: (evidence: TrainerEvidence) =>
    repositories.users.updateTrainerEvidence(evidence),
  verifyTrainerEvidence: (evidenceId: string, status: VerificationStatus, verifiedBy: string) =>
    repositories.users.verifyTrainerEvidence(evidenceId, status, verifiedBy),
  registerUser: (data: Omit<User, 'id' | 'createdAt' | 'synthetic'>) =>
    repositories.users.createUser(data),

  getAllTrainersWithProfiles: async (): Promise<TrainerWithProfile[]> => {
    const users = await repositories.users.getUsers();
    const trainerUsers = users.filter((u) => u.role === 'trainer' && u.status === 'approved');
    const trainersWithProfiles: TrainerWithProfile[] = [];

    for (const user of trainerUsers) {
      const profile = await repositories.users.getTrainerProfile(user.id);
      if (profile) {
        trainersWithProfiles.push({ user, profile });
      }
    }
    return trainersWithProfiles;
  },
};

// ----------------------------------------------------
// Auth Service
// ----------------------------------------------------
export const authService = {
  emailExists: (email: string) => repositories.users.emailExists(email),
  verifyCredentials: (email: string, password: string) =>
    repositories.users.verifyCredentials(email, password),
  registerUser: (
    data: Omit<User, 'id' | 'createdAt' | 'synthetic'> & { password?: string }
  ) => repositories.users.createUser(data),
};

// ----------------------------------------------------
// Application Service
// ----------------------------------------------------
export const applicationService = {
  getApplications: (status?: ApplicationStatus) =>
    repositories.applications.getApplications(status),
  getApplicationById: (id: string) => repositories.applications.getApplicationById(id),
  getApplicationByUserId: (userId: string) =>
    repositories.applications.getApplicationByUserId(userId),
  createApplication: (app: Omit<Application, 'id' | 'submittedAt'>) =>
    repositories.applications.createApplication(app),
  decideApplication: (
    id: string,
    decision: 'approved' | 'rejected' | 'needs_info',
    adminNote?: string,
    decidedBy?: string
  ) => repositories.applications.decideApplication(id, decision, adminNote, decidedBy),
  resubmitApplication: (
    id: string,
    payload: TraineeApplicationPayload | TrainerApplicationPayload
  ) => repositories.applications.resubmitApplication(id, payload),
};

// ----------------------------------------------------
// Registration Draft Service
// ----------------------------------------------------
export const draftService = {
  getDraft: (email: string, role: Role) => repositories.registrationDrafts.getDraft(email, role),
  saveDraft: (draft: RegistrationDraft) => repositories.registrationDrafts.saveDraft(draft),
  deleteDraft: (email: string, role: Role) =>
    repositories.registrationDrafts.deleteDraft(email, role),
};

// ----------------------------------------------------
// Onboarding Service
// ----------------------------------------------------
export const onboardingService = {
  updateOnboarding: (userId: string, status: OnboardingStatus, step?: number) =>
    repositories.users.updateOnboarding(userId, status, step),
  getApplicationForUser: (userId: string) =>
    repositories.applications.getApplicationByUserId(userId),
};

// ----------------------------------------------------
// Course Service
// ----------------------------------------------------
export const courseService = {
  getCourses: () => repositories.courses.getCourses(),
  getCourseById: (id: string) => repositories.courses.getCourseById(id),
  createCourse: (course: Omit<Course, 'id' | 'version'>) => repositories.courses.createCourse(course),
  updateCourse: (course: Course) => repositories.courses.updateCourse(course),
  transitionCourseStatus: (id: string, status: CourseStatus, reason?: string) =>
    repositories.courses.transitionCourseStatus(id, status, reason),
  assignTrainer: (courseId: string, trainerId: string) =>
    repositories.courses.assignTrainer(courseId, trainerId),
};

// ----------------------------------------------------
// Competency Service
// ----------------------------------------------------
export const competencyService = {
  getCompetencies: () => repositories.competencies.getCompetencies(),
  getCompetencyById: (id: string) => repositories.competencies.getCompetencyById(id),
  createCompetency: (comp: Omit<Competency, 'id'>) => repositories.competencies.createCompetency(comp),
  updateCompetency: (comp: Competency) => repositories.competencies.updateCompetency(comp),
  markAsReviewed: (id: string) => repositories.competencies.markAsReviewed(id),
};

// ----------------------------------------------------
// Training Need Service
// ----------------------------------------------------
export const trainingNeedService = {
  getNeeds: () => repositories.trainingNeeds.getNeeds(),
  getNeedById: (id: string) => repositories.trainingNeeds.getNeedById(id),
  createNeed: (need: Omit<TrainingNeed, 'id'>) => repositories.trainingNeeds.createNeed(need),
  updateNeed: (need: TrainingNeed) => repositories.trainingNeeds.updateNeed(need),
  saveMatchDecision: (
    needId: string,
    trainerId: string,
    decision: 'accepted' | 'rejected' | 'overridden',
    note?: string
  ) => repositories.trainingNeeds.saveMatchDecision(needId, trainerId, decision, note),
};

// ----------------------------------------------------
// Matching Service (Pure Engine Integration)
// ----------------------------------------------------
export const matchingService = {
  runMatch: async (
    target: MatchingTarget,
    weights: MatchingWeightsConfig = APP_CONFIG.matching.defaultWeights
  ): Promise<MatchResult[]> => {
    const trainers = await userService.getAllTrainersWithProfiles();
    const competencies = await competencyService.getCompetencies();
    return runTrainerMatch(target, trainers, competencies, weights);
  },
};

// ----------------------------------------------------
// Enrollment Service
// ----------------------------------------------------
export const enrollmentService = {
  getEnrollments: () => repositories.enrollments.getEnrollments(),
  getEnrollmentsByTrainee: (traineeId: string) =>
    repositories.enrollments.getEnrollmentsByTrainee(traineeId),
  getEnrollmentsByCourse: (courseId: string) =>
    repositories.enrollments.getEnrollmentsByCourse(courseId),
  enrollInCourse: (traineeId: string, courseId: string) =>
    repositories.enrollments.createEnrollment(traineeId, courseId),
  updateEnrollmentStatus: (id: string, status: EnrollmentStatus) =>
    repositories.enrollments.updateEnrollmentStatus(id, status),
  updateAttendance: (id: string, attendancePct: number) =>
    repositories.enrollments.updateAttendance(id, attendancePct),
};

// ----------------------------------------------------
// Assessment Service
// ----------------------------------------------------
export const assessmentService = {
  getAssessments: () => repositories.assessments.getAssessments(),
  getAssessmentsByCourse: (courseId: string) =>
    repositories.assessments.getAssessmentsByCourse(courseId),
  getAssessmentById: (id: string) => repositories.assessments.getAssessmentById(id),
  createAssessment: (assessment: Omit<Assessment, 'id'>) =>
    repositories.assessments.createAssessment(assessment),
  updateAssessment: (assessment: Assessment) =>
    repositories.assessments.updateAssessment(assessment),
  getAttempts: (traineeId?: string) => repositories.assessments.getAttempts(traineeId),
  submitAttempt: (attempt: Omit<Attempt, 'id' | 'submittedAt'>) =>
    repositories.assessments.submitAttempt(attempt),
};

// ----------------------------------------------------
// Resource Service
// ----------------------------------------------------
export const resourceService = {
  getResources: () => repositories.resources.getResources(),
  getResourcesByCourse: (courseId: string) =>
    repositories.resources.getResourcesByCourse(courseId),
  createResource: (resource: Omit<Resource, 'id' | 'uploadedAt'>) =>
    repositories.resources.createResource(resource),
  deleteResource: (id: string) => repositories.resources.deleteResource(id),
};

// ----------------------------------------------------
// Feedback Service
// ----------------------------------------------------
export const feedbackService = {
  getFeedbacks: (courseId?: string) => repositories.feedbacks.getFeedbacks(courseId),
  submitFeedback: (feedback: Omit<Feedback, 'id' | 'submittedAt'>) =>
    repositories.feedbacks.submitFeedback(feedback),
};

// ----------------------------------------------------
// Announcement Service
// ----------------------------------------------------
export const announcementService = {
  getAnnouncements: () => repositories.announcements.getAnnouncements(),
  getAnnouncementById: (id: string) => repositories.announcements.getAnnouncementById(id),
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'publishedAt'>) =>
    repositories.announcements.createAnnouncement(announcement),
  updateAnnouncement: (announcement: Announcement) =>
    repositories.announcements.updateAnnouncement(announcement),
  deleteAnnouncement: (id: string) => repositories.announcements.deleteAnnouncement(id),
};

// ----------------------------------------------------
// Certificate Service
// ----------------------------------------------------
export const certificateService = {
  getCertificates: (traineeId?: string) => repositories.certificates.getCertificates(traineeId),
  issueCertificate: (cert: Omit<Certificate, 'id' | 'issuedAt' | 'synthetic'>) =>
    repositories.certificates.issueCertificate(cert),
};

// ----------------------------------------------------
// Audit Service
// ----------------------------------------------------
export const auditService = {
  getAuditEvents: () => repositories.audit.getAuditEvents(),
  logAuditEvent: (event: Omit<AuditEvent, 'id' | 'at'>) =>
    repositories.audit.logAuditEvent(event),
};

// ----------------------------------------------------
// Notification Service
// ----------------------------------------------------
export const notificationService = {
  getNotifications: (userId: string) => repositories.notifications.getNotifications(userId),
  markAsRead: (id: string) => repositories.notifications.markAsRead(id),
  markAllAsRead: (userId: string) => repositories.notifications.markAllAsRead(userId),
};

// ----------------------------------------------------
// Database Reset
// ----------------------------------------------------
export const systemService = {
  resetDatabase: () => repositories.resetDatabase(),
};
