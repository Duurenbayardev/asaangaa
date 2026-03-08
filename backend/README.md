# Asanga API (Backend)

Production-ready Node + Express + Prisma + PostgreSQL API for the Asanga app.

## Requirements

- Node 18+
- PostgreSQL (e.g. Aiven, Neon; connection string in `.env`)

## Setup

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` – Postgres connection string (required)
   - `JWT_SECRET` – At least 32 characters in production (required)
   - `PORT` – Server port (default `3000`)
   - `NODE_ENV` – `development` or `production`
   - `CORS_ORIGINS` – Optional; comma-separated allowed origins (default allows all in dev)

3. **Database**

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   For local development with migrations:

   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

4. **Run**

   - Development: `npm run dev`
   - Production: `npm run build && npm start`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/login` | No | Login (email, password) |
| POST | `/auth/signup` | No | Sign up (email, password, name?) |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/verify-email` | Bearer | Mark email verified |
| GET | `/products` | No | List products (category, search, limit, offset) |
| GET | `/products/categories` | No | List categories |
| GET | `/products/:id` | No | Product by id |
| GET | `/addresses` | Bearer | User addresses |
| POST | `/addresses` | Bearer | Create address |
| GET | `/basket` | Bearer | Get basket |
| PUT | `/basket` | Bearer | Set basket (items: [{ productId, quantity }]) |
| GET | `/wishlist` | Bearer | Get wishlist productIds |
| PUT | `/wishlist` | Bearer | Set wishlist (productIds) |
| POST | `/orders` | Bearer | Create order (addressId, itemIds?) |
| GET | `/orders` | Bearer | List user orders |
| GET | `/orders/:id` | Bearer | Single order (own only) |
| POST | `/upload` | Admin | Multipart image upload → returns `{ url }` |
| POST | `/upload/base64` | Admin | JSON `{ image: "data:image/...;base64,..." }` → returns `{ url }` (12MB limit) |
| POST | `/ocr` | Admin | Multipart image → returns `{ text }` (OCR) |
| GET | `/admin/products` | Admin | List all products |
| POST | `/admin/products` | Admin | Create product |
| PATCH | `/admin/products/:id` | Admin | Update product |
| DELETE | `/admin/products/:id` | Admin | Delete product |
| GET | `/admin/orders` | Admin | List all orders |
| GET | `/admin/orders/:id` | Admin | Single order (with user) |
| PATCH | `/admin/orders/:id` | Admin | Update order status (body: `{ status }`) |

## Security

- **Helmet** – Security headers
- **CORS** – Configure `CORS_ORIGINS` in production
- **Rate limiting** – 100 req/15 min per IP in production
- **JWT** – Access token with configurable expiry (default 7d)
- **Passwords** – bcrypt with 12 rounds
- **Validation** – express-validator on all inputs
- **Errors** – No stack traces in production responses

## Deploy on Render

- **Root Directory:** `backend` (so build/start run from the backend folder).
- **Build Command:** `npm install && npm run build && npx prisma migrate deploy`
- **Start Command:** `npm start` (runs `node dist/index.js`).

Do **not** use `node expo-router/entry` — that is the Expo frontend entry and will fail in the backend directory. A `render.yaml` in the repo root is configured for this backend service.

## Production checklist

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET` (32+ chars)
3. Set `CORS_ORIGINS` to your app/origin(s)
4. Use HTTPS in front of the API (e.g. reverse proxy)
5. Rotate database credentials if they were ever exposed
