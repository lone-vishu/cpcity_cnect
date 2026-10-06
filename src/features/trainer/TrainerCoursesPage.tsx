import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Users, Calendar, CheckCircle2, Clock, Send, Eye } from 'lucide-react';
import { Course, Competency, CourseStatus } from '../../domain/types';
import { courseService, competencyService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';
import { Modal } from '../../components/common/Modal';

export const TrainerCoursesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Multi-step form state
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Radar Meteorology');
  const [objectives, setObjectives] = useState('');
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'in_person' | 'online' | 'blended'>('blended');
  const [centreId, setCentreId] = useState('centre-pune');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [capacity, setCapacity] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    const [allCourses, allComps] = await Promise.all([
      courseService.getCourses(),
      competencyService.getCompetencies(),
    ]);
    setCourses(allCourses.filter((c) => c.trainerId === currentUser.id));
    setCompetencies(allComps);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreateCourse = async (action: 'draft' | 'pending_approval') => {
    if (!title.trim() || !objectives.trim() || selectedCompIds.length === 0) {
      showToast('Please complete all required fields across the steps', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const objList = objectives
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await courseService.createCourse({
        title: title.trim(),
        subject,
        objectives: objList.length > 0 ? objList : ['Comprehensive domain course.'],
        competencyIds: selectedCompIds,
        prerequisites: ['Basic Meteorology'],
        deliveryMode,
        centreId,
        startDate,
        endDate,
        capacity: Number(capacity),
        trainerId: currentUser?.id,
        status: action,
      });

      showToast(
        action === 'pending_approval'
          ? 'Course submitted for administrative review and publication!'
          : 'Course draft saved successfully.',
        'success'
      );

      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (e: any) {
      showToast('Failed to create course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormStep(1);
    setTitle('');
    setObjectives('');
    setSelectedCompIds([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Authored Modules & Cohorts
          </h1>
          <p className="text-xs text-slate-500">
            Create new training curricula, review course lifecycle state machines, and manage student cohorts.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          <span>Author New Course Module</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-teal-600">
                    {course.subject}
                  </span>
                  <StatusBadge status={course.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{course.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/trainer/courses/${course.id}/cohort`}
                  className="rounded-xl bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                >
                  Manage Cohort Table
                </Link>
                <Link
                  to={`/courses/${course.id}`}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Preview
                </Link>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">
                Course Lifecycle State Machine
              </div>
              <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
                {(['draft', 'pending_approval', 'published', 'in_progress', 'completed'] as const).map(
                  (step, idx) => {
                    const isCurrent = course.status === step;
                    return (
                      <React.Fragment key={step}>
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize ${
                            isCurrent
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          {step.replace('_', ' ')}
                        </span>
                        {idx < 4 && <span className="text-slate-300">→</span>}
                      </React.Fragment>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Step Course Creation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Author New Meteorological Module"
        subtitle={`Step ${formStep} of 3: ${
          formStep === 1 ? 'Details & Subject' : formStep === 2 ? 'Competency Tagging' : 'Schedule & Delivery'
        }`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          {/* Step 1: Details */}
          {formStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Satellite Rainfall Estimation"
                  className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Discipline / Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="Radar Meteorology">Radar Meteorology</option>
                  <option value="Satellite Meteorology">Satellite Meteorology</option>
                  <option value="Tropical Cyclone Forecasting">Tropical Cyclone Forecasting</option>
                  <option value="Numerical Weather Prediction">Numerical Weather Prediction</option>
                  <option value="Nowcasting Services">Nowcasting Services</option>
                  <option value="Agricultural Meteorology">Agricultural Meteorology</option>
                  <option value="Aviation Weather Services">Aviation Weather Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Syllabus Learning Objectives (one per line)
                </label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="1. Understand multispectral cloud classification&#10;2. Apply radiative transfer equations"
                  className="w-full rounded-xl border p-2.5 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>
          )}

          {/* Step 2: Competency Mapping */}
          {formStep === 2 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Tag the official WMO meteorological competencies covered by this module curriculum:
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-xl p-3 dark:border-slate-800">
                {competencies.map((comp) => {
                  const isChecked = selectedCompIds.includes(comp.id);
                  return (
                    <label
                      key={comp.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedCompIds(selectedCompIds.filter((id) => id !== comp.id));
                          } else {
                            setSelectedCompIds([...selectedCompIds, comp.id]);
                          }
                        }}
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {comp.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {comp.domain} • Level {comp.level}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Schedule & Capacity */}
          {formStep === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Host Centre</label>
                  <select
                    value={centreId}
                    onChange={(e) => setCentreId(e.target.value)}
                    className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    {APP_CONFIG.centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Delivery Mode</label>
                  <select
                    value={deliveryMode}
                    onChange={(e) => setDeliveryMode(e.target.value as any)}
                    className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="blended">Blended Learning</option>
                    <option value="in_person">In-Person Only</option>
                    <option value="online">Online Virtual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Trainee Capacity</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t pt-4 dark:border-slate-800">
            {formStep > 1 ? (
              <button
                type="button"
                onClick={() => setFormStep((prev) => (prev - 1) as any)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-2">
              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (formStep === 1 && !title.trim()) {
                      showToast('Please enter a title', 'warning');
                      return;
                    }
                    if (formStep === 2 && selectedCompIds.length === 0) {
                      showToast('Please tag at least one competency', 'warning');
                      return;
                    }
                    setFormStep((prev) => (prev + 1) as any);
                  }}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
                >
                  Continue
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateCourse('draft')}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleCreateCourse('pending_approval')}
                    className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit for Approval</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
