// src/lib/db.js
// IndexedDB wrapper using the idb library.
// Database: "hisab-db", version 1.
// Stores:
//   - "items"    keyPath: "id"
//   - "settings" keyPath: "key"
// Item shape: { id, nameEn, nameHi, unit, stock, reorderAt, salesLog: [{date, qty}] }

import { openDB } from 'idb';

const DB_NAME    = 'hisab-db';
const DB_VERSION = 1;

let _dbPromise = null;

function getDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return _dbPromise;
}

/** Generate a collision-resistant id without crypto or uuid. */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Return today's date as YYYY-MM-DD in LOCAL time (IST-safe). */
function todayISO() {
  const d   = new Date();
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const ALLOWED_UNITS = ['pcs', 'dozen', 'kg', 'g', 'loose'];

/**
 * Add a new item.
 * @param {{ nameEn, nameHi, unit, stock?, reorderAt? }} fields
 * @returns {Promise<string>} the generated id
 */
export async function addItem({ nameEn, nameHi, unit, stock = 0, reorderAt = 0 }) {
  if (!ALLOWED_UNITS.includes(unit)) {
    throw new Error(`Invalid unit "${unit}". Allowed: ${ALLOWED_UNITS.join(', ')}`);
  }

  const item = {
    id:        generateId(),
    nameEn:    String(nameEn),
    nameHi:    String(nameHi),
    unit,
    stock,     // stored exactly as given – no rounding
    reorderAt,
    salesLog:  [],
  };

  const db = await getDB();
  await db.add('items', item);
  return item.id;
}

/**
 * Return all items as an array.
 * @returns {Promise<object[]>}
 */
export async function listItems() {
  const db = await getDB();
  return db.getAll('items');
}

/**
 * Return a single item by id, or undefined if not found.
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
export async function getItem(id) {
  const db = await getDB();
  return db.get('items', id);
}

/**
 * Adjust an item's stock by delta. No rounding.
 * @param {string} id
 * @param {number} delta  positive = restock, negative = manual reduction
 * @returns {Promise<number>} new stock value
 */
export async function updateStock(id, delta) {
  const db = await getDB();
  const tx   = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');

  const item = await store.get(id);
  if (!item) throw new Error(`Item not found: ${id}`);

  item.stock = item.stock + delta; // exact – no rounding
  await store.put(item);
  await tx.done;
  return item.stock;
}

/**
 * Record a sale: reduce stock by qty and append to salesLog.
 * Quantities like 0.5, 2.25, 1.333 are stored exactly as given.
 * @param {string} id
 * @param {number} qty  must be > 0
 * @returns {Promise<number>} new stock value
 */
export async function recordSale(id, qty) {
  if (typeof qty !== 'number' || qty <= 0) {
    throw new Error(`qty must be a positive number, got: ${qty}`);
  }

  const db    = await getDB();
  const tx    = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');

  const item = await store.get(id);
  if (!item) throw new Error(`Item not found: ${id}`);

  item.stock = item.stock - qty;            // exact arithmetic, no rounding
  item.salesLog.push({ date: todayISO(), qty });

  await store.put(item);
  await tx.done;
  return item.stock;
}

/**
 * Read a setting by key. Returns undefined if not set.
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function getSetting(key) {
  const db     = await getDB();
  const record = await db.get('settings', key);
  return record ? record.value : undefined;
}

/**
 * Write (upsert) a setting.
 * @param {string} key
 * @param {any}    value
 */
export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}
