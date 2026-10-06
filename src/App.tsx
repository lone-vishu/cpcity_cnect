import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RoleGuard } from './auth/RoleGuard';
import { ToastProvider } from './components/common/Toast';
import { AppShell } from './components/layout/AppShell';

import { HomePage } from './features/public/HomePage';
import { LoginPage } from './features/public/LoginPage';
import { SignupPage } from './features/public/SignupPage';
import { AnnouncementsPage } from './features/public/AnnouncementsPage';
import { NotFoundPage } from './features/public/NotFoundPage';
import { ForbiddenPage } from './features/public/ForbiddenPage';

// Registration & Onboarding
import { TraineeRegistrationWizard } from './features/register/TraineeRegistrationWizard';
import { TrainerRegistrationWizard } from './features/register/TrainerRegistrationWizard';
import { RegistrationSubmittedPage } from './features/register/RegistrationSubmittedPage';
import { TraineeOnboardingPage } from './features/onboarding/TraineeOnboardingPage';
import { TrainerOnboardingPage } from './features/onboarding/TrainerOnboardingPage';

// Account Status Screens
import { PendingAccountPage } from './features/account/PendingAccountPage';
import { NeedsInfoAccountPage } from './features/account/NeedsInfoAccountPage';
import { RejectedAccountPage } from './features/account/RejectedAccountPage';
import { SuspendedAccountPage } from './features/account/SuspendedAccountPage';
import { AccountStatusGuard } from './features/account/AccountStatusGuard';

// Shared course pages
import { CourseCataloguePage } from './features/courses/CourseCataloguePage';
import { CourseDetailPage } from './features/courses/CourseDetailPage';

// Trainee pages
import { TraineeDashboardPage } from './features/trainee/TraineeDashboardPage';
import { TraineeProfilePage } from './features/trainee/TraineeProfilePage';
import { MyLearningPage } from './features/trainee/MyLearningPage';
import { AssessmentsListPage } from './features/trainee/AssessmentsListPage';
import { AssessmentAttemptPage } from './features/trainee/AssessmentAttemptPage';
import { CertificatesPage } from './features/trainee/CertificatesPage';

// Trainer pages
import { TrainerDashboardPage } from './features/trainer/TrainerDashboardPage';
import { TrainerProfilePage } from './features/trainer/TrainerProfilePage';
import { TrainerCoursesPage } from './features/trainer/TrainerCoursesPage';
import { CourseCohortPage } from './features/trainer/CourseCohortPage';
import { AssessmentBuilderPage } from './features/trainer/AssessmentBuilderPage';
import { TrainerLibraryPage } from './features/trainer/TrainerLibraryPage';

// Admin pages
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { UserManagementPage } from './features/admin/UserManagementPage';
import { CourseApprovalsPage } from './features/admin/CourseApprovalsPage';
import { TrainingNeedsPage } from './features/admin/TrainingNeedsPage';
import { TrainerMatchPage } from './features/admin/TrainerMatchPage';
import { CompetencyCataloguePage } from './features/admin/CompetencyCataloguePage';
import { EvidenceVerificationPage } from './features/admin/EvidenceVerificationPage';
import { AnnouncementsAdminPage } from './features/admin/AnnouncementsAdminPage';
import { ReportsPage } from './features/admin/ReportsPage';
import { AuditLogPage } from './features/admin/AuditLogPage';
import { AdminSettingsPage } from './features/admin/AdminSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 min
    },
  },
});

// Helper component to redirect /profile based on active role
const ProfileRedirect: React.FC = () => {
  const { currentRole } = useAuth();
  if (currentRole === 'trainer') return <Navigate to="/trainer/profile" replace />;
  if (currentRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/trainee/profile" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Standalone Public Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Navigate to="/register/trainee" replace />} />
              <Route path="/403" element={<ForbiddenPage />} />

              {/* Registration Routes */}
              <Route path="/register/trainee" element={<TraineeRegistrationWizard />} />
              <Route path="/register/trainer" element={<TrainerRegistrationWizard />} />
              <Route path="/register/submitted" element={<RegistrationSubmittedPage />} />

              {/* Account Status Screens (Guarded) */}
              <Route
                path="/account/pending"
                element={
                  <AccountStatusGuard expectedStatus="pending">
                    <PendingAccountPage />
                  </AccountStatusGuard>
                }
              />
              <Route
                path="/account/needs-info"
                element={
                  <AccountStatusGuard expectedStatus="needs_info">
                    <NeedsInfoAccountPage />
                  </AccountStatusGuard>
                }
              />
              <Route
                path="/account/rejected"
                element={
                  <AccountStatusGuard expectedStatus="rejected">
                    <RejectedAccountPage />
                  </AccountStatusGuard>
                }
              />
              <Route
                path="/account/suspended"
                element={
                  <AccountStatusGuard expectedStatus="suspended">
                    <SuspendedAccountPage />
                  </AccountStatusGuard>
                }
              />

              {/* First-Login Onboarding Routes */}
              <Route path="/onboarding/trainee" element={<TraineeOnboardingPage />} />
              <Route path="/onboarding/trainer" element={<TrainerOnboardingPage />} />

              {/* Main Application Layout Shell */}
              <Route element={<AppShell />}>
                {/* Public / Shared in-shell routes */}
                <Route path="/courses" element={<CourseCataloguePage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/announcements/:id" element={<AnnouncementsPage />} />

                {/* Profile redirect helper */}
                <Route
                  path="/profile"
                  element={
                    <RoleGuard>
                      <ProfileRedirect />
                    </RoleGuard>
                  }
                />

                {/* Trainee Routes */}
                <Route
                  path="/trainee/dashboard"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'admin']}>
                      <TraineeDashboardPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainee/profile"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'admin']}>
                      <TraineeProfilePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainee/my-courses"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'admin']}>
                      <MyLearningPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/my-courses"
                  element={<Navigate to="/trainee/my-courses" replace />}
                />
                <Route
                  path="/trainee/assessments"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'admin']}>
                      <AssessmentsListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/assessments"
                  element={<Navigate to="/trainee/assessments" replace />}
                />
                <Route
                  path="/trainee/assessments/:id"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'admin']}>
                      <AssessmentAttemptPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/assessments/:id"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'admin']}>
                      <AssessmentAttemptPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <RoleGuard allowedRoles={['trainee', 'trainer', 'admin']}>
                      <CertificatesPage />
                    </RoleGuard>
                  }
                />

                {/* Trainer Routes */}
                <Route
                  path="/trainer/dashboard"
                  element={
                    <RoleGuard allowedRoles={['trainer', 'admin']}>
                      <TrainerDashboardPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainer/profile"
                  element={
                    <RoleGuard allowedRoles={['trainer', 'admin']}>
                      <TrainerProfilePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainer/courses"
                  element={
                    <RoleGuard allowedRoles={['trainer', 'admin']}>
                      <TrainerCoursesPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainer/courses/:id/cohort"
                  element={
                    <RoleGuard allowedRoles={['trainer', 'admin']}>
                      <CourseCohortPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainer/assessments"
                  element={
                    <RoleGuard allowedRoles={['trainer', 'admin']}>
                      <AssessmentBuilderPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/trainer/library"
                  element={
                    <RoleGuard allowedRoles={['trainer', 'admin']}>
                      <TrainerLibraryPage />
                    </RoleGuard>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <UserManagementPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/courses"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <CourseApprovalsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/needs"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <TrainingNeedsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/needs/:id/match"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <TrainerMatchPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/courses/:id/match"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <TrainerMatchPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/competencies"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <CompetencyCataloguePage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/verification"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <EvidenceVerificationPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/announcements"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <AnnouncementsAdminPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <ReportsPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <AuditLogPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <RoleGuard allowedRoles={['admin']}>
                      <AdminSettingsPage />
                    </RoleGuard>
                  }
                />

                {/* Catch-all Not Found Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
