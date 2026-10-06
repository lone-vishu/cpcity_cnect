import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowRight, LogOut, RotateCcw, AlertTriangle, ShieldX } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { applicationService } from '../../services';
import { Application } from '../../domain/types';
import { formatDate } from '../../lib/utils';

export const RejectedAccountPage: React.FC = () => {
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

  const handleEditAndReapply = () => {
    if (!currentUser?.role) return;
    navigate(`/register/${currentUser.role}?reapply=true&appId=${application?.id || ''}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <XCircle className="h-7 w-7" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
              Application Not Approved
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Application Not Approved
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              The administrative reviewer was unable to approve your application based on the submitted details.
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

        {/* Reason Box */}
        <div className="rounded-2xl border border-rose-300 dark:border-rose-900/80 bg-rose-50 dark:bg-rose-950/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Rejection Reason</span>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-rose-200 dark:border-rose-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            "{application?.adminNote || 'Submitted credentials do not meet the minimum prerequisite criteria for IMD operational training.'}"
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-400">
            Decided on {application?.decidedAt ? formatDate(application.decidedAt) : 'Recent date'} • Application Ref {application?.id || 'N/A'}
          </p>
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Next Steps & Reapplication
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            You may revise your application with updated qualifications, evidence, or appropriate center alignment, and submit a new revision for evaluation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleEditAndReapply}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-sm focus-ring cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Edit and reapply</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-xs text-slate-400">
          Capacity Connect • India Meteorological Department Training Context • Synthetic Data
        </div>
      </div>
    </div>
  );
};
