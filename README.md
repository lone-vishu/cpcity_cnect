# Capacity Connect — Digital Capacity-Building & Learning Management Portal

> **Capacity Connect** | **Digital Capacity-Building & Learning Management Portal**  
> **Ministry:** Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD) Training Context  
> **Key Differentiator:** Explainable, rules-based, deterministic trainer matching with transparent match evidence and administrator review.

---

## 1. Non-Negotiable Honesty & Governance Disclaimers

The following ethical boundaries are strictly enforced across the portal UI and codebase:

1. **Synthetic Data Only:** All personnel records, courses, attendance logs, and test results are synthetic demonstration fixtures (`synthetic: true` on all records). A persistent, dismissible banner is displayed at the top of the interface.
2. **Deterministic Matching (Strictly NO AI Claims):** The trainer recommendation engine uses pure, explainable, weighted multi-factor heuristic scoring. There are **zero** LLMs, vector embeddings, or black-box algorithms. No "AI-powered" labels appear anywhere.
3. **No Claimed Government Integrations:** The prototype connects to no external government systems. Screens referencing IMD HRMS, iGOT Karmayogi, UNNATI, or NIC SSO are architectural placeholders explicitly labeled *"Future interface, not connected, requires sponsor approval."*
4. **Neutral Original Branding:** No official State Emblem of India, no IMD seal, and no counterfeit government logos. The application uses the original neutral logotype **Capacity Connect**.
5. **Safe Demo Email Domain:** All demo user accounts use `@capacityconnect.demo`—never real names or `@imd.gov.in` addresses.
6. **Demo Scoring Weights:** Scoring weights are prototype assumptions labeled *"Demo weights, not IMD policy"*, fully configurable by the administrator.
7. **Taxonomy & Watermarked Certificates:** Competencies use standard WMO-referenced descriptions labeled *"Demo taxonomy (WMO-referenced, pending expert review v0.1)"*. All completion certificates are prominently stamped **"DEMO — NOT AN OFFICIAL CERTIFICATE"**.

---

## 2. Architecture & Layered Structure

The application is engineered strictly in layered tiers to enable swapping from local mock repositories to a live REST backend without rewriting UI components:

```
src/
  domain/               # Pure business domain (No React, zero I/O)
    types.ts            # TypeScript domain entities & Zod schemas
    schemas.ts          # Form validation schemas
    matching/           # Pure, deterministic trainer matching engine (unit-tested)
    workflow/           # Pure state machines for Courses, Accounts, & Enrollments
  data/
    repositories/       # Repository interfaces ONLY (IUserRepository, ICourseRepository, etc.)
    adapters/
      mock/             # In-memory + localStorage implementation seeded with realistic data
      http/             # Production REST skeleton connecting to /api/v1 endpoints
    index.ts            # Adapter selector via VITE_DATA_SOURCE=mock|http
  seed/                 # Synthetic demonstration data (25 trainees, 8 trainers, 10 courses)
  services/             # Use-case services consumed by UI (courseService, matchingService, etc.)
  auth/                 # AuthProvider, RoleGuard, and RBAC permission definitions
  features/             # Grouped by functional capability:
    public/             # Home, Login, Signup, Announcements, 403, 404
    courses/            # Course Catalogue, Course Detail
    trainee/            # Dashboard, Profile, My Learning, Assessments, Certificates
    trainer/            # Dashboard, Profile, Multi-step Course Builder, Cohorts, Assessment Builder, Library
    admin/              # Dashboard, User Management, Approvals, Training Needs, Trainer Match, Competencies, Verification, Reports, Audit, Settings
  components/           # Reusable UI primitives (Modals, Toasts, Skeletons, Banners, AppShell)
  config/               # app.config.ts (branding, default weights, feature flags)
  lib/                  # Pure utilities (date formatting, CSV export, sleep, ID generator)
```

---

## 3. Role-Aware Entry, Demo Quick Access & Password Handling

1. **Role Buttons Never Auto-Sign In:** Clicking role cards on the home page routes directly to `/login?role=<role>` (or `/register/<role>`), never creating a session.
2. **Demo Quick Access Panel:** A collapsible "Demo Quick Access" panel on the home page (enabled when `enableDemoQuickAccess: true`) allows presenters to sign in as seeded accounts in one click for the 5-7 minute demonstration.
3. **Role Enforcement on Login:** The `/login` page displays role-specific branding and segmented tabs. If credentials belong to a different role, authentication is blocked with an informative message and a 1-click role switcher button that preserves the email.
4. **Credential Verification:**
   - Seeded demo accounts (`demoQuickAccess: true`) accept any password and are clearly labeled.
   - Newly registered user accounts require their actual registered password, verified against a salted SHA-256 hash via Web Crypto in the mock adapter (Note: for demo purposes only; production must use Argon2id/bcrypt).
5. **Post-Login Routing (`resolvePostLoginRoute`):**
   - `status = pending` -> `/account/pending` (application under review)
   - `status = needs_info` -> `/account/needs-info` (shows admin note; "Edit and resubmit" re-opens prefilled wizard)
   - `status = rejected` -> `/account/rejected` (shows reason; "Edit and reapply" re-opens prefilled wizard)
   - `status = suspended` -> `/account/suspended`
   - `status = approved` and `onboardingStatus != complete` -> `/onboarding/<role>`
   - otherwise -> Role dashboard

| Role | Demo Email | Demo Password | Primary Purpose in Prototype |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin.demo@capacityconnect.demo` | Any password | Approve applicants, execute Trainer Match, adjust weights, review audit log |
| **Trainer** | `trainer.demo@capacityconnect.demo` | Any password | Build courses, inspect cohort attendance, upload lecture slides, create assessments |
| **Trainee** | `trainee.demo@capacityconnect.demo` | Any password | Complete profile, enroll in courses, attempt MCQ quiz, download demo certificate |

---

## 4. New-User Registration & Onboarding Lifecycle

### 4.1 Multi-Step Registration Wizards (`/register/trainee`, `/register/trainer`)
- **6 Step Flow:**
  - Trainee: Account -> Qualifications -> Experience (with Fresher toggle) -> Skills & Interests -> Certificates (demo scan upload) -> Review & Submit.
  - Trainer: Account -> Qualifications -> Subjects & Competencies -> Evidence with Completeness Meter -> Experience & Availability -> Review & Submit.
- **Autosaved Drafts:** Drafts are saved in `draftService` and restored automatically when the user returns with the same email.
- **Confirmation Page (`/register/submitted`):** Shows application reference ID and instructions to wait for administrator approval before signing in.

### 4.2 Post-Approval First-Login Onboarding (`/onboarding/trainee`, `/onboarding/trainer`)
- Pre-filled from the approved application payload (users never retype information).
- Allows confirming qualifications, experience, skills/competencies, and availability.
- Trainer onboarding features an **Evidence Status** table with admin verification badges (Verified / Unverified).
- Completing onboarding updates `onboardingStatus = complete` and unlocks the role dashboard.

The 6-step core sequence across the portal:

```
[1. Admin Approves User & Publishes Need]
                   │
                   ▼
[2. Admin Runs Trainer Match (Reviews Evidence, Adjusts Weights, Assigns)]
                   │
                   ▼
[3. Trainer Submits Course & Publishes Assessment]
                   │
                   ▼
[4. Trainee Enrolls, Opens Resources, Passes MCQ Quiz, Earns Demo Certificate]
                   │
                   ▼
[5. Trainer Inspects Cohort Attendance & Performance Drawer]
                   │
                   ▼
[6. Admin Reviews Live KPI Dashboard, Exports CSV Report, Inspects Immutable Audit Log]
```

---

## 5. Quick Start & Execution

### Prerequisites
- Node.js 18+ (tested on Node 20 / 22 / 24)
- npm 9+

### Local Development Setup
```bash
# 1. Clone repository and navigate to folder
cd prototype_75

# 2. Install dependencies
npm install

# 3. Run automated test suite (20 unit & smoke tests)
npm test

# 4. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Docker Execution
```bash
# Build and run repeatable containerized demo on port 3000
docker-compose up --build
```
Open [http://localhost:3000](http://localhost:3000).

---

## 6. Swapping from Mock to Real Backend API

To connect the frontend to a real backend (e.g. FastAPI / NestJS implementing `docs/API_CONTRACT.md` and `docs/DATA_MODEL.sql`):

1. Set environment variables in `.env`:
   ```bash
   VITE_DATA_SOURCE=http
   VITE_API_BASE_URL=https://api.capacityconnect.demo/v1
   ```
2. Rebuild the application (`npm run build`).
3. If the backend is unreachable or not yet deployed, the `httpAdapter` fails gracefully with clear error toasts directing the engineer to the API contract.

---

## 7. Out-of-Scope Controls & Prototype Boundaries

In compliance with the project specification, **every button and control is functional**. Any integration genuinely requiring institutional clearance triggers a clear, explanatory toast (`showOutOfScope`):

| UI Action / Feature | Scope Notice Displayed |
| :--- | :--- |
| **Forgot Password** | Displays demo modal explaining self-service reset in mock mode. |
| **Download Material File** | Initiates download of structured demo `.txt` study brief. |
| **IMD HRMS Sync** | *"Future interface, not connected, requires sponsor approval."* |
| **iGOT Karmayogi Sync** | *"Future interface, not connected, requires sponsor approval."* |
| **NIC SSO (Jan Parichay)** | *"Future interface, not connected, requires sponsor approval."* |
| **UNNATI Portal Integration** | *"Future interface, not connected, requires sponsor approval."* |

---

## 8. Accompanying Architecture Documentation

- [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) — Comprehensive REST API endpoint contract (paths, payloads, response shapes, RBAC rules).
- [`docs/DATA_MODEL.sql`](./docs/DATA_MODEL.sql) — Production PostgreSQL 15 schema matching TypeScript types, including indexes, enum types, and append-only audit trigger.
- [`docs/REAL_DATA_MIGRATION.md`](./docs/REAL_DATA_MIGRATION.md) — Production migration blueprint covering ingestion pipelines, field mappings, anonymization, S3/MinIO signed URLs, DPDP Act 2023 compliance, and GIGW 3.0 accessibility certification.
