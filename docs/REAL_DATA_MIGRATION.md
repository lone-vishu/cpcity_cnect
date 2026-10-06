# Capacity Connect — Real Data & Production Migration Guide

**Context:** Digital Capacity Building & Learning Management Portal  
**Sponsor:** Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)  
**System:** Capacity Connect — Competency-Based Training & LMS

---

## 1. Executive Summary

This document specifies the exact transition plan from this working prototype (running in-memory mock adapters with synthetic demo data) to a production-grade, secure, multi-tier institutional deployment. It serves as an engineering blueprint for ministerial technical evaluators and infrastructure operations teams.

---

## 2. Replacing Synthetic Seed with Institutional Data

### 2.1 Ingestion Pipeline Architecture
The mock repository's seed files (`src/seed/initialData.ts`) will be replaced by an automated, schema-validated ingestion CLI and REST endpoint (`POST /admin/import`):
- **Input Formats:** CSV (UTF-8), Excel (`.xlsx`), JSON.
- **Validation Engine:** Strict schema validation via Zod (Node.js) or Pydantic (FastAPI).
- **Staging & Quarantining:** Uploaded batches enter a `staged` state; any row failing validation is isolated with row-level error reasons without aborting valid records.

### 2.2 Field Mapping Strategy
| Institutional IMD / HRMS Field | Capacity Connect Schema Field | Validation Rule & Transform |
| :--- | :--- | :--- |
| `EMPLOYEE_CODE` / `GPF_NO` | `User.id` (hashed or prefixed) | Unique identifier, mapped to `usr-<code-hash>` |
| `FULL_NAME` | `User.name` | Stripped of salutations; trim whitespace |
| `GOV_EMAIL` (`@imd.gov.in`) | `User.email` | RFC 5322 validation; institutional domain check |
| `CADRE` / `POST_NAME` | `TraineeProfile.designation` | Standardized against IMD Cadre Rules (e.g. Meteorologist-A) |
| `POSTING_STATION` | `centreId` | Mapped to station code (`CR-PUNE`, `HQ-DELHI`, etc.) |
| `WMO_COMPETENCY_CODE` | `Competency.id` | Cross-referenced with WMO-No. 49 guidelines |
| `TRAINING_DELIVERED_HRS` | `TrainerEvidence.count/years` | Minimum > 0; requires certification/dispatch order |

### 2.3 Pre-Ingestion Data Sanitization & Anonymization
Before statistical modeling, research publication, or testing in non-production environments:
- **Direct Identifiers:** Names and emails replaced with HMAC-SHA256 hashes using a secret salt rotated per environment.
- **Quasi-Identifiers:** Ages grouped into 5-year cohorts; dates truncated to month and year; locations generalized to regional centre level.
- **Differential Privacy:** Aggregate dashboards apply Laplace noise ($\epsilon = 0.5$) to prevent deanonymization of small regional cohorts (< 5 personnel).

---

## 3. Authentication & Authorization Modernization

### 3.1 Single Sign-On (SSO) & Production Password Hashing
- **Jan Parichay (NIC SSO):** Transition to OpenID Connect (OIDC) / OAuth 2.0 flow integrated with the National Informatics Centre gateway.
- **Fallback / Local Auth:** Multi-Factor Authentication (TOTP via Authenticator app or SMS OTP via Gov Mobile Gateway) for non-SSO authorized personnel.
- **Password Hashing:** The prototype uses Web Crypto SHA-256 with per-user salt solely for browser demo persistence. Production deployments must use **Argon2id** (memory cost 64MB, iterations 3) or **bcrypt** (work factor $\ge 12$), supplemented by adaptive rate limiting on `/auth/login` and `/auth/register` endpoints.
- **Session Tokens:** Stateless, signed JWTs with 15-minute access token lifespan and sliding-window refresh tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

### 3.2 Server-Side Role Enforcement, Status Guards & Onboarding Lifecycle
While the prototype demonstrates front-end permission guards (`src/auth/RoleGuard.tsx`), the production backend enforces identical authorization policies at the reverse proxy and controller level:
- **Role Verification:** Requests are strictly checked against JWT claims; attempts to authenticate under an incompatible role tab are rejected with `403 Forbidden` (`ROLE_MISMATCH`).
- **Account Status Gating:** Users in `pending`, `needs_info`, `rejected`, or `suspended` states have API access constrained exclusively to their respective `/account/*` status endpoints.
- **Onboarding Completion Enforcement:** Approved personnel must possess `onboarding_status = 'complete'` before accessing training rosters, course authoring, or candidate matching APIs.
- **Registration Drafts & Revisions:** Drafts are autosaved to server cache or database, and administrative "Request More Info" or "Reject" actions create traceable `Application` revisions with full audit logging.
- **Database Row-Level Security (RLS):** Restricts trainees to viewing their own records and trainers to their assigned batches.

---

## 4. Digital Assets & Object Storage Architecture

### 4.1 Transition from Placeholder Pickers to S3/MinIO
The client-side metadata file picker (`src/components/common/FileUploadPlaceholder.tsx`) transitions to an institutional object storage service (NIC Cloud MeghRaj / MinIO S3 cluster):
1. **Direct Upload via Presigned URLs:** Client requests `POST /api/v1/resources/upload-ticket`.
2. Backend validates MIME types (`video/mp4`, `application/pdf`, `application/vnd.ms-powerpoint`), enforces max size (50MB documents, 500MB video), and issues an expiring S3 presigned PUT URL.
3. Client streams directly to object storage; zero file payload passes through API application servers.
4. **Antivirus Scanning:** Uploaded buckets trigger automated clamAV asynchronous scanning before files transition to `available` status.

---

## 5. Audit Logging, DPDP Act 2023 & Compliance

### 5.1 Immutable Audit Log (WORM Storage)
- Every administrative approval, status alteration, trainer match execution, and grade override writes an `AuditEvent`.
- Production logs are replicated to Write-Once-Read-Many (WORM) cloud storage buckets with retention policies configured for 7 years per Central Government audit standards.
- Database trigger `prevent_audit_tampering()` in PostgreSQL prevents `UPDATE` or `DELETE` on the audit log table.

### 5.2 Digital Personal Data Protection (DPDP) Act 2023 Alignment
1. **Notice & Consent:** Clear bilingual consent notice upon first login stating data processing purposes (capacity tracking and training assignment).
2. **Purpose Limitation:** Personnel training history is used exclusively for institutional human resource readiness and curriculum design.
3. **Data Principal Rights:** Trainees have accessible screens to request correction of inaccurate service credentials or review recorded evidence portfolios.
4. **Grievance Redressal:** Administrative contact and grievance officer details surfaced in portal settings.

---

## 6. Guidelines for Indian Government Websites (GIGW 3.0)

The production implementation must undergo official STQC certification against GIGW 3.0:
- **WCAG 2.1 Level AA Compliance:** Tested for keyboard navigability, high color contrast ratio ($\ge 4.5:1$), semantic heading structures, and screen-reader accessibility (NVDA / JAWS).
- **Bilingual Interface:** Architecture is pre-structured with i18n keys for complete Hindi and English language toggling.
- **No Dead Links:** All controls execute actions, open dialogs, or display explicit scope indicators.

---

## 7. Sponsor Clarification Items (Prior to Production Deployment)

Before production commissioning, the following operational decisions require formal authorization from the Ministry of Earth Sciences / IMD leadership:
1. **Identity Authority:** Approval to register Capacity Connect with the Jan Parichay / NIC SSO federation.
2. **Competency Taxonomy Adoption:** Formal review and sign-off of the 14 WMO-referenced competency items by the IMD Training Advisory Committee.
3. **Hosting Infrastructure:** Provisioning of MeghRaj (NIC Cloud) virtual private cloud instances with PostgreSQL RDS and S3-compatible storage.
4. **Integration Roadmap:** Authorizing read-only replica access to the internal IMD Personnel Information System for automated employee profile synchronization.
