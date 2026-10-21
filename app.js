/* ============================================================
   app.js – Hisab application entry point
   All user-visible strings live centrally in the STRINGS object.
   ============================================================ */

'use strict';

// ---------------------------------------------------------------------------
// STRINGS – single source of truth for all UI text (Hindi + English)
// ---------------------------------------------------------------------------
const STRINGS = {
  appNameHi: 'हिसाब',
  appNameEn: 'Hisab',

  // Tab / Screen titles
  shopTitleHi:    'दुकान',
  shopTitleEn:    'Shop',
  addTitleHi:     'माल',
  addTitleEn:     'Add',
  reorderTitleHi: 'ऑर्डर',
  reorderTitleEn: 'Reorder',

  // Item Row Labels & Action
  stockLabelHi: 'स्टॉक',
  stockLabelEn: 'Stock',
  soldBtnHi:    'बेचा',
  soldBtnEn:    'Sold',

  // Units (dropdown options)
  unitPcsHi:    'पीस',    unitPcsEn:    'pcs',
  unitDozenHi:  'दर्जन',  unitDozenEn:  'dozen',
  unitKgHi:     'किलो',   unitKgEn:     'kg',
  unitGHi:      'ग्राम',  unitGEn:      'g',
  unitLooseHi:  'खुला',   unitLooseEn:  'loose',

  // Empty State
  emptyTitleHi: 'दुकान में कोई सामान नहीं है',
  emptyTitleEn: 'No items in the shop yet',
  emptyDescHi:  'सामान जोड़ने पर सूची यहाँ दिखेगी।',
  emptyDescEn:  'Items will appear here once added.',
  emptyBtnHi:   'डेमो सामान जोड़ें',
  emptyBtnEn:   'Add Demo Items',

  // Add Screen – form labels
  addFormNameHiLabelHi:    'हिंदी नाम',
  addFormNameHiLabelEn:    'Name in Hindi',
  addFormNameHiPlaceholder:'जैसे: सरसों का तेल',
  addFormNameEnLabelHi:    'अंग्रेज़ी नाम',
  addFormNameEnLabelEn:    'Name in English',
  addFormNameEnPlaceholder:'e.g. Mustard Oil',
  addFormUnitLabelHi:      'इकाई',
  addFormUnitLabelEn:      'Unit',
  addFormStockLabelHi:     'शुरूआती स्टॉक',
  addFormStockLabelEn:     'Starting Stock',
  addFormReorderLabelHi:   'रिऑर्डर स्तर',
  addFormReorderLabelEn:   'Reorder Level',

  // Validation errors
  errNameHiRequired:  'हिंदी नाम ज़रूरी है।',
  errNameEnRequired:  'English name is required.',
  errStockInvalid:    'Valid stock quantity required (e.g. 10 or 2.5).',
  errReorderInvalid:  'Valid reorder level required (e.g. 3).',

  // Save button
  saveBtnHi: 'सेव करें',
  saveBtnEn: 'Save',

  // Toast messages
  toastSavedHi: 'सेव हो गया ✓',
  toastSavedEn: 'Saved',
  toastSaving:  'सेव हो रहा है…',

  // Reorder screen
  comingSoonHi: 'जल्द आएगा',
  comingSoonEn: 'Coming soon',
};

// ---------------------------------------------------------------------------
// UNITS – allowed values
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

      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess  = (e) => resolve(e.target.result);
    request.onerror    = (e) => reject(e.target.error);
    request.onblocked  = ()  => reject(new Error('IndexedDB open blocked'));
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
// Helpers
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

/** Formats a quantity with exact precision, avoiding IEEE-754 drift. */
function formatQty(val) {
  if (val === null || val === undefined) return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toPrecision(12)));
}

/** Bilingual unit display string. */
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ---------------------------------------------------------------------------
// Public API – Items
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
    stock:     stock,     // Stored exactly as given – no rounding
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
          item.stock = item.stock - qty;               // exact arithmetic
          item.salesLog.push({ date: todayISO(), qty });
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
// Tab / Screen Router
// ---------------------------------------------------------------------------

/** Map each tab key to its header title strings. */
const TAB_TITLES = {
  shop:    { hi: STRINGS.shopTitleHi,    en: STRINGS.shopTitleEn    },
  add:     { hi: STRINGS.addTitleHi,     en: STRINGS.addTitleEn     },
  reorder: { hi: STRINGS.reorderTitleHi, en: STRINGS.reorderTitleEn },
};

let _currentTab = 'shop';

/**
 * Switch to a tab by key ('shop' | 'add' | 'reorder').
 * Updates header, activates correct screen div and nav button.
 * Also shows/hides the Save bar when switching to/from the Add tab.
 */
function switchTab(tab) {
  if (!TAB_TITLES[tab]) return;
  _currentTab = tab;

  // Update screen-heading in header
  const titleHiEl = document.getElementById('screen-title-hi');
  const titleEnEl = document.getElementById('screen-title-en');
  if (titleHiEl) titleHiEl.textContent = TAB_TITLES[tab].hi;
  if (titleEnEl) titleEnEl.textContent = TAB_TITLES[tab].en;

  // Show/hide screen divs
  document.querySelectorAll('.screen').forEach((div) => {
    div.classList.toggle(
      'screen--active',
      div.id === `screen-${tab}`
    );
  });

  // Update nav button active states
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('nav-btn--active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  // Save bar: only visible on Add tab
  const saveBar = document.getElementById('save-bar');
  if (saveBar) {
    saveBar.classList.toggle('save-bar--visible', tab === 'add');
  }
}

// ---------------------------------------------------------------------------
// Tally Marks Visual System
// ---------------------------------------------------------------------------

/** Transient visual tally count per item row. Map<itemId, state> */
const tallyStateMap = new Map();

function getTallyState(itemId) {
  if (!tallyStateMap.has(itemId)) {
    tallyStateMap.set(itemId, {
      count:         0,
      resetTimeout:  null,
      fadeTimeout:   null,
    });
  }
  return tallyStateMap.get(itemId);
}

/**
 * Renders SVG tally strokes for count 1-5.
 * Strokes 1-4 are vertical. Stroke 5 is a diagonal gate.
 */
function renderTallySVG(container, count) {
  if (!container) return;
  container.classList.remove('tally-fade-out');

  if (count <= 0) { container.innerHTML = ''; return; }

  const coords = [
    { x1: 9,  y1: 7, x2: 10, y2: 31 },
    { x1: 18, y1: 6, x2: 17, y2: 32 },
    { x1: 27, y1: 7, x2: 28, y2: 31 },
    { x1: 36, y1: 6, x2: 35, y2: 32 },
  ];

  let html = '';
  const numV = Math.min(count, 4);
  for (let i = 0; i < numV; i++) {
    const isNew = (i === count - 1);
    const cls   = isNew ? 'tally-anim-v' : '';
    const c     = coords[i];
    html += `<line class="tally-line ${cls}" x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}" />`;
  }

  if (count >= 5) {
    html += `<line class="tally-line tally-anim-diag" x1="5" y1="29" x2="41" y2="9" />`;
  }

  container.innerHTML = `
    <svg class="tally-svg" viewBox="0 0 46 38" aria-hidden="true">${html}</svg>
  `;
}

function stepTally(itemId, container) {
  const state = getTallyState(itemId);

  if (state.resetTimeout) { clearTimeout(state.resetTimeout); state.resetTimeout = null; }
  if (state.fadeTimeout)  { clearTimeout(state.fadeTimeout);  state.fadeTimeout  = null; }

  state.count = (state.count >= 5) ? 1 : state.count + 1;
  renderTallySVG(container, state.count);

  if (state.count === 5) {
    state.resetTimeout = setTimeout(() => {
      if (container) {
        container.classList.add('tally-fade-out');
        state.fadeTimeout = setTimeout(() => {
          container.innerHTML = '';
          container.classList.remove('tally-fade-out');
          state.count = 0;
          state.resetTimeout = null;
          state.fadeTimeout  = null;
        }, 250);
      } else {
        state.count = 0;
        state.resetTimeout = null;
      }
    }, 550);
  }
}

// ---------------------------------------------------------------------------
// Toast Notification
// ---------------------------------------------------------------------------

let _toastTimeout = null;

function showToast(messageHi, messageEn) {
  // Remove any existing toast
  const old = document.getElementById('hisab-toast');
  if (old) old.remove();
  if (_toastTimeout) { clearTimeout(_toastTimeout); _toastTimeout = null; }

  const toast = document.createElement('div');
  toast.id        = 'hisab-toast';
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = `${messageHi} / ${messageEn}`;
  document.body.appendChild(toast);

  _toastTimeout = setTimeout(() => {
    toast.classList.add('toast--hide');
    setTimeout(() => toast.remove(), 350);
    _toastTimeout = null;
  }, 2000);
}

// ---------------------------------------------------------------------------
// Shop Screen Renderer
// ---------------------------------------------------------------------------

async function renderShop() {
  const container = document.getElementById('screen-shop');
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
        seedBtn.disabled    = true;
        seedBtn.textContent = 'जोड़ रहे हैं… / Adding…';
        await seedDemoItems();
      });
    }
    return;
  }

  const rowsHtml = items
    .map((item) => {
      const low = item.stock <= item.reorderAt;
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
              <span class="stock-value ${low ? 'low-stock' : ''}"
                    data-stock="${item.stock}">
                ${formatQty(item.stock)}
              </span>
              <span class="stock-unit">${formatUnit(item.unit)}</span>
            </div>
          </div>
          <div class="item-action-area">
            <div class="tally-container" id="tally-${item.id}" aria-label="Tally count"></div>
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

  container.querySelectorAll('.sold-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleSoldTap(btn.dataset.id, btn.closest('.item-row'));
    });
  });
}

/**
 * Handles a "बेचा / Sold" tap:
 * – Draws tally stroke with animation.
 * – Optimistic immediate stock decrement on screen.
 * – Persists via recordSale and confirms DB value.
 */
function handleSoldTap(itemId, row) {
  if (!row) return;

  const tallyBox = row.querySelector('.tally-container');
  const stockEl  = row.querySelector('.stock-value');

  stepTally(itemId, tallyBox);

  if (stockEl) {
    const cur = parseFloat(stockEl.dataset.stock);
    const opt = isNaN(cur) ? 0 : cur - 1;
    stockEl.dataset.stock = opt;
    stockEl.textContent   = formatQty(opt);
  }

  recordSale(itemId, 1)
    .then((confirmed) => {
      if (stockEl) {
        stockEl.dataset.stock = confirmed;
        stockEl.textContent   = formatQty(confirmed);
      }
    })
    .catch((err) => {
      console.error('Failed to record sale:', err);
    });
}

// ---------------------------------------------------------------------------
// Add Screen Renderer
// ---------------------------------------------------------------------------

function renderAdd() {
  const container = document.getElementById('screen-add');
  if (!container) return;

  container.innerHTML = `
    <div class="add-screen-inner">

      <div class="field-group">
        <label class="field-label" for="inp-name-hi">
          <span class="field-label-hi">${STRINGS.addFormNameHiLabelHi}</span>
          <span class="field-label-sep">/</span>
          <span class="field-label-en">${STRINGS.addFormNameHiLabelEn}</span>
        </label>
        <input
          id="inp-name-hi"
          type="text"
          class="field-input"
          autocomplete="off"
          inputmode="text"
          placeholder="${STRINGS.addFormNameHiPlaceholder}"
        />
        <div class="field-error" id="err-name-hi">${STRINGS.errNameHiRequired}</div>
      </div>

      <div class="field-group">
        <label class="field-label" for="inp-name-en">
          <span class="field-label-hi">${STRINGS.addFormNameEnLabelHi}</span>
          <span class="field-label-sep">/</span>
          <span class="field-label-en">${STRINGS.addFormNameEnLabelEn}</span>
        </label>
        <input
          id="inp-name-en"
          type="text"
          class="field-input"
          autocomplete="off"
          inputmode="text"
          placeholder="${STRINGS.addFormNameEnPlaceholder}"
        />
        <div class="field-error" id="err-name-en">${STRINGS.errNameEnRequired}</div>
      </div>

      <div class="field-group">
        <label class="field-label" for="inp-unit">
          <span class="field-label-hi">${STRINGS.addFormUnitLabelHi}</span>
          <span class="field-label-sep">/</span>
          <span class="field-label-en">${STRINGS.addFormUnitLabelEn}</span>
        </label>
        <div class="select-wrapper">
          <select id="inp-unit" class="field-select">
            <option value="pcs"  >${STRINGS.unitPcsHi}   / ${STRINGS.unitPcsEn}   (pcs)</option>
            <option value="dozen">${STRINGS.unitDozenHi} / ${STRINGS.unitDozenEn} (dozen)</option>
            <option value="kg" selected>${STRINGS.unitKgHi}   / ${STRINGS.unitKgEn}   (kg)</option>
            <option value="g"   >${STRINGS.unitGHi}    / ${STRINGS.unitGEn}    (g)</option>
            <option value="loose">${STRINGS.unitLooseHi} / ${STRINGS.unitLooseEn} (loose)</option>
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label class="field-label" for="inp-stock">
            <span class="field-label-hi">${STRINGS.addFormStockLabelHi}</span>
            <span class="field-label-sep">/</span>
            <span class="field-label-en">${STRINGS.addFormStockLabelEn}</span>
          </label>
          <input
            id="inp-stock"
            type="number"
            class="field-input"
            min="0"
            step="any"
            inputmode="decimal"
            placeholder="0"
          />
          <div class="field-error" id="err-stock">${STRINGS.errStockInvalid}</div>
        </div>

        <div class="field-group">
          <label class="field-label" for="inp-reorder">
            <span class="field-label-hi">${STRINGS.addFormReorderLabelHi}</span>
            <span class="field-label-sep">/</span>
            <span class="field-label-en">${STRINGS.addFormReorderLabelEn}</span>
          </label>
          <input
            id="inp-reorder"
            type="number"
            class="field-input"
            min="0"
            step="any"
            inputmode="decimal"
            placeholder="0"
          />
          <div class="field-error" id="err-reorder">${STRINGS.errReorderInvalid}</div>
        </div>
      </div>

    </div>
  `;
}

/**
 * Validates the Add form.
 * Returns { valid: boolean, nameHi, nameEn, unit, stock, reorderAt }.
 */
function validateAddForm() {
  let valid = true;

  const nameHi   = document.getElementById('inp-name-hi').value.trim();
  const nameEn   = document.getElementById('inp-name-en').value.trim();
  const unit     = document.getElementById('inp-unit').value;
  const stockRaw = document.getElementById('inp-stock').value.trim();
  const reorderRaw = document.getElementById('inp-reorder').value.trim();

  // Helper to show/hide inline errors
  function setFieldError(inputId, errorId, hasError) {
    const inp = document.getElementById(inputId);
    const err = document.getElementById(errorId);
    if (!inp || !err) return;
    inp.classList.toggle('has-error', hasError);
    err.classList.toggle('visible', hasError);
    if (hasError) valid = false;
  }

  setFieldError('inp-name-hi', 'err-name-hi', nameHi === '');
  setFieldError('inp-name-en', 'err-name-en', nameEn === '');

  const stock = stockRaw === '' ? 0 : parseFloat(stockRaw);
  const stockBad = isNaN(stock) || stock < 0;
  setFieldError('inp-stock', 'err-stock', stockBad);

  const reorderAt = reorderRaw === '' ? 0 : parseFloat(reorderRaw);
  const reorderBad = isNaN(reorderAt) || reorderAt < 0;
  setFieldError('inp-reorder', 'err-reorder', reorderBad);

  return { valid, nameHi, nameEn, unit, stock: stockBad ? 0 : stock, reorderAt: reorderBad ? 0 : reorderAt };
}

/**
 * Handles the Save button tap on the Add screen:
 * Validates, calls addItem, shows toast, resets form, and switches to Shop.
 */
async function handleSaveItem(btn) {
  const { valid, nameHi, nameEn, unit, stock, reorderAt } = validateAddForm();
  if (!valid) return;

  btn.disabled    = true;
  btn.querySelector('.btn-save-hi').textContent = STRINGS.toastSaving;

  try {
    await addItem({ nameHi, nameEn, unit, stock, reorderAt });

    // Reset form fields
    document.getElementById('inp-name-hi').value = '';
    document.getElementById('inp-name-en').value = '';
    document.getElementById('inp-stock').value   = '';
    document.getElementById('inp-reorder').value = '';
    document.getElementById('inp-unit').value    = 'kg';

    // Show bilingual confirmation toast
    showToast(STRINGS.toastSavedHi, STRINGS.toastSavedEn);

    // Refresh Shop data and switch to Shop tab
    await renderShop();
    switchTab('shop');

  } catch (err) {
    console.error('Failed to save item:', err);
  } finally {
    btn.disabled = false;
    const hi = btn.querySelector('.btn-save-hi');
    if (hi) hi.textContent = STRINGS.saveBtnHi;
  }
}

// ---------------------------------------------------------------------------
// Reorder Screen Renderer (Coming Soon)
// ---------------------------------------------------------------------------

function renderReorder() {
  const container = document.getElementById('screen-reorder');
  if (!container) return;

  container.innerHTML = `
    <div class="coming-soon">
      <div class="coming-soon-icon">🔁</div>
      <div class="coming-soon-hi">${STRINGS.comingSoonHi}</div>
      <div class="coming-soon-en">${STRINGS.comingSoonEn}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Demo Seed Data Helper
// ---------------------------------------------------------------------------

async function seedDemoItems() {
  const demo = [
    { nameHi: 'सरसों का तेल',     nameEn: 'Mustard Oil',      unit: 'kg',    stock: 10, reorderAt: 3  },
    { nameHi: 'चीनी',             nameEn: 'Sugar',            unit: 'kg',    stock: 25, reorderAt: 5  },
    { nameHi: 'बासमती चावल',      nameEn: 'Basmati Rice',     unit: 'kg',    stock: 20, reorderAt: 4  },
    { nameHi: 'अरहर दाल',         nameEn: 'Toor Dal',         unit: 'kg',    stock: 15, reorderAt: 3  },
    { nameHi: 'पारले-जी बिस्कुट', nameEn: 'Parle-G Biscuit',  unit: 'pcs',   stock: 50, reorderAt: 10 },
  ];

  for (const item of demo) {
    await addItem(item);
  }

  await renderShop();
}

// ---------------------------------------------------------------------------
// Smoke test (retained from data layer milestone)
// ---------------------------------------------------------------------------

async function resetDemoCheck() {
  const id = await addItem({
    nameEn: 'Mustard Oil', nameHi: 'सरसों का तेल',
    unit: 'kg', stock: 10, reorderAt: 3,
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
// App Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Render all screen content upfront
  renderShop();
  renderAdd();
  renderReorder();

  // Wire bottom navigation buttons
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Build the Save bar (injected into body, above bottom nav)
  const saveBar = document.createElement('div');
  saveBar.id        = 'save-bar';
  saveBar.className = 'save-bar'; // hidden by default; shown when tab=add
  saveBar.innerHTML = `
    <button type="button" class="btn-save" id="btn-save">
      <span class="btn-save-hi">${STRINGS.saveBtnHi}</span>
      <span class="btn-save-en">/ ${STRINGS.saveBtnEn}</span>
    </button>
  `;
  document.body.appendChild(saveBar);

  document.getElementById('btn-save').addEventListener('click', function () {
    handleSaveItem(this);
  });

  // Start on the Shop tab
  switchTab('shop');
});

console.log('Hisab ready');
