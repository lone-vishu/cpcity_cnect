import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Assessment, Attempt, Competency } from '../../domain/types';
import { assessmentService, competencyService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const AssessmentAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('mode') === 'review';

  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [existingAttempt, setExistingAttempt] = useState<Attempt | null>(null);

  // Attempt state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1200); // 20 mins default
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      assessmentService.getAssessmentById(id),
      competencyService.getCompetencies(),
      currentUser ? assessmentService.getAttempts(currentUser.id) : Promise.resolve([]),
    ]).then(([ass, allComps, myAttempts]) => {
      if (!ass) {
        showToast('Assessment not found', 'error');
        navigate('/trainee/assessments');
        return;
      }
      setAssessment(ass);
      setCompetencies(allComps);
      setSecondsRemaining(ass.durationMin * 60);

      const foundAttempt = myAttempts.find((a) => a.assessmentId === ass.id);
      if (foundAttempt) {
        setExistingAttempt(foundAttempt);
        if (isReviewMode) {
          setCompletedAttempt(foundAttempt);
          // Load answers into state
          const ansMap: Record<number, number> = {};
          foundAttempt.answers.forEach((ans, i) => {
            ansMap[i] = ans;
          });
          setAnswers(ansMap);
        }
      }
    });
  }, [id, currentUser, isReviewMode]);

  // Timer countdown
  useEffect(() => {
    if (completedAttempt) return; // Stop timer on completion
    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, completedAttempt]);

  const handleAutoSubmit = () => {
    showToast('Time expired! Auto-submitting answers.', 'warning');
    handleSubmitExam();
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (completedAttempt) return; // read-only in review
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleToggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleSubmitExam = async () => {
    if (!assessment || !currentUser) return;

    // Calculate score
    let correctCount = 0;
    const answerArray: number[] = [];

    assessment.questions.forEach((q, idx) => {
      const selected = answers[idx] !== undefined ? answers[idx] : -1;
      answerArray.push(selected);
      if (selected === q.correctIndex) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / assessment.questions.length) * 100);

    const attempt = await assessmentService.submitAttempt({
      assessmentId: assessment.id,
      traineeId: currentUser.id,
      answers: answerArray,
      score: scorePct,
    });

    setCompletedAttempt(attempt);
    setIsSubmitModalOpen(false);

    if (scorePct >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast(`Congratulations! You passed with ${scorePct}%`, 'success');
    } else {
      showToast(`Exam completed with score: ${scorePct}%`, 'info');
    }
  };

  if (!assessment) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const currentQ = assessment.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalCount = assessment.questions.length;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // ----------------------------------------------------
  // RESULT VIEW
  // ----------------------------------------------------
  if (completedAttempt) {
    const isPassed = completedAttempt.score >= 70;
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Score Banner */}
        <div
          className={`rounded-3xl p-8 text-center border shadow-lg ${
            isPassed
              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
              : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
          }`}
        >
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
            {isPassed ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isPassed ? 'Assessment Completed & Passed' : 'Assessment Completed'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {assessment.title}
          </p>

          <div className="mt-6 flex justify-center items-center gap-6">
            <div className="text-center">
              <div
                className={`text-4xl sm:text-5xl font-black ${
                  isPassed ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {completedAttempt.score}%
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase mt-1">
                Final Score
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-left text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div>Passing Threshold: <strong>70%</strong></div>
              <div>Status: <strong className={isPassed ? 'text-emerald-600' : 'text-amber-600'}>{isPassed ? 'Qualified' : 'Needs Review'}</strong></div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/trainee/dashboard"
              className="rounded-xl bg-slate-900 dark:bg-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800"
            >
              Return to Dashboard
            </Link>
            {isPassed && (
              <Link
                to="/certificates"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Award className="h-4 w-4" />
                <span>View Demo Certificate</span>
              </Link>
            )}
          </div>
        </div>

        {/* Detailed Question by Question Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Question-by-Question Diagnostic Review
          </h2>

          {assessment.questions.map((q, idx) => {
            const userAns = completedAttempt.answers[idx];
            const isCorrect = userAns === q.correctIndex;
            const comp = competencies.find((c) => c.id === q.competencyId);

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 bg-white dark:bg-slate-900 shadow-2xs space-y-3 ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : 'border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Question {idx + 1} of {assessment.questions.length}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {q.prompt}
                </p>

                {/* Options Review */}
                <div className="space-y-1.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = userAns === optIdx;
                    const isKeyAnswer = optIdx === q.correctIndex;

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isKeyAnswer
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200 font-semibold'
                            : isUserChoice
                            ? 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                            : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{opt}</span>
                        {isKeyAnswer && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                            Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isKeyAnswer && (
                          <span className="text-[10px] font-bold text-rose-600 uppercase">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-teal-700 dark:text-teal-300 mb-0.5">
                    Scientific Rationale:
                  </div>
                  <p>{q.explanation}</p>
                  {comp && (
                    <div className="mt-1 text-[10px] text-slate-400">
                      Mapped to Competency: {comp.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIVE EXAM VIEW
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Exam Header with Timer */}
      <div className="sticky top-16 z-20 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
            Active Examination
          </span>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
            {assessment.title}
          </h2>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold shadow-2xs ${
            minutes < 5
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
          }`}
          aria-live="polite"
        >
          <Clock className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        {/* Question metadata */}
        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400">
            Question {currentIndex + 1} of {totalCount}
          </span>
          <button
            onClick={handleToggleFlag}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              flagged[currentIndex]
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Flag className={`h-3.5 w-3.5 ${flagged[currentIndex] ? 'fill-current' : ''}`} />
            <span>{flagged[currentIndex] ? 'Flagged for Review' : 'Flag Question'}</span>
          </button>
        </div>

        {/* Question prompt */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQ.prompt}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = answers[currentIndex] === optIdx;
            return (
              <button
                key={optIdx}
                onClick={() => handleAnswerSelect(optIdx)}
                className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between focus-ring ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/70 text-teal-950 dark:bg-teal-950/40 dark:text-teal-200 shadow-2xs ring-1 ring-teal-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{opt}</span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs shrink-0 ml-3 ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 text-white font-bold'
                      : 'border-slate-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between border-t pt-4 dark:border-slate-800">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < totalCount - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
              >
                Submit Examination
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Navigator Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 dark:text-white">Question Navigator</span>
          <span className="text-slate-500">
            {answeredCount} of {totalCount} Answered
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
          {assessment.questions.map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[idx] !== undefined;
            const isFlagged = flagged[idx];

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs font-bold transition-all focus-ring ${
                  isCurrent
                    ? 'ring-2 ring-teal-600 bg-teal-600 text-white shadow-xs'
                    : isAnswered
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-[11px] text-slate-500 dark:border-slate-800">
          <button
            onClick={() => {
              showToast('Progress saved locally', 'info');
              navigate('/trainee/assessments');
            }}
            className="text-teal-600 hover:underline"
          >
            Save and resume later
          </button>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="font-bold text-emerald-600 hover:underline"
          >
            Review & Final Submit
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Examination Submission"
        subtitle="Please review your completion status before finalizing"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <strong className="text-slate-900 dark:text-white">{totalCount}</strong>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Answered:</span>
              <strong>{answeredCount}</strong>
            </div>
            <div className="flex justify-between text-amber-600 font-semibold">
              <span>Unanswered:</span>
              <strong>{totalCount - answeredCount}</strong>
            </div>
            <div className="flex justify-between text-purple-600 font-semibold">
              <span>Flagged for Review:</span>
              <strong>{Object.values(flagged).filter(Boolean).length}</strong>
            </div>
          </div>

          {totalCount - answeredCount > 0 && (
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ You have {totalCount - answeredCount} unanswered question(s). Unanswered questions will receive 0 points.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Continue Exam
            </button>
            <button
              onClick={handleSubmitExam}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
            >
              Confirm and Submit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
