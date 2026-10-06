import {
  User,
  TrainerProfile,
  TrainerEvidence,
  Competency,
  MatchResult,
  MatchFactorBreakdown,
  DeliveryMode,
  DateWindow,
} from '../types';
import { MatchingWeightsConfig } from '../../config/app.config';

export interface MatchingTarget {
  id?: string;
  title: string;
  requiredCompetencyIds: string[];
  targetCentreId: string;
  deliveryMode: DeliveryMode;
  window?: DateWindow;
}

export interface TrainerWithProfile {
  user: User;
  profile: TrainerProfile;
}

export function normalizeWeights(weights: MatchingWeightsConfig): MatchingWeightsConfig {
  const sum =
    weights.competencyOverlap +
    weights.qualificationRelevance +
    weights.priorDelivery +
    weights.availabilityCentreFit;

  if (sum === 0) {
    return {
      competencyOverlap: 45,
      qualificationRelevance: 25,
      priorDelivery: 20,
      availabilityCentreFit: 10,
    };
  }

  if (sum === 100) return weights;

  // Scale to sum to 100
  const factor = 100 / sum;
  return {
    competencyOverlap: Math.round(weights.competencyOverlap * factor),
    qualificationRelevance: Math.round(weights.qualificationRelevance * factor),
    priorDelivery: Math.round(weights.priorDelivery * factor),
    availabilityCentreFit: Math.max(
      0,
      100 -
        (Math.round(weights.competencyOverlap * factor) +
          Math.round(weights.qualificationRelevance * factor) +
          Math.round(weights.priorDelivery * factor))
    ),
  };
}

export function calculateCompetencyScore(
  requiredCompetencyIds: string[],
  evidenceList: TrainerEvidence[]
): { score: number; matchedEvidence: TrainerEvidence[]; missingCompetencies: string[] } {
  if (requiredCompetencyIds.length === 0) {
    return { score: 100, matchedEvidence: [], missingCompetencies: [] };
  }

  let totalCredit = 0;
  const matchedEvidence: TrainerEvidence[] = [];
  const missingCompetencies: string[] = [];

  for (const compId of requiredCompetencyIds) {
    const compEvidences = evidenceList.filter((e) => e.competencyId === compId);

    if (compEvidences.length === 0) {
      missingCompetencies.push(compId);
      continue;
    }

    matchedEvidence.push(...compEvidences);

    // Look for verified evidence first
    const hasVerified = compEvidences.some((e) => e.verifiedStatus === 'verified');
    if (hasVerified) {
      totalCredit += 1.0;
    } else {
      // Partial credit for unverified evidence (50%)
      totalCredit += 0.5;
    }
  }

  const rawScore = (totalCredit / requiredCompetencyIds.length) * 100;
  return {
    score: Math.min(100, Math.round(rawScore)),
    matchedEvidence,
    missingCompetencies,
  };
}

export function calculateQualificationScore(
  requiredCompetencyIds: string[],
  evidenceList: TrainerEvidence[],
  profileQualifications: string[]
): { score: number; qualEvidence: TrainerEvidence[] } {
  const qualEvidences = evidenceList.filter(
    (e) =>
      (e.type === 'qualification' || e.type === 'certification') &&
      requiredCompetencyIds.includes(e.competencyId)
  );

  let points = 0;

  // Base points from qualifications in profile
  if (profileQualifications.length > 0) {
    points += Math.min(30, profileQualifications.length * 15);
  }

  // Points from targeted certifications/qualifications with evidence
  for (const qe of qualEvidences) {
    const weight = qe.verifiedStatus === 'verified' ? 35 : 20;
    points += weight;
  }

  return {
    score: Math.min(100, points),
    qualEvidence: qualEvidences,
  };
}

export function calculatePriorDeliveryScore(
  requiredCompetencyIds: string[],
  evidenceList: TrainerEvidence[]
): { score: number; deliveryEvidence: TrainerEvidence[] } {
  const deliveryEvidences = evidenceList.filter(
    (e) => e.type === 'delivered_course' && requiredCompetencyIds.includes(e.competencyId)
  );

  let points = 0;
  for (const de of deliveryEvidences) {
    const multiplier = de.verifiedStatus === 'verified' ? 1.0 : 0.6;
    // Count of delivered courses gives points (e.g. 20 pts per course, max 40 per evidence)
    const coursePoints = Math.min(40, de.count * 20);
    // Years of experience gives points (e.g. 10 pts per year, max 30)
    const yearPoints = Math.min(30, de.years * 10);
    points += (coursePoints + yearPoints) * multiplier;
  }

  return {
    score: Math.min(100, Math.round(points)),
    deliveryEvidence: deliveryEvidences,
  };
}

export function calculateAvailabilityCentreScore(
  targetCentreId: string,
  deliveryMode: DeliveryMode,
  trainerCentreId: string,
  trainerAvailability: TrainerProfile['availability'],
  targetWindow?: DateWindow
): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];

  // Centre fit: online mode is flexible; in_person/blended benefits from centre match
  if (deliveryMode === 'online') {
    score += 50;
    notes.push('Online delivery compatible across all regional centres');
  } else if (trainerCentreId === targetCentreId) {
    score += 50;
    notes.push('Trainer is stationed at the host centre');
  } else {
    // Different centre for in-person requires travel
    score += 20;
    notes.push('Trainer is located at a different centre (requires travel)');
  }

  // Availability fit
  if (!targetWindow || !targetWindow.startDate || !targetWindow.endDate) {
    // No target window specified - neutral partial score
    score += 40;
    notes.push('Course window is open/flexible');
  } else if (!trainerAvailability || trainerAvailability.length === 0) {
    score += 15;
    notes.push('No specific availability calendar provided by trainer');
  } else {
    const targetStart = new Date(targetWindow.startDate).getTime();
    const targetEnd = new Date(targetWindow.endDate).getTime();

    const hasConflict = trainerAvailability.some((slot) => {
      if (!slot.isAvailable) {
        const slotStart = new Date(slot.startDate).getTime();
        const slotEnd = new Date(slot.endDate).getTime();
        return (
          (targetStart >= slotStart && targetStart <= slotEnd) ||
          (targetEnd >= slotStart && targetEnd <= slotEnd) ||
          (targetStart <= slotStart && targetEnd >= slotEnd)
        );
      }
      return false;
    });

    if (hasConflict) {
      score += 5;
      notes.push('Scheduling conflict flagged in trainer calendar');
    } else {
      score += 50;
      notes.push('No scheduling conflicts in specified window');
    }
  }

  return {
    score: Math.min(100, score),
    notes,
  };
}

export function runTrainerMatch(
  target: MatchingTarget,
  trainers: TrainerWithProfile[],
  competencies: Competency[],
  weightsInput: MatchingWeightsConfig
): MatchResult[] {
  const weights = normalizeWeights(weightsInput);
  const competencyMap = new Map(competencies.map((c) => [c.id, c.name]));

  const results: MatchResult[] = trainers.map(({ user, profile }) => {
    const missingInfo: string[] = [];

    // 1. Competency score
    const compResult = calculateCompetencyScore(
      target.requiredCompetencyIds,
      profile.evidence
    );

    for (const missingCompId of compResult.missingCompetencies) {
      const compName = competencyMap.get(missingCompId) || missingCompId;
      missingInfo.push(`No recorded evidence for "${compName}"`);
    }

    // Check for unverified evidence
    const unverifiedCount = profile.evidence.filter(
      (e) =>
        target.requiredCompetencyIds.includes(e.competencyId) &&
        e.verifiedStatus === 'unverified'
    ).length;
    if (unverifiedCount > 0) {
      missingInfo.push(`${unverifiedCount} evidence item(s) pending administrative verification`);
    }

    // 2. Qualification score
    const qualResult = calculateQualificationScore(
      target.requiredCompetencyIds,
      profile.evidence,
      profile.qualifications
    );

    // 3. Prior delivery score
    const deliveryResult = calculatePriorDeliveryScore(
      target.requiredCompetencyIds,
      profile.evidence
    );

    if (deliveryResult.score === 0 && target.requiredCompetencyIds.length > 0) {
      missingInfo.push('No prior course delivery records for required competencies');
    }

    // 4. Availability & Centre fit
    const availResult = calculateAvailabilityCentreScore(
      target.targetCentreId,
      target.deliveryMode,
      profile.centreId || user.centreId,
      profile.availability,
      target.window
    );

    if (!profile.availability || profile.availability.length === 0) {
      missingInfo.push('Trainer availability calendar is empty');
    }

    // Breakdown
    const breakdown: MatchFactorBreakdown = {
      competency: compResult.score,
      qualification: qualResult.score,
      priorDelivery: deliveryResult.score,
      availabilityFit: availResult.score,
    };

    // Overall weighted score (0 - 100)
    const weightedScore = Math.round(
      (breakdown.competency * weights.competencyOverlap +
        breakdown.qualification * weights.qualificationRelevance +
        breakdown.priorDelivery * weights.priorDelivery +
        breakdown.availabilityFit * weights.availabilityCentreFit) /
        100
    );

    // Collect all supporting evidence items
    const supportingEvidence = [
      ...compResult.matchedEvidence,
      ...qualResult.qualEvidence,
      ...deliveryResult.deliveryEvidence,
    ];
    // Deduplicate evidence by ID
    const uniqueEvidence = Array.from(
      new Map(supportingEvidence.map((e) => [e.id, e])).values()
    );

    // Plain-language explanation
    const explanationParts = [
      `Fit score ${weightedScore}% based on:`,
      `Competency alignment (${breakdown.competency}%): ${compResult.matchedEvidence.length} matching evidence item(s).`,
      `Qualification relevance (${breakdown.qualification}%): ${profile.qualifications.length} qualification(s).`,
      `Prior delivery (${breakdown.priorDelivery}%): ${deliveryResult.deliveryEvidence.length} recorded course session(s).`,
      `Location & schedule (${breakdown.availabilityFit}%): ${availResult.notes.join('; ')}.`,
    ];

    return {
      needId: target.id,
      courseId: target.id,
      trainerId: user.id,
      trainerName: user.name,
      trainerEmail: user.email,
      trainerCentreId: profile.centreId || user.centreId,
      score: weightedScore,
      breakdown,
      evidence: uniqueEvidence,
      missingInfo,
      explanation: explanationParts.join(' '),
    };
  });

  // Sort deterministically:
  // 1. Score descending
  // 2. Verified evidence count descending (tie-breaker)
  // 3. Trainer name ascending (tie-breaker)
  return results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const aVerified = a.evidence.filter((e) => e.verifiedStatus === 'verified').length;
    const bVerified = b.evidence.filter((e) => e.verifiedStatus === 'verified').length;
    if (bVerified !== aVerified) {
      return bVerified - aVerified;
    }
    return a.trainerName.localeCompare(b.trainerName);
  });
}
