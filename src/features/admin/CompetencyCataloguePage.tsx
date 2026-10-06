import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  Users,
  BookOpen,
  Filter,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { competencyService, courseService, userService, auditService } from '../../services';
import { Competency } from '../../domain/types';
import { useAuth } from '../../auth/AuthContext';
import { showToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const CompetencyCataloguePage: React.FC = () => {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competency | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: 'Aviation Weather Forecasting',
    level: 2 as 1 | 2 | 3 | 4,
    description: '',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'demo' as 'demo' | 'reviewed',
  });

  // Review confirmation modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [targetReviewComp, setTargetReviewComp] = useState<Competency | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compList, courseList, trainerList] = await Promise.all([
        competencyService.getCompetencies(),
        courseService.getCourses(),
        userService.getAllTrainersWithProfiles(),
      ]);
      setCompetencies(compList);
      setCourses(courseList);
      setTrainers(trainerList);
    } catch (err) {
      console.error('Failed to load competencies:', err);
      showToast({ title: 'Error', message: 'Failed to load competency catalogue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getUsageCount = (compId: string) => {
    const courseCount = courses.filter((c) => c.competencyIds?.includes(compId)).length;
    const trainerCount = trainers.filter((t) =>
      t.profile?.evidence?.some((e: any) => e.competencyId === compId)
    ).length;
    return { courseCount, trainerCount };
  };

  const handleOpenAdd = () => {
    setEditingComp(null);
    setFormData({
      name: '',
      domain: 'Radar Meteorology',
      level: 2,
      description: '',
      source: 'Demo taxonomy (WMO-referenced, pending expert review)',
      version: '0.1',
      reviewStatus: 'demo',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (comp: Competency) => {
    setEditingComp(comp);
    setFormData({
      name: comp.name,
      domain: comp.domain,
      level: comp.level,
      description: comp.description,
      source: comp.source,
      version: comp.version,
      reviewStatus: comp.reviewStatus,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      showToast({ title: 'Validation Error', message: 'Name and description are required', type: 'warning' });
      return;
    }

    try {
      if (editingComp) {
        await competencyService.updateCompetency({
          ...editingComp,
          ...formData,
        });
        showToast({ title: 'Updated', message: `Competency "${formData.name}" updated`, type: 'success' });
      } else {
        await competencyService.createCompetency(formData);
        showToast({ title: 'Created', message: `New competency "${formData.name}" added`, type: 'success' });
      }

      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: editingComp ? 'competency_updated' : 'competency_created',
        entityType: 'competency',
        entityId: editingComp?.id || 'new',
        meta: { name: formData.name, domain: formData.domain, level: formData.level },
      });

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save competency:', err);
      showToast({ title: 'Error', message: 'Failed to save competency', type: 'error' });
    }
  };

  const handleConfirmReview = async () => {
    if (!targetReviewComp) return;
    try {
      await competencyService.markAsReviewed(targetReviewComp.id);
      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: 'competency_reviewed',
        entityType: 'competency',
        entityId: targetReviewComp.id,
        meta: { name: targetReviewComp.name, reviewNote },
      });

      showToast({
        title: 'Status Updated',
        message: `Competency marked as Reviewed (WMO baseline verified)`,
        type: 'success',
      });
      setReviewModalOpen(false);
      loadData();
    } catch (err) {
      showToast({ title: 'Error', message: 'Failed to update review status', type: 'error' });
    }
  };

  // Distinct domains
  const domains = Array.from(new Set(competencies.map((c) => c.domain))).sort();

  // Filtered list
  const filtered = competencies.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.domain.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === 'all' || c.domain === domainFilter;
    const matchLevel = levelFilter === 'all' || c.level.toString() === levelFilter;
    const matchStatus = statusFilter === 'all' || c.reviewStatus === statusFilter;
    return matchSearch && matchDomain && matchLevel && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
              WMO Competency Framework
            </span>
            <span className="text-xs text-slate-500">Taxonomy Version 0.1</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Competency Catalogue Management
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Standardized operational competencies driving course curriculum, trainee skill coverage, and trainer matching.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Competency
        </button>
      </div>

      {/* Honesty Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Demo Taxonomy Notice:</strong>{' '}
          All competencies are referenced from standard WMO-No. 49 meteorological personnel guidelines for prototype demonstration. 
          Each item records its canonical <code>source</code> and <code>version</code>. Full deployment requires domain expert committee review.
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search competencies by name, description, or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Domains ({domains.length})</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Skill Levels</option>
            <option value="1">Level 1 - Fundamental</option>
            <option value="2">Level 2 - Operational</option>
            <option value="3">Level 3 - Advanced</option>
            <option value="4">Level 4 - Expert / Lead</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Review States</option>
            <option value="demo">Demo Draft</option>
            <option value="reviewed">Expert Reviewed</option>
          </select>
        </div>
      </div>

      {/* Competencies Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Competency Name & Domain</th>
                <th className="p-4">Proficiency Level</th>
                <th className="p-4">Taxonomy Source</th>
                <th className="p-4">System Usage</th>
                <th className="p-4">Governance Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((comp) => {
                const usage = getUsageCount(comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {comp.name}
                      </div>
                      <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                        {comp.domain}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {comp.description}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Level {comp.level}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                        v{comp.version}
                      </div>
                      <div className="text-[11px] text-slate-400 max-w-xs truncate" title={comp.source}>
                        {comp.source}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1" title="Courses referencing this competency">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {usage.courseCount} courses
                        </span>
                        <span className="flex items-center gap-1" title="Trainers with evidence for this competency">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {usage.trainerCount} trainers
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {comp.reviewStatus === 'reviewed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reviewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Demo Baseline
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {comp.reviewStatus === 'demo' && (
                        <button
                          onClick={() => {
                            setTargetReviewComp(comp);
                            setReviewNote('Verified compliance with WMO Guide to Competency Framework.');
                            setReviewModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          Mark Reviewed
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(comp)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit metadata"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              No competencies match the selected criteria.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Competency Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingComp ? `Edit Competency: ${editingComp.name}` : 'Add New Standard Competency'}
          size="lg"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Competency Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Numerical Weather Prediction Data Assimilation"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain Classification *
                </label>
                <select
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Aviation Weather Forecasting">Aviation Weather Forecasting</option>
                  <option value="Tropical Cyclone Forecasting">Tropical Cyclone Forecasting</option>
                  <option value="Radar Meteorology">Radar Meteorology</option>
                  <option value="Satellite Meteorology">Satellite Meteorology</option>
                  <option value="Numerical Weather Prediction">Numerical Weather Prediction</option>
                  <option value="Meteorological Instruments and Calibration">Meteorological Instruments and Calibration</option>
                  <option value="Agrometeorological Advisory">Agrometeorological Advisory</option>
                  <option value="Climate Data Services">Climate Data Services</option>
                  <option value="Nowcasting">Nowcasting</option>
                  <option value="Public Weather Services">Public Weather Services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proficiency Level *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) as any })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={1}>Level 1 - Fundamental / Entry</option>
                  <option value={2}>Level 2 - Operational Routine</option>
                  <option value={3}>Level 3 - Advanced / Specialist</option>
                  <option value={4}>Level 4 - Lead Expert / Policy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Performance Criteria / Description *
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Specific operational skills, diagnostic standards, and criteria..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Taxonomy Source Standard
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Taxonomy Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
              >
                {editingComp ? 'Save Changes' : 'Create Competency'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Review Status Modal */}
      {reviewModalOpen && targetReviewComp && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Mark Competency as Expert Reviewed`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You are certifying that <strong>{targetReviewComp.name}</strong> (Domain: {targetReviewComp.domain}) 
              has undergone expert domain verification against standard meteorological curriculum standards.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reviewer Evaluation Note
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Confirm Review & Record Audit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
