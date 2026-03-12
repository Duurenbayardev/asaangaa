import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";
import type { User } from "../types/api";
import * as authApi from "../lib/auth-api";
import { toE164 } from "../lib/phone-utils";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  logout: () => void;
  setToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const phoneConfirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (!t) setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setTokenState(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.signUp({ email, password, name });
      setTokenState(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const e164 = toE164(phone);
      const confirmation = await auth().signInWithPhoneNumber(e164);
      phoneConfirmationRef.current = confirmation;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const verifyPhoneCode = useCallback(async (code: string) => {
    if (!token) return;
    const conf = phoneConfirmationRef.current;
    if (!conf) throw new Error("OTP not sent or expired. Send the code again.");
    setIsLoading(true);
    try {
      const userCred = await conf.confirm(code);
      const idToken = await userCred.user.getIdToken();
      const updated = await authApi.verifyPhone(token, idToken);
      setUser(updated);
      phoneConfirmationRef.current = null;
      await auth().signOut();
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const verifyEmail = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const updated = await authApi.verifyEmail(token);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
    setTokenState(null);
    setUser(null);
  }, []);

  const getAuthHeaders = useCallback(() => {
    return token ? authApi.getAuthHeaders(token) : {};
  }, [token]);

  const value: AuthContextValue = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      signUp,
      sendPhoneOtp,
      verifyPhoneCode,
      verifyEmail,
      logout,
      setToken,
      setUser,
      getAuthHeaders,
    }),
    [token, user, isLoading, login, signUp, sendPhoneOtp, verifyPhoneCode, verifyEmail, logout, setToken, getAuthHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
