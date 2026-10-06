import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-900 mb-6">
        <Compass className="h-10 w-10 text-teal-600" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white">404</h1>
      <h2 className="mt-2 text-lg font-bold text-slate-700 dark:text-slate-300">Page Not Found</h2>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm">
        The requested resource or workflow route does not exist in this prototype workspace.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};
