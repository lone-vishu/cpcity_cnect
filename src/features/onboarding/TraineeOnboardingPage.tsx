import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Bell,
  Award,
  Briefcase,
  Check,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { onboardingService, competencyService, userService } from '../../services';
import { APP_CONFIG } from '../../config/app.config';
import { Competency, TraineeApplicationPayload, TraineeProfile } from '../../domain/types';
import { useToast } from '../../components/common/Toast';

const STEPS = [
  { id: 1, name: 'Welcome', icon: Sparkles },
  { id: 2, name: 'Confirm Profile', icon: GraduationCap },
  { id: 3, name: 'Learning Goals', icon: BookOpen },
  { id: 4, name: 'Ready to Learn', icon: CheckCircle2 },
];

export const TraineeOnboardingPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(currentUser?.onboardingStep || 1);
  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState<Competency[]>([]);

  // Pre-filled data from application
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  // Section confirmations
  const [confirmedSections, setConfirmedSections] = useState({
    qualifications: false,
    experience: false,
    skills: false,
    certificates: false,
  });

  // Learning Goals
  const [targetCompetencies, setTargetCompetencies] = useState<string[]>([]);
  const [preferredMode, setPreferredMode] = useState<'in_person' | 'online' | 'blended'>('blended');
  const [notifyAssessments, setNotifyAssessments] = useState(true);
  const [notifyCohort, setNotifyCohort] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.status !== 'approved' || currentUser.role !== 'trainee') {
      navigate('/trainee/dashboard');
      return;
    }
    if (currentUser.onboardingStatus === 'complete') {
      navigate('/trainee/dashboard');
      return;
    }

    // Load application payload and competencies
    Promise.all([
      onboardingService.getApplicationForUser(currentUser.id),
      userService.getTraineeProfile(currentUser.id),
      competencyService.getCompetencies(),
    ]).then(([app, profile, compList]) => {
      setCompetencies(compList);
      if (app && app.payload) {
        const p = app.payload as TraineeApplicationPayload;
        setQualifications(p.qualifications || []);
        setExperience(p.experience || []);
        setSkills(p.skills || []);
        setCertificates(p.certificates || []);
        if (p.interests && p.interests.length > 0) {
          // Match interests to competencies
          const matchingCompIds = compList
            .filter((c) => p.interests?.some((i) => c.domain.toLowerCase().includes(i.toLowerCase())))
            .map((c) => c.id);
          setTargetCompetencies(matchingCompIds.slice(0, 3));
        }
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
      // 1. Sync updated profile goals to trainee profile
      await userService.updateTraineeProfile(currentUser.id, {
        interests: targetCompetencies,
      });

      // 2. Set onboardingStatus = complete
      await onboardingService.updateOnboarding(currentUser.id, 'complete');
      await refreshUser();
      showToast('Onboarding complete! Welcome to your learning dashboard.', 'success');
      navigate('/trainee/dashboard', { replace: true });
    } catch (e: any) {
      showToast(e.message || 'Failed to complete onboarding', 'error');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const centre = APP_CONFIG.centres.find((c) => c.id === currentUser.centreId);

  // Profile completeness calculation
  let score = 50;
  if (confirmedSections.qualifications) score += 15;
  if (confirmedSections.skills) score += 15;
  if (targetCompetencies.length > 0) score += 20;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-950/60 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Welcome to Capacity Connect</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Trainee Orientation & First-Login Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Confirm your registered qualifications and establish your initial meteorological training goals.
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
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-2 border-teal-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1.5 hidden sm:block ${
                      isCurrent ? 'text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {s.name}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 p-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Approved Trainee Profile
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Welcome aboard, {currentUser.name}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your registration application has been reviewed and approved by the IMD Training Centre Officer for{' '}
                  <strong>{centre?.name || 'Regional Training Centre'}</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  What to expect in 3 short steps:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-xs font-bold">
                      1
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Confirm Data</h4>
                    <p className="text-[11px] text-slate-500">
                      We pre-filled your qualifications and skills from your application. Simply confirm or fine-tune them.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-xs font-bold">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Learning Goals</h4>
                    <p className="text-[11px] text-slate-500">
                      Pick your target competency domains to receive priority recommendations on accredited training cohorts.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 text-xs font-bold">
                      3
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Start Learning</h4>
                    <p className="text-[11px] text-slate-500">
                      Access course materials, participate in MCQ examinations, and generate demo completion certificates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIRM PROFILE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Your Profile Information</h2>
                <p className="text-xs text-slate-500">
                  Pre-filled from your approved registration. Please explicitly confirm each section.
                </p>
              </div>

              {/* Qualifications confirmation */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                    <span>Qualifications ({qualifications.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmedSections({
                        ...confirmedSections,
                        qualifications: !confirmedSections.qualifications,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      confirmedSections.qualifications
                        ? 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{confirmedSections.qualifications ? 'Looks Good ✓' : 'Confirm'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {qualifications.map((q, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{q.degree}</span>
                        <span className="text-slate-400 block text-[11px]">{q.institution} ({q.field})</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">{q.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills confirmation */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span>Declared Skills ({skills.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmedSections({
                        ...confirmedSections,
                        skills: !confirmedSections.skills,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      confirmedSections.skills
                        ? 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{confirmedSections.skills ? 'Looks Good ✓' : 'Confirm'}</span>
                  </button>
                </div>

                {skills.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-700">
                    No skills declared. You can declare new competencies in Step 3!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-xs font-medium text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800"
                      >
                        {s.name} • Level {s.level}/4
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: LEARNING GOALS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Target Competency Goals</h2>
                <p className="text-xs text-slate-500">
                  Select which IMD competency domains you are aiming to develop in your current posting.
                </p>
              </div>

              {/* Target competencies picker */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select Target Competencies
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {competencies.map((comp) => {
                    const isSelected = targetCompetencies.includes(comp.id);
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTargetCompetencies(targetCompetencies.filter((id) => id !== comp.id));
                          } else {
                            setTargetCompetencies([...targetCompetencies, comp.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{comp.name}</div>
                          <div className="text-[10px] text-slate-400">{comp.domain}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery mode & Notifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Preferred Mode
                  </label>
                  <select
                    value={preferredMode}
                    onChange={(e) => setPreferredMode(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="blended">Blended (Classroom + Labs)</option>
                    <option value="in_person">In-Person at Regional Centre</option>
                    <option value="online">Virtual / Online Self-Paced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    In-App Notification Preferences
                  </label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyCohort}
                        onChange={(e) => setNotifyCohort(e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <span>Upcoming Course Cohort Alerts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyAssessments}
                        onChange={(e) => setNotifyAssessments(e.target.checked)}
                        className="rounded text-teal-600"
                      />
                      <span>Examination & Certificate Updates</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FINISH */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 border border-teal-200 dark:border-teal-800">
                <Award className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  You're all set to begin!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Your learning profile has been verified and configured for {centre?.name || 'IMD Training'}.
                </p>
              </div>

              {/* Profile Completeness Meter */}
              <div className="max-w-md mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2 text-left">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Profile Completeness</span>
                  <span className="text-teal-600">{score}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block text-center">
                  All mandatory onboarding criteria fulfilled.
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

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => handleStepChange(currentStep + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-all shadow-md cursor-pointer"
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
