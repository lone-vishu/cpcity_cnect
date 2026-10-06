import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  TrendingUp,
  Download,
  Printer,
  Sparkles,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { User, Course, Enrollment, Certificate, Assessment, Attempt, Competency } from '../../domain/types';
import {
  userService,
  courseService,
  enrollmentService,
  certificateService,
  assessmentService,
  competencyService,
} from '../../services';
import { APP_CONFIG } from '../../config/app.config';
import { exportToCsv } from '../../lib/utils';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);

  // Filter state
  const [selectedCentre, setSelectedCentre] = useState<string>('all');
  const [drillDownType, setDrillDownType] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      userService.getUsers(),
      courseService.getCourses(),
      enrollmentService.getEnrollments(),
      certificateService.getCertificates(),
      assessmentService.getAssessments(),
      assessmentService.getAttempts(),
      competencyService.getCompetencies(),
    ]).then(([u, c, e, certs, ass, att, comps]) => {
      setUsers(u);
      setCourses(c);
      setEnrollments(e);
      setCertificates(certs);
      setAssessments(ass);
      setAttempts(att);
      setCompetencies(comps);
    });
  }, []);

  // Filtered cohorts based on centre
  const filteredUsers = users.filter((u) => selectedCentre === 'all' || u.centreId === selectedCentre);
  const filteredCourses = courses.filter((c) => selectedCentre === 'all' || c.centreId === selectedCentre);
  const pendingUsersCount = users.filter((u) => u.status === 'pending').length;
  const pendingCoursesCount = courses.filter((c) => c.status === 'pending_approval').length;
  const completedEnrollmentsCount = enrollments.filter((e) => e.status === 'completed').length;
  const avgAttendance =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + e.attendancePct, 0) / enrollments.length)
      : 0;

  // Chart data 1: Participation by Centre
  const centreData = APP_CONFIG.centres.map((centre) => {
    const centreUsers = users.filter((u) => u.centreId === centre.id);
    const centreCourses = courses.filter((c) => c.centreId === centre.id);
    return {
      name: centre.code,
      fullName: centre.name,
      personnel: centreUsers.length,
      courses: centreCourses.length,
    };
  });

  // Chart data 2: Enrollment by Subject
  const subjectMap = new Map<string, number>();
  courses.forEach((c) => {
    const count = enrollments.filter((e) => e.courseId === c.id).length;
    subjectMap.set(c.subject, (subjectMap.get(c.subject) || 0) + count);
  });
  const subjectData = Array.from(subjectMap.entries()).map(([name, count]) => ({
    name: name.replace(' Meteorology', '').replace(' Services', ''),
    enrollments: count,
  }));

  // Chart data 3: Score Distribution
  const scoreBuckets = [
    { range: '90-100%', count: attempts.filter((a) => a.score >= 90).length, fill: '#0d9488' },
    { range: '75-89%', count: attempts.filter((a) => a.score >= 75 && a.score < 90).length, fill: '#14b8a6' },
    { range: '60-74%', count: attempts.filter((a) => a.score >= 60 && a.score < 75).length, fill: '#f59e0b' },
    { range: '<60%', count: attempts.filter((a) => a.score < 60).length, fill: '#ef4444' },
  ];

  const handleExportDashboard = () => {
    const kpiSummary = [
      { Metric: 'Total Registered Users', Value: users.length, Synthetic: 'True' },
      { Metric: 'Active Courses', Value: courses.length, Synthetic: 'True' },
      { Metric: 'Total Enrollments', Value: enrollments.length, Synthetic: 'True' },
      { Metric: 'Completed Certifications', Value: certificates.length, Synthetic: 'True' },
      { Metric: 'Average Attendance', Value: `${avgAttendance}%`, Synthetic: 'True' },
      { Metric: 'Assessments Attempted', Value: attempts.length, Synthetic: 'True' },
    ];
    exportToCsv('CapacityConnect_Executive_Summary', kpiSummary);
    showToast('Executive dashboard KPI summary exported to CSV', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 px-2 py-0.5 text-xs font-bold uppercase">
              Executive Administration
            </span>
            <span className="text-xs text-slate-400">National Training Monitoring System</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Training Operations & Capacity Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Real-time operational dashboard synthesizing competency development across regional meteorological centres.
          </p>
        </div>

        {/* Filter & Export toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none dark:text-white"
            >
              <option value="all">All Regional Centres</option>
              {APP_CONFIG.centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportDashboard}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Actionable Approval Queue Highlights */}
      {(pendingUsersCount > 0 || pendingCoursesCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingUsersCount > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  User Approval Queue
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>{pendingUsersCount} new registration(s)</strong> awaiting administrative role approval.
                </p>
              </div>
              <Link
                to="/admin/users"
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shrink-0"
              >
                Review Queue
              </Link>
            </div>
          )}

          {pendingCoursesCount > 0 && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Course Publication Queue
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>{pendingCoursesCount} module proposal(s)</strong> submitted by trainers for syllabus review.
                </p>
              </div>
              <Link
                to="/admin/courses"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shrink-0"
              >
                Inspect Modules
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 6 Core Clickable KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Personnel', val: filteredUsers.length, icon: <Users className="h-4 w-4" />, type: 'users' },
          { label: 'Authored Courses', val: filteredCourses.length, icon: <BookOpen className="h-4 w-4" />, type: 'courses' },
          { label: 'Active Enrollments', val: enrollments.length, icon: <GraduationCap className="h-4 w-4" />, type: 'enrollments' },
          { label: 'Completions', val: completedEnrollmentsCount, icon: <CheckCircle2 className="h-4 w-4" />, type: 'completions' },
          { label: 'Avg Attendance', val: `${avgAttendance}%`, icon: <TrendingUp className="h-4 w-4" />, type: 'attendance' },
          { label: 'Assessments Taken', val: attempts.length, icon: <FileText className="h-4 w-4" />, type: 'assessments' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => setDrillDownType(kpi.type)}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{kpi.val}</div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
              Click to drill down →
            </span>
          </div>
        ))}
      </div>

      {/* Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Participation by Centre */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Personnel & Course Allocation by Regional Centre
            </h3>
            <span className="text-[11px] text-slate-400">Live Seed Count</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={centreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="personnel" fill="#0d9488" name="Personnel" radius={[4, 4, 0, 0]} />
                <Bar dataKey="courses" fill="#f59e0b" name="Courses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Score Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Examination Score Distribution Across Modules
            </h3>
            <span className="text-[11px] text-slate-400">70% Minimum Passing Standard</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Attempts" radius={[4, 4, 0, 0]}>
                  {scoreBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drill-Down Table Modal */}
      {drillDownType && (
        <Modal
          isOpen={!!drillDownType}
          onClose={() => setDrillDownType(null)}
          title={`Detailed Drill-Down: ${drillDownType.toUpperCase()}`}
          subtitle="Tabular breakdown filtered from synthetic demonstration records"
          maxWidth="2xl"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {drillDownType === 'users' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.slice(0, 15).map((u) => (
                    <tr key={u.id}>
                      <td className="p-2 font-medium">{u.name}</td>
                      <td className="p-2 capitalize">{u.role}</td>
                      <td className="p-2"><span className="text-xs uppercase font-bold">{u.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {drillDownType === 'courses' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2">Title</th>
                    <th className="p-2">Subject</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td className="p-2 font-medium">{c.title}</td>
                      <td className="p-2">{c.subject}</td>
                      <td className="p-2 capitalize">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {drillDownType !== 'users' && drillDownType !== 'courses' && (
              <p className="text-xs text-slate-500 py-4 text-center">
                Drill-down data for {drillDownType} active with {enrollments.length} total operational events.
              </p>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setDrillDownType(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Close Drill-Down
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
