import { Role } from '../domain/types';

/**
 * Single source of truth for Role-Based Access Control (RBAC).
 * 
 * NOTE FOR BACKEND INTEGRATION:
 * The frontend uses this permission map for navigation routing and UI control visibility.
 * When plugging in the real backend (FastAPI / NestJS), every protected REST endpoint
 * MUST independently verify JWT claims and re-enforce these permissions server-side.
 */
export type Permission =
  | 'view_home'
  | 'view_catalogue'
  | 'view_course_detail'
  | 'enroll_course'
  | 'view_my_courses'
  | 'attempt_assessment'
  | 'submit_feedback'
  | 'view_certificates'
  | 'manage_trainee_profile'
  | 'manage_trainer_profile'
  | 'create_course'
  | 'edit_my_course'
  | 'view_cohort'
  | 'mark_attendance'
  | 'create_assessment'
  | 'upload_resource'
  | 'delete_resource'
  | 'view_admin_dashboard'
  | 'manage_users'
  | 'approve_users'
  | 'manage_courses'
  | 'approve_courses'
  | 'manage_training_needs'
  | 'run_trainer_match'
  | 'manage_competencies'
  | 'verify_evidence'
  | 'publish_announcements'
  | 'view_reports'
  | 'view_audit_log'
  | 'manage_settings'
  | 'reset_database';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  trainee: [
    'view_home',
    'view_catalogue',
    'view_course_detail',
    'enroll_course',
    'view_my_courses',
    'attempt_assessment',
    'submit_feedback',
    'view_certificates',
    'manage_trainee_profile',
  ],
  trainer: [
    'view_home',
    'view_catalogue',
    'view_course_detail',
    'manage_trainer_profile',
    'create_course',
    'edit_my_course',
    'view_cohort',
    'mark_attendance',
    'create_assessment',
    'upload_resource',
    'delete_resource',
  ],
  admin: [
    'view_home',
    'view_catalogue',
    'view_course_detail',
    'view_admin_dashboard',
    'manage_users',
    'approve_users',
    'manage_courses',
    'approve_courses',
    'manage_training_needs',
    'run_trainer_match',
    'manage_competencies',
    'verify_evidence',
    'publish_announcements',
    'view_reports',
    'view_audit_log',
    'manage_settings',
    'reset_database',
  ],
};

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
