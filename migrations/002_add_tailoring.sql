-- Adds job description storage and generated application materials.
ALTER TABLE job_tracker.applications ADD COLUMN job_description MEDIUMTEXT AFTER notes;

CREATE TABLE IF NOT EXISTS job_tracker.materials (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    application_id  INT NOT NULL,
    kind            VARCHAR(50) NOT NULL,
    docx_path       VARCHAR(1000),
    pdf_path        VARCHAR(1000),
    slot_values     JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
