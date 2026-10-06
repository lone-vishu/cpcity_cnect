import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Course, Enrollment, Assessment, Competency, TraineeProfile } from '../../domain/types';
import {
  courseService,
  enrollmentService,
  assessmentService,
  competencyService,
  userService,
} from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

export const TraineeDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [traineeProfile, setTraineeProfile] = useState<TraineeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [enrs, allCourses, allAssess, allComps, prof] = await Promise.all([
          enrollmentService.getEnrollmentsByTrainee(currentUser.id),
          courseService.getCourses(),
          assessmentService.getAssessments(),
          competencyService.getCompetencies(),
          userService.getTraineeProfile(currentUser.id),
        ]);
        setEnrollments(enrs);
        setCourses(allCourses);
        setAssessments(allAssess);
        setCompetencies(allComps);
        setTraineeProfile(prof);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [currentUser]);

  // Enrolled courses map
  const myEnrolledCourses = enrollments
    .map((e) => {
      const course = courses.find((c) => c.id === e.courseId);
      return { enrollment: e, course };
    })
    .filter((item): item is { enrollment: Enrollment; course: Course } => item.course !== undefined);

  // In progress vs completed
  const inProgressCourses = myEnrolledCourses.filter((item) => item.enrollment.status === 'enrolled');
  const completedCourses = myEnrolledCourses.filter((item) => item.enrollment.status === 'completed');

  // Competency coverage computation:
  // Identify competencies covered by trainee's completed courses
  const completedCompIds = new Set<string>();
  completedCourses.forEach((item) => {
    item.course.competencyIds.forEach((id) => completedCompIds.add(id));
  });

  // Recommended courses based on Competency Coverage:
  // Courses covering competencies the trainee doesn't have yet, prioritizing their interests/profile
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const recommendedCourses = courses
    .filter((c) => (c.status === 'published' || c.status === 'in_progress') && !enrolledCourseIds.has(c.id))
    .map((course) => {
      // Score recommendation by how many new competencies it teaches matching trainee interests
      const newComps = course.competencyIds.filter((cid) => !completedCompIds.has(cid));
      const matchesInterest = traineeProfile?.interests.some((interest) =>
        course.subject.toLowerCase().includes(interest.toLowerCase())
      ) ? 2 : 0;
      return {
        course,
        newCompsCount: newComps.length,
        recScore: newComps.length + matchesInterest,
      };
    })
    .sort((a, b) => b.recScore - a.recScore)
    .slice(0, 3)
    .map((item) => item.course);

  // Upcoming assessment deadlines
  const myCourseIds = new Set(myEnrolledCourses.map((item) => item.course.id));
  const upcomingAssessments = assessments
    .filter((a) => myCourseIds.has(a.courseId) && a.status === 'published')
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 px-2 py-0.5 text-xs font-bold uppercase">
              Trainee Workspace
            </span>
            <span className="text-xs text-slate-400">IMD Training Directorate</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-500">
            {traineeProfile?.designation || 'Operational Staff'} • {enrollments.length} Total Enrolled Modules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/courses"
            className="rounded-xl bg-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-700 focus-ring"
          >
            Browse Catalogue
          </Link>
          <Link
            to="/trainee/profile"
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            My Profile
          </Link>
        </div>
      </div>

      {/* Competency Coverage Indicator Card */}
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white dark:from-teal-950/30 dark:to-slate-900 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              <TrendingUp className="h-4 w-4" />
              <span>Competency Coverage Progress</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {completedCompIds.size} of {competencies.length} Curated WMO Meteorological Competencies Covered
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              Capacity Connect tracks your individual learning journey against documented domain competencies. Completing courses unlocks recognized qualification milestones.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {Math.round((completedCompIds.size / (competencies.length || 1)) * 100)}%
              </div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Coverage Ratio</div>
            </div>
            <div className="w-32 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((completedCompIds.size / (competencies.length || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: In Progress Courses + Upcoming Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Courses in Progress</h2>
            <Link
              to="/trainee/my-courses"
              className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
            >
              View All ({inProgressCourses.length})
            </Link>
          </div>

          {inProgressCourses.length === 0 ? (
            <EmptyState
              title="No courses currently in progress"
              description="Browse the course catalogue to discover and enroll in accredited training programs."
              actionText="Explore Catalogue"
              onAction={() => navigate('/courses')}
            />
          ) : (
            <div className="space-y-4">
              {inProgressCourses.map(({ course, enrollment }) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      {course.subject}
                    </span>
                    <StatusBadge status={course.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{course.title}</h3>

                  {/* Attendance & progress bar */}
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

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Enrolled: {formatDate(enrollment.enrolledAt)}
                    </span>
                    <Link
                      to={`/courses/${course.id}`}
                      className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                    >
                      Continue Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Upcoming Assessments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pending Assessments</h2>
            <Link
              to="/trainee/assessments"
              className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
            >
              All Assessments
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-xs text-slate-400">
                No pending assessments due.
              </p>
            ) : (
              upcomingAssessments.map((ass) => (
                <div
                  key={ass.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{ass.title}</span>
                    <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Due {formatDate(ass.deadline)}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {ass.questions.length} Questions • {ass.durationMin} minutes duration
                  </p>
                  <Link
                    to={`/assessments/${ass.id}`}
                    className="block w-full text-center rounded-lg bg-teal-600 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                  >
                    Start Assessment
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recommended Courses based on Competency Coverage */}
      <div className="space-y-4 pt-4 border-t dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recommended for Competency Expansion
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Suggested courses based on your profile interests and uncovered WMO competencies.
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
          >
            View Catalogue
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommendedCourses.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-teal-600">{c.subject}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{c.objectives[0]}</p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <span className="text-[11px] text-slate-400 capitalize">{c.deliveryMode}</span>
                <Link
                  to={`/courses/${c.id}`}
                  className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
