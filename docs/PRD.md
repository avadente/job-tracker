# Job Tracker — Product Requirements Document

| | |
|---|---|
| **Status** | Draft v1 |
| **Last updated** | 2026-10-15 |
| **Owner** | avadente |

## 1. Overview

Job Tracker is a self-hosted, single-user web app for managing a job and internship search. It
replaces a spreadsheet with a purpose-built tracker: every application lives in one place with its
status, deadlines, assessments, notes, the posting's job description, and any tailored cover letters
generated for it.

It runs locally (Flask on `localhost:5000`, MySQL on the same machine or the Windows host under WSL)
and keeps personal documents out of the repository.

## 2. Problem

A student applying to many internships and assistantships at once has to keep track of:

- which postings they intend to apply to, and by when;
- which they have applied to, and on what date;
- which require an online assessment, and whether it has been completed;
- where each application stands (interview, offer, rejection);
- which cover letter was sent to which employer.

Spreadsheets handle the first few poorly (no deadline warnings, no pipeline view) and do not handle
the last at all. Writing a tailored cover letter for every posting is also slow and repetitive, and
easy to get wrong (wrong company name, a letter that spills onto a second page, claims the resume
does not support).

## 3. Goals and non-goals

### Goals

1. **One source of truth** for every application and its current status.
2. **Never miss a deadline or assessment**: surface what is due soon without the user hunting for it.
3. **See the pipeline at a glance**: counts by stage and a board view of the whole search.
4. **Fast, accurate cover letters**: tailor a letter from the user's own template and resume, grounded
   only in facts from the resume and the posting, and file it against the application.
5. **Own the data**: local database, CSV export, plain `mysqldump` backups.

### Non-goals

- Multi-user accounts, sharing, or hosting on the public internet.
- Scraping job boards or auto-applying.
- Writing cover letters from scratch or rewriting the user's own template text.
- Resume generation or editing.
- Mobile apps (the web UI should stay usable on a narrow screen, but there is no native app).

## 4. Users

**Primary user:** a single student job-seeker (the repo owner) running the app on their own Windows
PC through WSL, applying to internships, graduate assistantships, and entry-level roles.

**Secondary user:** an AI assistant (Claude Code today) that tailors cover letters by running
`tailor.py` and following `tailoring/INSTRUCTIONS.md`.

## 5. Current functionality (v1)

### 5.1 Application records

Each application stores:

| Field | Notes |
|---|---|
| Company*, Role* | Required |
| Job posting URL | Rendered as a link on the role |
| Location, Work mode | Work mode: onsite / hybrid / remote |
| Status | wishlist → applied → interview → offer, plus rejected / withdrawn |
| Date applied | Auto-stamped with today's date when status moves wishlist → applied, unless edited in the same save |
| Application deadline | |
| Salary range | Free text |
| Take assessment (Y/N) | With an "Assessment completed" checkbox shown only when Y |
| Notes | Free text |
| Job description | Long text, pasted or fetched from the posting URL |
| Created / updated timestamps | Automatic |

New applications default to status *applied* with today's date and no assessment.

### 5.2 Views

- **Table view**: company & role, status (with assessment tag), deadline, date applied, location/work
  mode. Columns sort ascending/descending; status sorts by pipeline order. Default sort is most
  recently updated.
- **Board view**: one column per status with counts; drag a card to another column to change its
  status. The view is kept in the URL (`#board`).
- **Edit dialog**: click any row or card to edit or delete. Shows links (PDF / Word) to any cover
  letters generated for the application.

### 5.3 Search, filter, stats

- Free-text search over company, role, location, and notes.
- Filter by status.
- Summary bar: total, active (applied/interview/offer), interviewing, offers.

### 5.4 Deadline and assessment cues

- Wishlist items with a deadline within 7 days are highlighted; passed deadlines get a distinct style.
  Deadlines are not flagged once the user has applied.
- Applications with an assessment show "Assessment due" until it is marked complete, then
  "Assessment ✓".
- Rows with a generated cover letter show a "Letter" tag.

### 5.5 Export and backup

- `GET /export.csv` downloads all applications (excluding job descriptions) as a dated CSV.
- Backups via `mysqldump` (documented in the README).

### 5.6 Cover letter tailoring (CLI)

`tailor.py` commands:

| Command | Purpose |
|---|---|
| `list` | Applications with id, status, whether a JD is saved, letter count, deadline |
| `fetch <id>` | Download and clean the posting text from its URL into `job_description` |
| `set-description <id> <file>` | Save a JD from a file when fetching fails |
| `context <id>` | Print the application, JD, resume text, template text, and the template's slots |
| `render <id> <slots.json>` | Fill the template's bold placeholder runs, save `.docx`, convert to `.pdf` via Word, enforce the page limit, and record it in `materials` |

Rules (from `tailoring/INSTRUCTIONS.md`):

- Run an **eligibility check** against the posting's required qualifications before drafting; stop
  and report anything "Not met" or "Unclear".
- **Facts only from the resume and the job description.** Gaps are reported to the user, not papered
  over.
- The user's fixed template text is not rewritten; only a small grammatical tweak to the word just
  before a slot is allowed.
- Letters must fit the page limit (`COVER_LETTER_MAX_PAGES`, default 1); `render` rejects longer
  letters.
- Tailoring never changes an application's status.

### 5.7 Configuration and privacy

- All credentials and document paths live in the git-ignored `.env`.
- The repository is public: resumes, cover letters, generated letters, and `.env` must never be
  committed. Generated files are written to `TAILORED_DIR` outside the repo.
- The server binds to `127.0.0.1` only.

## 6. Architecture

```
Browser (index.html + app.js) ──JSON──▶ Flask (app.py) ──PyMySQL──▶ MySQL (job_tracker)
                                                                      ▲
tailor.py (CLI) ──────────────────────────────────────────────────────┘
   ├─ reads template / resume .docx (python-docx)
   ├─ converts .docx → .pdf with Word via PowerShell COM (Windows host)
   └─ checks page count (pdfplumber)
```

**Data model**

- `applications`: one row per application (fields in §5.1).
- `materials`: generated documents per application (`kind`, `docx_path`, `pdf_path`, the
  `slot_values` used), deleted with their application.

**API**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/applications` | All applications with their materials |
| POST | `/api/applications` | Create (company and role required) |
| PATCH | `/api/applications/<id>` | Partial update |
| DELETE | `/api/applications/<id>` | Delete |
| GET | `/export.csv` | CSV export |
| GET | `/materials/<id>/<pdf\|docx>` | Open/download a generated letter |

Invalid input returns 400 with a message; a database outage returns 503 and is shown in the UI's
error banner.

**Schema changes** follow the project convention: update `schema.sql`, add a numbered file in
`migrations/`, and apply it to the live database.

## 7. Requirements for upcoming work

Proposed, in rough priority order. Each is a candidate, not a commitment.

### P1 — In-app cover letter tailoring

Trigger tailoring from the edit dialog instead of the CLI, using the Claude API with the same rules
as `tailoring/INSTRUCTIONS.md`.

- Button "Tailor cover letter" on an application with a saved job description.
- Show the eligibility check result first; let the user proceed or stop.
- Show the proposed slot values for review and editing before rendering.
- Render, enforce the page limit, and attach the letter to the application as today.
- **Acceptance:** a letter generated in-app is indistinguishable in quality and constraints from one
  produced through the CLI workflow; no resume or letter content is written into the repo.

### P1 — Fetch job description from the UI

A "Fetch from URL" button next to the job description field that runs the same logic as
`tailor.py fetch`, with a clear message when the page needs a browser and must be pasted.

### P2 — Upcoming-items panel

A small panel listing wishlist deadlines in the next 7 days and incomplete assessments, so the user
does not need to scan the table.

### P2 — Status history

Record each status change with a date, to show time-in-stage and when interviews/rejections
happened. Requires a new `status_history` table and migration.

### P3 — Search improvements

Optionally include the job description in search; filter by work mode and by "has assessment due".

### P3 — Basic analytics

Applications per week, response rate (applied → interview), and outcome breakdown by role type.

## 8. Quality, security, and constraints

- **Local only.** No authentication exists; the app must stay bound to `127.0.0.1`. Exposing it on a
  network would require adding auth first.
- **No secrets or personal documents in git.** Enforced by `.gitignore` and the project rules in
  `CLAUDE.md`.
- **PDF conversion depends on Microsoft Word** on the Windows host. Tailoring will not work on a
  machine without Word.
- **Testing.** There is currently no automated test suite. Adding API tests for validation and the
  wishlist → applied date stamping is recommended before the P1 work.
- **Performance.** `GET /api/applications` returns every row including full job descriptions. Fine
  at hundreds of applications; if it slows, omit `job_description` from the list response and load
  it when the edit dialog opens.

## 9. Success metrics

- Every active application is in the tracker (no parallel spreadsheet).
- Zero missed application deadlines or assessments for tracked postings.
- A tailored, one-page, fact-checked cover letter in under 5 minutes of the user's time per posting.
- No personal documents or credentials ever appear in the public repository.

## 10. Open questions

1. Should in-app tailoring call the Claude API directly from Flask, and where should the API key live
   (`.env` is the obvious answer)?
2. Should "withdrawn" and "rejected" be hidden from the default table view?
3. Is a status history worth a schema change, or are notes enough?
4. Should the app support more than one cover letter template (e.g. one for assistantships, one for
   industry internships)?
