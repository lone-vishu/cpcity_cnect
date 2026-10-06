import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { authService, applicationService, draftService, competencyService } from '../../services';
import {
  Competency,
  QualificationEntry,
  ExperienceEntry,
  SkillEntry,
  ApplicationCertificateEntry,
  TraineeApplicationPayload,
  RegistrationDraft,
} from '../../domain/types';
import { useToast } from '../../components/common/Toast';

const STEPS = [
  { id: 1, name: 'Account', icon: GraduationCap },
  { id: 2, name: 'Qualifications', icon: GraduationCap },
  { id: 3, name: 'Experience', icon: Briefcase },
  { id: 4, name: 'Skills & Interests', icon: Sparkles },
  { id: 5, name: 'Certificates', icon: Award },
  { id: 6, name: 'Review & Submit', icon: FileCheck },
];

const DOMAINS = [
  'Radar Meteorology & Remote Sensing',
  'Numerical Weather Prediction (NWP)',
  'Satellite Meteorology',
  'Aviation Weather Services',
  'Agrometeorology & Hydrology',
  'Instruments, Sensors & Calibration',
  'Climate Data Analytics & Quality Control',
];

export const TraineeRegistrationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const isResubmit = searchParams.get('resubmit') === 'true';
  const isReapply = searchParams.get('reapply') === 'true';
  const existingAppId = searchParams.get('appId');

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [competencyCatalogue, setCompetencyCatalogue] = useState<Competency[]>([]);
  const [isFresher, setIsFresher] = useState(false);

  // Form State
  const [account, setAccount] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    centreId: 'centre-pune',
    designation: 'Scientific Staff',
    consent: false,
  });

  const [qualifications, setQualifications] = useState<QualificationEntry[]>([
    { degree: '', institution: '', year: new Date().getFullYear().toString(), field: '' },
  ]);

  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customSkillLevel, setCustomSkillLevel] = useState<1 | 2 | 3 | 4>(2);

  const [certificates, setCertificates] = useState<ApplicationCertificateEntry[]>([]);

  // Load competency catalogue
  useEffect(() => {
    competencyService.getCompetencies().then((comps) => setCompetencyCatalogue(comps));
  }, []);

  // Restore existing application if resubmitting or reapplying
  useEffect(() => {
    if ((isResubmit || isReapply) && existingAppId) {
      applicationService.getApplicationById(existingAppId).then((app) => {
        if (app && app.role === 'trainee') {
          const p = app.payload as TraineeApplicationPayload;
          setAccount((prev) => ({
            ...prev,
            designation: p.designation || prev.designation,
          }));
          if (p.qualifications && p.qualifications.length > 0) setQualifications(p.qualifications);
          if (p.experience) {
            setExperience(p.experience);
            if (p.experience.length === 0) setIsFresher(true);
          }
          if (p.skills) setSkills(p.skills);
          if (p.interests) setSelectedInterests(p.interests);
          if (p.certificates) setCertificates(p.certificates);
          showToast(`Loaded details from Revision ${app.revision} for editing`, 'info');
        }
      });
    }
  }, [isResubmit, isReapply, existingAppId, showToast]);

  // Check email draft or restore draft
  const handleEmailBlur = async () => {
    if (!account.email || isResubmit || isReapply) return;

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(account.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailChecking(true);
    try {
      const exists = await authService.emailExists(account.email);
      if (exists) {
        setEmailError('An account with this email address already exists. Please sign in instead.');
      } else {
        setEmailError(null);
        // Check for autosaved draft
        const draft = await draftService.getDraft(account.email, 'trainee');
        if (draft && draft.payload) {
          const p = draft.payload as TraineeApplicationPayload;
          if (p.qualifications) setQualifications(p.qualifications);
          if (p.experience) setExperience(p.experience);
          if (p.skills) setSkills(p.skills);
          if (p.interests) setSelectedInterests(p.interests);
          if (p.certificates) setCertificates(p.certificates);
          if (draft.step) setCurrentStep(draft.step);
          showToast('Restored your autosaved registration draft!', 'info');
        }
      }
    } finally {
      setEmailChecking(false);
    }
  };

  // Autosave draft on step change
  const saveCurrentDraft = async (stepNum: number) => {
    if (!account.email || emailError) return;
    try {
      const payload: TraineeApplicationPayload = {
        designation: account.designation,
        qualifications,
        experience,
        skills,
        interests: selectedInterests,
        certificates,
      };
      const draft: RegistrationDraft = {
        email: account.email,
        role: 'trainee',
        step: stepNum,
        payload,
        updatedAt: new Date().toISOString(),
      };
      await draftService.saveDraft(draft);
    } catch (e) {
      console.warn('Draft autosave error', e);
    }
  };

  // Password strength meter
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-teal-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(account.password);

  // Per-step validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!account.name.trim()) {
        showToast('Please enter your full name.', 'warning');
        return false;
      }
      if (!account.email.trim() || emailError) {
        showToast('Please provide a valid, unique email address.', 'warning');
        return false;
      }
      if (!isResubmit && !isReapply) {
        if (account.password.length < 8) {
          showToast('Password must be at least 8 characters long.', 'warning');
          return false;
        }
        if (account.password !== account.confirmPassword) {
          showToast('Passwords do not match.', 'warning');
          return false;
        }
      }
      if (!account.consent) {
        showToast('Consent to store demo profile data is required.', 'warning');
        return false;
      }
      return true;
    }

    if (step === 2) {
      const valid = qualifications.some((q) => q.degree.trim() && q.institution.trim() && q.field.trim());
      if (!valid) {
        showToast('Please enter at least one valid qualification.', 'warning');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!isFresher && experience.length === 0) {
        showToast('Please add prior experience or toggle "I am a fresher / entry-level".', 'warning');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (skills.length === 0 && selectedInterests.length === 0) {
        showToast('Please select at least one skill or subject interest.', 'warning');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      await saveCurrentDraft(nextStep);
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit Application
  const handleSubmitApplication = async () => {
    if (!validateStep(1) || !validateStep(2)) return;
    setIsSubmitting(true);

    try {
      const payload: TraineeApplicationPayload = {
        designation: account.designation,
        qualifications: qualifications.filter((q) => q.degree.trim()),
        experience: isFresher ? [] : experience,
        skills,
        interests: selectedInterests,
        certificates,
      };

      if ((isResubmit || isReapply) && existingAppId) {
        // Resubmitting existing application
        const updatedApp = await applicationService.resubmitApplication(existingAppId, payload);
        await draftService.deleteDraft(account.email, 'trainee');
        showToast('Application resubmitted successfully!', 'success');
        navigate(`/register/submitted?ref=${updatedApp.id}&email=${encodeURIComponent(account.email)}&role=trainee&resubmit=true`);
        return;
      }

      // Normal new registration
      const newUser = await authService.registerUser({
        name: account.name,
        email: account.email,
        password: account.password,
        role: 'trainee',
        status: 'pending',
        centreId: account.centreId,
        onboardingStatus: 'not_started',
      });

      const application = await applicationService.createApplication({
        userId: newUser.id,
        role: 'trainee',
        revision: 1,
        status: 'submitted',
        payload,
      });

      // Clear autosaved draft
      await draftService.deleteDraft(account.email, 'trainee');

      showToast('Registration submitted for approval!', 'success');
      navigate(
        `/register/submitted?ref=${application.id}&email=${encodeURIComponent(newUser.email)}&role=trainee`
      );
    } catch (err: any) {
      showToast(err.message || 'Submission failed. Please check form data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-950/60 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <GraduationCap className="h-4 w-4" />
            <span>Trainee Registration Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isResubmit ? 'Edit & Resubmit Application' : isReapply ? 'Edit & Reapply' : 'Join as an Operational Trainee'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Provide your academic background, meteorological interests, and competency goals to register for accredited training cohorts.
          </p>
        </div>

        {/* Step Progress Bar */}
        <nav aria-label="Registration Progress" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <ol className="flex items-center justify-between">
            {STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <li
                  key={step.id}
                  className="flex-1 flex flex-col items-center relative"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-2 border-teal-600 dark:border-teal-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1.5 hidden sm:block text-center ${
                      isCurrent
                        ? 'text-teal-700 dark:text-teal-300 font-bold'
                        : isDone
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step Content Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* STEP 1: ACCOUNT */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Details</h2>
                <p className="text-xs text-slate-500">Your core credentials and institutional placement within IMD.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={account.name}
                    onChange={(e) => setAccount({ ...account, name: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official / Demo Email *
                  </label>
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    onBlur={handleEmailBlur}
                    placeholder="e.g. ramesh.imd@capacityconnect.demo"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {emailChecking && <p className="text-[11px] text-teal-600 mt-1">Verifying email availability...</p>}
                  {emailError && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                {!isResubmit && !isReapply && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Password *
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Strength: <span className="font-semibold text-slate-700 dark:text-slate-300">{pwdStrength.label}</span>
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={account.password}
                          onChange={(e) => setAccount({ ...account, password: e.target.value })}
                          placeholder="Min. 8 characters"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-10 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Strength indicator bar */}
                      <div className="mt-1.5 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pwdStrength.color} transition-all duration-300`}
                          style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={account.confirmPassword}
                        onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      {account.confirmPassword && account.password !== account.confirmPassword && (
                        <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Role *
                  </label>
                  <input
                    type="text"
                    value={account.designation}
                    onChange={(e) => setAccount({ ...account, designation: e.target.value })}
                    placeholder="e.g. Scientific Assistant / Meteorologist-A"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base Meteorological Centre *
                  </label>
                  <select
                    value={account.centreId}
                    onChange={(e) => setAccount({ ...account, centreId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {APP_CONFIG.centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consent Box */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={account.consent}
                    onChange={(e) => setAccount({ ...account, consent: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    I consent to the storage and administrative processing of my qualifications and competency profile on the Capacity Connect demonstration platform. I acknowledge this is a prototype environment using synthetic data.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: QUALIFICATIONS */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Educational Qualifications</h2>
                  <p className="text-xs text-slate-500">Add degrees, diplomas, or certifications. At least one required.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQualifications([
                      ...qualifications,
                      { degree: '', institution: '', year: '2024', field: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Row</span>
                </button>
              </div>

              <div className="space-y-4">
                {qualifications.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Qualification #{idx + 1}</span>
                      {qualifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setQualifications(qualifications.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Degree / Credential *
                        </label>
                        <input
                          type="text"
                          value={q.degree}
                          onChange={(e) => {
                            const updated = [...qualifications];
                            updated[idx].degree = e.target.value;
                            setQualifications(updated);
                          }}
                          placeholder="e.g. M.Sc. Meteorology / B.Tech Physics"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Institution / University *
                        </label>
                        <input
                          type="text"
                          value={q.institution}
                          onChange={(e) => {
                            const updated = [...qualifications];
                            updated[idx].institution = e.target.value;
                            setQualifications(updated);
                          }}
                          placeholder="e.g. Pune University / IIT Delhi"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Specialization Field *
                        </label>
                        <input
                          type="text"
                          value={q.field}
                          onChange={(e) => {
                            const updated = [...qualifications];
                            updated[idx].field = e.target.value;
                            setQualifications(updated);
                          }}
                          placeholder="e.g. Atmospheric Science / Remote Sensing"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Completion Year *
                        </label>
                        <input
                          type="text"
                          value={q.year}
                          onChange={(e) => {
                            const updated = [...qualifications];
                            updated[idx].year = e.target.value;
                            setQualifications(updated);
                          }}
                          placeholder="e.g. 2023"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Professional Experience</h2>
                  <p className="text-xs text-slate-500">Record prior operational postings, meteorological observatories, or research roles.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFresher}
                      onChange={(e) => {
                        setIsFresher(e.target.checked);
                        if (e.target.checked) setExperience([]);
                      }}
                      className="rounded text-teal-600"
                    />
                    <span>I am a fresher / entry-level</span>
                  </label>
                </div>
              </div>

              {isFresher ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-xs text-slate-500">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Fresher / Entry-Level Track</p>
                  <p className="mt-1">Experience section bypassed. Foundational training courses will be recommended upon onboarding.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Position #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Organization / Observatory *
                          </label>
                          <input
                            type="text"
                            value={exp.organization}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[idx].organization = e.target.value;
                              setExperience(updated);
                            }}
                            placeholder="e.g. IMD Radar Station Nagpur"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Role / Job Title *
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[idx].role = e.target.value;
                              setExperience(updated);
                            }}
                            placeholder="e.g. Junior Meteorological Observer"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Start Year *
                          </label>
                          <input
                            type="text"
                            value={exp.fromYear}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[idx].fromYear = e.target.value;
                              setExperience(updated);
                            }}
                            placeholder="e.g. 2021"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            End Year (or Present)
                          </label>
                          <input
                            type="text"
                            value={exp.toYear || ''}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[idx].toYear = e.target.value;
                              setExperience(updated);
                            }}
                            placeholder="e.g. Present"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setExperience([
                        ...experience,
                        {
                          organization: '',
                          role: '',
                          fromYear: '2023',
                          toYear: 'Present',
                          description: '',
                        },
                      ])
                    }
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Experience Row</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SKILLS & INTERESTS */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Skills & Subject Interests</h2>
                <p className="text-xs text-slate-500">Rate your current familiarity and highlight areas you wish to develop.</p>
              </div>

              {/* Skills section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Current Skills (Self-rated 1 to 4)
                </label>

                {/* Selected skills list */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3 py-1.5 text-xs text-teal-900 dark:text-teal-200"
                      >
                        <span className="font-semibold">{s.name}</span>
                        <span className="rounded bg-teal-200/70 dark:bg-teal-900 px-1 text-[10px] font-bold">
                          Lvl {s.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                          className="hover:text-rose-500 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add new skill */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    placeholder="Enter skill (e.g. Doppler Radar Analysis, WRF Modelling)..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <select
                    value={customSkillLevel}
                    onChange={(e) => setCustomSkillLevel(Number(e.target.value) as any)}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={1}>Level 1: Novice</option>
                    <option value={2}>Level 2: Competent</option>
                    <option value={3}>Level 3: Proficient</option>
                    <option value={4}>Level 4: Expert</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (customSkillInput.trim()) {
                        setSkills([...skills, { name: customSkillInput.trim(), level: customSkillLevel }]);
                        setCustomSkillInput('');
                      }
                    }}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Quick catalogue suggestions */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5">Suggested from IMD Competency Catalogue:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {competencyCatalogue.slice(0, 6).map((c) => {
                      const alreadyAdded = skills.some((s) => s.name.toLowerCase() === c.name.toLowerCase());
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => setSkills([...skills, { name: c.name, level: 2 }])}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:border-teal-500 disabled:opacity-40"
                        >
                          + {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subject Interests Multi-select */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Target Subject Interests
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DOMAINS.map((domain) => {
                    const isSelected = selectedInterests.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedInterests(selectedInterests.filter((d) => d !== domain));
                          } else {
                            setSelectedInterests([...selectedInterests, domain]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{domain}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CERTIFICATES & ATTACHMENTS */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Certificates & Credentials</h2>
                  <p className="text-xs text-slate-500">Attach prior certifications (PDF, JPG, PNG up to 5MB). Demo metadata only.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCertificates([
                      ...certificates,
                      {
                        title: '',
                        issuer: '',
                        year: '2023',
                        credentialId: '',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Certificate</span>
                </button>
              </div>

              {certificates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 space-y-2">
                  <Award className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>No certificates added yet. Optional, but recommended for advanced course eligibility.</p>
                  <button
                    type="button"
                    onClick={() =>
                      setCertificates([
                        {
                          title: 'WMO Aviation Forecaster Qualification',
                          issuer: 'WMO RTC Pune',
                          year: '2023',
                          credentialId: 'WMO-PUN-2023-441',
                        },
                      ])
                    }
                    className="text-teal-600 hover:underline font-semibold"
                  >
                    Add Sample Certificate
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((cert, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Certificate #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setCertificates(certificates.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Certificate Title *
                          </label>
                          <input
                            type="text"
                            value={cert.title}
                            onChange={(e) => {
                              const updated = [...certificates];
                              updated[idx].title = e.target.value;
                              setCertificates(updated);
                            }}
                            placeholder="e.g. Basic Radar Operations Certification"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Issuing Body *
                          </label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => {
                              const updated = [...certificates];
                              updated[idx].issuer = e.target.value;
                              setCertificates(updated);
                            }}
                            placeholder="e.g. IMD Central Training Institute"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Year Issued
                          </label>
                          <input
                            type="text"
                            value={cert.year}
                            onChange={(e) => {
                              const updated = [...certificates];
                              updated[idx].year = e.target.value;
                              setCertificates(updated);
                            }}
                            placeholder="e.g. 2023"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Credential ID (Optional)
                          </label>
                          <input
                            type="text"
                            value={cert.credentialId || ''}
                            onChange={(e) => {
                              const updated = [...certificates];
                              updated[idx].credentialId = e.target.value;
                              setCertificates(updated);
                            }}
                            placeholder="e.g. CERT-2023-882"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Demo File Attach */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-500 cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-teal-600" />
                          <span>Attach credential scan (demo: metadata only, max 5 MB)</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  showToast('File exceeds 5 MB limit.', 'warning');
                                  return;
                                }
                                const updated = [...certificates];
                                updated[idx].file = {
                                  name: file.name,
                                  size: file.size,
                                  type: file.type,
                                };
                                setCertificates(updated);
                                showToast(`Attached metadata for ${file.name}`, 'info');
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {cert.file && (
                          <div className="mt-1 text-[11px] text-teal-600 font-mono">
                            ✓ {cert.file.name} ({(cert.file.size / 1024).toFixed(1)} KB) — Demo metadata stored
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: REVIEW AND SUBMIT */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review & Confirm Application</h2>
                <p className="text-xs text-slate-500">Review your profile details before submitting for administrative approval.</p>
              </div>

              {/* Review Sections */}
              <div className="space-y-4">
                {/* Account info review */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Account Details</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-teal-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Full Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{account.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{account.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Designation</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{account.designation}</span>
                    </div>
                  </div>
                </div>

                {/* Qualifications review */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Qualifications ({qualifications.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-teal-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {qualifications.map((q, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>{q.degree} — {q.institution} ({q.field})</span>
                        <span className="text-slate-400 font-mono">{q.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience review */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Experience</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-teal-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  {isFresher || experience.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Entry-level / Fresher track</span>
                  ) : (
                    <div className="space-y-1 text-xs">
                      {experience.map((exp, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span>{exp.role} at {exp.organization}</span>
                          <span className="text-slate-400">{exp.fromYear} – {exp.toYear || 'Present'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills & Interests review */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Skills & Interests</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-xs text-teal-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-[11px] font-medium text-teal-800 dark:text-teal-300"
                        >
                          {s.name} (Lvl {s.level})
                        </span>
                      ))}
                    </div>
                    {selectedInterests.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        <strong>Domains:</strong> {selectedInterests.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificates review */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Certificates ({certificates.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="text-xs text-teal-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  {certificates.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">None attached</span>
                  ) : (
                    <div className="space-y-1 text-xs">
                      {certificates.map((c, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span>{c.title} ({c.issuer})</span>
                          <span className="text-slate-400">{c.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Footer (Sticky on Mobile) */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentStep === 1 || isSubmitting}
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Step {currentStep} of {STEPS.length}
              </span>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-xs focus-ring cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md focus-ring cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      <span>{isResubmit ? 'Resubmit Application' : isReapply ? 'Submit Reapplication' : 'Submit for Approval'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login?role=trainee" className="font-semibold text-teal-600 hover:underline dark:text-teal-400">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
