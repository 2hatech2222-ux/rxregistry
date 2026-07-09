// backend/src/routes/audit.js
'use strict';

const express   = require('express');
const { query } = require('../db/pool');
const router    = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { entity_type, entity_id, action, page = 1, limit = 100 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let where = 'WHERE 1=1';
    const vals = [];
    let i = 1;

    if (entity_type) { where += ` AND entity_type = $${i}`; vals.push(entity_type); i++; }
    if (entity_id)   { where += ` AND entity_id   = $${i}`; vals.push(entity_id);   i++; }
    if (action)      { where += ` AND action       = $${i}`; vals.push(action);      i++; }

    const { rows: countRows } = await query(`SELECT COUNT(*) AS total FROM audit_log ${where}`, vals);
    const total = parseInt(countRows[0].total, 10);

    const { rows } = await query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, parseInt(limit, 10), offset]
    );

    res.json({
      data: rows.map(r => ({
        id:         r.id,
        entityType: r.entity_type,
        entityId:   r.entity_id,
        action:     r.action,
        changedBy:  r.changed_by,
        oldValues:  r.old_values  ? JSON.parse(r.old_values)  : null,
        newValues:  r.new_values  ? JSON.parse(r.new_values)  : null,
        createdAt:  r.created_at,
      })),
      meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
});

module.exports = router;
