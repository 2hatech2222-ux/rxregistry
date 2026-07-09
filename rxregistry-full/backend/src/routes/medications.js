// backend/src/routes/medications.js
'use strict';

const express  = require('express');
const { body } = require('express-validator');
const { query }             = require('../db/pool');
const { nextMedicationId }  = require('../db/ids');
const audit                 = require('../db/audit');
const { validate, httpError } = require('../middleware/errorHandler');

const router = express.Router();

const toApi = r => r ? {
  id:         r.id,
  name:       r.name,
  type:       r.type,
  controlled: Boolean(r.controlled),
  unit:       r.unit,
  createdAt:  r.created_at,
} : null;

const medValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type').trim().notEmpty().withMessage('type (drug class) is required'),
  body('controlled').optional().isBoolean(),
  body('unit').optional().isIn(['mg', 'mcg', 'ml', 'units']),
];

// ── GET /medications ──────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { q, controlled } = req.query;
    let text   = `SELECT * FROM medications WHERE 1=1`;
    const vals = [];
    let i = 1;
    if (q) {
      text += ` AND (name ILIKE $${i} OR type ILIKE $${i})`; vals.push(`%${q}%`); i++;
    }
    if (controlled !== undefined) {
      text += ` AND controlled = $${i}`; vals.push(controlled === 'true'); i++;
    }
    text += ` ORDER BY name`;
    const { rows } = await query(text, vals);
    res.json(rows.map(toApi));
  } catch (err) { next(err); }
});

// ── GET /medications/:id ──────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM medications WHERE id = $1`, [req.params.id]);
    if (!rows.length) return next(httpError(404, `Medication ${req.params.id} not found`));
    res.json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── POST /medications ─────────────────────────────────────────────────────────

router.post('/', medValidators, validate, async (req, res, next) => {
  try {
    const { name, type, controlled = false, unit = 'mg' } = req.body;
    const { rows: dup } = await query(`SELECT id FROM medications WHERE name = $1`, [name.trim()]);
    if (dup.length) return next(httpError(409, `Medication "${name.trim()}" already exists (${dup[0].id})`));
    const id = await nextMedicationId();
    const { rows } = await query(
      `INSERT INTO medications (id, name, type, controlled, unit)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, name.trim(), type.trim(), Boolean(controlled), unit]
    );
    await audit.log('medication', id, 'create', null, toApi(rows[0]));
    res.status(201).json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── PATCH /medications/:id ────────────────────────────────────────────────────

router.patch('/:id', medValidators.map(v => v.optional()), validate, async (req, res, next) => {
  try {
    const { rows: ex } = await query(`SELECT * FROM medications WHERE id = $1`, [req.params.id]);
    if (!ex.length) return next(httpError(404, `Medication ${req.params.id} not found`));
    const e = ex[0];
    const { name, type, controlled, unit } = req.body;
    const { rows } = await query(
      `UPDATE medications SET name=$1,type=$2,controlled=$3,unit=$4 WHERE id=$5 RETURNING *`,
      [
        name       !== undefined ? name.trim()        : e.name,
        type       !== undefined ? type.trim()        : e.type,
        controlled !== undefined ? Boolean(controlled): e.controlled,
        unit       !== undefined ? unit               : e.unit,
        e.id,
      ]
    );
    await audit.log('medication', e.id, 'update', toApi(e), toApi(rows[0]));
    res.json(toApi(rows[0]));
  } catch (err) { next(err); }
});

// ── DELETE /medications/:id ───────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: ex } = await query(`SELECT * FROM medications WHERE id = $1`, [req.params.id]);
    if (!ex.length) return next(httpError(404, `Medication ${req.params.id} not found`));
    const { rows: rxRows } = await query(
      `SELECT COUNT(*) AS n FROM prescriptions WHERE medication_id = $1`, [req.params.id]
    );
    if (parseInt(rxRows[0].n, 10) > 0)
      return next(httpError(409, 'Cannot delete a medication that has been prescribed'));
    await query(`DELETE FROM medications WHERE id = $1`, [req.params.id]);
    await audit.log('medication', req.params.id, 'delete', toApi(ex[0]), null);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
