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
  RegistrationDraft,
  OnboardingStatus,
} from '../../../domain/types';
import { IRepositories } from '../../repositories/interfaces';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('capacity_connect_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${errorBody || response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Backend server unavailable at ${API_BASE_URL}. Ensure the backend service is running or switch VITE_DATA_SOURCE=mock in your .env.`
      );
    }
    throw error;
  }
}

export const httpRepositories: IRepositories = {
  resetDatabase: async () => {
    await request('/admin/reset', { method: 'POST' });
  },

  users: {
    getUsers: () => request<User[]>('/users'),
    getUserById: (id) => request<User>(`/users/${id}`),
    getUserByEmail: (email) => request<User>(`/users/by-email?email=${encodeURIComponent(email)}`),
    getTraineeProfile: (userId) => request<TraineeProfile>(`/trainees/${userId}/profile`),
    getTrainerProfile: (userId) => request<TrainerProfile>(`/trainers/${userId}/profile`),
    updateUserStatus: (id, status) =>
      request<User>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    updateUserRole: (id, role) =>
      request<User>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    updateTraineeProfile: (userId, data) =>
      request<TraineeProfile>(`/trainees/${userId}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    updateTrainerProfile: (userId, data) =>
      request<TrainerProfile>(`/trainers/${userId}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
    addTrainerEvidence: (evidence) =>
      request<TrainerEvidence>('/trainer-evidence', { method: 'POST', body: JSON.stringify(evidence) }),
    updateTrainerEvidence: (evidence) =>
      request<TrainerEvidence>(`/trainer-evidence/${evidence.id}`, { method: 'PUT', body: JSON.stringify(evidence) }),
    verifyTrainerEvidence: (id, status, verifiedBy) =>
      request<TrainerEvidence>(`/trainer-evidence/${id}/verify`, { method: 'POST', body: JSON.stringify({ status, verifiedBy }) }),
    createUser: (data) =>
      request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    emailExists: (email: string) =>
      request<{ exists: boolean }>(`/auth/email-exists?email=${encodeURIComponent(email)}`).then(
        (r) => r.exists
      ),
    verifyCredentials: (email: string, password: string) =>
      request<{ user: User } | null>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then((r) => r?.user || null),
    updateOnboarding: (userId: string, status: OnboardingStatus, step?: number) =>
      request<User>(`/users/${userId}/onboarding`, {
        method: 'PUT',
        body: JSON.stringify({ onboardingStatus: status, onboardingStep: step }),
      }),
  },

  courses: {
    getCourses: () => request<Course[]>('/courses'),
    getCourseById: (id) => request<Course>(`/courses/${id}`),
    createCourse: (course) =>
      request<Course>('/courses', { method: 'POST', body: JSON.stringify(course) }),
    updateCourse: (course) =>
      request<Course>(`/courses/${course.id}`, { method: 'PUT', body: JSON.stringify(course) }),
    transitionCourseStatus: (id, status, reason) =>
      request<Course>(`/courses/${id}/status`, { method: 'POST', body: JSON.stringify({ status, reason }) }),
    assignTrainer: (courseId, trainerId) =>
      request<Course>(`/courses/${courseId}/assign-trainer`, { method: 'POST', body: JSON.stringify({ trainerId }) }),
  },

  competencies: {
    getCompetencies: () => request<Competency[]>('/competencies'),
    getCompetencyById: (id) => request<Competency>(`/competencies/${id}`),
    createCompetency: (comp) =>
      request<Competency>('/competencies', { method: 'POST', body: JSON.stringify(comp) }),
    updateCompetency: (comp) =>
      request<Competency>(`/competencies/${comp.id}`, { method: 'PUT', body: JSON.stringify(comp) }),
    markAsReviewed: (id) =>
      request<Competency>(`/competencies/${id}/review`, { method: 'POST' }),
  },

  trainingNeeds: {
    getNeeds: () => request<TrainingNeed[]>('/training-needs'),
    getNeedById: (id) => request<TrainingNeed>(`/training-needs/${id}`),
    createNeed: (need) =>
      request<TrainingNeed>('/training-needs', { method: 'POST', body: JSON.stringify(need) }),
    updateNeed: (need) =>
      request<TrainingNeed>(`/training-needs/${need.id}`, { method: 'PUT', body: JSON.stringify(need) }),
    saveMatchDecision: (needId, trainerId, decision, note) =>
      request<TrainingNeed>(`/training-needs/${needId}/match-decision`, {
        method: 'POST',
        body: JSON.stringify({ trainerId, decision, note }),
      }),
  },

  enrollments: {
    getEnrollments: () => request<Enrollment[]>('/enrollments'),
    getEnrollmentsByTrainee: (traineeId) =>
      request<Enrollment[]>(`/trainees/${traineeId}/enrollments`),
    getEnrollmentsByCourse: (courseId) =>
      request<Enrollment[]>(`/courses/${courseId}/enrollments`),
    createEnrollment: (traineeId, courseId) =>
      request<Enrollment>('/enrollments', { method: 'POST', body: JSON.stringify({ traineeId, courseId }) }),
    updateEnrollmentStatus: (id, status) =>
      request<Enrollment>(`/enrollments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    updateAttendance: (id, attendancePct) =>
      request<Enrollment>(`/enrollments/${id}/attendance`, { method: 'PATCH', body: JSON.stringify({ attendancePct }) }),
  },

  assessments: {
    getAssessments: () => request<Assessment[]>('/assessments'),
    getAssessmentsByCourse: (courseId) =>
      request<Assessment[]>(`/courses/${courseId}/assessments`),
    getAssessmentById: (id) => request<Assessment>(`/assessments/${id}`),
    createAssessment: (assessment) =>
      request<Assessment>('/assessments', { method: 'POST', body: JSON.stringify(assessment) }),
    updateAssessment: (assessment) =>
      request<Assessment>(`/assessments/${assessment.id}`, { method: 'PUT', body: JSON.stringify(assessment) }),
    getAttempts: (traineeId) =>
      request<Attempt[]>(traineeId ? `/trainees/${traineeId}/attempts` : '/attempts'),
    submitAttempt: (attempt) =>
      request<Attempt>('/attempts', { method: 'POST', body: JSON.stringify(attempt) }),
  },

  resources: {
    getResources: () => request<Resource[]>('/resources'),
    getResourcesByCourse: (courseId) =>
      request<Resource[]>(`/courses/${courseId}/resources`),
    createResource: (resource) =>
      request<Resource>('/resources', { method: 'POST', body: JSON.stringify(resource) }),
    deleteResource: (id) =>
      request<boolean>(`/resources/${id}`, { method: 'DELETE' }),
  },

  feedbacks: {
    getFeedbacks: (courseId) =>
      request<Feedback[]>(courseId ? `/courses/${courseId}/feedbacks` : '/feedbacks'),
    submitFeedback: (feedback) =>
      request<Feedback>('/feedbacks', { method: 'POST', body: JSON.stringify(feedback) }),
  },

  announcements: {
    getAnnouncements: () => request<Announcement[]>('/announcements'),
    getAnnouncementById: (id) => request<Announcement>(`/announcements/${id}`),
    createAnnouncement: (ann) =>
      request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(ann) }),
    updateAnnouncement: (ann) =>
      request<Announcement>(`/announcements/${ann.id}`, { method: 'PUT', body: JSON.stringify(ann) }),
    deleteAnnouncement: (id) =>
      request<boolean>(`/announcements/${id}`, { method: 'DELETE' }),
  },

  certificates: {
    getCertificates: (traineeId) =>
      request<Certificate[]>(traineeId ? `/trainees/${traineeId}/certificates` : '/certificates'),
    issueCertificate: (cert) =>
      request<Certificate>('/certificates', { method: 'POST', body: JSON.stringify(cert) }),
  },

  audit: {
    getAuditEvents: () => request<AuditEvent[]>('/audit'),
    logAuditEvent: (event) =>
      request<AuditEvent>('/audit', { method: 'POST', body: JSON.stringify(event) }),
  },

  notifications: {
    getNotifications: (userId: string) => request<NotificationItem[]>(`/notifications?userId=${userId}`),
    markAsRead: (id: string) =>
      request<void>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllAsRead: (userId: string) =>
      request<void>(`/notifications/mark-all-read?userId=${userId}`, { method: 'POST' }),
    addNotification: (notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) =>
      request<NotificationItem>('/notifications', { method: 'POST', body: JSON.stringify(notif) }),
  },

  applications: {
    getApplications: (status) =>
      request<Application[]>(status ? `/applications?status=${status}` : '/applications'),
    getApplicationById: (id) => request<Application>(`/applications/${id}`),
    getApplicationByUserId: (userId) =>
      request<Application>(`/applications/user/${userId}`),
    createApplication: (app) =>
      request<Application>('/applications', { method: 'POST', body: JSON.stringify(app) }),
    decideApplication: (id, decision, adminNote, decidedBy) =>
      request<Application>(`/applications/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, adminNote, decidedBy }),
      }),
    resubmitApplication: (id, payload) =>
      request<Application>(`/applications/${id}/resubmit`, {
        method: 'POST',
        body: JSON.stringify({ payload }),
      }),
  },

  registrationDrafts: {
    getDraft: (email, role) =>
      request<RegistrationDraft | null>(
        `/registration-drafts?email=${encodeURIComponent(email)}&role=${role}`
      ),
    saveDraft: (draft) =>
      request<void>('/registration-drafts', { method: 'PUT', body: JSON.stringify(draft) }),
    deleteDraft: (email, role) =>
      request<void>(
        `/registration-drafts?email=${encodeURIComponent(email)}&role=${role}`,
        { method: 'DELETE' }
      ),
  },
};
