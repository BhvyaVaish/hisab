// src/screens/ShopScreen.jsx
// "दुकान / Shop" screen: lists all items from IndexedDB.
// Each row shows name (Hindi + English), stock, tally, and Sold button.
// Shows a friendly bilingual empty state when no items exist.

import { useState, useEffect } from 'react';
import { listItems, addItem } from '../lib/db.js';
import { STRINGS } from '../lib/strings.js';
import ItemRow from '../components/ItemRow.jsx';

const DEMO_ITEMS = [
  { nameHi: 'सरसों का तेल',     nameEn: 'Mustard Oil',     unit: 'kg',  stock: 10, reorderAt: 3  },
  { nameHi: 'चीनी',             nameEn: 'Sugar',            unit: 'kg',  stock: 25, reorderAt: 5  },
  { nameHi: 'बासमती चावल',      nameEn: 'Basmati Rice',     unit: 'kg',  stock: 20, reorderAt: 4  },
  { nameHi: 'अरहर दाल',         nameEn: 'Toor Dal',         unit: 'kg',  stock: 15, reorderAt: 3  },
  { nameHi: 'पारले-जी बिस्कुट', nameEn: 'Parle-G Biscuit',  unit: 'pcs', stock: 50, reorderAt: 10 },
];

export default function ShopScreen() {
  const [items,   setItems]   = useState(null); // null = loading
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    listItems().then(setItems).catch(console.error);
  }, []);

  async function handleSeedDemo() {
    setSeeding(true);
    try {
      for (const item of DEMO_ITEMS) await addItem(item);
      const refreshed = await listItems();
      setItems(refreshed);
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setSeeding(false);
    }
  }

  // Loading state – avoid layout shift
  if (items === null) {
    return (
      <div style={{ padding: '24px 16px', opacity: 0.5, textAlign: 'center', fontSize: '18px' }}>
        लोड हो रहा है… / Loading…
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        style={{
          padding:       '40px 16px',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          textAlign:     'center',
        }}
      >
        <div
          style={{
            background:   'rgba(255,253,245,0.85)',
            border:       '2px dashed #C5D8EA',
            borderRadius: '12px',
            padding:      '28px 20px',
            maxWidth:     '380px',
            width:        '100%',
          }}
        >
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>📓</div>
          <h2 style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            {STRINGS.emptyTitleHi}
          </h2>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: '22px', fontWeight: 700, opacity: 0.8, marginBottom: '12px' }}>
            {STRINGS.emptyTitleEn}
          </div>
          <p style={{ fontSize: '18px', marginBottom: '2px' }}>{STRINGS.emptyDescHi}</p>
          <p style={{ fontSize: '16px', opacity: 0.7, marginBottom: '20px' }}>{STRINGS.emptyDescEn}</p>
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seeding}
            style={{
              minHeight:       '56px',
              padding:         '12px 20px',
              fontSize:        '17px',
              fontWeight:      600,
              fontFamily:      'inherit',
              backgroundColor: '#1E1E2E',
              color:           '#FFF8E7',
              border:          'none',
              borderRadius:    '8px',
              cursor:          seeding ? 'not-allowed' : 'pointer',
              opacity:         seeding ? 0.6 : 1,
              width:           '100%',
            }}
          >
            {seeding
              ? 'जोड़ रहे हैं… / Adding…'
              : `+ ${STRINGS.emptyBtnHi} / ${STRINGS.emptyBtnEn}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%' }}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
