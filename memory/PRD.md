# DoorGuard — Product Requirements Document

## 1. Problem Statement
DoorGuard is an on-demand marketplace connecting clients with vetted personal
trainers and self-defense coaches for **at-home training**. The platform's core
differentiator is a non-negotiable **Safety & Trust** layer, since sessions
happen in clients' homes. Business model: marketplace fee of 15–25% per session
(currently 20%).

## 2. User Personas
- **Client**: Books in-home sessions, progresses through a gamified belt system,
  relies on safety controls (emergency contacts, SOS, session check-in/out).
- **Trainer**: Vetted coach (background + ID checked), manages availability,
  sessions, earnings, and reviews.

## 3. Core Requirements
- Role-based profiles (Client / Trainer) with JWT auth.
- Three categories: Personal Training, Self-Defense, Jiu-Jitsu.
- 5-phase gamified "digital belt" progression (White → Blue → Purple → Brown → Black),
  with per-category/phase challenges and points.
- Trainer search + profile + booking flow.
- Stripe checkout for sessions (kept as-is per user; uses emergent Stripe test key).
- **Safety & Trust layer** (key differentiator):
  - Emergency contacts management.
  - In-app Emergency SOS button (geo-location, notifies contacts).
  - Session safety check-in / check-out.
  - Incident / concern reporting to Trust & Safety.
  - Trainer background-check & ID-verified trust badges.

## 4. Architecture
- **Backend**: FastAPI (`/app/backend/server.py`), Motor (async MongoDB), PyJWT,
  bcrypt, emergentintegrations Stripe checkout. All routes prefixed `/api`.
- **Frontend**: React + React Router + Tailwind + Shadcn UI. Dark premium theme
  (gold `#C0A062` accent on near-black `#09090B`).
- **DB collections**: users, sessions, challenges, reviews, payment_transactions,
  safety_alerts, incident_reports.

### Key Endpoints
- Auth: `POST /api/auth/register|login`, `GET /api/auth/me`
- Trainers: `GET /api/trainers`, `GET /api/trainers/{id}`
- Sessions: `POST /api/sessions/book`, `GET /api/sessions/client|trainer`,
  `PUT /api/sessions/{id}/status`, `POST /api/sessions/{id}/checkin|checkout`
- Progress: `GET /api/challenges`, `POST /api/challenges/{id}/complete`,
  `POST /api/progress/phase-up`, `PUT /api/profile/category`
- Reviews: `POST /api/reviews`, `GET /api/reviews/trainer/{id}`
- Payments: `POST /api/payments/create-checkout`, `GET /api/payments/status/{sid}`
- Safety: `GET|PUT /api/safety/emergency-contacts`, `POST /api/safety/sos`,
  `GET /api/safety/alerts`, `PUT /api/safety/alerts/{id}/resolve`,
  `POST /api/safety/report`, `GET /api/safety/reports`
- Stats: `GET /api/stats/client|trainer`

## 5. Implemented (with dates)
- 2026-01: Auth, roles, trainer search/profile, booking, Stripe checkout,
  belt/challenge system, reviews, stats. Fixed ObjectId serialization and
  TrainerSearch Select crash.
- 2026-06-11: **Safety & Trust layer** — emergency contacts, Emergency SOS
  floating button (+ geolocation), session check-in/check-out, incident
  reporting, Safety Center page (`/safety`), trainer background-check/ID trust
  badges on cards & profile, nav link.

## 6. Backlog (prioritized)
- **P1**: Complete Stripe booking checkout frontend confirmation polish (payment kept as-is for now).
- **P2**: Real SMS/call notification for SOS (Twilio) — currently MOCKED (logged server-side only).
- **P2**: Session recording opt-in (audio/video) for safety.
- **P2**: Public reviews + private feedback separation.
- **P2**: Local rankings by belt & zip code.
- **P3**: Admin Trust & Safety dashboard to manage incident_reports / alerts.

## 7. Known Mocks / Limitations
- **SOS contact notification is MOCKED** — alerts are recorded in DB and logged,
  but no real SMS/call is sent (needs Twilio integration).
- Trainer background-check status defaults to "cleared" (no real vetting pipeline).
