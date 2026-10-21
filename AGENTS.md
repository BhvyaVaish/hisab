# Hisab – Agent & Development Guidelines

Follow these rules for every change in this project:

## 1. Project Overview & Scope
- **Project**: Hisab, an offline-first Progressive Web App (PWA) for Indian kirana shop owners to track stock and reorder.
- **Strict Scope**: Reordering is the core product. Do not implement billing, GST, invoices, payments, user login, or user accounts.

## 2. Tech Stack
- **Stack**: Vite, React (JavaScript — no TypeScript), Tailwind v4, Motion, idb, vite-plugin-pwa.
- **No other frameworks.** No Next.js, no Vue, no Angular, no jQuery.

## 3. Localization & Language
- **Bilingual**: Every user-visible string must be provided in both Hindi and English.
- **Centralized Strings**: All strings live only in `src/lib/strings.js` as the `STRINGS` export.

## 4. Storage
- **Only through `src/lib/db.js`**: All IndexedDB reads and writes go through `src/lib/db.js`.
- **Database**: `hisab-db`, version 1, stores `items` (keyPath `id`) and `settings` (keyPath `key`).
- **No rounding**: quantities like 0.5, 2.25, 1.333 must be stored exactly.

## 5. Gemma Integration & Safety
- **Isolation**: All Gemma-related calls must reside exclusively in `src/lib/gemma.js`.
- **Model ID**: The model identifier must be defined as a top-level constant `GEMMA_MODEL_ID` in `src/lib/gemma.js`.
- **Content Boundaries**: Never query Gemma for medical, dosage, or drug information.
- **Owner Confirmation**: Gemma must never write directly to persistent storage; changes must always be confirmed by the shop owner first.

## 6. Security & API Keys
- **Storage**: The Gemma API key is entered manually by the user in Settings and saved only in the `settings` IndexedDB store.
- **Zero Secrets**: Never hardcode, log, or commit any API key.

## 7. Offline-First Philosophy
- **Zero-Block Offline**: The core flows (add stock, record sale, view item list) must work with no network connection.
- **No blocking network calls** in the critical path.

## 8. UI/UX Requirements
- **Touch Targets**: At least 56px for every interactive element.
- **Body Text**: At least 18px.
- **Responsive**: Works at 360px screen width. No horizontal scroll.

## 9. Before Reporting Any Change
- Run `npm test` — must pass.
- Run `npm run build` — must pass.

## 10. Commit & Development Workflow
- **Atomic Commits**: One feature or fix per commit, under ~300 lines changed.
- **Clear Descriptions**: State which files changed and why.
