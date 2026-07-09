// backend/scripts/migrate.js
// Creates all tables in NeonDB if they don't already exist.
// Safe to re-run at any time.
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { pool } = require('../src/db/pool');

const SCHEMA = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum types (idempotent)
DO $$ BEGIN CREATE TYPE prescription_status AS ENUM ('pending','active','filled','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE gender_type AS ENUM ('Female','Male','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE medication_unit AS ENUM ('mg','mcg','ml','units');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- patients
CREATE TABLE IF NOT EXISTS patients (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  dob         DATE        NOT NULL,
  gender      gender_type NOT NULL DEFAULT 'Other',
  phone       TEXT        NOT NULL DEFAULT '—',
  allergies   TEXT        NOT NULL DEFAULT 'None',
  email       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (name);

-- medications
CREATE TABLE IF NOT EXISTS medications (
  id          TEXT            PRIMARY KEY,
  name        TEXT            NOT NULL UNIQUE,
  type        TEXT            NOT NULL,
  controlled  BOOLEAN         NOT NULL DEFAULT FALSE,
  unit        medication_unit NOT NULL DEFAULT 'mg',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medications_name       ON medications (name);
CREATE INDEX IF NOT EXISTS idx_medications_controlled ON medications (controlled);

-- prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id             TEXT                PRIMARY KEY,
  patient_id     TEXT                NOT NULL REFERENCES patients(id),
  medication_id  TEXT                NOT NULL REFERENCES medications(id),
  dose           TEXT                NOT NULL,
  frequency      TEXT                NOT NULL,
  duration       TEXT                NOT NULL,
  prescriber     TEXT                NOT NULL,
  date           DATE                NOT NULL DEFAULT CURRENT_DATE,
  refills        SMALLINT            NOT NULL DEFAULT 0 CHECK (refills >= 0 AND refills <= 12),
  status         prescription_status NOT NULL DEFAULT 'pending',
  notes          TEXT                NOT NULL DEFAULT '',
  dispensed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rx_patient    ON prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_rx_medication ON prescriptions (medication_id);
CREATE INDEX IF NOT EXISTS idx_rx_status     ON prescriptions (status);
CREATE INDEX IF NOT EXISTS idx_rx_date       ON prescriptions (date DESC);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL    PRIMARY KEY,
  entity_type TEXT         NOT NULL,
  entity_id   TEXT         NOT NULL,
  action      TEXT         NOT NULL,
  changed_by  TEXT,
  old_values  TEXT,
  new_values  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at DESC);

-- migrations tracker
CREATE TABLE IF NOT EXISTS migrations (
  id         TEXT        PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations…');
    await client.query(SCHEMA);
    console.log('✅  Schema ready.');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
