/* ============================================================
   app.js – Hisab application entry point & Shop Screen
   All user-visible strings live centrally in the STRINGS object.
   ============================================================ */

'use strict';

// ---------------------------------------------------------------------------
// STRINGS – single source of truth for all UI text (Hindi + English)
// ---------------------------------------------------------------------------
const STRINGS = {
  appNameHi:   'हिसाब',
  appNameEn:   'Hisab',

  // Shop Screen Header
  shopTitleHi: 'दुकान',
  shopTitleEn: 'Shop',

  // Item Row Labels & Action
  stockLabelHi: 'स्टॉक',
  stockLabelEn: 'Stock',
  soldBtnHi:    'बेचा',
  soldBtnEn:    'Sold',

  // Units
  unitPcsHi:    'पीस',
  unitPcsEn:    'pcs',
  unitDozenHi:  'दर्जन',
  unitDozenEn:  'dozen',
  unitKgHi:     'किलो',
  unitKgEn:     'kg',
  unitGHi:      'ग्राम',
  unitGEn:      'g',
  unitLooseHi:  'खुला',
  unitLooseEn:  'loose',

  // Empty State
  emptyTitleHi: 'दुकान में कोई सामान नहीं है',
  emptyTitleEn: 'No items in the shop yet',
  emptyDescHi:  'सामान जोड़ने पर सूची यहाँ दिखेगी।',
  emptyDescEn:  'Items will appear here once added.',
  emptyBtnHi:   'डेमो सामान जोड़ें',
  emptyBtnEn:   'Add Demo Items',
};

// ---------------------------------------------------------------------------
// UNITS – allowed unit values for an item
// ---------------------------------------------------------------------------
const UNITS = ['pcs', 'dozen', 'kg', 'g', 'loose'];

// ---------------------------------------------------------------------------
// DB – IndexedDB wrapper ("hisab-db", version 1)
// ---------------------------------------------------------------------------

const DB_NAME    = 'hisab-db';
const DB_VERSION = 1;

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

      // "settings" store – arbitrary key/value pairs
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

function txn(storeNames, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t       = db.transaction(storeNames, mode);
        const request = fn(t);

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
// Item helpers & exact quantity formatting (No Rounding)
// ---------------------------------------------------------------------------

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO() {
  const d   = new Date();
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formats a stock number exactly as given, preventing IEEE-754 precision drift
 * (e.g. 8.499999999999999 -> 8.5) while strictly preserving non-rounded values
 * like 0.5, 2.25, 1.333.
 */
function formatQty(val) {
  if (val === null || val === undefined) return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toPrecision(12)));
}

/**
 * Returns bilingual display string for units.
 */
function formatUnit(unit) {
  switch (unit) {
    case 'kg':    return `${STRINGS.unitKgHi} / ${STRINGS.unitKgEn}`;
    case 'pcs':   return `${STRINGS.unitPcsHi} / ${STRINGS.unitPcsEn}`;
    case 'dozen': return `${STRINGS.unitDozenHi} / ${STRINGS.unitDozenEn}`;
    case 'g':     return `${STRINGS.unitGHi} / ${STRINGS.unitGEn}`;
    case 'loose': return `${STRINGS.unitLooseHi} / ${STRINGS.unitLooseEn}`;
    default:      return unit;
  }
}

// ---------------------------------------------------------------------------
// Public API – Items & Settings
// ---------------------------------------------------------------------------

async function addItem({ nameEn, nameHi, unit, stock = 0, reorderAt = 0 }) {
  if (!UNITS.includes(unit)) {
    throw new Error(`Invalid unit "${unit}". Allowed: ${UNITS.join(', ')}`);
  }

  const item = {
    id:        generateId(),
    nameEn:    String(nameEn),
    nameHi:    String(nameHi),
    unit:      unit,
    stock:     stock, // Stored exactly as given – no rounding
    reorderAt: reorderAt,
    salesLog:  [],
  };

  await txn('items', 'readwrite', (t) =>
    t.objectStore('items').add(item)
  );

  return item.id;
}

async function listItems() {
  return txn('items', 'readonly', (t) =>
    t.objectStore('items').getAll()
  );
}

async function getItem(id) {
  return txn('items', 'readonly', (t) =>
    t.objectStore('items').get(id)
  );
}

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

          item.stock = item.stock + delta;

          const put = store.put(item);
          put.onsuccess = () => resolve(item.stock);
          put.onerror   = (e) => reject(e.target.error);
        };

        get.onerror = (e) => reject(e.target.error);
      })
  );
}

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

async function getSetting(key) {
  const record = await txn('settings', 'readonly', (t) =>
    t.objectStore('settings').get(key)
  );
  return record ? record.value : undefined;
}

async function setSetting(key, value) {
  await txn('settings', 'readwrite', (t) =>
    t.objectStore('settings').put({ key, value })
  );
}

// ---------------------------------------------------------------------------
// Tally Marks Visual System (1 to 5 with diagonal gate-stroke)
// ---------------------------------------------------------------------------

/**
 * Tracks transient visual tally count per item row.
 * Map<itemId, { count: number, resetTimeout: any, fadeTimeout: any }>
 */
const tallyStateMap = new Map();

function getRowTallyState(itemId) {
  if (!tallyStateMap.has(itemId)) {
    tallyStateMap.set(itemId, { count: 0, resetTimeout: null, fadeTimeout: null });
  }
  return tallyStateMap.get(itemId);
}

/**
 * Renders SVG tally strokes for a count from 1 to 5.
 * Strokes 1-4 are vertical with natural hand-drawn slight offsets.
 * Stroke 5 is a diagonal gate-stroke drawn across the previous four.
 */
function renderTallySVG(container, count) {
  if (!container) return;

  // Clear any active fade-out class
  container.classList.remove('tally-fade-out');

  if (count <= 0) {
    container.innerHTML = '';
    return;
  }

  const verticalCoords = [
    { x1: 9,  y1: 7, x2: 10, y2: 31 },
    { x1: 18, y1: 6, x2: 17, y2: 32 },
    { x1: 27, y1: 7, x2: 28, y2: 31 },
    { x1: 36, y1: 6, x2: 35, y2: 32 },
  ];

  let strokesHtml = '';

  // Render vertical strokes up to 4
  const numVerticals = Math.min(count, 4);
  for (let i = 0; i < numVerticals; i++) {
    const isNew = (i === count - 1);
    const animClass = isNew ? 'tally-anim-v' : '';
    const c = verticalCoords[i];
    strokesHtml += `<line class="tally-line ${animClass}" x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}" />`;
  }

  // 5th tap: diagonal gate-stroke across the previous four
  if (count >= 5) {
    strokesHtml += `<line class="tally-line tally-anim-diag" x1="5" y1="29" x2="41" y2="9" />`;
  }

  container.innerHTML = `
    <svg class="tally-svg" viewBox="0 0 46 38" aria-hidden="true">
      ${strokesHtml}
    </svg>
  `;
}

/**
 * Handles the visual tally progression:
 * Increments count, plays stroke animation, and on 5th tap draws the
 * diagonal gate-stroke across the four, then resets the visual count.
 */
function stepTally(itemId, container) {
  const state = getRowTallyState(itemId);

  // If a reset timer was running from a previous 5th tap, cancel and restart
  if (state.resetTimeout) {
    clearTimeout(state.resetTimeout);
    state.resetTimeout = null;
  }
  if (state.fadeTimeout) {
    clearTimeout(state.fadeTimeout);
    state.fadeTimeout = null;
  }

  // Increment tally: 1, 2, 3, 4, 5
  state.count = (state.count >= 5) ? 1 : state.count + 1;

  // Render the tally with animated stroke
  renderTallySVG(container, state.count);

  // On the fifth tap, keep the complete 5-gate bundle visible,
  // then trigger smooth fade-out and reset visual count.
  if (state.count === 5) {
    state.resetTimeout = setTimeout(() => {
      if (container) {
        container.classList.add('tally-fade-out');
        state.fadeTimeout = setTimeout(() => {
          container.innerHTML = '';
          container.classList.remove('tally-fade-out');
          state.count = 0;
          state.resetTimeout = null;
          state.fadeTimeout = null;
        }, 250);
      } else {
        state.count = 0;
        state.resetTimeout = null;
        state.fadeTimeout = null;
      }
    }, 550);
  }
}

// ---------------------------------------------------------------------------
// Shop Screen Rendering & Interactions
// ---------------------------------------------------------------------------

const shopContainer = document.getElementById('shop-container');

/**
 * Main Shop view renderer.
 * Shows friendly empty state if no items exist, or the full-width item rows.
 */
async function renderShop() {
  const container = document.getElementById('shop-container');
  if (!container) return;

  const items = await listItems();

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-card">
          <div class="empty-icon">📓</div>
          <h2 class="empty-title-hi">${STRINGS.emptyTitleHi}</h2>
          <div class="empty-title-en">${STRINGS.emptyTitleEn}</div>
          <p class="empty-desc-hi">${STRINGS.emptyDescHi}</p>
          <p class="empty-desc-en">${STRINGS.emptyDescEn}</p>
          <button type="button" class="btn-seed-demo" id="btn-seed-demo">
            + ${STRINGS.emptyBtnHi} / ${STRINGS.emptyBtnEn}
          </button>
        </div>
      </div>
    `;

    const seedBtn = document.getElementById('btn-seed-demo');
    if (seedBtn) {
      seedBtn.addEventListener('click', async () => {
        seedBtn.disabled = true;
        seedBtn.textContent = 'जोड़ रहे हैं... / Adding...';
        await seedDemoItems();
      });
    }
    return;
  }

  // Render item rows
  const rowsHtml = items
    .map((item) => {
      const isLowStock = item.stock <= item.reorderAt;
      return `
        <li class="item-row" data-id="${item.id}">
          <div class="item-details">
            <div class="item-name">
              <span class="item-name-hi">${escapeHtml(item.nameHi)}</span>
              <span class="item-name-sep">/</span>
              <span class="item-name-en">${escapeHtml(item.nameEn)}</span>
            </div>
            <div class="item-stock">
              <span class="stock-label">${STRINGS.stockLabelHi} / ${STRINGS.stockLabelEn}:</span>
              <span class="stock-value ${isLowStock ? 'low-stock' : ''}" data-stock="${item.stock}">
                ${formatQty(item.stock)}
              </span>
              <span class="stock-unit">${formatUnit(item.unit)}</span>
            </div>
          </div>
          <div class="item-action-area">
            <div class="tally-container" id="tally-${item.id}" aria-label="Tally"></div>
            <button
              type="button"
              class="sold-btn"
              data-id="${item.id}"
              aria-label="${STRINGS.soldBtnHi} / ${STRINGS.soldBtnEn} – ${escapeHtml(item.nameHi)}"
            >
              <span class="sold-text-hi">${STRINGS.soldBtnHi}</span>
              <span class="sold-text-en">${STRINGS.soldBtnEn}</span>
            </button>
          </div>
        </li>
      `;
    })
    .join('');

  container.innerHTML = `<ul class="items-list">${rowsHtml}</ul>`;

  // Attach sold button event listeners
  const soldButtons = container.querySelectorAll('.sold-btn');
  soldButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      const row = btn.closest('.item-row');
      handleSoldTap(itemId, row);
    });
  });
}

/**
 * Handles a tap on the "बेचा / Sold" button:
 * 1. Draws tally stroke with CSS animation (and diagonal gate on 5th).
 * 2. Immediately updates stock display on screen (0ms latency).
 * 3. Calls recordSale(id, 1) in IndexedDB and ensures stock display matches confirmed value.
 */
function handleSoldTap(itemId, row) {
  if (!row) return;

  const tallyBox = row.querySelector('.tally-container');
  const stockEl  = row.querySelector('.stock-value');

  // Step 1: Draw tally stroke with animation
  stepTally(itemId, tallyBox);

  // Step 2: Immediate optimistic UI stock update
  if (stockEl) {
    const currentStock = parseFloat(stockEl.dataset.stock);
    const optimisticVal = isNaN(currentStock) ? 0 : currentStock - 1;
    stockEl.dataset.stock = optimisticVal;
    stockEl.textContent   = formatQty(optimisticVal);
  }

  // Step 3: Persist sale in IndexedDB (exact arithmetic)
  recordSale(itemId, 1)
    .then((confirmedStock) => {
      if (stockEl) {
        stockEl.dataset.stock = confirmedStock;
        stockEl.textContent   = formatQty(confirmedStock);
      }
    })
    .catch((err) => {
      console.error('Failed to record sale in DB:', err);
    });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Demo Seed Data Helper
// ---------------------------------------------------------------------------

async function seedDemoItems() {
  const kiranaDemoItems = [
    { nameHi: 'सरसों का तेल',    nameEn: 'Mustard Oil',     unit: 'kg',    stock: 10, reorderAt: 3 },
    { nameHi: 'चीनी',            nameEn: 'Sugar',           unit: 'kg',    stock: 25, reorderAt: 5 },
    { nameHi: 'बासमती चावल',     nameEn: 'Basmati Rice',    unit: 'kg',    stock: 20, reorderAt: 4 },
    { nameHi: 'अरहर दाल',        nameEn: 'Toor Dal',        unit: 'kg',    stock: 15, reorderAt: 3 },
    { nameHi: 'पारले-जी बिस्कुट', nameEn: 'Parle-G Biscuit', unit: 'pcs',   stock: 50, reorderAt: 10 },
  ];

  for (const item of kiranaDemoItems) {
    await addItem(item);
  }

  await renderShop();
}

/**
 * Smoke test function retained from previous milestone.
 * Adds a demo item, sells 1.5, logs the result, and refreshes the Shop screen.
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
  console.log(
    `[resetDemoCheck] Final stock for "${item.nameEn}": ${item.stock}`,
    '| salesLog:', item.salesLog
  );

  await renderShop();
}

// ---------------------------------------------------------------------------
// App bootstrap
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderShop();
});

console.log('Hisab ready');
