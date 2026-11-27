# Implementation Plan: User Auth, Profile, Home Dashboard & Alerts

## Overview

Add a complete auth flow (Registration → Login → Home Dashboard) on top of the existing Krishi Sakhi AI frontend. Users register with their name, phone, language preference, and **crop type selection**. After registration/login they land on a new **Home Dashboard** with quick-action tiles. A persistent **Profile page** (accessible via a top-right avatar icon) holds the farm map, field-area selection, location picker, and other farmer details. An **Alerts bell** (top-right) shows proactive weather/disease notifications. The existing tab pages (Scanner, Risk Radar, etc.) remain unchanged.

## Architecture Decisions

- **Database: AWS DynamoDB Free Tier** — always-free tier (25 GB storage, 25 WCU/RCU) is sufficient for ≤10 farmers. Table: `nexora_users`. PK: `phone` (string). No expiry. Accessed via `boto3` in the FastAPI backend.
- **Auth: JWT (python-jose) + bcrypt** — stateless tokens, stored in `localStorage`. No third-party auth service needed for 10 users.
- **Backend router: `app/routers/auth.py`** — new endpoints `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/update-profile`.
- **Frontend routing: hash-based SPA routing** (already in use). Add pages: `auth`, `profile`, `dashboard`. Protect all existing pages behind auth guard. Use React Context for `AuthContext`.
- **Language i18n: react-i18next** — replace the manual `UI_STRINGS` lookup with `react-i18next`. Keeps `constants.js` as the source; translations loaded at startup.
- **Alerts: local alert engine** — `AlertsContext` polls `GET /api/alerts` (new endpoint) which merges weather severity + disease risk into ranked alerts. Bell badge shows unread count.
- **Profile — farm/field setup:** Move the existing `FarmSatellitePage` / `FarmRiskRadarPanel` field-drawing tools into the Profile page. Main tabs remain read-only views.

## Task List

### Phase 1 — Backend Auth + DB (Foundation)

- [ ] Task 1: DynamoDB table + boto3 user model (`backend/app/data/dynamo_users.py`)
- [ ] Task 2: Auth router — register, login, me, update-profile (`backend/app/routers/auth.py`)
- [ ] Task 3: Alerts endpoint — `GET /api/alerts` returns ranked farm alerts (`backend/app/routers/alerts.py`)
- [ ] Task 4: Wire new routers into `main.py`; update `requirements.txt`

### Phase 2 — Frontend Auth Pages

- [ ] Task 5: `AuthContext.jsx` + `ProtectedRoute.jsx`
- [ ] Task 6: `RegisterPage.jsx` — name, phone, password, language, crop-type dropdown
- [ ] Task 7: `LoginPage.jsx` — phone + password, link to register
- [ ] Task 8: Wire auth routing into `App.jsx`

### Phase 3 — Profile Page & Farm Setup

- [ ] Task 9: `ProfilePage.jsx` — editable fields + farm map integration
- [ ] Task 10: Persistent profile avatar icon top-right in Navbar

### Phase 4 — Home Dashboard & Alerts

- [ ] Task 11: `HomeDashboard.jsx` — 6 quick-action tiles
- [ ] Task 12: `AlertsContext.jsx` + bell icon + `AlertsPanel.jsx`

### Phase 5 — Language Switch (react-i18next)

- [ ] Task 13: Install i18n, extract UI_STRINGS to locale JSON, useTranslation() hook

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DynamoDB creds not configured locally | High | Fallback to `LOCAL_JSON_STORE` env flag for dev |
| Existing `FarmSatellitePage` tightly coupled to App state | Med | Pass profile callbacks as props |
