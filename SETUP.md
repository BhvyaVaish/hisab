# Hisab (हिसाब) – Setup & Verification Guide

Hisab is an offline-first Progressive Web App (PWA) for Indian kirana shop owners to track stock and reorder. It is built strictly with vanilla HTML, CSS, and JavaScript—no npm, no node_modules, no build step, and no backend.

---

## 1. Prerequisites

To run and verify Hisab locally, you only need:
- **A modern web browser**: Google Chrome, Microsoft Edge, or Mozilla Firefox.
- **Git**: To clone and update the repository.
- **A local static HTTP server**: PWA features (Service Workers, Web App Manifest) require a secure context (`http://localhost` or `https://`). Opening `index.html` directly via `file://` will restrict storage and disable Service Worker APIs.
  - Python (built into most systems), or
  - Node.js (`npx serve`), or
  - VS Code / Antigravity "Live Server" extension.

---

## 2. Obtaining the Repository

### Clone the Repository
Open Windows PowerShell or your terminal and run:
```powershell
git clone https://github.com/BhvyaVaish/hisab.git
cd hisab
```

### Open in Antigravity
1. Open Antigravity IDE.
2. Select **File > Open Folder...** (or `Ctrl + K, Ctrl + O`).
3. Select the `Hisab` directory.

---

## 3. Running Locally

Execute these commands from the project root (`Hisab/`).

### Option A: Using Python (Recommended)
In Windows PowerShell:
```powershell
python -m http.server 8000
```

### Option B: Using Node.js (npx)
In Windows PowerShell:
```powershell
npx serve . -p 8000
```

### Accessing the App
Open your browser and navigate to:
```
http://localhost:8000
```

> **Important**: Do not double-click `index.html` to open it with `file://`. Modern browsers block Service Workers, Web App Manifest installation, and strict IndexedDB policies on the `file://` protocol. Always use `http://localhost:<port>`.

---

## 4. Immediate Workflows (Available Now)

These features work immediately on a fresh machine with zero external credentials or network connectivity:

### A. App Shell & Notebook UI
- Verify that the cream notebook background (`#FFF8E7`), faint blue ruled lines, and dark text (`#1E1E2E`) load cleanly.
- Verify that the header shows bilingual text: **हिसाब / Hisab**.
- Verify that touch targets in the bottom bar are at least 56px high.

### B. IndexedDB Data Layer Verification
Hisab stores all stock and settings locally in IndexedDB (`hisab-db`, version 1).

1. Press `F12` (or right-click > **Inspect**) to open Browser Developer Tools.
2. Open the **Console** tab. You should see:
   ```
   Hisab ready
   ```
3. Run the automated data layer smoke test directly in the console:
   ```javascript
   await resetDemoCheck();
   ```
4. Verify the console output:
   ```
   [resetDemoCheck] Final stock for "Mustard Oil": 8.5 | salesLog: [{date: "...", qty: 1.5}]
   ```
5. Inspect storage:
   - Navigate to the **Application** (Chrome/Edge) or **Storage** (Firefox) tab.
   - Expand **IndexedDB > hisab-db > items**.
   - Confirm that the demo item exists and that fractional quantities (e.g., `8.5`, `1.5`) are preserved exactly without rounding.

---

## 5. Verifying Offline Behavior

1. With the app running on `http://localhost:8000`, open DevTools (`F12`).
2. Go to the **Network** tab.
3. Change the throttling dropdown from **No throttling** to **Offline**.
4. In the Console tab, run data commands (e.g., `await listItems()` or `await recordSale(...)`).
5. Confirm that all IndexedDB queries and transactions succeed instantly without network requests.

---

## 6. GitHub Pages Deployment (Free Static Hosting)

Hisab is purely static and deploys directly to GitHub Pages without a build step:

1. Push your changes to the `main` branch of `https://github.com/BhvyaVaish/hisab`.
2. On GitHub, navigate to **Settings > Pages** (under the "Code and automation" menu).
3. Under **Build and deployment > Source**, select **Deploy from a branch**.
4. Under **Branch**, select `main` and root folder `/(root)`. Click **Save**.
5. Once GitHub Actions completes the static deployment, your site will be live at:
   ```
   https://bhvyavaish.github.io/hisab/
   ```

---

## 7. Gemma Configuration (Upcoming Feature)

*Note: Gemma integration is isolated to `gemma.js` and requires explicit shop-owner confirmation before any data is written.*

- **API Key Acquisition**: Obtained by the shop owner from [Google AI Studio](https://aistudio.google.com/).
- **Configuration**: The API key is entered manually by the owner in the in-app **Settings** screen.
- **Security & Storage**:
  - Keys are saved exclusively inside the local browser IndexedDB (`settings` store).
  - Keys are **never** hardcoded, committed to Git, or sent to any intermediary server.
- **Model**: Defined via the `GEMMA_MODEL_ID` constant at the top of `gemma.js`.

---

## 8. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `file://` protocol errors / Service Worker won't register | Opened `index.html` directly from file explorer | Start a local server (`python -m http.server 8000`) and visit `http://localhost:8000`. |
| `Port 8000 is already in use` | Another process is using port 8000 | Specify a different port: `python -m http.server 8080`. |
| Changes in `styles.css` or `app.js` not visible | Browser cache | Hard-reload the page using `Ctrl + F5` or `Ctrl + Shift + R`. |
| IndexedDB schema mismatch / stale data | Old database structure cached | In DevTools > **Application** > **Storage**, click **Clear site data**, or delete `hisab-db` in IndexedDB. |
| Console shows `resetDemoCheck is not defined` | `app.js` failed to load | Check the Network tab in DevTools to verify `app.js` loaded with status `200 OK`. |
