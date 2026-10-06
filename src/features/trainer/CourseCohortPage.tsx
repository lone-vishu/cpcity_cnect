import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Search,
  Download,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Edit2,
  Check,
  Eye,
} from 'lucide-react';
import { Course, Enrollment, User as UserType, TraineeProfile, Attempt, Assessment } from '../../domain/types';
import {
  courseService,
  enrollmentService,
  userService,
  assessmentService,
} from '../../services';
import { useToast } from '../../components/common/Toast';
import { formatDate, exportToCsv } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const CourseCohortPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainee, setSelectedTrainee] = useState<{ user: UserType; profile: TraineeProfile | null; enrollment: Enrollment } | null>(null);

  // Inline attendance edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAttendanceVal, setEditAttendanceVal] = useState<number>(0);

  const loadData = async () => {
    if (!id) return;
    const [c, enrs, allUsers, allAssess, allAtt] = await Promise.all([
      courseService.getCourseById(id),
      enrollmentService.getEnrollmentsByCourse(id),
      userService.getUsers(),
      assessmentService.getAssessmentsByCourse(id),
      assessmentService.getAttempts(),
    ]);

    setCourse(c);
    setEnrollments(enrs);
    setUsers(allUsers);
    setAssessments(allAssess);
    setAttempts(allAtt);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const userMap = new Map(users.map((u) => [u.id, u]));

  const filteredEnrollments = enrollments.filter((e) => {
    const user = userMap.get(e.traineeId);
    if (!user) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSaveAttendance = async (enrollmentId: string) => {
    await enrollmentService.updateAttendance(enrollmentId, editAttendanceVal);
    setEditingId(null);
    showToast('Attendance updated', 'success');
    loadData();
  };

  const handleExportCSV = () => {
    const rows = filteredEnrollments.map((e) => {
      const u = userMap.get(e.traineeId);
      return {
        traineeId: e.traineeId,
        traineeName: u?.name || 'Trainee',
        email: u?.email || '',
        status: e.status,
        attendancePct: `${e.attendancePct}%`,
        enrolledAt: formatDate(e.enrolledAt),
        completedAt: e.completedAt ? formatDate(e.completedAt) : 'In Progress',
      };
    });

    exportToCsv(`${course.title.replace(/\s+/g, '_')}_Cohort`, rows);
    showToast('Cohort attendance exported to CSV', 'success');
  };

  const handleOpenTraineeDrawer = async (e: Enrollment) => {
    const user = userMap.get(e.traineeId);
    if (!user) return;
    const profile = await userService.getTraineeProfile(user.id);
    setSelectedTrainee({ user, profile, enrollment: e });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/trainer/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Courses</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Course Cohort: {course.title}
            </h1>
            <p className="text-xs text-slate-500">
              {enrollments.length} / {course.capacity} Trainees Registered • Attendance & Completion Record
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-2xs"
          >
            <Download className="h-4 w-4" />
            <span>Export Cohort CSV</span>
          </button>
        </div>
      </div>

      {/* Trainee Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Search Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search trainees in cohort..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing {filteredEnrollments.length} Trainees
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Trainee Name</th>
                <th className="p-3.5">Enrollment Status</th>
                <th className="p-3.5">Attendance (%)</th>
                <th className="p-3.5">Enrolled Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.map((enr) => {
                const u = userMap.get(enr.traineeId);
                const isEditing = editingId === enr.id;

                return (
                  <tr key={enr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{u?.name || 'Trainee'}</div>
                      <div className="text-[11px] font-normal text-slate-400">{u?.email}</div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={enr.status} size="sm" />
                    </td>
                    <td className="p-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editAttendanceVal}
                            onChange={(e) => setEditAttendanceVal(Number(e.target.value))}
                            className="w-16 rounded border p-1 text-xs dark:bg-slate-800"
                          />
                          <button
                            onClick={() => handleSaveAttendance(enr.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {enr.attendancePct}%
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(enr.id);
                              setEditAttendanceVal(enr.attendancePct);
                            }}
                            className="text-slate-400 hover:text-teal-600 p-1"
                            title="Edit Attendance"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDate(enr.enrolledAt)}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenTraineeDrawer(enr)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Profile & Scores</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trainee Performance Detail Modal */}
      {selectedTrainee && (
        <Modal
          isOpen={!!selectedTrainee}
          onClose={() => setSelectedTrainee(null)}
          title={`Trainee Details: ${selectedTrainee.user.name}`}
          subtitle={`Email: ${selectedTrainee.user.email} • Enrolled: ${formatDate(selectedTrainee.enrollment.enrolledAt)}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400">Designation:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTrainee.profile?.designation || 'Scientific Assistant'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Attendance:</span>
                <div className="font-semibold text-teal-600">
                  {selectedTrainee.enrollment.attendancePct}%
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Qualifications</h4>
              <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                {selectedTrainee.profile?.qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">
                Assessment Scores in this Module
              </h4>
              <div className="space-y-2">
                {assessments.map((ass) => {
                  const att = attempts.find(
                    (a) => a.assessmentId === ass.id && a.traineeId === selectedTrainee.user.id
                  );
                  return (
                    <div
                      key={ass.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border text-xs dark:border-slate-800"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{ass.title}</span>
                      <span
                        className={`font-bold ${
                          att ? (att.score >= 70 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-400'
                        }`}
                      >
                        {att ? `${att.score}%` : 'Not Attempted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t text-right">
              <button
                onClick={() => setSelectedTrainee(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
