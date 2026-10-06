import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Layers,
  FileText,
  Video,
  Download,
  Star,
  Award,
  AlertCircle,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  Course,
  Competency,
  Resource,
  Assessment,
  Feedback,
  Enrollment,
  TrainerProfile,
  User as UserType,
} from '../../domain/types';
import {
  courseService,
  competencyService,
  resourceService,
  assessmentService,
  feedbackService,
  enrollmentService,
  userService,
} from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';
import { Modal } from '../../components/common/Modal';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [trainerUser, setTrainerUser] = useState<UserType | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [isTrainerDrawerOpen, setIsTrainerDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'assessments' | 'feedback'>('overview');

  // Feedback form state
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const c = await courseService.getCourseById(id);
      if (!c) {
        showToast('Course not found', 'error');
        navigate('/courses');
        return;
      }
      setCourse(c);

      const [allComps, courseRes, courseAssess, courseFb] = await Promise.all([
        competencyService.getCompetencies(),
        resourceService.getResourcesByCourse(c.id),
        assessmentService.getAssessmentsByCourse(c.id),
        feedbackService.getFeedbacks(c.id),
      ]);

      setCompetencies(allComps.filter((comp) => c.competencyIds.includes(comp.id)));
      setResources(courseRes);
      setAssessments(courseAssess);
      setFeedbacks(courseFb);

      if (c.trainerId) {
        const tUser = await userService.getUserById(c.trainerId);
        const tProf = await userService.getTrainerProfile(c.trainerId);
        setTrainerUser(tUser);
        setTrainerProfile(tProf);
      }

      if (currentUser) {
        const enrs = await enrollmentService.getEnrollmentsByTrainee(currentUser.id);
        const found = enrs.find((e) => e.courseId === c.id);
        setEnrollment(found || null);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, currentUser]);

  if (!course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const centre = APP_CONFIG.centres.find((c) => c.id === course.centreId);

  const handleEnroll = async () => {
    if (!currentUser) {
      showToast('Please sign in to enroll', 'warning');
      return;
    }
    try {
      const result = await enrollmentService.enrollInCourse(currentUser.id, course.id);
      showToast(
        result.status === 'waitlisted'
          ? 'Course is at capacity. Placed on waitlist.'
          : 'Enrolled successfully!',
        result.status === 'waitlisted' ? 'warning' : 'success'
      );
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Enrollment failed', 'error');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!myComment.trim()) {
      showToast('Please write a brief evaluation comment', 'warning');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await feedbackService.submitFeedback({
        courseId: course.id,
        traineeId: currentUser.id,
        rating: myRating,
        comment: myComment.trim(),
      });
      showToast('Feedback submitted successfully! Thank you.', 'success');
      setMyComment('');
      loadData();
    } catch (e: any) {
      showToast('Failed to submit feedback', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button & Title Header */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Course Catalogue</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                {course.subject}
              </span>
              <StatusBadge status={course.status} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {course.title}
            </h1>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {enrollment ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 capitalize">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>You are {enrollment.status}</span>
              </div>
            ) : currentRole === 'trainee' && (course.status === 'published' || course.status === 'in_progress') ? (
              <button
                onClick={handleEnroll}
                className="rounded-xl bg-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-teal-700 focus-ring"
              >
                Enroll in this Course
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Course Info Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Training Centre</div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {centre?.name || 'Regional Centre'}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Schedule Window</div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {formatDate(course.startDate)} – {formatDate(course.endDate)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Delivery Mode</div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
            {course.deliveryMode.replace('_', ' ')}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Capacity</div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {course.capacity} Participants
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(['overview', 'resources', 'assessments', 'feedback'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-5 text-xs sm:text-sm font-semibold capitalize border-b-2 transition-all ${
              activeTab === tab
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab}
            {tab === 'resources' && ` (${resources.length})`}
            {tab === 'assessments' && ` (${assessments.length})`}
            {tab === 'feedback' && ` (${feedbacks.length})`}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Objectives */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Course Objectives</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {course.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Prerequisites Check</h3>
              {course.prerequisites && course.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((p, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No prerequisites specified for this module.</p>
              )}
            </div>

            {/* Competencies Covered */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Competencies Covered
                </h3>
                <span className="text-[11px] text-slate-400">
                  {APP_CONFIG.banners.competencyTaxonomyNotice}
                </span>
              </div>
              <div className="space-y-3">
                {competencies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {comp.name}
                      </span>
                      <span className="rounded bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                        Level {comp.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{comp.description}</p>
                    <div className="text-[10px] text-slate-400">Source: {comp.source} (v{comp.version})</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Trainer Card */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Faculty / Lead Trainer</h3>
              {trainerUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-sm">
                      {trainerUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{trainerUser.name}</h4>
                      <p className="text-xs text-slate-400">{trainerUser.email}</p>
                    </div>
                  </div>
                  {trainerProfile?.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {trainerProfile.bio}
                    </p>
                  )}
                  <button
                    onClick={() => setIsTrainerDrawerOpen(true)}
                    className="w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    View Trainer Credentials Drawer
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Trainer matching pending or not assigned.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resources */}
      {activeTab === 'resources' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Course Learning Materials</h3>
            <span className="text-xs text-slate-400">Accessible for enrolled trainees</span>
          </div>

          {resources.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No resources uploaded for this module yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {resources.map((res) => (
                <div key={res.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {res.type === 'video' ? (
                        <Video className="h-4 w-4 text-teal-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{res.title}</span>
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                        {res.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{res.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => showToast(`Opening demo resource "${res.title}"`, 'info')}
                      className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                    >
                      View / Open
                    </button>
                    <button
                      onClick={() => showToast(`Demo download simulated for ${res.fileMeta?.name || 'file.pdf'}`, 'success')}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      title="Download Demo Asset"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assessments */}
      {activeTab === 'assessments' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Module MCQ Assessments</h3>
            <span className="text-xs text-slate-400">Subject-wise multiple-choice examinations</span>
          </div>

          {assessments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No assessments scheduled for this course.</p>
          ) : (
            <div className="space-y-3">
              {assessments.map((ass) => (
                <div
                  key={ass.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ass.status} size="sm" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{ass.title}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Duration: {ass.durationMin} mins • {ass.questions.length} Questions • Due {formatDate(ass.deadline)}
                    </p>
                  </div>

                  <Link
                    to={`/assessments/${ass.id}`}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 text-center shrink-0"
                  >
                    Start Assessment
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Submit Feedback form for enrolled trainees */}
          {enrollment && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Submit Your Course Evaluation
              </h3>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Overall Course Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setMyRating(star)}
                        className={`p-1 text-lg ${
                          myRating >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                      {myRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Evaluation Comments & Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder="Share feedback on curriculum relevance, trainer explanations, or laboratory exercises..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Post Evaluation'}
                </button>
              </form>
            </div>
          )}

          {/* Feedback list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Trainee Course Feedback ({feedbacks.length})
            </h3>
            {feedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No evaluations posted yet.</p>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-400 text-sm">
                        {'★'.repeat(fb.rating)}
                        <span className="text-slate-300 dark:text-slate-600">{'★'.repeat(5 - fb.rating)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDate(fb.submittedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{fb.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trainer Profile Drawer Modal */}
      {trainerUser && (
        <Modal
          isOpen={isTrainerDrawerOpen}
          onClose={() => setIsTrainerDrawerOpen(false)}
          title={`Faculty Profile: ${trainerUser.name}`}
          subtitle={`Trainer ID: ${trainerUser.id} • Centre: ${centre?.name || 'Regional Centre'}`}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Biography</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {trainerProfile?.bio || 'Senior Meteorological Specialist.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Qualifications</h4>
              <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {trainerProfile?.qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Specialist Subjects</h4>
              <div className="flex flex-wrap gap-1.5">
                {trainerProfile?.subjects.map((s, i) => (
                  <span key={i} className="rounded bg-teal-50 dark:bg-teal-950 px-2 py-0.5 text-xs text-teal-700 dark:text-teal-300 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t text-right">
              <button
                onClick={() => setIsTrainerDrawerOpen(false)}
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
