# RxRegistry — Full-Stack Setup Guide

**Stack:** React + Vite (frontend) · Node.js + Express (backend) · NeonDB (PostgreSQL)  
**Deploy:** GitHub → Render.com (one `render.yaml`, two services)

---

## Project structure

```
rxregistry/                        ← GitHub repo root
├── render.yaml                    ← Render Blueprint (deploys both services)
├── package.json                   ← npm workspace root
├── .gitignore
│
├── backend/                       ← Node.js + Express API
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js              ← Express entry point
│   │   ├── db/
│   │   │   ├── pool.js            ← NeonDB connection pool (pg)
│   │   │   ├── ids.js             ← Sequential ID generators
│   │   │   └── audit.js           ← Audit log writer
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── routes/
│   │       ├── patients.js
│   │       ├── medications.js
│   │       ├── prescriptions.js
│   │       ├── stats.js
│   │       └── audit.js
│   └── scripts/
│       ├── migrate.js             ← Creates tables in NeonDB
│       └── seed.js                ← Inserts sample data
│
└── frontend/                      ← React + Vite SPA
    ├── package.json
    ├── vite.config.js             ← Dev proxy: /api → localhost:3001
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── client.js          ← All fetch calls (BASE = VITE_API_URL)
        ├── utils/
        │   ├── useStore.js        ← React hook — loads from API on mount
        │   └── helpers.js
        ├── components/
        │   ├── UI.jsx
        │   ├── LoadingScreen.jsx
        │   ├── RxDetailModal.jsx
        │   ├── NewRxModal.jsx
        │   ├── NewPatientModal.jsx
        │   └── NewMedModal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Prescriptions.jsx
            ├── Patients.jsx
            └── Medications.jsx
```

---

## Part 1 — Set up NeonDB

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Click **New Project** → give it the name `rxregistry` → choose a region close to you.
3. Neon creates a database called `neondb` by default. You can rename it or use it as-is.
4. On the project dashboard, click **Connection string** → make sure the driver is set to **Node.js** → copy the full string. It looks like:
   ```
   postgresql://user:password@ep-something-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Keep this string handy — you'll paste it into both the local `.env` and Render's dashboard.

---

## Part 2 — Push to GitHub

### 2.1 Create the repository

1. Log into [github.com](https://github.com) → click **+** → **New repository**.
2. Name it `rxregistry`, set it to **Private** (recommended for a medical system), leave "Initialize" unchecked.
3. Click **Create repository**.

### 2.2 Push from your machine

```bash
# From the rxregistry/ folder (the monorepo root)
git init
git add .
git commit -m "Initial commit: RxRegistry full-stack"
git branch -M main
git remote add origin https://github.com/<your-username>/rxregistry.git
git push -u origin main
```

If prompted for a password, use a **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens → Generate new token, scope: `repo`).

### 2.3 Verify

Visit `https://github.com/<your-username>/rxregistry` — you should see the `backend/`, `frontend/`, and `render.yaml` files. Confirm that `node_modules/` and `.env` files are absent (they're in `.gitignore`).

---

## Part 3 — Run locally

### 3.1 Install dependencies

```bash
# From the repo root (installs both workspaces)
npm install
```

### 3.2 Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3.3 Create tables and seed data

```bash
# From repo root:
npm run migrate   # creates all tables in NeonDB
npm run seed      # inserts 6 patients, 10 medications, 8 prescriptions
```

### 3.4 Start both servers

Open two terminals:

```bash
# Terminal 1 — backend
npm run dev:backend
# → http://localhost:3001/api/v1

# Terminal 2 — frontend
npm run dev:frontend
# → http://localhost:5173
```

The Vite dev server proxies `/api` to `localhost:3001`, so no CORS issues locally — you don't need `VITE_API_URL` in development.

Open `http://localhost:5173` — the Dashboard should show real data from NeonDB.

---

## Part 4 — Deploy on Render

### 4.1 Connect Render to GitHub

1. Go to [render.com](https://render.com) → sign up / log in.
2. Click **New** → **Blueprint**.
3. Connect your GitHub account if you haven't already → select your `rxregistry` repo.
4. Render reads `render.yaml` and shows you two services: `rxregistry-backend` and `rxregistry-frontend`.

### 4.2 Set the secret environment variable

The `render.yaml` marks `DATABASE_URL` as `sync: false`, meaning Render won't set it automatically — you paste it manually so it never appears in your git history.

In the Render deploy screen (or after deploy, in the service's **Environment** tab):

- Service: `rxregistry-backend`
- Key: `DATABASE_URL`
- Value: paste your Neon connection string

### 4.3 Deploy

Click **Apply** (or **Deploy**). Render will:

1. Clone your repo.
2. Run `npm install` in `backend/`.
3. Run `npm run migrate && npm start` — this creates the tables in NeonDB on first boot, then starts the API.
4. Build the frontend with `npm install && npm run build` in `frontend/` (Vite bakes `VITE_API_URL` into the static bundle).
5. Serve the `dist/` folder as a static site with the SPA rewrite rule.

After a few minutes both services will be live:
- **API**: `https://rxregistry-backend.onrender.com/api/v1/health`
- **App**: `https://rxregistry-frontend.onrender.com`

### 4.4 Seed on Render (first deploy only)

The migrate script runs automatically on every start. The seed script does not — run it once via Render's **Shell** tab (click into the `rxregistry-backend` service → **Shell**):

```bash
npm run seed
```

After that, remove `npm run seed` from the startCommand if you prefer, or leave it — it uses `ON CONFLICT DO NOTHING` so re-running is safe.

### 4.5 Update CORS_ORIGIN

If Render assigns a different URL than the one in `render.yaml`, update `CORS_ORIGIN` in the backend service's Environment tab to match the actual frontend URL, then **Manual Deploy → Deploy latest commit** to restart the backend.

---

## Part 5 — Updating the app

```bash
# Make your changes locally, test them, then:
git add .
git commit -m "Describe your change"
git push
```

Render auto-deploys both services on every push to `main`. The backend runs `npm run migrate` on restart, so schema changes added to `migrate.js` are applied automatically.

---

## API reference (quick)

| Method | Path                           | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | /api/v1/health                 | Liveness check                 |
| GET    | /api/v1/stats                  | Dashboard counts               |
| GET    | /api/v1/patients               | List patients (`?q=`)          |
| POST   | /api/v1/patients               | Create patient                 |
| PATCH  | /api/v1/patients/:id           | Update patient                 |
| GET    | /api/v1/patients/:id/prescriptions | Patient's Rx history       |
| GET    | /api/v1/medications            | List medications               |
| POST   | /api/v1/medications            | Create medication              |
| GET    | /api/v1/prescriptions          | List Rx (paginated, filterable)|
| POST   | /api/v1/prescriptions          | Register prescription          |
| PATCH  | /api/v1/prescriptions/:id      | Update status / notes          |
| GET    | /api/v1/audit                  | Audit log                      |

**Prescription status flow:** `pending → active → filled` (or `expired`). Filled/expired records are immutable.

---

## Environment variables summary

### backend/.env (local) / Render backend service

| Variable       | Example value                                         | Required |
|----------------|-------------------------------------------------------|----------|
| `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require`    | ✅       |
| `PORT`         | `3001` (local) / `10000` (Render sets automatically)  | ✅       |
| `NODE_ENV`     | `development` / `production`                          | ✅       |
| `CORS_ORIGIN`  | `http://localhost:5173` / `https://your-app.onrender.com` | ✅   |

### frontend/.env.production (or Render frontend service)

| Variable       | Example value                                              | Required |
|----------------|------------------------------------------------------------|----------|
| `VITE_API_URL` | `https://rxregistry-backend.onrender.com/api/v1`           | ✅ (prod)|

Not needed in local dev — the Vite proxy handles it.
