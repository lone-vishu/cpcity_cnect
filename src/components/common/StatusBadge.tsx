import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Archive,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import { CourseStatus, AccountStatus, EnrollmentStatus, VerificationStatus } from '../../domain/types';

interface StatusBadgeProps {
  status: CourseStatus | AccountStatus | EnrollmentStatus | VerificationStatus | 'demo' | 'reviewed' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      // Success / Published / Verified / Approved
      case 'published':
      case 'approved':
      case 'verified':
      case 'reviewed':
      case 'enrolled':
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
          label: normalized === 'reviewed' ? 'Reviewed Taxonomy' : normalized.replace('_', ' '),
        };

      // In Progress / Active
      case 'in_progress':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          icon: <BookOpen className="h-3 w-3 shrink-0" />,
          label: 'In Progress',
        };

      // Pending / Requested / Waitlisted / Unverified / Demo
      case 'pending':
      case 'pending_approval':
      case 'requested':
      case 'waitlisted':
      case 'unverified':
      case 'demo':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: <Clock className="h-3 w-3 shrink-0" />,
          label: normalized === 'demo' ? 'Demo Taxonomy' : normalized.replace('_', ' '),
        };

      // Draft
      case 'draft':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: <Clock className="h-3 w-3 shrink-0" />,
          label: 'Draft',
        };

      // Rejected / Suspended / Dropped
      case 'rejected':
      case 'suspended':
      case 'dropped':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          icon: <XCircle className="h-3 w-3 shrink-0" />,
          label: normalized,
        };

      // Archived / Closed
      case 'archived':
      case 'closed':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
          icon: <Archive className="h-3 w-3 shrink-0" />,
          label: normalized,
        };

      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: <Clock className="h-3 w-3 shrink-0" />,
          label: normalized.replace('_', ' '),
        };
    }
  };

  const { bg, icon, label } = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium capitalize tracking-wide ${bg} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
