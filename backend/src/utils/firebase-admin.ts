/**
 * Firebase Admin SDK – verifies Firebase ID tokens (e.g. from phone auth).
 * Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
 * (from your Firebase service account JSON).
 */

import admin from "firebase-admin";
import { config } from "../config";

let app: admin.app.App | null = null;

function getApp(): admin.app.App {
  if (app) return app;
  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin not configured: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
  }
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return app;
}

export interface DecodedFirebaseToken {
  uid: string;
  phone_number?: string;
  firebase?: { sign_in_provider?: string };
}

/**
 * Verify a Firebase ID token (e.g. from phone sign-in) and return decoded claims.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedFirebaseToken> {
  const auth = getApp().auth();
  const decoded = await auth.verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    phone_number: decoded.phone_number,
    firebase: decoded.firebase as DecodedFirebaseToken["firebase"],
  };
}
