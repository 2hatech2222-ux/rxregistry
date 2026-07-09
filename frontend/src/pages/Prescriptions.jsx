import React, { useState } from 'react';
import { Alert, SearchBar, StatusBadge, ControlledBadge, EmptyState } from '../components/UI';

export default function Prescriptions({ store, onViewRx }) {
  const { prescriptions, getPatient, getMed, alert } = store;
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');

  const filtered = prescriptions.filter(r => {
    const p = getPatient(r.patientId);
    const m = getMed(r.medicationId);
    const q = search.toLowerCase();
    const matchSearch = !q
      || r.id.toLowerCase().includes(q)
      || p?.name.toLowerCase().includes(q)
      || m?.name.toLowerCase().includes(q)
      || r.prescriber.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <Alert alert={alert} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by patient, medication, or ID…">
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          style={{ width: 140 }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="filled">Filled</option>
          <option value="expired">Expired</option>
        </select>
      </SearchBar>

      <div className="card flush">
        <table>
          <thead>
            <tr>
              <th>Rx ID</th>
              <th>Patient</th>
              <th>Medication</th>
              <th>Dose</th>
              <th>Prescriber</th>
              <th>Date</th>
              <th>Refills</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <EmptyState icon="ti-file-off" message="No prescriptions match your search" />
              : filtered.map(r => {
                  const p = getPatient(r.patientId);
                  const m = getMed(r.medicationId);
                  return (
                    <tr key={r.id}>
                      <td
                        className="mono"
                        style={{ color: 'var(--text-accent)', cursor: 'pointer' }}
                        onClick={() => onViewRx(r.id)}
                      >
                        {r.id}
                      </td>
                      <td>{p?.name ?? r.patientId}</td>
                      <td>
                        {m?.name ?? r.medicationId}
                        {m?.controlled && <> <ControlledBadge /></>}
                      </td>
                      <td>{r.dose}</td>
                      <td>{r.prescriber}</td>
                      <td>{r.date}</td>
                      <td>{r.refills}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <button className="btn sm" onClick={() => onViewRx(r.id)} aria-label="View">
                          <i className="ti ti-eye" />
                        </button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </>
  );
}
