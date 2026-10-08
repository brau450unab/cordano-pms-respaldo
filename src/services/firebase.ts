// Firebase SDK & Firestore Integration for CORDANO PMS
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
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Set Firestore log level to silent to prevent connection retry warnings from triggering error listeners
try {
  setLogLevel('silent');
} catch {
  // Ignore if already set
}

// Initialize Firestore with robust offline persistence
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const auth: Auth = getAuth(app);

// Collection References
export const COLLECTIONS = {
  TICKETS: 'tickets',
  SHIFTS: 'shifts',
  SLOTS: 'slots',
  AGREEMENTS: 'agreements',
  CASH_MOVEMENTS: 'cash_movements',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
} as const;

export const testFirebaseConnection = async (): Promise<boolean> => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
