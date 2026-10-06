import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, FileText, CheckCircle2, ShieldAlert, Award, Briefcase, GraduationCap } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { applicationService } from '../../services';
import { Application, TraineeApplicationPayload, TrainerApplicationPayload } from '../../domain/types';
import { formatDate } from '../../lib/utils';

export const PendingAccountPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      applicationService.getApplicationByUserId(currentUser.id).then((app) => {
        setApplication(app);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const payload = application?.payload;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
            <Clock className="h-7 w-7" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Under Review
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Application Under Review
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your registration as an IMD {currentUser?.role} has been submitted to the administrative queue.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Application Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Applicant</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Email</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{currentUser?.email}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Reference ID</span>
            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{application?.id || 'CC-APP-PENDING'}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Revision</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rev {application?.revision ?? 1}</span>
          </div>
        </div>

        {/* Review Notice */}
        <div className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 p-4 text-xs text-teal-900 dark:text-teal-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            What happens next?
          </p>
          <p className="text-teal-700 dark:text-teal-300/80 leading-relaxed">
            A training administrator will verify your meteorological qualifications and credentials. Once approved, signing in with your email and password will guide you through your first-login onboarding checklist.
          </p>
        </div>

        {/* Submitted Summary */}
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-400">Loading submitted summary...</div>
        ) : payload ? (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Submitted Profile Summary
            </h2>

            {/* Qualifications */}
            {payload.qualifications && payload.qualifications.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <GraduationCap className="h-4 w-4 text-teal-600" />
                  <span>Qualifications ({payload.qualifications.length})</span>
                </div>
                <div className="space-y-1.5">
                  {payload.qualifications.map((q, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{q.degree}</span>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{q.institution} ({q.field})</span>
                      </div>
                      <span className="rounded-md bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {q.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience / Competencies */}
            {currentUser?.role === 'trainee' && (payload as TraineeApplicationPayload).experience && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Briefcase className="h-4 w-4 text-teal-600" />
                  <span>Experience</span>
                </div>
                <div className="space-y-1.5">
                  {(payload as TraineeApplicationPayload).experience?.map((exp, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-xs flex justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{exp.role}</span>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{exp.organization}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {exp.fromYear} — {exp.toYear || 'Present'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentUser?.role === 'trainer' &&
              (payload as TrainerApplicationPayload).declaredCompetencies &&
              ((payload as TrainerApplicationPayload).declaredCompetencies?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span>
                      Declared Competencies (
                      {(payload as TrainerApplicationPayload).declaredCompetencies?.length ?? 0})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(payload as TrainerApplicationPayload).declaredCompetencies?.map((comp, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 px-2.5 py-1 text-xs font-medium text-blue-800 dark:text-blue-300"
                      >
                        {comp.name} · Level {comp.level}/4
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Capacity Connect • Demonstration Portal</span>
          <button
            onClick={handleSignOut}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
