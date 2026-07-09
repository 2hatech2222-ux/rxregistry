// backend/src/routes/stats.js
'use strict';

const express      = require('express');
const { query }    = require('../db/pool');
const router       = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [pts, meds, rxTotal, byStatus, controlled] = await Promise.all([
      query(`SELECT COUNT(*) AS n FROM patients`),
      query(`SELECT COUNT(*) AS n FROM medications`),
      query(`SELECT COUNT(*) AS n FROM prescriptions`),
      query(`SELECT status, COUNT(*) AS n FROM prescriptions GROUP BY status`),
      query(`SELECT COUNT(*) AS n FROM prescriptions p
             JOIN medications m ON m.id = p.medication_id
             WHERE m.controlled = TRUE`),
    ]);

    const statusMap = Object.fromEntries(byStatus.rows.map(r => [r.status, parseInt(r.n, 10)]));

    res.json({
      totalPatients:     parseInt(pts.rows[0].n, 10),
      totalMedications:  parseInt(meds.rows[0].n, 10),
      totalPrescriptions:parseInt(rxTotal.rows[0].n, 10),
      prescriptionsByStatus: {
        pending: statusMap.pending || 0,
        active:  statusMap.active  || 0,
        filled:  statusMap.filled  || 0,
        expired: statusMap.expired || 0,
      },
      controlledSubstanceRx: parseInt(controlled.rows[0].n, 10),
    });
  } catch (err) { next(err); }
});

module.exports = router;
