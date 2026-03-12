
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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBRNFfWlvTog-muli2U5oscb2-n2nYAno",
  authDomain: "asanga-b4245.firebaseapp.com",
  projectId: "asanga-b4245",
  storageBucket: "asanga-b4245.firebasestorage.app",
  messagingSenderId: "982549907918",
  appId: "1:982549907918:web:1fcf8e180e6c105159039f",
  measurementId: "G-HFD154X0L3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
