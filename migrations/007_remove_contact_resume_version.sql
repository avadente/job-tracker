-- Removes the contact and resume_version fields. Any saved contact is appended to the
-- application's notes first so it isn't lost.
UPDATE job_tracker.applications
    SET notes = CONCAT_WS('\n', notes, CONCAT('Contact: ', contact))
    WHERE contact IS NOT NULL AND contact <> '';
ALTER TABLE job_tracker.applications
    DROP COLUMN contact,
    DROP COLUMN resume_version;
