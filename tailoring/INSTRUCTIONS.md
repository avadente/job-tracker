# Cover letter tailoring rules

These rules apply whoever does the tailoring (Claude Code now, an in-app API call later).

## Workflow

1. `python tailor.py list` to find the application id.
2. If it has no job description: `python tailor.py fetch <id>`. If fetching fails, ask the user to paste
   the description into the app (Edit > Job description) or save it with `set-description`.
3. `python tailor.py context <id>` to read the application, job description, resume, template and slots.
4. **Eligibility check** before drafting (see below). Stop and report if a hard requirement is not met.
5. Write the slot values to a JSON file in the scratchpad and run `python tailor.py render <id> <file>`.
6. Show the user the filled slots, any changes outside slots, and the PDF path. Do not change the
   application's status; the user does that when they actually apply.

## Eligibility check

Compare the posting's *required* qualifications with the resume: degree level and field, graduation
timing, class year, required location/relocation, work authorization, and named must-have skills.
Report anything not clearly met as "Not met" or "Unclear", quoting the posting. Preferred
qualifications are informational only.

## Filling slots

- **Facts come only from the resume and the job description.** Never invent skills, tools, courses,
  experiences, metrics, or motivations. If the resume doesn't support something the posting wants,
  leave it out of the letter and mention the gap to the user instead.
- **Company name** exactly as the employer writes it in the posting.
- **Position** is the posting's job title, minus job-board prefixes like "GHC 2026:" when they are not
  part of the employer's title.
- **Skills slot**: requirements or responsibilities from the posting that the resume genuinely backs
  up, phrased so the sentence reads naturally after the words before it.
- **Purpose/mission slot**: the team's or organization's purpose as stated in the posting, faithfully
  paraphrased. Don't attribute a mission the posting doesn't describe.
- Read every filled sentence in full; it must be grammatical and match the letter's tone and length.
- **The letter must stay one page.** The template has little spare room, so keep the skills and
  purpose slots to roughly 12–18 words each. `render` rejects letters that run longer.

## Changes outside slots

The fixed text is the user's writing and stays as written. The only allowed change is a small
grammatical adjustment to the word immediately before a slot (via `"before"` in the slots file), such
as dropping "the" before a company name or changing "this" to "the". Anything bigger (a fixed
sentence that is untrue or awkward for this job) is reported to the user, not rewritten.
