import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Archive,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Course, CourseStatus } from '../../domain/types';
import { courseService, userService } from '../../services';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';

export const CourseApprovalsPage: React.FC = () => {
  const { showToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Request changes modal state
  const [requestingCourse, setRequestingCourse] = useState<Course | null>(null);
  const [changeNote, setChangeNote] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const all = await courseService.getCourses();
      setCourses(all);
    } catch (e) {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleApproveAndPublish = async (course: Course) => {
    try {
      await courseService.transitionCourseStatus(course.id, 'published');
      showToast(`Course "${course.title}" approved and published to catalogue!`, 'success');
      loadCourses();
    } catch (e: any) {
      showToast(e.message || 'Status transition failed', 'error');
    }
  };

  const handleRequestChanges = async () => {
    if (!requestingCourse || !changeNote.trim()) {
      showToast('Please provide feedback notes for the trainer', 'warning');
      return;
    }

    try {
      // Transition from pending_approval back to draft with reason
      await courseService.transitionCourseStatus(requestingCourse.id, 'draft', changeNote.trim());
      showToast(`Changes requested for "${requestingCourse.title}". Returned to draft.`, 'info');
      setRequestingCourse(null);
      setChangeNote('');
      loadCourses();
    } catch (e: any) {
      showToast('Action failed', 'error');
    }
  };

  const handleArchiveCourse = async (course: Course) => {
    if (confirm(`Archive course "${course.title}"?`)) {
      try {
        await courseService.transitionCourseStatus(course.id, 'archived');
        showToast('Course archived', 'info');
        loadCourses();
      } catch (e: any) {
        showToast(e.message || 'Archive failed', 'error');
      }
    }
  };

  const filtered = courses.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = courses.filter((c) => c.status === 'pending_approval').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Course Management & Curriculum Approvals
          </h1>
          <p className="text-xs text-slate-500">
            Review proposed training syllabi, manage course publication, and assign trainers.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{pendingCount} Pending Syllabus Reviews</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Lifecycles ({courses.length})</option>
          <option value="pending_approval">Pending Approval ({pendingCount})</option>
          <option value="published">Published</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Course Title</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Lifecycle State</th>
                <th className="p-3.5">Delivery Mode</th>
                <th className="p-3.5">Capacity</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((course) => {
                const isPending = course.status === 'pending_approval';

                return (
                  <tr
                    key={course.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                      isPending ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="p-3.5 max-w-sm">
                      <div className="font-bold text-slate-900 dark:text-white">{course.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {course.competencyIds.length} Competencies Tagged • Version {course.version}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-teal-600 dark:text-teal-400">
                      {course.subject}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={course.status} size="sm" />
                    </td>
                    <td className="p-3.5 capitalize text-slate-600 dark:text-slate-400">
                      {course.deliveryMode.replace('_', ' ')}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {course.capacity} Trainees
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Launch trainer match button for any course */}
                        <Link
                          to={`/admin/courses/${course.id}/match?source=course`}
                          className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                          title="Run Trainer Matching Engine"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <span>Match Trainer</span>
                        </Link>

                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApproveAndPublish(course)}
                              className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                            >
                              Approve & Publish
                            </button>
                            <button
                              onClick={() => setRequestingCourse(course)}
                              className="rounded bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                            >
                              Request Changes
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to={`/courses/${course.id}`}
                              className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {course.status !== 'archived' && (
                              <button
                                onClick={() => handleArchiveCourse(course)}
                                className="rounded p-1 text-slate-400 hover:text-rose-600"
                                title="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Changes Modal */}
      {requestingCourse && (
        <Modal
          isOpen={!!requestingCourse}
          onClose={() => setRequestingCourse(null)}
          title="Request Syllabus Changes"
          subtitle={`Course: "${requestingCourse.title}"`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Returning this module proposal to <strong>Draft</strong> status allows the trainer to adjust objectives, schedule, or competency tags before resubmitting.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Feedback Notes for Faculty</label>
              <textarea
                rows={3}
                required
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Please clarify Doppler clutter suppression laboratory hours and attach prerequisite list."
                className="w-full rounded-xl border p-2.5 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRequestingCourse(null)}
                className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                Return to Draft with Notes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
