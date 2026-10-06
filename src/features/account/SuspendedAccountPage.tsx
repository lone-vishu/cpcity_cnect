import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const SuspendedAccountPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
            Account Suspended
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Access Suspended
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This account ({currentUser?.email}) has been administratively suspended. Access to learning workspaces, certificates, and trainer assignments is disabled.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2 text-left">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">Resolution:</span>
          <p>
            Please contact your respective Regional Training Centre officer or the IMD capacity building coordinator for account status inquiries.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-teal-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-teal-700 transition-colors shadow-sm focus-ring cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>

        <p className="text-[11px] text-slate-400">
          Capacity Connect • India Meteorological Department Training Context
        </p>
      </div>
    </div>
  );
};
