import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  GraduationCap,
  Award,
  Calendar,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { authService, applicationService, draftService, competencyService } from '../../services';
import {
  Competency,
  QualificationEntry,
  DeclaredCompetencyEntry,
  ApplicationEvidenceEntry,
  TrainerApplicationPayload,
  RegistrationDraft,
} from '../../domain/types';
import { useToast } from '../../components/common/Toast';

const STEPS = [
  { id: 1, name: 'Account & Modes', icon: Layers },
  { id: 2, name: 'Qualifications', icon: GraduationCap },
  { id: 3, name: 'Competencies', icon: Award },
  { id: 4, name: 'Evidence', icon: FileCheck },
  { id: 5, name: 'Experience & Availability', icon: Calendar },
  { id: 6, name: 'Review & Submit', icon: CheckCircle2 },
];

export const TrainerRegistrationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const isResubmit = searchParams.get('resubmit') === 'true';
  const isReapply = searchParams.get('reapply') === 'true';
  const existingAppId = searchParams.get('appId');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [competencyCatalogue, setCompetencyCatalogue] = useState<Competency[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Form State
  const [account, setAccount] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    centreId: 'centre-pune',
    designation: 'Senior Meteorologist / Trainer',
    deliveryModes: ['in_person', 'blended'] as Array<'in_person' | 'online' | 'blended'>,
    consent: false,
  });

  const [qualifications, setQualifications] = useState<QualificationEntry[]>([
    { degree: '', institution: '', year: new Date().getFullYear().toString(), field: '' },
  ]);

  const [declaredCompetencies, setDeclaredCompetencies] = useState<DeclaredCompetencyEntry[]>([]);
  const [evidenceList, setEvidenceList] = useState<ApplicationEvidenceEntry[]>([]);

  const [experience, setExperience] = useState<Array<{
    organization: string;
    role: string;
    fromYear: string;
    toYear: string;
    description: string;
  }>>([
    { organization: 'IMD Central Training Institute', role: 'Faculty Specialist', fromYear: '2019', toYear: 'Present', description: 'Instructor for radar meteorology modules.' },
  ]);

  const [availability, setAvailability] = useState<Array<{ from: string; to: string }>>([
    { from: '2026-10-01', to: '2026-12-15' },
  ]);

  const [preferredCentres, setPreferredCentres] = useState<string[]>(['centre-pune', 'centre-delhi']);

  // Load competency catalogue
  useEffect(() => {
    competencyService.getCompetencies().then((comps) => setCompetencyCatalogue(comps));
  }, []);

  // Restore existing application if resubmitting or reapplying
  useEffect(() => {
    if ((isResubmit || isReapply) && existingAppId) {
      applicationService.getApplicationById(existingAppId).then((app) => {
        if (app && app.role === 'trainer') {
          const p = app.payload as TrainerApplicationPayload;
          setAccount((prev) => ({
            ...prev,
            centreId: p.centreId || prev.centreId,
            deliveryModes: (p.deliveryModes as any) || prev.deliveryModes,
          }));
          if (p.qualifications && p.qualifications.length > 0) setQualifications(p.qualifications);
          if (p.declaredCompetencies && p.declaredCompetencies.length > 0) setDeclaredCompetencies(p.declaredCompetencies);
          if (p.evidence) setEvidenceList(p.evidence);
          if (p.experience) {
            setExperience(
              p.experience.map((e: any) => ({
                organization: e.organization || '',
                role: e.role || '',
                fromYear: String(e.fromYear || ''),
                toYear: String(e.toYear || ''),
                description: e.description || '',
              }))
            );
          }
          if (p.availability) {
            setAvailability(
              p.availability.map((av: any) => ({
                from: av.from || av.startDate || '',
                to: av.to || av.endDate || '',
              }))
            );
          }
          if (p.preferredCentres) setPreferredCentres(p.preferredCentres);
          showToast(`Loaded details from Revision ${app.revision} for editing`, 'info');
        }
      });
    }
  }, [isResubmit, isReapply, existingAppId, showToast]);

  // Check email draft or restore draft
  const handleEmailBlur = async () => {
    if (!account.email || isResubmit || isReapply) return;

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
        const draft = await draftService.getDraft(account.email, 'trainer');
        if (draft && draft.payload) {
          const p = draft.payload as TrainerApplicationPayload;
          if (p.qualifications) setQualifications(p.qualifications);
          if (p.declaredCompetencies) setDeclaredCompetencies(p.declaredCompetencies);
          if (p.evidence) setEvidenceList(p.evidence);
          if (p.experience) {
            setExperience(
              p.experience.map((e: any) => ({
                organization: e.organization || '',
                role: e.role || '',
                fromYear: String(e.fromYear || ''),
                toYear: String(e.toYear || ''),
                description: e.description || '',
              }))
            );
          }
          if (p.availability) {
            setAvailability(
              p.availability.map((av: any) => ({
                from: av.from || av.startDate || '',
                to: av.to || av.endDate || '',
              }))
            );
          }
          if (p.preferredCentres) setPreferredCentres(p.preferredCentres);
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
      const payload: TrainerApplicationPayload = {
        centreId: account.centreId,
        deliveryModes: account.deliveryModes,
        qualifications,
        subjects: Array.from(new Set(declaredCompetencies.map((c) => c.domain).filter((d): d is string => Boolean(d)))),
        declaredCompetencies,
        evidence: evidenceList,
        experience,
        availability,
        preferredCentres,
      };
      const draft: RegistrationDraft = {
        email: account.email,
        role: 'trainer',
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
      if (account.deliveryModes.length === 0) {
        showToast('Please select at least one delivery mode offered.', 'warning');
        return false;
      }
      if (!account.consent) {
        showToast('Consent to store demo trainer profile is required.', 'warning');
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
      if (declaredCompetencies.length === 0) {
        showToast('Please declare at least one competency from the catalogue.', 'warning');
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
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setIsSubmitting(true);

    try {
      const payload: TrainerApplicationPayload = {
        centreId: account.centreId,
        deliveryModes: account.deliveryModes,
        qualifications: qualifications.filter((q) => q.degree.trim()),
        subjects: Array.from(new Set(declaredCompetencies.map((c) => c.domain).filter((d): d is string => Boolean(d)))),
        declaredCompetencies,
        evidence: evidenceList,
        experience,
        availability,
        preferredCentres,
      };

      if ((isResubmit || isReapply) && existingAppId) {
        const updatedApp = await applicationService.resubmitApplication(existingAppId, payload);
        await draftService.deleteDraft(account.email, 'trainer');
        showToast('Application resubmitted successfully!', 'success');
        navigate(`/register/submitted?ref=${updatedApp.id}&email=${encodeURIComponent(account.email)}&role=trainer&resubmit=true`);
        return;
      }

      const newUser = await authService.registerUser({
        name: account.name,
        email: account.email,
        password: account.password,
        role: 'trainer',
        status: 'pending',
        centreId: account.centreId,
        onboardingStatus: 'not_started',
      });

      const application = await applicationService.createApplication({
        userId: newUser.id,
        role: 'trainer',
        revision: 1,
        status: 'submitted',
        payload,
      });

      await draftService.deleteDraft(account.email, 'trainer');
      showToast('Trainer application submitted for approval!', 'success');
      navigate(`/register/submitted?ref=${application.id}&email=${encodeURIComponent(newUser.email)}&role=trainer`);
    } catch (err: any) {
      showToast(err.message || 'Submission failed. Please check form data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered competencies for Step 3
  const filteredCatalog = competencyCatalogue.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Evidence completeness meter
  const competenciesWithEvidenceCount = declaredCompetencies.filter((c) =>
    evidenceList.some((e) => e.competencyId === c.id)
  ).length;
  const evidenceCompletenessPct = declaredCompetencies.length > 0
    ? Math.round((competenciesWithEvidenceCount / declaredCompetencies.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
            <Layers className="h-4 w-4" />
            <span>Specialist Trainer Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isResubmit ? 'Edit & Resubmit Trainer Profile' : isReapply ? 'Edit & Reapply' : 'Join as an IMD Specialist Trainer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Declare your meteorological competencies and attach verifiable evidence for deterministic trainer-course matching.
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
                        ? 'bg-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-2 border-blue-600 dark:border-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1.5 hidden sm:block text-center ${
                      isCurrent
                        ? 'text-blue-700 dark:text-blue-300 font-bold'
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
          {/* STEP 1: ACCOUNT & MODES */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account & Delivery Modes</h2>
                <p className="text-xs text-slate-500">Your trainer profile information and instructional delivery capacity.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name & Title *
                  </label>
                  <input
                    type="text"
                    value={account.name}
                    onChange={(e) => setAccount({ ...account, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                    placeholder="e.g. rajesh.trainer@capacityconnect.demo"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {emailChecking && <p className="text-[11px] text-blue-600 mt-1">Verifying email availability...</p>}
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
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-10 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      {account.confirmPassword && account.password !== account.confirmPassword && (
                        <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Faculty Rank *
                  </label>
                  <input
                    type="text"
                    value={account.designation}
                    onChange={(e) => setAccount({ ...account, designation: e.target.value })}
                    placeholder="e.g. Senior Meteorologist / Adjunct Faculty"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Regional Centre *
                  </label>
                  <select
                    value={account.centreId}
                    onChange={(e) => setAccount({ ...account, centreId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {APP_CONFIG.centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Modes Offered */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Delivery Modes Offered *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'in_person', label: 'In-person classroom / lab' },
                    { id: 'online', label: 'Virtual / Online live sessions' },
                    { id: 'blended', label: 'Blended (hybrid cohort)' },
                  ].map((mode) => {
                    const isSelected = account.deliveryModes.includes(mode.id as any);
                    return (
                      <label
                        key={mode.id}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAccount({
                                ...account,
                                deliveryModes: [...account.deliveryModes, mode.id as any],
                              });
                            } else {
                              setAccount({
                                ...account,
                                deliveryModes: account.deliveryModes.filter((m) => m !== mode.id),
                              });
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span>{mode.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Consent Box */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={account.consent}
                    onChange={(e) => setAccount({ ...account, consent: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    I confirm that the declared instructional qualifications and competency claims are truthful and subject to administrative verification. I acknowledge this is a prototype demonstration environment.
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
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Qualifications</h2>
                  <p className="text-xs text-slate-500">Postgraduate degrees or advanced meteorological diplomas. At least one required.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQualifications([
                      ...qualifications,
                      { degree: '', institution: '', year: '2023', field: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition-colors"
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
                          placeholder="e.g. Ph.D. Atmospheric Sciences / M.Tech"
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
                          placeholder="e.g. IIT Delhi / IMD Training School"
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
                          placeholder="e.g. Numerical Weather Prediction"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Year Awarded *
                        </label>
                        <input
                          type="text"
                          value={q.year}
                          onChange={(e) => {
                            const updated = [...qualifications];
                            updated[idx].year = e.target.value;
                            setQualifications(updated);
                          }}
                          placeholder="e.g. 2018"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SUBJECTS & COMPETENCIES */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Declared Competencies</h2>
                <p className="text-xs text-slate-500">Select competencies from the IMD catalogue and self-declare your instructional proficiency level (1-4).</p>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search catalogue by competency title or domain..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Selected competencies list */}
              {declaredCompetencies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Your Selected Competencies ({declaredCompetencies.length})
                  </span>
                  <div className="space-y-2">
                    {declaredCompetencies.map((comp, idx) => (
                      <div
                        key={comp.id}
                        className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-blue-950 dark:text-blue-200">{comp.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{comp.domain}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400">Level:</span>
                            <select
                              value={comp.level}
                              onChange={(e) => {
                                const updated = [...declaredCompetencies];
                                updated[idx].level = Number(e.target.value) as any;
                                setDeclaredCompetencies(updated);
                              }}
                              className="rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold"
                            >
                              <option value={1}>1: Familiar</option>
                              <option value={2}>2: Competent</option>
                              <option value={3}>3: Advanced Specialist</option>
                              <option value={4}>4: Master Faculty</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDeclaredCompetencies(declaredCompetencies.filter((c) => c.id !== comp.id));
                              // Remove evidence associated with this competency
                              setEvidenceList(evidenceList.filter((e) => e.competencyId !== comp.id));
                            }}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catalogue picker grouped by domain */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Available in Competency Catalogue
                </span>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-800/30">
                  {filteredCatalog.map((catItem) => {
                    const isAlreadySelected = declaredCompetencies.some((c) => c.id === catItem.id);
                    return (
                      <div
                        key={catItem.id}
                        className={`p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all ${
                          isAlreadySelected
                            ? 'border-blue-500 bg-blue-100/50 dark:bg-blue-950/60 opacity-60'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{catItem.name}</div>
                          <div className="text-[10px] text-slate-400">{catItem.domain} • ID: {catItem.id}</div>
                        </div>
                        <button
                          type="button"
                          disabled={isAlreadySelected}
                          onClick={() => {
                            setDeclaredCompetencies([
                              ...declaredCompetencies,
                              {
                                id: catItem.id,
                                name: catItem.name,
                                domain: catItem.domain,
                                level: 3,
                              },
                            ]);
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-30 cursor-pointer"
                        >
                          {isAlreadySelected ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: EVIDENCE */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Supporting Competency Evidence</h2>
                <p className="text-xs text-slate-500">Provide verifiable evidence for your declared competencies to maximize your trainer match weight.</p>
              </div>

              {/* Explanatory Callout Notice */}
              <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Important Verification Notice</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300/80 leading-relaxed">
                  Evidence you provide here is reviewed by an administrator upon approval. <strong>Unverified evidence counts for less in trainer matching</strong> until verified by an administrative reviewer. You may submit without evidence for some competencies, but they will be flagged.
                </p>
              </div>

              {/* Completeness Meter */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Evidence Completeness Meter</span>
                  <span className="text-blue-600 dark:text-blue-400">{evidenceCompletenessPct}% covered</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${evidenceCompletenessPct}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {competenciesWithEvidenceCount} of {declaredCompetencies.length} competencies have supporting evidence attached.
                </span>
              </div>

              {/* Evidence inputs per competency */}
              <div className="space-y-4">
                {declaredCompetencies.map((comp) => {
                  const compEvidence = evidenceList.filter((e) => e.competencyId === comp.id);
                  const hasEvidence = compEvidence.length > 0;

                  return (
                    <div
                      key={comp.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-800/50 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{comp.name}</span>
                          <span className="text-[11px] text-slate-400 block">{comp.domain} • Self-rated Level {comp.level}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            hasEvidence
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {hasEvidence ? 'Evidence Attached' : 'No Evidence (Flagged)'}
                        </span>
                      </div>

                      {/* Evidence rows for this competency */}
                      {compEvidence.map((ev, evIdx) => (
                        <div
                          key={evIdx}
                          className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3 text-xs space-y-2"
                        >
                          <div className="flex justify-between items-center text-slate-500">
                            <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                              Type: {ev.type.replace('_', ' ')} (Count / Years: {ev.count})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEvidenceList(evidenceList.filter((item) => item !== ev));
                              }}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{ev.notes}"</p>
                          {ev.file && (
                            <span className="font-mono text-[10px] text-blue-600 block">
                              Scan attached: {ev.file.name}
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Add evidence for this specific competency */}
                      <button
                        type="button"
                        onClick={() => {
                          const newEv: ApplicationEvidenceEntry = {
                            competencyId: comp.competencyId || comp.id || '',
                            type: 'delivered_course',
                            count: 2,
                            notes: `Conducted operational workshops on ${comp.name || 'this competency'} at IMD RTC.`,
                          };
                          setEvidenceList([...evidenceList, newEv]);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-800 px-3 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add evidence for {comp.name || 'this competency'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: EXPERIENCE & AVAILABILITY */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Teaching Experience & Availability</h2>
                <p className="text-xs text-slate-500">Specify instructional experience and upcoming training availability windows.</p>
              </div>

              {/* Teaching Experience */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Training / Teaching Experience
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExperience([
                        ...experience,
                        {
                          organization: '',
                          role: 'Guest Lecturer',
                          fromYear: '2023',
                          toYear: 'Present',
                          description: '',
                        },
                      ])
                    }
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Add Experience Row
                  </button>
                </div>

                <div className="space-y-3">
                  {experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/30 grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">Organization / RTC</label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].organization = e.target.value;
                            setExperience(updated);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">Role / Faculty Position</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].role = e.target.value;
                            setExperience(updated);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability Windows */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Availability Windows (Next 6 Months)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAvailability([
                        ...availability,
                        { from: '2027-01-10', to: '2027-03-30' },
                      ])
                    }
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Add Availability Window
                  </button>
                </div>

                <div className="space-y-2">
                  {availability.map((av, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>From:</span>
                        <input
                          type="date"
                          value={av.from}
                          onChange={(e) => {
                            const updated = [...availability];
                            updated[idx].from = e.target.value;
                            setAvailability(updated);
                          }}
                          className="rounded border p-1 text-xs dark:bg-slate-700"
                        />
                        <span>To:</span>
                        <input
                          type="date"
                          value={av.to}
                          onChange={(e) => {
                            const updated = [...availability];
                            updated[idx].to = e.target.value;
                            setAvailability(updated);
                          }}
                          className="rounded border p-1 text-xs dark:bg-slate-700"
                        />
                      </div>
                      {availability.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setAvailability(availability.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Centres */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Preferred Training Delivery Centres
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {APP_CONFIG.centres.map((c) => {
                    const isSelected = preferredCentres.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPreferredCentres(preferredCentres.filter((id) => id !== c.id));
                          } else {
                            setPreferredCentres([...preferredCentres, c.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW AND SUBMIT */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review & Confirm Trainer Application</h2>
                <p className="text-xs text-slate-500">Review all declarations before sending to the administrative review queue.</p>
              </div>

              {/* Review summary cards */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Trainer Information</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{account.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{account.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Modes Offered</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{account.deliveryModes.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Declared Competencies ({declaredCompetencies.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {declaredCompetencies.map((comp) => {
                      const count = evidenceList.filter((e) => e.competencyId === comp.id).length;
                      return (
                        <div key={comp.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span>{comp.name} (Lvl {comp.level})</span>
                          <span className={count > 0 ? 'text-teal-600 font-semibold' : 'text-amber-500'}>
                            {count > 0 ? `${count} evidence item(s)` : 'No evidence'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs focus-ring cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md focus-ring cursor-pointer"
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

        {/* Footer link */}
        <div className="text-center text-xs text-slate-400">
          Already registered as a trainer?{' '}
          <Link to="/login?role=trainer" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
