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
  Credential,
  TraineeApplicationPayload,
  TrainerApplicationPayload,
} from '../../../domain/types';
import {
  IRepositories,
  IUserRepository,
  ICourseRepository,
  ICompetencyRepository,
  ITrainingNeedRepository,
  IEnrollmentRepository,
  IAssessmentRepository,
  IResourceRepository,
  IFeedbackRepository,
  IAnnouncementRepository,
  ICertificateRepository,
  IAuditRepository,
  INotificationRepository,
  IApplicationRepository,
  IRegistrationDraftRepository,
} from '../../repositories/interfaces';
import {
  SEED_USERS,
  SEED_COMPETENCIES,
  SEED_TRAINER_PROFILES,
  SEED_TRAINEE_PROFILES,
  SEED_COURSES,
  SEED_TRAINING_NEEDS,
  SEED_ENROLLMENTS,
  SEED_ASSESSMENTS,
  SEED_ATTEMPTS,
  SEED_RESOURCES,
  SEED_FEEDBACKS,
  SEED_ANNOUNCEMENTS,
  SEED_CERTIFICATES,
  SEED_AUDIT_LOG,
  SEED_NOTIFICATIONS,
  SEED_APPLICATIONS,
  SEED_CREDENTIALS,
} from '../../../seed/initialData';
import { APP_CONFIG } from '../../../config/app.config';
import { sleep, generateId } from '../../../lib/utils';
import {
  transitionCourse,
  transitionAccount,
  transitionEnrollment,
  transitionApplication,
  validateCourseEnrollment,
  isEligibleForCompletion,
} from '../../../domain/workflow/stateMachines';
import { verifyPassword, hashPassword } from '../../../lib/crypto';

const STORAGE_KEY_PREFIX = 'capacity_connect_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to parse localStorage key ${key}`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save localStorage key ${key}`, e);
  }
}

async function simulateNetwork(): Promise<void> {
  if (APP_CONFIG.featureFlags.simulateLatency) {
    const jitter = Math.floor(Math.random() * 150);
    await sleep(APP_CONFIG.featureFlags.latencyMs + jitter);
  }
  if (APP_CONFIG.featureFlags.simulateErrors && Math.random() < 0.05) {
    throw new Error('Simulated network blip. Please retry.');
  }
}

class MockAdapter {
  private users: User[];
  private traineeProfiles: TraineeProfile[];
  private trainerProfiles: TrainerProfile[];
  private competencies: Competency[];
  private courses: Course[];
  private trainingNeeds: TrainingNeed[];
  private enrollments: Enrollment[];
  private assessments: Assessment[];
  private attempts: Attempt[];
  private resources: Resource[];
  private feedbacks: Feedback[];
  private announcements: Announcement[];
  private certificates: Certificate[];
  private auditEvents: AuditEvent[];
  private notifications: NotificationItem[];

  private applications: Application[];
  private drafts: RegistrationDraft[];
  private credentials: Credential[];

  constructor() {
    this.users = loadFromStorage('users', SEED_USERS);
    this.traineeProfiles = loadFromStorage('traineeProfiles', SEED_TRAINEE_PROFILES);
    this.trainerProfiles = loadFromStorage('trainerProfiles', SEED_TRAINER_PROFILES);
    this.competencies = loadFromStorage('competencies', SEED_COMPETENCIES);
    this.courses = loadFromStorage('courses', SEED_COURSES);
    this.trainingNeeds = loadFromStorage('trainingNeeds', SEED_TRAINING_NEEDS);
    this.enrollments = loadFromStorage('enrollments', SEED_ENROLLMENTS);
    this.assessments = loadFromStorage('assessments', SEED_ASSESSMENTS);
    this.attempts = loadFromStorage('attempts', SEED_ATTEMPTS);
    this.resources = loadFromStorage('resources', SEED_RESOURCES);
    this.feedbacks = loadFromStorage('feedbacks', SEED_FEEDBACKS);
    this.announcements = loadFromStorage('announcements', SEED_ANNOUNCEMENTS);
    this.certificates = loadFromStorage('certificates', SEED_CERTIFICATES);
    this.auditEvents = loadFromStorage('auditEvents', SEED_AUDIT_LOG);
    this.notifications = loadFromStorage('notifications', SEED_NOTIFICATIONS);
    this.applications = loadFromStorage('applications', SEED_APPLICATIONS);
    this.drafts = loadFromStorage('drafts', []);
    this.credentials = loadFromStorage('credentials', SEED_CREDENTIALS);
  }

  private persist(key: string, data: unknown): void {
    saveToStorage(key, data);
  }

  async resetDatabase(): Promise<void> {
    await simulateNetwork();
    this.users = [...SEED_USERS];
    this.traineeProfiles = [...SEED_TRAINEE_PROFILES];
    this.trainerProfiles = [...SEED_TRAINER_PROFILES];
    this.competencies = [...SEED_COMPETENCIES];
    this.courses = [...SEED_COURSES];
    this.trainingNeeds = [...SEED_TRAINING_NEEDS];
    this.enrollments = [...SEED_ENROLLMENTS];
    this.assessments = [...SEED_ASSESSMENTS];
    this.attempts = [...SEED_ATTEMPTS];
    this.resources = [...SEED_RESOURCES];
    this.feedbacks = [...SEED_FEEDBACKS];
    this.announcements = [...SEED_ANNOUNCEMENTS];
    this.certificates = [...SEED_CERTIFICATES];
    this.auditEvents = [
      ...SEED_AUDIT_LOG,
      {
        id: generateId('aud'),
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: 'DATABASE_RESET',
        entityType: 'System',
        entityId: 'capacity-connect-db',
        at: new Date().toISOString(),
        meta: { reason: 'Admin triggered full reset to initial synthetic seed' },
      },
    ];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.applications = [...SEED_APPLICATIONS];
    this.drafts = [];
    this.credentials = [...SEED_CREDENTIALS];

    // Clear and persist
    this.persist('users', this.users);
    this.persist('traineeProfiles', this.traineeProfiles);
    this.persist('trainerProfiles', this.trainerProfiles);
    this.persist('competencies', this.competencies);
    this.persist('courses', this.courses);
    this.persist('trainingNeeds', this.trainingNeeds);
    this.persist('enrollments', this.enrollments);
    this.persist('assessments', this.assessments);
    this.persist('attempts', this.attempts);
    this.persist('resources', this.resources);
    this.persist('feedbacks', this.feedbacks);
    this.persist('announcements', this.announcements);
    this.persist('certificates', this.certificates);
    this.persist('auditEvents', this.auditEvents);
    this.persist('notifications', this.notifications);
    this.persist('applications', this.applications);
    this.persist('drafts', this.drafts);
    this.persist('credentials', this.credentials);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('capacity_connect_session_uid');
      localStorage.removeItem('capacity_connect_drafts');
    }
  }

  // --------------------------------------------------
  // Users Repo
  // --------------------------------------------------
  usersRepo: IUserRepository = {
    getUsers: async (): Promise<User[]> => {
      await simulateNetwork();
      return [...this.users];
    },
    getUserById: async (id: string): Promise<User | null> => {
      await simulateNetwork();
      return this.users.find((u) => u.id === id) || null;
    },
    getUserByEmail: async (email: string): Promise<User | null> => {
      await simulateNetwork();
      return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    emailExists: async (email: string): Promise<boolean> => {
      await simulateNetwork();
      return this.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    },
    verifyCredentials: async (email: string, password: string): Promise<User | null> => {
      await simulateNetwork();
      const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return null;

      // Seeded demo accounts allow fast presenter access with any password
      if (user.demoQuickAccess) {
        return { ...user };
      }

      // Check registered credentials
      const cred = this.credentials.find((c) => c.userId === user.id);
      if (cred) {
        const isValid = await verifyPassword(password, cred.passwordHash);
        if (isValid) return { ...user };
      }

      // If user has direct passwordHash
      if (user.passwordHash) {
        const isValid = await verifyPassword(password, user.passwordHash);
        if (isValid) return { ...user };
      }

      return null;
    },
    updateOnboarding: async (
      userId: string,
      status: OnboardingStatus,
      step?: number
    ): Promise<User> => {
      await simulateNetwork();
      const user = this.users.find((u) => u.id === userId);
      if (!user) throw new Error('User not found');
      user.onboardingStatus = status;
      if (step !== undefined) {
        user.onboardingStep = step;
      }
      this.persist('users', this.users);
      return { ...user };
    },
    getTraineeProfile: async (userId: string): Promise<TraineeProfile | null> => {
      await simulateNetwork();
      const p = this.traineeProfiles.find((tp) => tp.userId === userId);
      return p ? { ...p } : null;
    },
    getTrainerProfile: async (userId: string): Promise<TrainerProfile | null> => {
      await simulateNetwork();
      const p = this.trainerProfiles.find((tp) => tp.userId === userId);
      return p ? { ...p } : null;
    },
    updateUserStatus: async (id: string, status: AccountStatus): Promise<User> => {
      await simulateNetwork();
      const user = this.users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');
      user.status = transitionAccount(user.status, status);
      this.persist('users', this.users);

      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: `USER_STATUS_${status.toUpperCase()}`,
        entityType: 'User',
        entityId: id,
        meta: { newStatus: status, userEmail: user.email },
      });

      return { ...user };
    },
    updateUserRole: async (id: string, role: Role): Promise<User> => {
      await simulateNetwork();
      const user = this.users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');
      user.role = role;
      this.persist('users', this.users);

      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: id,
        meta: { newRole: role },
      });

      return { ...user };
    },
    updateTraineeProfile: async (userId: string, data: Partial<TraineeProfile>): Promise<TraineeProfile> => {
      await simulateNetwork();
      let profile = this.traineeProfiles.find((p) => p.userId === userId);
      if (!profile) {
        profile = {
          userId,
          designation: 'Scientific Staff',
          qualifications: [],
          experience: [],
          interests: [],
          skills: [],
          certificates: [],
          ...data,
        };
        this.traineeProfiles.push(profile);
      } else {
        Object.assign(profile, data);
      }
      this.persist('traineeProfiles', this.traineeProfiles);
      return { ...profile };
    },
    updateTrainerProfile: async (userId: string, data: Partial<TrainerProfile>): Promise<TrainerProfile> => {
      await simulateNetwork();
      let profile = this.trainerProfiles.find((p) => p.userId === userId);
      if (!profile) {
        profile = {
          userId,
          bio: '',
          subjects: [],
          qualifications: [],
          evidence: [],
          availability: [],
          centreId: 'centre-pune',
          ...data,
        };
        this.trainerProfiles.push(profile);
      } else {
        Object.assign(profile, data);
      }
      this.persist('trainerProfiles', this.trainerProfiles);
      return { ...profile };
    },
    addTrainerEvidence: async (evidenceData: Omit<TrainerEvidence, 'id'>): Promise<TrainerEvidence> => {
      await simulateNetwork();
      const newEv: TrainerEvidence = {
        ...evidenceData,
        id: generateId('ev'),
      };
      let profile = this.trainerProfiles.find((p) => p.userId === evidenceData.trainerId);
      if (!profile) {
        profile = {
          userId: evidenceData.trainerId,
          bio: '',
          subjects: [],
          qualifications: [],
          evidence: [newEv],
          availability: [],
          centreId: 'centre-pune',
        };
        this.trainerProfiles.push(profile);
      } else {
        profile.evidence.push(newEv);
      }
      this.persist('trainerProfiles', this.trainerProfiles);
      return { ...newEv };
    },
    updateTrainerEvidence: async (evidence: TrainerEvidence): Promise<TrainerEvidence> => {
      await simulateNetwork();
      const profile = this.trainerProfiles.find((p) => p.userId === evidence.trainerId);
      if (!profile) throw new Error('Trainer profile not found');
      const idx = profile.evidence.findIndex((e) => e.id === evidence.id);
      if (idx === -1) throw new Error('Evidence entry not found');
      profile.evidence[idx] = { ...evidence };
      this.persist('trainerProfiles', this.trainerProfiles);
      return { ...evidence };
    },
    verifyTrainerEvidence: async (
      evidenceId: string,
      status: VerificationStatus,
      verifiedBy: string
    ): Promise<TrainerEvidence> => {
      await simulateNetwork();
      for (const profile of this.trainerProfiles) {
        const ev = profile.evidence.find((e) => e.id === evidenceId);
        if (ev) {
          ev.verifiedStatus = status;
          ev.verifiedAt = new Date().toISOString();
          ev.verifiedBy = verifiedBy;
          this.persist('trainerProfiles', this.trainerProfiles);

          await this.auditRepo.logAuditEvent({
            actorId: verifiedBy,
            actorName: 'Administrator',
            action: `TRAINER_EVIDENCE_${status.toUpperCase()}`,
            entityType: 'TrainerEvidence',
            entityId: evidenceId,
            meta: { trainerId: ev.trainerId, competencyId: ev.competencyId },
          });

          return { ...ev };
        }
      }
      throw new Error('Evidence not found');
    },
    createUser: async (
      userData: Omit<User, 'id' | 'createdAt' | 'synthetic'> & { password?: string }
    ): Promise<User> => {
      await simulateNetwork();
      const existing = this.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) throw new Error('An account with this email address already exists.');

      const newId = generateId('user');
      const newUser: User = {
        ...userData,
        id: newId,
        createdAt: new Date().toISOString(),
        synthetic: true,
        onboardingStatus: userData.onboardingStatus || 'not_started',
      };
      this.users.push(newUser);
      this.persist('users', this.users);

      if (userData.password) {
        const passwordHash = await hashPassword(userData.password);
        this.credentials.push({
          userId: newId,
          passwordHash,
          updatedAt: new Date().toISOString(),
        });
        this.persist('credentials', this.credentials);
      }

      // Create placeholder profile
      if (newUser.role === 'trainee') {
        this.traineeProfiles.push({
          userId: newUser.id,
          designation: 'New Trainee',
          qualifications: [],
          experience: [],
          interests: [],
          skills: [],
          certificates: [],
        });
        this.persist('traineeProfiles', this.traineeProfiles);
      } else if (newUser.role === 'trainer') {
        this.trainerProfiles.push({
          userId: newUser.id,
          bio: 'New Trainer Profile awaiting orientation',
          subjects: [],
          qualifications: [],
          evidence: [],
          availability: [],
          centreId: newUser.centreId,
        });
        this.persist('trainerProfiles', this.trainerProfiles);
      }

      await this.auditRepo.logAuditEvent({
        actorId: newUser.id,
        actorName: newUser.name,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser.id,
        meta: { role: newUser.role, status: newUser.status },
      });

      return { ...newUser };
    },
  };

  // --------------------------------------------------
  // Courses Repo
  // --------------------------------------------------
  coursesRepo: ICourseRepository = {
    getCourses: async (): Promise<Course[]> => {
      await simulateNetwork();
      return [...this.courses];
    },
    getCourseById: async (id: string): Promise<Course | null> => {
      await simulateNetwork();
      return this.courses.find((c) => c.id === id) || null;
    },
    createCourse: async (courseData: Omit<Course, 'id' | 'version'>): Promise<Course> => {
      await simulateNetwork();
      const newCourse: Course = {
        ...courseData,
        id: generateId('course'),
        version: 1,
      };
      this.courses.unshift(newCourse);
      this.persist('courses', this.courses);

      await this.auditRepo.logAuditEvent({
        actorId: courseData.trainerId || 'user-admin',
        actorName: 'Course Creator',
        action: 'COURSE_CREATED',
        entityType: 'Course',
        entityId: newCourse.id,
        meta: { title: newCourse.title, status: newCourse.status },
      });

      return { ...newCourse };
    },
    updateCourse: async (course: Course): Promise<Course> => {
      await simulateNetwork();
      const idx = this.courses.findIndex((c) => c.id === course.id);
      if (idx === -1) throw new Error('Course not found');
      course.version = (course.version || 1) + 1;
      this.courses[idx] = { ...course };
      this.persist('courses', this.courses);
      return { ...course };
    },
    transitionCourseStatus: async (
      id: string,
      status: CourseStatus,
      reason?: string
    ): Promise<Course> => {
      await simulateNetwork();
      const course = this.courses.find((c) => c.id === id);
      if (!course) throw new Error('Course not found');
      course.status = transitionCourse(course.status, status);
      if (reason) course.rejectionReason = reason;
      course.version = (course.version || 1) + 1;
      this.persist('courses', this.courses);

      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: `COURSE_STATUS_${status.toUpperCase()}`,
        entityType: 'Course',
        entityId: id,
        meta: { title: course.title, newStatus: status, reason },
      });

      return { ...course };
    },
    assignTrainer: async (courseId: string, trainerId: string): Promise<Course> => {
      await simulateNetwork();
      const course = this.courses.find((c) => c.id === courseId);
      if (!course) throw new Error('Course not found');
      course.trainerId = trainerId;
      course.version = (course.version || 1) + 1;
      this.persist('courses', this.courses);

      const trainer = this.users.find((u) => u.id === trainerId);
      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: 'COURSE_TRAINER_ASSIGNED',
        entityType: 'Course',
        entityId: courseId,
        meta: { trainerId, trainerName: trainer?.name },
      });

      return { ...course };
    },
  };

  // --------------------------------------------------
  // Competencies Repo
  // --------------------------------------------------
  competenciesRepo: ICompetencyRepository = {
    getCompetencies: async (): Promise<Competency[]> => {
      await simulateNetwork();
      return [...this.competencies];
    },
    getCompetencyById: async (id: string): Promise<Competency | null> => {
      await simulateNetwork();
      return this.competencies.find((c) => c.id === id) || null;
    },
    createCompetency: async (compData: Omit<Competency, 'id'>): Promise<Competency> => {
      await simulateNetwork();
      const newComp: Competency = {
        ...compData,
        id: generateId('comp'),
      };
      this.competencies.push(newComp);
      this.persist('competencies', this.competencies);
      return { ...newComp };
    },
    updateCompetency: async (competency: Competency): Promise<Competency> => {
      await simulateNetwork();
      const idx = this.competencies.findIndex((c) => c.id === competency.id);
      if (idx === -1) throw new Error('Competency not found');
      this.competencies[idx] = { ...competency };
      this.persist('competencies', this.competencies);
      return { ...competency };
    },
    markAsReviewed: async (id: string): Promise<Competency> => {
      await simulateNetwork();
      const comp = this.competencies.find((c) => c.id === id);
      if (!comp) throw new Error('Competency not found');
      comp.reviewStatus = 'reviewed';
      this.persist('competencies', this.competencies);
      return { ...comp };
    },
  };

  // --------------------------------------------------
  // Training Needs Repo
  // --------------------------------------------------
  trainingNeedsRepo: ITrainingNeedRepository = {
    getNeeds: async (): Promise<TrainingNeed[]> => {
      await simulateNetwork();
      return [...this.trainingNeeds];
    },
    getNeedById: async (id: string): Promise<TrainingNeed | null> => {
      await simulateNetwork();
      return this.trainingNeeds.find((n) => n.id === id) || null;
    },
    createNeed: async (needData: Omit<TrainingNeed, 'id'>): Promise<TrainingNeed> => {
      await simulateNetwork();
      const newNeed: TrainingNeed = {
        ...needData,
        id: generateId('need'),
      };
      this.trainingNeeds.unshift(newNeed);
      this.persist('trainingNeeds', this.trainingNeeds);

      await this.auditRepo.logAuditEvent({
        actorId: needData.createdBy,
        actorName: 'Administrator',
        action: 'TRAINING_NEED_CREATED',
        entityType: 'TrainingNeed',
        entityId: newNeed.id,
        meta: { title: newNeed.title },
      });

      return { ...newNeed };
    },
    updateNeed: async (need: TrainingNeed): Promise<TrainingNeed> => {
      await simulateNetwork();
      const idx = this.trainingNeeds.findIndex((n) => n.id === need.id);
      if (idx === -1) throw new Error('Need not found');
      this.trainingNeeds[idx] = { ...need };
      this.persist('trainingNeeds', this.trainingNeeds);
      return { ...need };
    },
    saveMatchDecision: async (
      needId: string,
      trainerId: string,
      decision: 'accepted' | 'rejected' | 'overridden',
      note?: string
    ): Promise<TrainingNeed> => {
      await simulateNetwork();
      const need = this.trainingNeeds.find((n) => n.id === needId);
      if (!need) throw new Error('Training Need not found');

      if (decision === 'accepted' || decision === 'overridden') {
        need.matchedTrainerId = trainerId;
        need.status = 'matched';
      }

      this.persist('trainingNeeds', this.trainingNeeds);

      const trainer = this.users.find((u) => u.id === trainerId);
      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: `TRAINER_MATCH_${decision.toUpperCase()}`,
        entityType: 'TrainingNeed',
        entityId: needId,
        meta: {
          trainerId,
          trainerName: trainer?.name,
          decision,
          note: note || '',
        },
      });

      return { ...need };
    },
  };

  // --------------------------------------------------
  // Enrollments Repo
  // --------------------------------------------------
  enrollmentsRepo: IEnrollmentRepository = {
    getEnrollments: async (): Promise<Enrollment[]> => {
      await simulateNetwork();
      return [...this.enrollments];
    },
    getEnrollmentsByTrainee: async (traineeId: string): Promise<Enrollment[]> => {
      await simulateNetwork();
      return this.enrollments.filter((e) => e.traineeId === traineeId);
    },
    getEnrollmentsByCourse: async (courseId: string): Promise<Enrollment[]> => {
      await simulateNetwork();
      return this.enrollments.filter((e) => e.courseId === courseId);
    },
    createEnrollment: async (traineeId: string, courseId: string): Promise<Enrollment> => {
      await simulateNetwork();
      const course = this.courses.find((c) => c.id === courseId);
      if (!course) throw new Error('Course not found');

      const traineeProfile =
        this.traineeProfiles.find((tp) => tp.userId === traineeId) || {
          userId: traineeId,
          designation: 'Trainee',
          qualifications: [],
          experience: [],
          interests: [],
          skills: [],
          certificates: [],
        };

      const existing = this.enrollments.find(
        (e) => e.traineeId === traineeId && e.courseId === courseId
      );

      const activeCount = this.enrollments.filter(
        (e) => e.courseId === courseId && (e.status === 'enrolled' || e.status === 'completed')
      ).length;

      const validation = validateCourseEnrollment(course, activeCount, traineeProfile, existing);

      let enrollment: Enrollment;
      if (existing) {
        existing.status = validation.targetStatus;
        existing.enrolledAt = new Date().toISOString();
        enrollment = existing;
      } else {
        enrollment = {
          id: generateId('enr'),
          traineeId,
          courseId,
          status: validation.targetStatus,
          enrolledAt: new Date().toISOString(),
          attendancePct: 0,
        };
        this.enrollments.push(enrollment);
      }

      this.persist('enrollments', this.enrollments);

      const traineeUser = this.users.find((u) => u.id === traineeId);
      await this.auditRepo.logAuditEvent({
        actorId: traineeId,
        actorName: traineeUser?.name || 'Trainee',
        action: `COURSE_${validation.targetStatus.toUpperCase()}`,
        entityType: 'Enrollment',
        entityId: enrollment.id,
        meta: { courseTitle: course.title, warnings: validation.warnings },
      });

      return { ...enrollment };
    },
    updateEnrollmentStatus: async (
      id: string,
      status: EnrollmentStatus
    ): Promise<Enrollment> => {
      await simulateNetwork();
      const enr = this.enrollments.find((e) => e.id === id);
      if (!enr) throw new Error('Enrollment not found');
      enr.status = transitionEnrollment(enr.status, status);
      if (status === 'completed') {
        enr.completedAt = new Date().toISOString();
      }
      this.persist('enrollments', this.enrollments);
      return { ...enr };
    },
    updateAttendance: async (id: string, attendancePct: number): Promise<Enrollment> => {
      await simulateNetwork();
      const enr = this.enrollments.find((e) => e.id === id);
      if (!enr) throw new Error('Enrollment not found');
      enr.attendancePct = Math.max(0, Math.min(100, attendancePct));
      this.persist('enrollments', this.enrollments);
      return { ...enr };
    },
  };

  // --------------------------------------------------
  // Assessments Repo
  // --------------------------------------------------
  assessmentsRepo: IAssessmentRepository = {
    getAssessments: async (): Promise<Assessment[]> => {
      await simulateNetwork();
      return [...this.assessments];
    },
    getAssessmentsByCourse: async (courseId: string): Promise<Assessment[]> => {
      await simulateNetwork();
      return this.assessments.filter((a) => a.courseId === courseId);
    },
    getAssessmentById: async (id: string): Promise<Assessment | null> => {
      await simulateNetwork();
      return this.assessments.find((a) => a.id === id) || null;
    },
    createAssessment: async (
      assessmentData: Omit<Assessment, 'id'>
    ): Promise<Assessment> => {
      await simulateNetwork();
      const newAssessment: Assessment = {
        ...assessmentData,
        id: generateId('assess'),
      };
      this.assessments.unshift(newAssessment);
      this.persist('assessments', this.assessments);

      await this.auditRepo.logAuditEvent({
        actorId: 'user-trainer-1',
        actorName: 'Course Trainer',
        action: 'ASSESSMENT_CREATED',
        entityType: 'Assessment',
        entityId: newAssessment.id,
        meta: { title: newAssessment.title, courseId: newAssessment.courseId },
      });

      return { ...newAssessment };
    },
    updateAssessment: async (assessment: Assessment): Promise<Assessment> => {
      await simulateNetwork();
      const idx = this.assessments.findIndex((a) => a.id === assessment.id);
      if (idx === -1) throw new Error('Assessment not found');
      this.assessments[idx] = { ...assessment };
      this.persist('assessments', this.assessments);
      return { ...assessment };
    },
    getAttempts: async (traineeId?: string): Promise<Attempt[]> => {
      await simulateNetwork();
      if (!traineeId) return [...this.attempts];
      return this.attempts.filter((a) => a.traineeId === traineeId);
    },
    submitAttempt: async (
      attemptData: Omit<Attempt, 'id' | 'submittedAt'>
    ): Promise<Attempt> => {
      await simulateNetwork();
      const newAttempt: Attempt = {
        ...attemptData,
        id: generateId('att'),
        submittedAt: new Date().toISOString(),
      };
      this.attempts.push(newAttempt);
      this.persist('attempts', this.attempts);

      // Check if this attempt makes the trainee eligible for course completion
      const assess = this.assessments.find((a) => a.id === attemptData.assessmentId);
      if (assess) {
        const enr = this.enrollments.find(
          (e) => e.traineeId === attemptData.traineeId && e.courseId === assess.courseId
        );
        if (enr && enr.status === 'enrolled') {
          const courseAssessments = this.assessments.filter((a) => a.courseId === assess.courseId);
          const traineeAttempts = this.attempts.filter((at) => at.traineeId === attemptData.traineeId);

          const eligibility = isEligibleForCompletion(
            enr,
            courseAssessments,
            traineeAttempts,
            APP_CONFIG.completionRequirements.minAttendancePct,
            APP_CONFIG.completionRequirements.requireAllAssessmentsAttempted
          );

          if (eligibility.eligible) {
            enr.status = 'completed';
            enr.completedAt = new Date().toISOString();
            this.persist('enrollments', this.enrollments);

            // Auto-issue demo certificate if certificates enabled
            if (APP_CONFIG.featureFlags.enableCertificates) {
              const course = this.courses.find((c) => c.id === assess.courseId);
              const trainee = this.users.find((u) => u.id === attemptData.traineeId);
              if (course && trainee) {
                await this.certificateRepo.issueCertificate({
                  enrollmentId: enr.id,
                  courseId: course.id,
                  courseTitle: course.title,
                  traineeId: trainee.id,
                  traineeName: trainee.name,
                  code: `CC-DEMO-${new Date().getFullYear()}-${Math.random()
                    .toString(36)
                    .substring(2, 6)
                    .toUpperCase()}`,
                });
              }
            }
          }
        }
      }

      const traineeUser = this.users.find((u) => u.id === attemptData.traineeId);
      await this.auditRepo.logAuditEvent({
        actorId: attemptData.traineeId,
        actorName: traineeUser?.name || 'Trainee',
        action: 'ASSESSMENT_SUBMITTED',
        entityType: 'Assessment',
        entityId: attemptData.assessmentId,
        meta: { score: newAttempt.score },
      });

      return { ...newAttempt };
    },
  };

  // --------------------------------------------------
  // Resources Repo
  // --------------------------------------------------
  resourcesRepo: IResourceRepository = {
    getResources: async (): Promise<Resource[]> => {
      await simulateNetwork();
      return [...this.resources];
    },
    getResourcesByCourse: async (courseId: string): Promise<Resource[]> => {
      await simulateNetwork();
      return this.resources.filter((r) => r.courseId === courseId);
    },
    createResource: async (
      resourceData: Omit<Resource, 'id' | 'uploadedAt'>
    ): Promise<Resource> => {
      await simulateNetwork();
      const newRes: Resource = {
        ...resourceData,
        id: generateId('res'),
        uploadedAt: new Date().toISOString(),
      };
      this.resources.unshift(newRes);
      this.persist('resources', this.resources);

      await this.auditRepo.logAuditEvent({
        actorId: resourceData.trainerId,
        actorName: 'Trainer',
        action: 'RESOURCE_UPLOADED',
        entityType: 'Resource',
        entityId: newRes.id,
        meta: { title: newRes.title, type: newRes.type },
      });

      return { ...newRes };
    },
    deleteResource: async (id: string): Promise<boolean> => {
      await simulateNetwork();
      const idx = this.resources.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      this.resources.splice(idx, 1);
      this.persist('resources', this.resources);
      return true;
    },
  };

  // --------------------------------------------------
  // Feedback Repo
  // --------------------------------------------------
  feedbacksRepo: IFeedbackRepository = {
    getFeedbacks: async (courseId?: string): Promise<Feedback[]> => {
      await simulateNetwork();
      if (!courseId) return [...this.feedbacks];
      return this.feedbacks.filter((f) => f.courseId === courseId);
    },
    submitFeedback: async (
      feedbackData: Omit<Feedback, 'id' | 'submittedAt'>
    ): Promise<Feedback> => {
      await simulateNetwork();
      const existingIdx = this.feedbacks.findIndex(
        (f) => f.courseId === feedbackData.courseId && f.traineeId === feedbackData.traineeId
      );

      let result: Feedback;
      if (existingIdx !== -1) {
        this.feedbacks[existingIdx] = {
          ...this.feedbacks[existingIdx],
          ...feedbackData,
          submittedAt: new Date().toISOString(),
        };
        result = this.feedbacks[existingIdx];
      } else {
        result = {
          ...feedbackData,
          id: generateId('fb'),
          submittedAt: new Date().toISOString(),
        };
        this.feedbacks.push(result);
      }
      this.persist('feedbacks', this.feedbacks);
      return { ...result };
    },
  };

  // --------------------------------------------------
  // Announcements Repo
  // --------------------------------------------------
  announcementsRepo: IAnnouncementRepository = {
    getAnnouncements: async (): Promise<Announcement[]> => {
      await simulateNetwork();
      return [...this.announcements].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    },
    getAnnouncementById: async (id: string): Promise<Announcement | null> => {
      await simulateNetwork();
      return this.announcements.find((a) => a.id === id) || null;
    },
    createAnnouncement: async (
      data: Omit<Announcement, 'id' | 'publishedAt'>
    ): Promise<Announcement> => {
      await simulateNetwork();
      const newAnn: Announcement = {
        ...data,
        id: generateId('ann'),
        publishedAt: new Date().toISOString(),
      };
      this.announcements.unshift(newAnn);
      this.persist('announcements', this.announcements);

      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'Dr. Sunita Kulkarni',
        action: 'ANNOUNCEMENT_PUBLISHED',
        entityType: 'Announcement',
        entityId: newAnn.id,
        meta: { title: newAnn.title },
      });

      return { ...newAnn };
    },
    updateAnnouncement: async (announcement: Announcement): Promise<Announcement> => {
      await simulateNetwork();
      const idx = this.announcements.findIndex((a) => a.id === announcement.id);
      if (idx === -1) throw new Error('Announcement not found');
      this.announcements[idx] = { ...announcement };
      this.persist('announcements', this.announcements);
      return { ...announcement };
    },
    deleteAnnouncement: async (id: string): Promise<boolean> => {
      await simulateNetwork();
      const idx = this.announcements.findIndex((a) => a.id === id);
      if (idx === -1) return false;
      this.announcements.splice(idx, 1);
      this.persist('announcements', this.announcements);
      return true;
    },
  };

  // --------------------------------------------------
  // Certificate Repo
  // --------------------------------------------------
  certificateRepo: ICertificateRepository = {
    getCertificates: async (traineeId?: string): Promise<Certificate[]> => {
      await simulateNetwork();
      if (!traineeId) return [...this.certificates];
      return this.certificates.filter((c) => c.traineeId === traineeId);
    },
    issueCertificate: async (
      certData: Omit<Certificate, 'id' | 'issuedAt' | 'synthetic'>
    ): Promise<Certificate> => {
      await simulateNetwork();
      const newCert: Certificate = {
        ...certData,
        id: generateId('cert'),
        issuedAt: new Date().toISOString(),
        synthetic: true,
      };
      this.certificates.push(newCert);
      this.persist('certificates', this.certificates);

      await this.auditRepo.logAuditEvent({
        actorId: 'user-admin',
        actorName: 'System Certificate Engine',
        action: 'CERTIFICATE_ISSUED',
        entityType: 'Certificate',
        entityId: newCert.id,
        meta: { code: newCert.code, traineeName: newCert.traineeName },
      });

      return { ...newCert };
    },
  };

  // --------------------------------------------------
  // Audit Repo
  // --------------------------------------------------
  auditRepo: IAuditRepository = {
    getAuditEvents: async (): Promise<AuditEvent[]> => {
      await simulateNetwork();
      return [...this.auditEvents].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      );
    },
    logAuditEvent: async (eventData: Omit<AuditEvent, 'id' | 'at'>): Promise<AuditEvent> => {
      const event: AuditEvent = {
        ...eventData,
        id: generateId('aud'),
        at: new Date().toISOString(),
      };
      this.auditEvents.unshift(event);
      this.persist('auditEvents', this.auditEvents);
      return event;
    },
  };

  // --------------------------------------------------
  // Notification Repo
  // --------------------------------------------------
  notificationRepo: INotificationRepository = {
    getNotifications: async (userId: string): Promise<NotificationItem[]> => {
      await simulateNetwork();
      return this.notifications.filter((n) => n.userId === userId);
    },
    markAsRead: async (id: string): Promise<void> => {
      await simulateNetwork();
      const n = this.notifications.find((notif) => notif.id === id);
      if (n) {
        n.read = true;
        this.persist('notifications', this.notifications);
      }
    },
    markAllAsRead: async (userId: string): Promise<void> => {
      await simulateNetwork();
      for (const n of this.notifications) {
        if (n.userId === userId) {
          n.read = true;
        }
      }
      this.persist('notifications', this.notifications);
    },
    addNotification: async (
      notifData: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>
    ): Promise<NotificationItem> => {
      await simulateNetwork();
      const newNotif: NotificationItem = {
        ...notifData,
        id: generateId('notif'),
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.notifications.unshift(newNotif);
      this.persist('notifications', this.notifications);
      return newNotif;
    },
  };
  // --------------------------------------------------
  // Applications Repo
  // --------------------------------------------------
  applicationsRepo: IApplicationRepository = {
    getApplications: async (status?: ApplicationStatus): Promise<Application[]> => {
      await simulateNetwork();
      if (!status) return [...this.applications];
      return this.applications.filter((a) => a.status === status);
    },
    getApplicationById: async (id: string): Promise<Application | null> => {
      await simulateNetwork();
      return this.applications.find((a) => a.id === id) || null;
    },
    getApplicationByUserId: async (userId: string): Promise<Application | null> => {
      await simulateNetwork();
      return this.applications.find((a) => a.userId === userId) || null;
    },
    createApplication: async (
      appData: Omit<Application, 'id' | 'submittedAt'>
    ): Promise<Application> => {
      await simulateNetwork();
      const newApp: Application = {
        ...appData,
        id: generateId('app'),
        submittedAt: new Date().toISOString(),
      };
      this.applications.unshift(newApp);
      this.persist('applications', this.applications);

      await this.auditRepo.logAuditEvent({
        actorId: appData.userId,
        actorName: 'Applicant',
        action: 'APPLICATION_SUBMITTED',
        entityType: 'Application',
        entityId: newApp.id,
        meta: { role: appData.role, revision: appData.revision },
      });

      await this.notificationRepo.addNotification({
        userId: 'user-admin',
        title: 'New User Application',
        message: `New ${appData.role} application submitted (Rev ${appData.revision}). Pending review.`,
        type: 'system',
        link: '/admin/users',
      });

      return { ...newApp };
    },
    decideApplication: async (
      id: string,
      decision: 'approved' | 'rejected' | 'needs_info',
      adminNote?: string,
      decidedBy: string = 'user-admin'
    ): Promise<Application> => {
      await simulateNetwork();
      const app = this.applications.find((a) => a.id === id);
      if (!app) throw new Error('Application not found');

      app.status = transitionApplication(app.status, decision);
      app.adminNote = adminNote;
      app.decidedBy = decidedBy;
      app.decidedAt = new Date().toISOString();
      this.persist('applications', this.applications);

      const user = this.users.find((u) => u.id === app.userId);
      if (user) {
        if (decision === 'approved') {
          user.status = 'approved';
          if (app.role === 'trainee') {
            const traineePayload = app.payload as TraineeApplicationPayload;
            const existingProfile = this.traineeProfiles.find((tp) => tp.userId === user.id);
            if (!existingProfile) {
              const newProfile: TraineeProfile = {
                userId: user.id,
                designation: traineePayload.designation || 'Scientific Staff',
                qualifications: (traineePayload.qualifications || []).map(q => typeof q === 'string' ? q : `${q.degree} - ${q.institution} (${q.year})`),
                experience: (traineePayload.experience || []).map((e: any) => typeof e === 'string' ? e : `${e.role || ''} at ${e.organization || ''} (${e.fromYear || ''}-${e.toYear || 'Present'})`),
                interests: traineePayload.interests || [],
                skills: (traineePayload.skills || []).map((s: any) => typeof s === 'string' ? s : s.name),
                certificates: (traineePayload.certificates || []).map((c: any) => ({
                  id: generateId('cert'),
                  title: typeof c === 'string' ? c : c.title,
                  issuer: typeof c === 'string' ? 'IMD / External' : (c.issuer || 'IMD / External'),
                  issuedYear: typeof c === 'string' ? 2025 : (typeof c.year === 'number' ? c.year : parseInt(c.year as string) || 2025),
                  fileName: typeof c === 'string' ? undefined : c.file?.fileName,
                })),
              };
              this.traineeProfiles.push(newProfile);
            }
            this.persist('traineeProfiles', this.traineeProfiles);
          } else if (app.role === 'trainer') {
            const trainerPayload = app.payload as TrainerApplicationPayload;
            const existingProfile = this.trainerProfiles.find((tp) => tp.userId === user.id);
            if (!existingProfile) {
              const newProfile: TrainerProfile = {
                userId: user.id,
                bio: 'Experienced meteorological specialist.',
                subjects: trainerPayload.subjects || [],
                qualifications: (trainerPayload.qualifications || []).map(q => typeof q === 'string' ? q : `${q.degree} - ${q.institution} (${q.year})`),
                evidence: (trainerPayload.evidence || []).map((ev: any) => ({
                  id: generateId('ev'),
                  trainerId: user.id,
                  competencyId: ev.competencyId || 'comp-radar-meteorology',
                  type: (ev.type as any) || 'delivered_course',
                  count: Number(ev.count) || 1,
                  years: Number(ev.years) || 1,
                  sourceNote: ev.sourceNote || ev.notes || 'Submitted during registration',
                  verifiedStatus: (ev.verifiedStatus as any) || 'unverified',
                  title: `${ev.type} evidence`,
                  details: `${ev.sourceNote || ev.notes || ''} (Count: ${ev.count})`,
                  status: (ev.verifiedStatus as any) || 'unverified',
                })),
                availability: (trainerPayload.availability || []).map((av: any) => ({
                  id: generateId('avail'),
                  startDate: av.from || av.startDate || '2026-10-01',
                  endDate: av.to || av.endDate || '2026-12-31',
                  isAvailable: true,
                  preferredModes: (trainerPayload.deliveryModes as any) || ['in_person'],
                  from: av.from,
                  to: av.to,
                })),
                centreId: trainerPayload.centreId || 'centre-pune',
              };
              this.trainerProfiles.push(newProfile);
            }
            this.persist('trainerProfiles', this.trainerProfiles);
          }
        } else if (decision === 'rejected') {
          user.status = 'rejected';
        } else if (decision === 'needs_info') {
          user.status = 'needs_info';
        }
        this.persist('users', this.users);
      }

      await this.auditRepo.logAuditEvent({
        actorId: decidedBy,
        actorName: 'Administrator',
        action: `APPLICATION_${decision.toUpperCase()}`,
        entityType: 'Application',
        entityId: app.id,
        meta: { decision, adminNote, userId: app.userId },
      });

      const msg =
        decision === 'approved'
          ? 'Your application has been approved! Please sign in to complete your onboarding.'
          : decision === 'needs_info'
          ? `Application review note: ${adminNote || 'Additional information required.'}`
          : `Application rejected: ${adminNote || 'Does not meet requirements.'}`;

      await this.notificationRepo.addNotification({
        userId: app.userId,
        title: `Application ${decision.replace('_', ' ').toUpperCase()}`,
        message: msg,
        type: decision === 'approved' ? 'course' : 'system',
        link: decision === 'approved' ? `/onboarding/${app.role}` : `/account/${decision.replace('_', '-')}`,
      });

      return { ...app };
    },
    resubmitApplication: async (
      id: string,
      payload: TraineeApplicationPayload | TrainerApplicationPayload
    ): Promise<Application> => {
      await simulateNetwork();
      const app = this.applications.find((a) => a.id === id);
      if (!app) throw new Error('Application not found');

      app.status = transitionApplication(app.status, 'submitted');
      app.revision += 1;
      app.payload = payload;
      app.submittedAt = new Date().toISOString();
      this.persist('applications', this.applications);

      const user = this.users.find((u) => u.id === app.userId);
      if (user) {
        user.status = 'pending';
        this.persist('users', this.users);
      }

      await this.auditRepo.logAuditEvent({
        actorId: app.userId,
        actorName: 'Applicant',
        action: 'APPLICATION_RESUBMITTED',
        entityType: 'Application',
        entityId: app.id,
        meta: { revision: app.revision },
      });

      await this.notificationRepo.addNotification({
        userId: 'user-admin',
        title: 'Application Resubmitted',
        message: `Applicant resubmitted revision ${app.revision}. Ready for re-review.`,
        type: 'system',
        link: '/admin/users',
      });

      return { ...app };
    },
  };

  // --------------------------------------------------
  // Registration Drafts Repo
  // --------------------------------------------------
  registrationDraftsRepo: IRegistrationDraftRepository = {
    getDraft: async (email: string, role: Role): Promise<RegistrationDraft | null> => {
      await simulateNetwork();
      const draft = this.drafts.find(
        (d) => d.email.toLowerCase() === email.toLowerCase() && d.role === role
      );
      return draft ? { ...draft } : null;
    },
    saveDraft: async (draft: RegistrationDraft): Promise<void> => {
      await simulateNetwork();
      const idx = this.drafts.findIndex(
        (d) => d.email.toLowerCase() === draft.email.toLowerCase() && d.role === draft.role
      );
      if (idx >= 0) {
        this.drafts[idx] = { ...draft, updatedAt: new Date().toISOString() };
      } else {
        this.drafts.push({ ...draft, updatedAt: new Date().toISOString() });
      }
      this.persist('drafts', this.drafts);
    },
    deleteDraft: async (email: string, role: Role): Promise<void> => {
      await simulateNetwork();
      this.drafts = this.drafts.filter(
        (d) => !(d.email.toLowerCase() === email.toLowerCase() && d.role === role)
      );
      this.persist('drafts', this.drafts);
    },
  };
}

const mockAdapterInstance = new MockAdapter();

export const mockRepositories: IRepositories = {
  users: mockAdapterInstance.usersRepo,
  courses: mockAdapterInstance.coursesRepo,
  competencies: mockAdapterInstance.competenciesRepo,
  trainingNeeds: mockAdapterInstance.trainingNeedsRepo,
  enrollments: mockAdapterInstance.enrollmentsRepo,
  assessments: mockAdapterInstance.assessmentsRepo,
  resources: mockAdapterInstance.resourcesRepo,
  feedbacks: mockAdapterInstance.feedbacksRepo,
  announcements: mockAdapterInstance.announcementsRepo,
  certificates: mockAdapterInstance.certificateRepo,
  audit: mockAdapterInstance.auditRepo,
  notifications: mockAdapterInstance.notificationRepo,
  applications: mockAdapterInstance.applicationsRepo,
  registrationDrafts: mockAdapterInstance.registrationDraftsRepo,
  resetDatabase: () => mockAdapterInstance.resetDatabase(),
};
