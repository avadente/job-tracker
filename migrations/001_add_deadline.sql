-- Adds the application deadline column to databases created before it existed.
ALTER TABLE job_tracker.applications ADD COLUMN deadline DATE AFTER date_applied;
