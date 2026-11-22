# Environment Setup

> **You do NOT need to edit `.env` to use this app.** All settings are
> configured in the Settings page and saved to `data/settings.json`. This
> guide explains how to obtain the **two credentials** you'll paste into the
> Settings page.

---

## 1. Get a Gemini API key

1. Sign in with a Google account at <https://aistudio.google.com/app/apikey>.
2. Click **Create API key** → **Create API key in new project** (or pick an
   existing project).
3. Copy the key (looks like `AIzaSy…`).
4. Open the app → **Settings → AI** → paste it into **Gemini API key**.
5. Click **Save Settings**.
6. Click **Test Configuration** — Gemini should now be ✅.

Default model is `gemini-2.5-flash`. You can switch to another id listed in
Google AI Studio if your project supports it. Saved `gemini-2.0-flash` and older
`gemini-1.5-*` names are normalized to `gemini-2.5-flash` when settings load or
save (many keys have no usable free-tier quota on 2.0).

---

## 2. Get a Gmail App Password

App Passwords are 16-character one-off passwords that let apps send mail via
your Gmail account **without** using your real password.

1. Enable **2-Step Verification** on your Google account if you haven't:
   <https://myaccount.google.com/signinoptions/two-step-verification>.
2. Open <https://myaccount.google.com/apppasswords>.
3. Under **App name**, type something like `Research Email Automation`.
4. Click **Create**. Google shows a 16-character password (e.g.
   `abcd efgh ijkl mnop`).
5. In the app: **Settings → Email** → fill in:
   - **Gmail address** — your Gmail
   - **Gmail App Password** — paste the 16 characters (spaces OK)
   - **Sender display name** — your full name
6. Click **Save Settings** → **Test Configuration** → SMTP should be ✅.
7. (Optional) Click **Send test** at the bottom of the Email tab to send
   yourself a real test email — it includes your resume attachment.

### If you don't see the App passwords option

- You probably haven't enabled 2-Step Verification yet, **or**
- Your Google Workspace admin has disabled App Passwords. Use a personal
  Gmail account instead.

### SMTP port

| Port | Use it if…                                                  |
| ---- | ----------------------------------------------------------- |
| 587  | (default, recommended) STARTTLS                             |
| 465  | Your network blocks 587 — uses implicit TLS                 |

---

## 3. Upload your resume

In **Settings → Resume**:

- Click **Upload new resume (PDF)** and pick your PDF.
- The file is copied into `uploads/resumes/` and the project-relative path is
  saved into `data/settings.json` automatically.
- Click **Test Configuration** — Resume file should be ✅.

---

## 4. Optional: `.env` for headless setup

The app does not read `.env`. We removed that complexity. Configure
everything from the Settings UI — that's the only supported path.

If you want to keep your secrets out of `data/settings.json` for some reason
(e.g. you plan to commit the file), you can manually edit
`data/settings.json` instead. It's plain JSON:

```json
{
  "geminiApiKey": "AIza…",
  "geminiModel": "gemini-2.5-flash",
  "gmailEmail": "you@gmail.com",
  "gmailAppPassword": "abcd efgh ijkl mnop",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "senderName": "Your Name",
  "replyTo": "",
  "resumePath": "uploads/resumes/resume.pdf",
  "defaultDelaySeconds": 8,
  "maxPerRun": 40,
  "subjectTemplate": "Research Internship Inquiry — {{professor_name}}, {{university}}",
  "bodyTemplate": "Dear Professor {{professor_name}}, …"
}
```

⚠️ **Do not commit `data/settings.json` to a public repo.** It's already
listed in `.gitignore`.

---

## 5. Security checklist

- [ ] `data/settings.json` is **not** committed (it's git-ignored).
- [ ] `data/professors.xlsx`, `data/*_logs.json`, `data/cache.json` are also
      git-ignored.
- [ ] You've enabled 2-Step Verification on your Google account.
- [ ] You're using an **App Password**, not your real Gmail password.
- [ ] The 16-character App Password is unique to this app, not shared with
      others.
- [ ] You've added the resume PDF inside the project (`uploads/resumes/`),
      not referenced from somewhere outside.
