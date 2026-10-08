import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Bell,
  Search,
  GraduationCap,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { Course, Announcement } from '../../domain/types';
import { courseService, announcementService, systemService } from '../../services';
import { APP_CONFIG } from '../../config/app.config';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../auth/AuthContext';
import { resolvePostLoginRoute } from '../../domain/workflow/stateMachines';
import { useToast } from '../../components/common/Toast';

export const HomePage: React.FC = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const { currentUser, currentRole, switchRole, loginAs, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    courseService.getCourses().then((courses) => {
      setFeaturedCourses(courses.filter((c) => c.status === 'published').slice(0, 3));
    });
    announcementService.getAnnouncements().then((anns) => {
      setLatestAnnouncements(anns.slice(0, 4));
    });
  }, []);

  const handleResetData = async () => {
    if (confirm('Reset entire system data back to the initial synthetic demonstration seed?')) {
      await systemService.resetDatabase();
      logout();
      showToast('System data and session reset successfully', 'success');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white font-black shadow-sm">
            CC
          </div>
          <div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
              Capacity<span className="text-teal-600 dark:text-teal-400">Connect</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Course Catalogue
          </Link>
          <Link
            to="/announcements"
            className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Announcements
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-xs text-slate-500 dark:text-slate-400">
                Active: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.role})
              </span>
              <Link
                to={resolvePostLoginRoute(currentUser)}
                className="rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  showToast('Signed out of session', 'info');
                }}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                Sign in
              </Link>
              <Link
                to="/register/trainee"
                className="hidden sm:inline-block rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-navy-900 to-teal-950 p-8 sm:p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-400/30 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Digital Capacity Building & Learning Management Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Connecting Meteorological Competencies, Specialized Trainers & Operational Learners.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            A unified digital capacity-building and learning management portal tailored for the India Meteorological Department training workflow. Featuring explainable, rules-based trainer matching and reviewable competency evidence.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {currentUser ? (
              <>
                <Link
                  to={resolvePostLoginRoute(currentUser)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-teal-400 transition-all hover:scale-105 focus-ring"
                >
                  <span>Go to {currentUser.role.toUpperCase()} Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all focus-ring backdrop-blur-xs"
                >
                  <span>Sign in as Different User</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    showToast('Signed out of session', 'info');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold text-rose-300 hover:bg-white/15 transition-all focus-ring backdrop-blur-xs cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-teal-400 transition-all hover:scale-105 focus-ring"
                >
                  <span>Explore Course Catalogue</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all focus-ring backdrop-blur-xs"
                >
                  <span>Sign In / Demo Accounts</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Demo Jump Notice */}
          <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              All personnel, records, and competencies shown in this prototype are synthetic demonstration data.
            </span>
          </div>
        </div>

        {/* Decorative Grid Pattern */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* Role Workflows ("How it works") */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Designed for IMD’s Operational Triad
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Dedicated role-aware workspaces connecting training needs from specification to outcome.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Trainee Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operational Trainee</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Discover accredited courses, track competency coverage against career goals, attempt MCQ assessments, and download watermarked demo completion certificates.
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>State-aware enrollment & waitlisting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Interactive MCQ examination engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Personalized competency gap alerts</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Link
                to="/login?role=trainee"
                className="flex-1 text-center rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors focus-ring shadow-xs"
              >
                Sign in
              </Link>
              <Link
                to="/register/trainee"
                className="flex-1 text-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors focus-ring"
              >
                Register
              </Link>
            </div>
          </div>

          {/* 2. Trainer Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Specialist Trainer</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Maintain verified competency credentials, manage training cohorts across Pune, Delhi, Kolkata, & Chennai, upload lecture media, and author questionnaires.
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Competency evidence submission & audit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Trainer library with visibility controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Cohort attendance & item analysis</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Link
                to="/login?role=trainer"
                className="flex-1 text-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors focus-ring shadow-xs"
              >
                Sign in
              </Link>
              <Link
                to="/register/trainer"
                className="flex-1 text-center rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors focus-ring"
              >
                Register
              </Link>
            </div>
          </div>

          {/* 3. Admin Card */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-6 shadow-sm hover:shadow-md transition-shadow dark:border-teal-900/60 dark:bg-teal-950/20 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Training Administrator</h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  Differentiator
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Execute explainable trainer matching against course needs with factor breakdowns, review unverified evidence, approve cohorts, and inspect immutable audit logs.
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Deterministic matching with adjustable weights</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Side-by-side trainer comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                  <span>Full approval queues & CSV export</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 space-y-2">
              <Link
                to="/login?role=admin"
                className="block w-full text-center rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 shadow-sm transition-colors focus-ring"
              >
                Sign in
              </Link>
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                Admin accounts are provisioned by the platform owner.
              </p>
            </div>
          </div>
        </div>

        {/* Presenter Demo Quick Access Panel */}
        {APP_CONFIG.featureFlags.enableDemoQuickAccess && (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 mr-2">
                    Demo quick access
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">
                    One-click presenter logins for evaluation (bypasses credentials)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoAccess((v) => !v)}
                className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline text-left sm:text-right cursor-pointer"
              >
                {showDemoAccess ? '▲ Collapse demo access' : '▼ Expand demo logins'}
              </button>
            </div>

            {showDemoAccess && (
              <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-amber-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await loginAs('trainee');
                    navigate('/trainee/dashboard');
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Demo Trainee (Anita Sharma)</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loginAs('trainer');
                    navigate('/trainer/dashboard');
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Demo Trainer (Dr. Rajesh Kumar)</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loginAs('admin');
                    navigate('/admin/dashboard');
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Demo Admin (Dr. Sunita Kulkarni)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Featured Courses Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Featured Training Modules
            </h2>
            <p className="text-xs text-slate-500">
              Accredited courses currently open for enrollment across regional centres.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    {course.subject}
                  </span>
                  <StatusBadge status={course.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {course.objectives[0] || 'Comprehensive meteorological training module.'}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                  <span className="capitalize">{course.deliveryMode.replace('_', ' ')}</span>
                  <span>Cap: {course.capacity} Trainees</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Starts {formatDate(course.startDate)}</span>
                <Link
                  to={`/courses/${course.id}`}
                  className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Announcements & Achievements Feed */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Latest Notices, Announcements & Achievements
            </h3>
          </div>
          <Link
            to="/announcements"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            All Announcements ({latestAnnouncements.length})
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {latestAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-800/40 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  {ann.type.replace('_', ' ')}
                </span>
                <span className="text-slate-400">{formatDate(ann.publishedAt)}</span>
              </div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{ann.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
