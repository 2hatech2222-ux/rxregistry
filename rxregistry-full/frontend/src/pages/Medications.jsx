import React, { useState } from 'react';
import { Alert, SearchBar, ControlledBadge } from '../components/UI';

export default function Medications({ store }) {
  const { medications, prescriptions, alert } = store;
  const [search, setSearch] = useState('');

  const filtered = medications.filter(m =>
    !search
    || m.name.toLowerCase().includes(search.toLowerCase())
    || m.type.toLowerCase().includes(search.toLowerCase())
  );

  const rxCount = id => prescriptions.filter(r => r.medicationId === id).length;

  return (
    <>
      <Alert alert={alert} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search medications…" />

      <div className="card flush">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Class</th>
              <th>Controlled</th>
              <th>Unit</th>
              <th>Times prescribed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="mono muted">{m.id}</td>
                <td style={{ fontWeight: 500 }}>{m.name}</td>
                <td>{m.type}</td>
                <td>
                  {m.controlled
                    ? <ControlledBadge />
                    : <span className="muted" style={{ fontSize: 13 }}>No</span>}
                </td>
                <td>{m.unit}</td>
                <td>{rxCount(m.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
