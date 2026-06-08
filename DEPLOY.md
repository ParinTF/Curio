# Deploying Curio

คู่มือ deploy แบบละเอียด ครอบคลุม **Supabase (DB/Auth) → Backend (Render หรือ Fly.io) → Frontend (Vercel)**

```
Vercel (Next.js)  ──REST──►  Render/Fly (Go API)  ──pgx──►  Supabase (Postgres)
        └────────────── Supabase Auth (JWT) ───────────────┘
```

> ลำดับสำคัญ: **Supabase → Backend → Frontend → ย้อนกลับมาตั้ง CORS** (เพราะ backend ต้องรู้ URL ของ frontend และ frontend ต้องรู้ URL ของ backend)

---

## สิ่งที่ต้องมี
- บัญชี: **GitHub**, **Supabase**, **Vercel**, และ **Render** *หรือ* **Fly.io** (เลือกตัวใดตัวหนึ่งสำหรับ backend)
- โค้ดอยู่ใน Git repo (โครงสร้าง `frontend/` + `backend/` + `migrations/`)

---

## ขั้นที่ 0 — Push โค้ดขึ้น GitHub
```bash
git add .
git commit -m "Prepare for deploy"
git push origin main
```
> `.env` ถูก gitignore แล้ว (secret ไม่หลุด) — ตรวจด้วย `git status` ว่าไม่มี `.env` ติดไปด้วย

---

## ขั้นที่ 1 — Supabase (Database + Auth)

1. สร้าง project ใหม่ที่ https://supabase.com (จด**Database password** ที่ตั้งไว้)
2. **รัน migration**: ไปที่ **SQL Editor** → วางเนื้อหาจาก [`migrations/001_init.sql`](migrations/001_init.sql) → **Run**
3. **Backfill ผู้ใช้เดิม** (ถ้าเคยสมัครไว้ก่อนรัน migration) — รันใน SQL Editor:
   ```sql
   insert into public.users (id, email, full_name, avatar_url)
   select id, email,
          raw_user_meta_data ->> 'full_name',
          raw_user_meta_data ->> 'avatar_url'
   from auth.users
   on conflict (id) do nothing;
   ```
4. **เก็บค่า env 3 ตัว** (เอาไปใช้ขั้นถัดไป):

   | ค่า | หาได้จาก |
   |---|---|
   | `DATABASE_URL` | Settings → Database → **Connection string** → เลือกแท็บ **Session pooler** (สำคัญ! ใช้ IPv4 ได้ รองรับ pgx) แล้วแทน `[YOUR-PASSWORD]` ด้วยรหัสจริง |
   | `SUPABASE_URL` | Settings → API → **Project URL** (เช่น `https://abcd.supabase.co`) — **ห้ามมี / ท้าย** |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → **anon public** key |

   > ⚠️ อย่าใช้ "Direct connection" (`db.xxx.supabase.co`) เพราะเป็น IPv6-only — Render ต่อไม่ได้ ให้ใช้ **Session pooler** เสมอ

---

## ขั้นที่ 2 — Deploy Backend (เลือก A หรือ B)

### ตัวเลือก A — Render (ง่ายสุด)

1. https://dashboard.render.com → **New +** → **Web Service**
2. เชื่อม GitHub repo ของคุณ
3. ตั้งค่า:
   - **Root Directory**: `backend`
   - **Runtime**: Render จะเจอ `Dockerfile` ให้อัตโนมัติ (เลือก **Docker**)
   - **Instance Type**: Free (พอสำหรับเริ่มต้น)
   - **Health Check Path**: `/health`
4. **Environment Variables** → เพิ่ม:
   ```
   DATABASE_URL   = <Session pooler URI จากขั้น 1>
   SUPABASE_URL   = https://<project-ref>.supabase.co
   FRONTEND_URL   = http://localhost:3000      ← ใส่ชั่วคราวก่อน เดี๋ยวมาแก้ขั้น 4
   ```
   > ไม่ต้องตั้ง `PORT` — Render ฉีดให้เอง และโค้ดอ่าน `$PORT` แล้ว
5. **Create Web Service** → รอ build เสร็จ → จด **URL** ที่ได้ เช่น `https://curio-backend.onrender.com`
6. ทดสอบ: เปิด `https://<backend>/health` ต้องเห็น `{"status":"OK"}`

> หมายเหตุ: Free tier ของ Render จะ "หลับ" เมื่อไม่มี traffic ~15 นาที เรียกครั้งแรกหลังหลับจะช้า ~30 วิ (ครั้งต่อไปเร็วปกติ)

### ตัวเลือก B — Fly.io (ไม่หลับ, เร็วกว่า)

1. ติดตั้ง flyctl: https://fly.io/docs/flyctl/install/ แล้ว `fly auth login`
2. เข้าโฟลเดอร์ backend แล้ว launch (มี `Dockerfile` + `fly.toml` อยู่แล้ว):
   ```bash
   cd backend
   fly launch --no-deploy
   ```
   - ถ้าถามว่าจะใช้ config ที่มีอยู่ → **Yes**
   - ตั้งชื่อ app ให้ไม่ซ้ำ (เช่น `curio-backend-yourname`) — แก้ใน `fly.toml` ได้
3. ตั้ง secrets:
   ```bash
   fly secrets set \
     DATABASE_URL="<Session pooler URI>" \
     SUPABASE_URL="https://<project-ref>.supabase.co" \
     FRONTEND_URL="http://localhost:3000"
   ```
4. Deploy:
   ```bash
   fly deploy
   ```
5. จด URL เช่น `https://curio-backend-yourname.fly.dev` → ทดสอบ `/health`

---

## ขั้นที่ 3 — Deploy Frontend (Vercel)

1. https://vercel.com → **Add New… → Project** → import repo เดียวกัน
2. ตั้งค่า:
   - **Root Directory**: `frontend` (กด Edit แล้วเลือกโฟลเดอร์ frontend)
   - **Framework Preset**: Next.js (ตรวจจับอัตโนมัติ)
3. **Environment Variables** → เพิ่ม 3 ตัว:
   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = <anon public key จากขั้น 1>
   NEXT_PUBLIC_API_URL             = https://<backend URL จากขั้น 2>   ← ไม่มี / ท้าย
   ```
4. **Deploy** → จด URL เช่น `https://curio-xxxx.vercel.app`

---

## ขั้นที่ 4 — เชื่อม CORS + Supabase Auth (สำคัญ!)

ตอนนี้รู้ URL ของ frontend แล้ว ต้องบอก backend และ Supabase

1. **อัปเดต CORS ที่ backend** — ตั้ง `FRONTEND_URL` เป็นโดเมน Vercel จริง:
   - Render: Service → Environment → แก้ `FRONTEND_URL` = `https://curio-xxxx.vercel.app` → Save (จะ redeploy เอง)
   - Fly: `fly secrets set FRONTEND_URL="https://curio-xxxx.vercel.app"` (จะ redeploy เอง)
   > ใส่หลายโดเมนได้ คั่นด้วย comma เช่น `https://curio.vercel.app,https://www.curio.com`

2. **Supabase Auth redirect** — Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://curio-xxxx.vercel.app`
   - **Redirect URLs**: เพิ่ม `https://curio-xxxx.vercel.app/**`

---

## ขั้นที่ 5 — ทดสอบ end-to-end
1. เปิด `https://curio-xxxx.vercel.app` → **Sign up** → ยืนยันอีเมล (ถ้าเปิด confirm) → Log in
2. **New resume** → กรอกข้อมูล + เลือกเดือน/ปี + อัปโหลดรูป (Sidebar) → ดู preview
3. **Save** → กลับ Dashboard เห็น thumbnail
4. **Create public link** → เปิดลิงก์ `/r/<slug>` ใน incognito (ไม่ล็อกอิน) ต้องเห็น resume
5. **Download PDF** → เลือก A4 → layout ตรงกับ preview

---

## Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| Frontend เรียก API แล้ว error ไม่มีเลขสถานะ ("Couldn't …") | CORS — `FRONTEND_URL` ที่ backend ไม่ตรงกับโดเมน Vercel (ดู ขั้น 4.1) |
| `500` ตอนสร้าง/โหลด resume | DB — ยังไม่ได้รัน migration หรือ user ยังไม่มีใน `public.users` (ดู ขั้น 1.2–1.3) |
| `401` ทุก request | JWT — `SUPABASE_URL` ผิด/มี `/` ท้าย ทำให้ดึง JWKS ไม่ได้ |
| Backend crash ตอน start, log ว่า connect database ไม่สำเร็จ | `DATABASE_URL` ใช้ Direct connection (IPv6) → เปลี่ยนเป็น **Session pooler** |
| Render: build ผ่านแต่ start fail | ตรวจว่า Health Check Path = `/health` และโค้ดอ่าน `$PORT` (แก้ให้แล้ว) |
| ล็อกอินแล้วเด้งกลับ / session หาย | Supabase Site URL / Redirect URLs ยังเป็น localhost (ดู ขั้น 4.2) |

---

## อัปเดต/redeploy ภายหลัง
แค่ push ขึ้น `main`:
```bash
git push origin main
```
- **Vercel** + **Render** = auto-deploy ทันที
- **Fly.io** = รัน `fly deploy` ใน `backend/` อีกครั้ง

---

## (ทางเลือก) ทดสอบ Docker ในเครื่องก่อน deploy
```bash
cd backend
docker build -t curio-backend .
docker run --rm -p 8080:8080 --env-file .env curio-backend
# เปิด http://localhost:8080/health
```
