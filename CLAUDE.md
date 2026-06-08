# Curio — Resume Builder

## What this project is

**Curio** is a web application for building professional resumes. Users fill in their information (work experience, education, skills, etc.), pick a template, tweak colors and fonts, preview the result in real time, export as PDF, and share via a public link. The app itself is a portfolio piece meant to demonstrate real-world full-stack engineering.

---

## Architecture overview

```
Browser
  └── Next.js (Vercel)          ← UI, editor, SSR for public resume pages
        └── REST API calls
              └── Go backend (Fly.io / Railway / Render)   ← single source of truth
                    └── pgx → PostgreSQL (Supabase)        ← only Go touches the DB
```

**Critical rule — Go owns the database exclusively.** The frontend never connects to Postgres directly, not even through Supabase's client libraries. All reads and writes go through the Go REST API.

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 + TypeScript | App Router, React 19 |
| Styling | Tailwind CSS v4 | |
| Backend | Go + [chi](https://github.com/go-chi/chi) router | REST API only |
| DB driver | [pgx](https://github.com/jackc/pgx) | Go → Postgres |
| Database | PostgreSQL via Supabase | Managed Postgres + Auth |
| Auth | Supabase Auth (JWT) | Go validates the JWT; frontend never calls DB |
| Deployment | Vercel (frontend) + Docker container (backend) | Two separate services |

---

## Auth flow

1. User signs in via **Supabase Auth** on the frontend → receives a JWT.
2. Frontend attaches the JWT as `Authorization: Bearer <token>` on every API request.
3. **Go backend verifies the JWT** (using Supabase's JWT secret) and extracts `user_id`.
4. Go uses `user_id` for all DB queries. The frontend never calls Supabase Postgres directly.

---

## Project structure

```
/
├── frontend/          # Next.js app (TypeScript, Tailwind)
│   └── app/           # App Router pages and layouts
├── backend/           # Go service (chi, pgx)
├── migrations/        # Plain SQL files — run manually in Supabase SQL editor
│   └── 001_init.sql   # Initial schema (users, resumes as JSONB)
└── CLAUDE.md          # ← you are here
```

### Key data model

- **`resumes`** — resume content is stored as **JSONB** in Postgres. One flexible column holds all sections (experience, education, skills, etc.) so the schema does not need to change when template sections evolve.
- **`users`** — mirrors Supabase Auth UIDs; Go links resumes to users via `user_id`.

---

## Core features (planned / in progress)

- [ ] Resume editor with section-based form (experience, education, skills, projects, summary)
- [ ] Multiple template choices (rendering in Next.js)
- [ ] Real-time preview (editor state → preview pane)
- [ ] Color and font customization per template
- [ ] PDF export (generated server-side or via browser print)
- [ ] Public shareable link (`/r/<slug>` — SSR page in Next.js)

---

## Development conventions

- **API responses** — JSON, snake_case keys.
- **Migrations** — numbered SQL files (`001_`, `002_`, …). Run in order in the Supabase SQL editor. Never auto-migrate in production from Go.
- **Environment variables** — never commit `.env` files. Use `.env.example` as the template.
- **Frontend ↔ Backend contract** — define request/response shapes explicitly (Go structs + TypeScript types). Keep them in sync manually for now.

---

## What NOT to do

- Do **not** use the Supabase JS client to query Postgres from the frontend.
- Do **not** expose DB connection strings to the frontend.
- Do **not** bypass Go to write data directly to Supabase from Next.js.
- Do **not** use Next.js API routes as a data layer — all business logic lives in Go.
