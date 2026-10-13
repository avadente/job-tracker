-- Replaces the "assessment" status with a Take assessment Y/N field and an assessment-completed flag.
-- Any application still in the assessment status moves to applied with Take assessment = Y.
ALTER TABLE job_tracker.applications
    ADD COLUMN assessment ENUM('Y', 'N') NOT NULL DEFAULT 'N' AFTER notes,
    ADD COLUMN assessment_completed BOOLEAN NOT NULL DEFAULT FALSE AFTER assessment;
UPDATE job_tracker.applications SET assessment = 'Y', status = 'applied' WHERE status = 'assessment';
ALTER TABLE job_tracker.applications
    MODIFY status ENUM('wishlist', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')
    NOT NULL DEFAULT 'wishlist';
