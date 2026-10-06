import {
  CourseStatus,
  EnrollmentStatus,
  AccountStatus,
  ApplicationStatus,
  User,
  Course,
  Enrollment,
  Assessment,
  Attempt,
  TraineeProfile,
} from '../types';

export class InvalidTransitionError extends Error {
  constructor(entity: string, current: string, target: string) {
    super(`Cannot transition ${entity} from '${current}' to '${target}'.`);
    this.name = 'InvalidTransitionError';
  }
}

export class EnrollmentRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnrollmentRuleError';
  }
}

// ----------------------------------------------------
// 1. Course State Machine
// ----------------------------------------------------
const ALLOWED_COURSE_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ['pending_approval', 'archived'],
  pending_approval: ['published', 'draft', 'archived'], // draft when admin requests changes
  published: ['in_progress', 'archived'],
  in_progress: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export function canTransitionCourse(current: CourseStatus, target: CourseStatus): boolean {
  return ALLOWED_COURSE_TRANSITIONS[current]?.includes(target) ?? false;
}

export function transitionCourse(current: CourseStatus, target: CourseStatus): CourseStatus {
  if (!canTransitionCourse(current, target)) {
    throw new InvalidTransitionError('Course', current, target);
  }
  return target;
}

// ----------------------------------------------------
// 2. Account State Machine
// ----------------------------------------------------
const ALLOWED_ACCOUNT_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  pending: ['approved', 'rejected', 'needs_info'],
  needs_info: ['pending'],
  approved: ['suspended'],
  rejected: ['pending'],
  suspended: ['approved'],
};

export function canTransitionAccount(current: AccountStatus, target: AccountStatus): boolean {
  return ALLOWED_ACCOUNT_TRANSITIONS[current]?.includes(target) ?? false;
}

export function transitionAccount(current: AccountStatus, target: AccountStatus): AccountStatus {
  if (!canTransitionAccount(current, target)) {
    throw new InvalidTransitionError('Account', current, target);
  }
  return target;
}

// ----------------------------------------------------
// 2b. Application State Machine
// ----------------------------------------------------
const ALLOWED_APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['approved', 'rejected', 'needs_info'],
  needs_info: ['submitted'],
  rejected: ['submitted'],
  approved: [],
};

export function canTransitionApplication(current: ApplicationStatus, target: ApplicationStatus): boolean {
  return ALLOWED_APPLICATION_TRANSITIONS[current]?.includes(target) ?? false;
}

export function transitionApplication(current: ApplicationStatus, target: ApplicationStatus): ApplicationStatus {
  if (!canTransitionApplication(current, target)) {
    throw new InvalidTransitionError('Application', current, target);
  }
  return target;
}

// ----------------------------------------------------
// Post-Login Routing Decision Engine
// ----------------------------------------------------
export function resolvePostLoginRoute(user: User): string {
  if (user.status === 'pending') {
    return '/account/pending';
  }
  if (user.status === 'needs_info') {
    return '/account/needs-info';
  }
  if (user.status === 'rejected') {
    return '/account/rejected';
  }
  if (user.status === 'suspended') {
    return '/account/suspended';
  }
  if (user.status === 'approved') {
    if (user.role !== 'admin' && user.onboardingStatus !== 'complete') {
      return `/onboarding/${user.role}`;
    }
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'trainer') return '/trainer/dashboard';
    return '/trainee/dashboard';
  }
  return '/login';
}

// ----------------------------------------------------
// 3. Enrollment State Machine & Validation
// ----------------------------------------------------
const ALLOWED_ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  requested: ['enrolled', 'waitlisted', 'dropped'],
  enrolled: ['completed', 'dropped'],
  waitlisted: ['enrolled', 'dropped'],
  completed: [],
  dropped: ['requested'],
};

export function canTransitionEnrollment(current: EnrollmentStatus, target: EnrollmentStatus): boolean {
  return ALLOWED_ENROLLMENT_TRANSITIONS[current]?.includes(target) ?? false;
}

export function transitionEnrollment(current: EnrollmentStatus, target: EnrollmentStatus): EnrollmentStatus {
  if (!canTransitionEnrollment(current, target)) {
    throw new InvalidTransitionError('Enrollment', current, target);
  }
  return target;
}

export function validateCourseEnrollment(
  course: Course,
  currentEnrollmentCount: number,
  traineeProfile: TraineeProfile,
  existingEnrollment?: Enrollment
): { targetStatus: 'enrolled' | 'waitlisted'; warnings: string[] } {
  const warnings: string[] = [];

  if (course.status !== 'published' && course.status !== 'in_progress') {
    throw new EnrollmentRuleError(`Cannot enroll in course with status '${course.status}'.`);
  }

  if (existingEnrollment && existingEnrollment.status !== 'dropped') {
    throw new EnrollmentRuleError(`Already ${existingEnrollment.status} in this course.`);
  }

  // Check prerequisites
  if (course.prerequisites && course.prerequisites.length > 0) {
    const traineeQualifications = traineeProfile.qualifications || [];
    const traineeSkills = traineeProfile.skills || [];
    const combinedCompetencies = [...traineeQualifications, ...traineeSkills].map((s) =>
      s.toLowerCase()
    );

    for (const prereq of course.prerequisites) {
      const isMet = combinedCompetencies.some((c) => c.includes(prereq.toLowerCase()));
      if (!isMet) {
        warnings.push(`Prerequisite not explicitly listed in profile: "${prereq}"`);
      }
    }
  }

  // Check capacity
  if (currentEnrollmentCount >= course.capacity) {
    return {
      targetStatus: 'waitlisted',
      warnings: [...warnings, `Course is at full capacity (${course.capacity}). Placed on waitlist.`],
    };
  }

  return {
    targetStatus: 'enrolled',
    warnings,
  };
}

// ----------------------------------------------------
// 4. Completion Eligibility Rule
// ----------------------------------------------------
export function isEligibleForCompletion(
  enrollment: Enrollment,
  courseAssessments: Assessment[],
  traineeAttempts: Attempt[],
  minAttendancePct: number = 75,
  requireAllAssessmentsAttempted: boolean = true
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (enrollment.status !== 'enrolled') {
    reasons.push(`Current enrollment status is '${enrollment.status}' (must be 'enrolled')`);
  }

  if (enrollment.attendancePct < minAttendancePct) {
    reasons.push(
      `Attendance (${enrollment.attendancePct}%) is below minimum required (${minAttendancePct}%)`
    );
  }

  if (requireAllAssessmentsAttempted && courseAssessments.length > 0) {
    const publishedAssessments = courseAssessments.filter((a) => a.status === 'published');
    const attemptedIds = new Set(traineeAttempts.map((at) => at.assessmentId));

    const unattempted = publishedAssessments.filter((a) => !attemptedIds.has(a.id));
    if (unattempted.length > 0) {
      reasons.push(
        `${unattempted.length} mandatory assessment(s) unattempted: ${unattempted
          .map((a) => a.title)
          .join(', ')}`
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
