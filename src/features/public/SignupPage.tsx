import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Building, CheckCircle2, Clock } from 'lucide-react';
import { SignupSchema, SignupFormData } from '../../domain/schemas';
import { userService } from '../../services';
import { APP_CONFIG } from '../../config/app.config';
import { useToast } from '../../components/common/Toast';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      role: 'trainee',
      centreId: 'centre-pune',
    },
  });

  const passwordValue = watch('password', '');

  // Calculate password strength (0-100)
  const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pwd)) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 50) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 75) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculateStrength(passwordValue);

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      await userService.registerUser({
        name: data.name,
        email: data.email,
        role: data.role,
        centreId: data.centreId,
        status: 'pending', // Pending admin approval
      });
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      showToast('Registration submitted for administrative review', 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center shadow-lg dark:border-amber-900/50 dark:bg-amber-950/20 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Registration Awaiting Admin Approval
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Your demo account for <strong className="text-slate-800 dark:text-slate-200">{submittedEmail}</strong> has been created with status <span className="font-semibold text-amber-700">pending</span>.
          </p>
          <div className="rounded-xl bg-white p-3 text-left text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            💡 <strong>Evaluation Tip:</strong> You can switch to the <strong>Admin</strong> demo account via the top role switcher to inspect and approve this registration in <em>User Management &gt; Approval Queue</em>!
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full rounded-xl bg-teal-600 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-xs text-slate-500">
            Register as a Trainee or Trainer in the Capacity Connect demo portal.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Radio Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer hover:border-teal-500 transition-colors has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50/40 dark:has-[:checked]:bg-teal-950/20">
                  <input
                    type="radio"
                    value="trainee"
                    {...register('role')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Trainee</span>
                    <span className="text-[10px] text-slate-500">Operational staff</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer hover:border-teal-500 transition-colors has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50/40 dark:has-[:checked]:bg-teal-950/20">
                  <input
                    type="radio"
                    value="trainer"
                    {...register('role')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Trainer</span>
                    <span className="text-[10px] text-slate-500">Specialist faculty</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Demo Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name.demo@capacityconnect.demo"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            {/* Centre selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Training Centre / Posting
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  {...register('centreId')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {APP_CONFIG.centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password + Strength Meter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Password strength meter */}
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 dark:bg-teal-600 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 dark:hover:bg-teal-700 disabled:opacity-50 transition-all focus-ring"
            >
              {isSubmitting ? 'Submitting Registration...' : 'Register Account'}
            </button>
          </form>

          <div className="mt-4 border-t pt-4 text-center text-xs text-slate-500 dark:border-slate-800">
            Already have a login?{' '}
            <Link to="/login" className="font-semibold text-teal-600 hover:underline dark:text-teal-400">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
