import { Ticket, TariffVersion, AuditLog, Shift, ParkingSlot, Agreement, CashMovement } from '../../types';
import { doc, setDoc, Firestore } from 'firebase/firestore';

const DB_NAME = 'CordanoPMS_OfflineDB';
const DB_VERSION = 2; // Actualizado para soportar slots, agreements y cash_movements

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

        // 1. Tabla de tickets
        if (!db.objectStoreNames.contains('tickets')) {
          const ticketStore = db.createObjectStore('tickets', { keyPath: 'id' });
          ticketStore.createIndex('plateNumber', 'plateNumber', { unique: false });
          ticketStore.createIndex('status', 'status', { unique: false });
          ticketStore.createIndex('entryTime', 'entryTime', { unique: false });
        }

        // 2. Tabla de versiones de tarifa inmutables
        if (!db.objectStoreNames.contains('tariff_versions')) {
          const tariffStore = db.createObjectStore('tariff_versions', { keyPath: 'id' });
          tariffStore.createIndex('versionNumber', 'versionNumber', { unique: false });
        }

        // 3. Cola de sincronización fuera de línea (Outbox Queue)
        if (!db.objectStoreNames.contains('outbox_sync_queue')) {
          const outboxStore = db.createObjectStore('outbox_sync_queue', { keyPath: 'id' });
          outboxStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 4. Tabla de auditoría local append-only
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 5. Tabla de turnos de caja
        if (!db.objectStoreNames.contains('shifts')) {
          db.createObjectStore('shifts', { keyPath: 'id' });
        }

        // 6. Tabla de 30 slots físicos (Serrano 447)
        if (!db.objectStoreNames.contains('slots')) {
          const slotStore = db.createObjectStore('slots', { keyPath: 'code' });
          slotStore.createIndex('status', 'status', { unique: false });
        }

        // 7. Tabla de convenios y abonados
        if (!db.objectStoreNames.contains('agreements')) {
          const agreementStore = db.createObjectStore('agreements', { keyPath: 'id' });
          agreementStore.createIndex('plateNumber', 'plateNumber', { unique: false });
          agreementStore.createIndex('status', 'status', { unique: false });
        }

        // 8. Tabla de movimientos de caja (sangrías y gastos)
        if (!db.objectStoreNames.contains('cash_movements')) {
          const movementStore = db.createObjectStore('cash_movements', { keyPath: 'id' });
          movementStore.createIndex('shiftId', 'shiftId', { unique: false });
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

  // --- SLOTS (30 Plazas Serrano 447) ---
  async saveSlot(slot: ParkingSlot): Promise<void> {
    const store = await this.getStore('slots', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(slot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSlots(): Promise<ParkingSlot[]> {
    const store = await this.getStore('slots', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- AGREEMENTS (Abonados y Convenios) ---
  async saveAgreement(agreement: Agreement): Promise<void> {
    const store = await this.getStore('agreements', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(agreement);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllAgreements(): Promise<Agreement[]> {
    const store = await this.getStore('agreements', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- CASH MOVEMENTS ---
  async saveCashMovement(movement: CashMovement): Promise<void> {
    const store = await this.getStore('cash_movements', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(movement);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllCashMovements(): Promise<CashMovement[]> {
    const store = await this.getStore('cash_movements', 'readonly');
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

  // --- SHIFTS ---
  async saveShift(shift: Shift): Promise<void> {
    const store = await this.getStore('shifts', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(shift);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllShifts(): Promise<Shift[]> {
    const store = await this.getStore('shifts', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
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

  async getAllAuditLogs(): Promise<AuditLog[]> {
    const store = await this.getStore('audit_logs', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- OUTBOX QUEUE (Sincronización silenciosa PWA) ---
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

  // Procesar cola outbox y subir a Firestore cuando haya reconexión
  async replayOutboxQueue(firestoreDb: Firestore): Promise<number> {
    const pendingItems = await this.getPendingOutboxItems();
    if (!pendingItems || pendingItems.length === 0) return 0;

    let syncedCount = 0;
    for (const item of pendingItems) {
      try {
        const cleanPayload = JSON.parse(JSON.stringify(item.payload));
        await setDoc(doc(firestoreDb, item.collection, item.docId), cleanPayload, { merge: true });
        await this.removeOutboxItem(item.id);
        syncedCount++;
      } catch (err) {
        console.warn(`[Outbox Replay] Fallo al sincronizar item ${item.id} en ${item.collection}:`, err);
      }
    }

    return syncedCount;
  }
}

export const cordanoOfflineDB = new CordanoOfflineDatabase();
