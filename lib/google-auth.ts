/**
 * Google OAuth: get authorization code via Expo AuthSession, then exchange on backend.
 * Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env (same Client ID as backend's GOOGLE_CLIENT_ID if using Web application type).
 * In Google Cloud Console, add the redirect URI from makeRedirectUri() to your OAuth client.
 */

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

const SCOPES = ["openid", "email", "profile"];

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

function getGoogleClientId(): string {
  try {
    const fromProcess = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (fromProcess && typeof fromProcess === "string") return fromProcess;
  } catch (_) {}
  try {
    const expoConstants = require("expo-constants");
    const extra = (expoConstants.default ?? expoConstants).expo?.extra ?? {};
    const id = extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (id && typeof id === "string") return id;
  } catch (_) {}
  return "";
}

export interface GoogleAuthResult {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

/**
 * Opens Google OAuth in browser; returns the authorization code and redirect URI for the backend.
 * Call auth.loginWithGoogle(result.code, result.redirectUri) with the result.
 */
export async function signInWithGoogleAsync(): Promise<GoogleAuthResult | null> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    console.warn("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not set; Google sign-in disabled.");
    return null;
  }

  const redirectUri = AuthSession.makeRedirectUri({
    path: "auth",
    scheme: "asanga",
    useProxy: __DEV__,
  });

  if (__DEV__) {
    console.log("[Google Auth] Add this exact URL to Google Console → Credentials → your OAuth client → Authorized redirect URIs:", redirectUri);
  }

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  await request.makeAuthUrlAsync(GOOGLE_DISCOVERY);
  const result = await WebBrowser.openAuthSessionAsync(
    request.url,
    redirectUri,
    { showInRecents: true }
  );

  if (result.type !== "success" || !result.url) return null;

  const url = new URL(result.url);
  const code = url.searchParams.get("code") ?? url.searchParams.get("id_token");
  if (!code) return null;

  const codeVerifier = request.codeVerifier;
  if (!codeVerifier) {
    if (__DEV__) console.warn("[Google Auth] PKCE code_verifier missing");
    return null;
  }

  return { code, redirectUri, codeVerifier };
}
