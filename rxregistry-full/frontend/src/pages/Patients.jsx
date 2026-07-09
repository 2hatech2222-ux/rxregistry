import React, { useState } from 'react';
import { Alert, SearchBar, EmptyState, Modal, StatusBadge, DetailRow } from '../components/UI';
import { calcAge } from '../utils/helpers';

function PatientModal({ patient, rxList, getMed, onClose, onViewRx }) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>{patient.name}</h3>
        <button className="btn sm" onClick={onClose} aria-label="Close"><i className="ti ti-x" /></button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <DetailRow label="Patient ID">
          <span className="mono">{patient.id}</span>
        </DetailRow>
        <DetailRow label="Date of birth">{patient.dob}</DetailRow>
        <DetailRow label="Age">{calcAge(patient.dob)}</DetailRow>
        <DetailRow label="Gender">{patient.gender}</DetailRow>
        <DetailRow label="Phone">{patient.phone}</DetailRow>
        <DetailRow label="Allergies">
          {patient.allergies !== 'None'
            ? <span className="danger-text">{patient.allergies}</span>
            : <span className="muted">None</span>}
        </DetailRow>
      </div>

      <div className="section-header">Prescription history ({rxList.length})</div>
      {rxList.length === 0
        ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No prescriptions yet.</p>
        : rxList.map(r => {
            const m = getMed(r.medicationId);
            return (
              <div
                key={r.id}
                className="card"
                style={{ marginBottom: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => { onClose(); onViewRx(r.id); }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{m?.name ?? r.medicationId} {r.dose}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.id} · {r.date}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            );
          })
      }

      <div className="modal-footer">
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

export default function Patients({ store, onViewRx }) {
  const { patients, prescriptions, getMed, alert } = store;
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  const filtered = patients.filter(p =>
    !search
    || p.name.toLowerCase().includes(search.toLowerCase())
    || p.id.toLowerCase().includes(search.toLowerCase())
  );

  const rxFor = id => prescriptions.filter(r => r.patientId === id);

  return (
    <>
      <Alert alert={alert} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search patients…" />

      <div className="card flush">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Allergies</th>
              <th>Rx count</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <EmptyState icon="ti-user-off" message="No patients found" />
              : filtered.map(p => (
                  <tr key={p.id}>
                    <td className="mono muted">{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{calcAge(p.dob)}</td>
                    <td>{p.gender}</td>
                    <td>{p.phone}</td>
                    <td>
                      {p.allergies !== 'None'
                        ? <span className="danger-text">{p.allergies}</span>
                        : <span className="muted">None</span>}
                    </td>
                    <td>{rxFor(p.id).length}</td>
                    <td>
                      <button className="btn sm" onClick={() => setSelected(p)} aria-label="View patient">
                        <i className="ti ti-eye" />
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {selected && (
        <PatientModal
          patient={selected}
          rxList={rxFor(selected.id)}
          getMed={getMed}
          onClose={() => setSelected(null)}
          onViewRx={onViewRx}
        />
      )}
    </>
  );
}
