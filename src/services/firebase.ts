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
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import { cordanoOfflineDB } from './db/offlineStorage';

// Configuración parametrizada para transferencia de propiedad limpia a cliente final
export const resolvedFirebaseConfig = {
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || defaultFirebaseConfig.projectId,
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || defaultFirebaseConfig.appId,
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || defaultFirebaseConfig.apiKey,
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || defaultFirebaseConfig.authDomain,
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || defaultFirebaseConfig.storageBucket,
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || defaultFirebaseConfig.messagingSenderId,
  measurementId: (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string) || defaultFirebaseConfig.measurementId || '',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();

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

// Canonical Firestore Collection References
export const COLLECTIONS = {
  TICKETS: 'tickets',
  SHIFTS: 'shifts',
  SLOTS: 'slots',
  AGREEMENTS: 'agreements',
  CASH_MOVEMENTS: 'cash_movements',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
  CUSTOMERS: 'customers',
  USERS: 'users',
} as const;

export const testFirebaseConnection = async (): Promise<boolean> => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Sincronizar cola outbox con Firestore cuando haya conexión
export const syncOfflineOutboxToFirestore = async (): Promise<number> => {
  try {
    return await cordanoOfflineDB.replayOutboxQueue(db);
  } catch (err) {
    console.warn('[Sync Outbox Error]:', err);
    return 0;
  }
};
