// src/components/ItemRow.jsx
// One full-width row for a stock item in the Shop screen.
// Shows: nameHi, nameEn, stock with unit, tally marks, Sold button.
// Sold tap: optimistic UI update + recordSale(id, 1) + tally step.

import { useState, useCallback } from 'react';
import TallyMarks from './TallyMarks.jsx';
import { recordSale } from '../lib/db.js';
import { STRINGS } from '../lib/strings.js';

/** Format a quantity with exact precision, avoiding IEEE-754 drift. */
function formatQty(val) {
  if (val === null || val === undefined) return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toPrecision(12)));
}

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

export default function ItemRow({ item }) {
  const [stock,      setStock]      = useState(item.stock);
  const [tallyCount, setTallyCount] = useState(0);
  const [resetting,  setResetting]  = useState(false);

  const handleSold = useCallback(async () => {
    // Haptic feedback if supported
    if (navigator.vibrate) navigator.vibrate(10);

    // Step tally (1 → 5 → reset)
    let next = tallyCount >= 5 ? 1 : tallyCount + 1;
    setTallyCount(next);

    // After 5th tap: reset visual tally after a short pause
    if (next === 5) {
      setResetting(true);
      setTimeout(() => {
        setTallyCount(0);
        setResetting(false);
      }, 800);
    }

    // Optimistic stock update
    setStock((prev) => prev - 1);

    // Persist sale in IndexedDB
    try {
      const confirmed = await recordSale(item.id, 1);
      setStock(confirmed);
    } catch (err) {
      console.error('recordSale failed:', err);
      // Revert optimistic update
      setStock((prev) => prev + 1);
    }
  }, [item.id, tallyCount]);

  const isLow = stock <= item.reorderAt;

  return (
    <li
      className="item-row"
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '8px',
        padding:        '12px 0',
        minHeight:      '80px',
        borderBottom:   '1px solid #C5D8EA',
        width:          '100%',
      }}
    >
      {/* Left: item name + stock */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' }}>
          <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontWeight: 700 }}>
            {item.nameHi}
          </span>
          <span style={{ opacity: 0.35, margin: '0 4px' }}>/</span>
          <span style={{ fontWeight: 500, opacity: 0.85 }}>{item.nameEn}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', opacity: 0.65 }}>
            {STRINGS.stockLabelHi} / {STRINGS.stockLabelEn}:
          </span>
          <span
            style={{
              fontSize:  '22px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: isLow ? '#C62828' : '#1E1E2E',
            }}
          >
            {formatQty(stock)}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600, opacity: 0.8 }}>
            {formatUnit(item.unit)}
          </span>
        </div>
      </div>

      {/* Right: tally + Sold button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <TallyMarks count={resetting ? 5 : tallyCount} />
        <button
          type="button"
          onClick={handleSold}
          aria-label={`${STRINGS.soldBtnHi} / ${STRINGS.soldBtnEn} – ${item.nameHi}`}
          style={{
            minHeight:       '56px',
            minWidth:        '72px',
            padding:         '6px 12px',
            backgroundColor: '#1E1E2E',
            color:           '#FFF8E7',
            border:          '2px solid #1E1E2E',
            borderRadius:    '8px',
            cursor:          'pointer',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             '2px',
            boxShadow:       '0 2px 4px rgba(30,30,46,0.15)',
            userSelect:      'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: '19px', fontWeight: 700, lineHeight: 1 }}>
            {STRINGS.soldBtnHi}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85, lineHeight: 1 }}>
            {STRINGS.soldBtnEn}
          </span>
        </button>
      </div>
    </li>
  );
}
