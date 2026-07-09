import React from 'react';
import { Modal, StatusBadge, ControlledBadge, DetailRow } from './UI';
import { calcAge } from '../utils/helpers';

export default function RxDetailModal({ rx, patient, medication, onClose, onStatusChange }) {
  if (!rx) return null;

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h3>Prescription {rx.id}</h3>
        <button className="btn sm" onClick={onClose} aria-label="Close">
          <i className="ti ti-x" />
        </button>
      </div>

      {/* Patient */}
      <div className="section-header">Patient</div>
      <div className="card" style={{ marginBottom: 14 }}>
        <DetailRow label="Name">{patient?.name ?? rx.patientId}</DetailRow>
        <DetailRow label="Age">{patient ? calcAge(patient.dob) : '—'}</DetailRow>
        <DetailRow label="Allergies">
          {patient?.allergies && patient.allergies !== 'None'
            ? <span className="danger-text">{patient.allergies}</span>
            : patient?.allergies ?? '—'}
        </DetailRow>
      </div>

      {/* Medication */}
      <div className="section-header">Medication</div>
      <div className="card" style={{ marginBottom: 14 }}>
        <DetailRow label="Drug">
          {medication?.name ?? rx.medicationId}
          {medication?.controlled && <> <ControlledBadge /></>}
        </DetailRow>
        <DetailRow label="Class">{medication?.type ?? '—'}</DetailRow>
        <DetailRow label="Dose">{rx.dose}</DetailRow>
        <DetailRow label="Frequency">{rx.frequency}</DetailRow>
        <DetailRow label="Duration">{rx.duration}</DetailRow>
        <DetailRow label="Refills remaining">{rx.refills}</DetailRow>
      </div>

      {/* Details */}
      <div className="section-header">Details</div>
      <div className="card" style={{ marginBottom: 0 }}>
        <DetailRow label="Prescribed by">{rx.prescriber}</DetailRow>
        <DetailRow label="Date">{rx.date}</DetailRow>
        <DetailRow label="Status"><StatusBadge status={rx.status} /></DetailRow>
        {rx.notes && <DetailRow label="Notes">{rx.notes}</DetailRow>}
      </div>

      <div className="modal-footer">
        {rx.status === 'pending' && (
          <button className="btn primary" onClick={() => { onStatusChange(rx.id, 'active'); onClose(); }}>
            <i className="ti ti-check" /> Approve
          </button>
        )}
        {rx.status === 'active' && (
          <button className="btn primary" onClick={() => { onStatusChange(rx.id, 'filled'); onClose(); }}>
            <i className="ti ti-check" /> Mark filled
          </button>
        )}
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
