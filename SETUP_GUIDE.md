# AIVA — Complete Setup Guide

> This guide walks you through setting up **every API key and secret** needed to run AIVA locally.

---

## Table of Contents
1. [Firebase Setup](#1-firebase-setup)
2. [Gemini API Key](#2-gemini-api-key)
3. [Google Calendar API](#3-google-calendar-api)
4. [Slack Bot Setup](#4-slack-bot-setup)
5. [Environment Files Reference](#5-environment-files-reference)
6. [Running the App](#6-running-the-app)

---

## 1. Firebase Setup

You need: **Firebase Auth** (for login) + **Firestore** (for data storage).

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it (e.g., `aiva-project`)
4. Disable Google Analytics (optional)
5. Click **Create project**

### Step 2: Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

### Step 3: Create Firestore Database

1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select your region (e.g., `asia-south1` for India)
4. Click **Enable**

### Step 4: Get Client Config (for `.env.local`)

1. In Firebase Console → **Project Settings** (gear icon) → **General**
2. Scroll down to **Your apps** → Click **Web** (`</>` icon)
3. Register the app (name: `AIVA Web`)
4. Copy the `firebaseConfig` object. It looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aiva-project.firebaseapp.com",
  projectId: "aiva-project",
  storageBucket: "aiva-project.appspot.com", 
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Fill these values into your **`.env.local`** file (in the project root):

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=aiva-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aiva-project
VITE_FIREBASE_STORAGE_BUCKET=aiva-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 5: Get Admin SDK Credentials (for `server/.env`)

1. In Firebase Console → **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. A JSON file will download. Open it and extract these values:

```
FIREBASE_PROJECT_ID=aiva-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aiva-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **IMPORTANT**: The private key must be wrapped in double quotes and `\n` must be literal backslash-n (not actual newlines).

4. Fill these into your **`server/.env`** file.

---

## 2. Gemini API Key

### Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy the API key (starts with `AIza...`)

### Step 2: Add to Environment

Add this key to your **`server/.env`** file:

```
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
```

---

## 3. Google Calendar API

You already have a service account JSON file (`emerald-handler-486407-v9-fd5e01b68fc7.json`).

### Step 1: Enable the Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project **`emerald-handler-486407-v9`**
3. Go to **APIs & Services** → **Library**
4. Search for **"Google Calendar API"**
5. Click **Enable**

### Step 2: Share Your Calendar with the Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. In the left sidebar, hover over your calendar → click the **three dots** → **Settings and sharing**
3. Scroll to **"Share with specific people or groups"**
4. Click **"Add people and groups"**
5. Enter the service account email:
   ```
   googlecalendarapi@emerald-handler-486407-v9.iam.gserviceaccount.com
   ```
6. Set permission to **"Make changes to events"**
7. Click **Send**

### Step 3: Add Credentials to `server/.env`

Open the `emerald-handler-486407-v9-fd5e01b68fc7.json` file and copy the values:

```
GOOGLE_CALENDAR_CLIENT_EMAIL=googlecalendarapi@emerald-handler-486407-v9.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvg...(copy the full key)...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

> **Tip**: If you want meetings created on a specific team calendar (not your primary), replace `primary` with the calendar ID found in Calendar Settings → **"Integrate calendar"** → **Calendar ID**.

### Step 4: Add Team Member Emails

Add all 4 team members' email addresses (comma-separated):

```
TEAM_MEMBER_EMAILS=lead@gmail.com,dev1@gmail.com,dev2@gmail.com,tester@gmail.com
```

These emails will receive Google Calendar invites with Google Meet links.

---

## 4. Slack Bot Setup

### Step 1: Configure the App

1. Go to your Slack app: [api.slack.com/apps/A0ACTSXJ6TG](https://api.slack.com/apps/A0ACTSXJ6TG)
2. In the left sidebar → **OAuth & Permissions**
3. Under **Bot Token Scopes**, add these scopes:
   - `chat:write` — post messages to channels
   - `channels:read` — list channels
   - `channels:join` — join channels automatically

### Step 2: Install to Workspace

1. Still on the **OAuth & Permissions** page
2. Click **"Install to Workspace"** (or **"Reinstall"** if already installed)
3. Click **Allow** to authorize
4. Copy the **Bot User OAuth Token** (starts with `xoxb-...`)

### Step 3: Create a Notification Channel

1. In Slack, create a channel called `#aiva-notifications` (or any name you prefer)
2. Invite the bot to the channel: type `/invite @Demo App` in the channel

### Step 4: Get the Channel ID

1. In Slack, right-click on the `#aiva-notifications` channel
2. Click **"View channel details"**
3. At the very bottom, you'll see the **Channel ID** (e.g., `C0ABC123XYZ`)

### Step 5: Add to `server/.env`

```
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL_ID=C0ABC123XYZ
```

---

## 5. Environment Files Reference

### `server/.env` (All Secrets — NEVER Commit)

```env
PORT=5000
CLIENT_URL=http://localhost:3000

# Gemini
GEMINI_API_KEY=AIzaSy_your_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Calendar
GOOGLE_CALENDAR_CLIENT_EMAIL=googlecalendarapi@emerald-handler-486407-v9.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary

# Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C0ABC123XYZ

# Team
TEAM_MEMBER_EMAILS=lead@gmail.com,dev1@gmail.com,dev2@gmail.com,tester@gmail.com
```

### `.env.local` (Frontend — Safe to Expose)

```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_API_URL=http://localhost:5000
```

---

## 6. Running the App

### Prerequisites
- Node.js 18+
- npm

### Start the Backend

```bash
cd server
npm install   # (already done)
npm run dev
```

You should see:
```
🚀 AIVA Server running on http://localhost:5000
📊 Health check: http://localhost:5000/api/health
```

### Start the Frontend

```bash
# In the project root (Aiva/)
npm install   # (already done)
npm run dev
```

Vite will start on `http://localhost:3000`.

### First-Time Setup

1. Open `http://localhost:3000`
2. Click **"Register"**
3. Create the **Team Lead** account first (select "Team Lead" role)
4. Create 3 more accounts for: Developer 1, Developer 2, Tester
5. Log in as **Team Lead** → Create a new project → Start the agent pipeline!

### Verify Everything Works

Hit the health check to verify which services are configured:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "services": {
    "gemini": true,
    "firebase": true,
    "googleCalendar": true,
    "slack": true
  }
}
```

Any service showing `false` hasn't been configured yet — go back and fill in the corresponding `.env` values.
