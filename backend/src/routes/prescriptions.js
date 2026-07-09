// backend/src/routes/prescriptions.js
'use strict';

const express  = require('express');
const { body } = require('express-validator');
const { query }                = require('../db/pool');
const { nextPrescriptionId }   = require('../db/ids');
const audit                    = require('../db/audit');
const { validate, httpError }  = require('../middleware/errorHandler');

const router = express.Router();

const VALID_STATUSES = ['pending', 'active', 'filled', 'expired'];
const VALID_FREQS    = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed'];

const toApi = r => r ? {
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
} : null;

const rxValidators = [
  body('patientId').notEmpty().withMessage('patientId is required'),
  body('medicationId').notEmpty().withMessage('medicationId is required'),
  body('dose').trim().notEmpty().withMessage('dose is required'),
  body('frequency').isIn(VALID_FREQS).withMessage(`frequency must be one of: ${VALID_FREQS.join(', ')}`),
  body('duration').trim().notEmpty().withMessage('duration is required'),
  body('prescriber').trim().notEmpty().withMessage('prescriber is required'),
  body('refills').optional().isInt({ min: 0, max: 12 }),
  body('notes').optional().trim(),
];

// ── GET /prescriptions ────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { q, status, patientId, medicationId, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let where = 'WHERE 1=1';
    const vals = [];
    let i = 1;

    if (q)           { where += ` AND (id ILIKE $${i} OR prescriber ILIKE $${i})`; vals.push(`%${q}%`); i++; }
    if (status)      { where += ` AND status = $${i}`;        vals.push(status);      i++; }
    if (patientId)   { where += ` AND patient_id = $${i}`;    vals.push(patientId);   i++; }
    if (medicationId){ where += ` AND medication_id = $${i}`; vals.push(medicationId);i++; }

    const { rows: countRows } = await query(`SELECT COUNT(*) AS total FROM prescriptions ${where}`, vals);
    const total = parseInt(countRows[0].total, 10);

    const { rows } = await query(
      `SELECT * FROM prescriptions ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, parseInt(limit, 10), offset]
    );

    res.json({ data: rows.map(toApi), meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
});

// ── GET /prescriptions/:id ────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM prescriptions WHERE id = $1`, [req.params.id]);
    if (!rows.length) return next(httpError(404, `Prescription ${req.params.id} not found`));
    res.json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── POST /prescriptions ───────────────────────────────────────────────────────

router.post('/', rxValidators, validate, async (req, res, next) => {
  try {
    const { patientId, medicationId, dose, frequency, duration, prescriber, refills = 0, notes = '' } = req.body;

    const { rows: pt } = await query(`SELECT id FROM patients     WHERE id = $1`, [patientId]);
    if (!pt.length) return next(httpError(404, `Patient ${patientId} not found`));

    const { rows: md } = await query(`SELECT id FROM medications  WHERE id = $1`, [medicationId]);
    if (!md.length) return next(httpError(404, `Medication ${medicationId} not found`));

    const id   = await nextPrescriptionId();
    const date = new Date().toISOString().split('T')[0];

    const { rows } = await query(
      `INSERT INTO prescriptions
         (id, patient_id, medication_id, dose, frequency, duration, prescriber, date, refills, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [id, patientId, medicationId, dose.trim(), frequency, duration.trim(),
       prescriber.trim(), date, parseInt(refills, 10), notes.trim()]
    );
    await audit.log('prescription', id, 'create', null, toApi(rows[0]));
    res.status(201).json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── PATCH /prescriptions/:id ──────────────────────────────────────────────────

router.patch('/:id', [
  body('status').optional().isIn(VALID_STATUSES),
  body('refills').optional().isInt({ min: 0, max: 12 }),
  body('notes').optional().trim(),
  body('prescriber').optional().trim().notEmpty(),
], validate, async (req, res, next) => {
  try {
    const { rows: ex } = await query(`SELECT * FROM prescriptions WHERE id = $1`, [req.params.id]);
    if (!ex.length) return next(httpError(404, `Prescription ${req.params.id} not found`));
    const e = ex[0];

    const { status, refills, notes, prescriber } = req.body;
    if (status && ['filled', 'expired'].includes(e.status) && status !== e.status)
      return next(httpError(409, `Cannot change status of a ${e.status} prescription`));

    const { rows } = await query(
      `UPDATE prescriptions
       SET status=$1, refills=$2, notes=$3, prescriber=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [
        status     !== undefined ? status               : e.status,
        refills    !== undefined ? parseInt(refills, 10): e.refills,
        notes      !== undefined ? notes.trim()         : e.notes,
        prescriber !== undefined ? prescriber.trim()    : e.prescriber,
        e.id,
      ]
    );
    await audit.log('prescription', e.id, 'update', toApi(e), toApi(rows[0]));
    res.json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── DELETE /prescriptions/:id ─────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: ex } = await query(`SELECT * FROM prescriptions WHERE id = $1`, [req.params.id]);
    if (!ex.length) return next(httpError(404, `Prescription ${req.params.id} not found`));
    if (ex[0].status !== 'pending')
      return next(httpError(409, 'Only pending prescriptions may be deleted'));
    await query(`DELETE FROM prescriptions WHERE id = $1`, [req.params.id]);
    await audit.log('prescription', req.params.id, 'delete', toApi(ex[0]), null);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
