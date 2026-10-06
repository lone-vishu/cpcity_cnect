import { describe, it, expect } from 'vitest';
import { runTrainerMatch } from '../matching/trainerMatcher';
import {
  transitionCourse,
  validateCourseEnrollment,
  isEligibleForCompletion,
  transitionAccount,
} from './stateMachines';
import {
  Course,
  User,
  TrainerProfile,
  TraineeProfile,
  Competency,
  Enrollment,
  TrainingNeed,
  Assessment,
  Attempt,
} from '../types';

describe('End-to-End Demo Workflow Smoke Test', () => {
  // 1. Setup sample entities
  const sampleTrainee: User = {
    id: 'trainee-test-01',
    name: 'Suresh Kumar',
    email: 'suresh@capacityconnect.demo',
    role: 'trainee',
    status: 'approved',
    centreId: 'centre_pune',
    createdAt: '2026-01-01',
    synthetic: true,
  };

  const sampleTraineeProfile: TraineeProfile = {
    userId: 'trainee-test-01',
    designation: 'Meteorological Assistant',
    qualifications: ['M.Sc. Physics'],
    experience: ['2 years synoptic chart plotting'],
    interests: ['Radar Meteorology'],
    skills: ['Surface Observations'],
    certificates: [],
  };

  const sampleTrainerUser: User = {
    id: 'trainer-test-01',
    name: 'Dr. Rajeshwar Sharma',
    email: 'trainer.demo@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre_pune',
    createdAt: '2026-01-01',
    synthetic: true,
  };

  const sampleTrainerProfile: TrainerProfile = {
    userId: 'trainer-test-01',
    bio: 'Senior radar meteorologist with 15+ years experience',
    subjects: ['Radar Meteorology', 'Nowcasting'],
    qualifications: ['Ph.D. Atmospheric Sciences', 'WMO Level 3 Certified'],
    centreId: 'centre_pune',
    availability: [{ id: 'av-01', startDate: '2026-04-01', endDate: '2026-05-01', isAvailable: true }],
    evidence: [
      {
        id: 'ev-01',
        trainerId: 'trainer-test-01',
        competencyId: 'comp-radar-ops',
        type: 'certification',
        count: 2,
        years: 8,
        sourceNote: 'Certified DWR Specialist',
        verifiedStatus: 'verified',
      },
      {
        id: 'ev-02',
        trainerId: 'trainer-test-01',
        competencyId: 'comp-radar-ops',
        type: 'delivered_course',
        count: 5,
        years: 6,
        sourceNote: 'Delivered national radar batches',
        verifiedStatus: 'verified',
      },
    ],
  };

  const sampleCompetencies: Competency[] = [
    {
      id: 'comp-radar-ops',
      name: 'Doppler Weather Radar Calibration and Maintenance',
      domain: 'Radar Meteorology',
      level: 3,
      description: 'RF calibration and signal processing',
      source: 'Demo taxonomy (WMO-referenced, pending expert review)',
      version: '0.1',
      reviewStatus: 'reviewed',
    },
  ];

  it('Step 1: Admin approves pending trainer and course enters review', () => {
    const pendingTrainerStatus = transitionAccount('pending', 'approved');
    expect(pendingTrainerStatus).toBe('approved');

    // Create course in draft and submit for approval
    const draftCourse: Course = {
      id: 'crs-test-01',
      title: 'Doppler Weather Radar Advanced Workshop',
      subject: 'Radar Meteorology',
      objectives: ['Operate DWR radars', 'Calibrate receivers'],
      competencyIds: ['comp-radar-ops'],
      prerequisites: [],
      deliveryMode: 'in_person',
      centreId: 'centre_pune',
      startDate: '2026-04-10',
      endDate: '2026-04-20',
      capacity: 25,
      status: 'draft',
      version: 1,
    };

    const pendingCourse = transitionCourse(draftCourse.status, 'pending_approval');
    expect(pendingCourse).toBe('pending_approval');

    const publishedCourse = transitionCourse(pendingCourse, 'published');
    expect(publishedCourse).toBe('published');
  });

  it('Step 2: Admin runs Trainer Match and selects highest ranked faculty', () => {
    const targetNeed: TrainingNeed = {
      id: 'need-01',
      title: 'DWR Specialist Course',
      requiredCompetencyIds: ['comp-radar-ops'],
      targetCentreId: 'centre_pune',
      deliveryMode: 'in_person',
      window: { startDate: '2026-04-10', endDate: '2026-04-20' },
      createdBy: 'admin-01',
      status: 'open',
    };

    const matchResults = runTrainerMatch(
      targetNeed,
      [{ user: sampleTrainerUser, profile: sampleTrainerProfile }],
      sampleCompetencies,
      {
        competencyOverlap: 45,
        qualificationRelevance: 25,
        priorDelivery: 20,
        availabilityCentreFit: 10,
      }
    );

    expect(matchResults.length).toBe(1);
    expect(matchResults[0].trainerId).toBe(sampleTrainerUser.id);
    expect(matchResults[0].score).toBeGreaterThan(80);
    expect(matchResults[0].breakdown.competency).toBe(100);
    expect(matchResults[0].evidence.length).toBe(2);
  });

  it('Step 3: Trainee enrolls adhering to capacity and prerequisites', () => {
    const publishedCourse: Course = {
      id: 'crs-test-01',
      title: 'Doppler Weather Radar Advanced Workshop',
      subject: 'Radar Meteorology',
      objectives: ['Operate DWR radars'],
      competencyIds: ['comp-radar-ops'],
      prerequisites: [],
      deliveryMode: 'in_person',
      centreId: 'centre_pune',
      startDate: '2026-04-10',
      endDate: '2026-04-20',
      capacity: 25,
      status: 'published',
      version: 1,
    };

    const enrollResult = validateCourseEnrollment(
      publishedCourse,
      10, // 10 currently enrolled, capacity 25
      sampleTraineeProfile
    );

    expect(enrollResult.targetStatus).toBe('enrolled');
    expect(enrollResult.warnings.length).toBe(0);
  });

  it('Step 4 & 5: Trainee completes assessment and earns completion certificate', () => {
    const sampleEnrollment: Enrollment = {
      id: 'enr-test-01',
      traineeId: sampleTrainee.id,
      courseId: 'crs-test-01',
      status: 'enrolled',
      enrolledAt: '2026-04-01T09:00:00Z',
      attendancePct: 85,
    };

    const courseAssessments: Assessment[] = [
      {
        id: 'asm-test-01',
        courseId: 'crs-test-01',
        title: 'Mid-term Radar Evaluation',
        deadline: '2026-04-30T18:00:00Z',
        durationMin: 30,
        questions: [],
        status: 'published',
      },
    ];

    const traineeAttempts: Attempt[] = [
      {
        id: 'att-test-01',
        assessmentId: 'asm-test-01',
        traineeId: sampleTrainee.id,
        answers: [1, 2, 0],
        score: 85,
        submittedAt: '2026-04-15T10:00:00Z',
      },
    ];

    // Attendance 85%, 1 required assessment attempted with passing score
    const completionCheck = isEligibleForCompletion(
      sampleEnrollment,
      courseAssessments,
      traineeAttempts,
      75,
      true
    );

    expect(completionCheck.eligible).toBe(true);
    expect(completionCheck.reasons.length).toBe(0);
  });
});
