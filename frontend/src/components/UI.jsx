import React from 'react';

// ── Alert banner ──────────────────────────────────────────────
export function Alert({ alert }) {
  if (!alert) return null;
  const icon = alert.type === 'success' ? 'ti-check' : 'ti-alert-triangle';
  return (
    <div className={`alert ${alert.type}`}>
      <i className={`ti ${icon}`} aria-hidden="true" />
      {alert.msg}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────
export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

// ── Controlled-substance badge ────────────────────────────────
export function ControlledBadge() {
  return (
    <span className="badge controlled" style={{ fontSize: 10 }}>
      <i className="ti ti-lock" style={{ fontSize: 10 }} aria-hidden="true" />
      C
    </span>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────
export function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {children}
      </div>
    </div>
  );
}

// ── Search row ────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <div className="search-row">
      <div className="search-wrap">
        <i className="ti ti-search" aria-hidden="true" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon = 'ti-file-off', message = 'Nothing found' }) {
  return (
    <tr>
      <td colSpan={99}>
        <div className="empty-state">
          <i className={`ti ${icon}`} aria-hidden="true" />
          <p>{message}</p>
        </div>
      </td>
    </tr>
  );
}

// ── Detail row (label + value) ────────────────────────────────
export function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <span className="detail-key">{label}</span>
      <span>{children}</span>
    </div>
  );
}
