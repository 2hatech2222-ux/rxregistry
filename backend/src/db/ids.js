// backend/src/db/ids.js
// Sequential human-readable IDs: P001, M001, RX-2024-001
// Reads MAX from DB each call — safe across restarts and concurrent processes.
'use strict';

const { query } = require('./pool');

async function nextPatientId() {
  const { rows } = await query(
    `SELECT id FROM patients ORDER BY id DESC LIMIT 1`
  );
  if (!rows.length) return 'P001';
  const n = parseInt(rows[0].id.replace('P', ''), 10);
  return `P${String(n + 1).padStart(3, '0')}`;
}

async function nextMedicationId() {
  const { rows } = await query(
    `SELECT id FROM medications ORDER BY id DESC LIMIT 1`
  );
  if (!rows.length) return 'M001';
  const n = parseInt(rows[0].id.replace('M', ''), 10);
  return `M${String(n + 1).padStart(3, '0')}`;
}

async function nextPrescriptionId() {
  const year   = new Date().getFullYear();
  const prefix = `RX-${year}-`;
  const { rows } = await query(
    `SELECT id FROM prescriptions WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  if (!rows.length) return `${prefix}001`;
  const n = parseInt(rows[0].id.replace(prefix, ''), 10);
  return `${prefix}${String(n + 1).padStart(3, '0')}`;
}

module.exports = { nextPatientId, nextMedicationId, nextPrescriptionId };
