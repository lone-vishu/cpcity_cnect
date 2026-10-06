import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Role, User } from '../../domain/types';
import { RoleAwareLoginSchema, RoleAwareLoginFormData } from '../../domain/schemas';
import { resolvePostLoginRoute } from '../../domain/workflow/stateMachines';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

interface RoleMeta {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  defaultEmail: string;
}

const ROLE_META: Record<Role, RoleMeta> = {
  trainee: {
    title: 'Trainee sign in',
    description: 'Access accredited courses, assessments, and verifiable demo certificates.',
    icon: GraduationCap,
    accentColor: 'teal',
    defaultEmail: 'trainee.demo@capacityconnect.demo',
  },
  trainer: {
    title: 'Trainer sign in',
    description: 'Manage cohort deliveries, review learning materials, and submit competency evidence.',
    icon: Layers,
    accentColor: 'blue',
    defaultEmail: 'trainer.demo@capacityconnect.demo',
  },
  admin: {
    title: 'Administrator sign in',
    description: 'Review applications, manage courses, and execute deterministic trainer matching.',
    icon: Sparkles,
    accentColor: 'amber',
    defaultEmail: 'admin.demo@capacityconnect.demo',
  },
};

export const LoginPage: React.FC = () => {
  const { currentUser, isLoading: authLoading, loginWithCredentials, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const roleParam = searchParams.get('role') as Role | null;
  const isValidRole = roleParam && ['trainee', 'trainer', 'admin'].includes(roleParam);
  const activeRole: Role | null = isValidRole ? roleParam : null;

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleMismatch, setRoleMismatch] = useState<{ detectedRole: Role; message: string } | null>(null);

  const from = (location.state as any)?.from?.pathname || '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleAwareLoginFormData>({
    resolver: zodResolver(RoleAwareLoginSchema),
    defaultValues: {
      email: activeRole ? ROLE_META[activeRole].defaultEmail : '',
      password: 'password123',
      rememberMe: false,
    },
  });

  const currentEmail = watch('email');

  // Automatically sync email when activeRole changes (e.g. from query params or role switcher)
  useEffect(() => {
    if (activeRole && ROLE_META[activeRole]) {
      setValue('email', ROLE_META[activeRole].defaultEmail);
      setRoleMismatch(null);
    }
  }, [activeRole, setValue]);

  // Handle switching tabs
  const handleRoleSelect = (newRole: Role) => {
    setSearchParams({ role: newRole });
    setRoleMismatch(null);
    setValue('email', ROLE_META[newRole].defaultEmail);
  };

  const onSubmit = async (data: RoleAwareLoginFormData) => {
    if (!activeRole) return;
    setIsSubmitting(true);
    setRoleMismatch(null);

    try {
      const result = await loginWithCredentials(data.email, data.password, activeRole);

      if (result.roleMismatch && result.user) {
        setRoleMismatch({
          detectedRole: result.roleMismatch,
          message: `This account is registered as a ${result.roleMismatch.charAt(0).toUpperCase() + result.roleMismatch.slice(1)}.`,
        });
        showToast(`Role mismatch: Registered as ${result.roleMismatch}`, 'warning');
        return;
      }

      if (result.error || !result.user) {
        showToast(result.error || 'Authentication failed. Please verify credentials.', 'error');
        return;
      }

      const user = result.user;
      showToast(`Signed in successfully as ${user.name}`, 'success');

      // Post-login routing via resolvePostLoginRoute
      const destination = resolvePostLoginRoute(user);

      // Deep link handling if approved & onboarded
      if (
        user.status === 'approved' &&
        (user.role === 'admin' || user.onboardingStatus === 'complete') &&
        from &&
        !from.startsWith('/login') &&
        !from.startsWith('/account')
      ) {
        navigate(from, { replace: true });
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  // 1. Role Picker Screen (if no ?role= specified)
  if (!activeRole) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white font-black shadow-lg">
              CC
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Select Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Capacity Connect provides dedicated, role-specific experiences. Choose your role to proceed to sign in.
            </p>
          </div>

          {currentUser && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-3.5 dark:border-teal-900/60 dark:bg-teal-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs uppercase">
                  {currentUser.role.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-950 dark:text-teal-200">
                    Active Session: {currentUser.name} ({currentUser.role})
                  </p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400">
                    Sign in below to switch accounts, or return to your dashboard.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={resolvePostLoginRoute(currentUser)}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    showToast('Signed out of previous session', 'info');
                  }}
                  className="rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Trainee Option */}
            <button
              onClick={() => handleRoleSelect('trainee')}
              className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs hover:border-teal-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Trainee</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Operational learners and course attendees
              </p>
              <span className="mt-4 text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span>Sign in as Trainee</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>

            {/* Trainer Option */}
            <button
              onClick={() => handleRoleSelect('trainer')}
              className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs hover:border-blue-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Trainer</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Specialist instructors and meteorological faculty
              </p>
              <span className="mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>Sign in as Trainer</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>

            {/* Admin Option */}
            <button
              onClick={() => handleRoleSelect('admin')}
              className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs hover:border-amber-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Administrator</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Training center officers and reviewers
              </p>
              <span className="mt-4 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>Sign in as Admin</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-400">
            Need to register a new account?{' '}
            <Link to="/register/trainee" className="text-teal-600 hover:underline font-semibold dark:text-teal-400">
              Register as Trainee
            </Link>
            {' or '}
            <Link to="/register/trainer" className="text-blue-600 hover:underline font-semibold dark:text-blue-400">
              Register as Trainer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Role-specific Sign-in Form
  const meta = ROLE_META[activeRole];
  const Icon = meta.icon;

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {currentUser && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-3.5 dark:border-teal-900/60 dark:bg-teal-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs uppercase">
                {currentUser.role.slice(0, 2)}
              </div>
              <div>
                <p className="text-xs font-bold text-teal-950 dark:text-teal-200">
                  Active Session: {currentUser.name} ({currentUser.role})
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-400">
                  Choose a role tab or sign in below to switch accounts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={resolvePostLoginRoute(currentUser)}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  showToast('Signed out of previous session', 'info');
                }}
                className="rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Role Switcher Segmented Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Role selector">
          {(['trainee', 'trainer', 'admin'] as Role[]).map((r) => {
            const isCurrent = activeRole === r;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => handleRoleSelect(r)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all capitalize cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Role Header */}
        <div className="text-center space-y-2">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${
              activeRole === 'trainee'
                ? 'bg-teal-600 text-white'
                : activeRole === 'trainer'
                ? 'bg-blue-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {meta.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {meta.description}
          </p>
        </div>

        {/* Role Mismatch Notice Box */}
        {roleMismatch && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs dark:border-amber-900/60 dark:bg-amber-950/30 space-y-2">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p>{roleMismatch.message}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-normal mt-0.5">
                  Your credentials are valid, but cannot be used on the {activeRole} sign-in tab.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const newRole = roleMismatch.detectedRole;
                setSearchParams({ role: newRole });
                setRoleMismatch(null);
                // Keep the email that was entered
              }}
              className="w-full rounded-xl bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              Switch to {roleMismatch.detectedRole.toUpperCase()} sign in
            </button>
          </div>
        )}

        {/* Credentials Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  {...register('email')}
                  placeholder="name.demo@capacityconnect.demo"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(currentEmail || '');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-teal-600 hover:underline dark:text-teal-400 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-10 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <label htmlFor="remember-me" className="text-xs text-slate-600 dark:text-slate-400">
                Remember this session
              </label>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl py-2.5 text-xs sm:text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all focus-ring ${
                activeRole === 'trainee'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : activeRole === 'trainer'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? 'Authenticating...' : `Sign in as ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}`}
            </button>
          </form>

          {/* Under-form context */}
          <div className="mt-5 border-t pt-4 text-center text-xs text-slate-500 dark:border-slate-800">
            {activeRole === 'trainee' && (
              <span>
                New here?{' '}
                <Link
                  to="/register/trainee"
                  className="font-semibold text-teal-600 hover:underline dark:text-teal-400"
                >
                  Register as a trainee
                </Link>
              </span>
            )}
            {activeRole === 'trainer' && (
              <span>
                New here?{' '}
                <Link
                  to="/register/trainer"
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Register as a trainer
                </Link>
              </span>
            )}
            {activeRole === 'admin' && (
              <span className="text-[11px] text-slate-400">
                Administrator accounts are created by the platform owner.
              </span>
            )}
          </div>
        </div>

        {/* Demo Credentials Hint */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Demo accounts accept any password.
            </span>{' '}
            Registered accounts check real cryptographic credentials.
          </p>
        </div>
      </div>

      {/* Forgot Password Working Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password (Demo)"
        subtitle="Password recovery simulation for prototype evaluation"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            In this demonstration prototype, entering your registered demo email will generate an immediate simulated reset notification.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1">Enter your email</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. trainee.demo@capacityconnect.demo"
              className="w-full rounded-lg border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!forgotEmail) {
                  showToast('Please enter an email address', 'warning');
                  return;
                }
                showToast(`Simulated reset link dispatched for ${forgotEmail}`, 'success');
                setIsForgotModalOpen(false);
                setForgotEmail('');
              }}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Send Demo Reset Link
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
