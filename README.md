# Curio

A full-stack resume builder where users create, customize, and share professional resumes — all from a single editor with real-time preview.

> **Live demo:** [curio.vercel.app](https://curio.vercel.app) *(update with your actual URL)*

---

## ✨ Features

- **Section-based editor** — Experience, Education, Projects, and Skills with structured form inputs (month/year range pickers, GPA, field of study, etc.)
- **4 resume templates** — Modern, Classic, Minimal, and Sidebar (with profile photo support)
- **Live preview** — See changes reflected instantly as you type
- **Design customization** — Accent color picker (presets + custom), font family selector (Sans / Serif / Mono)
- **PDF export** — One-click download via browser print, layout matches the preview exactly
- **Public sharing** — Generate a unique `/r/<slug>` link anyone can view without signing in
- **Dashboard** — Manage multiple resumes with live thumbnail previews
- **Authentication** — Email/password sign-up and login via Supabase Auth

---

## 🏗️ Architecture

```
Browser (Next.js on Vercel)
    │
    ├── Supabase Auth ──► JWT
    │
    └── REST API (Bearer JWT) ──► Go backend (Docker)
                                      │
                                      └── pgx ──► PostgreSQL (Supabase)
```

**Key design decision:** The Go backend is the single source of truth for all data. The frontend never connects to Postgres directly — not even through Supabase client libraries. All reads and writes go through the Go REST API, keeping business logic in one place and making the database layer easy to swap.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [Next.js 16](https://nextjs.org/) · TypeScript · React 19 · App Router |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Backend | [Go](https://go.dev/) · [chi](https://github.com/go-chi/chi) router · REST API |
| Database | PostgreSQL via [Supabase](https://supabase.com/) · [pgx](https://github.com/jackc/pgx) driver |
| Auth | Supabase Auth (JWT) · Go validates tokens via JWKS |
| Deployment | Vercel (frontend) · Docker container on Render / Fly.io (backend) |

---

## 📂 Project Structure

```
curio/
├── frontend/                # Next.js application
│   ├── app/                 # App Router — pages & layouts
│   │   ├── page.tsx         #   Landing page
│   │   ├── login/           #   Login page
│   │   ├── signup/          #   Sign-up page
│   │   ├── dashboard/       #   Resume list (authenticated)
│   │   ├── editor/          #   Resume editor (authenticated)
│   │   └── r/               #   Public resume viewer (/r/<slug>)
│   ├── components/          # React components
│   │   ├── resume-templates.tsx  # 4 template renderers
│   │   ├── editor-client.tsx     # Main editor with live preview
│   │   ├── editor-sections.tsx   # Form sections (Experience, Education, etc.)
│   │   └── ...
│   └── lib/                 # Shared utilities, types, API client
│
├── backend/                 # Go REST API
│   ├── main.go              # Routes, middleware, handlers
│   ├── Dockerfile           # Multi-stage build (Alpine)
│   └── fly.toml             # Fly.io config (optional)
│
└── migrations/              # SQL migration files
    └── 001_init.sql         # Users, resumes (JSONB), RLS policies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Go** ≥ 1.22
- A **Supabase** project (free tier works)

### 1. Clone and configure

```bash
git clone https://github.com/<your-username>/curio.git
cd curio
```

Create environment files from the provided examples:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example  backend/.env
```

Fill in your Supabase credentials in both `.env` files — see the comments inside each file for guidance.

### 2. Set up the database

Open the **Supabase SQL Editor** and run the contents of [`migrations/001_init.sql`](migrations/001_init.sql). This creates the `users` and `resumes` tables, triggers, indexes, and RLS policies.

### 3. Start the backend

```bash
cd backend
go run .
```

The API starts on `http://localhost:8080`. Verify with:

```bash
curl http://localhost:8080/health
# → {"status":"OK"}
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` — you should see the landing page.

---

## 📡 API Endpoints

All endpoints except `/health` and `/public/*` require a valid JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/resumes` | List all resumes for the authenticated user |
| `GET` | `/resume/{id}` | Get a single resume with full content |
| `POST` | `/resume` | Create a new resume |
| `PUT` | `/resume/{id}` | Update an existing resume |
| `DELETE` | `/resume/{id}` | Delete a resume |
| `POST` | `/resume/{id}/share` | Publish a resume and get a public slug |
| `DELETE` | `/resume/{id}/share` | Make a resume private again |
| `GET` | `/public/resume/{slug}` | Fetch a published resume (no auth) |

---

## 🗄️ Data Model

Resume content is stored as a single **JSONB** column in Postgres, keeping the schema flexible as sections evolve:

```jsonc
{
  "personInfo": { "name": "", "contact": "", "photo": "" },
  "education":  [{ "school_name": "", "field_of_study": "", "date": "", "gpa": "" }],
  "experience": [{ "position": "", "company": "", "date": "", "detail": "" }],
  "project":    [{ "project_name": "", "date": "", "detail": "" }],
  "skill":      [{ "skill_name": "" }],
  "style":      { "accent_color": "#2563eb", "font_family": "sans" }
}
```

---

## 🧑‍💻 Development Notes

- **Frontend ↔ Backend contract** — TypeScript types in `frontend/lib/types.ts` mirror Go structs in `backend/main.go`. Keep them in sync manually.
- **Migrations** — Numbered SQL files (`001_`, `002_`, …). Run in order via the Supabase SQL Editor.
- **Environment variables** — Never commit `.env` files. Use the `.env.example` templates.
- **Auth flow** — User signs in via Supabase Auth → gets a JWT → frontend sends it on every API call → Go backend verifies the JWT via Supabase JWKS and extracts `user_id`.

---

## 📄 License

This project is for personal portfolio and educational purposes.