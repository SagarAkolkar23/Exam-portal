# ExamForge 🚀

> A full-stack online exam and polling platform for colleges.  
> Built with Node.js + Express + MongoDB + React 18 + Socket.io

---

## Features

- 📝 **Exam Creation** — Multi-step wizard with MCQ questions, scheduling, student assignment
- 🔀 **Seeded Option Shuffling** — Each student sees options in a unique order; backend grades correctly
- 🕵️ **Real-time Anti-cheat** — Fullscreen lock, tab switch detection, copy/paste block, devtools detection
- ⚡ **Live Proctoring** — Socket.io broadcasts violations to teacher dashboard instantly
- 📊 **Polls** — Create polls with live vote counts and CSS bar charts
- 📥 **CSV Export** — Download results table as CSV
- 🔐 **JWT Auth** — Separate teacher and student login flows

---

## Prerequisites

- Node.js v20+
- MongoDB running locally (or update `MONGODB_URI` in `.env` for Atlas)
- npm v9+

---

## Installation

### 1. Clone / navigate to the project

```bash
cd examforge
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

---

## Environment Variables

The server `.env` file is pre-configured at `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/examforge
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> ⚠️ **Change `JWT_SECRET` before deploying to production!**

---

## Seed the Database

From the `server/` directory:

```bash
npm run seed
# or: node seed.js
```

This will:
1. Clear existing data
2. Create 1 teacher account
3. Create 5 student accounts
4. Create 1 sample exam (draft) with 3 questions
5. Create 1 sample poll with 3 options
6. Print the access codes to the console

---

## Running the Dev Servers

**Terminal 1 — Start the backend:**

```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 — Start the frontend:**

```bash
cd client
npm run dev
# Client runs at http://localhost:5173
```

Open your browser at **http://localhost:5173**

---

## Test Credentials (from seed data)

### Teacher
| Field    | Value                  |
|----------|------------------------|
| Email    | sharma@college.edu     |
| Password | teacher123             |

### Students (all use password: `student123`)
| Name          | Email                  | Roll No |
|---------------|------------------------|---------|
| Sagar Patil   | sagar@student.edu      | CS2101  |
| Priya Mehta   | priya@student.edu      | CS2102  |
| Rohan Desai   | rohan@student.edu      | CS2103  |
| Anjali Singh  | anjali@student.edu     | CS2104  |
| Kiran Rao     | kiran@student.edu      | CS2105  |

> The exam and poll access codes are printed when you run `npm run seed`.

---

## Testing a Full Flow

1. **Login as teacher** at `/teacher/login`
2. In the dashboard, find the sample exam → click Edit → change status to Live (via Publish button if still draft)
3. **Login as a student** in another browser/incognito window at `/student/login`
4. On the Join page, enter the exam access code (printed by seed.js)
5. Start the exam — fullscreen is requested, anti-cheat hooks activate
6. Submit the exam
7. Back in the teacher dashboard → ExamDetail page → see the submission with violation count

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/teacher/login` | None | Teacher login |
| POST | `/api/auth/student/login` | None | Student login |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/exams` | Teacher | Create exam |
| GET | `/api/exams` | Teacher | List my exams |
| GET | `/api/exams/:id` | Teacher | Exam detail |
| PUT | `/api/exams/:id` | Teacher | Update (draft only) |
| DELETE | `/api/exams/:id` | Teacher | Delete (draft only) |
| POST | `/api/exams/:id/publish` | Teacher | Publish exam |
| POST | `/api/exams/:id/end` | Teacher | End exam |
| GET | `/api/exams/:id/results` | Teacher | All submissions |
| POST | `/api/exams/attempt/join` | Student | Join exam |
| POST | `/api/exams/attempt/submit` | Student | Submit exam |
| POST | `/api/polls` | Teacher | Create poll |
| GET | `/api/polls` | Teacher | List polls |
| GET | `/api/polls/:id` | None | Poll with votes |
| POST | `/api/polls/:id/vote` | None | Cast a vote |
| POST | `/api/polls/:id/close` | Teacher | Close poll |
| POST | `/api/polls/:id/open` | Teacher | Reopen poll |
| DELETE | `/api/polls/:id` | Teacher | Delete poll |
| POST | `/api/proctor/event` | Student | Log event |
| GET | `/api/proctor/events/:examId/:studentId` | Teacher | View events |
| GET | `/api/students` | Teacher | List students |
| POST | `/api/students/seed` | None (dev) | Bulk insert students |

---

## Project Structure

```
examforge/
├── server/
│   ├── config/db.js         # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js          # JWT verify
│   │   └── errorHandler.js
│   ├── models/              # Mongoose models
│   ├── routes/              # Express routes
│   ├── socket/proctorSocket.js
│   ├── utils/shuffle.js     # mulberry32 PRNG + Fisher-Yates
│   ├── seed.js
│   └── server.js
└── client/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.js
        ├── hooks/
        │   ├── useProctor.js
        │   └── useExamTimer.js
        ├── pages/           # 8 pages
        ├── components/      # 7 components
        └── styles/          # CSS modules
```

---

## Anti-Cheat System

The `useProctor` hook implements:

| Check | Detection | Action |
|-------|-----------|--------|
| Fullscreen exit | `fullscreenchange` event | Re-request fullscreen, show overlay, log event |
| Tab switch | `visibilitychange` | Show red banner, log event |
| Window blur | `window blur` event | Log event |
| Right-click | `contextmenu` | Prevent + log |
| Copy/cut/paste | `copy`, `cut`, `paste` | Prevent + log copy |
| DevTools | Size heuristic (every 4s) | Log once per session |

All events are saved to MongoDB AND emitted via Socket.io to the teacher's dashboard in real time.

---

## License

MIT — For educational use.
