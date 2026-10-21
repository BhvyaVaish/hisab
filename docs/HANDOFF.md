# Hisab – Handoff Document

## 1. Status
| Step | Status | Commit | Notes |
|---|---|---|---|
| Phase 1.1 Base | Done | 786fe0f | Vite + React + Tailwind v4 base scaffold |
| Phase 1.2 Data Layer | Done | 9992469 | Port db.js and unit tests |
| Phase 1.3 Shop Screen | Done | cd7bf68 | Port Shop screen and ItemRow |
| Phase 1.4 Add Screen & Nav | Not started | - | Port AddScreen, ReorderScreen, BottomNav |
| Phase 1.5 Remove Vanilla & Parity | Not started | - | Delete old files, add PARITY.md |
| Phase 1.6 CI Deploy | Not started | - | GitHub Actions Pages workflow |
| Phase 2 UI Upgrade | Not started | - | Ledger notebook theme & components |
| Phase 3.5 PWA | Not started | - | vite-plugin-pwa offline precache |
| Phase 3.6 Reorder | Not started | - | Reorder logic & WhatsApp sharing |
| Phase 3.7 Gemma Client | Not started | - | src/lib/gemma.js wrapper |
| Phase 3.8 Settings | Not started | - | Key input, test connection, lang toggle |
| Phase 3.9 Scan Bill | Not started | - | Camera input, image resize, Gemma bill parsing |
| Phase 3.10 Find Item | Not started | - | Substring match + Gemma fuzzy search |
| Phase 3.11 i18n & Polish | Not started | - | Seed data, 56px/18px audit |
| Phase 3.12 Readme & Deploy | Not started | - | Documentation and setup instructions |
| Phase 3.13 QA Pass | Not started | - | Final verification against rules |
| Phase 4 Run Guide | Not started | - | docs/RUN_LOCALLY.md |

## 2. Times
- Started: 2026-10-21 12:18:54 IST
- Last updated: 2026-10-21 13:23:00 IST

## 3. Current Stack & Structure
- Stack: Vite, React 19, Tailwind CSS v4 (@tailwindcss/vite), Motion, Lucide React, idb, vitest, fake-indexeddb
- Structure:
  - `src/main.jsx`, `src/App.jsx`, `src/index.css`
  - `src/lib/` (db, strings, reorder, search, seed, image, gemma)
  - `src/components/` & `src/components/ui/`
  - `src/screens/`
  - `src/test/`
  - `docs/` (HANDOFF.md, PARITY.md, RUN_LOCALLY.md)

## 4. Hard Rules
- `hisab-db` v1 stores `items` (keyPath `id`) and `settings` (keyPath `key`).
- Item shape: `{ id, nameEn, nameHi, unit, stock, reorderAt, salesLog: [{date, qty}] }`.
- Allowed units: `pcs`, `dozen`, `kg`, `g`, `loose`.
- `recordSale` reduces stock, appends `{date: today ISO, qty}` to salesLog, never rounds.
- Visual tally only (resets on reload, never stored, 5th tap draws gate-stroke).
- All strings in `src/lib/strings.js`. Storage strictly in `src/lib/db.js`.
- Bottom nav: `दुकान / Shop`, `माल / Add`, `ऑर्डर / Reorder`.
- Touch >= 56px, text >= 18px, responsive >= 360px.
- Zero network in core flows. No billing/GST/login.

## 5. Commands
- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test`
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy: automatic on push to `main` via `.github/workflows/deploy.yml`

## 6. Next Step
Port Add screen, Reorder screen, and bottom navigation (`AddScreen.jsx`, `ReorderScreen.jsx`, `BottomNav.jsx`).

## 7. Known Issues and Blockers
- None.

## 8. Decisions Made
- Used Vite + React + Tailwind v4 with `@tailwindcss/vite` for fast build and small bundle.
- Tagged main as `v0-vanilla` and pushed tag prior to migration.
