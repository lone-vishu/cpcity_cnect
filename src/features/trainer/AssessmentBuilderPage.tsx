import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Assessment, MCQ, Course, Competency, Attempt } from '../../domain/types';
import { assessmentService, courseService, competencyService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';

export const AssessmentBuilderPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [durationMin, setDurationMin] = useState(20);
  const [deadline, setDeadline] = useState('2026-11-20');
  const [questions, setQuestions] = useState<MCQ[]>([]);

  // Add MCQ modal state
  const [isAddMCQOpen, setIsAddMCQOpen] = useState(false);
  const [qPrompt, setQPrompt] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qCompId, setQCompId] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  // Item analysis modal state
  const [analyzingAssessment, setAnalyzingAssessment] = useState<Assessment | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    const [allAssess, allCourses, allComps, allAtt] = await Promise.all([
      assessmentService.getAssessments(),
      courseService.getCourses(),
      competencyService.getCompetencies(),
      assessmentService.getAttempts(),
    ]);

    const myCourses = allCourses.filter((c) => c.trainerId === currentUser.id);
    setCourses(myCourses);
    setAssessments(allAssess);
    setCompetencies(allComps);
    setAttempts(allAtt);
    if (myCourses.length > 0 && !courseId) {
      setCourseId(myCourses[0].id);
    }
  }, [currentUser, courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddQuestionToBuilder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim() || qOptions.some((o) => !o.trim()) || !qExplanation.trim()) {
      showToast('Please fill all question fields and options', 'warning');
      return;
    }

    const newMCQ: MCQ = {
      id: `mcq-${Date.now()}`,
      prompt: qPrompt.trim(),
      options: qOptions.map((o) => o.trim()),
      correctIndex: qCorrect,
      competencyId: qCompId || undefined,
      explanation: qExplanation.trim(),
    };

    setQuestions((prev) => [...prev, newMCQ]);
    setIsAddMCQOpen(false);
    setQPrompt('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setQExplanation('');
    showToast('Question added to draft questionnaire', 'info');
  };

  const handleSaveAssessment = async (status: 'draft' | 'published') => {
    if (!title.trim() || !courseId || questions.length === 0) {
      showToast('Please provide title, course, and at least one question', 'warning');
      return;
    }

    try {
      await assessmentService.createAssessment({
        title: title.trim(),
        courseId,
        deadline: new Date(deadline).toISOString(),
        durationMin,
        questions,
        status,
      });

      showToast(
        status === 'published'
          ? 'Assessment published and visible to trainees!'
          : 'Assessment draft saved.',
        'success'
      );
      setIsCreateModalOpen(false);
      setTitle('');
      setQuestions([]);
      loadData();
    } catch (err: any) {
      showToast('Failed to create assessment', 'error');
    }
  };

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Assessment Questionnaire Builder
          </h1>
          <p className="text-xs text-slate-500">
            Author subject-wise MCQ assessments, tag meteorological competencies, and inspect item analytics.
          </p>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setQuestions([]);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Assessment</span>
        </button>
      </div>

      {/* List of Assessments */}
      <div className="space-y-4">
        {assessments.map((ass) => {
          const assAttempts = attempts.filter((a) => a.assessmentId === ass.id);
          const avgScore =
            assAttempts.length > 0
              ? Math.round(assAttempts.reduce((acc, a) => acc + a.score, 0) / assAttempts.length)
              : 0;

          return (
            <div
              key={ass.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase text-teal-600">
                      {courseMap.get(ass.courseId) || 'Meteorological Course'}
                    </span>
                    <StatusBadge status={ass.status} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{ass.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>{ass.questions.length} Questions</span>
                    <span>•</span>
                    <span>{ass.durationMin} Minutes</span>
                    <span>•</span>
                    <span>Due: {formatDate(ass.deadline)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAnalyzingAssessment(ass)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <BarChart3 className="h-4 w-4 text-teal-600" />
                    <span>Item Analysis ({assAttempts.length} Submissions)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Author MCQ Questionnaire"
        subtitle="Define examination duration, deadlines, and item pool"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Assessment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Term Examination on Doppler Radar Signatures"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Associated Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Submission Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {/* Questions Pool */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase text-slate-500">
                Question Pool ({questions.length} Items)
              </h4>
              <button
                type="button"
                onClick={() => setIsAddMCQOpen(true)}
                className="inline-flex items-center gap-1 rounded bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center border border-dashed rounded-xl">
                No questions added yet. Click "+ Add Question" to draft MCQs.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border flex items-center justify-between text-xs dark:border-slate-800"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-md">
                      {i + 1}. {q.prompt}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveAssessment('draft')}
              className="rounded-lg border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveAssessment('published')}
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-sm"
            >
              Publish Questionnaire
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Single MCQ Modal */}
      <Modal
        isOpen={isAddMCQOpen}
        onClose={() => setIsAddMCQOpen(false)}
        title="Add MCQ Question"
      >
        <form onSubmit={handleAddQuestionToBuilder} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Question Prompt</label>
            <textarea
              rows={2}
              required
              value={qPrompt}
              onChange={(e) => setQPrompt(e.target.value)}
              placeholder="e.g. Which Doppler radar parameter suppresses anomalous ground clutter?"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Answer Options (Select correct)</label>
            <div className="space-y-2">
              {qOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={qCorrect === idx}
                    onChange={() => setQCorrect(idx)}
                    className="text-teal-600"
                  />
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const updated = [...qOptions];
                      updated[idx] = e.target.value;
                      setQOptions(updated);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Target Competency</label>
            <select
              value={qCompId}
              onChange={(e) => setQCompId(e.target.value)}
              className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
            >
              <option value="">None / General</option>
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Scientific Explanation</label>
            <textarea
              rows={2}
              required
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Scientific rationale displayed to trainees after exam submission"
              className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsAddMCQOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              Add Question
            </button>
          </div>
        </form>
      </Modal>

      {/* Item Analysis Modal */}
      {analyzingAssessment && (
        <Modal
          isOpen={!!analyzingAssessment}
          onClose={() => setAnalyzingAssessment(null)}
          title={`Item Analysis: ${analyzingAssessment.title}`}
          subtitle="Empirical correct rate per question across cohort submissions"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {analyzingAssessment.questions.map((q, idx) => {
              // Compute percentage correct from attempts
              const attemptsForThis = attempts.filter((a) => a.assessmentId === analyzingAssessment.id);
              const correctCount = attemptsForThis.filter((a) => a.answers[idx] === q.correctIndex).length;
              const pctCorrect =
                attemptsForThis.length > 0 ? Math.round((correctCount / attemptsForThis.length) * 100) : 0;

              return (
                <div key={q.id} className="p-4 rounded-xl border space-y-2 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Question {idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        pctCorrect >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pctCorrect}% Correct ({correctCount}/{attemptsForThis.length})
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">{q.prompt}</p>
                </div>
              );
            })}

            <div className="pt-2 text-right">
              <button
                onClick={() => setAnalyzingAssessment(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
