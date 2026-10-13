CREATE DATABASE IF NOT EXISTS job_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_tracker;

CREATE TABLE IF NOT EXISTS applications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    company         VARCHAR(200) NOT NULL,
    role            VARCHAR(200) NOT NULL,
    url             VARCHAR(1000),
    location        VARCHAR(200),
    work_mode       ENUM('onsite', 'hybrid', 'remote'),
    status          ENUM('wishlist', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')
                    NOT NULL DEFAULT 'wishlist',
    date_applied    DATE,
    deadline        DATE,
    salary_range    VARCHAR(100),
    notes           TEXT,
    assessment      ENUM('Y', 'N') NOT NULL DEFAULT 'N',
    assessment_completed BOOLEAN NOT NULL DEFAULT FALSE,
    job_description MEDIUMTEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS materials (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    application_id  INT NOT NULL,
    kind            VARCHAR(50) NOT NULL,
    docx_path       VARCHAR(1000),
    pdf_path        VARCHAR(1000),
    slot_values     JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
