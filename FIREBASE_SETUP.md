# Firebase setup (phone verification)

Phone OTP is handled by **Firebase Authentication** (no Twilio). You need a Firebase project and a few files/keys.

---

## 1. Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create or open a project.
2. Enable **Phone** sign-in: **Authentication → Sign-in method → Phone → Enable → Save**.

---

## 2. Backend (Node)

The backend verifies the Firebase ID token and reads the phone number from it.

1. **Service account key**
   - In Firebase: **Project settings (gear) → Service accounts → Generate new private key**.
   - From the downloaded JSON use:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` line breaks as in the JSON, or use real newlines in the env file)

2. **Add to `backend/.env`** (never commit this file):

   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. Install backend dependency (if not already):  
   `cd backend && npm install firebase-admin`

---

## 3. App (Expo / React Native Firebase)

The app uses **React Native Firebase** for phone auth. You need **development builds** (Expo Go does not support it).

1. **Android**
   - Firebase Console: **Project settings → Your apps → Add app → Android**.
   - Package name: `com.asaangaa.app` (must match `app.json`).
   - Download **google-services.json** and put it in the **project root** (next to `app.json`).

2. **iOS**
   - Firebase Console: **Add app → iOS**.
   - Bundle ID: `com.asaangaa.app`.
   - Download **GoogleService-Info.plist** and put it in the **project root**.

3. **Install and run**
   - From project root: `npm install`
   - Build and run with a **development build** (e.g. `npx expo run:android` or `eas build --profile development`). Phone auth will not work in Expo Go.

---

## Summary – what you need to provide

| Where        | What to provide |
|-------------|------------------|
| **Backend** | `backend/.env`: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (from service account JSON). |
| **App**     | In **project root**: `google-services.json` (Android), `GoogleService-Info.plist` (iOS). |

After that, restart the backend and use a dev build of the app to test phone verification in the profile screen.
