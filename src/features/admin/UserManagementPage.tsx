import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Eye,
  Check,
  AlertTriangle,
  FileText,
  FileCheck,
  GraduationCap,
  Briefcase,
  Award,
  Calendar,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import {
  User,
  Role,
  AccountStatus,
  Application,
  TraineeApplicationPayload,
  TrainerApplicationPayload,
  ApplicationEvidenceEntry,
} from '../../domain/types';
import { userService, applicationService } from '../../services';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { Modal } from '../../components/common/Modal';
import { APP_CONFIG } from '../../config/app.config';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Application Review Drawer State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [evidenceVerificationMap, setEvidenceVerificationMap] = useState<Record<number, boolean>>({});
  const [reviewAction, setReviewAction] = useState<'none' | 'needs_info' | 'reject'>('none');
  const [actionNote, setActionNote] = useState('');
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  // Bulk Approve Modal State
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allApps] = await Promise.all([
        userService.getUsers(),
        applicationService.getApplications(),
      ]);
      setUsers(allUsers);
      setApplications(allApps);
    } catch (e) {
      showToast('Failed to load user records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewDrawer = (user: User) => {
    const app = applications.find((a) => a.userId === user.id) || null;
    setSelectedUser(user);
    setSelectedApp(app);
    setReviewAction('none');
    setActionNote('');

    // Pre-populate evidence verification states if trainer
    if (app && app.role === 'trainer') {
      const payload = app.payload as TrainerApplicationPayload;
      const initialMap: Record<number, boolean> = {};
      (payload.evidence || []).forEach((_, idx) => {
        initialMap[idx] = false; // Default is Unverified
      });
      setEvidenceVerificationMap(initialMap);
    }
  };

  const handleApproveApplication = async () => {
    if (!selectedApp || !selectedUser) return;
    setIsProcessingDecision(true);
    try {
      // 1. If trainer, verify any checked evidence rows
      if (selectedApp.role === 'trainer') {
        const payload = selectedApp.payload as TrainerApplicationPayload;
        const profile = await userService.getTrainerProfile(selectedUser.id);
        if (profile && profile.evidence) {
          for (let i = 0; i < (payload.evidence || []).length; i++) {
            if (evidenceVerificationMap[i]) {
              const evItem = profile.evidence[i];
              if (evItem) {
                await userService.verifyTrainerEvidence(evItem.id, 'verified', 'user-admin');
              }
            }
          }
        }
      }

      // 2. Decide application as approved
      await applicationService.decideApplication(
        selectedApp.id,
        'approved',
        'Application and credentials approved by administrator.',
        'user-admin'
      );

      showToast(`Approved registration for ${selectedUser.name}!`, 'success');
      setSelectedUser(null);
      setSelectedApp(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Approval failed', 'error');
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedApp || !selectedUser) return;
    if (!actionNote.trim()) {
      showToast('Please provide instructions/note for the applicant.', 'warning');
      return;
    }
    setIsProcessingDecision(true);
    try {
      await applicationService.decideApplication(
        selectedApp.id,
        'needs_info',
        actionNote.trim(),
        'user-admin'
      );
      showToast(`Requested additional info from ${selectedUser.name}`, 'info');
      setSelectedUser(null);
      setSelectedApp(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Action failed', 'error');
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !selectedUser) return;
    if (!actionNote.trim()) {
      showToast('Please specify the reason for rejection.', 'warning');
      return;
    }
    setIsProcessingDecision(true);
    try {
      await applicationService.decideApplication(
        selectedApp.id,
        'rejected',
        actionNote.trim(),
        'user-admin'
      );
      showToast(`Rejected registration for ${selectedUser.name}`, 'info');
      setSelectedUser(null);
      setSelectedApp(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Action failed', 'error');
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleBulkApprove = async () => {
    const pendingList = users.filter((u) => u.status === 'pending');
    for (const u of pendingList) {
      const app = applications.find((a) => a.userId === u.id);
      if (app) {
        await applicationService.decideApplication(app.id, 'approved', 'Bulk approved', 'user-admin');
      } else {
        await userService.updateUserStatus(u.id, 'approved');
      }
    }
    showToast(`Bulk approved ${pendingList.length} pending user applications!`, 'success');
    setIsBulkApproveOpen(false);
    loadData();
  };

  const handleToggleSuspend = async (user: User) => {
    const nextStatus: AccountStatus = user.status === 'suspended' ? 'approved' : 'suspended';
    try {
      await userService.updateUserStatus(user.id, nextStatus);
      showToast(`User status set to ${nextStatus}`, 'info');
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Action failed', 'error');
    }
  };

  const filtered = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingUsers = users.filter((u) => u.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            User Accounts & Approval Queue
          </h1>
          <p className="text-xs text-slate-500">
            Administrative review of registration payloads, evidence verification for trainer matching, and access control.
          </p>
        </div>

        {pendingUsers.length > 0 && (
          <button
            onClick={() => setIsBulkApproveOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Bulk Approve Pending ({pendingUsers.length})</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Roles</option>
          <option value="trainee">Trainees</option>
          <option value="trainer">Trainers</option>
          <option value="admin">Administrators</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All Account Statuses</option>
          <option value="pending">Pending Review ({pendingUsers.length})</option>
          <option value="needs_info">Needs Info</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* User Records Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="p-3.5">User & Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Onboarding</th>
                <th className="p-3.5">Base Centre</th>
                <th className="p-3.5">Application</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((user) => {
                const centre = APP_CONFIG.centres.find((c) => c.id === user.centreId);
                const app = applications.find((a) => a.userId === user.id);
                const isPending = user.status === 'pending';
                const isNeedsInfo = user.status === 'needs_info';

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                      isPending ? 'bg-amber-50/30 dark:bg-amber-950/10' : isNeedsInfo ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={user.status} size="sm" />
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                        {user.onboardingStatus ? user.onboardingStatus.replace('_', ' ') : 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {centre?.name || 'Regional Centre'}
                    </td>
                    <td className="p-3.5">
                      {app ? (
                        <div className="text-[11px]">
                          <span className="font-mono text-teal-600 font-bold">{app.id}</span>
                          <span className="text-slate-400 block">Rev {app.revision}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Direct user</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openReviewDrawer(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-teal-600" />
                          <span>{isPending ? 'Review App' : 'View Details'}</span>
                        </button>

                        {user.role !== 'admin' && user.status !== 'pending' && (
                          <button
                            onClick={() => handleToggleSuspend(user)}
                            className="rounded px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Approve Confirmation Modal */}
      {isBulkApproveOpen && (
        <Modal
          isOpen={isBulkApproveOpen}
          onClose={() => setIsBulkApproveOpen(false)}
          title="Confirm Bulk Approval"
          subtitle={`Approve ${pendingUsers.length} pending registration(s)`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The following pending applicants will be approved immediately and granted permission to sign in and proceed with onboarding:
            </p>

            <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex justify-between items-center text-xs p-1.5 bg-white dark:bg-slate-900 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                    <span className="text-slate-400 text-[10px] block">{u.email}</span>
                  </div>
                  <span className="capitalize text-[10px] font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkApproveOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkApprove}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs"
              >
                Confirm Bulk Approval
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* APPLICATION REVIEW DRAWER / MODAL */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setSelectedApp(null);
          }}
          title={`Review Application: ${selectedUser.name}`}
          subtitle={`Role: ${selectedUser.role.toUpperCase()} • Status: ${selectedUser.status.toUpperCase()} ${
            selectedApp ? `• Ref: ${selectedApp.id} (Rev ${selectedApp.revision})` : ''
          }`}
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Applicant Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Role</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{selectedUser.role}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Submitted Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedApp?.submittedAt ? formatDate(selectedApp.submittedAt) : 'Seed Date'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Current Status</span>
                <StatusBadge status={selectedUser.status} size="sm" />
              </div>
            </div>

            {/* Application Payload details */}
            {selectedApp?.payload ? (
              <div className="space-y-4">
                {/* Qualifications */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                    <span>Academic Qualifications</span>
                  </div>
                  <div className="space-y-1.5">
                    {(selectedApp.payload.qualifications || []).map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-3 text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{q.degree}</div>
                          <div className="text-[11px] text-slate-500">{q.institution} ({q.field})</div>
                        </div>
                        <span className="font-mono text-slate-500 font-bold">{q.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trainee: Skills & Interests */}
                {selectedUser.role === 'trainee' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Award className="h-4 w-4 text-teal-600" />
                      <span>Declared Skills & Interests</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800/40 space-y-2 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {((selectedApp.payload as TraineeApplicationPayload).skills || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-teal-50 dark:bg-teal-950 px-2 py-1 text-[11px] font-semibold text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                          >
                            {s.name} (Lvl {s.level}/4)
                          </span>
                        ))}
                      </div>
                      {((selectedApp.payload as TraineeApplicationPayload).interests || []).length > 0 && (
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <strong>Target Domains:</strong>{' '}
                          {(selectedApp.payload as TraineeApplicationPayload).interests?.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trainer: Declared Competencies & Inline Evidence Verification */}
                {selectedUser.role === 'trainer' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>Declared Competencies & Evidence Verification</span>
                      </div>
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-semibold">
                        Inline Verification for Matcher
                      </span>
                    </div>

                    <div className="space-y-3">
                      {((selectedApp.payload as TrainerApplicationPayload).declaredCompetencies || []).map((comp) => {
                        const compEvList = ((selectedApp?.payload as TrainerApplicationPayload).evidence || []).map((ev, originalIndex) => ({
                          ev,
                          originalIndex,
                        })).filter(({ ev }) => ev.competencyId === comp.id);

                        return (
                          <div
                            key={comp.id}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800/40 space-y-2 text-xs"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{comp.name}</span>
                                <span className="text-slate-400 text-[11px] block">{comp.domain} • Self-rated Level {comp.level}/4</span>
                              </div>
                            </div>

                            {/* Evidence items with Verification Toggles */}
                            {compEvList.length === 0 ? (
                              <div className="text-[11px] text-amber-600 italic bg-amber-50/50 p-2 rounded-lg">
                                No evidence provided. Will default to unverified status in matching.
                              </div>
                            ) : (
                              <div className="space-y-1.5 pt-1">
                                {compEvList.map(({ ev, originalIndex }) => {
                                  const isVerified = !!evidenceVerificationMap[originalIndex];
                                  return (
                                    <div
                                      key={originalIndex}
                                      className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                                        isVerified
                                          ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                                          : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                                      }`}
                                    >
                                      <div>
                                        <div className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                                          {ev.type.replace('_', ' ')} (Count: {ev.count})
                                        </div>
                                        <div className="text-[11px] text-slate-500 italic">"{ev.notes}"</div>
                                      </div>

                                      {/* Inline Toggle */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEvidenceVerificationMap({
                                              ...evidenceVerificationMap,
                                              [originalIndex]: !isVerified,
                                            })
                                          }
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            isVerified
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100'
                                          }`}
                                        >
                                          {isVerified ? '✓ Verified' : 'Mark Verified'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No structured application payload attached for this user record.</p>
            )}

            {/* Inline Action Forms for Request Info or Reject */}
            {reviewAction !== 'none' && (
              <div className="rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    {reviewAction === 'needs_info'
                      ? 'Specify Information Requested from Applicant'
                      : 'Provide Reason for Rejection'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    reviewAction === 'needs_info'
                      ? 'e.g. Please provide supporting certificate scans or clarify previous radar training courses.'
                      : 'e.g. Prerequisite qualifications not met for this operational cadre.'
                  }
                  className="w-full rounded-xl border p-2.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('none')}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingDecision}
                    onClick={reviewAction === 'needs_info' ? handleRequestInfo : handleReject}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white ${
                      reviewAction === 'needs_info' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isProcessingDecision
                      ? 'Saving...'
                      : reviewAction === 'needs_info'
                      ? 'Send Request Note'
                      : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Decision Actions Bar */}
            {reviewAction === 'none' && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedApp && selectedUser.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReviewAction('needs_info')}
                        className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      >
                        Request More Info
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('reject')}
                        className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedApp(null);
                    }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                  {selectedApp && selectedUser.status === 'pending' && (
                    <button
                      type="button"
                      disabled={isProcessingDecision}
                      onClick={handleApproveApplication}
                      className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-sm focus-ring cursor-pointer"
                    >
                      {isProcessingDecision ? 'Processing...' : 'Approve Application'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
