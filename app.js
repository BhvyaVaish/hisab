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
// App bootstrap
// ---------------------------------------------------------------------------
console.log('Hisab ready');
