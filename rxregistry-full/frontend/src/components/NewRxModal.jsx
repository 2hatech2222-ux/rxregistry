import React, { useState } from 'react';
import { Modal } from './UI';

const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily',
  'Four times daily', 'As needed',
];

const EMPTY = {
  patientId: '', medicationId: '',
  dose: '', frequency: 'Once daily', duration: '',
  prescriber: '', refills: 0, notes: '',
};

export default function NewRxModal({ patients, medications, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.patientId)    e.patientId    = 'Required';
    if (!form.medicationId) e.medicationId = 'Required';
    if (!form.dose.trim())  e.dose         = 'Required';
    if (!form.duration.trim()) e.duration  = 'Required';
    if (!form.prescriber.trim()) e.prescriber = 'Required';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      patientId:    form.patientId,
      medicationId: form.medicationId,
      dose:         form.dose.trim(),
      frequency:    form.frequency,
      duration:     form.duration.trim(),
      prescriber:   form.prescriber.trim(),
      refills:      parseInt(form.refills, 10) || 0,
      notes:        form.notes.trim(),
    });
    onClose();
  }

  const selectedMed = medications.find(m => m.id === form.medicationId);

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>New prescription</h3>
        <button className="btn sm" onClick={onClose} aria-label="Close">
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="rx-patient">Patient *</label>
          <select
            id="rx-patient"
            value={form.patientId}
            onChange={e => set('patientId', e.target.value)}
            style={errors.patientId ? { borderColor: 'var(--border-danger)' } : {}}
          >
            <option value="">Select patient</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
          {errors.patientId && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.patientId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rx-med">Medication *</label>
          <select
            id="rx-med"
            value={form.medicationId}
            onChange={e => set('medicationId', e.target.value)}
            style={errors.medicationId ? { borderColor: 'var(--border-danger)' } : {}}
          >
            <option value="">Select medication</option>
            {medications.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}{m.controlled ? ' ⚠ Controlled' : ''}
              </option>
            ))}
          </select>
          {selectedMed?.controlled && (
            <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>
              ⚠ This is a controlled substance — ensure authorisation.
            </span>
          )}
          {errors.medicationId && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.medicationId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rx-dose">Dose *</label>
          <input
            id="rx-dose"
            type="text"
            placeholder="e.g. 500mg"
            value={form.dose}
            onChange={e => set('dose', e.target.value)}
            style={errors.dose ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.dose && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.dose}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rx-freq">Frequency *</label>
          <select id="rx-freq" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
            {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rx-duration">Duration *</label>
          <input
            id="rx-duration"
            type="text"
            placeholder="e.g. 7 days"
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
            style={errors.duration ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.duration && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.duration}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="rx-refills">Refills allowed</label>
          <input
            id="rx-refills"
            type="number"
            min={0}
            max={12}
            value={form.refills}
            onChange={e => set('refills', e.target.value)}
          />
        </div>

        <div className="form-group full">
          <label htmlFor="rx-prescriber">Prescriber *</label>
          <input
            id="rx-prescriber"
            type="text"
            placeholder="Dr. Full Name"
            value={form.prescriber}
            onChange={e => set('prescriber', e.target.value)}
            style={errors.prescriber ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.prescriber && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.prescriber}</span>}
        </div>

        <div className="form-group full">
          <label htmlFor="rx-notes">Notes</label>
          <textarea
            id="rx-notes"
            placeholder="Optional clinical notes"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={handleSubmit}>
          <i className="ti ti-plus" /> Register prescription
        </button>
      </div>
    </Modal>
  );
}
