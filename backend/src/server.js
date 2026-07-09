// backend/src/server.js
'use strict';

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const patientsRouter      = require('./routes/patients');
const medicationsRouter   = require('./routes/medications');
const prescriptionsRouter = require('./routes/prescriptions');
const auditRouter         = require('./routes/audit');
const statsRouter         = require('./routes/stats');
const { errorHandler }    = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin:  (process.env.CORS_ORIGIN || '*').split(','),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ────────────────────────────────────────────────────────────────────

const v1 = '/api/v1';

app.get(`${v1}/health`, (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

app.use(`${v1}/patients`,      patientsRouter);
app.use(`${v1}/medications`,   medicationsRouter);
app.use(`${v1}/prescriptions`, prescriptionsRouter);
app.use(`${v1}/audit`,         auditRouter);
app.use(`${v1}/stats`,         statsRouter);

app.use((req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  RxRegistry API  →  http://localhost:${PORT}${v1}`);
  console.log(`    DB: ${(process.env.DATABASE_URL || '').replace(/:([^@]+)@/, ':***@')}`);
});

module.exports = app;
