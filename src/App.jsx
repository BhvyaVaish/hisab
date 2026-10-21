import { useState } from 'react';
import { STRINGS } from './lib/strings.js';
import ShopScreen from './screens/ShopScreen.jsx';

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: '360px',
        background: '#FFF8E7',
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 39px,
          #C5D8EA 39px,
          #C5D8EA 40px
        )`,
        backgroundSize: '100% 40px',
        backgroundAttachment: 'local',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: '44px',
          width: '2px',
          background: '#E26D6D',
          opacity: 0.85,
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: '#FFF8E7',
          borderBottom: '2px solid #C5D8EA',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div style={{ padding: '10px 12px 10px 56px' }}>
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '20px',
              fontWeight: 700,
              opacity: 0.65,
              letterSpacing: '0.02em',
              lineHeight: 1,
              display: 'block',
            }}
          >
            {STRINGS.appNameHi} / {STRINGS.appNameEn}
          </span>
          <h1
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '36px',
              fontWeight: 700,
              lineHeight: 1.1,
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
            }}
          >
            <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: '32px', fontWeight: 700 }}>
              {STRINGS.shopTitleHi}
            </span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: '36px', fontWeight: 700 }}>
              {STRINGS.shopTitleEn}
            </span>
          </h1>
        </div>
      </header>
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'calc(66px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div style={{ paddingLeft: '56px', paddingRight: '12px' }}>
          <ShopScreen />
        </div>
      </main>
    </div>
  );
}
