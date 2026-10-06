import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Info,
  Scale,
} from 'lucide-react';
import { trainingNeedService, courseService, matchingService, competencyService, auditService } from '../../services';
import { TrainingNeed, Course, MatchResult, Competency } from '../../domain/types';
import { APP_CONFIG, MatchingWeightsConfig } from '../../config/app.config';
import { useAuth } from '../../auth/AuthContext';
import { showToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

export const TrainerMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || (location.pathname.includes('/courses/') ? 'course' : 'need'); // 'need' or 'course'
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [targetNeed, setTargetNeed] = useState<TrainingNeed | null>(null);
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  
  // Configurable weights
  const [weights, setWeights] = useState<MatchingWeightsConfig>({
    ...APP_CONFIG.matching.defaultWeights,
  });
  const [weightsPanelOpen, setWeightsPanelOpen] = useState(false);

  // Expanded evidence drawers
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);

  // Comparison selection (max 3)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Override / Decision Modal
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    trainerId: string;
    trainerName: string;
    decision: 'accepted' | 'rejected' | 'overridden';
    note: string;
  }>({
    open: false,
    trainerId: '',
    trainerName: '',
    decision: 'accepted',
    note: '',
  });

  const [submittingDecision, setSubmittingDecision] = useState(false);

  const runMatch = useCallback(async (
    currentTargetCourse: Course | null,
    currentTargetNeed: TrainingNeed | null,
    currentWeights: MatchingWeightsConfig
  ) => {
    const targetCompIds = currentTargetCourse ? currentTargetCourse.competencyIds : currentTargetNeed?.requiredCompetencyIds || [];
    const targetCentre = currentTargetCourse ? currentTargetCourse.centreId : currentTargetNeed?.targetCentreId || 'centre_pune';
    const targetDelivery = currentTargetCourse ? currentTargetCourse.deliveryMode : currentTargetNeed?.deliveryMode || 'blended';
    const targetWindow = currentTargetCourse
      ? { startDate: currentTargetCourse.startDate, endDate: currentTargetCourse.endDate }
      : currentTargetNeed?.window;

    const matchResults = await matchingService.runMatch(
      {
        id: id || 'demo-target',
        title: currentTargetCourse?.title || currentTargetNeed?.title || 'Target Requirement',
        requiredCompetencyIds: targetCompIds,
        targetCentreId: targetCentre,
        deliveryMode: targetDelivery,
        window: targetWindow,
      },
      currentWeights
    );
    setResults(matchResults);
  }, [id]);

  const loadTargetAndRunMatch = useCallback(async () => {
    setLoading(true);
    try {
      const allCompetencies = await competencyService.getCompetencies();
      setCompetencies(allCompetencies);

      let loadedCourse: Course | null = null;
      let loadedNeed: TrainingNeed | null = null;

      let targetTitle = '';
      let targetCompIds: string[] = [];
      let targetCentre = 'centre_pune';
      let targetDelivery: any = 'blended';
      let targetWindow = undefined;

      if (source === 'course' && id) {
        const course = await courseService.getCourseById(id);
        if (course) {
          loadedCourse = course;
          setTargetCourse(course);
          targetTitle = course.title;
          targetCompIds = course.competencyIds;
          targetCentre = course.centreId;
          targetDelivery = course.deliveryMode;
          targetWindow = { startDate: course.startDate, endDate: course.endDate };
        }
      } else if (id) {
        const need = await trainingNeedService.getNeedById(id);
        if (need) {
          loadedNeed = need;
          setTargetNeed(need);
          targetTitle = need.title;
          targetCompIds = need.requiredCompetencyIds;
          targetCentre = need.targetCentreId;
          targetDelivery = need.deliveryMode;
          targetWindow = need.window;
        }
      }

      const matchTarget = {
        id: id || 'demo-target',
        title: targetTitle || 'Target Requirement',
        requiredCompetencyIds: targetCompIds,
        targetCentreId: targetCentre,
        deliveryMode: targetDelivery,
        window: targetWindow,
      };

      const matchResults = await matchingService.runMatch(matchTarget, weights);
      setResults(matchResults);
      if (matchResults.length > 0) {
        setExpandedTrainerId((prev) => prev || matchResults[0].trainerId);
      }
    } catch (err) {
      console.error('Failed to load matching data:', err);
      showToast({ title: 'Error', message: 'Failed to run matching engine', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, source, weights]);

  // Load target item and run initial match
  useEffect(() => {
    loadTargetAndRunMatch();
  }, [loadTargetAndRunMatch]);

  // Re-run match whenever weights change
  useEffect(() => {
    if (targetNeed || targetCourse) {
      runMatch(targetCourse, targetNeed, weights);
    }
  }, [weights, targetNeed, targetCourse, runMatch]);

  const handleWeightChange = (key: keyof MatchingWeightsConfig, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetWeights = () => {
    setWeights({ ...APP_CONFIG.matching.defaultWeights });
    showToast({ title: 'Weights Reset', message: 'Restored default scoring parameters', type: 'info' });
  };

  const totalWeight =
    weights.competencyOverlap +
    weights.qualificationRelevance +
    weights.priorDelivery +
    weights.availabilityCentreFit;

  const toggleCompare = (trainerId: string) => {
    if (selectedForCompare.includes(trainerId)) {
      setSelectedForCompare(selectedForCompare.filter((i) => i !== trainerId));
    } else {
      if (selectedForCompare.length >= 3) {
        showToast({ title: 'Limit Reached', message: 'You can compare at most 3 trainers simultaneously', type: 'warning' });
        return;
      }
      setSelectedForCompare([...selectedForCompare, trainerId]);
    }
  };

  const openDecisionModal = (trainerId: string, trainerName: string, decision: 'accepted' | 'rejected' | 'overridden') => {
    setDecisionModal({
      open: true,
      trainerId,
      trainerName,
      decision,
      note: decision === 'overridden' ? 'Selected due to specialized domain expertise despite schedule fit.' : '',
    });
  };

  const submitDecision = async () => {
    if (decisionModal.decision === 'overridden' && !decisionModal.note.trim()) {
      showToast({ title: 'Note Required', message: 'Please provide a justification for manual override', type: 'warning' });
      return;
    }

    setSubmittingDecision(true);
    try {
      if (targetCourse && decisionModal.decision === 'accepted') {
        // Assign trainer to course
        await courseService.assignTrainer(targetCourse.id, decisionModal.trainerId);
      }

      if (targetNeed && id) {
        await trainingNeedService.saveMatchDecision(
          id,
          decisionModal.trainerId,
          decisionModal.decision,
          decisionModal.note
        );
      }

      await auditService.logAuditEvent({
        actorId: user?.id || 'admin',
        action: `match_decision_${decisionModal.decision}`,
        entityType: targetCourse ? 'course' : 'training_need',
        entityId: id || 'unknown',
        meta: {
          trainerId: decisionModal.trainerId,
          trainerName: decisionModal.trainerName,
          decision: decisionModal.decision,
          note: decisionModal.note,
          assignedRole: 'primary_instructor',
        },
      });

      showToast({
        title: 'Decision Recorded',
        message: `Trainer assignment successfully updated (${decisionModal.decision})`,
        type: 'success',
      });

      setDecisionModal({ ...decisionModal, open: false });

      // Refresh target state
      if (source === 'course') {
        navigate(`/courses/${id}`);
      } else {
        navigate('/admin/needs');
      }
    } catch (err) {
      console.error('Failed to submit decision:', err);
      showToast({ title: 'Action Failed', message: 'Could not record trainer decision', type: 'error' });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const getCompetencyName = (compId: string) => {
    return competencies.find((c) => c.id === compId)?.name || compId;
  };

  const getCentreName = (centreId: string) => {
    return APP_CONFIG.centres.find((c) => c.id === centreId)?.name || centreId;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    );
  }

  const targetTitle = targetCourse?.title || targetNeed?.title || 'Training Requirement';
  const targetRequiredCompetencies = targetCourse ? targetCourse.competencyIds : targetNeed?.requiredCompetencyIds || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                Deterministic Rule-Based Match
              </span>
              <span className="text-xs text-slate-500">Core Matching Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Trainer Match & Recommendation
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Target:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{targetTitle}</span>
              {' • '}
              Regional Host:{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {getCentreName(targetCourse?.centreId || targetNeed?.targetCentreId || 'centre_pune')}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeightsPanelOpen(!weightsPanelOpen)}
              className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors shadow-sm ${
                weightsPanelOpen
                  ? 'bg-navy-900 text-white border-navy-900 dark:bg-teal-600 dark:border-teal-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 mr-2" />
              Adjust Scoring Weights
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                {totalWeight}%
              </span>
            </button>

            {selectedForCompare.length >= 2 && (
              <button
                onClick={() => setCompareModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-saffron-600 hover:bg-saffron-700 text-white shadow-sm transition-colors"
              >
                <Scale className="w-4 h-4 mr-2" />
                Compare ({selectedForCompare.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory & Explainability Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          <p className="font-semibold text-sm">
            Explainable Fit Score against Recorded Evidence. Final assignment is an administrator decision.
          </p>
          <p className="mt-0.5">
            Matching evaluates verified competency portfolios, prior course deliveries, educational credentials, and regional availability. 
            All ranking formulas are rules-based, non-stochastic, and auditable. Demo scoring weights do not constitute official IMD policy.
          </p>
        </div>
      </div>

      {/* Configurable Weights Drawer / Panel */}
      {weightsPanelOpen && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                Scoring Parameter Weights (Administrator Controlled)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Demo weights, not IMD policy. Normalized automatically to 100%. Adjust to observe real-time candidate rank reordering.
              </p>
            </div>
            <button
              onClick={resetWeights}
              className="inline-flex items-center text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Competency Overlap</span>
                <span className="font-mono font-bold text-teal-600">{weights.competencyOverlap}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.competencyOverlap}
                onChange={(e) => handleWeightChange('competencyOverlap', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">Full credit for verified competencies, 50% for unverified.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Qualifications & Certs</span>
                <span className="font-mono font-bold text-teal-600">{weights.qualificationRelevance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.qualificationRelevance}
                onChange={(e) => handleWeightChange('qualificationRelevance', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">Academic degrees and accredited professional certifications.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Prior Relevant Delivery</span>
                <span className="font-mono font-bold text-teal-600">{weights.priorDelivery}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.priorDelivery}
                onChange={(e) => handleWeightChange('priorDelivery', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">Classroom/virtual teaching hours and demonstrated student outcomes.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Availability & Centre Fit</span>
                <span className="font-mono font-bold text-teal-600">{weights.availabilityCentreFit}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.availabilityCentreFit}
                onChange={(e) => handleWeightChange('availabilityCentreFit', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">Regional co-location with venue and conflict-free calendar windows.</p>
            </div>
          </div>
        </div>
      )}

      {/* Required Target Competencies Pill List */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-2">
          Required Competencies ({targetRequiredCompetencies.length}):
        </span>
        {targetRequiredCompetencies.map((cId) => (
          <span
            key={cId}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
          >
            {getCompetencyName(cId)}
          </span>
        ))}
        {targetRequiredCompetencies.length === 0 && (
          <span className="text-xs text-slate-500 italic">No specific competencies required. All trainers ranked on general aptitude.</span>
        )}
      </div>

      {/* Ranked Candidates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{results.length}</strong> qualified trainers evaluated
          </span>
          <span className="text-xs">
            Ties resolved deterministically: Verified Evidence Count &rarr; Alphabetical
          </span>
        </div>

        {results.map((res, index) => {
          const isExpanded = expandedTrainerId === res.trainerId;
          const isCompared = selectedForCompare.includes(res.trainerId);
          const isAssigned = (targetCourse?.trainerId === res.trainerId);

          return (
            <div
              key={res.trainerId}
              className={`rounded-xl border transition-all shadow-sm ${
                index === 0
                  ? 'border-teal-500/80 bg-teal-50/20 dark:bg-teal-950/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank, Name, Role, Score */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                        index === 0
                          ? 'bg-teal-600 text-white ring-2 ring-teal-600/30'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {res.trainerName}
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">
                          {res.trainerEmail}
                        </span>
                        <span className="inline-flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          {getCentreName(res.trainerCentreId)}
                        </span>
                        {isAssigned && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Currently Assigned
                          </span>
                        )}
                        {index === 0 && !isAssigned && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Highest Match Fit
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                        "{res.explanation}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Total Fit Score & Action Buttons */}
                  <div className="flex items-center gap-4 lg:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Fit Score
                      </div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                        <span className={res.score >= 70 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700'}>
                          {res.score}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">/ 100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCompare(res.trainerId)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                          isCompared
                            ? 'bg-saffron-50 text-saffron-700 border-saffron-300 dark:bg-saffron-950/40 dark:text-saffron-300'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                        }`}
                        title="Add to side-by-side comparison"
                      >
                        <Scale className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openDecisionModal(res.trainerId, res.trainerName, 'accepted')}
                        disabled={isAssigned}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors shadow-2xs"
                      >
                        {isAssigned ? 'Assigned' : 'Accept & Assign'}
                      </button>

                      <button
                        onClick={() => openDecisionModal(res.trainerId, res.trainerName, 'overridden')}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Override...
                      </button>

                      <button
                        onClick={() => setExpandedTrainerId(isExpanded ? null : res.trainerId)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={isExpanded ? 'Collapse evidence' : 'View match evidence'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Score Factor Breakdown Progress Bars */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      <span>Competency Overlap</span>
                      <span className="font-bold">{res.breakdown.competency}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${res.breakdown.competency}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      <span>Qualifications & Certs</span>
                      <span className="font-bold">{res.breakdown.qualification}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy-600 dark:bg-teal-400 rounded-full"
                        style={{ width: `${res.breakdown.qualification}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      <span>Prior Course Delivery</span>
                      <span className="font-bold">{res.breakdown.priorDelivery}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-saffron-500 rounded-full"
                        style={{ width: `${res.breakdown.priorDelivery}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      <span>Availability & Venue</span>
                      <span className="font-bold">{res.breakdown.availabilityFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${res.breakdown.availabilityFit}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Missing Info / Discrepancy Warnings */}
                {res.missingInfo && res.missingInfo.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Missing Information & Verification Flags:
                    </div>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5 list-disc list-inside">
                      {res.missingInfo.map((info, i) => (
                        <li key={i}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Detailed Match Evidence Drawer (Expanded) */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-b-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-teal-600" />
                      Recorded Match Evidence Portfolio ({res.evidence.length} entries evaluated)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Verified evidence receives 100% factor credit; unverified receives 50% credit.
                    </span>
                  </div>

                  {res.evidence.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      No specific evidence recorded for the competencies in this requirement.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-2.5">Competency</th>
                            <th className="p-2.5">Evidence Type</th>
                            <th className="p-2.5">Metric / Volume</th>
                            <th className="p-2.5">Source / Note</th>
                            <th className="p-2.5">Verification Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                          {res.evidence.map((ev, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                              <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                                {getCompetencyName(ev.competencyId)}
                              </td>
                              <td className="p-2.5 capitalize text-slate-600 dark:text-slate-400">
                                {ev.type.replace('_', ' ')}
                              </td>
                              <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">
                                {ev.count} session(s) • {ev.years} yr(s)
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                {ev.sourceNote || '—'}
                              </td>
                              <td className="p-2.5">
                                {ev.verifiedStatus === 'verified' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Pending Admin Review
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Candidate Comparison Modal */}
      {compareModalOpen && (
        <Modal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          title={`Trainer Side-by-Side Comparison (${selectedForCompare.length} Selected)`}
          size="xl"
        >
          <div className="space-y-6">
            <p className="text-xs text-slate-500">
              Compare candidate competency scores, verification status, and scheduling fit to assist administrative selection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedForCompare.map((trainerId) => {
                const item = results.find((r) => r.trainerId === trainerId);
                if (!item) return null;

                return (
                  <div
                    key={trainerId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-4"
                  >
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {item.trainerName}
                          </h4>
                          <p className="text-xs text-slate-500">{item.trainerEmail}</p>
                        </div>
                        <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                          {item.score}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Station: {getCentreName(item.trainerCentreId)}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Factor Scores:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Competency:</span>
                        <span className="font-semibold">{item.breakdown.competency}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Qualifications:</span>
                        <span className="font-semibold">{item.breakdown.qualification}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Prior Delivery:</span>
                        <span className="font-semibold">{item.breakdown.priorDelivery}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Availability:</span>
                        <span className="font-semibold">{item.breakdown.availabilityFit}%</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Evidence Recorded:
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {item.evidence.length} evidence rows ({item.evidence.filter((e) => e.verifiedStatus === 'verified').length} verified)
                      </p>
                    </div>

                    {item.missingInfo.length > 0 && (
                      <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px]">
                        <strong>Flags:</strong> {item.missingInfo[0]}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setCompareModalOpen(false);
                        openDecisionModal(item.trainerId, item.trainerName, 'accepted');
                      }}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                    >
                      Assign this Trainer
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Decision / Override Justification Modal */}
      {decisionModal.open && (
        <Modal
          isOpen={decisionModal.open}
          onClose={() => setDecisionModal({ ...decisionModal, open: false })}
          title={
            decisionModal.decision === 'accepted'
              ? `Confirm Trainer Assignment: ${decisionModal.trainerName}`
              : `Administrative Override Justification: ${decisionModal.trainerName}`
          }
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {decisionModal.decision === 'accepted'
                ? `Assigning ${decisionModal.trainerName} as the primary faculty member. This action will notify the trainer, attach their profile to the course cohort, and record an audit log event.`
                : `You are performing an administrative override to select ${decisionModal.trainerName}. Please record the justification for this choice for audit compliance.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {decisionModal.decision === 'overridden' ? 'Administrative Justification Note *' : 'Optional Assignment Note'}
              </label>
              <textarea
                rows={3}
                value={decisionModal.note}
                onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                placeholder={
                  decisionModal.decision === 'overridden'
                    ? 'Explain the institutional requirement or domain justification for selecting this trainer...'
                    : 'Add any specific notes for this cohort or logistical instructions...'
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDecisionModal({ ...decisionModal, open: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={submitDecision}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors"
              >
                {submittingDecision ? 'Processing...' : 'Confirm Assignment & Audit'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
