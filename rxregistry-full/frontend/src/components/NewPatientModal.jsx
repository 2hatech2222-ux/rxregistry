import React, { useState } from 'react';
import { Modal } from './UI';

const EMPTY = { name: '', dob: '', gender: 'Female', phone: '', allergies: '' };

export default function NewPatientModal({ onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.dob)         e.dob  = 'Required';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      name:      form.name.trim(),
      dob:       form.dob,
      gender:    form.gender,
      phone:     form.phone.trim() || '—',
      allergies: form.allergies.trim() || 'None',
    });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Add patient</h3>
        <button className="btn sm" onClick={onClose} aria-label="Close">
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="form-grid">
        <div className="form-group full">
          <label htmlFor="pt-name">Full name *</label>
          <input
            id="pt-name"
            type="text"
            placeholder="Patient full name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={errors.name ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.name && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="pt-dob">Date of birth *</label>
          <input
            id="pt-dob"
            type="date"
            value={form.dob}
            onChange={e => set('dob', e.target.value)}
            style={errors.dob ? { borderColor: 'var(--border-danger)' } : {}}
          />
          {errors.dob && <span style={{ fontSize: 11, color: 'var(--text-danger)' }}>{errors.dob}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="pt-gender">Gender</label>
          <select id="pt-gender" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group full">
          <label htmlFor="pt-phone">Phone number</label>
          <input
            id="pt-phone"
            type="text"
            placeholder="+251 91 000 0000"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>

        <div className="form-group full">
          <label htmlFor="pt-allergies">Known allergies</label>
          <input
            id="pt-allergies"
            type="text"
            placeholder="None, or list drug allergies"
            value={form.allergies}
            onChange={e => set('allergies', e.target.value)}
          />
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={handleSubmit}>
          <i className="ti ti-user-plus" /> Add patient
        </button>
      </div>
    </Modal>
  );
}
