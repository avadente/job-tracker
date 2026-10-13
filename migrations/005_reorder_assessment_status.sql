-- Moves the "assessment" status (shown as "Take assessment") to between wishlist and applied.
-- Existing rows keep their status; MySQL maps ENUM values by name when the order changes.
ALTER TABLE job_tracker.applications
    MODIFY status ENUM('wishlist', 'assessment', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')
    NOT NULL DEFAULT 'wishlist';
