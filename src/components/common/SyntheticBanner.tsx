import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';

export const SyntheticBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('cc_synthetic_banner_dismissed') === 'true';
  });

  if (!APP_CONFIG.featureFlags.showSyntheticBanner) return null;

  if (isDismissed) {
    return (
      <div className="bg-amber-100 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-1 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between no-print">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
          Prototype Mode (Synthetic Data)
        </span>
        <button
          onClick={() => {
            sessionStorage.removeItem('cc_synthetic_banner_dismissed');
            setIsDismissed(false);
          }}
          className="underline hover:text-amber-700 text-[11px] focus-ring"
        >
          Show full notice
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Synthetic Data Notice"
      className="bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm no-print"
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        <AlertCircle className="h-4 w-4 shrink-0 text-slate-950" />
        <span>{APP_CONFIG.banners.syntheticData}</span>
        <span className="hidden md:inline font-normal text-xs text-slate-900">
          (No real person records, official IMD data, or government APIs are connected.)
        </span>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem('cc_synthetic_banner_dismissed', 'true');
          setIsDismissed(true);
        }}
        className="rounded p-1 hover:bg-amber-600/30 text-slate-950 focus-ring"
        title="Minimize notice for this session"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
