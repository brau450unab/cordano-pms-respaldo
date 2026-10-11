import { Ticket, TariffVersion, AuditLog, Shift } from '../../types';

const DB_NAME = 'CordanoPMS_OfflineDB';
const DB_VERSION = 1;

export interface OutboxItem {
  id: string;
  collection: string;
  docId: string;
  payload: any;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
  retries: number;
}

class CordanoOfflineDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este entorno'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tabla de tickets
        if (!db.objectStoreNames.contains('tickets')) {
          const ticketStore = db.createObjectStore('tickets', { keyPath: 'id' });
          ticketStore.createIndex('plateNumber', 'plateNumber', { unique: false });
          ticketStore.createIndex('status', 'status', { unique: false });
          ticketStore.createIndex('entryTime', 'entryTime', { unique: false });
        }

        // Tabla de versiones de tarifa inmutables
        if (!db.objectStoreNames.contains('tariff_versions')) {
          const tariffStore = db.createObjectStore('tariff_versions', { keyPath: 'id' });
          tariffStore.createIndex('versionNumber', 'versionNumber', { unique: false });
        }

        // Cola de sincronización fuera de línea (Outbox Queue)
        if (!db.objectStoreNames.contains('outbox_sync_queue')) {
          const outboxStore = db.createObjectStore('outbox_sync_queue', { keyPath: 'id' });
          outboxStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Tabla de auditoría local
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Tabla de turnos
        if (!db.objectStoreNames.contains('shifts')) {
          db.createObjectStore('shifts', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // --- TICKETS ---
  async saveTicket(ticket: Ticket): Promise<void> {
    const store = await this.getStore('tickets', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(ticket);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllTickets(): Promise<Ticket[]> {
    const store = await this.getStore('tickets', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- TARIFF VERSIONS ---
  async saveTariffVersion(version: TariffVersion): Promise<void> {
    const store = await this.getStore('tariff_versions', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(version);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllTariffVersions(): Promise<TariffVersion[]> {
    const store = await this.getStore('tariff_versions', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- OUTBOX QUEUE (Sincronización silenciosa) ---
  async enqueueSyncItem(collection: string, docId: string, payload: any, action: OutboxItem['action']): Promise<void> {
    const item: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      collection,
      docId,
      payload,
      action,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    const store = await this.getStore('outbox_sync_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingOutboxItems(): Promise<OutboxItem[]> {
    const store = await this.getStore('outbox_sync_queue', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async removeOutboxItem(id: string): Promise<void> {
    const store = await this.getStore('outbox_sync_queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- AUDIT LOGS ---
  async saveAuditLog(log: AuditLog): Promise<void> {
    const store = await this.getStore('audit_logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(log);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- SHIFTS ---
  async saveShift(shift: Shift): Promise<void> {
    const store = await this.getStore('shifts', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(shift);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const cordanoOfflineDB = new CordanoOfflineDatabase();
