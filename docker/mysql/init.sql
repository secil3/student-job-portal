CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'employer', 'admin') NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `is_verified` TINYINT(1) DEFAULT 0,
    `email_verification_token_hash` CHAR(64) DEFAULT NULL,
    `email_verification_token_expires` DATETIME DEFAULT NULL,
    `resume_path` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `deactivated_at` DATETIME DEFAULT NULL,
    `university` VARCHAR(255) DEFAULT NULL,
    `major` VARCHAR(255) DEFAULT NULL,
    `GPA` DECIMAL(3,2) DEFAULT NULL,
    `reset_token` VARCHAR(255) DEFAULT NULL,
    `reset_token_expires` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `company_profiles` (
    `user_id` INT NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `company_profiles_user_fk`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `jobs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `employer_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `location` VARCHAR(100) DEFAULT NULL,
    `salary` VARCHAR(50) DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `deactivated_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `employer_id` (`employer_id`),
    CONSTRAINT `jobs_ibfk_1`
        FOREIGN KEY (`employer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `resumes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `resumes_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `applications` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `job_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    `applied_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `resume_id` INT DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_application` (`job_id`, `student_id`),
    KEY `student_id` (`student_id`),
    KEY `fk_app_resume` (`resume_id`),
    CONSTRAINT `applications_ibfk_1`
        FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `applications_ibfk_2`
        FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_app_resume`
        FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
