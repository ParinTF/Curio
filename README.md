# Curio — Resume Builder

A full-stack resume builder where users create, customize, and share professional resumes — all from a single editor with real-time preview.

> **Live Demo:** [curio-umber.vercel.app](https://curio-umber.vercel.app)

```
Browser (Next.js on Vercel)  ──REST──►  Go API (Render / Fly.io)  ──pgx──►  Supabase (Postgres)
        └──────────────────── Supabase Auth (JWT) ──────────────────────────┘
```

---

## ✨ Features

- **Section-based editor** — Experience, Education, Projects, and Skills with structured form inputs (month/year range pickers, GPA, field of study, etc.)
- **4 resume templates** — Modern, Classic, Minimal, and Sidebar (with profile photo support)
- **Live preview** — See changes reflected instantly as you type
- **Design customization** — Accent color picker (presets + custom), font family selector (Sans / Serif / Mono)
- **PDF export** — One-click download via browser print, layout matches the preview exactly
- **Public sharing** — Generate a unique `/r/<slug>` link anyone can view without signing in
- **Dashboard** — Manage multiple resumes with live thumbnail previews
- **Authentication** — Email/password sign-up and login, plus Google & GitHub OAuth login via Supabase Auth

---

## 🏗️ Architecture

```
Browser (Next.js on Vercel)
    │
    ├── Supabase Auth ──► JWT / OAuth
    │
    └── REST API (Bearer JWT) ──► Go backend (Docker)
                                      │
                                      └── pgx ──► PostgreSQL (Supabase)
```

**Key design decision:** The Go backend is the single source of truth for all data. The frontend never connects to Postgres directly — not even through Supabase client libraries. All reads and writes go through the Go REST API, keeping business logic in one place and making the database layer easy to swap.

### 🔒 Auth Flow

1. User signs in via **Supabase Auth** on the frontend (Email/Password or Google/GitHub OAuth) → receives a JWT
2. Frontend attaches `Authorization: Bearer <token>` on every API call
3. Go backend **verifies the JWT** using Supabase's JWKS endpoint
4. Go extracts `user_id` from the token and uses it for all DB queries

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) · TypeScript | App Router, React 19 |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| **Backend** | [Go](https://go.dev/) · [chi](https://github.com/go-chi/chi) router | REST API, single binary |
| **DB Driver** | [pgx](https://github.com/jackc/pgx) | Pure Go Postgres driver |
| **Database** | PostgreSQL via [Supabase](https://supabase.com/) | Managed Postgres |
| **Auth** | Supabase Auth (JWT) | Go validates tokens via JWKS |
| **Deployment** | Vercel (frontend) · Docker container on Render / Fly.io (backend) | Two separate services |

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
│   │   ├── r/               #   Public resume viewer (/r/<slug>)
│   │   └── auth/callback/   #   OAuth callback handler
│   ├── components/          # React components
│   │   ├── resume-templates.tsx  # 4 template renderers (Modern, Classic, Minimal, Sidebar)
│   │   ├── resume-paper.tsx      # A4 preview scaler
│   │   ├── editor-client.tsx     # Main editor with live preview
│   │   ├── editor-sections.tsx   # Form sections (Experience, Education, etc.)
│   │   └── ...
│   └── lib/                 # Shared utilities, types, API client
│       ├── api.ts           # Authenticated API client
│       ├── public-api.ts    # Unauthenticated API client (for /r/<slug>)
│       ├── types.ts         # TypeScript types (mirrors Go structs)
│       └── templates.ts     # Template metadata
├── backend/                 # Go REST API
│   ├── main.go              # Routes, middleware, handlers
│   ├── Dockerfile           # Multi-stage build (Alpine)
│   └── fly.toml             # Fly.io config (optional)
├── migrations/              # SQL migration files
│   └── 001_init.sql         # Users, resumes (JSONB), RLS policies
└── DEPLOY.md                # Step-by-step deployment guide
```

---

## 🎨 Templates

| Template | Description |
|---|---|
| **Modern** | Clean single-line header with accent-colored section headings |
| **Classic** | Centered header with ruled section dividers |
| **Minimal** | Whitespace-heavy design with hairline rules |
| **Sidebar** | Colored left sidebar with photo and skills, content on the right |

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

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Go** ≥ 1.21
- A **Supabase** project (free tier works)

### 1. Clone & Configure

```bash
git clone https://github.com/<your-username>/curio.git
cd curio
```

Create environment files from the provided examples:
- For backend (`backend/` directory):
  Create `backend/.env` (or copy `backend/.env.example`):
  ```env
  DATABASE_URL  = <Session pooler Database Connection String>
  SUPABASE_URL  = https://<project-ref>.supabase.co
  FRONTEND_URL  = http://localhost:3000
  ```
- For frontend (`frontend/` directory):
  Create `frontend/.env.local` (or copy `frontend/.env.example`):
  ```env
  NEXT_PUBLIC_SUPABASE_URL      = https://<project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon public key>
  NEXT_PUBLIC_API_URL           = http://localhost:8080
  ```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **Supabase SQL Editor** and run the contents of [`migrations/001_init.sql`](migrations/001_init.sql). This creates the tables and RLS policies.

### 3. Start the Backend

```bash
cd backend
go run .
```

The API will run at `http://localhost:8080`. Verify it:

```bash
curl http://localhost:8080/health
# → {"status":"OK"}
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, create a resume, and start editing!

---

## 📡 API Endpoints

All endpoints except `/health` and `/public/*` require a valid JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `GET` | `/resumes` | ✅ | List all resumes for the user |
| `GET` | `/resume/{id}` | ✅ | Get a single resume with full content |
| `POST` | `/resume` | ✅ | Create a new resume |
| `PUT` | `/resume/{id}` | ✅ | Update an existing resume |
| `DELETE` | `/resume/{id}` | ✅ | Delete a resume |
| `POST` | `/resume/{id}/share` | ✅ | Publish & get a public slug |
| `DELETE` | `/resume/{id}/share` | ✅ | Make a resume private |
| `GET` | `/public/resume/{slug}` | — | Fetch a published resume (no auth) |

---

## 🌐 Deployment

See [**DEPLOY.md**](DEPLOY.md) for a detailed step-by-step guide covering:

1. **Supabase** — database + auth setup (including Google & GitHub OAuth)
2. **Render / Fly.io** — backend deployment (Docker)
3. **Vercel** — frontend deployment
4. **CORS & Auth** — connecting everything together

---

## 🧑‍💻 Development Notes

- **Frontend ↔ Backend contract** — TypeScript types in `frontend/lib/types.ts` mirror Go structs in `backend/main.go`. Keep them in sync manually.
- **Migrations** — Numbered SQL files (`001_`, `002_`, …). Run in order via the Supabase SQL Editor.
- **Environment variables** — Never commit `.env` or `.env.local` files. Use the `.env.example` templates.

---

## 📄 License

This project is for personal portfolio and educational purposes.
