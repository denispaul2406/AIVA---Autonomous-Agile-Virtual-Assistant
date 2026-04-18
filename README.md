# 🤖 AIVA — Autonomous Agile Virtual Assistant

<div align="center">

**Four AI agents that automate your entire Agile workflow** — from requirements analysis to meeting scheduling, task planning, and blocker resolution.

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://aiva-agile.netlify.app)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-flash--latest-4285F4?logo=google&logoColor=white)

[Live Demo](https://aiva-agile.netlify.app) · [Setup Guide](./SETUP_GUIDE.md)

</div>

---

## ✨ Features

| Agent | Role | What it does |
|-------|------|-------------|
| 🔍 **Business Analyst** | Requirement Analysis | Transforms raw notes/emails into structured SRS documents |
| 📅 **Coordinator** | Scheduling & Logistics | Auto-schedules meetings with **real Google Meet links** (OAuth 2.0) and Calendar invites |
| 📋 **Tech Lead** | Planning & Assignment | Breaks SRS into tasks, assigns resources, flags gaps |
| 🛡️ **Scrum Master** | Blocker Resolution | Tracks blockers in real-time, generates AI-powered fixes, escalates when needed |

**Additional highlights:**
- 🔐 Role-based access — Team Lead, Developer, Tester
- 👥 Multi-project support with team management
- 📊 Kanban board with drag-to-update task statuses
- 🔔 Slack notifications for meetings and blockers
- 🎨 Premium dark-mode UI with animations
- ♻️ Resilient Gemini client with model cascade + exponential backoff (auto-falls through `gemini-flash-latest` → `gemini-2.0-flash` → `gemini-2.0-flash-lite` on rate-limit / 404 errors)
- 🩺 Health check endpoint at `/api/health` reporting per-service status

---

## 🏗️ Architecture

```
Aiva/
├── client/                ← React + Vite + Tailwind (Netlify)
│   ├── components/        ← Dashboard, LandingPage, LoginPage, etc.
│   ├── contexts/          ← AuthContext (Firebase Auth)
│   ├── services/          ← API client, Firebase SDK
│   ├── App.tsx            ← Landing → Login → Dashboard routing
│   ├── index.html
│   └── package.json
│
├── server/                ← Node.js + Express + TypeScript (Render)
│   └── src/
│       ├── config/        ← Firebase Admin SDK
│       ├── middleware/     ← Auth verification, role-gating
│       ├── routes/        ← Agent 1–4, Projects, Users
│       ├── services/      ← Gemini AI, Google Calendar, Slack
│       ├── types/         ← Shared TypeScript types
│       └── index.ts       ← Express entry + keep-alive
│
├── SETUP_GUIDE.md         ← Full API setup instructions
└── package.json           ← Monorepo scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (make sure `npm` is on your PATH — Cursor's bundled Node does not include npm)
- Firebase project (Auth + Firestore)
- Gemini API key — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Google OAuth 2.0 credentials *(recommended — required for real Google Meet links)*
- Google Calendar service account *(optional fallback — cannot generate Meet links for consumer Gmail)*
- Slack bot token *(optional)*

### 1. Clone & Install

```bash
git clone https://github.com/denispaul2406/AIVA---Autonomous-Agile-Virtual-Assistant.git
cd AIVA---Autonomous-Agile-Virtual-Assistant

# Install all dependencies (client + server)
npm run install:all
```

### 2. Configure Environment

**Server** — copy and fill in `server/.env`:
```bash
cp server/.env.example server/.env
# Edit server/.env with your API keys
```

**Client** — create `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

> See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed API configuration.

### 3. Run Locally

```bash
# Start both client & server
npm run dev

# Or individually
npm run dev:client   # → http://localhost:3000
npm run dev:server   # → http://localhost:5000
```

---

## 🌐 Deployment

### Frontend → Netlify
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Base directory:** `client`
- Set `VITE_API_URL` to your Render server URL in Netlify environment variables

### Backend → Render
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Root directory:** `server`
- Add all `server/.env` variables in Render's Environment settings
- **Keep-alive** (free tier): Add these env vars to prevent server sleep:
  ```
  KEEP_ALIVE=true
  RENDER_EXTERNAL_URL=https://your-app.onrender.com
  ```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript (`tsx watch` in dev) |
| Auth | Firebase Auth (email/password) |
| Database | Cloud Firestore |
| AI | Google Gemini (`gemini-flash-latest`, with 2.0-flash / 2.0-flash-lite fallback) |
| Calendar & Meet | Google Calendar API via OAuth 2.0 (real Meet links) with service-account fallback |
| Notifications | Slack Block Kit |

---

## 📝 Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g. `http://localhost:3000`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key |
| `GOOGLE_OAUTH_CLIENT_ID` | Recommended | OAuth 2.0 client ID (required for real Meet links) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Recommended | OAuth 2.0 client secret |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Recommended | Long-lived refresh token from OAuth 2.0 Playground |
| `GOOGLE_CALENDAR_ID` | No | Calendar ID (default: `primary`) |
| `GOOGLE_CALENDAR_CLIENT_EMAIL` | No | Service account fallback (no Meet link support) |
| `GOOGLE_CALENDAR_PRIVATE_KEY` | No | Service account private key fallback |
| `TEAM_MEMBER_EMAILS` | No | Comma-separated emails auto-invited to meetings |
| `SLACK_BOT_TOKEN` | No | Slack bot OAuth token |
| `SLACK_CHANNEL_ID` | No | Slack channel for notifications |
| `KEEP_ALIVE` | No | Set `true` to enable self-ping (Render free tier) |
| `RENDER_EXTERNAL_URL` | No | Your Render external URL for keep-alive |

> ⚠️ **dotenv tip:** Place the `GOOGLE_OAUTH_*` variables **before** `FIREBASE_PRIVATE_KEY` in your `.env` file. The very long private-key string can trip up dotenv's parser and silently drop variables that follow it.

### Client (`client/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |

---

## 🩹 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agent calls take 3–5 minutes then fail | Gemini free-tier quota exhausted (HTTP 429) | Generate a fresh API key in a new GCP project, or enable billing |
| Google Meet link is a placeholder | Using service account (can't create Meet links on consumer Gmail) | Switch to OAuth 2.0 by setting the `GOOGLE_OAUTH_*` env vars |
| `redirect_uri_mismatch` when getting refresh token | OAuth Playground URI not whitelisted | Add `https://developers.google.com/oauthplayground` to Authorized redirect URIs in GCP Console |
| `Access blocked — AIVA has not completed verification` | App in testing mode with no test users | Add your Gmail address as a Test User in OAuth Consent Screen |
| `EADDRINUSE: :::5000` | Stale server still running | Kill the process: `Get-NetTCPConnection -LocalPort 5000` then `Stop-Process` |
| `'npm' is not recognized` | Cursor's bundled Node lacks npm | Install Node.js from [nodejs.org](https://nodejs.org) and add `C:\Program Files\nodejs` to PATH |
| Health endpoint shows `googleMeet: false` after setting OAuth vars | dotenv parsing failed | Move `GOOGLE_OAUTH_*` vars *above* `FIREBASE_PRIVATE_KEY` in `.env` |

Quick health check:
```bash
curl http://localhost:5000/api/health
```
All five services (`gemini`, `firebase`, `googleCalendar`, `googleMeet`, `slack`) should report `true`.

---

## 📄 License

This project is for educational and demonstration purposes.
