import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, LogOut, FileEdit, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { applicationService } from '../../services';
import { Application } from '../../domain/types';
import { formatDate } from '../../lib/utils';

export const NeedsInfoAccountPage: React.FC = () => {
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

  const handleEditAndResubmit = () => {
    if (!currentUser?.role) return;
    navigate(`/register/${currentUser.role}?resubmit=true&appId=${application?.id || ''}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Information Requested
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Action Required: Additional Information
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              The administrative reviewer requested clarification or additional supporting details on your application.
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
            <span className="text-slate-400 dark:text-slate-500 block">Role</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{currentUser?.role}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Reference ID</span>
            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{application?.id || 'CC-APP-REVIEW'}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Current Revision</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rev {application?.revision ?? 1}</span>
          </div>
        </div>

        {/* Admin Review Note Callout */}
        <div className="rounded-2xl border border-amber-300 dark:border-amber-900/80 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <MessageSquare className="h-4 w-4 text-amber-600" />
            <span>Reviewer's Note</span>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-amber-200 dark:border-amber-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            "{application?.adminNote || 'Please provide updated certificates or verify your recent training deliveries.'}"
          </div>
          <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Reviewed on {application?.decidedAt ? formatDate(application.decidedAt) : 'Recent review'} by Administrator</span>
          </div>
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            How to resolve this request
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Clicking <strong>Edit and resubmit</strong> will reopen your registration wizard pre-filled with all previously submitted information. You can amend details, upload missing documents, and resubmit for priority re-evaluation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleEditAndResubmit}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-sm focus-ring cursor-pointer"
            >
              <FileEdit className="h-4 w-4" />
              <span>Edit and resubmit application</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign out for now
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
