# Job Tracker

Flask + MySQL job application tracker. Config (DB credentials, document paths) lives in the
git-ignored `.env`; MySQL runs on the Windows host and is reached from WSL via `DB_HOST`.

- Run the app: `.venv/bin/python app.py` (http://localhost:5000)
- Schema changes: update `schema.sql` and add a numbered file in `migrations/`, then apply it to the live DB.
- The repo is public: never commit resume/cover letter contents, generated letters, or `.env`.

## Tailoring cover letters

When asked to tailor or write a cover letter for a job, follow `tailoring/INSTRUCTIONS.md` and use
`tailor.py` (run with `.venv/bin/python`).
