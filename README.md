# Research Email Automation

Localhost-only tool to send personalized research-internship cold emails.
~85–90% of the email is a fixed template you control; only **2–3 sentences**
are AI-generated using Gemini Flash. Everything stays inside this folder
(no database, no cloud) so the project is fully portable.

## Quick start

```bash
npm install
npm run setup
npm run dev
# open http://localhost:3000
```

## Full documentation

Shortcut files at the repo root (`ENV_SETUP.md`, `TRANSFER_GUIDE.md`,
`TROUBLESHOOTING.md`, `CURSOR_SETUP_GUIDE.md`) point into `docs/` for the
same content.

All guides live in [`docs/`](./docs):

| File | Purpose |
| --- | --- |
| [docs/README.md](./docs/README.md) | Project overview, features, folder layout, full setup |
| [docs/ENV_SETUP.md](./docs/ENV_SETUP.md) | How to get a Gemini API key + Gmail App Password |
| [docs/TRANSFER_GUIDE.md](./docs/TRANSFER_GUIDE.md) | How to copy the project to another computer |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Common errors and how to fix them |
| [docs/CURSOR_SETUP_GUIDE.md](./docs/CURSOR_SETUP_GUIDE.md) | Using Cursor on a new machine to continue dev |

> **There is no database.** All app state is plain files inside `data/`
> (JSON + Excel). All secrets stay in `data/settings.json` on this machine.
