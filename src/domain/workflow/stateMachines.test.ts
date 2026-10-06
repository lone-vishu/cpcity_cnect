import { describe, it, expect } from 'vitest';
import {
  transitionCourse,
  transitionAccount,
  transitionEnrollment,
  validateCourseEnrollment,
  isEligibleForCompletion,
  InvalidTransitionError,
  EnrollmentRuleError,
} from './stateMachines';
import { Course, Enrollment, Assessment, Attempt, TraineeProfile } from '../types';

describe('Workflow State Machines', () => {
  describe('Course Transitions', () => {
    it('allows valid transitions (draft -> pending_approval -> published)', () => {
      expect(transitionCourse('draft', 'pending_approval')).toBe('pending_approval');
      expect(transitionCourse('pending_approval', 'published')).toBe('published');
      expect(transitionCourse('published', 'in_progress')).toBe('in_progress');
      expect(transitionCourse('in_progress', 'completed')).toBe('completed');
      expect(transitionCourse('completed', 'archived')).toBe('archived');
    });

    it('allows admin requesting changes (pending_approval -> draft)', () => {
      expect(transitionCourse('pending_approval', 'draft')).toBe('draft');
    });

    it('rejects invalid transitions (draft -> completed)', () => {
      expect(() => transitionCourse('draft', 'completed')).toThrow(InvalidTransitionError);
      expect(() => transitionCourse('completed', 'published')).toThrow(InvalidTransitionError);
    });
  });

  describe('Account Transitions', () => {
    it('allows approving or rejecting pending accounts', () => {
      expect(transitionAccount('pending', 'approved')).toBe('approved');
      expect(transitionAccount('pending', 'rejected')).toBe('rejected');
    });

    it('allows suspending and reactivating approved accounts', () => {
      expect(transitionAccount('approved', 'suspended')).toBe('suspended');
      expect(transitionAccount('suspended', 'approved')).toBe('approved');
    });

    it('rejects invalid account transitions', () => {
      expect(() => transitionAccount('pending', 'suspended')).toThrow(InvalidTransitionError);
    });
  });

  describe('Enrollment Validation and Rules', () => {
    const sampleCourse: Course = {
      id: 'c-1',
      title: 'Satellite Weather Analysis',
      subject: 'Satellite Meteorology',
      objectives: ['Analyze INSAT imagery'],
      competencyIds: ['comp-sat'],
      prerequisites: ['Basic Meteorology'],
      deliveryMode: 'blended',
      centreId: 'centre-delhi',
      startDate: '2026-10-01',
      endDate: '2026-10-15',
      capacity: 20,
      status: 'published',
      version: 1,
    };

    const traineeProfile: TraineeProfile = {
      userId: 'tr-1',
      designation: 'Scientific Assistant',
      qualifications: ['B.Sc. Physics with Basic Meteorology'],
      experience: ['2 years at RMC'],
      interests: ['Satellite'],
      skills: ['INSAT analysis'],
      certificates: [],
    };

    it('allows enrollment when course is published and under capacity', () => {
      const result = validateCourseEnrollment(sampleCourse, 10, traineeProfile);
      expect(result.targetStatus).toBe('enrolled');
    });

    it('places trainee on waitlist when course is at capacity', () => {
      const result = validateCourseEnrollment(sampleCourse, 20, traineeProfile);
      expect(result.targetStatus).toBe('waitlisted');
      expect(result.warnings.some((w) => w.includes('waitlist'))).toBe(true);
    });

    it('throws error if enrolling in a draft course', () => {
      const draftCourse = { ...sampleCourse, status: 'draft' as const };
      expect(() => validateCourseEnrollment(draftCourse, 0, traineeProfile)).toThrow(
        EnrollmentRuleError
      );
    });
  });

  describe('Completion Eligibility Rule', () => {
    const enrollment: Enrollment = {
      id: 'en-1',
      traineeId: 'tr-1',
      courseId: 'c-1',
      status: 'enrolled',
      enrolledAt: '2026-09-01T00:00:00Z',
      attendancePct: 80,
    };

    const assessments: Assessment[] = [
      {
        id: 'ass-1',
        courseId: 'c-1',
        title: 'Module 1 Quiz',
        deadline: '2026-10-10',
        durationMin: 15,
        questions: [],
        status: 'published',
      },
    ];

    it('passes when attendance is >= 75% and all assessments attempted', () => {
      const attempts: Attempt[] = [
        {
          id: 'att-1',
          assessmentId: 'ass-1',
          traineeId: 'tr-1',
          answers: [0],
          score: 85,
          submittedAt: '2026-10-05T00:00:00Z',
        },
      ];

      const res = isEligibleForCompletion(enrollment, assessments, attempts, 75, true);
      expect(res.eligible).toBe(true);
      expect(res.reasons.length).toBe(0);
    });

    it('fails when attendance is below 75%', () => {
      const lowAttendance = { ...enrollment, attendancePct: 60 };
      const attempts: Attempt[] = [
        {
          id: 'att-1',
          assessmentId: 'ass-1',
          traineeId: 'tr-1',
          answers: [0],
          score: 85,
          submittedAt: '2026-10-05T00:00:00Z',
        },
      ];

      const res = isEligibleForCompletion(lowAttendance, assessments, attempts, 75, true);
      expect(res.eligible).toBe(false);
      expect(res.reasons.some((r) => r.includes('Attendance (60%) is below'))).toBe(true);
    });

    it('fails when mandatory assessments are not attempted', () => {
      const res = isEligibleForCompletion(enrollment, assessments, [], 75, true);
      expect(res.eligible).toBe(false);
      expect(res.reasons.some((r) => r.includes('mandatory assessment(s) unattempted'))).toBe(true);
    });
  });
});
