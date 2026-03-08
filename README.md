
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
