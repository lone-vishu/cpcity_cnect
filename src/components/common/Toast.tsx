import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export type ToastOptions = {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
};

// Global toast listener bus so showToast() can be called from anywhere
type ToastListener = (toast: Omit<ToastMessage, 'id'>) => void;
const toastListeners = new Set<ToastListener>();

export const showToast = (
  msgOrOptions: string | ToastOptions,
  type: ToastType = 'info',
  title?: string,
  duration: number = 4000
) => {
  if (typeof msgOrOptions === 'object') {
    const { message, type: t = 'info', title: ttl, duration: d = 4000 } = msgOrOptions;
    toastListeners.forEach((fn) => fn({ message, type: t, title: ttl, duration: d }));
  } else {
    toastListeners.forEach((fn) => fn({ message: msgOrOptions, type, title, duration }));
  }
};

export const showOutOfScope = (featureName: string, customMessage?: string) => {
  const knownMsg = APP_CONFIG.unsupportedFeatures[featureName];
  const msg =
    customMessage ||
    knownMsg ||
    `"${featureName}" is an unverified future interface, outside the scope of this prototype demonstration.`;

  showToast({
    title: 'Prototype Boundary Notice',
    message: msg,
    type: 'info',
    duration: 5000,
  });
};

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: typeof showToast;
  showOutOfScope: typeof showOutOfScope;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);

      const dur = toast.duration ?? 4000;
      if (dur > 0) {
        setTimeout(() => {
          removeToast(id);
        }, dur);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    toastListeners.add(addToast);
    return () => {
      toastListeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, showOutOfScope, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100'
                : toast.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'
                : 'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
            </div>
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-ring"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
