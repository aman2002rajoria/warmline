# Cursor Setup Guide

How to open this project in **Cursor** on a new computer, run it, debug it,
and ask the in-editor AI to help you fix issues.

---

## 1. Install Cursor

Download from <https://cursor.com> and run the installer. Sign in with your
account on first launch.

---

## 2. Install Node.js (one-time)

Cursor doesn't bundle Node.js. Install it once:

- **macOS / Windows**: <https://nodejs.org> → download **LTS** → run installer
- **macOS (Homebrew)**: `brew install node`
- **Linux (Debian/Ubuntu)**:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

Verify in a terminal:

```bash
node -v   # v18.18+ (v20 LTS recommended)
npm -v
```

---

## 3. Open the project in Cursor

1. **File → Open Folder…** → pick the `Research-Email-Automation` folder.
2. Wait a moment — Cursor indexes the project so its AI knows your codebase.

The folder layout you'll see:

```
Research-Email-Automation/
├── app/         ← Next.js pages + API routes (start here for UI changes)
├── components/  ← React components
├── services/    ← Business logic (Gemini, email, excel, test-config)
├── lib/         ← Storage + utilities
├── data/        ← Your JSON state (DO NOT delete unless you mean it)
├── docs/        ← All documentation
└── package.json
```

---

## 4. Open the integrated terminal

Press **`Ctrl + ``** (backtick) — or use **Terminal → New Terminal**.

You're now in the project root. The shell starts at `Research-Email-Automation/`.

---

## 5. Install dependencies (first time only)

```bash
npm install
```

This downloads `node_modules/`. Takes ~1–2 minutes on first run.

---

## 6. Start the dev server

```bash
npm run dev
```

Wait for:

```
✓ Ready in 1.2s
- Local: http://localhost:3000
```

Open <http://localhost:3000> in your browser. Cursor reloads automatically
when you edit files.

### Stop the server

Click in the terminal → press **`Ctrl + C`**.

### Restart the server

Stop with `Ctrl + C` → run `npm run dev` again. Or just hit `r` then Enter
in many Node versions.

---

## 7. Recommended Cursor extensions

Cursor uses the VS Code extension marketplace. Recommended:

| Extension                  | Why                                                |
| -------------------------- | -------------------------------------------------- |
| **ESLint**                 | Inline lint feedback for the TS/React code         |
| **Prettier - Code formatter** | Auto-format on save                             |
| **Tailwind CSS IntelliSense** | Autocomplete for Tailwind classes               |
| **vscode-icons**           | Nicer file icons in the sidebar                    |
| **Error Lens**             | Show errors next to the line instead of underline  |

Install: Click the **Extensions** icon in the left sidebar (or `Cmd/Ctrl + Shift + X`)
→ search → **Install**.

---

## 8. Most important files to know

| File                                         | What it does                              |
| -------------------------------------------- | ----------------------------------------- |
| `app/page.tsx`                               | Dashboard page                            |
| `app/professors/page.tsx`                    | Professors list page                      |
| `app/settings/page.tsx`                      | Settings page (includes Test Config button) |
| `app/logs/page.tsx`                          | Logs page                                 |
| `components/professors-client.tsx`           | Main UI: upload, table, bulk actions      |
| `components/email-preview-dialog.tsx`        | Per-professor preview + edit dialog       |
| `components/settings-client.tsx`             | Settings form + Test Configuration panel  |
| `components/logs-client.tsx`                 | Logs viewer                               |
| `services/gemini.service.ts`                 | All Gemini API logic                      |
| `services/email.service.ts`                  | Nodemailer + bulk send                    |
| `services/excel.service.ts`                  | Excel parser                              |
| `services/test-config.service.ts`            | Runs the 4 checks                         |
| `lib/settings-store.ts`                      | Read/write `data/settings.json`           |
| `lib/professors-store.ts`                    | Read/write `data/generated_emails.json`   |
| `lib/logs-store.ts`                          | Sent / failed audit logs                  |
| `lib/cache-store.ts`                         | Gemini result cache                       |
| `lib/json-store.ts`                          | Atomic JSON read/write primitive          |
| `lib/paths.ts`                               | All project-relative path constants       |
| `types/index.ts`                             | Shared TS types                           |

---

## 9. Debugging in Cursor

### See server errors

The terminal running `npm run dev` prints every server-side error. Always
have it visible while debugging.

### See client errors

Open the page → right-click → **Inspect** → **Console** tab. JS errors and
React warnings show up there.

### See network errors (failed API calls)

DevTools → **Network** tab → filter by **Fetch/XHR** → click the red
`/api/...` request → look at **Response** for the JSON `{ "error": "..." }`.

### Check the app's own logs

Open the in-app **/logs** page or read these files directly in Cursor:

- `logs/errors.log` — everything that threw
- `logs/app.log`    — all info + warn + error
- `logs/email.log`  — every send attempt
- `data/sent_logs.json` / `data/failed_logs.json` — structured audit

### Inspect / edit local state

Open `data/*.json` directly in Cursor — they're just human-readable files.
Edit, save, reload the page, done. (No restart needed.)

---

## 10. Reinstall dependencies (when things get weird)

```bash
rm -rf node_modules package-lock.json   # macOS / Linux
npm install
```

Windows: delete the folder + file via File Explorer, then `npm install`.

---

## 11. Reset to a clean slate (DESTROYS data)

```bash
rm -rf .next node_modules
rm -f data/generated_emails.json data/cache.json
rm -f data/sent_logs.json data/failed_logs.json
rm -f logs/*.log
npm install
npm run dev
```

Settings and resume are kept. Re-upload your Excel from the Professors page.

---

## 12. Asking the Cursor AI for help

Open the Cursor chat (`Cmd/Ctrl + L`) and ask anything. The AI sees your
code automatically. Some prompts that work well for this project:

### Recommended prompts

> **Debugging a send failure**
>
> "Open `services/email.service.ts` and explain why `sendOneEmail` might
> throw `Invalid login`. Then check `app/api/email/test/route.ts` and the
> Settings → Email tab to find where the credentials are read from."

> **Adding a new column to the Excel importer**
>
> "I want to support a new optional column `personal_website` from Excel.
> Update `services/excel.service.ts`, `types/index.ts`, `lib/professors-store.ts`,
> and the Professors table UI so it persists and displays. Keep changes minimal."

> **Reading what an error means**
>
> "Here's the last 30 lines of `logs/errors.log`:
> [paste]
> What does this mean and where in the codebase is it coming from?"

> **Tweaking the AI prompt**
>
> "Open `services/gemini.service.ts` and modify `SYSTEM_PROMPT` so the
> personalized lines also briefly mention my background in [topic].
> Keep the tone and length constraints exactly the same."

> **Adding a new API route**
>
> "Add a new `GET /api/professors/export` route that returns the entire
> `data/generated_emails.json` as a downloadable JSON file. Follow the
> pattern used by `app/api/logs/route.ts`."

> **Changing a UI element**
>
> "On the Professors page (`components/professors-client.tsx`), add a
> filter dropdown to filter by status (pending / drafted / approved / sent
> / failed). Use the existing shadcn-style components in `components/ui/`."

### Tips for productive AI chats

- **Mention the file**. The AI is much faster when you say "in
  `services/gemini.service.ts`" than "in the AI logic".
- **Paste the actual error**. The full text including line numbers.
- **Say what you've tried**. Saves a round trip.
- **Ask for the smallest possible change**. "Don't refactor anything I
  didn't ask about" is a useful guardrail.

---

## 13. Common Cursor keyboard shortcuts (macOS / Windows)

| Action                  | macOS                 | Windows / Linux       |
| ----------------------- | --------------------- | --------------------- |
| Open file by name       | `Cmd + P`             | `Ctrl + P`            |
| Open AI chat            | `Cmd + L`             | `Ctrl + L`            |
| Inline AI edit          | `Cmd + K`             | `Ctrl + K`            |
| Find in file            | `Cmd + F`             | `Ctrl + F`            |
| Find across project     | `Cmd + Shift + F`     | `Ctrl + Shift + F`    |
| Toggle terminal         | `` Ctrl + ` ``        | `` Ctrl + ` ``        |
| Format file             | `Shift + Option + F`  | `Shift + Alt + F`     |
| Go to definition        | `F12`                 | `F12`                 |

---

## 14. Architecture cheat-sheet

```
            ┌──────────────────────┐
            │   Browser UI         │
            │   /professors        │─── upload .xlsx ──┐
            │   /settings          │                   │
            │   /logs              │                   ▼
            └─────────┬────────────┘     ┌──────────────────────────┐
                      │ fetch /api/...   │ services/excel.service   │
                      ▼                  │   parseExcelBuffer()     │
            ┌──────────────────────┐     │   importProfessors()     │
            │ Next.js API routes   │     └────────────┬─────────────┘
            │ (app/api/...)        │                  │
            └─────────┬────────────┘                  ▼
                      │                  ┌──────────────────────────┐
                      ├──── /api/        │ lib/professors-store     │
                      │     professors   │ data/generated_emails.json │
                      │                  └──────────────────────────┘
                      ├──── /api/        ┌──────────────────────────┐
                      │     settings     │ lib/settings-store       │
                      │                  │ data/settings.json       │
                      │                  └──────────────────────────┘
                      ├──── /api/        ┌──────────────────────────┐
                      │     test-config  │ services/test-config     │
                      │                  │ (pingGemini, verifySmtp, │
                      │                  │  testResume, testExcel)  │
                      │                  └──────────────────────────┘
                      ├──── /api/        ┌──────────────────────────┐
                      │     email/send   │ services/email.service   │
                      │                  │   bulkSend() ──┐         │
                      │                  └────────────────┼─────────┘
                      │                                   │ nodemailer
                      │                                   ▼
                      │                              Gmail SMTP
                      └──── /api/                   (smtp.gmail.com)
                            professors/[id]/         
                            personalize ────────► services/gemini.service
                                                       Gemini API
```

That's the entire system. No database, no queues, no schedulers, no auth.
Just files, functions, and HTTP.
