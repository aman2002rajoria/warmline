# Transfer Guide — Move this project to another computer

Everything (settings, professor list, drafts, logs, resume, sample Excel)
lives inside this single folder. Moving the project is a copy-paste +
`npm install` operation.

---

## What to copy

Copy the **entire `Research-Email-Automation/` folder**. The important
runtime files inside it are:

| Path                                | Why it matters                                          |
| ----------------------------------- | ------------------------------------------------------- |
| `app/`, `components/`, `services/`, `lib/`, `types/`, `public/`, `templates/`, `scripts/` | Source code & static assets — required to build/run     |
| `package.json`, `package-lock.json` | Dependency manifest + exact versions                    |
| `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json` | Build configs                                           |
| `data/settings.json`                | **YOUR API keys, Gmail, template, delay**               |
| `data/generated_emails.json`        | **YOUR professor list + AI drafts + status**            |
| `data/sent_logs.json` / `data/failed_logs.json` | **YOUR send history**                            |
| `data/cache.json`                   | Saved Gemini results (so regenerate doesn't re-charge)  |
| `data/professors.xlsx`              | Mirror of latest upload                                 |
| `uploads/resumes/*.pdf`             | **YOUR RESUME** (referenced from settings.json)         |
| `uploads/excel/*.xlsx`              | Archived imports (optional)                             |
| `logs/*.log`                        | Optional — historical logs                              |
| `SAMPLE_EXCEL_FORMAT.xlsx`          | Sample template                                         |
| `.gitignore`                        | Protects secrets when pushing to git                    |
| `docs/`                             | All documentation                                       |

### What you can SKIP (it's regenerated on the new machine)

- `node_modules/` — recreated by `npm install`
- `.next/` — recreated by `npm run dev` / `npm run build`

### Compact zip (no `node_modules` / `.next`)

```bash
# macOS / Linux
cd /path/to/parent-of-project
zip -r Research-Email-Automation.zip Research-Email-Automation \
  -x "Research-Email-Automation/node_modules/*" \
  -x "Research-Email-Automation/.next/*"
```

```powershell
# Windows PowerShell — easiest path
# 1. Manually delete node_modules and .next from File Explorer
# 2. Right-click the folder → Send to → Compressed (zipped) folder
```

---

## On the new computer

### Step 1 — Install Node.js

You need **Node 18.18+**, ideally **Node 20 LTS**.

- **macOS / Windows**: Download the LTS installer from <https://nodejs.org>
  and run it. `npm` is bundled.
- **macOS** with Homebrew: `brew install node`
- **Linux** (Debian / Ubuntu):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

Verify:

```bash
node -v   # should print v18.18+ (v20.x recommended)
npm -v
```

### Step 2 — Copy the folder

Paste `Research-Email-Automation/` anywhere on the new machine, e.g.
`~/Documents/Research-Email-Automation/`. Avoid paths with strange
characters; spaces are fine on macOS / Linux.

### Step 3 — Open it in Cursor (recommended)

If you're using Cursor:

1. Open Cursor → **File → Open Folder…** → pick `Research-Email-Automation`.
2. Open the terminal inside Cursor (`Ctrl/Cmd + ` `).

If you're not using Cursor, any terminal will do — just `cd` into the folder.

### Step 4 — Install dependencies

```bash
npm install
```

This recreates `node_modules/`. Takes 1–2 minutes the first time.

### Step 5 — Run

```bash
npm run dev
# open http://localhost:3000
```

That's it. Your **Settings**, **Professors**, **Logs**, and **Resume** are
already there because they came with the folder.

### Step 6 — Sanity check

1. Open <http://localhost:3000/settings>.
2. Click **Test Configuration** — all four checks should pass.
3. Open <http://localhost:3000/professors> — your existing list should be
   visible.

---

## What if something is missing on the new machine?

### "My professors are gone"

`data/generated_emails.json` didn't make it across. Copy that single file
over and refresh. Alternatively, re-upload `data/professors.xlsx` from the
Professors page — you'll lose the AI drafts but get the professor list back.

### "My settings are gone"

`data/settings.json` didn't make it across. Either copy that single file
over, **or** simply re-enter the Gemini key + Gmail App Password in
Settings and click **Save**. The defaults are filled in for the rest.

### "Resume not found" error

The path in `data/settings.json` (`resumePath`) is relative to the project
root (e.g. `uploads/resumes/resume__1700000000000.pdf`). If the matching
file in `uploads/resumes/` didn't make it across, just open Settings →
Resume → **Upload new resume (PDF)** to put one back.

### "Gemini API key invalid" on new machine

Sometimes you'll have moved the project across accounts and forgot to bring
the key. Re-paste it in Settings → AI → Save → Test Configuration.

---

## What NOT to share publicly

These files contain **secrets** or **private data**. They're git-ignored,
but be careful when zipping / sharing manually:

- `data/settings.json` — your Gemini key + Gmail App Password
- `data/generated_emails.json` — names + emails + draft contents
- `data/sent_logs.json` / `data/failed_logs.json` — addresses you contacted
- `data/professors.xlsx` — your professor list
- `data/cache.json` — Gemini outputs tied to those professors
- `uploads/resumes/*.pdf` — your personal resume
- `uploads/excel/*.xlsx` — archived imports
- `logs/*.log` — may include addresses + error traces

If you push this project to **GitHub**, the included `.gitignore` already
excludes all of the above. Double-check before committing:

```bash
git status --ignored
```

If something secret-looking shows up under "Untracked files", add it to
`.gitignore` before committing.

---

## Sharing the project source (without your data)

Want to give a friend the code but **not** your professors / drafts /
secrets?

```bash
zip -r Research-Email-Automation-clean.zip Research-Email-Automation \
  -x "*/node_modules/*" -x "*/.next/*" \
  -x "*/data/settings.json" -x "*/data/generated_emails.json" \
  -x "*/data/sent_logs.json" -x "*/data/failed_logs.json" \
  -x "*/data/cache.json" -x "*/data/professors.xlsx" \
  -x "*/uploads/resumes/*" -x "*/uploads/excel/*" \
  -x "*/logs/*"
```

They run `npm install && npm run setup && npm run dev` and start fresh.

---

## Quick checklist

- [ ] Node 18.18+ (ideally 20 LTS) installed on the new machine
- [ ] Whole project folder copied (including `data/` and `uploads/`)
- [ ] `npm install` finished without errors
- [ ] `npm run dev` started the app on <http://localhost:3000>
- [ ] **Test Configuration** in Settings shows all four ✅
- [ ] Professors page lists your existing entries
