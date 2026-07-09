// backend/src/db/audit.js
'use strict';

const { query } = require('./pool');

/**
 * Append one row to audit_log.
 * Fire-and-forget — errors are logged but never bubble to the caller.
 */
async function log(entityType, entityId, action, oldValues = null, newValues = null, changedBy = 'system') {
  try {
    await query(
      `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entityType,
        entityId,
        action,
        changedBy,
        oldValues  ? JSON.stringify(oldValues)  : null,
        newValues  ? JSON.stringify(newValues)  : null,
      ]
    );
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err.message);
  }
}

module.exports = { log };
