import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileCheck,
  Check,
  Plus,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { onboardingService, userService } from '../../services';
import { APP_CONFIG } from '../../config/app.config';
import { TrainerApplicationPayload, TrainerProfile, TrainerEvidence } from '../../domain/types';
import { useToast } from '../../components/common/Toast';

const STEPS = [
  { id: 1, name: 'Welcome', icon: Sparkles },
  { id: 2, name: 'Confirm Profile', icon: GraduationCap },
  { id: 3, name: 'Evidence Status', icon: FileCheck },
  { id: 4, name: 'Availability', icon: Calendar },
  { id: 5, name: 'Bio & Modes', icon: Layers },
  { id: 6, name: 'Ready to Teach', icon: CheckCircle2 },
];

export const TrainerOnboardingPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(currentUser?.onboardingStep || 1);
  const [loading, setLoading] = useState(true);

  // Pre-filled from approved application & trainer profile
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [declaredCompetencies, setDeclaredCompetencies] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<TrainerEvidence[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [bio, setBio] = useState('Senior meteorologist and specialist trainer with expertise in operational forecasting and radar analysis.');
  const [deliveryModes, setDeliveryModes] = useState<string[]>(['in_person', 'blended']);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.status !== 'approved' || currentUser.role !== 'trainer') {
      navigate('/trainer/dashboard');
      return;
    }
    if (currentUser.onboardingStatus === 'complete') {
      navigate('/trainer/dashboard');
      return;
    }

    Promise.all([
      onboardingService.getApplicationForUser(currentUser.id),
      userService.getTrainerProfile(currentUser.id),
    ]).then(([app, profile]) => {
      if (app && app.payload) {
        const p = app.payload as TrainerApplicationPayload;
        setQualifications(p.qualifications || []);
        setDeclaredCompetencies(p.declaredCompetencies || []);
        if (p.availability) setAvailability(p.availability);
        if (p.deliveryModes) setDeliveryModes(p.deliveryModes);
      }
      if (profile) {
        if (profile.bio) setBio(profile.bio);
        if (profile.evidence) setEvidenceList(profile.evidence);
      }
      setLoading(false);
    });
  }, [currentUser, navigate]);

  const handleStepChange = async (nextStep: number) => {
    if (currentUser) {
      await onboardingService.updateOnboarding(currentUser.id, 'in_progress', nextStep);
    }
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishOnboarding = async () => {
    if (!currentUser) return;
    try {
      // 1. Update Trainer Profile
      await userService.updateTrainerProfile(currentUser.id, {
        bio,
      });

      // 2. Set onboardingStatus = complete
      await onboardingService.updateOnboarding(currentUser.id, 'complete');
      await refreshUser();
      showToast('Trainer onboarding complete! Welcome to your instructor workspace.', 'success');
      navigate('/trainer/dashboard', { replace: true });
    } catch (e: any) {
      showToast(e.message || 'Failed to complete onboarding', 'error');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const centre = APP_CONFIG.centres.find((c) => c.id === currentUser.centreId);
  const verifiedEvidenceCount = evidenceList.filter(
    (e) => e.status === 'verified' || e.verifiedStatus === 'verified'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Trainer Orientation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Specialist Trainer First-Login Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Confirm your verified competency profile, evidence status, and upcoming cohort availability.
          </p>
        </div>

        {/* Step Indicator */}
        <nav aria-label="Onboarding Steps" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <ol className="flex items-center justify-between">
            {STEPS.map((s) => {
              const isDone = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              return (
                <li
                  key={s.id}
                  className="flex-1 flex flex-col items-center"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-2 border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1.5 hidden sm:block ${
                      isCurrent ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {s.name}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Content Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Approved Specialist Trainer Profile
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Welcome to the Faculty Network, {currentUser.name}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your credentials and declared competencies have been approved by the platform administration. You are now eligible to be matched for accredited training courses.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Competency Mapping</span>
                  <p className="text-[11px] text-slate-500">
                    Your declared competencies directly feed into the deterministic trainer matching algorithm.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Evidence Verification</span>
                  <p className="text-[11px] text-slate-500">
                    Administrator-verified evidence carries full weight during matching for training needs.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Cohort Operations</span>
                  <p className="text-[11px] text-slate-500">
                    Manage trainees, upload lecture media, and author examination questionnaires.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIRM PROFILE & COMPETENCIES */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Profile & Competencies</h2>
                <p className="text-xs text-slate-500">
                  Pre-filled from your approved registration.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Declared Competencies & Proficiency Levels
                </span>
                <div className="space-y-2">
                  {declaredCompetencies.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{comp.name}</div>
                        <div className="text-[11px] text-slate-400">{comp.domain}</div>
                      </div>
                      <span className="rounded-lg bg-blue-100 dark:bg-blue-950 px-2.5 py-1 text-xs font-bold text-blue-800 dark:text-blue-300">
                        Level {comp.level} / 4
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EVIDENCE STATUS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Competency Evidence Status</h2>
                <p className="text-xs text-slate-500">
                  Review the administrative verification status of your supporting evidence entries.
                </p>
              </div>

              {/* Explanatory callout */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>How Evidence Affects Matching</span>
                </div>
                <p className="text-blue-800 dark:text-blue-300/80 leading-relaxed">
                  Competencies supported by <strong>Verified</strong> evidence receive 100% factor weight in the explainable matching algorithm. Unverified evidence receives 50% discount until reviewed by an administrator.
                </p>
              </div>

              {/* Evidence table */}
              <div className="space-y-3">
                {declaredCompetencies.map((comp) => {
                  const compEvidence = evidenceList.filter((e) => e.competencyId === comp.id);
                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                        <span>{comp.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {compEvidence.length} evidence entry(s)
                        </span>
                      </div>

                      {compEvidence.length === 0 ? (
                        <span className="text-amber-600 italic block text-[11px]">
                          No evidence attached during registration.
                        </span>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          {compEvidence.map((ev) => (
                            <div
                              key={ev.id}
                              className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs"
                            >
                              <div>
                                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                                  {ev.type.replace('_', ' ')}: {ev.title || ev.sourceNote || `${ev.type} evidence`}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  {ev.details || `${ev.count ? `Count: ${ev.count} | ` : ''}${ev.years ? `Years: ${ev.years} | ` : ''}${ev.sourceNote || ''}`}
                                </span>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  (ev.status === 'verified' || ev.verifiedStatus === 'verified')
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {(ev.status === 'verified' || ev.verifiedStatus === 'verified') ? '✓ Verified' : 'Unverified'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: AVAILABILITY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Teaching Availability Windows</h2>
                <p className="text-xs text-slate-500">
                  Confirm the dates when you are available to deliver in-person or virtual training cohorts.
                </p>
              </div>

              <div className="space-y-2">
                {availability.map((av, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-bold">Window #{idx + 1}:</span>
                      <span>From {av.from} to {av.to}</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-[11px]">Confirmed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: BIO & PREFERENCES */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Bio & Instructional Preferences</h2>
                <p className="text-xs text-slate-500">
                  Introduce yourself to trainee cohorts and administrative reviewers.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Trainer Bio & Instructional Summary
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Supported Delivery Modes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {deliveryModes.map((mode) => (
                      <span
                        key={mode}
                        className="rounded-lg bg-blue-100 dark:bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300 capitalize"
                      >
                        {mode.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: FINISH */}
          {currentStep === 6 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Instructor Profile Configured!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  You are now registered in the IMD capacity building trainer directory. Administrators can now match your profile for upcoming course offerings.
                </p>
              </div>

              <div className="max-w-md mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Profile Readiness</span>
                  <span className="text-blue-600">100% Complete</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-full" />
                </div>
                <span className="text-[11px] text-slate-400 block text-center">
                  Competencies, availability, and delivery modes ready for matching.
                </span>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => handleStepChange(currentStep - 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => handleStepChange(currentStep + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md cursor-pointer"
              >
                <span>Go to my dashboard</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
