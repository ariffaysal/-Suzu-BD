# Footwear Ecommerce

Full-stack ecommerce storefront with a NestJS API, a Next.js (App Router) client, and PostgreSQL.

```
footwear-ecommerce/
├── backend/            # NestJS API (auth, products, cart, orders, uploads, prisma)
├── frontend/           # Next.js App Router storefront
└── docker-compose.yml  # PostgreSQL for local development
```

## Stack

- **Backend:** NestJS 11, Prisma 6, PostgreSQL, JWT (admin auth), Multer + Vercel Blob (image uploads)
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Payments:** Cash on Delivery (COD) only

## Quick start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

The app database is exposed on host port **5433** (mapped to the container's 5432) so it
can coexist with a local PostgreSQL already running on 5432. `backend/.env` points at 5433.

### 2. Backend (port 4000)

```bash
cd backend
npm install
npm run db:generate        # generate Prisma Client
npm run db:migrate         # create/apply migrations (first run: npm run db:migrate -- --name init)
npm run db:seed            # admin user + categories + sample products
npm run start:dev
```

API base URL: `http://localhost:4000/api`

Admin login (seeded):

```
email:    admin@footwear.com
password: admin123
```

### 3. Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Storefront: `http://localhost:3000`

## API overview

| Method | Route                 | Auth  | Description                              |
| ------ | --------------------- | ----- | ---------------------------------------- |
| POST   | `/api/auth/register`  | –     | Create an admin account                  |
| POST   | `/api/auth/login`     | –     | Login, returns JWT                       |
| GET    | `/api/auth/me`        | JWT   | Current admin                            |
| GET    | `/api/categories`     | –     | List categories                          |
| GET    | `/api/products`       | –     | List products, paginated (`?category=` `&search=` `&collection=` `&page=` `&limit=`); returns `{ items, total, page, limit, totalPages }` |
| GET    | `/api/products/:id`   | –     | Product detail (variants, images)        |
| POST   | `/api/products`       | JWT   | Create product                           |
| PATCH  | `/api/products/:id`   | JWT   | Update product                           |
| DELETE | `/api/products/:id`   | JWT   | Delete product                           |
| POST   | `/api/categories`     | JWT   | Create category                          |
| GET    | `/api/cart`           | –     | Get cart (send `x-client-id` header)     |
| POST   | `/api/cart/items`     | –     | Add item to cart                         |
| POST   | `/api/orders`         | –     | Place a COD order                        |
| GET    | `/api/orders`         | JWT   | List orders (admin), paginated (`?page=` `&limit=`); returns `{ items, total, page, limit, totalPages }` |
| GET    | `/api/orders/stats`   | JWT   | Order counts + revenue for 1d/7d/30d/all (admin dashboard) |
| PATCH  | `/api/orders/:id/status` | JWT | Update order status (COD tracking)       |
| POST   | `/api/uploads`        | JWT   | Upload product image (multipart `file`)  |

Send the JWT as `Authorization: Bearer <token>`.

## Production deployment (Vercel)

The backend (NestJS) and frontend (Next.js) deploy as **two separate Vercel projects**
under your team (e.g. `ariffaysals-projects`). The API runs as a single Fluid-compute
function (Vercel's zero-config NestJS support — entrypoint `src/main.ts`), and the
storefront runs as a normal Next.js app. Data lives in a **private managed Postgres**
(Neon, via the Vercel Postgres integration) and images in **Vercel Blob**.

> What changed to make this deployable:
> - **Cart is now DB-backed** (Postgres) instead of in-memory — carts survive
>   serverless restarts and scale-out.
> - **Uploads support Vercel Blob** — when `BLOB_READ_WRITE_TOKEN` is set, uploaded
>   images go to Blob (the function filesystem is ephemeral); without it, the old
>   `./uploads` behavior is kept for local dev.
> - **Prisma** is configured for the Vercel runtime (`binaryTargets` includes
>   `rhel-openssl-3.0.x`) and reads `DIRECT_URL` for migrations when `DATABASE_URL`
>   is a pooled Neon URL.

### 1. Prerequisites

```bash
vercel login            # once, opens a browser
```

### 2. Create the private database (Neon / Vercel Postgres)

In the Vercel dashboard: **Storage → Create → Postgres** (powered by Neon).
This is a private managed database: it is not exposed publicly, only the connection
string (credentials + host) grants access, and the connection requires SSL.
Copy two URLs from the created store:

- `DATABASE_URL` — the **pooled** URL (has `?sslmode=require&pgbouncer=true`)
- `DIRECT_URL` — the **direct** URL (has `?sslmode=require`), used for migrations

Optionally enable an **IP allowlist** on the store for extra protection.

Also create a **Blob store** (Storage → Create → Blob) and copy `BLOB_READ_WRITE_TOKEN`.

### 3. Backend project

```bash
cd backend
vercel link --yes                       # create/link the Vercel project
vercel env add DATABASE_URL             # pooled URL  (Production, Preview)
vercel env add DIRECT_URL               # direct URL  (Production, Preview)
vercel env add JWT_SECRET               # openssl rand -base64 48
vercel env add JWT_EXPIRES_IN           # e.g. 7d
vercel env add CORS_ORIGINS             # e.g. https://suzu-bd.vercel.app
vercel env add TRUST_PROXY_HOPS         # 1
vercel env add BLOB_READ_WRITE_TOKEN    # from the Blob store
```

Apply migrations and seed **once**, from your machine against the new DB
(Prisma CLI uses `DIRECT_URL` for DDL):

```bash
# point Prisma at the new DB for this one command (does not touch .env):
export DATABASE_URL='<pooled url>'
export DIRECT_URL='<direct url>'
npm run db:deploy      # prisma migrate deploy
npm run db:seed        # admin + categories + products + hero slides
unset DATABASE_URL DIRECT_URL
```

Deploy:

```bash
vercel --prod
```

Sanity check: `curl https://<backend-project>.vercel.app/api/health` →
`{"status":"ok","database":"up"}`.

### 4. Frontend project

`NEXT_PUBLIC_*` values are baked into the bundle **at build time** — set them before
the first deploy and redeploy after changing them.

```bash
cd frontend
vercel link --yes
vercel env add NEXT_PUBLIC_API_URL      # https://<backend-project>.vercel.app/api
vercel env add NEXT_PUBLIC_API_ORIGIN   # https://<backend-project>.vercel.app
vercel --prod
```

### 5. Before launch checklist

- **Change the seeded admin password** (`admin@footwear.com` / `admin123` is publicly
  documented). Log in at `/admin/login`, or `PATCH` via the API after login.
- Verify `JWT_SECRET` is a fresh random value (≥ 32 chars).
- Confirm `CORS_ORIGINS` on the backend matches the real storefront domain exactly.
- Consider restricting `POST /api/auth/register` (it creates admin accounts).

## Local development

Same as before: `docker compose up -d`, then `cd backend && npm i && npm run db:migrate
&& npm run db:seed && npm run start:dev`, then `cd frontend && npm i && npm run dev`.

## Notes

- The cart is session-based: the client generates a UUID, sends it as the `x-client-id`
  header, and the backend stores the cart in Postgres. Bounded per cart (50 lines,
  99 qty/line); idle carts are swept after 90 days.
- Uploaded images go to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise to
  `backend/uploads/` served at `/uploads/*`. Only PNG/JPG/GIF/WebP/AVIF are accepted
  and verified by magic bytes; SVG is rejected (embedded-script risk).
- `backend/.env` and `frontend/.env.local` hold local config — never commit them.
  Templates live in `backend/.env.example` and `frontend/.env.example`.
