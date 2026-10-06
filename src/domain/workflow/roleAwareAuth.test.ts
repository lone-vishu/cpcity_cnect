import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolvePostLoginRoute,
  transitionApplication,
  canTransitionApplication,
  InvalidTransitionError,
} from './stateMachines';
import { User, ApplicationStatus } from '../types';
import { hashPassword, verifyPassword } from '../../lib/crypto';
import { mockRepositories } from '../../data/adapters/mock/mockAdapter';

describe('Role-Aware Auth, Routing & Application Lifecycle', () => {
  describe('resolvePostLoginRoute Engine', () => {
    it('routes pending accounts to /account/pending', () => {
      const user: User = {
        id: 'u-1',
        email: 'test@capacityconnect.demo',
        name: 'Test Trainee',
        role: 'trainee',
        status: 'pending',
        onboardingStatus: 'not_started',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(user)).toBe('/account/pending');
    });

    it('routes needs_info accounts to /account/needs-info', () => {
      const user: User = {
        id: 'u-2',
        email: 'test@capacityconnect.demo',
        name: 'Test Trainer',
        role: 'trainer',
        status: 'needs_info',
        onboardingStatus: 'not_started',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(user)).toBe('/account/needs-info');
    });

    it('routes rejected accounts to /account/rejected', () => {
      const user: User = {
        id: 'u-3',
        email: 'test@capacityconnect.demo',
        name: 'Test Trainee',
        role: 'trainee',
        status: 'rejected',
        onboardingStatus: 'not_started',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(user)).toBe('/account/rejected');
    });

    it('routes suspended accounts to /account/suspended', () => {
      const user: User = {
        id: 'u-4',
        email: 'test@capacityconnect.demo',
        name: 'Test User',
        role: 'trainer',
        status: 'suspended',
        onboardingStatus: 'complete',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(user)).toBe('/account/suspended');
    });

    it('routes approved trainee who has not completed onboarding to /onboarding/trainee', () => {
      const userNotStarted: User = {
        id: 'u-5',
        email: 'new.trainee@capacityconnect.demo',
        name: 'New Trainee',
        role: 'trainee',
        status: 'approved',
        onboardingStatus: 'not_started',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(userNotStarted)).toBe('/onboarding/trainee');

      const userInProgress: User = {
        ...userNotStarted,
        onboardingStatus: 'in_progress',
        onboardingStep: 2,
      };
      expect(resolvePostLoginRoute(userInProgress)).toBe('/onboarding/trainee');
    });

    it('routes approved trainer who has not completed onboarding to /onboarding/trainer', () => {
      const user: User = {
        id: 'u-6',
        email: 'new.trainer@capacityconnect.demo',
        name: 'New Trainer',
        role: 'trainer',
        status: 'approved',
        onboardingStatus: 'in_progress',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(user)).toBe('/onboarding/trainer');
    });

    it('routes approved and onboarded users directly to their dashboards', () => {
      const trainee: User = {
        id: 'u-7',
        email: 'trainee@capacityconnect.demo',
        name: 'Anita Sharma',
        role: 'trainee',
        status: 'approved',
        onboardingStatus: 'complete',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(trainee)).toBe('/trainee/dashboard');

      const trainer: User = {
        id: 'u-8',
        email: 'trainer@capacityconnect.demo',
        name: 'Dr. Rajesh Kumar',
        role: 'trainer',
        status: 'approved',
        onboardingStatus: 'complete',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(trainer)).toBe('/trainer/dashboard');

      const admin: User = {
        id: 'u-9',
        email: 'admin@capacityconnect.demo',
        name: 'Dr. Sunita Kulkarni',
        role: 'admin',
        status: 'approved',
        onboardingStatus: 'complete',
        centreId: 'centre-pune',
        synthetic: true,
        createdAt: '2026-09-01T00:00:00Z',
      };
      expect(resolvePostLoginRoute(admin)).toBe('/admin/dashboard');
    });
  });

  describe('Application State Machine Transitions', () => {
    it('allows valid lifecycle transitions (submitted -> needs_info -> submitted -> approved)', () => {
      expect(canTransitionApplication('submitted', 'needs_info')).toBe(true);
      expect(transitionApplication('submitted', 'needs_info')).toBe('needs_info');

      // Resubmission transitions back to submitted
      expect(canTransitionApplication('needs_info', 'submitted')).toBe(true);
      expect(transitionApplication('needs_info', 'submitted')).toBe('submitted');

      // Admin approval
      expect(canTransitionApplication('submitted', 'approved')).toBe(true);
      expect(transitionApplication('submitted', 'approved')).toBe('approved');
    });

    it('allows rejection and reapplication loop (submitted -> rejected -> submitted)', () => {
      expect(canTransitionApplication('submitted', 'rejected')).toBe(true);
      expect(transitionApplication('submitted', 'rejected')).toBe('rejected');

      expect(canTransitionApplication('rejected', 'submitted')).toBe(true);
      expect(transitionApplication('rejected', 'submitted')).toBe('submitted');
    });

    it('disallows invalid transitions once approved', () => {
      expect(canTransitionApplication('approved', 'submitted')).toBe(false);
      expect(canTransitionApplication('approved', 'rejected')).toBe(false);
      expect(() => transitionApplication('approved', 'submitted')).toThrow(InvalidTransitionError);
    });
  });

  describe('Crypto & Credential Verification', () => {
    it('hashes passwords and verifies them using SHA-256 with salt', async () => {
      const password = 'SecretPassword2026!';
      const hash = await hashPassword(password);
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64); // SHA-256 hex string

      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);

      const invalid = await verifyPassword('WrongPassword', hash);
      expect(invalid).toBe(false);
    });
  });

  describe('Mock Adapter Registration & Draft Persistence', () => {
    beforeEach(async () => {
      await mockRepositories.resetDatabase();
    });

    it('verifies seeded demo users with demoQuickAccess flag accept any password', async () => {
      const demoAdmin = await mockRepositories.users.verifyCredentials(
        'admin.demo@capacityconnect.demo',
        'anything'
      );
      expect(demoAdmin).toBeTruthy();
      expect(demoAdmin?.role).toBe('admin');

      const demoTrainee = await mockRepositories.users.verifyCredentials(
        'trainee.demo@capacityconnect.demo',
        'some_other_password'
      );
      expect(demoTrainee).toBeTruthy();
      expect(demoTrainee?.role).toBe('trainee');
    });

    it('saves, retrieves and deletes registration drafts', async () => {
      const testEmail = 'draft.test@capacityconnect.demo';
      const draftPayload = {
        designation: 'Research Fellow',
        qualifications: [{ degree: 'M.Sc.', institution: 'Pune Univ', year: '2025', field: 'Atmosphere' }],
        experience: [],
        skills: [{ name: 'Radar Analysis', level: 3 as const }],
        interests: ['Radar Meteorology'],
        certificates: [],
      };

      await mockRepositories.registrationDrafts.saveDraft({
        email: testEmail,
        role: 'trainee',
        step: 3,
        payload: draftPayload,
        updatedAt: new Date().toISOString(),
      });

      const loaded = await mockRepositories.registrationDrafts.getDraft(testEmail, 'trainee');
      expect(loaded).toBeTruthy();
      expect(loaded?.step).toBe(3);
      expect((loaded?.payload as any).designation).toBe('Research Fellow');

      // Delete draft
      await mockRepositories.registrationDrafts.deleteDraft(testEmail, 'trainee');
      const afterDelete = await mockRepositories.registrationDrafts.getDraft(testEmail, 'trainee');
      expect(afterDelete).toBeNull();
    });

    it('checks email uniqueness properly', async () => {
      const exists = await mockRepositories.users.emailExists('admin.demo@capacityconnect.demo');
      expect(exists).toBe(true);

      const nonExistent = await mockRepositories.users.emailExists('completely.brand.new@capacityconnect.demo');
      expect(nonExistent).toBe(false);
    });
  });
});
