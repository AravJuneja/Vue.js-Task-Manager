# Vue.js Task Manager

A simple task manager with Google OAuth login and per-user persistent storage.

## Stack

- **Frontend:** Vue 3 + Vite
- **Backend:** Node.js + Express
- **Auth:** Google OAuth 2.0
- **Database:** SQLite

## Setup

1. Clone the repo

2. Create `backend/.env` from the example:
   ```
   cp backend/.env.example backend/.env
   ```
   Fill in your Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com).
   Set the authorized redirect URI to `http://localhost:3000/auth/google/callback`.

3. Install dependencies:
   ```
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Run the backend:
   ```
   cd backend && npm start
   ```

5. Run the frontend:
   ```
   cd frontend && npm run dev
   ```

6. Open `http://localhost:5173`

## Features

- Sign in with Google
- Add, edit (double-click), and delete tasks
- Mark tasks as complete with a checkbox
- Tasks are saved per user
