import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Web config — these values are safe to expose client-side
// (equivalent to the old Supabase URL + anon key). Access control is
// enforced by Firestore Security Rules, not by keeping this config secret.
//
// Fill these in via .env.local (see .env.local.example), or hardcode them
// here the same way lib/supabase.ts used to hardcode the Supabase values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  // eslint-disable-next-line no-console
  console.warn(
    'Firebase config is missing (NEXT_PUBLIC_FIREBASE_* env vars). ' +
    'Copy .env.local.example to .env.local and fill in your Firebase project values.'
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
