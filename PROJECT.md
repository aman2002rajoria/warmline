# Warmline: cold outreach that reads warm

A tool for personal cold emails to anyone you don't know yet: possible customers, partners, investors, guests, hires or mentors. You import a sheet of people. Gemini writes two or three personal lines for each one (the hook), and the rest comes from your own template. You review every draft, approve it, and it goes out from your own Gmail. Replies come back sorted, with an answer ready to approve.

## Features
- **People:** import a sheet (name, company, email, plus optional role, what they work on, a link and notes). The list and the draft sit side by side and fill the screen, so a draft never needs page scrolling.
- **AI drafts:** Gemini 2.5 Flash writes only the personal lines. The draft shows what it read (with icons), labels the lines AI, highlights them inside the email, warns when there's little to go on, and explains them ("Why this?").
- **Human approval:** nothing sends without a click. Bulk send only sends approved drafts, at a set delay and per-run limit.
- **Replies:** sorted into Interested, Later and Not now, each with a suggested answer to approve (test data for now).
- **History:** every send and failure, with reasons.
- **Settings:** your own Gemini key (in the public demo it stays in your browser and is sent only with draft requests), Gmail app password, an optional PDF attachment, template editor and "Check setup".
- **Test data mode (the public demo):** sample people (Priya at Razorpay, Kabir at CRED and others), Sameer's design-partner template, simulated sends. With your own Gemini key, "Write draft" uses real Gemini; nothing is ever emailed.
- **Look:** the Warmline logo and illustrations from the portfolio case study (public/art/), Lucide icons on every tab and action.

## Architecture
```
Browser (Next.js App Router, React, Tailwind)
  │  pages: / (Overview), /people, /replies, /logs (History), /settings
  ▼
API routes (app/api/*)  ── Node runtime
  ├─ professors CRUD, personalize (Gemini), draft rebuild
  ├─ email/send (bulk, throttled), email/test
  ├─ excel/upload, resume/upload, settings, test-config, test-mode
  ▼
Services: gemini.service · email.service (nodemailer, Gmail SMTP) · excel.service (xlsx)
  ▼
Storage: plain files, no database
  data/settings.json · data/generated_emails.json · data/*_logs.json
  data/test-mode/ (test data) · uploads/ (resume, sheets) · logs/
```
- **Status flow:** `pending → drafted → approved → sent | failed`
- **Test mode:** the `warmline_test` cookie points the stores at `data/test-mode/` and stubs Gemini and SMTP (`lib/test-mode.ts`).
- **Design system:** the portfolio brief. Fira Sans 900/400, white cards on `#FAFAFB`, a single blue accent `#2F6BFF`, pill buttons with a 3D lip, and Lucide icons. The tokens are in `app/globals.css` and `tailwind.config.ts`; the components are in `components/ui/`.

## Stack
Next.js 14, TypeScript, Tailwind, Radix Dialog, Sonner, Google Generative AI SDK, Nodemailer, SheetJS.

## Run
```bash
npm install
npm run dev        # http://localhost:3000
```
Then add a Gemini key, a Gmail app password and your resume in Settings, or click "Try with test data".

## Folder map
- `app/`: pages and API routes
- `components/`: UI kit (`ui/`), Professors screen (`professors/`), Settings, History, top bar, test mode
- `lib/`: file stores, paths, setup status, formatting, test mode
- `services/`: Gemini, email, Excel, config test
- `templates/`, `docs/`, `scripts/`: the default template, guides, setup scripts
