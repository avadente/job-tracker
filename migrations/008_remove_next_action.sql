-- Removes the next_action and next_action_date fields (and the follow-up reminders built on them).
-- Any saved next action is appended to the application's notes first so it isn't lost.
UPDATE job_tracker.applications
    SET notes = CONCAT_WS('\n', notes, CONCAT('Next action: ', CONCAT_WS(' ', next_action,
        CONCAT('(', DATE_FORMAT(next_action_date, '%Y-%m-%d'), ')'))))
    WHERE (next_action IS NOT NULL AND next_action <> '') OR next_action_date IS NOT NULL;
ALTER TABLE job_tracker.applications
    DROP INDEX idx_next_action_date,
    DROP COLUMN next_action,
    DROP COLUMN next_action_date;
