// backend/src/db/pool.js
// Single shared PostgreSQL connection pool for the whole app.
// NeonDB is fully PostgreSQL-compatible — we use the standard `pg` driver.
'use strict';

require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // NeonDB requires SSL in all environments
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

/**
 * Run a single query.
 * @param {string} text  — parameterised SQL
 * @param {any[]}  params
 */
async function query(text, params) {
  const start = Date.now();
  const res   = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[db] ${text.slice(0, 60).replace(/\s+/g, ' ')}  (${Date.now() - start}ms)`);
  }
  return res;
}

/**
 * Grab a client for multi-statement transactions.
 * Always call client.release() in a finally block.
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
