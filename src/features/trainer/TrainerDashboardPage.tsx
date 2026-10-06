import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Users,
  Layers,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Course, Enrollment, Assessment, TrainerProfile } from '../../domain/types';
import { courseService, enrollmentService, assessmentService, userService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TrainerDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    Promise.all([
      courseService.getCourses(),
      enrollmentService.getEnrollments(),
      assessmentService.getAssessments(),
      userService.getTrainerProfile(currentUser.id),
    ]).then(([allCourses, allEnrs, allAssess, prof]) => {
      // Filter to courses assigned to this trainer
      const myCourses = allCourses.filter((c) => c.trainerId === currentUser.id);
      setCourses(myCourses);

      const myCourseIds = new Set(myCourses.map((c) => c.id));
      setEnrollments(allEnrs.filter((e) => myCourseIds.has(e.courseId)));
      setAssessments(allAssess.filter((a) => myCourseIds.has(a.courseId)));
      setTrainerProfile(prof);
      setLoading(false);
    });
  }, [currentUser]);

  // Aggregate stats
  const activeCohortsCount = courses.filter((c) => c.status === 'published' || c.status === 'in_progress').length;
  const totalTrainees = enrollments.length;
  const avgAttendance =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + e.attendancePct, 0) / enrollments.length)
      : 0;

  // Low participation alerts (attendance < 70%)
  const lowParticipationTrainees = enrollments.filter(
    (e) => e.status === 'enrolled' && e.attendancePct < 70
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-xs font-bold uppercase">
              Trainer Faculty Workspace
            </span>
            <span className="text-xs text-slate-400">Meteorological Training Institute</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-500">
            {trainerProfile?.subjects.join(', ') || 'Specialist Disciplines'} • {courses.length} Assigned Modules
          </p>
        </div>

        {/* Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            to="/trainer/courses"
            className="rounded-xl bg-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-700"
          >
            Create Course Module
          </Link>
          <Link
            to="/trainer/library"
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Resource</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Modules</span>
            <BookOpen className="h-5 w-5 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{courses.length}</div>
          <p className="mt-1 text-[11px] text-slate-400">{activeCohortsCount} active cohorts running</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Enrolled Trainees</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalTrainees}</div>
          <p className="mt-1 text-[11px] text-slate-400">Across Pune, Delhi, Kolkata, Chennai</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cohort Average Attendance</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{avgAttendance}%</div>
          <p className="mt-1 text-[11px] text-slate-400">75% required for module certification</p>
        </div>
      </div>

      {/* Low participation alert box */}
      {lowParticipationTrainees.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              Low Attendance Flag ({lowParticipationTrainees.length} Trainees)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Several enrolled participants have attendance below the 70% threshold. Review individual cohort records to provide remedial training guidance before assessment deadlines.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: My Courses & Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assigned Course Cohorts</h2>
            <Link
              to="/trainer/courses"
              className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
            >
              Manage Courses
            </Link>
          </div>

          {courses.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-xs text-slate-400">
              No courses assigned yet. You can author a new course and submit it for administrative review.
            </p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const courseEnrs = enrollments.filter((e) => e.courseId === course.id);
                return (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase text-teal-600">
                          {course.subject}
                        </span>
                        <StatusBadge status={course.status} size="sm" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{course.title}</h3>
                      <p className="text-xs text-slate-500">
                        {courseEnrs.length} / {course.capacity} Enrolled • Mode: {course.deliveryMode}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/trainer/courses/${course.id}/cohort`}
                        className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                      >
                        Cohort Table
                      </Link>
                      <Link
                        to={`/courses/${course.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      >
                        Preview Course
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Assessment Builder Shortcuts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Questionnaires</h2>
            <Link
              to="/trainer/assessments"
              className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
            >
              Build New
            </Link>
          </div>

          <div className="space-y-3">
            {assessments.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-xs text-slate-400">
                No questionnaires authored yet.
              </p>
            ) : (
              assessments.map((ass) => (
                <div
                  key={ass.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ass.title}
                    </span>
                    <StatusBadge status={ass.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500">
                    {ass.questions.length} Questions • Due {formatDate(ass.deadline)}
                  </p>
                  <Link
                    to="/trainer/assessments"
                    className="block text-center rounded-lg bg-slate-100 dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    View Item Analysis
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
