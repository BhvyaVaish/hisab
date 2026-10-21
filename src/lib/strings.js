// src/lib/strings.js
// Single source of truth for all user-visible strings (Hindi + English).

export const STRINGS = {
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
  addFormNameHiLabelHi:     'हिंदी नाम',
  addFormNameHiLabelEn:     'Name in Hindi',
  addFormNameHiPlaceholder: 'जैसे: सरसों का तेल',
  addFormNameEnLabelHi:     'अंग्रेज़ी नाम',
  addFormNameEnLabelEn:     'Name in English',
  addFormNameEnPlaceholder: 'e.g. Mustard Oil',
  addFormUnitLabelHi:       'इकाई',
  addFormUnitLabelEn:       'Unit',
  addFormStockLabelHi:      'शुरूआती स्टॉक',
  addFormStockLabelEn:      'Starting Stock',
  addFormReorderLabelHi:    'रिऑर्डर स्तर',
  addFormReorderLabelEn:    'Reorder Level',

  // Validation errors
  errNameHiRequired: 'हिंदी नाम ज़रूरी है।',
  errNameEnRequired: 'English name is required.',
  errStockInvalid:   'Valid stock quantity required (e.g. 10 or 2.5).',
  errReorderInvalid: 'Valid reorder level required (e.g. 3).',

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

export const UNITS = ['pcs', 'dozen', 'kg', 'g', 'loose'];
