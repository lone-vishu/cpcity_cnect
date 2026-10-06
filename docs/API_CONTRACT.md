# Capacity Connect — REST API Specification & Contract

**Version:** 1.0.0 (Capacity Connect Specification)  
**Target Backend:** FastAPI (Python) or NestJS (Node.js/TypeScript)  
**Database:** PostgreSQL 15+  
**Authentication Scheme:** Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. Overview & Architecture Protocol

This document defines the strict HTTP REST contract between the **Capacity Connect** frontend and the production backend. The frontend adapter layer (`src/data/adapters/http/httpAdapter.ts`) adheres to these exact route signatures, query parameters, request bodies, and JSON responses.

### Base URL
- Staging / Production: `https://api.capacityconnect.demo/v1`
- Local Development: `http://localhost:8000/api/v1` (controlled via `VITE_API_BASE_URL`)

### Standard HTTP Status Codes
- `200 OK`: Successful retrieval / update
- `201 Created`: Successful entity creation
- `400 Bad Request`: Payload validation failure (Zod/Pydantic error details)
- `401 Unauthorized`: Missing or expired Bearer token
- `403 Forbidden`: Role-based access control violation
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Business state machine violation (e.g. course overcapacity, invalid transition)
- `500 Internal Server Error`: Unhandled server exception

---

## 2. Authentication & User Endpoints

### 2.1 Login
- **Method:** `POST`
- **Path:** `/auth/login`
- **Role Required:** Public
- **Request Body:**
```json
{
  "email": "trainer.demo@capacityconnect.demo",
  "password": "StrongPassword123!",
  "expectedRole": "trainer"
}
```
- **Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-trainer-001",
    "name": "Dr. Rajeshwar Sharma",
    "email": "trainer.demo@capacityconnect.demo",
    "role": "trainer",
    "status": "approved",
    "onboardingStatus": "complete",
    "onboardingStep": 6,
    "centreId": "centre_pune",
    "createdAt": "2025-01-15T09:00:00Z",
    "synthetic": true
  }
}
```
- **Response `403 Forbidden` (Role Mismatch):**
```json
{
  "error": "ROLE_MISMATCH",
  "message": "Account registered as trainee, but login attempted under trainer tab.",
  "actualRole": "trainee"
}
```

### 2.2 Register & Submit Application
- **Method:** `POST`
- **Path:** `/auth/register`
- **Role Required:** Public
- **Request Body:**
```json
{
  "user": {
    "name": "Dr. Hema Iyer",
    "email": "hema.iyer@capacityconnect.demo",
    "role": "trainer",
    "centreId": "centre_delhi",
    "password": "StrongPassword123!"
  },
  "payload": {
    "centreId": "centre_delhi",
    "deliveryModes": ["in_person", "online"],
    "qualifications": [
      { "degree": "Ph.D.", "institution": "IIT Delhi", "year": "2020", "field": "Meteorology" }
    ],
    "declaredCompetencies": [
      { "competencyId": "comp-radar-meteorology", "level": 4 }
    ],
    "evidence": [
      { "competencyId": "comp-radar-meteorology", "type": "certification", "count": 2, "sourceNote": "WMO radar certification" }
    ]
  }
}
```
- **Response `201 Created`:** Account created with `status: "pending"`, `onboardingStatus: "not_started"`, and linked `Application` created.

### 2.3 Check Email Uniqueness
- **Method:** `GET`
- **Path:** `/auth/email-exists`
- **Role Required:** Public
- **Query Params:** `email`
- **Response `200 OK`:**
```json
{
  "exists": false
}
```

### 2.4 Update Onboarding Progress
- **Method:** `PUT`
- **Path:** `/users/{id}/onboarding`
- **Role Required:** Self or `admin`
- **Request Body:**
```json
{
  "onboardingStatus": "in_progress",
  "onboardingStep": 3
}
```
- **Response `200 OK`:** Updated user object.

### 2.5 Get Current User Profile
- **Method:** `GET`
- **Path:** `/users/me`
- **Role Required:** Any authenticated user
- **Response `200 OK`:** User object with linked profile.

### 2.6 List Users
- **Method:** `GET`
- **Path:** `/users`
- **Role Required:** `admin`
- **Query Params:** `role`, `status`, `centreId`, `search`, `page`, `limit`
- **Response `200 OK`:** `User[]`

### 2.7 Update User Status
- **Method:** `PATCH`
- **Path:** `/users/{id}/status`
- **Role Required:** `admin`
- **Request Body:**
```json
{
  "status": "approved",
  "reason": "Administrative credential verification confirmed"
}
```

---

## 3. Competencies & Taxonomy Endpoints

### 3.1 List Competencies
- **Method:** `GET`
- **Path:** `/competencies`
- **Role Required:** Public / Authenticated
- **Response `200 OK`:**
```json
[
  {
    "id": "comp-radar-ops",
    "name": "Doppler Weather Radar (DWR) Calibration and Maintenance",
    "domain": "Radar Meteorology",
    "level": 3,
    "description": "Routine RF calibration, receiver dynamic range testing, and signal processor diagnostic verification.",
    "source": "Demo taxonomy (WMO-referenced, pending expert review)",
    "version": "0.1",
    "reviewStatus": "reviewed"
  }
]
```

### 3.2 Create Competency
- **Method:** `POST`
- **Path:** `/competencies`
- **Role Required:** `admin`
- **Request Body:** Omit `id`, provides name, domain, level, description, source, version.

### 3.3 Mark as Reviewed
- **Method:** `POST`
- **Path:** `/competencies/{id}/mark-reviewed`
- **Role Required:** `admin`

---

## 4. Course Lifecycle Endpoints

### 4.1 List Courses
- **Method:** `GET`
- **Path:** `/courses`
- **Role Required:** Public / Authenticated
- **Query Params:** `status`, `competencyId`, `centreId`, `deliveryMode`, `search`
- **Response `200 OK`:** `Course[]`

### 4.2 Get Course by ID
- **Method:** `GET`
- **Path:** `/courses/{id}`
- **Role Required:** Public / Authenticated
- **Response `200 OK`:** Course with populated objectives, competencies, trainer profile.

### 4.3 Create Course (Draft)
- **Method:** `POST`
- **Path:** `/courses`
- **Role Required:** `trainer` or `admin`

### 4.4 Transition Course Status
- **Method:** `POST`
- **Path:** `/courses/{id}/transition`
- **Role Required:** `admin` (or `trainer` for draft -> pending_approval)
- **Request Body:**
```json
{
  "status": "published",
  "reason": "Syllabus reviewed and schedule confirmed"
}
```

### 4.5 Assign Trainer to Course
- **Method:** `POST`
- **Path:** `/courses/{id}/assign-trainer`
- **Role Required:** `admin`
- **Request Body:**
```json
{
  "trainerId": "usr-trainer-001",
  "note": "Assigned via rules-based matching engine"
}
```

---

## 5. Trainer Matching Engine Endpoints

### 5.1 Run Trainer Match for Need / Course
- **Method:** `POST`
- **Path:** `/matching/run`
- **Role Required:** `admin`
- **Request Body:**
```json
{
  "target": {
    "id": "need-radar-001",
    "title": "Coastal Convective Nowcasting",
    "requiredCompetencyIds": ["comp-nowcasting-obs", "comp-radar-ops"],
    "targetCentreId": "centre_chennai",
    "deliveryMode": "blended",
    "window": {
      "startDate": "2026-04-10",
      "endDate": "2026-04-24"
    }
  },
  "weights": {
    "competencyOverlap": 45,
    "qualificationRelevance": 25,
    "priorDelivery": 20,
    "availabilityCentreFit": 10
  }
}
```
- **Response `200 OK`:** Ranked `MatchResult[]` with factor breakdown, supporting evidence rows, missing information alerts, and plain-language explanation strings.

### 5.2 Record Match Decision
- **Method:** `POST`
- **Path:** `/matching/decision`
- **Role Required:** `admin`
- **Request Body:**
```json
{
  "targetId": "need-radar-001",
  "trainerId": "usr-trainer-001",
  "decision": "accepted",
  "note": "Selected based on high verified radar competency"
}
```

---

## 6. Enrollment & Cohort Endpoints

### 6.1 Enroll in Course
- **Method:** `POST`
- **Path:** `/enrollments`
- **Role Required:** `trainee` (or `admin` on behalf)
- **Request Body:**
```json
{
  "courseId": "course-radar-advanced"
}
```
- **Response `201 Created`:** Enrollment record with status `enrolled` (or `waitlisted` if capacity full).

### 6.2 Mark Cohort Attendance
- **Method:** `PATCH`
- **Path:** `/enrollments/{id}/attendance`
- **Role Required:** `trainer` or `admin`
- **Request Body:**
```json
{
  "attendancePct": 85
}
```

---

## 7. Assessment & Certification Endpoints

### 7.1 List Assessments for Course
- **Method:** `GET`
- **Path:** `/courses/{courseId}/assessments`
- **Role Required:** Enrolled trainee, trainer, or admin

### 7.2 Submit Assessment Attempt
- **Method:** `POST`
- **Path:** `/assessments/{id}/attempts`
- **Role Required:** `trainee`
- **Request Body:**
```json
{
  "answers": [0, 2, 1, 3, 0, 1, 2, 0]
}
```
- **Response `200 OK`:**
```json
{
  "score": 87.5,
  "passed": true,
  "correctCount": 7,
  "totalCount": 8,
  "submittedAt": "2026-09-28T10:00:00Z"
}
```

### 7.3 Issue Certificate
- **Method:** `POST`
- **Path:** `/certificates/issue`
- **Role Required:** System / `admin`
- **Request Body:** `{ "enrollmentId": "enr-001" }`
- **Response `201 Created`:** Certificate object watermarked `DEMO — NOT AN OFFICIAL CERTIFICATE`.

---

## 8. Audit Log Endpoints

### 8.1 Query Audit Trail
- **Method:** `GET`
- **Path:** `/audit`
- **Role Required:** `admin`
- **Query Params:** `actorId`, `entityType`, `entityId`, `from`, `to`, `limit`
- **Response `200 OK`:** `AuditEvent[]` (Append-only immutable event stream)

---

## 9. Registration Drafts & Application Review Endpoints

### 9.1 Get Registration Draft
- **Method:** `GET`
- **Path:** `/registration-drafts`
- **Role Required:** Public (scoped to requester email & role)
- **Query Params:** `email`, `role`
- **Response `200 OK`:** `RegistrationDraft | null`
```json
{
  "email": "trainee.new@capacityconnect.demo",
  "role": "trainee",
  "step": 3,
  "payload": {
    "qualifications": [...],
    "experience": [...]
  },
  "updatedAt": "2026-09-28T12:00:00Z"
}
```

### 9.2 Save Registration Draft
- **Method:** `PUT`
- **Path:** `/registration-drafts`
- **Role Required:** Public
- **Request Body:** `RegistrationDraft`
- **Response `200 OK`:** `{ "success": true }`

### 9.3 List Applications
- **Method:** `GET`
- **Path:** `/applications`
- **Role Required:** `admin`
- **Query Params:** `status` (`submitted`, `needs_info`, `approved`, `rejected`)
- **Response `200 OK`:** `Application[]`

### 9.4 Get Application by ID
- **Method:** `GET`
- **Path:** `/applications/{id}`
- **Role Required:** `admin` or application owner
- **Response `200 OK`:** `Application`

### 9.5 Submit Application Decision
- **Method:** `POST`
- **Path:** `/applications/{id}/decision`
- **Role Required:** `admin`
- **Request Body:**
```json
{
  "decision": "approved", // "approved" | "rejected" | "needs_info"
  "adminNote": "Verified qualifications and radar certifications with RTC.",
  "decidedBy": "usr-admin"
}
```
- **Response `200 OK`:** Updated `Application` record. Updates applicant user status to `approved`, `needs_info`, or `rejected`, logs an `AuditEvent`, and dispatches an applicant notification.

### 9.6 Resubmit Application
- **Method:** `POST`
- **Path:** `/applications/{id}/resubmit`
- **Role Required:** Applicant (owner of application)
- **Request Body:**
```json
{
  "payload": {
    "centreId": "centre_delhi",
    "deliveryModes": ["in_person", "online"],
    "qualifications": [...],
    "declaredCompetencies": [...],
    "evidence": [...]
  }
}
```
- **Response `200 OK`:** Updated `Application` with incremented `revision` (e.g. Rev 2), status set back to `submitted`, user status reset to `pending`, and notification sent to administrators.

