import React, { useState } from 'react';
import { Modal } from './UI';

const EMPTY = { name: '', type: '', unit: 'mg', controlled: false };

export default function NewMedModal({ onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.type.trim()) e.type = 'Required';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      name:       form.name.trim(),
      type:       form.type.trim(),
      unit:       form.unit,
      controlled: form.controlled,
    });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Add medication</h3>
        <button className="btn sm" onClick={onClose} aria-label="Close">
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-grid">
        <div className="form-group full">
          <label htmlFor="med-name">Drug name *</label>
          <input
            id="med-name"
            type="text"
            placeholder="Generic name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={errors.name ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.name && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="med-type">Drug class *</label>
          <input
            id="med-type"
            type="text"
            placeholder="e.g. Antibiotic"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            style={errors.type ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.type && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.type}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="med-unit">Unit</label>
          <select id="med-unit" value={form.unit} onChange={e => set('unit', e.target.value)}>
            <option>mg</option>
            <option>mcg</option>
            <option>ml</option>
            <option>units</option>
          </select>
        </div>

        <div className="checkbox-row">
          <input
            id="med-controlled"
            type="checkbox"
            checked={form.controlled}
            onChange={e => set('controlled', e.target.checked)}
          />
          <label htmlFor="med-controlled">
            Controlled substance — requires special documentation
          </label>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={handleSubmit}>
          <i className="ti ti-pill" /> Add medication
        </button>
      </div>
    </Modal>
  );
}
