import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { userService, competencyService, auditService } from '../../services';
import { TrainerEvidence, Competency, User } from '../../domain/types';
import { useAuth } from '../../auth/AuthContext';
import { showToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

interface EvidenceItemWithTrainer {
  evidence: TrainerEvidence;
  trainer: User;
}

export const EvidenceVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const [evidenceList, setEvidenceList] = useState<EvidenceItemWithTrainer[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unverified' | 'verified'>('unverified');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Action Modals
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    item: EvidenceItemWithTrainer | null;
    reason: string;
  }>({
    open: false,
    item: null,
    reason: '',
  });

  const [requestInfoModal, setRequestInfoModal] = useState<{
    open: boolean;
    item: EvidenceItemWithTrainer | null;
    note: string;
  }>({
    open: false,
    item: null,
    note: '',
  });

  useEffect(() => {
    loadEvidenceQueue();
  }, []);

  const loadEvidenceQueue = async () => {
    setLoading(true);
    try {
      const [allCompetencies, trainers] = await Promise.all([
        competencyService.getCompetencies(),
        userService.getAllTrainersWithProfiles(),
      ]);

      setCompetencies(allCompetencies);

      const items: EvidenceItemWithTrainer[] = [];
      for (const t of trainers) {
        for (const ev of t.profile.evidence || []) {
          items.push({
            evidence: ev,
            trainer: t.user,
          });
        }
      }

      setEvidenceList(items);
    } catch (err) {
      console.error('Failed to load evidence queue:', err);
      showToast({ title: 'Error', message: 'Failed to load verification queue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (item: EvidenceItemWithTrainer) => {
    try {
      await userService.verifyTrainerEvidence(
        item.evidence.id,
        'verified',
        user?.id || 'admin'
      );

      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: 'evidence_verified',
        entityType: 'trainer_evidence',
        entityId: item.evidence.id,
        meta: {
          trainerId: item.trainer.id,
          trainerName: item.trainer.name,
          competencyId: item.evidence.competencyId,
          type: item.evidence.type,
        },
      });

      showToast({
        title: 'Evidence Verified',
        message: `Verified ${item.evidence.type.replace('_', ' ')} for ${item.trainer.name}. Match credit now 100%.`,
        type: 'success',
      });

      loadEvidenceQueue();
    } catch (err) {
      showToast({ title: 'Action Failed', message: 'Could not verify evidence', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!rejectModal.item) return;
    try {
      await userService.verifyTrainerEvidence(
        rejectModal.item.evidence.id,
        'unverified',
        user?.id || 'admin'
      );

      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: 'evidence_rejected',
        entityType: 'trainer_evidence',
        entityId: rejectModal.item.evidence.id,
        meta: {
          trainerId: rejectModal.item.trainer.id,
          reason: rejectModal.reason,
        },
      });

      showToast({
        title: 'Evidence Rejected',
        message: 'Evidence rejected with administrative notification note',
        type: 'info',
      });

      setRejectModal({ open: false, item: null, reason: '' });
      loadEvidenceQueue();
    } catch (err) {
      showToast({ title: 'Error', message: 'Could not process rejection', type: 'error' });
    }
  };

  const handleSendInfoRequest = async () => {
    if (!requestInfoModal.item) return;
    await auditService.logAuditEvent({
      actorId: user?.id || 'admin',
      action: 'evidence_info_requested',
      entityType: 'trainer_evidence',
      entityId: requestInfoModal.item.evidence.id,
      meta: {
        trainerId: requestInfoModal.item.trainer.id,
        note: requestInfoModal.note,
      },
    });

    showToast({
      title: 'Info Requested',
      message: `Clarification request sent to ${requestInfoModal.item.trainer.name}`,
      type: 'info',
    });

    setRequestInfoModal({ open: false, item: null, note: '' });
  };

  const getCompetencyName = (compId: string) => {
    return competencies.find((c) => c.id === compId)?.name || compId;
  };

  const pendingCount = evidenceList.filter((e) => e.evidence.verifiedStatus === 'unverified').length;
  const verifiedCount = evidenceList.filter((e) => e.evidence.verifiedStatus === 'verified').length;

  const filtered = evidenceList.filter((item) => {
    const compName = getCompetencyName(item.evidence.competencyId);
    const matchesSearch =
      item.trainer.name.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase()) ||
      (item.evidence.sourceNote || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : item.evidence.verifiedStatus === statusFilter;

    const matchesType = typeFilter === 'all' ? true : item.evidence.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Governance & Verification Queue
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {pendingCount} Pending Items
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Faculty Competency Evidence Verification
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Audit and confirm credentials, prior course deliveries, and specialized certifications before awarding full matching credit.
          </p>
        </div>
      </div>

      {/* Verification Rule Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Matching Integrity Policy:</strong>{' '}
          Unverified evidence items only receive 50% factor weight during algorithmic matching and generate audit review flags.
          Upon administrator verification, full 100% weight is unlocked. All verification actions are logged in the tamper-evident audit ledger.
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by faculty name, competency, or source note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="unverified">Pending Review ({pendingCount})</option>
            <option value="verified">Verified ({verifiedCount})</option>
            <option value="all">All Records ({evidenceList.length})</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Evidence Types</option>
            <option value="delivered_course">Delivered Courses</option>
            <option value="certification">Certifications</option>
            <option value="qualification">Academic Qualifications</option>
            <option value="publication">Publications</option>
          </select>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Faculty Member</th>
                <th className="p-4">Competency Claimed</th>
                <th className="p-4">Evidence Type & Volume</th>
                <th className="p-4">Documentation / Source</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((item) => (
                <tr key={item.evidence.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {item.trainer.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {item.trainer.email}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {getCompetencyName(item.evidence.competencyId)}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="text-xs font-semibold capitalize text-teal-700 dark:text-teal-400">
                      {item.evidence.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {item.evidence.count} session(s) • {item.evidence.years} yr(s) exp
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                      {item.evidence.sourceNote || 'Self-attested documentation'}
                    </div>
                  </td>

                  <td className="p-4">
                    {item.evidence.verifiedStatus === 'verified' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified (100% Weight)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Pending Admin Review (50%)
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right space-x-2">
                    {item.evidence.verifiedStatus === 'unverified' ? (
                      <>
                        <button
                          onClick={() => handleVerify(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                        >
                          Verify & Grant 100%
                        </button>
                        <button
                          onClick={() => setRequestInfoModal({ open: true, item, note: 'Please provide certified completion transcript or institutional dispatch order.' })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                        >
                          Request Info
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, item, reason: '' })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Audited</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No evidence records found in the queue matching the criteria.
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <Modal
          isOpen={rejectModal.open}
          onClose={() => setRejectModal({ open: false, item: null, reason: '' })}
          title="Reject Evidence Submission"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              State the reason for rejecting this competency evidence submission.
            </p>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="e.g. Insufficient documentation or certificate validity expired..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setRejectModal({ open: false, item: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Info Modal */}
      {requestInfoModal.open && (
        <Modal
          isOpen={requestInfoModal.open}
          onClose={() => setRequestInfoModal({ open: false, item: null, note: '' })}
          title="Request Evidence Clarification"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Compose a clarification request for faculty member {requestInfoModal.item?.trainer.name}:
            </p>
            <textarea
              rows={3}
              value={requestInfoModal.note}
              onChange={(e) => setRequestInfoModal({ ...requestInfoModal, note: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setRequestInfoModal({ open: false, item: null, note: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInfoRequest}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                Send Request
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
