import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  ShieldCheck,
  Calendar,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  Info,
} from 'lucide-react';
import { TrainerProfile, TrainerEvidence, Competency, AvailabilityWindow } from '../../domain/types';
import { userService, competencyService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';

export const TrainerProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [activeTab, setActiveTab] = useState<'evidence' | 'availability' | 'qualifications'>('evidence');

  // Evidence modal state
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [evidenceType, setEvidenceType] = useState<TrainerEvidence['type']>('certification');
  const [evidenceCount, setEvidenceCount] = useState(1);
  const [evidenceYears, setEvidenceYears] = useState(5);
  const [sourceNote, setSourceNote] = useState('');

  // Availability modal state
  const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
  const [availStart, setAvailStart] = useState('2026-10-01');
  const [availEnd, setAvailEnd] = useState('2026-12-31');
  const [availNotes, setAvailNotes] = useState('');

  const loadProfile = useCallback(async () => {
    if (!currentUser) return;
    const [p, comps] = await Promise.all([
      userService.getTrainerProfile(currentUser.id),
      competencyService.getCompetencies(),
    ]);
    if (p) setProfile(p);
    setCompetencies(comps);
  }, [currentUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const compMap = new Map(competencies.map((c) => [c.id, c.name]));
  const verifiedCount = profile.evidence.filter((e) => e.verifiedStatus === 'verified').length;

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId || !sourceNote.trim()) {
      showToast('Please select competency and provide source citation', 'warning');
      return;
    }

    try {
      await userService.addTrainerEvidence({
        trainerId: profile.userId,
        competencyId: selectedCompId,
        type: evidenceType,
        count: Number(evidenceCount),
        years: Number(evidenceYears),
        sourceNote: sourceNote.trim(),
        verifiedStatus: 'unverified', // unverified initially for admin review queue
      });

      showToast('Competency evidence submitted for administrative review', 'success');
      setIsEvidenceModalOpen(false);
      setSelectedCompId('');
      setSourceNote('');
      loadProfile();
    } catch (err: any) {
      showToast('Failed to add evidence', 'error');
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    const newWindow: AvailabilityWindow = {
      id: `av-${Date.now()}`,
      startDate: availStart,
      endDate: availEnd,
      isAvailable: true,
      notes: availNotes,
    };

    const updated = {
      ...profile,
      availability: [...profile.availability, newWindow],
    };

    await userService.updateTrainerProfile(profile.userId, updated);
    setProfile(updated);
    setIsAvailModalOpen(false);
    setAvailNotes('');
    showToast('Availability window recorded', 'success');
  };

  const handleDeleteAvailability = async (index: number) => {
    const updated = { ...profile };
    updated.availability.splice(index, 1);
    await userService.updateTrainerProfile(profile.userId, updated);
    setProfile(updated);
    showToast('Availability slot removed', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Specialist Trainer Competency Profile
          </h1>
          <p className="text-xs text-slate-500">
            Maintain your verified competency credentials, availability calendar, and qualifications for trainer matching.
          </p>
        </div>

        {/* Evidence Status Pill */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-900/60 dark:bg-teal-950/20 flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Match Evidence Index</div>
            <div className="text-sm font-bold text-teal-700 dark:text-teal-300">
              {verifiedCount} Verified / {profile.evidence.length} Total
            </div>
          </div>
          <ShieldCheck className="h-6 w-6 text-teal-600 shrink-0" />
        </div>
      </div>

      {/* Explanatory Banner regarding Match Engine */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>How Evidence Affects Trainer Matching:</strong> The Capacity Connect matching engine compares course competency requirements against your verified credentials. Unverified evidence receives 50% partial credit, and missing availability slots flag a scheduling warning during administrator review.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold capitalize border-b-2 transition-all ${
            activeTab === 'evidence'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Competency Evidence ({profile.evidence.length})
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold capitalize border-b-2 transition-all ${
            activeTab === 'availability'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Availability Calendar ({profile.availability.length})
        </button>
        <button
          onClick={() => setActiveTab('qualifications')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold capitalize border-b-2 transition-all ${
            activeTab === 'qualifications'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Biography & Qualifications
        </button>
      </div>

      {/* Tab 1: Evidence Table */}
      {activeTab === 'evidence' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Recorded Competency Evidence</h3>
              <p className="text-xs text-slate-500">Supporting certifications, delivered courses, and publications.</p>
            </div>
            <button
              onClick={() => setIsEvidenceModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Competency Evidence</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:border-slate-700">
                <tr>
                  <th className="p-3">Competency</th>
                  <th className="p-3">Evidence Type</th>
                  <th className="p-3">Count / Years</th>
                  <th className="p-3">Source Citation</th>
                  <th className="p-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {profile.evidence.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-xs">
                      {compMap.get(ev.competencyId) || ev.competencyId}
                    </td>
                    <td className="p-3 capitalize text-slate-600 dark:text-slate-400">
                      {ev.type.replace('_', ' ')}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {ev.count} session(s) • {ev.years} yr(s)
                    </td>
                    <td className="p-3 text-slate-500 max-w-sm truncate" title={ev.sourceNote}>
                      {ev.sourceNote}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={ev.verifiedStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Availability */}
      {activeTab === 'availability' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Availability Windows</h3>
              <p className="text-xs text-slate-500">Specify dates when you are free or blocked for course delivery.</p>
            </div>
            <button
              onClick={() => setIsAvailModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Date Window</span>
            </button>
          </div>

          <div className="space-y-3">
            {profile.availability.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No availability slots recorded.</p>
            ) : (
              profile.availability.map((av, index) => (
                <div
                  key={av.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {formatDate(av.startDate)} – {formatDate(av.endDate)}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          av.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {av.isAvailable ? 'Available' : 'Blocked'}
                      </span>
                    </div>
                    {av.notes && <p className="text-xs text-slate-500">{av.notes}</p>}
                  </div>

                  <button
                    onClick={() => handleDeleteAvailability(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                    title="Remove Slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Qualifications */}
      {activeTab === 'qualifications' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Biography & Credentials</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Faculty Bio
              </label>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                {profile.bio}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Academic Degrees & Fellowships
              </label>
              <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                {profile.qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title="Add Competency Evidence"
        subtitle="Submit credentials for administrative verification"
      >
        <form onSubmit={handleAddEvidence} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Select Competency</label>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              required
            >
              <option value="">Select WMO Competency...</option>
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Level {c.level})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Evidence Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as any)}
                className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="certification">Certification</option>
                <option value="delivered_course">Delivered Course</option>
                <option value="qualification">Academic Qualification</option>
                <option value="publication">Peer-Reviewed Publication</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Years of Practice</label>
              <input
                type="number"
                min="0"
                value={evidenceYears}
                onChange={(e) => setEvidenceYears(Number(e.target.value))}
                className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Source Note / Reference Citation
            </label>
            <textarea
              rows={3}
              required
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              placeholder="e.g. WMO Doppler Radar Specialist Certification 2022 or Course Coordinator DWR Series"
              className="w-full rounded-xl border p-2.5 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEvidenceModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Submit for Admin Review
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Availability Modal */}
      <Modal
        isOpen={isAvailModalOpen}
        onClose={() => setIsAvailModalOpen(false)}
        title="Record Availability Window"
      >
        <form onSubmit={handleAddAvailability} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Start Date</label>
              <input
                type="date"
                required
                value={availStart}
                onChange={(e) => setAvailStart(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Date</label>
              <input
                type="date"
                required
                value={availEnd}
                onChange={(e) => setAvailEnd(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Notes / Operational Duties</label>
            <input
              type="text"
              value={availNotes}
              onChange={(e) => setAvailNotes(e.target.value)}
              placeholder="e.g. Free for afternoon lecture slots"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAvailModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Save Window
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
