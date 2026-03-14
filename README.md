
```
asaangaa/
├── app/                    # Expo Router screens (tabs, stack)
│   ├── (tabs)/             # Main tabs: home, categories, basket, wishlist, profile
│   ├── admin/              # Admin: products, orders (list + detail, status update)
│   ├── orders/             # User: my orders list + order detail
│   ├── product/            # Product detail (public)
│   ├── checkout/           # Address → confirm → order success
│   ├── login.tsx
│   └── index.tsx           # Onboarding / login entry
├── backend/                # Express API
│   ├── prisma/             # Schema, migrations, seed
│   ├── src/
│   │   ├── routes/         # auth, products, addresses, basket, wishlist, orders, upload, ocr, admin
│   │   ├── middleware/     # auth, validate, errorHandler
│   │   └── lib/            # prisma, config
│   └── package.json
├── components/             # Shared UI (Header, ProductCard, LoadingScreen, etc.)
├── context/                # AuthContext, GroceryContext (products, basket, wishlist, addresses)
├── lib/                    # API clients (auth, products, basket, orders, admin, api-client)
├── constants/              # categories, units, tags
├── types/                  # api.ts (shared types)
├── render.yaml             # Render backend service (rootDir: backend)
├── app.config.js           # EXPO_PUBLIC_API_URL in extra
└── .env.example            # Frontend: EXPO_PUBLIC_API_URL
```

## Publish checklist

- **Environment**: Copy `.env.example` to `.env` and set:
  - `EXPO_PUBLIC_API_URL` – production API URL (e.g. `https://asaangaa.onrender.com`). Never point at localhost in production.
  - `EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` – optional; Logo.dev publishable key for bank logos. Omit or leave empty to hide logos.
- **Secrets**: Do not commit `.env` or any file containing API keys, JWT secrets, or third‑party secrets. Backend secrets go in `backend/.env` (see `backend/README.md`).
- **Auth**: On 401 (e.g. expired token), the app clears auth and redirects to login. Checkout and orders require login and redirect when not authenticated.
- **Build**: Use EAS Build or `expo prebuild` + native build. Set production `EXPO_PUBLIC_API_URL` in EAS secrets or `.env` for the build.
