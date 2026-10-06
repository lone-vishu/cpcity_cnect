export interface MatchingWeightsConfig {
  competencyOverlap: number;
  qualificationRelevance: number;
  priorDelivery: number;
  availabilityCentreFit: number;
}

export interface AppConfig {
  branding: {
    name: string;
    shortName: string;
    tagline: string;
    context: string;
    portalType: string;
  };
  banners: {
    syntheticData: string;
    weightsNotice: string;
    competencyTaxonomyNotice: string;
    certificateWatermark: string;
    integrationsNotice: string;
  };
  matching: {
    defaultWeights: MatchingWeightsConfig;
  };
  featureFlags: {
    showSyntheticBanner: boolean;
    enableCertificates: boolean;
    enableFeedback: boolean;
    enableDemoGuide: boolean;
    enableDemoQuickAccess: boolean;
    simulateLatency: boolean;
    latencyMs: number;
    simulateErrors: boolean;
  };
  completionRequirements: {
    minAttendancePct: number;
    requireAllAssessmentsAttempted: boolean;
  };
  centres: Array<{ id: string; name: string; code: string }>;
  unsupportedFeatures: Record<string, string>;
}

export const APP_CONFIG: AppConfig = {
  branding: {
    name: 'Capacity Connect',
    shortName: 'CapacityConnect',
    tagline: 'Digital Capacity Building & Learning Management Portal',
    context: 'Meteorological Capacity Development & Specialist Training Workflow',
    portalType: 'Prototype Demonstration',
  },
  banners: {
    syntheticData: 'Prototype: all people, courses, and results are synthetic demo data.',
    weightsNotice: 'Demo weights, not IMD policy. Configurable for evaluation.',
    competencyTaxonomyNotice: 'Demo taxonomy (WMO-referenced, pending domain expert review v0.1)',
    certificateWatermark: 'DEMO — NOT AN OFFICIAL CERTIFICATE',
    integrationsNotice: 'Future interface, not connected, requires sponsor approval.',
  },
  matching: {
    defaultWeights: {
      competencyOverlap: 45,
      qualificationRelevance: 25,
      priorDelivery: 20,
      availabilityCentreFit: 10,
    },
  },
  featureFlags: {
    showSyntheticBanner: true,
    enableCertificates: true,
    enableFeedback: true,
    enableDemoGuide: false,
    enableDemoQuickAccess: true,
    simulateLatency: true,
    latencyMs: 300,
    simulateErrors: false,
  },
  completionRequirements: {
    minAttendancePct: 75,
    requireAllAssessmentsAttempted: true,
  },
  centres: [
    { id: 'centre-pune', name: 'Pune Training Centre', code: 'PUNE' },
    { id: 'centre-delhi', name: 'New Delhi Training Centre', code: 'DELHI' },
    { id: 'centre-kolkata', name: 'Kolkata Regional Training Centre', code: 'KOLKATA' },
    { id: 'centre-chennai', name: 'Chennai Regional Training Centre', code: 'CHENNAI' },
  ],
  unsupportedFeatures: {
    'nic-sso': 'NIC Single Sign-On integration is out of scope for this prototype (future interface).',
    'live-stream': 'Live classroom video streaming requires dedicated media server infrastructure (future).',
    'proctoring': 'Automated video proctoring is out of scope for prototype demonstration.',
    'real-cert-registry': 'Cryptographic blockchain / national certificate registry is out of scope.',
    'external-hr-sync': 'Bi-directional HRMS / e-Office payroll synchronization is an unverified future interface.',
  },
};
