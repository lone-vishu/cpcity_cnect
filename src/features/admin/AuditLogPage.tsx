import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  Clock,
  User,
  Database,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { auditService } from '../../services';
import { AuditEvent } from '../../domain/types';
import { formatDate, exportToCsv } from '../../lib/utils';
import { showToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const AuditLogPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [inspectModal, setInspectModal] = useState<AuditEvent | null>(null);

  useEffect(() => {
    loadAuditEvents();
  }, []);

  const loadAuditEvents = async () => {
    setLoading(true);
    try {
      const logs = await auditService.getAuditEvents();
      // sort latest first
      setEvents(
        [...logs].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      );
    } catch (err) {
      console.error('Failed to load audit events:', err);
      showToast({ title: 'Error', message: 'Failed to load audit records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (events.length === 0) {
      showToast({ title: 'Empty', message: 'No audit records to export', type: 'warning' });
      return;
    }
    const exportData = events.map((e) => ({
      id: e.id,
      timestamp: e.at,
      actor: e.actorId,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      metadata: JSON.stringify(e.meta || {}),
    }));
    exportToCsv(exportData, 'capacity_connect_audit_log');
    showToast({ title: 'Exported', message: 'Audit trail exported to CSV', type: 'success' });
  };

  const filtered = events.filter((ev) => {
    const matchesSearch =
      ev.action.toLowerCase().includes(search.toLowerCase()) ||
      ev.actorId.toLowerCase().includes(search.toLowerCase()) ||
      ev.entityId.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(ev.meta || {}).toLowerCase().includes(search.toLowerCase());

    const matchesEntity = entityFilter === 'all' || ev.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-100 text-navy-800 dark:bg-teal-900/40 dark:text-teal-300">
              Regulatory Audit Trail
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Immutable • {events.length} Events Logged
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            System Audit & Governance Ledger
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Append-only record of administrative approvals, trainer match decisions, course transitions, and certification issuances.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">DPDP Act & Administrative Accountability:</strong>{' '}
          In production environments, this audit stream is replicated to write-once-read-many (WORM) storage. 
          Every administrative override, candidate ranking decision, and status elevation records the actor identity, timestamp, and justification.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action name, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Entity Domains</option>
          <option value="user">User & Account</option>
          <option value="course">Course Lifecycle</option>
          <option value="training_need">Training Need</option>
          <option value="trainer_evidence">Trainer Evidence</option>
          <option value="competency">Competency Taxonomy</option>
          <option value="announcement">Announcements</option>
        </select>
      </div>

      {/* Audit Events Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Timestamp (UTC/IST)</th>
                <th className="p-4">Actor ID / Role</th>
                <th className="p-4">Action Recorded</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-xs">
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(ev.at)}
                  </td>

                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    {ev.actorId}
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-teal-700 dark:text-teal-300">
                      {ev.action}
                    </span>
                  </td>

                  <td className="p-4 text-slate-600 dark:text-slate-400 uppercase">
                    {ev.entityType}
                  </td>

                  <td className="p-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                    {ev.entityId}
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => setInspectModal(ev)}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-sans font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-sans">
              No audit events found matching the search criteria.
            </div>
          )}
        </div>
      </div>

      {/* Inspect Metadata Modal */}
      {inspectModal && (
        <Modal
          isOpen={!!inspectModal}
          onClose={() => setInspectModal(null)}
          title={`Audit Record Inspection: ${inspectModal.action}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Event ID:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{inspectModal.id}</p>
              </div>
              <div>
                <span className="text-slate-500">Timestamp:</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">{formatDate(inspectModal.at)}</p>
              </div>
              <div>
                <span className="text-slate-500">Actor Identity:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{inspectModal.actorId}</p>
              </div>
              <div>
                <span className="text-slate-500">Target Entity:</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">{inspectModal.entityType} / {inspectModal.entityId}</p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contextual Metadata Payload (JSON)
              </span>
              <pre className="p-3 rounded-lg bg-slate-900 text-teal-300 font-mono text-xs overflow-x-auto">
                {JSON.stringify(inspectModal.meta || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
