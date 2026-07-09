// frontend/src/api/client.js
// All network calls go through this file.
// BASE is empty in dev (Vite proxies /api → localhost:3001).
// In production, set VITE_API_URL in Render's frontend environment variables.

const BASE = import.meta.env.VITE_API_URL || '/api/v1';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

const get   = (p)    => request('GET',    p);
const post  = (p, b) => request('POST',   p, b);
const patch = (p, b) => request('PATCH',  p, b);
const del   = (p)    => request('DELETE', p);

export const patientsApi = {
  list:          (q)  => get(q ? `/patients?q=${encodeURIComponent(q)}` : '/patients'),
  get:           (id) => get(`/patients/${id}`),
  create:        (b)  => post('/patients', b),
  update:        (id, b) => patch(`/patients/${id}`, b),
  remove:        (id) => del(`/patients/${id}`),
  prescriptions: (id) => get(`/patients/${id}/prescriptions`),
};

export const medicationsApi = {
  list:   (q)     => get(q ? `/medications?q=${encodeURIComponent(q)}` : '/medications'),
  get:    (id)    => get(`/medications/${id}`),
  create: (b)     => post('/medications', b),
  update: (id, b) => patch(`/medications/${id}`, b),
  remove: (id)    => del(`/medications/${id}`),
};

export const prescriptionsApi = {
  list:         (params = {}) => get(`/prescriptions?${new URLSearchParams(params)}`),
  get:          (id)    => get(`/prescriptions/${id}`),
  create:       (b)     => post('/prescriptions', b),
  updateStatus: (id, s) => patch(`/prescriptions/${id}`, { status: s }),
  remove:       (id)    => del(`/prescriptions/${id}`),
};

export const statsApi = { get: () => get('/stats') };
