import React, { useState } from 'react';

import { useStore }        from './utils/useStore';
import Dashboard           from './pages/Dashboard';
import Prescriptions       from './pages/Prescriptions';
import Patients            from './pages/Patients';
import Medications         from './pages/Medications';
import LoadingScreen       from './components/LoadingScreen';

import RxDetailModal       from './components/RxDetailModal';
import NewRxModal          from './components/NewRxModal';
import NewPatientModal     from './components/NewPatientModal';
import NewMedModal         from './components/NewMedModal';

const TABS = [
  { id: 'dashboard',     label: 'Dashboard',    icon: 'ti-layout-dashboard' },
  { id: 'prescriptions', label: 'Prescriptions', icon: 'ti-file-text' },
  { id: 'patients',      label: 'Patients',      icon: 'ti-users' },
  { id: 'medications',   label: 'Medications',   icon: 'ti-pill' },
];

export default function App() {
  const store = useStore();
  const [tab,       setTab]     = useState('dashboard');
  const [viewingRx, setViewRx]  = useState(null);
  const [modal,     setModal]   = useState(null);

  const { prescriptions, patients, medications,
          getPatient, getMed,
          addPrescription, updatePrescriptionStatus,
          addPatient, addMedication, loading } = store;

  if (loading) return <LoadingScreen />;

  const activeRx = viewingRx ? prescriptions.find(r => r.id === viewingRx) : null;

  const topbarActions = () => {
    if (tab === 'prescriptions')
      return <button className="btn primary" onClick={() => setModal('newRx')}><i className="ti ti-plus" /> New prescription</button>;
    if (tab === 'patients')
      return <button className="btn primary" onClick={() => setModal('newPatient')}><i className="ti ti-plus" /> Add patient</button>;
    if (tab === 'medications')
      return <button className="btn primary" onClick={() => setModal('newMed')}><i className="ti ti-plus" /> Add medication</button>;
    return null;
  };

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-logo">
          <h1>RxRegistry</h1>
          <span>Prescription System</span>
        </div>
        {TABS.map(t => (
          <div
            key={t.id}
            className={`nav-item${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
            {t.label}
          </div>
        ))}
      </nav>

      <div className="main">
        <div className="topbar">
          <h2>{TABS.find(t => t.id === tab)?.label}</h2>
          <div className="topbar-actions">{topbarActions()}</div>
        </div>
        <main className="content">
          {tab === 'dashboard'     && <Dashboard     store={store} onViewRx={setViewRx} />}
          {tab === 'prescriptions' && <Prescriptions store={store} onViewRx={setViewRx} />}
          {tab === 'patients'      && <Patients      store={store} onViewRx={id => { setViewRx(id); setTab('prescriptions'); }} />}
          {tab === 'medications'   && <Medications   store={store} />}
        </main>
      </div>

      {activeRx && (
        <RxDetailModal
          rx={activeRx}
          patient={getPatient(activeRx.patientId)}
          medication={getMed(activeRx.medicationId)}
          onClose={() => setViewRx(null)}
          onStatusChange={updatePrescriptionStatus}
        />
      )}
      {modal === 'newRx' && (
        <NewRxModal patients={patients} medications={medications}
          onSave={addPrescription} onClose={() => setModal(null)} />
      )}
      {modal === 'newPatient' && (
        <NewPatientModal onSave={addPatient} onClose={() => setModal(null)} />
      )}
      {modal === 'newMed' && (
        <NewMedModal onSave={addMedication} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
