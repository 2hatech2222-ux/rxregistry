// frontend/src/utils/useStore.js
import { useState, useEffect, useCallback } from 'react';
import { patientsApi, medicationsApi, prescriptionsApi } from '../api/client';

export function useStore() {
  const [patients,      setPatients]      = useState([]);
  const [medications,   setMedications]   = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [alert,         setAlert]         = useState(null);
  const [loading,       setLoading]       = useState(true);

  // ── Bootstrap: load all data on mount ────────────────────
  useEffect(() => {
    Promise.all([
      patientsApi.list(),
      medicationsApi.list(),
      prescriptionsApi.list({ limit: 500 }),
    ])
      .then(([pts, meds, rxRes]) => {
        setPatients(pts);
        setMedications(meds);
        setPrescriptions(rxRes.data ?? rxRes);
      })
      .catch(err => showAlert(err.message, 'warning'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────
  const showAlert = useCallback((msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  }, []);

  const getPatient = useCallback(id => patients.find(p => p.id === id),    [patients]);
  const getMed     = useCallback(id => medications.find(m => m.id === id), [medications]);

  // ── Prescriptions ─────────────────────────────────────────
  const addPrescription = useCallback(async fields => {
    const rx = await prescriptionsApi.create(fields);
    setPrescriptions(prev => [rx, ...prev]);
    showAlert(`Prescription ${rx.id} registered successfully.`);
    return rx.id;
  }, [showAlert]);

  const updatePrescriptionStatus = useCallback(async (id, status) => {
    const rx = await prescriptionsApi.updateStatus(id, status);
    setPrescriptions(prev => prev.map(r => r.id === id ? rx : r));
    showAlert(`Prescription ${id} marked as ${status}.`);
  }, [showAlert]);

  // ── Patients ──────────────────────────────────────────────
  const addPatient = useCallback(async fields => {
    const pt = await patientsApi.create(fields);
    setPatients(prev => [...prev, pt].sort((a, b) => a.name.localeCompare(b.name)));
    showAlert(`Patient ${pt.name} added successfully.`);
    return pt.id;
  }, [showAlert]);

  // ── Medications ───────────────────────────────────────────
  const addMedication = useCallback(async fields => {
    const med = await medicationsApi.create(fields);
    setMedications(prev => [...prev, med].sort((a, b) => a.name.localeCompare(b.name)));
    showAlert(`${med.name} added to the medication registry.`);
    return med.id;
  }, [showAlert]);

  return {
    patients, medications, prescriptions,
    alert, loading,
    getPatient, getMed,
    addPrescription, updatePrescriptionStatus,
    addPatient, addMedication,
  };
}
