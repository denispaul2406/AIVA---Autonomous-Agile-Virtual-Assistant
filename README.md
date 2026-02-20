# AIVA — Autonomous Agile Virtual Assistant

A multi-agent AI system that automates Agile methodology — from SRS generation to meeting scheduling, task planning, and blocker resolution.

## Project Structure

```
Aiva/
├── client/          ← React + Vite frontend
│   ├── components/  ← UI components (Dashboard, LoginPage, etc.)
│   ├── contexts/    ← React contexts (AuthContext)
│   ├── services/    ← Firebase client SDK, API client
│   ├── App.tsx
│   ├── index.html
│   └── package.json
│
├── server/          ← Node.js + Express backend
│   ├── src/
│   │   ├── config/     ← Firebase Admin SDK
│   │   ├── middleware/  ← Auth, role-gating
│   │   ├── routes/     ← Agent 1-4 + Project routes
│   │   ├── services/   ← Gemini, Calendar, Slack
│   │   ├── types/      ← Shared TypeScript types
│   │   └── index.ts    ← Express entry point
│   └── package.json
│
├── SETUP_GUIDE.md   ← Step-by-step setup for all APIs
└── package.json     ← Monorepo scripts
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both client & server
npm run dev

# Or start individually
npm run dev:client   # http://localhost:3000
npm run dev:server   # http://localhost:5000
```

## Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions on configuring:
- Firebase (Auth + Firestore)
- Gemini API
- Google Calendar API
- Slack Bot

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion |
| Backend  | Node.js, Express, TypeScript |
| Auth     | Firebase Auth (email/password) |
| Database | Cloud Firestore |
| AI       | Google Gemini 2.0 Flash |
| Calendar | Google Calendar API |
| Notifications | Slack Block Kit |
