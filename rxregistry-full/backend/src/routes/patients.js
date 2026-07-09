// backend/src/routes/patients.js
'use strict';

const express  = require('express');
const { body } = require('express-validator');
const { query }            = require('../db/pool');
const { nextPatientId }    = require('../db/ids');
const audit                = require('../db/audit');
const { validate, httpError } = require('../middleware/errorHandler');

const router = express.Router();

// ── Serialiser ────────────────────────────────────────────────────────────────

const toApi = r => r ? {
  id:        r.id,
  name:      r.name,
  dob:       r.dob instanceof Date ? r.dob.toISOString().split('T')[0] : r.dob,
  gender:    r.gender,
  phone:     r.phone,
  allergies: r.allergies,
  email:     r.email || '',
  createdAt: r.created_at,
} : null;

const rxToApi = r => ({
  id:           r.id,
  patientId:    r.patient_id,
  medicationId: r.medication_id,
  dose:         r.dose,
  frequency:    r.frequency,
  duration:     r.duration,
  prescriber:   r.prescriber,
  date:         r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
  refills:      r.refills,
  status:       r.status,
  notes:        r.notes,
  createdAt:    r.created_at,
  updatedAt:    r.updated_at,
});

// ── Validators ────────────────────────────────────────────────────────────────

const patientValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('dob').isDate().withMessage('dob must be YYYY-MM-DD'),
  body('gender').optional().isIn(['Female', 'Male', 'Other']),
  body('phone').optional().trim(),
  body('allergies').optional().trim(),
  body('email').optional().trim().isEmail().withMessage('invalid email'),
];

// ── GET /patients ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const { rows } = q
      ? await query(
          `SELECT * FROM patients WHERE name ILIKE $1 OR id ILIKE $1 ORDER BY name`,
          [`%${q}%`]
        )
      : await query(`SELECT * FROM patients ORDER BY name`);
    res.json(rows.map(toApi));
  } catch (err) { next(err); }
});

// ── GET /patients/:id ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM patients WHERE id = $1`, [req.params.id]);
    if (!rows.length) return next(httpError(404, `Patient ${req.params.id} not found`));
    res.json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── GET /patients/:id/prescriptions ──────────────────────────────────────────

router.get('/:id/prescriptions', async (req, res, next) => {
  try {
    const { rows: pt } = await query(`SELECT id FROM patients WHERE id = $1`, [req.params.id]);
    if (!pt.length) return next(httpError(404, `Patient ${req.params.id} not found`));
    const { rows } = await query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY date DESC`,
      [req.params.id]
    );
    res.json(rows.map(rxToApi));
  } catch (err) { next(err); }
});

// ── POST /patients ────────────────────────────────────────────────────────────

router.post('/', patientValidators, validate, async (req, res, next) => {
  try {
    const { name, dob, gender = 'Other', phone = '—', allergies = 'None', email = '' } = req.body;
    const id = await nextPatientId();
    const { rows } = await query(
      `INSERT INTO patients (id, name, dob, gender, phone, allergies, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, name.trim(), dob, gender, phone.trim() || '—', allergies.trim() || 'None', email.trim()]
    );
    await audit.log('patient', id, 'create', null, toApi(rows[0]));
    res.status(201).json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── PATCH /patients/:id ───────────────────────────────────────────────────────

router.patch('/:id', patientValidators.map(v => v.optional()), validate, async (req, res, next) => {
  try {
    const { rows: existing } = await query(`SELECT * FROM patients WHERE id = $1`, [req.params.id]);
    if (!existing.length) return next(httpError(404, `Patient ${req.params.id} not found`));
    const e = existing[0];
    const { name, dob, gender, phone, allergies, email } = req.body;
    const { rows } = await query(
      `UPDATE patients SET name=$1,dob=$2,gender=$3,phone=$4,allergies=$5,email=$6
       WHERE id=$7 RETURNING *`,
      [
        name      !== undefined ? name.trim()      : e.name,
        dob       !== undefined ? dob              : e.dob,
        gender    !== undefined ? gender           : e.gender,
        phone     !== undefined ? phone.trim()     : e.phone,
        allergies !== undefined ? allergies.trim() : e.allergies,
        email     !== undefined ? email.trim()     : e.email,
        e.id,
      ]
    );
    await audit.log('patient', e.id, 'update', toApi(e), toApi(rows[0]));
    res.json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── DELETE /patients/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await query(`SELECT * FROM patients WHERE id = $1`, [req.params.id]);
    if (!existing.length) return next(httpError(404, `Patient ${req.params.id} not found`));
    const { rows: rxRows } = await query(
      `SELECT COUNT(*) AS n FROM prescriptions WHERE patient_id = $1`, [req.params.id]
    );
    if (parseInt(rxRows[0].n, 10) > 0)
      return next(httpError(409, 'Cannot delete a patient who has prescriptions'));
    await query(`DELETE FROM patients WHERE id = $1`, [req.params.id]);
    await audit.log('patient', req.params.id, 'delete', toApi(existing[0]), null);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
