import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const { currentRole, switchRole } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white">403</h1>
      <h2 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md">
        Your current role (<strong className="capitalize text-slate-800 dark:text-slate-200">{currentRole}</strong>) does not have permission to view this protected view.
      </p>

      {/* Switch role helper */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 max-w-sm w-full">
        <div className="text-xs font-semibold text-slate-500 mb-2">Switch Demo Role to Proceed:</div>
        <div className="grid grid-cols-3 gap-2">
          {(['trainee', 'trainer', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className="rounded-lg bg-slate-100 py-1.5 text-xs font-semibold capitalize text-slate-700 hover:bg-teal-600 hover:text-white dark:bg-slate-800 dark:text-slate-200"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Homepage</span>
        </Link>
      </div>
    </div>
  );
};
