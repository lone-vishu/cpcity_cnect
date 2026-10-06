import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  Award,
  Video,
  FileText,
} from 'lucide-react';
import { Course, Enrollment, Resource } from '../../domain/types';
import { courseService, enrollmentService, resourceService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export const MyLearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'completed' | 'waitlisted'>('enrolled');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      enrollmentService.getEnrollmentsByTrainee(currentUser.id),
      courseService.getCourses(),
    ]).then(([enrs, allCourses]) => {
      setEnrollments(enrs);
      setCourses(allCourses);
      setLoading(false);
    });
  }, [currentUser]);

  const items = enrollments
    .filter((e) => e.status === activeTab)
    .map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return { enrollment: e, course };
    })
    .filter((item): item is { enrollment: Enrollment; course: Course } => item.course !== undefined);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Learning Workspace</h1>
        <p className="text-xs text-slate-500">
          Track course progress, access learning materials, and view completed certifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['enrolled', 'completed', 'waitlisted'] as const).map((tab) => {
          const count = enrollments.filter((e) => e.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-5 text-xs sm:text-sm font-semibold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'enrolled' ? 'In Progress' : tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Course List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={`No courses under '${activeTab === 'enrolled' ? 'In Progress' : activeTab}'`}
          description="Enroll in open courses from the catalogue to begin your learning milestones."
          actionText="Browse Course Catalogue"
          onAction={() => navigate('/courses')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(({ course, enrollment }) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                    {course.subject}
                  </span>
                  <StatusBadge status={enrollment.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{course.title}</h3>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Attendance & Participation</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {enrollment.attendancePct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${enrollment.attendancePct}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Enrolled: {formatDate(enrollment.enrolledAt)}
                  {enrollment.completedAt && ` • Completed: ${formatDate(enrollment.completedAt)}`}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to={`/courses/${course.id}`}
                  className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1"
                >
                  <span>Open Course Room</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                {enrollment.status === 'completed' && (
                  <Link
                    to="/certificates"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <Award className="h-4 w-4" />
                    <span>View Certificate</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
