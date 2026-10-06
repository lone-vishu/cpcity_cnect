import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Flag,
  RotateCcw,
  Palette,
  Network,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Server,
  Key,
} from 'lucide-react';
import { APP_CONFIG, MatchingWeightsConfig } from '../../config/app.config';
import { systemService, auditService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { showToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();

  // Active section
  const [activeSection, setActiveSection] = useState<'weights' | 'flags' | 'branding' | 'integrations' | 'danger'>('weights');

  // Weights state
  const [weights, setWeights] = useState<MatchingWeightsConfig>({
    ...APP_CONFIG.matching.defaultWeights,
  });

  // Feature flags state
  const [flags, setFlags] = useState({
    ...APP_CONFIG.featureFlags,
    simulateLatency: true,
    simulateErrors: false,
    enableSelfEnrollment: true,
  });

  // Reset Demo Data Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSaveWeights = async () => {
    // In mock adapter, this can persist to localStorage config
    await auditService.logAuditEvent({
      actorId: user?.id || 'admin',
      action: 'matching_weights_configured',
      entityType: 'system_settings',
      entityId: 'matching_weights',
      meta: { newWeights: weights },
    });
    showToast({ title: 'Weights Saved', message: 'Default trainer matching weights updated', type: 'success' });
  };

  const handleToggleFlag = (key: string) => {
    setFlags((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
    showToast({ title: 'Feature Flag Updated', message: `Setting "${key}" changed`, type: 'info' });
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await systemService.resetDatabase();
      showToast({
        title: 'Demo Data Restored',
        message: 'All courses, enrollments, users, and audit records reset to initial seed data.',
        type: 'success',
      });
      setResetModalOpen(false);
      // Reload page after brief pause
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1000);
    } catch (err) {
      console.error('Reset error:', err);
      showToast({ title: 'Reset Error', message: 'Failed to reset seed data', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            System Administration
          </span>
          <span className="text-xs text-slate-500 font-mono">Configurable Core</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Platform Configuration & Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage matching parameters, toggles, external integration boundaries, and demo state.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('weights')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeSection === 'weights'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Default Matching Weights
        </button>

        <button
          onClick={() => setActiveSection('flags')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeSection === 'flags'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Flag className="w-4 h-4" />
          Feature Flags
        </button>

        <button
          onClick={() => setActiveSection('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeSection === 'branding'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Palette className="w-4 h-4" />
          Branding & Identity
        </button>

        <button
          onClick={() => setActiveSection('integrations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeSection === 'integrations'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Network className="w-4 h-4" />
          System Integrations
        </button>

        <button
          onClick={() => setActiveSection('danger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeSection === 'danger'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Reset Demo Data
        </button>
      </div>

      {/* 1. Default Matching Weights */}
      {activeSection === 'weights' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-6">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                Default Trainer Matching Algorithm Weights
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Demo weights, not IMD policy. These baseline parameters initialize the trainer recommendation engine across all courses and training needs.
              </p>
            </div>
            <button
              onClick={() => setWeights({ ...APP_CONFIG.matching.defaultWeights })}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span>Competency Overlap Weight</span>
                <span className="font-mono text-teal-600 font-bold">{weights.competencyOverlap}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.competencyOverlap}
                onChange={(e) =>
                  setWeights({ ...weights, competencyOverlap: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-teal-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Awards credit based on certified competency evidence portfolios.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span>Qualifications & Certifications Weight</span>
                <span className="font-mono text-teal-600 font-bold">{weights.qualificationRelevance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.qualificationRelevance}
                onChange={(e) =>
                  setWeights({ ...weights, qualificationRelevance: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-teal-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Recognizes accredited meteorological diplomas and postgraduate degrees.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span>Prior Relevant Course Delivery Weight</span>
                <span className="font-mono text-teal-600 font-bold">{weights.priorDelivery}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.priorDelivery}
                onChange={(e) =>
                  setWeights({ ...weights, priorDelivery: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-teal-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Measures practical classroom instruction experience and lecture hours.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span>Availability & Centre Fit Weight</span>
                <span className="font-mono text-teal-600 font-bold">{weights.availabilityCentreFit}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.availabilityCentreFit}
                onChange={(e) =>
                  setWeights({ ...weights, availabilityCentreFit: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-teal-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Regional co-location with venue and conflict-free calendar windows.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              onClick={handleSaveWeights}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
            >
              Save Default Scoring Parameters
            </button>
          </div>
        </div>
      )}

      {/* 2. Feature Flags */}
      {activeSection === 'flags' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Portal Feature Flags
          </h2>
          <p className="text-xs text-slate-500">
            Control prototype capabilities dynamically without redeployment.
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Demo Certificates Issuance
                </span>
                <p className="text-xs text-slate-500">
                  Allows trainees meeting completion rules to download PDF certificates watermarked "DEMO".
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.enableCertificates}
                onChange={() => handleToggleFlag('enableCertificates')}
                className="w-4 h-4 rounded text-teal-600"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Persistent Synthetic Data Banner
                </span>
                <p className="text-xs text-slate-500">
                  Enforces continuous honesty banner across top of viewport.
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.showSyntheticBanner}
                onChange={() => handleToggleFlag('showSyntheticBanner')}
                className="w-4 h-4 rounded text-teal-600"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Trainee Self-Enrollment
                </span>
                <p className="text-xs text-slate-500">
                  Allows direct self-enrollment into published courses with open capacity.
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.enableSelfEnrollment}
                onChange={() => handleToggleFlag('enableSelfEnrollment')}
                className="w-4 h-4 rounded text-teal-600"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Simulate Network Latency (200-500ms)
                </span>
                <p className="text-xs text-slate-500">
                  Mock adapter introduces realistic asynchronous delays to test skeleton loaders.
                </p>
              </div>
              <input
                type="checkbox"
                checked={flags.simulateLatency}
                onChange={() => handleToggleFlag('simulateLatency')}
                className="w-4 h-4 rounded text-teal-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Branding & Copy Configuration */}
      {activeSection === 'branding' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Brand Identity & Portal Copy Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Decoupled configuration schema enabling institutional rebranding upon official ministry sanction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Configured Portal Name:</span>
              <p className="font-mono text-sm text-teal-600 font-bold">{APP_CONFIG.branding.name}</p>
              <span className="text-slate-400">Strictly neutral original logotype (No fake emblems)</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sponsor Context:</span>
              <p className="font-mono text-sm text-slate-900 dark:text-white font-bold">{APP_CONFIG.branding.context}</p>
              <span className="text-slate-400">Digital Capacity Building Framework</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2 md:col-span-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Synthetic Disclaimer Banner Text:</span>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{APP_CONFIG.banners.syntheticData}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. External Integrations (Not Connected / Future Interface) */}
      {activeSection === 'integrations' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <p className="font-bold text-sm">Non-Negotiable Honesty Policy: No Claimed Live Integrations</p>
              <p className="mt-0.5">
                All interfaces below represent architectural integration stubs prepared for future deployment. 
                No live connection is made to government infrastructure. All connections require formal sponsor sanction and API credentials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-slate-400" /> IMD Regional HRMS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Future Interface (Not Connected)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Staff postings, centre transfers, and faculty service book synchronization. Requires sponsor approval.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-slate-400" /> iGOT Karmayogi LMS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Future Interface (Not Connected)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cross-departmental civil service competency credits and shared curriculum imports.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-400" /> NIC SSO (Parichay Identity)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Future Interface (Not Connected)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Government e-Sign and multi-factor authentication via Jan Parichay gateway.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-slate-400" /> UNNATI Central Portal
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Future Interface (Not Connected)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ministry-wide scientific progress metrics and collaborative research workshops.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Danger Zone: Reset Demo Data */}
      {activeSection === 'danger' && (
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-base font-bold">Reset Demo Repository to Initial Seed</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Restores the application to its pristine seed benchmark state. All newly created courses, submitted assessments, trainee enrollments, and newly registered accounts will be discarded.
            This ensures the 5-7 minute demonstration script can be repeated cleanly multiple times.
          </p>

          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
          >
            Reset All Demo Data to Seed
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title="Confirm Complete Demo Reset"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to reset all mock databases and local storage to the initial seed state?
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={resetting}
                onClick={handleResetData}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white"
              >
                {resetting ? 'Resetting Seed...' : 'Confirm Reset to Seed'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
