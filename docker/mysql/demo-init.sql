CREATE TABLE `demo_environment` (
    `id` TINYINT NOT NULL,
    `marker` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `marker` (`marker`),
    CONSTRAINT `demo_environment_single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `demo_environment` (`id`, `marker`)
VALUES (1, 'studentjob-isolated-demo');

CREATE TABLE `demo_user_profiles` (
    `user_id` INT NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `class_year` VARCHAR(50) NOT NULL,
    `city` VARCHAR(100) DEFAULT NULL,
    `skills` JSON DEFAULT NULL,
    `profile_description` TEXT DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `demo_user_profiles_user_fk`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `demo_company_profiles` (
    `user_id` INT NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `company_name` (`company_name`),
    CONSTRAINT `demo_company_profiles_user_fk`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
