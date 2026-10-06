import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock, Mail, Home } from 'lucide-react';

export const RegistrationSubmittedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref') || 'CC-APP-' + Math.floor(100000 + Math.random() * 900000);
  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'trainee';
  const isResubmission = searchParams.get('resubmit') === 'true';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-center">
        {/* Animated Success Badge */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 shadow-lg">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        {/* Title & Reference */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 dark:bg-teal-950/60 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
            {isResubmission ? 'Revision Submitted' : 'Registration Submitted'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isResubmission ? 'Application Resubmitted!' : 'Application Submitted!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your application to join Capacity Connect as an IMD {role} has been received and queued for administrative review.
          </p>
        </div>

        {/* Reference Callout */}
        <div className="rounded-2xl border border-dashed border-teal-300 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Application Reference ID
          </span>
          <span className="font-mono text-lg font-bold text-teal-700 dark:text-teal-300 tracking-wider">
            {refId}
          </span>
          {email && (
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered email: <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
            </span>
          )}
        </div>

        {/* What Happens Next Steps */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 text-left space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            <span>What happens next</span>
          </h2>
          <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white mt-0.5">
                1
              </span>
              <span>
                <strong>Administrative Verification:</strong> An IMD Training Centre Officer will review your qualifications, declared competencies, and supporting evidence.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white mt-0.5">
                2
              </span>
              <span>
                <strong>Approval & Notification:</strong> You will be notified in-app. In this demo prototype, applications can be instantly inspected in the Admin review queue.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white mt-0.5">
                3
              </span>
              <span>
                <strong>Sign in & Guided Onboarding:</strong> Sign in with the email and password you created to confirm your pre-filled profile and begin learning!
              </span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to={`/login?role=${role}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-sm focus-ring"
          >
            <span>Proceed to {role} sign in</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          Capacity Connect • All credentials and verification checks are synthetic for demonstration purposes.
        </p>
      </div>
    </div>
  );
};
