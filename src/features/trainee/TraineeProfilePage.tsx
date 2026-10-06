import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  Award,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Upload,
  FileCheck,
} from 'lucide-react';
import { TraineeProfile, TraineeCertificate } from '../../domain/types';
import { userService } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const TraineeProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<TraineeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'qualifications' | 'experience' | 'interests' | 'skills' | 'certificates'>('qualifications');

  // Modal states for adding items
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemType, setItemType] = useState<string>('qualification');
  const [inputVal, setInputVal] = useState('');

  // Certificate upload modal state
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState(2025);
  const [certFileName, setCertFileName] = useState('');

  const loadProfile = async () => {
    if (!currentUser) return;
    const p = await userService.getTraineeProfile(currentUser.id);
    if (p) setProfile(p);
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  if (!profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  // Completeness score
  const calculateCompleteness = () => {
    let score = 20; // base designation
    if (profile.qualifications.length > 0) score += 20;
    if (profile.experience.length > 0) score += 20;
    if (profile.interests.length > 0) score += 15;
    if (profile.skills.length > 0) score += 15;
    if (profile.certificates.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleAddItem = async () => {
    if (!inputVal.trim()) return;
    const updated = { ...profile };

    if (itemType === 'qualification') updated.qualifications.push(inputVal.trim());
    else if (itemType === 'experience') updated.experience.push(inputVal.trim());
    else if (itemType === 'interest') updated.interests.push(inputVal.trim());
    else if (itemType === 'skill') updated.skills.push(inputVal.trim());

    await userService.updateTraineeProfile(profile.userId, updated);
    setProfile(updated);
    setInputVal('');
    setIsAddModalOpen(false);
    showToast('Profile updated successfully', 'success');
  };

  const handleDeleteItem = async (type: string, index: number) => {
    const updated = { ...profile };
    if (type === 'qualifications') updated.qualifications.splice(index, 1);
    else if (type === 'experience') updated.experience.splice(index, 1);
    else if (type === 'interests') updated.interests.splice(index, 1);
    else if (type === 'skills') updated.skills.splice(index, 1);
    else if (type === 'certificates') updated.certificates.splice(index, 1);

    await userService.updateTraineeProfile(profile.userId, updated);
    setProfile(updated);
    showToast('Item removed', 'info');
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim() || !certIssuer.trim()) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    const newCert: TraineeCertificate = {
      id: `tc-${Date.now()}`,
      title: certTitle.trim(),
      issuer: certIssuer.trim(),
      issuedYear: Number(certYear),
      fileName: certFileName || 'uploaded_certificate.pdf',
    };

    const updated = { ...profile, certificates: [...profile.certificates, newCert] };
    await userService.updateTraineeProfile(profile.userId, updated);
    setProfile(updated);
    setIsCertModalOpen(false);
    setCertTitle('');
    setCertIssuer('');
    setCertFileName('');
    showToast('Certificate metadata recorded', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Professional Trainee Profile
          </h1>
          <p className="text-xs text-slate-500">
            Manage your meteorological qualifications, experience records, skills, and course certificates.
          </p>
        </div>

        {/* Profile Completeness Pill */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-900/60 dark:bg-teal-950/20 flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Profile Completeness</div>
            <div className="text-sm font-bold text-teal-700 dark:text-teal-300">{completeness}% Complete</div>
          </div>
          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {(
          [
            { id: 'qualifications', label: 'Qualifications', count: profile.qualifications.length },
            { id: 'experience', label: 'Experience', count: profile.experience.length },
            { id: 'interests', label: 'Interests', count: profile.interests.length },
            { id: 'skills', label: 'Skills', count: profile.skills.length },
            { id: 'certificates', label: 'Certificates', count: profile.certificates.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold capitalize border-b-2 whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Top action button */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base capitalize">
            {activeTab}
          </h3>
          {activeTab === 'certificates' ? (
            <button
              onClick={() => setIsCertModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Certificate</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setItemType(
                  activeTab === 'qualifications'
                    ? 'qualification'
                    : activeTab === 'experience'
                    ? 'experience'
                    : activeTab === 'interests'
                    ? 'interest'
                    : 'skill'
                );
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Entry</span>
            </button>
          )}
        </div>

        {/* Content lists */}
        {activeTab === 'certificates' ? (
          profile.certificates.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No certificates uploaded.</p>
          ) : (
            <div className="space-y-3">
              {profile.certificates.map((cert, index) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-teal-600" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {cert.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Issuer: {cert.issuer} • Year: {cert.issuedYear} • File: {cert.fileName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem('certificates', index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {(profile[activeTab] as string[]).length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No entries recorded in this category.</p>
            ) : (
              (profile[activeTab] as string[]).map((val, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">{val}</span>
                  <button
                    onClick={() => handleDeleteItem(activeTab, index)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Title
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. B.Sc. Physics or Numerical Weather Modeling experience"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Save Entry
            </button>
          </div>
        </div>
      </Modal>

      {/* Certificate Upload Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Upload Certificate (Demo Metadata)"
        subtitle="Simulated certificate picker storing document metadata only"
      >
        <form onSubmit={handleAddCertificate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Certificate Title</label>
            <input
              type="text"
              required
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              placeholder="e.g. Basic Meteorological Observers Certificate"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Issuing Institution</label>
            <input
              type="text"
              required
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
              placeholder="e.g. Meteorological Training Institute, Pune"
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Year Issued</label>
            <input
              type="number"
              required
              value={certYear}
              onChange={(e) => setCertYear(Number(e.target.value))}
              className="w-full rounded-xl border p-2 text-xs sm:text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Select File (Demo Picker)</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setCertFileName(e.target.files[0].name);
                }
              }}
              className="w-full rounded-xl border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCertModalOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Save Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
