/* ============================================================
   app.js – Hisab application entry point
   All user-visible strings live in the STRINGS object below.
   ============================================================ */

'use strict';

// ---------------------------------------------------------------------------
// STRINGS – single source of truth for all UI text (Hindi + English)
// ---------------------------------------------------------------------------
const STRINGS = {
  appNameHi:   'हिसाब',
  appNameEn:   'Hisab',

  // Placeholder / greeting
  stockPlaceholderHi: 'आपका स्टॉक यहाँ दिखेगा।',
  stockPlaceholderEn: 'Your stock will appear here.',

  // Bottom nav labels
  navStockHi:    'स्टॉक',
  navStockEn:    'Stock',
  navReorderHi:  'रिऑर्डर',
  navReorderEn:  'Reorder',
  navSettingsHi: 'सेटिंग',
  navSettingsEn: 'Settings',
};

// ---------------------------------------------------------------------------
// UNITS – allowed unit values for an item
// ---------------------------------------------------------------------------
const UNITS = ['pcs', 'dozen', 'kg', 'g', 'loose'];

// ---------------------------------------------------------------------------
// DB – IndexedDB wrapper
// ---------------------------------------------------------------------------

const DB_NAME    = 'hisab-db';
const DB_VERSION = 1;

/**
 * Opens (or creates) the IndexedDB database.
 * Returns a Promise that resolves to the IDBDatabase instance.
 * Cached after first open so every call reuses the same connection.
 */
let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // "items" store – one record per stock-keeping unit
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }

      // "settings" store – arbitrary key/value pairs (e.g. API key, language)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess  = (event) => resolve(event.target.result);
    request.onerror    = (event) => reject(event.target.error);
    request.onblocked  = ()      => reject(new Error('IndexedDB open blocked'));
  });

  return _dbPromise;
}

/**
 * Thin helper: run a callback inside a transaction and return a Promise
 * that resolves with the request result.
 *
 * @param {string|string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {function(IDBTransaction): IDBRequest} fn
 */
function txn(storeNames, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t       = db.transaction(storeNames, mode);
        const request = fn(t);

        // fn may return a request or nothing (for multi-step writes)
        if (request) {
          request.onsuccess = (e) => resolve(e.target.result);
          request.onerror   = (e) => reject(e.target.error);
        } else {
          t.oncomplete = () => resolve(undefined);
          t.onerror    = (e) => reject(e.target.error);
        }
      })
  );
}

// ---------------------------------------------------------------------------
// Item helpers
// ---------------------------------------------------------------------------

/**
 * Generate a simple unique id: timestamp + random suffix.
 * Avoids any dependency on crypto or uuid libraries.
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Return today's date as an ISO 8601 date string (YYYY-MM-DD) in local time.
 * Using local time so a sale at 11 pm IST is recorded as today, not tomorrow UTC.
 */
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Public API – Items
// ---------------------------------------------------------------------------

/**
 * Add a new item to the "items" store.
 *
 * @param {{ nameEn: string, nameHi: string, unit: string,
 *           stock: number, reorderAt: number }} fields
 * @returns {Promise<string>} the generated id
 */
async function addItem({ nameEn, nameHi, unit, stock = 0, reorderAt = 0 }) {
  if (!UNITS.includes(unit)) {
    throw new Error(`Invalid unit "${unit}". Allowed: ${UNITS.join(', ')}`);
  }

  const item = {
    id:        generateId(),
    nameEn:    String(nameEn),
    nameHi:    String(nameHi),
    unit:      unit,
    stock:     stock,      // stored exactly as given – no rounding
    reorderAt: reorderAt,
    salesLog:  [],
  };

  await txn('items', 'readwrite', (t) =>
    t.objectStore('items').add(item)
  );

  return item.id;
}

/**
 * Return all items as an array.
 * @returns {Promise<object[]>}
 */
async function listItems() {
  return txn('items', 'readonly', (t) =>
    t.objectStore('items').getAll()
  );
}

/**
 * Return a single item by id, or undefined if not found.
 * @param {string} id
 * @returns {Promise<object|undefined>}
 */
async function getItem(id) {
  return txn('items', 'readonly', (t) =>
    t.objectStore('items').get(id)
  );
}

/**
 * Adjust an item's stock by delta (positive = restock, negative = manual reduction).
 * Quantity is stored exactly as given – no rounding.
 *
 * @param {string} id
 * @param {number} delta  e.g. 2.25 or -1.333
 * @returns {Promise<number>} new stock value
 */
async function updateStock(id, delta) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t     = db.transaction('items', 'readwrite');
        const store = t.objectStore('items');
        const get   = store.get(id);

        get.onsuccess = () => {
          const item = get.result;
          if (!item) return reject(new Error(`Item not found: ${id}`));

          // Preserve exact precision – avoid floating-point drift
          item.stock = item.stock + delta;

          const put = store.put(item);
          put.onsuccess = () => resolve(item.stock);
          put.onerror   = (e) => reject(e.target.error);
        };

        get.onerror = (e) => reject(e.target.error);
      })
  );
}

/**
 * Record a sale: reduce stock by qty and append to salesLog.
 * Quantities like 0.5, 2.25, 1.333 are stored exactly as given.
 *
 * @param {string} id
 * @param {number} qty  must be > 0
 * @returns {Promise<number>} new stock value after the sale
 */
async function recordSale(id, qty) {
  if (typeof qty !== 'number' || qty <= 0) {
    throw new Error(`qty must be a positive number, got: ${qty}`);
  }

  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t     = db.transaction('items', 'readwrite');
        const store = t.objectStore('items');
        const get   = store.get(id);

        get.onsuccess = () => {
          const item = get.result;
          if (!item) return reject(new Error(`Item not found: ${id}`));

          // Reduce stock (exact arithmetic – no rounding)
          item.stock = item.stock - qty;

          // Append sale entry with today's local date
          item.salesLog.push({ date: todayISO(), qty: qty });

          const put = store.put(item);
          put.onsuccess = () => resolve(item.stock);
          put.onerror   = (e) => reject(e.target.error);
        };

        get.onerror = (e) => reject(e.target.error);
      })
  );
}

// ---------------------------------------------------------------------------
// Public API – Settings
// ---------------------------------------------------------------------------

/**
 * Read a setting by key. Returns undefined if not set.
 * @param {string} key
 * @returns {Promise<any>}
 */
async function getSetting(key) {
  const record = await txn('settings', 'readonly', (t) =>
    t.objectStore('settings').get(key)
  );
  return record ? record.value : undefined;
}

/**
 * Write (upsert) a setting.
 * @param {string} key
 * @param {any}    value
 */
async function setSetting(key, value) {
  await txn('settings', 'readwrite', (t) =>
    t.objectStore('settings').put({ key, value })
  );
}

// ---------------------------------------------------------------------------
// Demo / smoke test
// ---------------------------------------------------------------------------

/**
 * Adds one demo item, records a sale of 1.5 units, then logs the final stock.
 * Useful for verifying the DB layer without any UI.
 */
async function resetDemoCheck() {
  const id = await addItem({
    nameEn:    'Mustard Oil',
    nameHi:    'सरसों का तेल',
    unit:      'kg',
    stock:     10,
    reorderAt: 3,
  });

  await recordSale(id, 1.5);

  const item = await getItem(id);
  // Expected: 8.5  (10 - 1.5, stored exactly – not rounded)
  console.log(
    `[resetDemoCheck] Final stock for "${item.nameEn}": ${item.stock}`,
    '| salesLog:', item.salesLog
  );
}

// ---------------------------------------------------------------------------
// App bootstrap
// ---------------------------------------------------------------------------
console.log('Hisab ready');
