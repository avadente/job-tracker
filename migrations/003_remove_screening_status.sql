-- Removes the "screening" status. Any application still marked screening moves back to applied.
UPDATE job_tracker.applications SET status = 'applied' WHERE status = 'screening';
ALTER TABLE job_tracker.applications
    MODIFY status ENUM('wishlist', 'applied', 'interview', 'offer', 'rejected', 'ghosted', 'withdrawn')
    NOT NULL DEFAULT 'wishlist';
