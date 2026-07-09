// backend/scripts/seed.js
// Inserts sample data. Safe to re-run — uses ON CONFLICT DO NOTHING.
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { pool } = require('../src/db/pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Patients ────────────────────────────────────────────────────────────
    const patients = [
      ['P001','Amara Tesfaye',  '1985-04-12','Female','+251 91 123 4567','Penicillin',    ''],
      ['P002','Dawit Bekele',   '1972-09-03','Male',  '+251 92 234 5678','None',          ''],
      ['P003','Sara Haile',     '1990-01-28','Female','+251 93 345 6789','Sulfa drugs',   ''],
      ['P004','Yonas Girma',    '1965-07-15','Male',  '+251 91 456 7890','Aspirin',       ''],
      ['P005','Hiwot Alemu',    '1998-11-22','Female','+251 92 567 8901','None',          ''],
      ['P006','Bereket Tadesse','1950-03-07','Male',  '+251 93 678 9012','Codeine, NSAIDs',''],
    ];
    for (const p of patients) {
      await client.query(
        `INSERT INTO patients (id,name,dob,gender,phone,allergies,email)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`, p
      );
    }

    // ── Medications ─────────────────────────────────────────────────────────
    const meds = [
      ['M001','Amoxicillin',  'Antibiotic',    false,'mg'],
      ['M002','Metformin',    'Antidiabetic',  false,'mg'],
      ['M003','Tramadol',     'Analgesic',     true, 'mg'],
      ['M004','Lisinopril',   'ACE Inhibitor', false,'mg'],
      ['M005','Diazepam',     'Benzodiazepine',true, 'mg'],
      ['M006','Omeprazole',   'PPI',           false,'mg'],
      ['M007','Atorvastatin', 'Statin',        false,'mg'],
      ['M008','Salbutamol',   'Bronchodilator',false,'mcg'],
      ['M009','Morphine',     'Opioid',        true, 'mg'],
      ['M010','Ciprofloxacin','Antibiotic',    false,'mg'],
    ];
    for (const m of meds) {
      await client.query(
        `INSERT INTO medications (id,name,type,controlled,unit)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, m
      );
    }

    // ── Prescriptions ────────────────────────────────────────────────────────
    const rxs = [
      ['RX-2024-001','P001','M001','500mg', 'Three times daily','7 days', 'Dr. Kaleb Mengistu','2024-06-01',0,'filled', 'Take with food'],
      ['RX-2024-002','P002','M002','850mg', 'Twice daily',      '90 days','Dr. Tigist Alemu',  '2024-06-10',2,'active', ''],
      ['RX-2024-003','P003','M004','10mg',  'Once daily',       '30 days','Dr. Kaleb Mengistu','2024-05-15',1,'active', 'Monitor blood pressure weekly'],
      ['RX-2024-004','P004','M003','50mg',  'Twice daily',      '5 days', 'Dr. Tigist Alemu',  '2024-04-01',0,'expired','Post-surgery pain management'],
      ['RX-2024-005','P001','M006','20mg',  'Once daily',       '14 days','Dr. Kaleb Mengistu','2024-06-20',0,'pending',''],
      ['RX-2024-006','P005','M008','100mcg','As needed',        '30 days','Dr. Meron Tadesse', '2024-06-18',3,'active', 'Asthma inhaler — 2 puffs per use'],
      ['RX-2024-007','P006','M007','40mg',  'Once daily',       '90 days','Dr. Tigist Alemu',  '2024-06-22',5,'active', 'Take in the evening'],
      ['RX-2024-008','P002','M004','5mg',   'Once daily',       '60 days','Dr. Kaleb Mengistu','2024-06-25',1,'pending','Hypertension management'],
    ];
    for (const r of rxs) {
      await client.query(
        `INSERT INTO prescriptions
           (id,patient_id,medication_id,dose,frequency,duration,prescriber,date,refills,status,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`, r
      );
    }

    await client.query('COMMIT');
    console.log(`✅  Seed complete — ${patients.length} patients, ${meds.length} medications, ${rxs.length} prescriptions.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
