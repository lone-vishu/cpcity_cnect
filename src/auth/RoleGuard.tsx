import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Role } from '../domain/types';
import { resolvePostLoginRoute } from '../domain/workflow/stateMachines';

interface RoleGuardProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
}

/**
 * Client-Side Route & Role Guard
 *
 * NOTE ON SECURITY:
 * This route guard operates in the browser client layer for prototype demonstration.
 * In a real-world production deployment for the India Meteorological Department / MoES:
 * - Role-Based Access Control (RBAC) and account status enforcement MUST be validated server-side on every API request.
 * - HTTP responses must return standard 401 Unauthorized / 403 Forbidden with secure HTTP-only session cookies / JWT tokens.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> redirect to /login with inferred role
  if (!isAuthenticated || !currentUser) {
    let inferredRole = 'trainee';
    if (location.pathname.startsWith('/trainer')) inferredRole = 'trainer';
    else if (location.pathname.startsWith('/admin')) inferredRole = 'admin';
    return <Navigate to={`/login?role=${inferredRole}`} state={{ from: location }} replace />;
  }

  // 2. Account Status Routing
  if (currentUser.status === 'pending') {
    return <Navigate to="/account/pending" replace />;
  }
  if (currentUser.status === 'needs_info') {
    return <Navigate to="/account/needs-info" replace />;
  }
  if (currentUser.status === 'rejected') {
    return <Navigate to="/account/rejected" replace />;
  }
  if (currentUser.status === 'suspended') {
    return <Navigate to="/account/suspended" replace />;
  }

  // 3. Approved but not onboarded -> redirect to onboarding
  if (
    currentUser.status === 'approved' &&
    currentUser.role !== 'admin' &&
    currentUser.onboardingStatus !== 'complete'
  ) {
    return <Navigate to={`/onboarding/${currentUser.role}`} replace />;
  }

  // 4. Role mismatch check
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};
