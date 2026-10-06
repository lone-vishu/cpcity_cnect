import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AccountStatus } from '../../domain/types';
import { resolvePostLoginRoute } from '../../domain/workflow/stateMachines';

interface AccountStatusGuardProps {
  expectedStatus: AccountStatus;
  children: React.ReactNode;
}

export const AccountStatusGuard: React.FC<AccountStatusGuardProps> = ({
  expectedStatus,
  children,
}) => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.status !== expectedStatus) {
    const route = resolvePostLoginRoute(currentUser);
    return <Navigate to={route} replace />;
  }

  return <>{children}</>;
};
