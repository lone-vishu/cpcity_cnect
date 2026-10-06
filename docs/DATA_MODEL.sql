-- =====================================================================
-- Capacity Connect — PostgreSQL Production Relational Schema
-- Version: 1.0.0 (MoES / IMD Prototype Context)
-- Target Engine: PostgreSQL 14+
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Regional Training Centres
-- ---------------------------------------------------------------------
CREATE TABLE centres (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed centres
INSERT INTO centres (id, name, code, location) VALUES
    ('centre_pune', 'IMD Training Centre Pune', 'CR-PUNE', 'Pune, Maharashtra'),
    ('centre_delhi', 'National Weather Forecasting Centre New Delhi', 'HQ-DELHI', 'New Delhi'),
    ('centre_kolkata', 'Regional Meteorological Centre Kolkata', 'RMC-KOLKATA', 'Kolkata, West Bengal'),
    ('centre_chennai', 'Regional Meteorological Centre Chennai', 'RMC-CHENNAI', 'Chennai, Tamil Nadu');

-- ---------------------------------------------------------------------
-- 2. User Accounts & Roles
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('trainee', 'trainer', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'needs_info', 'approved', 'rejected', 'suspended');
CREATE TYPE onboarding_status AS ENUM ('not_started', 'in_progress', 'complete');

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'usr_' || uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'trainee',
    status account_status NOT NULL DEFAULT 'pending',
    onboarding_status onboarding_status NOT NULL DEFAULT 'not_started',
    onboarding_step INT DEFAULT 1,
    centre_id VARCHAR(64) REFERENCES centres(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_centre ON users(centre_id);

-- ---------------------------------------------------------------------
-- 3. Trainee Profiles
-- ---------------------------------------------------------------------
CREATE TABLE trainee_profiles (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    designation VARCHAR(255),
    qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    interests TEXT[] NOT NULL DEFAULT '{}',
    skills TEXT[] NOT NULL DEFAULT '{}',
    certificates JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. Competency Catalogue (Standardized Taxonomy)
-- ---------------------------------------------------------------------
CREATE TYPE competency_review_status AS ENUM ('demo', 'reviewed');

CREATE TABLE competencies (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'comp_' || uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
    description TEXT NOT NULL,
    source VARCHAR(255) NOT NULL DEFAULT 'Demo taxonomy (WMO-referenced, pending expert review)',
    version VARCHAR(32) NOT NULL DEFAULT '0.1',
    review_status competency_review_status NOT NULL DEFAULT 'demo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competencies_domain ON competencies(domain);
CREATE INDEX idx_competencies_level ON competencies(level);
CREATE INDEX idx_competencies_status ON competencies(review_status);

-- ---------------------------------------------------------------------
-- 5. Trainer Profiles & Recorded Competency Evidence
-- ---------------------------------------------------------------------
CREATE TABLE trainer_profiles (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    subjects TEXT[] NOT NULL DEFAULT '{}',
    qualifications TEXT[] NOT NULL DEFAULT '{}',
    availability JSONB NOT NULL DEFAULT '[]'::jsonb,
    centre_id VARCHAR(64) REFERENCES centres(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE evidence_type AS ENUM ('certification', 'delivered_course', 'qualification', 'publication');
CREATE TYPE verification_status AS ENUM ('unverified', 'verified');

CREATE TABLE trainer_evidence (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'ev_' || uuid_generate_v4()::text,
    trainer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id VARCHAR(64) NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
    type evidence_type NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    years NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    source_note TEXT,
    verified_status verification_status NOT NULL DEFAULT 'unverified',
    verified_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trainer_evidence_trainer ON trainer_evidence(trainer_id);
CREATE INDEX idx_trainer_evidence_comp ON trainer_evidence(competency_id);
CREATE INDEX idx_trainer_evidence_status ON trainer_evidence(verified_status);

-- ---------------------------------------------------------------------
-- 6. Courses & Curriculum
-- ---------------------------------------------------------------------
CREATE TYPE course_status AS ENUM ('draft', 'pending_approval', 'published', 'in_progress', 'completed', 'archived');
CREATE TYPE delivery_mode AS ENUM ('in_person', 'online', 'blended');

CREATE TABLE courses (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'crs_' || uuid_generate_v4()::text,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    objectives TEXT[] NOT NULL DEFAULT '{}',
    competency_ids TEXT[] NOT NULL DEFAULT '{}',
    prerequisites TEXT[] NOT NULL DEFAULT '{}',
    delivery_mode delivery_mode NOT NULL DEFAULT 'blended',
    centre_id VARCHAR(64) NOT NULL REFERENCES centres(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    trainer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status course_status NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_trainer ON courses(trainer_id);
CREATE INDEX idx_courses_centre ON courses(centre_id);
CREATE INDEX idx_courses_dates ON courses(start_date, end_date);

-- ---------------------------------------------------------------------
-- 7. Training Needs & Match Decisions
-- ---------------------------------------------------------------------
CREATE TYPE need_status AS ENUM ('open', 'matched', 'closed');
CREATE TYPE match_decision AS ENUM ('accepted', 'rejected', 'overridden');

CREATE TABLE training_needs (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'need_' || uuid_generate_v4()::text,
    title VARCHAR(255) NOT NULL,
    required_competency_ids TEXT[] NOT NULL DEFAULT '{}',
    target_centre_id VARCHAR(64) NOT NULL REFERENCES centres(id) ON DELETE RESTRICT,
    delivery_mode delivery_mode NOT NULL DEFAULT 'blended',
    start_date DATE,
    end_date DATE,
    created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status need_status NOT NULL DEFAULT 'open',
    matched_trainer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE match_decisions (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'dec_' || uuid_generate_v4()::text,
    need_id VARCHAR(64) REFERENCES training_needs(id) ON DELETE CASCADE,
    course_id VARCHAR(64) REFERENCES courses(id) ON DELETE CASCADE,
    trainer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision match_decision NOT NULL,
    decided_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    factor_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC(5, 2) NOT NULL
);

CREATE INDEX idx_match_decisions_trainer ON match_decisions(trainer_id);

-- ---------------------------------------------------------------------
-- 8. Course Enrollments & Participation
-- ---------------------------------------------------------------------
CREATE TYPE enrollment_status AS ENUM ('requested', 'enrolled', 'waitlisted', 'completed', 'dropped');

CREATE TABLE enrollments (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'enr_' || uuid_generate_v4()::text,
    trainee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'enrolled',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attendance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (attendance_pct BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ,
    UNIQUE (trainee_id, course_id)
);

CREATE INDEX idx_enrollments_trainee ON enrollments(trainee_id);
CREATE INDEX idx_enrollments_course_status ON enrollments(course_id, status);

-- ---------------------------------------------------------------------
-- 9. Assessments & Attempts
-- ---------------------------------------------------------------------
CREATE TYPE assessment_status AS ENUM ('draft', 'published', 'closed');

CREATE TABLE assessments (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'asm_' || uuid_generate_v4()::text,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    deadline TIMESTAMPTZ,
    duration_min INTEGER NOT NULL DEFAULT 30,
    status assessment_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mcq_questions (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'mcq_' || uuid_generate_v4()::text,
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_index SMALLINT NOT NULL,
    competency_id VARCHAR(64) REFERENCES competencies(id) ON DELETE SET NULL,
    explanation TEXT
);

CREATE TABLE assessment_attempts (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'att_' || uuid_generate_v4()::text,
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    trainee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers INTEGER[] NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_attempts_trainee ON assessment_attempts(trainee_id);

-- ---------------------------------------------------------------------
-- 10. Certificates (Demo Only)
-- ---------------------------------------------------------------------
CREATE TABLE certificates (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'cert_' || uuid_generate_v4()::text,
    enrollment_id VARCHAR(64) NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    trainee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    code VARCHAR(64) NOT NULL UNIQUE,
    synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 11. Resources & Library Materials
-- ---------------------------------------------------------------------
CREATE TYPE resource_type AS ENUM ('video', 'slides', 'document', 'link');
CREATE TYPE resource_visibility AS ENUM ('public', 'enrolled', 'trainers_only');

CREATE TABLE resources (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'res_' || uuid_generate_v4()::text,
    course_id VARCHAR(64) REFERENCES courses(id) ON DELETE SET NULL,
    trainer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type resource_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    visibility resource_visibility NOT NULL DEFAULT 'enrolled',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 12. Announcements & Bulletins
-- ---------------------------------------------------------------------
CREATE TYPE announcement_type AS ENUM ('notice', 'announcement', 'achievement', 'new_content');

CREATE TABLE announcements (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'ann_' || uuid_generate_v4()::text,
    type announcement_type NOT NULL DEFAULT 'announcement',
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    published_by VARCHAR(255) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pinned BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------------------------------------------------------------------
-- 13. System Audit Events (Append-Only Immutable Ledger)
-- ---------------------------------------------------------------------
CREATE TABLE audit_events (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'aud_' || uuid_generate_v4()::text,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255),
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_at ON audit_events(at DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);

-- Enforce append-only on audit_events (prevent UPDATE and DELETE)
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail is immutable. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();

-- ---------------------------------------------------------------------
-- 14. Registration & Revision Applications
-- ---------------------------------------------------------------------
CREATE TYPE application_status AS ENUM ('submitted', 'needs_info', 'approved', 'rejected');

CREATE TABLE applications (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'app_' || uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    revision INT NOT NULL DEFAULT 1,
    status application_status NOT NULL DEFAULT 'submitted',
    payload JSONB NOT NULL,
    admin_note TEXT,
    decided_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_role ON applications(role);

-- ---------------------------------------------------------------------
-- 15. Registration Autosave Drafts
-- ---------------------------------------------------------------------
CREATE TABLE registration_drafts (
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    step INT NOT NULL DEFAULT 1,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (email, role)
);

CREATE INDEX idx_drafts_updated ON registration_drafts(updated_at DESC);

-- ---------------------------------------------------------------------
-- 16. User Credentials (Production-Ready Auth Storage)
-- ---------------------------------------------------------------------
CREATE TABLE credentials (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

