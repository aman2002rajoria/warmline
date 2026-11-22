# Templates

`default-email.txt` is a human-readable copy of the email template stored in the
database (Settings page → **Template** tab). Editing this file does **not**
change the running app — edit the template in the UI to persist changes.

Use the placeholders:

- `{{professor_name}}`
- `{{university}}`
- `{{personalized_lines}}` ← the only AI-generated section

Everything outside `{{personalized_lines}}` should stay fixed across all
recipients so the personalization remains intentional and small (~10–15% of
the email).
