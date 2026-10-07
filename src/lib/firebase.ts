// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  setLogLevel,
  Firestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

try {
  setLogLevel('silent');
} catch {}

let firestoreInstance: Firestore;
if (typeof window !== 'undefined') {
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    firestoreInstance = getFirestore(app);
  }
} else {
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const auth: Auth = getAuth(app);

export const COLLECTIONS = {
  TICKETS: 'tickets',
  SHIFTS: 'shifts',
  SLOTS: 'slots',
  AGREEMENTS: 'agreements',
  CASH_MOVEMENTS: 'cash_movements',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
} as const;
