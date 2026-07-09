import React from 'react';
import { Alert, StatusBadge, ControlledBadge } from '../components/UI';

export default function Dashboard({ store, onViewRx }) {
  const { prescriptions, patients, medications, getPatient, getMed, alert } = store;

  const active     = prescriptions.filter(r => r.status === 'active').length;
  const pending    = prescriptions.filter(r => r.status === 'pending').length;
  const controlled = prescriptions.filter(r => getMed(r.medicationId)?.controlled).length;

  const recent = [...prescriptions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <>
      <Alert alert={alert} />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-users" aria-hidden="true" /> Total patients</div>
          <div className="stat-value accent">{patients.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-file-text" aria-hidden="true" /> Active Rx</div>
          <div className="stat-value success">{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-clock" aria-hidden="true" /> Pending</div>
          <div className="stat-value warning">{pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-shield-lock" aria-hidden="true" /> Controlled Rx</div>
          <div className="stat-value danger">{controlled}</div>
        </div>
      </div>

      <div className="card flush">
        <div style={{ padding: '14px 16px 10px', borderBottom: '0.5px solid var(--border)' }}>
          <span className="section-header" style={{ margin: 0 }}>Recent prescriptions</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rx ID</th>
              <th>Patient</th>
              <th>Medication</th>
              <th>Prescriber</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(r => {
              const p = getPatient(r.patientId);
              const m = getMed(r.medicationId);
              return (
                <tr key={r.id} className="clickable" onClick={() => onViewRx(r.id)}>
                  <td className="mono" style={{ color: 'var(--text-accent)' }}>{r.id}</td>
                  <td>{p?.name ?? r.patientId}</td>
                  <td>
                    {m?.name ?? r.medicationId}
                    {m?.controlled && <> <ControlledBadge /></>}
                  </td>
                  <td>{r.prescriber}</td>
                  <td>{r.date}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
