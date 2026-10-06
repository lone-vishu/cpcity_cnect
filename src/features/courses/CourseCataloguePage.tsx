import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Building,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Course, Enrollment, Competency } from '../../domain/types';
import { courseService, enrollmentService, competencyService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';
import { EmptyState } from '../../components/common/EmptyState';

export const CourseCataloguePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCentre, setSelectedCentre] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { currentUser, currentRole } = useAuth();
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCourses, allComps, allEnrs] = await Promise.all([
        courseService.getCourses(),
        competencyService.getCompetencies(),
        currentUser ? enrollmentService.getEnrollmentsByTrainee(currentUser.id) : Promise.resolve([]),
      ]);
      setCourses(allCourses);
      setCompetencies(allComps);
      setEnrollments(allEnrs);
    } catch (e: any) {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = course.title.toLowerCase().includes(q);
      const matchSubject = course.subject.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject) return false;
    }
    if (selectedSubject !== 'all' && course.subject !== selectedSubject) return false;
    if (selectedCentre !== 'all' && course.centreId !== selectedCentre) return false;
    if (selectedMode !== 'all' && course.deliveryMode !== selectedMode) return false;
    return true;
  });

  // Get distinct subjects
  const subjects = Array.from(new Set(courses.map((c) => c.subject)));

  const handleEnroll = async (course: Course) => {
    if (!currentUser) {
      showToast('Please sign in to enroll in courses', 'warning');
      return;
    }
    try {
      const result = await enrollmentService.enrollInCourse(currentUser.id, course.id);
      showToast(
        result.status === 'waitlisted'
          ? `Course is at capacity. You are placed on the waitlist.`
          : `Successfully enrolled in ${course.title}!`,
        result.status === 'waitlisted' ? 'warning' : 'success'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Enrollment failed', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Meteorological Training Course Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Accredited programs across specialized forecasting, radar metrology, cyclone tracking, and NWP modeling.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 ${
                viewMode === 'grid'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 ${
                viewMode === 'list'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses or keywords..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Subject filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Subjects ({subjects.length})</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        {/* Centre filter */}
        <select
          value={selectedCentre}
          onChange={(e) => setSelectedCentre(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Training Centres</option>
          {APP_CONFIG.centres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Mode filter */}
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Delivery Modes</option>
          <option value="in_person">In-Person Only</option>
          <option value="online">Online Virtual</option>
          <option value="blended">Blended Learning</option>
        </select>
      </div>

      {/* Course List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="No courses match your filter criteria"
          description="Try clearing your search query or selecting 'All' in the filter dropdowns."
          actionText="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedSubject('all');
            setSelectedCentre('all');
            setSelectedMode('all');
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const userEnrollment = enrollments.find((e) => e.courseId === course.id);
            const centre = APP_CONFIG.centres.find((c) => c.id === course.centreId);

            return (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      {course.subject}
                    </span>
                    <StatusBadge status={course.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {course.objectives[0] || 'Comprehensive meteorological training curriculum.'}
                  </p>

                  {/* Metadata pills */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>{centre?.name || 'Regional Centre'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(course.startDate)} – {formatDate(course.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="capitalize">{course.deliveryMode.replace('_', ' ')} • Cap: {course.capacity}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {userEnrollment ? (
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 capitalize flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{userEnrollment.status}</span>
                    </span>
                  ) : currentRole === 'trainee' && (course.status === 'published' || course.status === 'in_progress') ? (
                    <button
                      onClick={() => handleEnroll(course)}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 shadow-2xs transition-colors focus-ring"
                    >
                      Enroll Now
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          {filteredCourses.map((course) => {
            const userEnrollment = enrollments.find((e) => e.courseId === course.id);
            const centre = APP_CONFIG.centres.find((c) => c.id === course.centreId);

            return (
              <div
                key={course.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase text-teal-600 dark:text-teal-400">
                      {course.subject}
                    </span>
                    <StatusBadge status={course.status} size="sm" />
                    <span className="text-xs text-slate-400 capitalize">• {course.deliveryMode.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{course.objectives[0]}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs text-slate-400 hidden lg:block">
                    <div>{centre?.code}</div>
                    <div>{formatDate(course.startDate)}</div>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    View Details
                  </Link>
                  {currentRole === 'trainee' && !userEnrollment && (
                    <button
                      onClick={() => handleEnroll(course)}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
