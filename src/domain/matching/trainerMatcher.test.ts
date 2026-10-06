import { describe, it, expect } from 'vitest';
import {
  runTrainerMatch,
  normalizeWeights,
  TrainerWithProfile,
  MatchingTarget,
} from './trainerMatcher';
import { Competency } from '../types';

describe('Trainer Matcher Engine', () => {
  const demoCompetencies: Competency[] = [
    {
      id: 'comp-radar',
      name: 'Doppler Weather Radar Meteorology',
      domain: 'Radar Meteorology',
      level: 3,
      description: 'Operation and interpretation of Doppler Weather Radar products',
      source: 'WMO-1209 Reference',
      version: '0.1',
      reviewStatus: 'demo',
    },
    {
      id: 'comp-cyclone',
      name: 'Tropical Cyclone Structure & Track Forecasting',
      domain: 'Tropical Cyclone Forecasting',
      level: 4,
      description: 'Synoptic and numerical tracking of tropical cyclonic storms',
      source: 'WMO-1209 Reference',
      version: '0.1',
      reviewStatus: 'demo',
    },
  ];

  const target: MatchingTarget = {
    id: 'need-1',
    title: 'Advanced Doppler Radar Interpretation',
    requiredCompetencyIds: ['comp-radar'],
    targetCentreId: 'centre-pune',
    deliveryMode: 'in_person',
    window: {
      startDate: '2026-10-01',
      endDate: '2026-10-15',
    },
  };

  const trainers: TrainerWithProfile[] = [
    {
      user: {
        id: 'trainer-verified',
        name: 'Dr. Rajesh Sharma',
        email: 'rajesh.sharma@capacityconnect.demo',
        role: 'trainer',
        status: 'approved',
        centreId: 'centre-pune',
        createdAt: '2026-01-15T00:00:00Z',
        synthetic: true,
      },
      profile: {
        userId: 'trainer-verified',
        bio: 'Senior Radar Meteorologist with 14 years training experience.',
        subjects: ['Radar Meteorology'],
        qualifications: ['Ph.D. Atmospheric Physics', 'WMO Level 4 Certified'],
        centreId: 'centre-pune',
        availability: [
          {
            id: 'avail-1',
            startDate: '2026-09-01',
            endDate: '2026-12-31',
            isAvailable: true,
          },
        ],
        evidence: [
          {
            id: 'ev-1',
            trainerId: 'trainer-verified',
            competencyId: 'comp-radar',
            type: 'certification',
            count: 1,
            years: 8,
            sourceNote: 'WMO Doppler Radar Specialist Certification',
            verifiedStatus: 'verified',
          },
          {
            id: 'ev-2',
            trainerId: 'trainer-verified',
            competencyId: 'comp-radar',
            type: 'delivered_course',
            count: 6,
            years: 6,
            sourceNote: 'Delivered DWR training series 2021-2025',
            verifiedStatus: 'verified',
          },
        ],
      },
    },
    {
      user: {
        id: 'trainer-unverified',
        name: 'Amit Verma',
        email: 'amit.verma@capacityconnect.demo',
        role: 'trainer',
        status: 'approved',
        centreId: 'centre-delhi',
        createdAt: '2026-02-10T00:00:00Z',
        synthetic: true,
      },
      profile: {
        userId: 'trainer-unverified',
        bio: 'Meteorologist with radar self-study.',
        subjects: ['Synoptic Meteorology'],
        qualifications: ['M.Sc. Meteorology'],
        centreId: 'centre-delhi',
        availability: [],
        evidence: [
          {
            id: 'ev-3',
            trainerId: 'trainer-unverified',
            competencyId: 'comp-radar',
            type: 'qualification',
            count: 1,
            years: 2,
            sourceNote: 'University radar coursework',
            verifiedStatus: 'unverified',
          },
        ],
      },
    },
  ];

  it('normalizes weights when they do not sum to 100', () => {
    const raw = {
      competencyOverlap: 40,
      qualificationRelevance: 20,
      priorDelivery: 20,
      availabilityCentreFit: 10,
    };
    const normalized = normalizeWeights(raw);
    const sum =
      normalized.competencyOverlap +
      normalized.qualificationRelevance +
      normalized.priorDelivery +
      normalized.availabilityCentreFit;
    expect(sum).toBe(100);
  });

  it('ranks verified trainer higher than unverified trainer for same competency', () => {
    const defaultWeights = {
      competencyOverlap: 45,
      qualificationRelevance: 25,
      priorDelivery: 20,
      availabilityCentreFit: 10,
    };

    const results = runTrainerMatch(target, trainers, demoCompetencies, defaultWeights);

    expect(results.length).toBe(2);
    expect(results[0].trainerId).toBe('trainer-verified');
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].breakdown.competency).toBe(100);
    expect(results[1].breakdown.competency).toBe(50); // 50% partial credit for unverified
  });

  it('flags missing competencies and unverified evidence correctly', () => {
    const multiCompTarget: MatchingTarget = {
      id: 'need-multi',
      title: 'Radar & Tropical Cyclone Course',
      requiredCompetencyIds: ['comp-radar', 'comp-cyclone'],
      targetCentreId: 'centre-pune',
      deliveryMode: 'in_person',
    };

    const results = runTrainerMatch(multiCompTarget, trainers, demoCompetencies, {
      competencyOverlap: 45,
      qualificationRelevance: 25,
      priorDelivery: 20,
      availabilityCentreFit: 10,
    });

    const verifiedTrainerResult = results.find((r) => r.trainerId === 'trainer-verified')!;
    expect(
      verifiedTrainerResult.missingInfo.some((info) =>
        info.includes('Tropical Cyclone Structure & Track Forecasting')
      )
    ).toBe(true);

    const unverifiedTrainerResult = results.find((r) => r.trainerId === 'trainer-unverified')!;
    expect(
      unverifiedTrainerResult.missingInfo.some((info) =>
        info.includes('pending administrative verification')
      )
    ).toBe(true);
  });

  it('breaks ties deterministically by verified evidence count then name', () => {
    const tieTrainers: TrainerWithProfile[] = [
      {
        user: {
          id: 't-b',
          name: 'Bob Sharma',
          email: 'b@demo.demo',
          role: 'trainer',
          status: 'approved',
          centreId: 'centre-pune',
          createdAt: '',
          synthetic: true,
        },
        profile: {
          userId: 't-b',
          bio: '',
          subjects: [],
          qualifications: [],
          centreId: 'centre-pune',
          availability: [],
          evidence: [],
        },
      },
      {
        user: {
          id: 't-a',
          name: 'Alice Patel',
          email: 'a@demo.demo',
          role: 'trainer',
          status: 'approved',
          centreId: 'centre-pune',
          createdAt: '',
          synthetic: true,
        },
        profile: {
          userId: 't-a',
          bio: '',
          subjects: [],
          qualifications: [],
          centreId: 'centre-pune',
          availability: [],
          evidence: [],
        },
      },
    ];

    const results = runTrainerMatch(
      {
        title: 'Empty Need',
        requiredCompetencyIds: [],
        targetCentreId: 'centre-pune',
        deliveryMode: 'online',
      },
      tieTrainers,
      demoCompetencies,
      {
        competencyOverlap: 45,
        qualificationRelevance: 25,
        priorDelivery: 20,
        availabilityCentreFit: 10,
      }
    );

    // Identical scores, 0 verified evidence: Alice should come before Bob alphabetically
    expect(results[0].trainerName).toBe('Alice Patel');
    expect(results[1].trainerName).toBe('Bob Sharma');
  });
});
