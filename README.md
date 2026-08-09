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
| GET    | `/api/products`       | –     | List products (`?category=` `&search=`)  |
| GET    | `/api/products/:id`   | –     | Product detail (variants, images)        |
| POST   | `/api/products`       | JWT   | Create product                           |
| PATCH  | `/api/products/:id`   | JWT   | Update product                           |
| DELETE | `/api/products/:id`   | JWT   | Delete product                           |
| POST   | `/api/categories`     | JWT   | Create category                          |
| GET    | `/api/cart`           | –     | Get cart (send `x-client-id` header)     |
| POST   | `/api/cart/items`     | –     | Add item to cart                         |
| POST   | `/api/orders`         | –     | Place a COD order                        |
| GET    | `/api/orders`         | JWT   | List orders (admin)                      |
| PATCH  | `/api/orders/:id/status` | JWT | Update order status (COD tracking)       |
| POST   | `/api/uploads`        | JWT   | Upload product image (multipart `file`)  |

Send the JWT as `Authorization: Bearer <token>`.

## Notes

- The cart is session-based: the client generates a UUID, sends it as the `x-client-id`
  header, and the backend keeps it in memory (swap for Redis for multi-instance).
- Uploaded images are stored in `backend/uploads/` and served at `/uploads/*`.
- `backend/.env` and `frontend/.env.local` hold local config — adjust before deploying.
