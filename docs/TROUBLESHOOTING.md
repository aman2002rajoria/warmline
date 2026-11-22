# Troubleshooting

> The single fastest debugging shortcut is: open the **Settings** page,
> click **Test Configuration**, and read the four results. That tells you
> in 5 seconds which subsystem is broken.

---

## Setup & install

### `Error: Cannot find module 'next'` (or any package)

```text
Cannot find module 'next'
```

**Fix**: Dependencies weren't installed (or got corrupted).

```bash
rm -rf node_modules package-lock.json   # macOS / Linux
npm install
```

(Windows: delete `node_modules` and `package-lock.json` via File Explorer,
then `npm install`.)

---

### `npm install` is extremely slow or hangs

**Cause**: Slow network or `npm` cache corruption.

```bash
npm cache verify
npm install --prefer-offline
```

If still stuck, try a different network / hotspot.

---

### `EACCES` permission errors during `npm install`

You probably installed Node via `sudo` previously and `~/.npm` is owned by
root.

```bash
sudo chown -R "$(whoami)" "$HOME/.npm"
```

Then re-run `npm install`.

---

### `Error: Node version is too old`

The app requires **Node ≥ 18.18** (Node 20 LTS recommended).

```bash
node -v
```

If it shows v16 or older, install Node 20 LTS from <https://nodejs.org>.

---

### Next.js: "Failed to load SWC binary" / code signature (macOS)

After copying the project from another Mac, a USB drive, or a zip, you may
see:

```text
Failed to load SWC binary for darwin/arm64
code signature … not valid for use in process: library load disallowed by system policy
```

**Cause**: macOS quarantine or a stale `node_modules` from the old machine.

**Fix** (run from the project root):

```bash
xattr -cr .
rm -rf node_modules .next
npm install
npm run dev
```

If it still fails, delete only the SWC package and reinstall it:

```bash
rm -rf node_modules/@next/swc-darwin-arm64 node_modules/@next/swc-darwin-x64
npm install
```

---

## Running the app

### Port 3000 already in use

```text
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix A — kill whatever is on 3000**:

```bash
# macOS / Linux
lsof -i :3000           # find the PID
kill -9 <PID>

# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess
Stop-Process -Id <PID> -Force
```

**Fix B — use a different port**:

```bash
npx next dev -p 3001
# open http://localhost:3001
```

---

### Browser shows blank page or "This site can't be reached"

- Make sure the terminal still says `Ready in …ms` (Next.js is running).
- Try a hard-refresh (`Cmd/Ctrl + Shift + R`).
- Clear `.next` and restart:
  ```bash
  rm -rf .next
  npm run dev
  ```

---

## Gemini AI

### `[404] models/gemini-1.5-flash is not found` (or similar)

Google has retired or restricted many **`gemini-1.5-*`** model ids on the
Generative Language API (`v1beta`). Your key is often fine; the **model name**
is wrong for that API surface.

**Fix**: In **Settings → AI → Model**, use a current id such as
`gemini-2.5-flash` (or another id from AI Studio), then **Save Settings** → **Test
Configuration**. This project defaults to `gemini-2.5-flash` and automatically
remaps saved legacy `gemini-1.5-*` names when settings are loaded or saved.

---

### "Gemini API key is not configured"

You haven't pasted your key in **Settings → AI**, **or** you pasted the
masked display value back in. Re-paste the full `AIza…` key and click
**Save Settings**.

---

### "API key not valid. Please pass a valid API key."  (HTTP 400)

The string is wrong or the key has been revoked.

1. Visit <https://aistudio.google.com/app/apikey>.
2. Either copy the existing key again, or **Create API key**.
3. Re-paste into Settings → AI → **Save** → **Test Configuration**.

---

### "PERMISSION_DENIED" / HTTP 403 from Gemini

- The Google account that created the key doesn't have Gemini API enabled.
  Visit <https://aistudio.google.com/> first, accept terms, then create
  a new key.
- If you're on a Google Workspace account, ask the admin if Gemini is
  allowed.

---

### "Quota exceeded" / HTTP 429 from Gemini

You hit the free-tier rate limit. Options:
- Wait a minute and try again (only retry the failed ones, not all).
- Switch model in Settings → AI → **Model** to a tier your key supports. The
  app defaults to `gemini-2.5-flash` and remaps `gemini-2.0-flash` and legacy
  `gemini-1.5-*` ids to `gemini-2.5-flash` on load/save (free tier often has no
  quota on 2.0). The app does **not** auto-retry other models after a quota error.
- The app **caches** Gemini results per professor email, so repeated
  personalize calls on the same row are free — only **Regenerate** (force)
  hits the API again.

---

## Gmail SMTP

### "Invalid login: 535-5.7.8 Username and Password not accepted"

You used your **normal Gmail password**. Gmail no longer accepts that for
SMTP. You need a **16-character App Password**.

See [ENV_SETUP.md → Get a Gmail App Password](./ENV_SETUP.md#2-get-a-gmail-app-password).

---

### "App passwords" option is not visible in Google account

- Make sure **2-Step Verification** is enabled first.
- Workspace / EDU accounts: admin may have disabled App Passwords. Use a
  personal Gmail account instead.

---

### "Connection timeout" / SMTP hangs

Your network is blocking port 587. Try port **465** in
Settings → Email → **SMTP port** (and click **Save** → **Test Configuration**).

If that also fails, try a different network (mobile hotspot is the
easiest test).

---

### Test email arrives in Spam, not Inbox

- Make sure **Sender display name** is set in Settings → Email.
- Keep `EMAIL_DELAY_MS` ≥ 8 seconds and send small batches (< 40 at a time).
- Add a real `Reply-To` (your university address) in Settings → Email.
- Don't send to the same recipient repeatedly during testing.

---

## Excel import

### "File must be .xlsx or .xls"

Save the file as `.xlsx` from Excel / Google Sheets / Numbers and re-upload.

---

### "Missing professor_name" / "Missing university" / "Missing email"

Required columns are missing from the sheet. Required columns
(case-insensitive):

| professor_name | university | email |

Download the **sample template** from the Professors page and copy your
data into it.

---

### "Invalid email: xyz"

The email cell doesn't match a valid email format. Edit it in the sheet
and re-upload. Duplicates (by email) are silently skipped on re-upload.

---

### Excel upload says "0 imported, 0 skipped"

Your sheet might have rows but no recognized columns. Make sure the header
row uses one of these names (case-insensitive, underscores or spaces OK):

| Field          | Accepted names                                          |
| -------------- | ------------------------------------------------------- |
| professor_name | `professor_name`, `name`, `professor`, `full_name`      |
| university     | `university`, `institution`, `school`, `college`        |
| email          | `email`, `email_id`, `professor_email`, `contact_email` |
| department     | `department`, `dept`                                    |
| lab_website    | `lab_website`, `website`, `url`, `lab_url`, `lab`       |
| research_area  | `research_area`, `research`, `area`, `topic`, `focus`   |
| notes          | `notes`, `note`, `remarks`, `comment`, `comments`       |

---

## Resume attachment

### "Resume not found" warning in logs / Test Configuration

The path in `data/settings.json` → `resumePath` doesn't exist on disk.

**Fix A — easiest**: Open Settings → Resume → **Upload new resume (PDF)**.

**Fix B — manual**: Drop your PDF into `uploads/resumes/` and edit
`data/settings.json` so `resumePath` matches the file (e.g.
`"uploads/resumes/aman_resume.pdf"`).

---

## Sending

### Some emails sent, some failed in a bulk run

Open **/logs → Failed** to see the exact reason for each failure. Common
causes:

- One of the email addresses bounced.
- Gmail temporarily throttled — wait a few minutes and use
  **Retry failed** from the Professors page.
- The professor's mail server rejected the resume attachment (rare — try
  again or send manually).

---

### "Send failed: Email not drafted yet (missing subject/body)"

You clicked **Send** on a row that was never personalized + previewed. Run
**Personalize selected** first, or open the row's preview and click
**Save draft**.

---

### How do I cancel a bulk send mid-way?

The send runs sequentially with a delay. Stop the dev server (`Ctrl+C` in
the terminal) and any in-flight emails will finish but no more will start.
Already-sent emails stay marked as `sent`.

---

## Data & files

### "I want to clear all professors and start over"

```bash
# macOS / Linux
rm data/generated_emails.json data/cache.json
```

```powershell
# Windows
del data\generated_emails.json
del data\cache.json
```

(Sent / failed logs are kept — delete those too if desired.)

---

### "I edited `data/settings.json` by hand and the app didn't pick it up"

The app reads `data/settings.json` on every request, so no restart is
needed — just refresh the page. Make sure the JSON is valid (no trailing
commas).

---

### "I want to back up everything"

Copy these to an external location:

- `data/` (whole folder)
- `uploads/resumes/`
- `uploads/excel/`

Those four directories contain every piece of state. The code itself is in
git or wherever you got it from.

---

## Cursor / dev environment

For Cursor-specific debugging, see [CURSOR_SETUP_GUIDE.md](./CURSOR_SETUP_GUIDE.md).

---

## Still stuck?

1. Open `/logs` → **errors.log** tab — the last 200 lines often have the
   exact stack trace.
2. Open the browser DevTools → **Network** tab → re-trigger the action →
   inspect the failed `/api/...` request body for the JSON error.
3. Open the terminal that's running `npm run dev` — Next.js prints server
   errors directly there.
