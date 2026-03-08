# Backend preparation – schemas and tools

This doc describes the **schemas** the app expects and **recommended tools** to connect a backend.

---

## 1. Schemas we use

All types are defined in **`types/api.ts`**. Your backend should align with these.

| Entity | Purpose |
|--------|--------|
| **User** | `id`, `email`, `name`, `emailVerified`, `createdAt` |
| **Auth** | `LoginBody`, `SignUpBody`, `AuthTokens` (access/refresh + user) |
| **Product** | `id`, `name`, `category` (CategoryId), `price`, `unit`, `images[]` |
| **Category** | Same IDs as `constants/categories.ts` (e.g. `nariin-nogoo`, `jims-jimsgene`) |
| **SavedAddress** | `id`, `line1`, `line2?`, `city`, `postalCode?`, `fullName?`, `instructions?` |
| **Basket** | List of `{ product, quantity }`; can be session or user-scoped |
| **Wishlist** | List of `productIds` per user |
| **Order** | `id`, `userId`, `status`, `lines[]`, `address` snapshot, `subtotal`, `tax`, `delivery`, `grandTotal`, `createdAt` |
| **OrderLine** | `productId`, `productName`, `quantity`, `unitPrice`, `total` |
| **OrderStatus** | `pending` \| `confirmed` \| `processing` \| `shipped` \| `delivered` \| `cancelled` |

### Category IDs (must match app)

- `nariin-nogoo` – Нарийн Ногоо  
- `jims-jimsgene` – Жимс Жимсгэнэ  
- `hataasan-jims` – Хатаасан Жимс  
- `amtlagch` – Амтлагч  
- `jimsni-sav-baglaa-boodol` – Жимсний сав баглаа боодол  

---

## 2. Suggested API surface

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Body: `LoginBody` → `AuthTokens` |
| POST | `/auth/signup` | Body: `SignUpBody` → `AuthTokens` |
| GET | `/auth/me` | Returns `User` (with Bearer token) |
| GET | `/products` | Query: `category`, `search`, `limit`, `offset` → `Product[]` |
| GET | `/products/:id` | Returns `Product` |
| GET | `/categories` | Returns `Category[]` (or use app constants only) |
| GET | `/addresses` | User addresses → `SavedAddress[]` |
| POST | `/addresses` | Body: `CreateAddressBody` → `SavedAddress` |
| GET | `/basket` | Current basket → `Basket` |
| PUT | `/basket` | Body: `BasketItemPayload[]` or merge payload → `Basket` |
| GET | `/wishlist` | → `Wishlist` |
| PUT | `/wishlist` | Body: `{ productIds: string[] }` → `Wishlist` |
| POST | `/orders` | Body: `CreateOrderBody` → `Order` |
| GET | `/orders` | User orders → `Order[]` |

---

## 3. Tools to use

### Backend stack (pick one)

- **Option A – Supabase**  
  - Postgres DB, Auth (email/password), REST + Realtime.  
  - Good fit: quick setup, hosted, and you can map tables to `types/api.ts` and use Supabase client in the app.

- **Option B – Node + Prisma + Postgres**  
  - Express or Fastify, Prisma for schema and migrations.  
  - Define Prisma models that match `types/api.ts`, expose REST (or tRPC) and plug the same types into the app.

- **Option C – Firebase**  
  - Firestore + Firebase Auth.  
  - Use the same DTOs in the app; document shapes in Firestore to match `Product`, `Order`, etc.

### On the app (Expo)

- **HTTP client**  
  - Use the existing **`lib/api-client.ts`** (fetch-based).  
  - Set **`EXPO_PUBLIC_API_URL`** in `.env` or `app.config.js` to your backend URL.

- **Auth**  
  - Store `accessToken` (e.g. SecureStore) and pass it via `getAuthHeaders(token)` in `api-client.ts` for authenticated requests.

- **Validation (optional)**  
  - Add **Zod** and derive schemas from `types/api.ts` (or mirror them in Zod) to validate API responses and avoid bad state.

---

## 4. Env and config

Create `.env` (and add to `.gitignore` if needed):

```env
EXPO_PUBLIC_API_URL=https://your-api.example.com
```

So the app uses your real backend; for local dev use `http://localhost:3000` (or your dev server port).

---

## 5. Next steps

1. Implement backend endpoints that return/accept the shapes in `types/api.ts`.  
2. Point the app at the API with `EXPO_PUBLIC_API_URL`.  
3. Replace in-memory data in `GroceryContext` with calls using `apiRequest()` and optional auth headers.  
4. Wire login/signup to your auth API and persist the token for `getAuthHeaders()`.
