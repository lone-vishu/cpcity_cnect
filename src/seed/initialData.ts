import {
  User,
  TraineeProfile,
  TrainerProfile,
  Competency,
  Course,
  TrainingNeed,
  Enrollment,
  Assessment,
  Attempt,
  Resource,
  Feedback,
  Announcement,
  Certificate,
  AuditEvent,
  NotificationItem,
  Application,
  Credential,
} from '../domain/types';

// ----------------------------------------------------
// 1. Competencies (14 items WMO-referenced)
// ----------------------------------------------------
export const SEED_COMPETENCIES: Competency[] = [
  {
    id: 'comp-aviation-forecasting',
    name: 'Aviation Weather Forecasting & TAF/SIGMET Preparation',
    domain: 'Aviation Weather Services',
    level: 3,
    description: 'Interpretation of aerodrome observations, radar, and satellite imagery to issue Terminal Aerodrome Forecasts and SIGMET notices adhering to ICAO/WMO standards.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-cyclone-tracking',
    name: 'Tropical Cyclone Genesis, Structure & Track Forecasting',
    domain: 'Tropical Cyclone Forecasting',
    level: 4,
    description: 'Synoptic, satellite (Dvorak technique), and dynamical NWP analysis for tropical cyclone genesis, intensification, track, and storm surge advisory.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-radar-meteorology',
    name: 'Doppler Weather Radar (DWR) Operations & Product Analysis',
    domain: 'Radar Meteorology',
    level: 3,
    description: 'Operation of S-band and C-band DWR networks, clutter suppression, Doppler velocity interpretation, wind shear detection, and severe storm signatures.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-satellite-imagery',
    name: 'INSAT Satellite Meteorology & Multispectral Interpretation',
    domain: 'Satellite Meteorology',
    level: 3,
    description: 'Extraction of cloud-top brightness temperatures, water vapor channeling, convective initiation tracking, and quantitative precipitation estimation from geostationary payloads.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-nwp-modeling',
    name: 'Numerical Weather Prediction (NWP) Data Assimilation & Modeling',
    domain: 'Numerical Weather Prediction',
    level: 4,
    description: 'Configuration, domain nesting, parameterization schemes, and data assimilation (WRF/GFS/NCUM) for regional high-resolution atmospheric prediction.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-instruments-calibration',
    name: 'Meteorological Surface & Upper-Air Instruments Calibration',
    domain: 'Instruments & Observational Networks',
    level: 2,
    description: 'Calibration, maintenance, and quality assurance of Automated Weather Stations (AWS), radiometers, barometer standards, and GPS-radiosonde launch systems.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'demo',
  },
  {
    id: 'comp-agromet-advisory',
    name: 'Agrometeorological Crop Modeling & District Advisory Services',
    domain: 'Agricultural Meteorology',
    level: 3,
    description: 'Translating medium-range weather forecasts into crop phenology advisories, soil moisture budgeting, and pest/disease outbreak alerts under the Gramin Krishi Mausam Sewa framework.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-climate-services',
    name: 'Climate Data Homogenization & Long-Range Seasonal Forecasting',
    domain: 'Climate Services & Climatology',
    level: 3,
    description: 'Statistical homogenization of long-term temperature/rainfall series, climate trend analysis, and dynamic monsoon seasonal outlook modeling.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'demo',
  },
  {
    id: 'comp-nowcasting',
    name: 'Mesoscale Convective Storm Nowcasting & Urban Flash Flood Alerting',
    domain: 'Nowcasting Services',
    level: 3,
    description: 'Multi-sensor data integration (radar, lightning detector network, satellite, and AWS) to issue 0–3 hour rapid convective thunderstorm and lightning warnings.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'reviewed',
  },
  {
    id: 'comp-public-weather',
    name: 'Impact-Based Weather Forecasting & Risk Communication',
    domain: 'Public Weather Services',
    level: 2,
    description: 'Formulation of color-coded risk warnings (Yellow/Orange/Red), socio-economic vulnerability overlay, and effective multi-channel disaster management communication.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'demo',
  },
  {
    id: 'comp-marine-meteorology',
    name: 'Marine Weather Forecasting & Ocean State Bulletin Generation',
    domain: 'Marine Meteorology',
    level: 3,
    description: 'Wave rider buoy data analysis, swell warning, high seas gale advisory, and port weather bulletins for coastal safety.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'demo',
  },
  {
    id: 'comp-hydromet-flood',
    name: 'Hydrometeorological Runoff Modeling & River Basin Advisory',
    domain: 'Hydrometeorology',
    level: 3,
    description: 'Quantitative Precipitation Forecasts (QPF) and catchment-scale rainfall integration for flood forecasting coordination with central river authorities.',
    source: 'Demo taxonomy (WMO-referenced, pending expert review)',
    version: '0.1',
    reviewStatus: 'demo',
  },
];

// ----------------------------------------------------
// 2. Users (3 primary demo users + 25 trainees + 8 trainers + 3 pending)
// ----------------------------------------------------
export const SEED_USERS: User[] = [
  // Primary Demo Accounts
  {
    id: 'user-admin',
    name: 'Dr. Sunita Kulkarni (Demo Admin)',
    email: 'admin.demo@capacityconnect.demo',
    role: 'admin',
    status: 'approved',
    centreId: 'centre-pune',
    createdAt: '2026-01-01T08:00:00Z',
    synthetic: true,
    onboardingStatus: 'complete',
    demoQuickAccess: true,
  },
  {
    id: 'user-trainer-1',
    name: 'Dr. Rajesh Sharma (Demo Trainer)',
    email: 'trainer.demo@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-pune',
    createdAt: '2026-01-05T09:30:00Z',
    synthetic: true,
    onboardingStatus: 'complete',
    demoQuickAccess: true,
  },
  {
    id: 'user-trainee-1',
    name: 'Pooja Narang (Demo Trainee)',
    email: 'trainee.demo@capacityconnect.demo',
    role: 'trainee',
    status: 'approved',
    centreId: 'centre-delhi',
    createdAt: '2026-01-10T10:00:00Z',
    synthetic: true,
    onboardingStatus: 'complete',
    demoQuickAccess: true,
  },

  // First-Login Onboarding Demo Accounts (Approved, awaiting onboarding)
  {
    id: 'user-onboard-trainee',
    name: 'Kavita Sundaram (New Trainee)',
    email: 'trainee.new@capacityconnect.demo',
    role: 'trainee',
    status: 'approved',
    centreId: 'centre-chennai',
    createdAt: '2026-09-24T10:00:00Z',
    synthetic: true,
    onboardingStatus: 'not_started',
    demoQuickAccess: true,
  },
  {
    id: 'user-onboard-trainer',
    name: 'Dr. Alok Verma (New Faculty)',
    email: 'trainer.new@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-delhi',
    createdAt: '2026-09-24T11:00:00Z',
    synthetic: true,
    onboardingStatus: 'not_started',
    demoQuickAccess: true,
  },

  // Account Status Screens Demo Accounts
  {
    id: 'user-needs-info-1',
    name: 'Sanjay Deshpande',
    email: 'trainer.needsinfo@capacityconnect.demo',
    role: 'trainer',
    status: 'needs_info',
    centreId: 'centre-pune',
    createdAt: '2026-09-23T14:30:00Z',
    synthetic: true,
    onboardingStatus: 'not_started',
    demoQuickAccess: true,
  },
  {
    id: 'user-rejected-1',
    name: 'Ramesh Patel',
    email: 'trainee.rejected@capacityconnect.demo',
    role: 'trainee',
    status: 'rejected',
    centreId: 'centre-kolkata',
    createdAt: '2026-09-21T09:15:00Z',
    synthetic: true,
    onboardingStatus: 'not_started',
    demoQuickAccess: true,
  },

  // Additional Trainers (Total 8)
  {
    id: 'user-trainer-2',
    name: 'Dr. Meera Nambiar',
    email: 'meera.nambiar@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-chennai',
    createdAt: '2026-01-12T10:00:00Z',
    synthetic: true,
  },
  {
    id: 'user-trainer-3',
    name: 'Anil Sengupta',
    email: 'anil.sengupta@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-kolkata',
    createdAt: '2026-01-15T11:00:00Z',
    synthetic: true,
  },
  {
    id: 'user-trainer-4',
    name: 'Dr. Vikramaditya Joshi',
    email: 'vikram.joshi@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-delhi',
    createdAt: '2026-01-18T14:00:00Z',
    synthetic: true,
  },
  {
    id: 'user-trainer-5',
    name: 'Suresh Patil',
    email: 'suresh.patil@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-pune',
    createdAt: '2026-01-20T12:00:00Z',
    synthetic: true,
  },
  {
    id: 'user-trainer-6',
    name: 'Kavita Menon',
    email: 'kavita.menon@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-chennai',
    createdAt: '2026-01-22T09:00:00Z',
    synthetic: true,
  },
  {
    id: 'user-trainer-7',
    name: 'Praveen Roy',
    email: 'praveen.roy@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-kolkata',
    createdAt: '2026-01-25T15:00:00Z',
    synthetic: true,
  },
  {
    id: 'user-trainer-8',
    name: 'Ritu Deshmukh',
    email: 'ritu.deshmukh@capacityconnect.demo',
    role: 'trainer',
    status: 'approved',
    centreId: 'centre-pune',
    createdAt: '2026-01-28T16:00:00Z',
    synthetic: true,
  },

  // 3 Pending users awaiting admin approval queue
  {
    id: 'user-pending-1',
    name: 'Tarun Saxena',
    email: 'tarun.saxena@capacityconnect.demo',
    role: 'trainee',
    status: 'pending',
    centreId: 'centre-delhi',
    createdAt: '2026-09-20T08:15:00Z',
    synthetic: true,
  },
  {
    id: 'user-pending-2',
    name: 'Dr. Hema Iyer',
    email: 'hema.iyer@capacityconnect.demo',
    role: 'trainer',
    status: 'pending',
    centreId: 'centre-chennai',
    createdAt: '2026-09-22T11:45:00Z',
    synthetic: true,
  },
  {
    id: 'user-pending-3',
    name: 'Deepak Mondal',
    email: 'deepak.mondal@capacityconnect.demo',
    role: 'trainee',
    status: 'pending',
    centreId: 'centre-kolkata',
    createdAt: '2026-09-25T14:10:00Z',
    synthetic: true,
  },

  // Additional Trainees (Trainee 2 through 25)
  ...Array.from({ length: 24 }).map((_, idx) => {
    const idNum = idx + 2;
    const centres = ['centre-pune', 'centre-delhi', 'centre-kolkata', 'centre-chennai'];
    const names = [
      'Aarav Mehta', 'Ananya Roy', 'Rohan Bhatia', 'Sneha Iyer', 'Karthik Pillai',
      'Divya Reddy', 'Gaurav Sen', 'Neha Kulkarni', 'Aditya Nair', 'Bhavna Chawla',
      'Manish Tiwari', 'Shalini Das', 'Alok Gupta', 'Nandini Joshi', 'Harish Rawat',
      'Priyanka Bose', 'Vijay Salunkhe', 'Swati Varma', 'Rahul Mukherjee', 'Archana Rao',
      'Kunal Saxena', 'Tanvi Mahajan', 'Manoj Soni', 'Preeti Bajaj'
    ];
    return {
      id: `user-trainee-${idNum}`,
      name: names[idx] || `Trainee Staff ${idNum}`,
      email: `trainee.${idNum}@capacityconnect.demo`,
      role: 'trainee' as const,
      status: 'approved' as const,
      centreId: centres[idx % centres.length],
      createdAt: `2026-02-${String((idx % 20) + 1).padStart(2, '0')}T10:00:00Z`,
      synthetic: true as const,
    };
  }),
];

// ----------------------------------------------------
// 3. Trainer Profiles with Varied Evidence & Calendars
// ----------------------------------------------------
export const SEED_TRAINER_PROFILES: TrainerProfile[] = [
  {
    userId: 'user-trainer-1', // Dr. Rajesh Sharma (Radar & Nowcasting master, verified)
    bio: 'Scientist-E specializing in Doppler Weather Radar operations, meso-beta nowcasting algorithms, and severe storm diagnostics.',
    subjects: ['Radar Meteorology', 'Nowcasting Services', 'Aviation Meteorology'],
    qualifications: ['Ph.D. in Atmospheric Sciences (IIT Delhi)', 'Advanced Radar Engineering Certificate (WMO)', 'M.Sc. Physics'],
    centreId: 'centre-pune',
    availability: [
      { id: 'av-1-1', startDate: '2026-09-01', endDate: '2026-12-31', isAvailable: true, notes: 'Available for full autumn/winter semester' },
    ],
    evidence: [
      {
        id: 'ev-101',
        trainerId: 'user-trainer-1',
        competencyId: 'comp-radar-meteorology',
        type: 'certification',
        count: 1,
        years: 9,
        sourceNote: 'WMO Level 3 Doppler Radar Operator & Instructor Credential',
        verifiedStatus: 'verified',
        verifiedAt: '2026-02-01T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-102',
        trainerId: 'user-trainer-1',
        competencyId: 'comp-radar-meteorology',
        type: 'delivered_course',
        count: 8,
        years: 7,
        sourceNote: 'Delivered national DWR advanced calibration series (2019–2025)',
        verifiedStatus: 'verified',
        verifiedAt: '2026-02-01T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-103',
        trainerId: 'user-trainer-1',
        competencyId: 'comp-nowcasting',
        type: 'delivered_course',
        count: 5,
        years: 4,
        sourceNote: 'Conducted Urban Flash Flood and Convective Nowcasting Workshops',
        verifiedStatus: 'verified',
        verifiedAt: '2026-03-01T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-104',
        trainerId: 'user-trainer-1',
        competencyId: 'comp-aviation-forecasting',
        type: 'qualification',
        count: 1,
        years: 12,
        sourceNote: 'Senior Aviation Forecaster Endorsement, Pune Aerodrome',
        verifiedStatus: 'verified',
        verifiedAt: '2026-03-15T00:00:00Z',
        verifiedBy: 'user-admin',
      },
    ],
  },
  {
    userId: 'user-trainer-2', // Dr. Meera Nambiar (Cyclone specialist, Chennai)
    bio: 'Director of Cyclone Warning Services with 18 years experience tracking North Indian Ocean cyclogenesis and storm surge modeling.',
    subjects: ['Tropical Cyclone Forecasting', 'Marine Meteorology', 'Satellite Meteorology'],
    qualifications: ['Ph.D. in Physical Oceanography', 'WMO Severe Weather Forecaster Fellowship'],
    centreId: 'centre-chennai',
    availability: [
      { id: 'av-2-1', startDate: '2026-10-01', endDate: '2026-11-15', isAvailable: false, notes: 'Post-monsoon cyclone monitoring operational duties' },
      { id: 'av-2-2', startDate: '2026-11-16', endDate: '2026-12-31', isAvailable: true, notes: 'Available for blended training sessions' },
    ],
    evidence: [
      {
        id: 'ev-201',
        trainerId: 'user-trainer-2',
        competencyId: 'comp-cyclone-tracking',
        type: 'certification',
        count: 2,
        years: 14,
        sourceNote: 'RSMC New Delhi Tropical Cyclone Specialist Panel Member',
        verifiedStatus: 'verified',
        verifiedAt: '2026-02-10T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-202',
        trainerId: 'user-trainer-2',
        competencyId: 'comp-cyclone-tracking',
        type: 'delivered_course',
        count: 12,
        years: 10,
        sourceNote: 'Course Coordinator: International Cyclone Warning Workshop series',
        verifiedStatus: 'verified',
        verifiedAt: '2026-02-10T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-203',
        trainerId: 'user-trainer-2',
        competencyId: 'comp-satellite-imagery',
        type: 'qualification',
        count: 1,
        years: 8,
        sourceNote: 'Dvorak Enhanced Infrared Satellite Technique Lead Instructor',
        verifiedStatus: 'verified',
        verifiedAt: '2026-02-15T00:00:00Z',
        verifiedBy: 'user-admin',
      },
    ],
  },
  {
    userId: 'user-trainer-3', // Anil Sengupta (Satellite & Agromet, unverified items)
    bio: 'Senior Meteorologist specializing in satellite product evaluation, INSAT-3DR vegetation indices, and regional weather services.',
    subjects: ['Satellite Meteorology', 'Agricultural Meteorology'],
    qualifications: ['M.Sc. Geoinformatics & Remote Sensing'],
    centreId: 'centre-kolkata',
    availability: [
      { id: 'av-3-1', startDate: '2026-09-01', endDate: '2026-12-31', isAvailable: true, notes: 'Full weekday availability' },
    ],
    evidence: [
      {
        id: 'ev-301',
        trainerId: 'user-trainer-3',
        competencyId: 'comp-satellite-imagery',
        type: 'delivered_course',
        count: 4,
        years: 5,
        sourceNote: 'Conducted Eastern Region INSAT Application modules',
        verifiedStatus: 'unverified', // Deliberately unverified to show pending in queue
      },
      {
        id: 'ev-302',
        trainerId: 'user-trainer-3',
        competencyId: 'comp-agromet-advisory',
        type: 'publication',
        count: 3,
        years: 4,
        sourceNote: 'Published papers on NDVI correlation with Kharif crop yields',
        verifiedStatus: 'unverified',
      },
    ],
  },
  {
    userId: 'user-trainer-4', // Dr. Vikramaditya Joshi (NWP Modelling, Delhi)
    bio: 'Lead Numerical Modeler running global NCUM and high-resolution WRF ensembles for severe thunderstorm outlooks.',
    subjects: ['Numerical Weather Prediction', 'Radar Meteorology'],
    qualifications: ['Ph.D. in Computational Fluid Dynamics (IIT Bombay)', 'Postdoc ECMWF'],
    centreId: 'centre-delhi',
    availability: [
      { id: 'av-4-1', startDate: '2026-10-01', endDate: '2026-10-20', isAvailable: true },
    ],
    evidence: [
      {
        id: 'ev-401',
        trainerId: 'user-trainer-4',
        competencyId: 'comp-nwp-modeling',
        type: 'certification',
        count: 1,
        years: 8,
        sourceNote: 'NCMRWF Unified Model Data Assimilation Certification',
        verifiedStatus: 'verified',
        verifiedAt: '2026-03-01T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-402',
        trainerId: 'user-trainer-4',
        competencyId: 'comp-nwp-modeling',
        type: 'delivered_course',
        count: 6,
        years: 5,
        sourceNote: 'Instructor for Advanced NWP Parameterization Masterclasses',
        verifiedStatus: 'verified',
        verifiedAt: '2026-03-01T00:00:00Z',
        verifiedBy: 'user-admin',
      },
    ],
  },
  {
    userId: 'user-trainer-5', // Suresh Patil (Instruments, Pune)
    bio: 'Chief Instrumentation Engineer supervising surface sensor calibration laboratories and national barometric transfer standards.',
    subjects: ['Instruments & Observational Networks', 'Public Weather Services'],
    qualifications: ['M.Tech Electronics Instrumentation', 'NABL Accredited Laboratory Assessor'],
    centreId: 'centre-pune',
    availability: [
      { id: 'av-5-1', startDate: '2026-09-15', endDate: '2026-12-15', isAvailable: true },
    ],
    evidence: [
      {
        id: 'ev-501',
        trainerId: 'user-trainer-5',
        competencyId: 'comp-instruments-calibration',
        type: 'certification',
        count: 2,
        years: 12,
        sourceNote: 'ISO/IEC 17025 Metrology Lead Auditor & Calibration Lead',
        verifiedStatus: 'verified',
        verifiedAt: '2026-01-20T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-502',
        trainerId: 'user-trainer-5',
        competencyId: 'comp-instruments-calibration',
        type: 'delivered_course',
        count: 9,
        years: 8,
        sourceNote: 'Trained 180+ observational field assistants in AWS sensor inspection',
        verifiedStatus: 'verified',
        verifiedAt: '2026-01-20T00:00:00Z',
        verifiedBy: 'user-admin',
      },
    ],
  },
  {
    userId: 'user-trainer-6', // Kavita Menon (Agromet & Public Weather, Chennai)
    bio: 'Agromet Division Coordinator translating weather risks to regional farmers via SMS and Kisan Call Centres.',
    subjects: ['Agricultural Meteorology', 'Public Weather Services'],
    qualifications: ['M.Sc. Agricultural Meteorology (TNAU)'],
    centreId: 'centre-chennai',
    availability: [], // Intentionally empty availability to trigger missing-info flag
    evidence: [
      {
        id: 'ev-601',
        trainerId: 'user-trainer-6',
        competencyId: 'comp-agromet-advisory',
        type: 'delivered_course',
        count: 3,
        years: 4,
        sourceNote: 'District Agro-Met Unit (DAMU) capacity building lectures',
        verifiedStatus: 'verified',
        verifiedAt: '2026-04-10T00:00:00Z',
        verifiedBy: 'user-admin',
      },
    ],
  },
  {
    userId: 'user-trainer-7', // Praveen Roy (Hydromet & Marine, Kolkata)
    bio: 'Hydrometeorologist working with Damodar Valley Corporation on flood stage discharge and quantitative rainfall alerts.',
    subjects: ['Hydrometeorology', 'Marine Meteorology'],
    qualifications: ['M.Tech Water Resources Engineering'],
    centreId: 'centre-kolkata',
    availability: [
      { id: 'av-7-1', startDate: '2026-09-01', endDate: '2026-10-31', isAvailable: true },
    ],
    evidence: [
      {
        id: 'ev-701',
        trainerId: 'user-trainer-7',
        competencyId: 'comp-hydromet-flood',
        type: 'qualification',
        count: 1,
        years: 6,
        sourceNote: 'CWC Flood Hydrology Joint Advisory Panelist',
        verifiedStatus: 'unverified',
      },
      {
        id: 'ev-702',
        trainerId: 'user-trainer-7',
        competencyId: 'comp-marine-meteorology',
        type: 'delivered_course',
        count: 2,
        years: 3,
        sourceNote: 'Bay of Bengal Coastal State Forecasting Sessions',
        verifiedStatus: 'unverified',
      },
    ],
  },
  {
    userId: 'user-trainer-8', // Ritu Deshmukh (Climate & Public Weather, Pune)
    bio: 'Climatologist conducting state climate change action plan analysis and long-range monsoon predictability.',
    subjects: ['Climate Services & Climatology', 'Public Weather Services'],
    qualifications: ['Ph.D. Climate Dynamics', 'M.Sc. Atmospheric Science'],
    centreId: 'centre-pune',
    availability: [
      { id: 'av-8-1', startDate: '2026-11-01', endDate: '2026-12-31', isAvailable: true },
    ],
    evidence: [
      {
        id: 'ev-801',
        trainerId: 'user-trainer-8',
        competencyId: 'comp-climate-services',
        type: 'certification',
        count: 1,
        years: 7,
        sourceNote: 'WMO Regional Climate Centre Senior Climatologist',
        verifiedStatus: 'verified',
        verifiedAt: '2026-03-20T00:00:00Z',
        verifiedBy: 'user-admin',
      },
      {
        id: 'ev-802',
        trainerId: 'user-trainer-8',
        competencyId: 'comp-public-weather',
        type: 'delivered_course',
        count: 4,
        years: 4,
        sourceNote: 'Disaster Management Authority Weather Risk Communication trainer',
        verifiedStatus: 'verified',
        verifiedAt: '2026-03-20T00:00:00Z',
        verifiedBy: 'user-admin',
      },
    ],
  },
];

// ----------------------------------------------------
// 4. Trainee Profiles (Detailed for Demo Trainee + others)
// ----------------------------------------------------
export const SEED_TRAINEE_PROFILES: TraineeProfile[] = [
  {
    userId: 'user-trainee-1', // Pooja Narang
    designation: 'Scientific Assistant Gr-I',
    qualifications: ['B.Sc. Physics & Mathematics (Delhi University)', 'Basic Meteorology Training Course (BMTC Pune)'],
    experience: ['3 years at Regional Meteorological Centre, New Delhi', 'Aviation Met Office IGI Airport'],
    interests: ['Radar Meteorology', 'Nowcasting Services', 'Aviation Weather Services'],
    skills: ['Surface Synoptic Plotting', 'METAR/SPECI Encoding', 'DWR Max-Z Product Viewing'],
    certificates: [
      {
        id: 'tc-1',
        title: 'Basic Meteorological Observers Course',
        issuer: 'Meteorological Training Institute, Pune',
        issuedYear: 2024,
        fileName: 'BMTC_Certificate_PoojaNarang.pdf',
      },
    ],
  },
  // Auto-generate profile records for other trainees
  ...Array.from({ length: 24 }).map((_, idx) => {
    const id = `user-trainee-${idx + 2}`;
    return {
      userId: id,
      designation: idx % 3 === 0 ? 'Meteorologist Gr-II' : 'Scientific Assistant',
      qualifications: ['B.Sc. Physics', 'Postgraduate Diploma in Applied Meteorology'],
      experience: [`${(idx % 5) + 1} years in field station monitoring`],
      interests: ['Satellite Meteorology', 'Numerical Weather Prediction', 'Agrometeorology'],
      skills: ['AWS Data Validation', 'Python Metpy', 'QGIS Surface Mapping'],
      certificates: [],
    };
  }),
];

// ----------------------------------------------------
// 5. Courses (10 across all statuses)
// ----------------------------------------------------
export const SEED_COURSES: Course[] = [
  {
    id: 'course-radar-advanced',
    title: 'Advanced Doppler Weather Radar Operations & Storm Diagnostics',
    subject: 'Radar Meteorology',
    objectives: [
      'Master S-band and C-band dual-polarization radar volume scan interpretation',
      'Identify mesocyclone, hook echo, and microburst signatures in real-time velocity products',
      'Perform data quality assurance and clutter-filtering calibration checks',
    ],
    competencyIds: ['comp-radar-meteorology', 'comp-nowcasting'],
    prerequisites: ['Basic Meteorology', 'Basic Radar Principles'],
    deliveryMode: 'blended',
    centreId: 'centre-pune',
    startDate: '2026-10-15',
    endDate: '2026-11-15',
    capacity: 25,
    trainerId: 'user-trainer-1',
    status: 'published',
    version: 1,
  },
  {
    id: 'course-cyclone-mastery',
    title: 'Tropical Cyclone Track Prediction & Storm Surge Advisory',
    subject: 'Tropical Cyclone Forecasting',
    objectives: [
      'Apply the Advanced Dvorak Technique (ADT) on INSAT-3DR multichannel imagery',
      'Compute track consensus using multi-model dynamical ensembles (NCUM/GFS/ECMWF)',
      'Prepare 3-hourly coastal cyclone bulletins and evacuation threshold matrices',
    ],
    competencyIds: ['comp-cyclone-tracking', 'comp-marine-meteorology'],
    prerequisites: ['Synoptic Meteorology', 'Satellite Image Interpretation'],
    deliveryMode: 'in_person',
    centreId: 'centre-chennai',
    startDate: '2026-11-20',
    endDate: '2026-12-10',
    capacity: 20,
    trainerId: 'user-trainer-2',
    status: 'published',
    version: 1,
  },
  {
    id: 'course-aviation-taf',
    title: 'Aviation Meteorology & Terminal Aerodrome Forecast (TAF) Certification',
    subject: 'Aviation Weather Services',
    objectives: [
      'Encode and decode ICAO standard METAR, SPECI, and 30-hour TAF messages',
      'Analyze low-level wind shear alerts and aerodrome convective hazard thresholds',
      'Communicate weather impact warnings with Air Traffic Control (ATC) supervisors',
    ],
    competencyIds: ['comp-aviation-forecasting'],
    prerequisites: ['Basic Meteorology Course'],
    deliveryMode: 'online',
    centreId: 'centre-delhi',
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    capacity: 40,
    trainerId: 'user-trainer-1',
    status: 'in_progress',
    version: 1,
  },
  {
    id: 'course-nwp-assimilation',
    title: 'High-Resolution NWP Data Assimilation with WRF and NCUM',
    subject: 'Numerical Weather Prediction',
    objectives: [
      'Configure 3D-Var and 4D-Var data assimilation pipelines for Doppler radar radial winds',
      'Evaluate convective boundary layer parameterization schemes in regional models',
      'Generate spatial probability forecast maps from ensemble prediction systems',
    ],
    competencyIds: ['comp-nwp-modeling'],
    prerequisites: ['Fortran/Python', 'Fluid Dynamics'],
    deliveryMode: 'blended',
    centreId: 'centre-delhi',
    startDate: '2026-12-01',
    endDate: '2026-12-22',
    capacity: 15,
    trainerId: 'user-trainer-4',
    status: 'pending_approval', // Course waiting for admin review
    version: 1,
  },
  {
    id: 'course-agromet-damu',
    title: 'District Agrometeorological Advisory & Gramin Krishi Services',
    subject: 'Agricultural Meteorology',
    objectives: [
      'Convert 5-day block-level weather forecasts into farmer-friendly management advisories',
      'Model soil moisture stress indexes for rainfed crop cultivars',
      'Coordinate with Krishi Vigyan Kendras (KVK) for bi-weekly bulletin dissemination',
    ],
    competencyIds: ['comp-agromet-advisory', 'comp-public-weather'],
    prerequisites: ['Agricultural Science or Met Basics'],
    deliveryMode: 'online',
    centreId: 'centre-kolkata',
    startDate: '2026-10-10',
    endDate: '2026-11-05',
    capacity: 35,
    trainerId: 'user-trainer-3',
    status: 'published',
    version: 1,
  },
  {
    id: 'course-instruments-calibration',
    title: 'Surface Automated Weather Station (AWS) Maintenance & Metrology',
    subject: 'Instruments & Observational Networks',
    objectives: [
      'Calibrate tipping bucket rain gauges, platinum resistance thermometers, and ultrasonic anemometers',
      'Execute field diagnostics on satellite transmitter (DCP) units and solar battery arrays',
      'Maintain calibration logs complying with national metrological audit protocols',
    ],
    competencyIds: ['comp-instruments-calibration'],
    prerequisites: ['Electronics Fundamentals'],
    deliveryMode: 'in_person',
    centreId: 'centre-pune',
    startDate: '2026-09-01',
    endDate: '2026-09-20',
    capacity: 18,
    trainerId: 'user-trainer-5',
    status: 'completed',
    version: 1,
  },
  {
    id: 'course-insat-cloud',
    title: 'INSAT-3DR Multispectral Imagery for Convective Storm Tracking',
    subject: 'Satellite Meteorology',
    objectives: [
      'Process visible, thermal infrared, and middle infrared split-window channels',
      'Compute cloud top microphysical cooling rates to anticipate severe squall lines',
      'Validate satellite rainfall estimates (HEM/IMSRA) against ground AWS networks',
    ],
    competencyIds: ['comp-satellite-imagery', 'comp-nowcasting'],
    prerequisites: ['Basic Remote Sensing'],
    deliveryMode: 'online',
    centreId: 'centre-delhi',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    capacity: 30,
    trainerId: 'user-trainer-3',
    status: 'published',
    version: 1,
  },
  {
    id: 'course-nowcasting-lightning',
    title: 'Urban Convective Hazards, Downbursts & Lightning Warning Systems',
    subject: 'Nowcasting Services',
    objectives: [
      'Utilize total lightning sensor arrays to detect thunderstorm charge separation spikes',
      'Issue city-specific nowcasts with 30-minute lead time via social and GIS feeds',
      'Integrate dense micrometeorological urban sensor clusters into real-time displays',
    ],
    competencyIds: ['comp-nowcasting', 'comp-radar-meteorology'],
    prerequisites: ['Radar Meteorology Basics'],
    deliveryMode: 'blended',
    centreId: 'centre-pune',
    startDate: '2026-10-20',
    endDate: '2026-11-10',
    capacity: 25,
    trainerId: 'user-trainer-1',
    status: 'published',
    version: 1,
  },
  {
    id: 'course-climate-trends',
    title: 'Monsoon Climatology, Extreme Precipitation Trends & Data Homogenization',
    subject: 'Climate Services & Climatology',
    objectives: [
      'Apply RHtests homogenization methods to detect artificial non-climatic shifts in rainfall records',
      'Analyze Indian Ocean Dipole and ENSO teleconnections during the Southwest Monsoon season',
    ],
    competencyIds: ['comp-climate-services'],
    prerequisites: ['Statistics & Climatology'],
    deliveryMode: 'online',
    centreId: 'centre-pune',
    startDate: '2026-12-05',
    endDate: '2026-12-25',
    capacity: 25,
    trainerId: 'user-trainer-8',
    status: 'draft', // Course in draft state
    version: 1,
  },
  {
    id: 'course-hydromet-runoff',
    title: 'Catchment Quantitative Precipitation Estimation & Flash Flood Guidance',
    subject: 'Hydrometeorology',
    objectives: [
      'Derive basin-average QPF from blended radar-gauge rainfall fields',
      'Operate Flash Flood Guidance Systems (FFGS) for hilly terrain and river sub-basins',
    ],
    competencyIds: ['comp-hydromet-flood'],
    prerequisites: ['Surface Hydrology basics'],
    deliveryMode: 'in_person',
    centreId: 'centre-kolkata',
    startDate: '2025-08-01',
    endDate: '2025-08-25',
    capacity: 20,
    trainerId: 'user-trainer-7',
    status: 'archived',
    version: 1,
  },
];

// ----------------------------------------------------
// 6. Training Needs (3 open needs for admin matching flow)
// ----------------------------------------------------
export const SEED_TRAINING_NEEDS: TrainingNeed[] = [
  {
    id: 'need-nowcasting-chennai',
    title: 'Urgent Regional Need: Coastal Convective Nowcasting & Lightning Detection',
    requiredCompetencyIds: ['comp-nowcasting', 'comp-radar-meteorology'],
    targetCentreId: 'centre-chennai',
    deliveryMode: 'blended',
    window: {
      startDate: '2026-11-01',
      endDate: '2026-11-15',
    },
    createdBy: 'user-admin',
    status: 'open',
  },
  {
    id: 'need-cyclone-surge-kolkata',
    title: 'Bay of Bengal Tropical Cyclone Surge & Evacuation Modeling Masterclass',
    requiredCompetencyIds: ['comp-cyclone-tracking', 'comp-marine-meteorology'],
    targetCentreId: 'centre-kolkata',
    deliveryMode: 'in_person',
    window: {
      startDate: '2026-10-25',
      endDate: '2026-11-10',
    },
    createdBy: 'user-admin',
    status: 'open',
  },
  {
    id: 'need-aviation-delhi',
    title: 'Fog and Low Visibility Winter Aerodrome Advisory Specialization',
    requiredCompetencyIds: ['comp-aviation-forecasting', 'comp-instruments-calibration'],
    targetCentreId: 'centre-delhi',
    deliveryMode: 'in_person',
    window: {
      startDate: '2026-11-15',
      endDate: '2026-11-30',
    },
    createdBy: 'user-admin',
    status: 'open',
  },
];

// ----------------------------------------------------
// 7. Enrollments (40 records across courses & trainees)
// ----------------------------------------------------
export const SEED_ENROLLMENTS: Enrollment[] = [
  // Demo Trainee enrollments
  {
    id: 'enr-demo-1',
    traineeId: 'user-trainee-1',
    courseId: 'course-radar-advanced',
    status: 'enrolled',
    enrolledAt: '2026-09-02T10:00:00Z',
    attendancePct: 88,
  },
  {
    id: 'enr-demo-2',
    traineeId: 'user-trainee-1',
    courseId: 'course-aviation-taf',
    status: 'enrolled',
    enrolledAt: '2026-09-05T11:30:00Z',
    attendancePct: 92,
  },
  {
    id: 'enr-demo-3',
    traineeId: 'user-trainee-1',
    courseId: 'course-instruments-calibration',
    status: 'completed',
    enrolledAt: '2026-08-15T09:00:00Z',
    attendancePct: 95,
    completedAt: '2026-09-20T17:00:00Z',
  },
  // Additional enrollments to fill cohorts
  ...Array.from({ length: 37 }).map((_, idx) => {
    const courses = [
      'course-radar-advanced',
      'course-cyclone-mastery',
      'course-aviation-taf',
      'course-agromet-damu',
      'course-insat-cloud',
      'course-instruments-calibration',
    ];
    const traineeNum = (idx % 23) + 2;
    const courseId = courses[idx % courses.length];
    const isCompleted = courseId === 'course-instruments-calibration';
    const status = isCompleted ? 'completed' : idx % 7 === 0 ? 'waitlisted' : 'enrolled';

    return {
      id: `enr-auto-${idx + 4}`,
      traineeId: `user-trainee-${traineeNum}`,
      courseId,
      status: status as any,
      enrolledAt: `2026-08-${String((idx % 25) + 1).padStart(2, '0')}T09:00:00Z`,
      attendancePct: 65 + ((idx * 7) % 35),
      completedAt: isCompleted ? '2026-09-20T17:00:00Z' : undefined,
    };
  }),
];

// ----------------------------------------------------
// 8. Assessments (4 courses with 8-10 authentic MCQs each)
// ----------------------------------------------------
export const SEED_ASSESSMENTS: Assessment[] = [
  {
    id: 'assess-radar-advanced',
    courseId: 'course-radar-advanced',
    title: 'Module 1 Assessment: Dual-Polarization Radar Storm Signatures',
    deadline: '2026-11-10T23:59:59Z',
    durationMin: 20,
    status: 'published',
    questions: [
      {
        id: 'q-rad-1',
        prompt: 'In dual-polarization Doppler radar, a high Reflectivity (Z_H > 50 dBZ) accompanied by a Differential Reflectivity (Z_DR) near 0 dB typically indicates which precipitation type?',
        options: ['Large raindrop coalescence', 'Hailstones tumbling in convective updrafts', 'Dry crystalline dendritic snow', 'Biological insects in low-level boundary layer'],
        correctIndex: 1,
        competencyId: 'comp-radar-meteorology',
        explanation: 'Because hailstones tumble unpredictably as they fall, their radar cross-sections appear spherical on average, yielding Z_DR values close to 0 dB despite very high horizontal reflectivity (Z_H > 50 dBZ).',
      },
      {
        id: 'q-rad-2',
        prompt: 'Which dual-polarization product is most effective for distinguishing non-meteorological ground clutter and anomalous propagation (AP) echoes from genuine precipitation?',
        options: ['Differential Phase Shift (Phi_DP)', 'Correlation Coefficient (Rho_HV)', 'Radial Doppler Velocity (V_R)', 'Specific Differential Phase (K_DP)'],
        correctIndex: 1,
        competencyId: 'comp-radar-meteorology',
        explanation: 'Correlation Coefficient (Rho_HV) drops significantly below 0.85 in non-meteorological targets (birds, ground clutter, anomalous propagation), while uniform rain and hail exhibit Rho_HV > 0.95.',
      },
      {
        id: 'q-rad-3',
        prompt: 'A Hook Echo signature observed on low-elevation radar PPI reflectivity images is most commonly associated with which mesoscale hazard?',
        options: ['Downslope katabatic gale', 'Tornadic supercell mesocyclone', 'Stratiform warm front precipitation', 'Radiation fog dissipation'],
        correctIndex: 1,
        competencyId: 'comp-radar-meteorology',
        explanation: 'A Hook Echo forms when precipitation is drawn into the cyclonically rotating rear-flank downdraft of a supercell storm, frequently enclosing a tornadic circulation or mesocyclone.',
      },
      {
        id: 'q-rad-4',
        prompt: 'What Doppler velocity pattern indicates an imminent microburst downburst approaching an aerodrome runway?',
        options: ['Symmetric cyclonic vortex couplet', 'Strong divergent velocity couplet centered over the touchdown zone', 'Uniform zero-velocity isodop band', 'Anti-cyclonic curvature in radial sheer'],
        correctIndex: 1,
        competencyId: 'comp-nowcasting',
        explanation: 'A microburst spreads outward radially upon impinging on the surface, creating a distinct strong divergent signature (outflow winds moving toward and away from the radar).',
      },
      {
        id: 'q-rad-5',
        prompt: 'What physical limitation occurs in Doppler radar when precipitation velocity exceeds the maximum unambiguous velocity (V_max)?',
        options: ['Range folding and second-trip ghost echoes', 'Velocity aliasing (Nyquist velocity wrap-around)', 'Complete microwave beam attenuation', 'Anomalous beam ducting'],
        correctIndex: 1,
        competencyId: 'comp-radar-meteorology',
        explanation: 'When radial velocity exceeds the Nyquist velocity threshold determined by radar wavelength and Pulse Repetition Frequency (PRF), phase ambiguity causes velocity aliasing (displaying opposite sign velocities).',
      },
      {
        id: 'q-rad-6',
        prompt: 'Specific Differential Phase (K_DP) is especially valuable for heavy rainfall quantitative precipitation estimation (QPE) because:',
        options: ['It is unaffected by radar calibration offsets and microwave beam attenuation', 'It operates solely in the visible light spectrum', 'It detects cloud condensation nuclei directly', 'It does not require antenna elevation scanning'],
        correctIndex: 0,
        competencyId: 'comp-radar-meteorology',
        explanation: 'K_DP is a propagation phase derivative rather than a power return measurement, making it immune to radar calibration errors and microwave beam attenuation across heavy storm cores.',
      },
      {
        id: 'q-rad-7',
        prompt: 'In nowcasting convective initiation, what trend in radar composite maximum reflectivity (Max-Z) typically indicates rapid storm intensification?',
        options: ['Echoes staying constant below 20 dBZ for 2 hours', 'Reflectivity core expanding vertically above the freezing level (0 deg C isotherm) surpassing 45 dBZ', 'Gradual lowering of echo tops toward ground level', 'Widespread expansion of stratiform bright bands'],
        correctIndex: 1,
        competencyId: 'comp-nowcasting',
        explanation: 'Rapid vertical growth of high reflectivity (>45 dBZ) exceeding the environmental freezing level indicates vigorous convective updrafts sustaining supercooled water and graupel formation.',
      },
      {
        id: 'q-rad-8',
        prompt: 'The Doppler Radar "Bright Band" visible in vertical cross-sections (RHI) is caused by:',
        options: ['Refraction of sunlight through cirrus sheets', 'Melting layer of snowflakes becoming coated with water before complete liquid transition', 'Ground reflection off metallic buildings', 'Atmospheric ozone absorption'],
        correctIndex: 1,
        competencyId: 'comp-radar-meteorology',
        explanation: 'As snowflakes fall through the 0 deg C melting layer, they develop a liquid water film. Because water has a dielectric constant roughly 5 times higher than ice, the large melting flakes produce anomalously high reflectivity before collapsing into small raindrops.',
      },
    ],
  },
  {
    id: 'assess-aviation-taf',
    courseId: 'course-aviation-taf',
    title: 'Aviation Meteorology TAF & SIGMET Qualification Exam',
    deadline: '2026-10-24T23:59:59Z',
    durationMin: 20,
    status: 'published',
    questions: [
      {
        id: 'q-av-1',
        prompt: 'In a standard ICAO METAR report, the code "BKN015CB" represents:',
        options: ['Scattered clouds at 1,500 feet with cirrus', 'Broken cloud ceiling at 1,500 feet with cumulonimbus', 'Overcast cloud layer at 150 feet with cumulus', 'Fog bank extending to 1,500 meters'],
        correctIndex: 1,
        competencyId: 'comp-aviation-forecasting',
        explanation: 'BKN represents 5 to 7 oktas cloud cover (broken ceiling), 015 specifies cloud base at 1,500 feet Above Ground Level (AGL), and CB denotes Cumulonimbus convective activity.',
      },
      {
        id: 'q-av-2',
        prompt: 'When is a Runway Visual Range (RVR) mandatory to include in aerodrome reports?',
        options: ['Whenever ambient temperature drops below 10 deg C', 'When horizontal visibility or RVR drops below 1,500 meters', 'Exclusively during high-altitude jetstream turbulence', 'Only when crosswinds exceed 35 knots'],
        correctIndex: 1,
        competencyId: 'comp-aviation-forecasting',
        explanation: 'Under ICAO Annex 3 standards, RVR reporting is required when horizontal prevailing visibility drops below 1,500 meters at instrumented runways.',
      },
      {
        id: 'q-av-3',
        prompt: 'Which meteorological condition requires the issuance of a formal SIGMET message for aviation flight safety?',
        options: ['Clear air turbulence of moderate intensity', 'Severe squall lines, severe turbulence, severe icing, or volcanic ash clouds', 'Scattered morning cumulus clouds', 'Light rain showers over an aerodrome'],
        correctIndex: 1,
        competencyId: 'comp-aviation-forecasting',
        explanation: 'SIGMETs (Significant Meteorological Information) are issued by Meteorological Watch Offices (MWO) for severe weather phenomena hazardous to all aircraft in flight.',
      },
      {
        id: 'q-av-4',
        prompt: 'In a Terminal Aerodrome Forecast (TAF), what does the change indicator "TEMPO 1216 2000 TSRA" designate?',
        options: ['Permanent worsening of conditions starting at 1200Z', 'Temporary fluctuations lasting less than 1 hour each between 1200Z and 1600Z with 2000m visibility in thunderstorm with rain', 'A cold front passing precisely at 1600Z', 'Temperature drop to 20 deg C with rainfall'],
        correctIndex: 1,
        competencyId: 'comp-aviation-forecasting',
        explanation: 'TEMPO denotes temporary frequent or infrequent fluctuations lasting less than 60 minutes each time, with total aggregate duration less than half the forecast window.',
      },
      {
        id: 'q-av-5',
        prompt: 'What danger does Low-Level Wind Shear (LLWS) within 1,600 feet of ground level pose during aircraft final approach?',
        options: ['Sudden loss of indicated airspeed, lift deficiency, and rapid deviation from glide slope', 'Interference with radio communication frequencies', 'Ozone contamination in the passenger cabin', 'Excessive fuel vaporization'],
        correctIndex: 0,
        competencyId: 'comp-aviation-forecasting',
        explanation: 'Rapid change in wind direction or speed on approach can suddenly deplete airspeed and lift, precipitating a dangerous rate of sink before flight crew can compensate.',
      },
      {
        id: 'q-av-6',
        prompt: 'What ICAO visibility indicator is reported when visibility is less than 50 meters?',
        options: ['0000', '9999', '////', 'M0050'],
        correctIndex: 0,
        competencyId: 'comp-aviation-forecasting',
        explanation: 'Visibility below 50 meters is encoded as 0000 in METAR/SPECI bulletins.',
      },
    ],
  },
  {
    id: 'assess-cyclone-mastery',
    courseId: 'course-cyclone-mastery',
    title: 'Comprehensive Examination on Tropical Cyclogenesis & Dvorak Technique',
    deadline: '2026-12-08T23:59:59Z',
    durationMin: 30,
    status: 'published',
    questions: [
      {
        id: 'q-cyc-1',
        prompt: 'In the Dvorak Tropical Cyclone Intensity Analysis, what T-number corresponds to a Very Severe Cyclonic Storm (VSCS) with sustained winds of 64–89 knots in the North Indian Ocean?',
        options: ['T 1.5 to T 2.0', 'T 2.5 to T 3.0', 'T 4.0 to T 4.5', 'T 6.5 to T 7.0'],
        correctIndex: 2,
        competencyId: 'comp-cyclone-tracking',
        explanation: 'In the North Indian Ocean operational scale, T 4.0–4.5 corresponds to sustained surface winds between 64 and 89 knots (Very Severe Cyclonic Storm).',
      },
      {
        id: 'q-cyc-2',
        prompt: 'Which environmental factor is most hostile to the maintenance and intensification of tropical cyclonic vortex cores?',
        options: ['Warm sea surface temperatures exceeding 28 deg C', 'Strong vertical wind shear (200 hPa minus 850 hPa wind difference > 20 knots)', 'High middle-tropospheric relative humidity (>70%)', 'Low-level cyclonic relative vorticity'],
        correctIndex: 1,
        competencyId: 'comp-cyclone-tracking',
        explanation: 'Strong vertical wind shear tilts and ventilates the warm core of the tropical cyclone, blowing latent heat release away from the surface center of circulation.',
      },
      {
        id: 'q-cyc-3',
        prompt: 'What primary physical force generates the coastal storm surge inundation during tropical cyclone landfall?',
        options: ['Barometric inverted barometer effect alone', 'Prolonged wind stress pushing ocean surface water onshore coupled with shallow bathymetry and astronomical tide', 'Underwater tectonic displacement', 'Heavy thunderstorm precipitation falling on open seas'],
        correctIndex: 1,
        competencyId: 'comp-cyclone-tracking',
        explanation: 'While the inverted barometer effect contributes roughly 1 cm per 1 hPa pressure drop, over 85% of storm surge height is generated by direct onshore wind stress acting over a shallow continental shelf.',
      },
    ],
  },
  {
    id: 'assess-instruments-calibration',
    courseId: 'course-instruments-calibration',
    title: 'Observational Metrology & AWS Field Certification',
    deadline: '2026-09-18T23:59:59Z',
    durationMin: 15,
    status: 'closed',
    questions: [
      {
        id: 'q-inst-1',
        prompt: 'What standard height above natural grass ground surface is required for mounting dry-bulb thermometers in a Stevenson Screen under WMO standards?',
        options: ['0.5 meters', '1.25 to 2.0 meters', '5.0 meters', '10.0 meters'],
        correctIndex: 1,
        competencyId: 'comp-instruments-calibration',
        explanation: 'WMO standards prescribe air temperature sensor placement between 1.25 and 2.0 meters above level ground, shielded from solar radiation and precipitation inside a ventilated screen.',
      },
      {
        id: 'q-inst-2',
        prompt: 'How often must master working barometer standards at regional meteorological centres undergo recalibration against primary national standards?',
        options: ['Every 5 years', 'Annually (every 12 months)', 'Every 10 years', 'Only after sensor breakdown'],
        correctIndex: 1,
        competencyId: 'comp-instruments-calibration',
        explanation: 'WMO and national metrology standards require annual cross-calibration of working pressure standards against regional mercury or deadweight barometric standards.',
      },
    ],
  },
];

// ----------------------------------------------------
// 9. Attempts (Sample attempts for trainees)
// ----------------------------------------------------
export const SEED_ATTEMPTS: Attempt[] = [
  {
    id: 'att-demo-1',
    assessmentId: 'assess-instruments-calibration',
    traineeId: 'user-trainee-1',
    answers: [1, 1], // Perfect score on instruments
    score: 100,
    submittedAt: '2026-09-17T14:30:00Z',
  },
  {
    id: 'att-auto-2',
    assessmentId: 'assess-radar-advanced',
    traineeId: 'user-trainee-2',
    answers: [1, 1, 1, 1, 1, 0, 1, 1],
    score: 100,
    submittedAt: '2026-09-25T16:20:00Z',
  },
  {
    id: 'att-auto-3',
    assessmentId: 'assess-radar-advanced',
    traineeId: 'user-trainee-3',
    answers: [1, 0, 1, 1, 0, 0, 1, 1],
    score: 75,
    submittedAt: '2026-09-26T11:10:00Z',
  },
  {
    id: 'att-auto-4',
    assessmentId: 'assess-aviation-taf',
    traineeId: 'user-trainee-4',
    answers: [1, 1, 1, 1, 0, 0],
    score: 67,
    submittedAt: '2026-09-24T09:40:00Z',
  },
];

// ----------------------------------------------------
// 10. Resources (20 demo learning assets)
// ----------------------------------------------------
export const SEED_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    courseId: 'course-radar-advanced',
    trainerId: 'user-trainer-1',
    type: 'video',
    title: 'Lecture 1: S-Band Dual-Polarization Principles and Polarimetric Variables',
    description: 'Dr. Rajesh Sharma explains Z_DR, Rho_HV, and K_DP interpretation with live radar scan examples from Mumbai and Chennai DWR sites.',
    fileMeta: {
      name: 'radar_polarimetry_lecture_01.mp4',
      sizeBytes: 48500000,
      mimeType: 'video/mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    visibility: 'enrolled',
    uploadedAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'res-2',
    courseId: 'course-radar-advanced',
    trainerId: 'user-trainer-1',
    type: 'slides',
    title: 'Presentation Slides: Severe Convective Storm Nowcasting Signatures',
    description: 'Detailed high-resolution deck showing hook echo, bow echo, rear-inflow notch, and downburst velocity signatures.',
    fileMeta: {
      name: 'convective_signatures_slides.pdf',
      sizeBytes: 8400000,
      mimeType: 'application/pdf',
      url: '/demo-files/convective_signatures_slides.pdf',
    },
    visibility: 'enrolled',
    uploadedAt: '2026-09-06T14:30:00Z',
  },
  {
    id: 'res-3',
    courseId: 'course-radar-advanced',
    trainerId: 'user-trainer-1',
    type: 'document',
    title: 'DWR Operational Calibration & Maintenance Standard Operating Procedure',
    description: 'Standard checklist for daily solar calibration, receiver noise floor monitoring, and antenna pedestal lubrication.',
    fileMeta: {
      name: 'DWR_Maintenance_SOP_2026.pdf',
      sizeBytes: 3200000,
      mimeType: 'application/pdf',
      url: '/demo-files/DWR_Maintenance_SOP_2026.pdf',
    },
    visibility: 'enrolled',
    uploadedAt: '2026-09-07T11:00:00Z',
  },
  {
    id: 'res-4',
    courseId: 'course-cyclone-mastery',
    trainerId: 'user-trainer-2',
    type: 'slides',
    title: 'Advanced Dvorak Technique (ADT) Manual & Satellite Cloud Pattern Reference',
    description: 'Dr. Meera Nambiar reference slides for curved band pattern, eye pattern, and embedded center analysis on INSAT-3DR.',
    fileMeta: {
      name: 'Dvorak_Technique_Masterclass.pdf',
      sizeBytes: 12500000,
      mimeType: 'application/pdf',
      url: '/demo-files/Dvorak_Technique_Masterclass.pdf',
    },
    visibility: 'public_trainees',
    uploadedAt: '2026-09-10T16:00:00Z',
  },
  {
    id: 'res-5',
    courseId: 'course-cyclone-mastery',
    trainerId: 'user-trainer-2',
    type: 'video',
    title: 'Case Study: Super Cyclonic Storm Amphan Reconstruction and Surge Forecast',
    description: 'Recorded simulation analyzing dynamic ensemble convergence 72 hours prior to landfall along West Bengal / Bangladesh coast.',
    fileMeta: {
      name: 'amphan_reconstruction_analysis.mp4',
      sizeBytes: 62000000,
      mimeType: 'video/mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    visibility: 'enrolled',
    uploadedAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 'res-6',
    courseId: 'course-aviation-taf',
    trainerId: 'user-trainer-1',
    type: 'document',
    title: 'ICAO Annex 3 & WMO-No. 782 Quick Reference Guide for Aviation Forecasters',
    description: 'Handy pocket card for aerodrome weather phenomena abbreviations, cloud amounts, and TREND forecast criteria.',
    fileMeta: {
      name: 'ICAO_Annex3_CheatSheet.pdf',
      sizeBytes: 1500000,
      mimeType: 'application/pdf',
      url: '/demo-files/ICAO_Annex3_CheatSheet.pdf',
    },
    visibility: 'public_trainees',
    uploadedAt: '2026-09-08T15:00:00Z',
  },
  {
    id: 'res-7',
    courseId: 'course-agromet-damu',
    trainerId: 'user-trainer-3',
    type: 'slides',
    title: 'Gramin Krishi Mausam Sewa: District Level Weather Advisory Protocols',
    description: 'Step-by-step guidance on combining NCMRWF block forecasts with crop stage phenology tables.',
    fileMeta: {
      name: 'DAMU_Advisory_Framework.pdf',
      sizeBytes: 6700000,
      mimeType: 'application/pdf',
      url: '/demo-files/DAMU_Advisory_Framework.pdf',
    },
    visibility: 'enrolled',
    uploadedAt: '2026-09-14T11:45:00Z',
  },
  {
    id: 'res-8',
    courseId: 'course-instruments-calibration',
    trainerId: 'user-trainer-5',
    type: 'document',
    title: 'NABL Metrology Compliance Checklist for Meteorological Inspection Labs',
    description: 'Documentation requirements for barometer, temperature, and rain gauge sensor traceability to national standards.',
    fileMeta: {
      name: 'Metrology_Lab_Manual_2026.pdf',
      sizeBytes: 4100000,
      mimeType: 'application/pdf',
      url: '/demo-files/Metrology_Lab_Manual_2026.pdf',
    },
    visibility: 'enrolled',
    uploadedAt: '2026-08-25T10:00:00Z',
  },
  ...Array.from({ length: 12 }).map((_, idx) => {
    const titles = [
      'WRF Model Domain Nesting Configuration Sample',
      'INSAT-3DR Mid-Level Water Vapor Channel Convective Diagnostic Guide',
      'Lightning Detection Network Sensor Siting Manual',
      'Monsoon Climatology Data Homogenization Scripts and Exercises',
      'Marine Gale Warning and Sea State Beaufort Scale Chart',
      'Urban Micrometeorological Heat Island Monitoring Protocol',
      'Automated Weather Station Solar Panel & Battery Sizing Calculation Sheet',
      'Cloud Seeding & Precipitation Physics Reference Notes',
      'Flash Flood Guidance System Threshold Map Interpretation',
      'Aviation Aerodrome Visibility Observers Logbook Template',
      'Synoptic Surface Plotting Symbol Compendium (WMO-306)',
      'Severe Weather Public Color-Coded Alert Advisory Protocol',
    ];
    return {
      id: `res-gen-${idx + 9}`,
      trainerId: 'user-trainer-1',
      type: idx % 3 === 0 ? ('slides' as const) : idx % 3 === 1 ? ('document' as const) : ('video' as const),
      title: titles[idx] || `Reference Resource ${idx + 9}`,
      description: `Training material and technical documentation supporting meteorological capacity building.`,
      fileMeta: {
        name: `met_resource_${idx + 9}.pdf`,
        sizeBytes: 2500000 + idx * 800000,
        mimeType: 'application/pdf',
        url: '/demo-files/met_resource.pdf',
      },
      visibility: 'public_trainees' as const,
      uploadedAt: `2026-09-${String((idx % 18) + 1).padStart(2, '0')}T10:00:00Z`,
    };
  }),
];

// ----------------------------------------------------
// 11. Feedback (Learner Course Evaluations)
// ----------------------------------------------------
export const SEED_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-1',
    courseId: 'course-instruments-calibration',
    traineeId: 'user-trainee-1',
    rating: 5,
    comment: 'Exceptional hands-on laboratory calibration sessions. Dr. Suresh Patil demonstrated NABL barometric transfer adjustments with precision.',
    submittedAt: '2026-09-20T17:30:00Z',
  },
  {
    id: 'fb-2',
    courseId: 'course-radar-advanced',
    traineeId: 'user-trainee-2',
    rating: 5,
    comment: 'The dual-polarization storm case studies from Mumbai DWR were incredibly illuminating. The question navigator in the quiz worked seamlessly.',
    submittedAt: '2026-09-26T14:00:00Z',
  },
  {
    id: 'fb-3',
    courseId: 'course-aviation-taf',
    traineeId: 'user-trainee-4',
    rating: 4,
    comment: 'Very practical simulation of ATC coordination during heavy convective squalls. Could use more examples on winter radiation fog dissipation.',
    submittedAt: '2026-09-25T11:20:00Z',
  },
  {
    id: 'fb-4',
    courseId: 'course-agromet-damu',
    traineeId: 'user-trainee-5',
    rating: 4,
    comment: 'Good coverage of block level soil moisture indices. Looking forward to advanced modules on pest weather correlation modeling.',
    submittedAt: '2026-09-27T09:45:00Z',
  },
];

// ----------------------------------------------------
// 12. Announcements (12 items published by Admin)
// ----------------------------------------------------
export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    type: 'notice',
    title: 'Autumn 2026 Specialized Training Schedule Released',
    body: 'The Meteorological Training Institute has published the schedule for Advanced Doppler Radar, Cyclone Track Modeling, and Aviation TAF Certification courses. Trainees are requested to review prerequisites and submit enrollment requests.',
    publishedBy: 'Dr. Sunita Kulkarni',
    publishedAt: '2026-09-01T09:00:00Z',
    pinned: true,
  },
  {
    id: 'ann-2',
    type: 'achievement',
    title: 'Capacity Building Milestone: 100% AWS Calibration Certification at Pune Centre',
    body: 'All 18 participating observers across western regional sub-stations have successfully completed the Surface Observational Metrology module and received demo completion credentials.',
    publishedBy: 'Dr. Sunita Kulkarni',
    publishedAt: '2026-09-21T11:00:00Z',
    pinned: true,
  },
  {
    id: 'ann-3',
    type: 'new_content',
    title: 'New Study Materials: Dual-Polarization Radar Case Studies Added to Trainer Library',
    body: 'Dr. Rajesh Sharma has uploaded new lecture recordings and annotated radar scans covering mesocyclone and microburst signatures in the western ghats.',
    publishedBy: 'Dr. Rajesh Sharma',
    publishedAt: '2026-09-15T14:30:00Z',
    pinned: false,
  },
  {
    id: 'ann-4',
    type: 'announcement',
    title: 'Notice Regarding Post-Monsoon Cyclone Warning Readiness Training',
    body: 'Senior forecasters nominated for Regional Specialized Meteorological Centre (RSMC) duties are requested to confirm participation in the Tropical Cyclone Track Prediction course commencing at Chennai Centre.',
    publishedBy: 'Dr. Sunita Kulkarni',
    publishedAt: '2026-09-18T10:00:00Z',
    pinned: false,
  },
  ...Array.from({ length: 8 }).map((_, idx) => {
    const titles = [
      'National Monsoon Mission High-Resolution Modeling Seminar',
      'Notice: INSAT-3DR Multispectral Data Access Portal Routine Maintenance',
      'Recognition: Outstanding Assessment Performance in Satellite Meteorology',
      'Call for Faculty: Coastal Mesonet Observational Maintenance Specialist',
      'Important: Deadline for Aviation TAF Module 1 Assessment Approaching',
      'Announcement: District Agromet Advisory DAMU Capacity Enhancement',
      'Update: Guidelines on WMO Level 3 & Level 4 Competency Recording',
      'Winter Fog Nowcasting Operational Strategy Meeting Scheduled',
    ];
    const types: Announcement['type'][] = ['notice', 'announcement', 'achievement', 'new_content'];
    return {
      id: `ann-auto-${idx + 5}`,
      type: types[idx % types.length],
      title: titles[idx] || `Departmental Bulletin ${idx + 5}`,
      body: `Operational bulletin concerning continuous professional development, meteorological calibration standards, and scheduled capacity building sessions.`,
      publishedBy: 'Dr. Sunita Kulkarni',
      publishedAt: `2026-09-${String((idx % 15) + 5).padStart(2, '0')}T10:00:00Z`,
      pinned: false,
    };
  }),
];

// ----------------------------------------------------
// 13. Certificates (Demo Only with Watermark)
// ----------------------------------------------------
export const SEED_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-demo-1',
    enrollmentId: 'enr-demo-3',
    courseId: 'course-instruments-calibration',
    courseTitle: 'Surface Automated Weather Station (AWS) Maintenance & Metrology',
    traineeId: 'user-trainee-1',
    traineeName: 'Pooja Narang',
    issuedAt: '2026-09-20T17:05:00Z',
    code: 'CC-DEMO-2026-PUNE-0082',
    synthetic: true,
  },
];

// ----------------------------------------------------
// 14. Audit Log (Initial audit trail records)
// ----------------------------------------------------
export const SEED_AUDIT_LOG: AuditEvent[] = [
  {
    id: 'aud-1',
    actorId: 'user-admin',
    actorName: 'Dr. Sunita Kulkarni',
    action: 'SYSTEM_INITIALIZED',
    entityType: 'System',
    entityId: 'capacity-connect-db',
    at: '2026-09-01T08:00:00Z',
    meta: { status: 'Seeded with synthetic prototype records', records: 150 },
  },
  {
    id: 'aud-2',
    actorId: 'user-admin',
    actorName: 'Dr. Sunita Kulkarni',
    action: 'COURSE_PUBLISHED',
    entityType: 'Course',
    entityId: 'course-radar-advanced',
    at: '2026-09-02T09:15:00Z',
    meta: { title: 'Advanced Doppler Weather Radar Operations' },
  },
  {
    id: 'aud-3',
    actorId: 'user-admin',
    actorName: 'Dr. Sunita Kulkarni',
    action: 'TRAINER_VERIFIED',
    entityType: 'TrainerEvidence',
    entityId: 'ev-101',
    at: '2026-09-02T10:00:00Z',
    meta: { trainerName: 'Dr. Rajesh Sharma', competency: 'comp-radar-meteorology' },
  },
  {
    id: 'aud-4',
    actorId: 'user-trainee-1',
    actorName: 'Pooja Narang',
    action: 'COURSE_ENROLLED',
    entityType: 'Enrollment',
    entityId: 'enr-demo-1',
    at: '2026-09-02T10:05:00Z',
    meta: { courseTitle: 'Advanced Doppler Weather Radar Operations' },
  },
  {
    id: 'aud-5',
    actorId: 'user-admin',
    actorName: 'Dr. Sunita Kulkarni',
    action: 'CERTIFICATE_ISSUED',
    entityType: 'Certificate',
    entityId: 'cert-demo-1',
    at: '2026-09-20T17:05:00Z',
    meta: { traineeName: 'Pooja Narang', code: 'CC-DEMO-2026-PUNE-0082' },
  },
];

// ----------------------------------------------------
// 15. Notifications (Initial notifications)
// ----------------------------------------------------
export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'user-trainee-1',
    title: 'Assessment Deadline Approaching',
    message: 'Module 1 Assessment: Dual-Polarization Radar Storm Signatures is due in 3 days.',
    link: '/assessments/assess-radar-advanced',
    read: false,
    createdAt: '2026-09-27T08:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-trainee-1',
    title: 'Certificate Issued (Demo)',
    message: 'Congratulations! Your certificate for Surface Automated Weather Station Maintenance is available.',
    link: '/certificates',
    read: true,
    createdAt: '2026-09-20T17:10:00Z',
  },
  {
    id: 'notif-3',
    userId: 'user-trainer-1',
    title: 'New Trainee Enrolled',
    message: 'Pooja Narang enrolled in your Advanced Doppler Weather Radar course.',
    link: '/trainer/courses/course-radar-advanced/cohort',
    read: false,
    createdAt: '2026-09-02T10:06:00Z',
  },
  {
    id: 'notif-4',
    userId: 'user-admin',
    title: 'Pending Account Approvals',
    message: '3 new registrations are awaiting administrative review in User Management.',
    link: '/admin/users',
    read: false,
    createdAt: '2026-09-25T14:15:00Z',
  },
];

// ----------------------------------------------------
// 15. Seed Applications & Credentials
// ----------------------------------------------------
export const SEED_CREDENTIALS: Credential[] = [];

export const SEED_APPLICATIONS: Application[] = [
  // 1. Pending Trainer: Dr. Hema Iyer
  {
    id: 'app-pending-hema',
    userId: 'user-pending-2',
    role: 'trainer',
    revision: 1,
    status: 'submitted',
    submittedAt: '2026-09-22T11:45:00Z',
    payload: {
      name: 'Dr. Hema Iyer',
      email: 'hema.iyer@capacityconnect.demo',
      centreId: 'centre-chennai',
      deliveryModes: ['in_person', 'blended'],
      consentGiven: true,
      qualifications: [
        {
          id: 'q-hema-1',
          degree: 'Ph.D. in Marine Geophysics',
          institution: 'National Institute of Oceanography (NIO)',
          year: 2018,
          field: 'Coastal Hydrodynamics & Storm Surge Dynamics',
        },
        {
          id: 'q-hema-2',
          degree: 'M.Sc. in Physical Oceanography',
          institution: 'Cochin University of Science and Technology (CUSAT)',
          year: 2013,
          field: 'Marine Meteorology & Wave Dynamics',
        },
      ],
      subjects: ['Tropical Cyclone Forecasting', 'Marine Meteorology', 'Satellite Meteorology'],
      competencies: [
        { competencyId: 'comp-cyclone-tracking', level: 3 },
        { competencyId: 'comp-marine-meteorology', level: 3 },
      ],
      evidence: [
        {
          id: 'ev-hema-1',
          competencyId: 'comp-cyclone-tracking',
          type: 'delivered_course',
          count: 6,
          years: 5,
          sourceNote: 'Lead Faculty: Coastal Storm Surge and Bay of Bengal Cyclogenesis Workshop series (2021-2025)',
          verifiedStatus: 'unverified',
        },
        {
          id: 'ev-hema-2',
          competencyId: 'comp-marine-meteorology',
          type: 'certification',
          count: 2,
          years: 7,
          sourceNote: 'Certified Marine Weather Forecaster, WMO Marine Services Training Panel',
          verifiedStatus: 'unverified',
        },
        {
          id: 'ev-hema-3',
          competencyId: 'comp-cyclone-tracking',
          type: 'publication',
          count: 3,
          years: 4,
          sourceNote: 'Peer-reviewed papers on Dvorak Technique calibration in North Indian Ocean Basin',
          verifiedStatus: 'unverified',
        },
      ],
      experience: [
        {
          id: 'exp-hema-1',
          organization: 'Regional Meteorological Centre Chennai',
          role: 'Meteorologist Grade-I (Marine Forecasting Section)',
          fromYear: 2018,
          current: true,
          description: 'Issuance of coastal sea bulletins, port warnings, and cyclone track advisory dispatches.',
        },
      ],
      availability: [
        {
          id: 'av-hema-1',
          startDate: '2026-10-01',
          endDate: '2026-12-15',
          isAvailable: true,
          notes: 'Available for blended and regional in-person lectures.',
        },
      ],
      preferredCentres: ['centre-chennai', 'centre-pune'],
      bio: 'Marine meteorologist specializing in coastal cyclogenesis, high-resolution swell forecasting, and impact risk communication.',
    },
  },

  // 2. Pending Trainee: Tarun Saxena
  {
    id: 'app-pending-tarun',
    userId: 'user-pending-1',
    role: 'trainee',
    revision: 1,
    status: 'submitted',
    submittedAt: '2026-09-20T08:15:00Z',
    payload: {
      name: 'Tarun Saxena',
      email: 'tarun.saxena@capacityconnect.demo',
      centreId: 'centre-delhi',
      designation: 'Scientific Assistant (Instruments)',
      consentGiven: true,
      qualifications: [
        {
          id: 'q-tarun-1',
          degree: 'B.Tech in Electronics & Instrumentation',
          institution: 'Delhi Technological University',
          year: 2022,
          field: 'Sensor Calibration & Telemetry',
        },
      ],
      experience: [
        {
          id: 'exp-tarun-1',
          organization: 'Instruments Division, Mausam Bhawan',
          role: 'Technical Intern / Trainee',
          fromYear: 2023,
          current: true,
          description: 'Calibration of digital barometer pressure transducers and AWS tipping bucket rain gauges.',
        },
      ],
      isFresher: false,
      skills: [
        { name: 'AWS Sensor Telemetry', level: 2 },
        { name: 'Barometer Calibration', level: 2 },
      ],
      interests: ['Meteorological Instruments', 'Radar Operations'],
      certificates: [
        {
          id: 'cert-tarun-1',
          title: 'Certificate in Industrial Sensor Calibration',
          issuer: 'National Metrology Training Centre',
          year: 2023,
          credentialId: 'NMTC-2023-994',
        },
      ],
    },
  },

  // 3. Pending Trainee: Deepak Mondal
  {
    id: 'app-pending-deepak',
    userId: 'user-pending-3',
    role: 'trainee',
    revision: 1,
    status: 'submitted',
    submittedAt: '2026-09-25T14:10:00Z',
    payload: {
      name: 'Deepak Mondal',
      email: 'deepak.mondal@capacityconnect.demo',
      centreId: 'centre-kolkata',
      designation: 'Junior Meteorological Assistant',
      consentGiven: true,
      qualifications: [
        {
          id: 'q-deepak-1',
          degree: 'M.Sc. in Physics',
          institution: 'Calcutta University',
          year: 2023,
          field: 'Atmospheric Physics',
        },
      ],
      experience: [],
      isFresher: true,
      skills: [
        { name: 'Synoptic Chart Plotting', level: 1 },
        { name: 'Surface Meteorological Observations', level: 2 },
      ],
      interests: ['Nowcasting Services', 'Agrometeorological Advisory'],
      certificates: [],
    },
  },

  // 4. Approved Trainee (Awaiting Onboarding): Kavita Sundaram
  {
    id: 'app-onboard-kavita',
    userId: 'user-onboard-trainee',
    role: 'trainee',
    revision: 1,
    status: 'approved',
    submittedAt: '2026-09-24T10:00:00Z',
    decidedAt: '2026-09-25T09:00:00Z',
    decidedBy: 'user-admin',
    payload: {
      name: 'Kavita Sundaram',
      email: 'trainee.new@capacityconnect.demo',
      centreId: 'centre-chennai',
      designation: 'Assistant Meteorologist Grade-II',
      consentGiven: true,
      qualifications: [
        {
          id: 'q-kavita-1',
          degree: 'M.Sc. in Atmospheric Sciences',
          institution: 'Anna University, Chennai',
          year: 2021,
          field: 'Radar & Satellite Meteorology',
        },
      ],
      experience: [
        {
          id: 'exp-kavita-1',
          organization: 'Cyclone Detection Radar Station Karaikal',
          role: 'Radar Duty Officer',
          fromYear: 2022,
          current: true,
          description: 'Real-time observation of coastal rainband reflectivity and velocity azimuth displays.',
        },
      ],
      isFresher: false,
      skills: [
        { name: 'Doppler Velocity De-aliasing', level: 2 },
        { name: 'VAD Wind Profile Interpretation', level: 2 },
      ],
      interests: ['Radar Meteorology', 'Nowcasting Services', 'Aviation Weather Services'],
      certificates: [
        {
          id: 'cert-kavita-1',
          title: 'WMO Certificate in Weather Radar Basic Operations',
          issuer: 'WMO Regional Training Centre',
          year: 2023,
          credentialId: 'WMO-RTC-2023-412',
        },
      ],
    },
  },

  // 5. Approved Trainer (Awaiting Onboarding): Dr. Alok Verma
  {
    id: 'app-onboard-alok',
    userId: 'user-onboard-trainer',
    role: 'trainer',
    revision: 1,
    status: 'approved',
    submittedAt: '2026-09-24T11:00:00Z',
    decidedAt: '2026-09-25T09:30:00Z',
    decidedBy: 'user-admin',
    payload: {
      name: 'Dr. Alok Verma',
      email: 'trainer.new@capacityconnect.demo',
      centreId: 'centre-delhi',
      deliveryModes: ['online', 'blended'],
      consentGiven: true,
      qualifications: [
        {
          id: 'q-alok-1',
          degree: 'Ph.D. in Remote Sensing & Satellite Meteorology',
          institution: 'Indian Institute of Technology (IIT) Delhi',
          year: 2017,
          field: 'INSAT-3D/3DR Radiance Assimilation',
        },
      ],
      subjects: ['Satellite Meteorology', 'Nowcasting Services', 'Numerical Weather Prediction'],
      competencies: [
        { competencyId: 'comp-satellite-imagery', level: 4 },
        { competencyId: 'comp-nowcasting', level: 3 },
      ],
      evidence: [
        {
          id: 'ev-alok-1',
          competencyId: 'comp-satellite-imagery',
          type: 'delivered_course',
          count: 8,
          years: 6,
          sourceNote: 'Faculty lead: INSAT-3DR Multispectral Imagery and RGB Composite Training (2020-2024)',
          verifiedStatus: 'verified',
        },
        {
          id: 'ev-alok-2',
          competencyId: 'comp-nowcasting',
          type: 'certification',
          count: 1,
          years: 7,
          sourceNote: 'Certified Lead Instructor: Rapid Convective Cloud Identification',
          verifiedStatus: 'unverified',
        },
      ],
      experience: [
        {
          id: 'exp-alok-1',
          organization: 'Satellite Meteorology Division, New Delhi',
          role: 'Scientist-D',
          fromYear: 2017,
          current: true,
          description: 'Operational processing of geostationary sounder and imager products.',
        },
      ],
      availability: [
        {
          id: 'av-alok-1',
          startDate: '2026-10-15',
          endDate: '2026-12-31',
          isAvailable: true,
          notes: 'Available for morning virtual workshops and live case review clinics.',
        },
      ],
      preferredCentres: ['centre-delhi', 'centre-pune'],
      bio: 'Satellite meteorologist specializing in geostationary sounding assimilation and convective storm cloud-top microphysics.',
    },
  },

  // 6. Needs Info Trainer: Sanjay Deshpande
  {
    id: 'app-needs-info-sanjay',
    userId: 'user-needs-info-1',
    role: 'trainer',
    revision: 1,
    status: 'needs_info',
    submittedAt: '2026-09-23T14:30:00Z',
    adminNote: 'Please provide certified lecture records or institutional dispatch orders confirming prior delivery of Numerical Weather Prediction modules.',
    decidedBy: 'user-admin',
    decidedAt: '2026-09-24T12:00:00Z',
    payload: {
      name: 'Sanjay Deshpande',
      email: 'trainer.needsinfo@capacityconnect.demo',
      centreId: 'centre-pune',
      deliveryModes: ['in_person', 'blended'],
      consentGiven: true,
      qualifications: [
        {
          id: 'q-sanjay-1',
          degree: 'M.Tech in Atmospheric Sciences',
          institution: 'Pune University',
          year: 2019,
          field: 'Mesoscale NWP Modeling',
        },
      ],
      subjects: ['Numerical Weather Prediction', 'Agrometeorological Advisory'],
      competencies: [
        { competencyId: 'comp-nwp-modeling', level: 2 },
      ],
      evidence: [
        {
          id: 'ev-sanjay-1',
          competencyId: 'comp-nwp-modeling',
          type: 'delivered_course',
          count: 2,
          years: 2,
          sourceNote: 'Internal departmental model run clinics (unverified)',
          verifiedStatus: 'unverified',
        },
      ],
      experience: [
        {
          id: 'exp-sanjay-1',
          organization: 'CR Pune NWP Section',
          role: 'Scientific Officer',
          fromYear: 2020,
          current: true,
          description: 'WRF model execution and verification against rain gauge networks.',
        },
      ],
      availability: [
        {
          id: 'av-sanjay-1',
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          isAvailable: true,
        },
      ],
      preferredCentres: ['centre-pune'],
      bio: 'Numerical weather prediction practitioner with experience in WRF modeling and ensemble verification.',
    },
  },

  // 7. Rejected Trainee: Ramesh Patel
  {
    id: 'app-rejected-ramesh',
    userId: 'user-rejected-1',
    role: 'trainee',
    revision: 1,
    status: 'rejected',
    submittedAt: '2026-09-21T09:15:00Z',
    adminNote: 'Incomplete qualifying degree records. Meteorological assistant applications require minimum Bachelor of Science degree in Physics or Mathematics with university seal.',
    decidedBy: 'user-admin',
    decidedAt: '2026-09-22T10:00:00Z',
    payload: {
      name: 'Ramesh Patel',
      email: 'trainee.rejected@capacityconnect.demo',
      centreId: 'centre-kolkata',
      designation: 'Meteorological Observer Candidate',
      consentGiven: true,
      qualifications: [
        {
          id: 'q-ramesh-1',
          degree: 'Higher Secondary Certificate',
          institution: 'State Board of Education',
          year: 2020,
          field: 'Science Stream',
        },
      ],
      experience: [],
      isFresher: true,
      skills: [
        { name: 'Rainfall Reading', level: 1 },
      ],
      interests: ['Public Weather Services'],
      certificates: [],
    },
  },
];

