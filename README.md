# 🤖 AIVA — Autonomous Agile Virtual Assistant

<div align="center">

**Four AI agents that automate your entire Agile workflow** — from requirements analysis to meeting scheduling, task planning, and blocker resolution.

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://aiva-agile.netlify.app)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google&logoColor=white)

[Live Demo](https://aiva-agile.netlify.app) · [Setup Guide](./SETUP_GUIDE.md)

</div>

---

## ✨ Features

| Agent | Role | What it does |
|-------|------|-------------|
| 🔍 **Business Analyst** | Requirement Analysis | Transforms raw notes/emails into structured SRS documents |
| 📅 **Coordinator** | Scheduling & Logistics | Auto-schedules meetings, sends Google Calendar invites |
| 📋 **Tech Lead** | Planning & Assignment | Breaks SRS into tasks, assigns resources, flags gaps |
| 🛡️ **Scrum Master** | Blocker Resolution | Tracks blockers in real-time, generates AI-powered fixes |

**Additional highlights:**
- 🔐 Role-based access — Team Lead, Developer, Tester
- 👥 Multi-project support with team management
- 📊 Kanban board with drag-to-update task statuses
- 🔔 Slack notifications for meetings and blockers
- 🎨 Premium dark-mode UI with animations

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
- Node.js 18+
- Firebase project (Auth + Firestore)
- Gemini API key
- Google Calendar service account *(optional)*
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
npm run dev:client   # → http://localhost:5173
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
| Backend | Node.js, Express, TypeScript |
| Auth | Firebase Auth (email/password) |
| Database | Cloud Firestore |
| AI | Google Gemini 2.0 Flash |
| Calendar | Google Calendar API |
| Notifications | Slack Block Kit |

---

## 📝 Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key |
| `GOOGLE_CALENDAR_CLIENT_EMAIL` | No | Calendar service account email |
| `GOOGLE_CALENDAR_PRIVATE_KEY` | No | Calendar service account key |
| `SLACK_BOT_TOKEN` | No | Slack bot OAuth token |
| `SLACK_CHANNEL_ID` | No | Slack channel for notifications |
| `KEEP_ALIVE` | No | Set `true` to enable self-ping (Render free tier) |
| `RENDER_EXTERNAL_URL` | No | Your Render external URL for keep-alive |

### Client (`client/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |

---

## 📄 License

This project is for educational and demonstration purposes.
