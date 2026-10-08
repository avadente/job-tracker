-- Adds the "assessment" status (shown as "Take assessment") between applied and interview,
-- and removes "ghosted". Any ghosted application moves to rejected, the other closed-out status.
ALTER TABLE job_tracker.applications
    MODIFY status ENUM('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'ghosted', 'withdrawn')
    NOT NULL DEFAULT 'wishlist';
UPDATE job_tracker.applications SET status = 'rejected' WHERE status = 'ghosted';
ALTER TABLE job_tracker.applications
    MODIFY status ENUM('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn')
    NOT NULL DEFAULT 'wishlist';
