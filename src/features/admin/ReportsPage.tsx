import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Printer,
  Filter,
  BarChart3,
  Users,
  Award,
  BookOpen,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import {
  courseService,
  enrollmentService,
  assessmentService,
  userService,
  competencyService,
} from '../../services';
import { Course, Enrollment, Assessment, Attempt, User, Competency } from '../../domain/types';
import { exportToCsv, formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';
import { showToast } from '../../components/common/Toast';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'enrollment_completion' | 'centre_participation' | 'assessment_performance' | 'trainer_load' | 'competency_gaps'
  >('enrollment_completion');

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);

  // Filter states
  const [selectedCentre, setSelectedCentre] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const loadAllReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [cList, eList, aList, attList, uList, compList] = await Promise.all([
        courseService.getCourses(),
        enrollmentService.getEnrollments(),
        assessmentService.getAssessments(),
        assessmentService.getAttempts(),
        userService.getUsers(),
        competencyService.getCompetencies(),
      ]);
      setCourses(cList);
      setEnrollments(eList);
      setAssessments(aList);
      setAttempts(attList);
      setUsers(uList);
      setCompetencies(compList);
    } catch (err) {
      console.error('Failed to load report data:', err);
      showToast({ title: 'Error', message: 'Failed to load report analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllReportData();
  }, [loadAllReportData]);

  const getCentreName = (centreId: string) => {
    return APP_CONFIG.centres.find((c) => c.id === centreId)?.name || centreId;
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || userId;
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || courseId;
  };

  // 1. Enrollment & Completion Data
  const getEnrollmentData = () => {
    return courses
      .filter((c) => selectedCentre === 'all' || c.centreId === selectedCentre)
      .map((c) => {
        const courseEnrollments = enrollments.filter((e) => e.courseId === c.id);
        const enrolled = courseEnrollments.filter((e) => e.status === 'enrolled').length;
        const completed = courseEnrollments.filter((e) => e.status === 'completed').length;
        const waitlisted = courseEnrollments.filter((e) => e.status === 'waitlisted').length;
        const total = courseEnrollments.length;
        const compRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          id: c.id,
          title: c.title,
          centre: getCentreName(c.centreId),
          mode: c.deliveryMode,
          capacity: c.capacity,
          enrolled,
          completed,
          waitlisted,
          completionRate: `${compRate}%`,
        };
      });
  };

  // 2. Centre Participation Data
  const getCentreParticipationData = () => {
    return APP_CONFIG.centres.map((centre) => {
      const centreCourses = courses.filter((c) => c.centreId === centre.id);
      const centreCourseIds = centreCourses.map((c) => c.id);
      const centreEnrollments = enrollments.filter((e) => centreCourseIds.includes(e.courseId));
      const traineesInCentre = users.filter((u) => u.centreId === centre.id && u.role === 'trainee').length;
      const completedCount = centreEnrollments.filter((e) => e.status === 'completed').length;
      const avgAttendance =
        centreEnrollments.length > 0
          ? Math.round(
              centreEnrollments.reduce((acc, curr) => acc + curr.attendancePct, 0) /
                centreEnrollments.length
            )
          : 0;

      return {
        centre: centre.name,
        activeCourses: centreCourses.length,
        registeredTrainees: traineesInCentre,
        totalEnrollments: centreEnrollments.length,
        graduations: completedCount,
        averageAttendance: `${avgAttendance}%`,
      };
    });
  };

  // 3. Assessment Performance Data
  const getAssessmentPerformanceData = () => {
    return assessments
      .filter((a) => selectedCourse === 'all' || a.courseId === selectedCourse)
      .map((a) => {
        const itemAttempts = attempts.filter((att) => att.assessmentId === a.id);
        const avgScore =
          itemAttempts.length > 0
            ? Math.round(itemAttempts.reduce((acc, curr) => acc + curr.score, 0) / itemAttempts.length)
            : 0;
        const passCount = itemAttempts.filter((att) => att.score >= 60).length;
        const passRate = itemAttempts.length > 0 ? Math.round((passCount / itemAttempts.length) * 100) : 0;

        return {
          assessmentTitle: a.title,
          course: getCourseTitle(a.courseId),
          totalQuestions: a.questions.length,
          attemptsCount: itemAttempts.length,
          averageScore: `${avgScore}%`,
          passRate: `${passRate}%`,
          status: a.status,
        };
      });
  };

  // 4. Trainer Load Data
  const getTrainerLoadData = () => {
    const trainers = users.filter((u) => u.role === 'trainer');
    return trainers.map((t) => {
      const assignedCourses = courses.filter((c) => c.trainerId === t.id);
      const activeCourses = assignedCourses.filter((c) => c.status === 'in_progress' || c.status === 'published');
      const completedCourses = assignedCourses.filter((c) => c.status === 'completed');
      const totalStudents = enrollments.filter((e) =>
        assignedCourses.map((c) => c.id).includes(e.courseId)
      ).length;

      return {
        name: t.name,
        email: t.email,
        centre: getCentreName(t.centreId),
        totalAssignedCourses: assignedCourses.length,
        activeBatches: activeCourses.length,
        completedBatches: completedCourses.length,
        trainedLearners: totalStudents,
      };
    });
  };

  // 5. Competency Gaps Data
  const getCompetencyGapData = () => {
    return competencies.map((comp) => {
      const coursesCovering = courses.filter((c) => c.competencyIds?.includes(comp.id)).length;
      return {
        competency: comp.name,
        domain: comp.domain,
        level: `Level ${comp.level}`,
        curriculumCoverage: coursesCovering > 0 ? `${coursesCovering} Course(s)` : 'Coverage Gap (0)',
        status: coursesCovering > 0 ? 'Adequately Covered' : 'Curriculum Deficit',
        governanceStatus: comp.reviewStatus,
      };
    });
  };

  const handleExportCsv = () => {
    let data: any[] = [];
    let filename = `capacity_connect_report_${activeTab}`;

    if (activeTab === 'enrollment_completion') {
      data = getEnrollmentData();
    } else if (activeTab === 'centre_participation') {
      data = getCentreParticipationData();
    } else if (activeTab === 'assessment_performance') {
      data = getAssessmentPerformanceData();
    } else if (activeTab === 'trainer_load') {
      data = getTrainerLoadData();
    } else if (activeTab === 'competency_gaps') {
      data = getCompetencyGapData();
    }

    if (data.length === 0) {
      showToast({ title: 'No Data', message: 'No records to export in current selection', type: 'warning' });
      return;
    }

    exportToCsv(data, filename);
    showToast({ title: 'Report Exported', message: `Downloaded ${filename}.csv`, type: 'success' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
              Institutional Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Audit Ready • Filterable
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Standard Reports & Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Comprehensive operational metrics across regional training centres, assessment benchmarks, and faculty allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-500" />
            Print Report
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Synthetic Data Label */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
        <Info className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          <strong>Synthetic Benchmark Data:</strong> All statistical aggregations are computed directly from the seeded prototype repository. No live institutional connection is claimed.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('enrollment_completion')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'enrollment_completion'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Enrollment & Completion
        </button>

        <button
          onClick={() => setActiveTab('centre_participation')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'centre_participation'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Participation by Centre
        </button>

        <button
          onClick={() => setActiveTab('assessment_performance')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'assessment_performance'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Assessment Performance
        </button>

        <button
          onClick={() => setActiveTab('trainer_load')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'trainer_load'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trainer Utilization
        </button>

        <button
          onClick={() => setActiveTab('competency_gaps')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'competency_gaps'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Competency Coverage Gaps
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Filter By:</span>
        </div>

        <select
          value={selectedCentre}
          onChange={(e) => setSelectedCentre(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Regional Centres</option>
          {APP_CONFIG.centres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {activeTab === 'assessment_performance' && (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tab 1: Enrollment & Completion Table */}
      {activeTab === 'enrollment_completion' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Course Title</th>
                <th className="p-4">Regional Centre</th>
                <th className="p-4">Delivery Mode</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Enrolled</th>
                <th className="p-4">Waitlist</th>
                <th className="p-4">Completed</th>
                <th className="p-4">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {getEnrollmentData().map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{row.title}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.centre}</td>
                  <td className="p-4 capitalize text-slate-600 dark:text-slate-300">{row.mode.replace('_', ' ')}</td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{row.capacity}</td>
                  <td className="p-4 font-mono text-teal-600 font-semibold">{row.enrolled}</td>
                  <td className="p-4 font-mono text-amber-600">{row.waitlisted}</td>
                  <td className="p-4 font-mono text-emerald-600 font-semibold">{row.completed}</td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{row.completionRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Centre Participation */}
      {activeTab === 'centre_participation' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Regional Centre</th>
                <th className="p-4">Active Batches</th>
                <th className="p-4">Registered Personnel</th>
                <th className="p-4">Total Course Seats</th>
                <th className="p-4">Certifications Issued</th>
                <th className="p-4">Average Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {getCentreParticipationData().map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    {row.centre}
                  </td>
                  <td className="p-4 font-mono">{row.activeCourses}</td>
                  <td className="p-4 font-mono">{row.registeredTrainees}</td>
                  <td className="p-4 font-mono text-teal-600 font-semibold">{row.totalEnrollments}</td>
                  <td className="p-4 font-mono text-emerald-600 font-semibold">{row.graduations}</td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{row.averageAttendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Assessment Performance */}
      {activeTab === 'assessment_performance' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Assessment Title</th>
                <th className="p-4">Course Module</th>
                <th className="p-4">MCQ Items</th>
                <th className="p-4">Submissions</th>
                <th className="p-4">Cohort Average</th>
                <th className="p-4">Pass Rate (&ge;60%)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {getAssessmentPerformanceData().map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{row.assessmentTitle}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.course}</td>
                  <td className="p-4 font-mono">{row.totalQuestions}</td>
                  <td className="p-4 font-mono">{row.attemptsCount}</td>
                  <td className="p-4 font-mono font-bold text-teal-600">{row.averageScore}</td>
                  <td className="p-4 font-mono font-semibold text-emerald-600">{row.passRate}</td>
                  <td className="p-4 capitalize text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Trainer Load */}
      {activeTab === 'trainer_load' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Faculty Member</th>
                <th className="p-4">Base Centre</th>
                <th className="p-4">Total Assigned</th>
                <th className="p-4">Active Batches</th>
                <th className="p-4">Concluded Batches</th>
                <th className="p-4">Total Learners Mentored</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {getTrainerLoadData().map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{row.email}</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.centre}</td>
                  <td className="p-4 font-mono">{row.totalAssignedCourses}</td>
                  <td className="p-4 font-mono font-semibold text-teal-600">{row.activeBatches}</td>
                  <td className="p-4 font-mono text-emerald-600">{row.completedBatches}</td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{row.trainedLearners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Competency Coverage Gaps */}
      {activeTab === 'competency_gaps' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Competency Name</th>
                <th className="p-4">Meteorological Domain</th>
                <th className="p-4">Skill Level</th>
                <th className="p-4">Active Curriculum Mapping</th>
                <th className="p-4">Institutional Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {getCompetencyGapData().map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{row.competency}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{row.domain}</td>
                  <td className="p-4 font-mono text-xs">{row.level}</td>
                  <td className="p-4 font-mono">{row.curriculumCoverage}</td>
                  <td className="p-4">
                    {row.status === 'Adequately Covered' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Covered
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                        Curriculum Gap Detected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
