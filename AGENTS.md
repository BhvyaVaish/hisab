# Hisab – Agent & Development Guidelines

Follow these rules for every change in this project:

## 1. Project Overview & Scope
- **Project**: Hisab, an offline-first Progressive Web App (PWA) tailored for Indian kirana shop owners to track stock and reorder.
- **Strict Scope**: Reordering is the core product. Do not implement billing, GST, invoices, payments, user login, or user accounts.

## 2. Tech Stack
- **Pure Vanilla**: Plain HTML, CSS, and JavaScript only.
- **No Dependencies**: No frameworks, no build tools, no compilers, and no npm.

## 3. Localization & Language
- **Bilingual**: Every user-visible string must be provided in both Hindi and English.
- **Centralized Strings**: Maintain all strings centrally in a single `STRINGS` object inside `app.js`.

## 4. UI/UX & Design Guidelines
- **Notebook Aesthetic**: Notebook-page style featuring a cream background (`#FFF8E7`), faint blue ruled lines, and dark text (`#1E1E2E`).
- **Touch & Accessibility**:
  - Touch targets must be at least `56px`.
  - Body text must be at least `18px`.
  - Primary actions must live in a bottom navigation/action bar reachable with one thumb.
- **Responsiveness**: Layout must function cleanly on screen widths as narrow as `360px`.

## 5. Offline-First Philosophy
- **Zero-Block Offline**: The app must fully function without an internet connection.
- **Core Flows**: Never introduce any network call that blocks core flows (adding stock, recording sales, viewing lists).

## 6. Gemma Integration & Safety
- **Isolation**: All Gemma-related calls must reside exclusively in `gemma.js`.
- **Model ID**: The model identifier must be defined as a top-level constant `GEMMA_MODEL_ID` in `gemma.js`.
- **Content Boundaries**: Never query Gemma for medical, dosage, or drug information.
- **Owner Confirmation**: Gemma must never write directly to persistent storage; changes must always be confirmed by the shop owner first.

## 7. Security & API Keys
- **Storage**: The Gemma API key is entered manually by the user in Settings and saved only in client-side IndexedDB.
- **Zero Secrets**: Never hardcode, log, or commit any API key.

## 8. Commit & Development Workflow
- **Atomic Commits**: Exactly one feature per commit.
- **Clear Descriptions**: Keep changes small and explicitly declare all modified and created files.
