# Footwear Ecommerce

Full-stack ecommerce storefront with a NestJS API, a Next.js (App Router) client, and PostgreSQL.

```
footwear-ecommerce/
├── backend/            # NestJS API (auth, products, cart, orders, uploads, prisma)
├── frontend/           # Next.js App Router storefront
└── docker-compose.yml  # PostgreSQL for local development
```

## Stack

- **Backend:** NestJS 11, Prisma 6, PostgreSQL, JWT (admin auth), Multer (image uploads)
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, TypeScript
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

## Production deployment

1. **Environment variables** — copy the templates and fill in real values:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   Required changes before going live:

   - `JWT_SECRET` — a strong random value (≥ 32 chars). Generate with `openssl rand -base64 48`.
   - `DATABASE_URL` — point at your production PostgreSQL (use SSL: `?sslmode=require`).
   - `CORS_ORIGINS` — the public storefront origin(s), e.g. `https://store.example.com`.
   - `NODE_ENV=production` and `TRUST_PROXY_HOPS=1` when behind a reverse proxy.
   - `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_ORIGIN` — the public API URL. **Note:**
     they are baked into the client bundle at build time — rebuild the frontend after
     changing them.

2. **Database** — apply migrations and seed once:

   ```bash
   cd backend
   npm run db:generate
   npm run db:deploy        # prisma migrate deploy (safe for production)
   npm run db:seed          # admin user + categories + sample products
   ```

   **Change the seeded admin password immediately** (`admin@footwear.com` / `admin123`)
   — it is documented in this README and publicly known.

3. **Build & run:**

   ```bash
   cd backend && npm run build && NODE_ENV=production node dist/main
   cd frontend && npm run build && npm start   # next start
   ```

4. **Put both behind a reverse proxy (nginx / Caddy) with TLS.** The API must only
   be reachable through the proxy: rate limiting keys on the real client IP via
   `X-Forwarded-For`, and the proxy should overwrite that header so it can't be spoofed.
   Add the public API host to `frontend/next.config.ts` → `images.remotePatterns` so
   `next/image` can optimize uploaded product images.

5. **Before launch checklist:** change the admin password; verify `JWT_SECRET` is
   random; confirm `CORS_ORIGINS` matches the real domain; restrict `POST /api/auth/register`
   to trusted admins (the endpoint creates admin accounts); back up the DB and `uploads/`.

## Notes

- The cart is session-based: the client generates a UUID, sends it as the `x-client-id`
  header, and the backend keeps it in memory (swap for Redis for multi-instance).
  The store is bounded (max 10k carts, 50 lines/cart, 99 qty/line) to resist abuse.
- Uploaded images are stored in `backend/uploads/` and served at `/uploads/*`.
  Only PNG/JPG/GIF/WebP/AVIF are accepted and verified by magic bytes; SVG is rejected
  (embedded-script risk).
- `backend/.env` and `frontend/.env.local` hold local config — never commit them.
  Templates live in `backend/.env.example` and `frontend/.env.example`.
