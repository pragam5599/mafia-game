import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { Platform } from 'react-native';
import { createAuth } from './authInit';

// Testing runs entirely on the Mac with the Firebase emulators (free, nothing online).
// Set EXPO_PUBLIC_FIREBASE_MODE=live plus the EXPO_PUBLIC_FIREBASE_* keys to use a real project later.

const live = process.env.EXPO_PUBLIC_FIREBASE_MODE === 'live';

const firebaseConfig = live
  ? {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }
  : // "demo-" projects only exist in the emulators; any API key is accepted.
    { apiKey: 'demo-key', authDomain: 'demo-mafia.firebaseapp.com', projectId: 'demo-mafia', appId: 'demo-app' };

/**
 * Where the emulators run: the Mac that serves the app. Phones reach it on the Wi-Fi address
 * Expo already uses (e.g. 192.168.1.14); the web preview uses localhost.
 */
function emulatorHost(): string {
  if (Platform.OS === 'web') return typeof window === 'undefined' ? 'localhost' : window.location.hostname;
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.linkingUri ?? '';
  const host = hostUri.replace(/^\w+:\/\//, '').split(':')[0];
  return host || 'localhost';
}

const fresh = getApps().length === 0;
const app = fresh ? initializeApp(firebaseConfig) : getApp();

// Created once (fast refresh re-runs this module, so keep the first instances).
const g = globalThis as unknown as { __mafiaFirebase?: { auth: Auth; db: Firestore; functions: Functions } };

if (!g.__mafiaFirebase) {
  const auth = createAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, 'asia-south1'); // same region as functions/src/admin.ts
  if (!live) {
    const host = emulatorHost();
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
  }
  g.__mafiaFirebase = { auth, db, functions };
}

export const { auth, db, functions } = g.__mafiaFirebase;
export const usingEmulators = !live;
/** Live game server (Vercel, free plan). Unset with the emulators. */
export const serverUrl = live ? process.env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, '') : undefined;

/**
 * The room QR / share link. Live: the hosted web game, so any phone camera opens it.
 * Emulators: this web preview's address, or the app scheme on phones (the in-app scanner reads both).
 */
export function joinLink(code: string): string {
  if (live) return `https://${firebaseConfig.projectId}.web.app/join/${code}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/join/${code}`;
  return `mafia://join/${code}`;
}
