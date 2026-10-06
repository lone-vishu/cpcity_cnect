import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, Building, Calendar, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { TrainingNeed, Competency } from '../../domain/types';
import { trainingNeedService, competencyService, userService } from '../../services';
import { useToast } from '../../components/common/Toast';
import { formatDate } from '../../lib/utils';
import { APP_CONFIG } from '../../config/app.config';
import { Modal } from '../../components/common/Modal';

export const TrainingNeedsPage: React.FC = () => {
  const { showToast } = useToast();

  const [needs, setNeeds] = useState<TrainingNeed[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [targetCentreId, setTargetCentreId] = useState('centre-pune');
  const [deliveryMode, setDeliveryMode] = useState<'in_person' | 'online' | 'blended'>('blended');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-20');
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);

  const loadData = async () => {
    const [allNeeds, allComps] = await Promise.all([
      trainingNeedService.getNeeds(),
      competencyService.getCompetencies(),
    ]);
    setNeeds(allNeeds);
    setCompetencies(allComps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedCompIds.length === 0) {
      showToast('Please provide a title and at least one competency', 'warning');
      return;
    }

    try {
      await trainingNeedService.createNeed({
        title: title.trim(),
        requiredCompetencyIds: selectedCompIds,
        targetCentreId,
        deliveryMode,
        window: { startDate, endDate },
        createdBy: 'user-admin',
        status: 'open',
      });

      showToast('Training need created! Ready for trainer matching.', 'success');
      setIsCreateModalOpen(false);
      setTitle('');
      setSelectedCompIds([]);
      loadData();
    } catch (err: any) {
      showToast('Failed to create training need', 'error');
    }
  };

  const compMap = new Map(competencies.map((c) => [c.id, c.name]));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Operational Training Needs
          </h1>
          <p className="text-xs text-slate-500">
            Define upcoming capacity-building requirements and match eligible specialist trainers using competency evidence.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Publish New Training Need</span>
        </button>
      </div>

      {/* Needs List */}
      <div className="space-y-4">
        {needs.map((need) => {
          const centre = APP_CONFIG.centres.find((c) => c.id === need.targetCentreId);
          const isMatched = need.status === 'matched';

          return (
            <div
              key={need.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      isMatched
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {need.status}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">• {need.deliveryMode.replace('_', ' ')}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{need.title}</h3>

                {/* Competencies */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {need.requiredCompetencyIds.map((cid) => (
                    <span
                      key={cid}
                      className="rounded bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 text-[11px] font-medium text-teal-800 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50"
                    >
                      {compMap.get(cid) || cid}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>Host: {centre?.name || 'Regional Centre'}</span>
                  <span>•</span>
                  <span>Target Window: {formatDate(need.window.startDate)} – {formatDate(need.window.endDate)}</span>
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0 flex items-center gap-3">
                <Link
                  to={`/admin/needs/${need.id}/match`}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition-transform hover:scale-105 focus-ring"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{isMatched ? 'Review Trainer Match' : 'Run Trainer Match'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Need Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish Training Need"
        subtitle="Specify required competencies and delivery window for trainer discovery"
      >
        <form onSubmit={handleCreateNeed} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Requirement Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Urgent Aviation Meteorological TAF Refresher"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Target Centre</label>
              <select
                value={targetCentreId}
                onChange={(e) => setTargetCentreId(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
              >
                {APP_CONFIG.centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Delivery Format</label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as any)}
                className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="blended">Blended Learning</option>
                <option value="in_person">In-Person Only</option>
                <option value="online">Online Virtual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Window Start</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Window End</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Select Required WMO Competencies
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border rounded-xl p-2.5 dark:border-slate-800 text-xs">
              {competencies.map((comp) => {
                const isChecked = selectedCompIds.includes(comp.id);
                return (
                  <label key={comp.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer rounded">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) setSelectedCompIds(selectedCompIds.filter((id) => id !== comp.id));
                        else setSelectedCompIds([...selectedCompIds, comp.id]);
                      }}
                      className="text-teal-600 rounded"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {comp.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              Save Need
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
