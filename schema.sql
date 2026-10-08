CREATE DATABASE IF NOT EXISTS job_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_tracker;

CREATE TABLE IF NOT EXISTS applications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    company         VARCHAR(200) NOT NULL,
    role            VARCHAR(200) NOT NULL,
    url             VARCHAR(1000),
    location        VARCHAR(200),
    work_mode       ENUM('onsite', 'hybrid', 'remote'),
    status          ENUM('wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn')
                    NOT NULL DEFAULT 'wishlist',
    date_applied    DATE,
    deadline        DATE,
    salary_range    VARCHAR(100),
    contact         VARCHAR(300),
    resume_version  VARCHAR(100),
    next_action     VARCHAR(300),
    next_action_date DATE,
    notes           TEXT,
    job_description MEDIUMTEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_next_action_date (next_action_date)
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
