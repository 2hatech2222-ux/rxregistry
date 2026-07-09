// frontend/src/components/LoadingScreen.jsx
import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 16,
      background: 'var(--surface-0)', color: 'var(--text-muted)',
    }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Connecting to database…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
