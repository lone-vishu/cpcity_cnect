import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Assessment, Attempt, Course } from '../../domain/types';
import { assessmentService, courseService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AssessmentsListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      assessmentService.getAssessments(),
      currentUser ? assessmentService.getAttempts(currentUser.id) : Promise.resolve([]),
      courseService.getCourses(),
    ]).then(([allAssess, myAttempts, allCourses]) => {
      setAssessments(allAssess);
      setAttempts(myAttempts);
      setCourses(allCourses);
      setLoading(false);
    });
  }, [currentUser]);

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Subject-Wise MCQ Assessments
        </h1>
        <p className="text-xs text-slate-500">
          Module quizzes and qualification examinations linked to accredited competencies.
        </p>
      </div>

      <div className="space-y-4">
        {assessments.map((ass) => {
          const attempt = attempts.find((a) => a.assessmentId === ass.id);
          const isPassed = attempt && attempt.score >= 70;

          return (
            <div
              key={ass.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase text-teal-600 dark:text-teal-400">
                    {courseMap.get(ass.courseId) || 'Meteorological Course'}
                  </span>
                  <StatusBadge status={ass.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{ass.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{ass.questions.length} Questions</span>
                  <span>•</span>
                  <span>{ass.durationMin} Minutes</span>
                  <span>•</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    Deadline: {formatDate(ass.deadline)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {attempt ? (
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Score: <span className={isPassed ? 'text-emerald-600' : 'text-amber-600'}>{attempt.score}%</span>
                    </div>
                    <Link
                      to={`/assessments/${ass.id}?mode=review`}
                      className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                    >
                      Review Answers
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/assessments/${ass.id}`}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-2xs"
                  >
                    Start Exam
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
