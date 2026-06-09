# Curio — Resume Builder

Build a professional resume, pick a template, customize the design, and share it with a public link — all in one place.

```
Browser (Next.js on Vercel)  ──REST──►  Go API (Render / Fly.io)  ──pgx──►  Supabase (Postgres)
        └──────────────────── Supabase Auth (JWT) ──────────────────────────┘
```

---

## ✨ Features

- **Section-based editor** — fill in experience, education, projects, and skills with a clean form UI
- **4 resume templates** — Modern, Classic, Minimal, and Sidebar (with photo support)
- **Real-time preview** — see changes instantly in the live preview pane
- **Design customization** — accent color, text color, and font family (Sans / Serif / Mono)
- **PDF export** — download your resume as a pixel-perfect A4 PDF via browser print
- **Public sharing** — generate a unique `/r/<slug>` link anyone can view without logging in
- **Responsive** — editor works on desktop; preview and PDF match exactly

---

## 🛠 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | **Next.js 16** + TypeScript | App Router, React 19 |
| Styling | **Tailwind CSS v4** | Utility-first CSS |
| Backend | **Go** + [chi](https://github.com/go-chi/chi) router | REST API, single binary |
| DB Driver | [pgx](https://github.com/jackc/pgx) | Pure Go Postgres driver |
| Database | **PostgreSQL** via Supabase | Managed Postgres + Auth |
| Auth | **Supabase Auth** (JWT) | Frontend signs in → Go verifies the token |
| Deploy | **Vercel** (frontend) + **Render/Fly.io** (backend) | Two separate services |

---

## 📁 Project Structure

```
curio/
├── frontend/               # Next.js app
│   ├── app/                # App Router pages & layouts
│   │   ├── dashboard/      # Resume list (authenticated)
│   │   ├── editor/         # Resume editor + live preview
│   │   ├── r/              # Public resume page (SSR)
│   │   ├── login/          # Auth pages
│   │   ├── signup/
│   │   ├── globals.css     # Global styles + print rules
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── editor-client.tsx       # Editor form + toolbar
│   │   ├── resume-templates.tsx    # Template renderers (Modern, Classic, Minimal, Sidebar)
│   │   ├── resume-paper.tsx        # A4 preview scaler
│   │   └── ...
│   └── lib/                # Shared utilities
│       ├── api.ts          # Authenticated API client
│       ├── public-api.ts   # Unauthenticated API client (for /r/<slug>)
│       ├── types.ts        # TypeScript types (mirrors Go structs)
│       └── templates.ts    # Template metadata
├── backend/                # Go API service
│   ├── main.go             # Routes, middleware, handlers
│   ├── Dockerfile          # Multi-stage build (Alpine)
│   └── fly.toml            # Fly.io config
├── migrations/             # SQL migration files
│   └── 001_init.sql        # Initial schema (users, resumes)
├── DEPLOY.md               # Step-by-step deployment guide
└── README.md               # ← You are here
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** ≥ 18
- **Go** ≥ 1.21
- A **Supabase** project (free tier works)

### 1. Clone & configure

```bash
git clone https://github.com/<your-username>/curio.git
cd curio
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `migrations/001_init.sql` in the **SQL Editor**
3. Note your **Project URL**, **anon key**, and **Database Connection String** (Session pooler)

### 3. Start the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials:
#   DATABASE_URL  = <Session pooler URI>
#   SUPABASE_URL  = https://<project-ref>.supabase.co
#   FRONTEND_URL  = http://localhost:3000

go run .
```

The API will be running at `http://localhost:8080`. Test it:

```bash
curl http://localhost:8080/health
# → {"status":"OK"}
```

### 4. Start the frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_SUPABASE_URL      = https://<project-ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon public key>
#   NEXT_PUBLIC_API_URL           = http://localhost:8080

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, create a resume, and start editing!

---

## 🌐 Deployment

See [**DEPLOY.md**](DEPLOY.md) for a detailed step-by-step guide covering:

1. **Supabase** — database + auth setup
2. **Render / Fly.io** — backend deployment (Docker)
3. **Vercel** — frontend deployment
4. **CORS & Auth** — connecting everything together

**TL;DR:**

```bash
# Backend → Render or Fly.io (uses the included Dockerfile)
# Frontend → Vercel (auto-detects Next.js from frontend/ root dir)
# Don't forget:
#   - Set NEXT_PUBLIC_API_URL on Vercel (no trailing /)
#   - Set FRONTEND_URL on Render/Fly (no trailing /)
#   - Redeploy frontend after adding env vars (NEXT_PUBLIC_* is baked at build time)
```

---

## 🔒 Auth Flow

1. User signs in via **Supabase Auth** on the frontend → receives a JWT
2. Frontend attaches `Authorization: Bearer <token>` on every API call
3. Go backend **verifies the JWT** using Supabase's JWKS endpoint
4. Go extracts `user_id` from the token and uses it for all DB queries

> **Important:** The frontend never connects to Postgres directly. All data flows through the Go API.

---

## 📄 API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `GET` | `/resumes` | ✅ | List all resumes for the user |
| `GET` | `/resume/:id` | ✅ | Get a single resume |
| `POST` | `/resume` | ✅ | Create a new resume |
| `PUT` | `/resume/:id` | ✅ | Update a resume |
| `DELETE` | `/resume/:id` | ✅ | Delete a resume |
| `POST` | `/resume/:id/share` | ✅ | Publish & get a public slug |
| `DELETE` | `/resume/:id/share` | ✅ | Make a resume private |
| `GET` | `/public/resume/:slug` | — | Fetch a published resume |

---

## 🎨 Templates

| Template | Description |
|---|---|
| **Modern** | Clean single-line header with accent-colored section headings |
| **Classic** | Centered header with ruled section dividers |
| **Minimal** | Whitespace-heavy design with hairline rules |
| **Sidebar** | Colored left sidebar with photo and skills, content on the right |

---

## 📝 License

This project is for educational and portfolio purposes.