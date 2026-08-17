import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase Web config — these values are safe to expose client-side
// (equivalent to the old Supabase URL + anon key). Access control is
// enforced by Firestore Security Rules, not by keeping this config secret.
//
// Fill these in via .env.local (see .env.local.example) for local dev, and
// in your deployment platform's project settings (e.g. Vercel → Settings →
// Environment Variables) for deployed builds — every NEXT_PUBLIC_* var
// referenced here must be set there too, or the build will have no config
// at all.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Firebase config is missing or incomplete (NEXT_PUBLIC_FIREBASE_* env vars). ' +
    'Copy .env.local.example to .env.local locally, or set these in your deployment ' +
    "platform's environment variables. Firestore/Auth calls will fail until then, " +
    'but this warning (not a crash) is intentional so the build/prerender still succeeds.'
  );
}

// Guard the actual SDK calls behind isConfigured: initializeApp()/getAuth()
// validate the config eagerly and throw (e.g. `auth/invalid-api-key`) when
// values are missing — which used to crash the entire Next.js build during
// prerendering (e.g. the auto-generated /_not-found page) whenever the env
// vars weren't set yet on the deploy target. Skipping initialization in
// that case lets the build succeed; db/auth are only ever actually used
// inside try/catch'd client-side calls (see lib/store.ts, lib/authStore.ts),
// which will surface a clear error instead of a hard crash.
const app = isConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const db = (app ? getFirestore(app) : undefined) as Firestore;
export const auth = (app ? getAuth(app) : undefined) as Auth;
export const storage = (app ? getStorage(app) : undefined) as FirebaseStorage;
