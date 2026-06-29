-- Creazione del database (se non esiste, sebbene configurato nel compose)
CREATE DATABASE IF NOT EXISTS `calendar_db`;
USE `calendar_db`;

-- -----------------------------------------------------
-- Tabella: USER (Gestione utenti/creatori di lessoni)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `cell_number` VARCHAR(20) NOT NULL,
    `fitp_card` VARCHAR(30) NOT NULL,
    `enabled` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_user_email` (`email`),
    UNIQUE KEY `UK_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabella: LESSON (Gestione degli lezioni a calendario)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `lesson` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `description` TEXT,
    `start_time` DATETIME(6) NOT NULL, -- Hibernate mappa i LocalDateTime con precisione fino a (6) microsecondi
    `end_time` DATETIME(6) NOT NULL,
    `created_at` TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    `user_id` BIGINT,
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_lesson_user` FOREIGN KEY (`user_id`) 
        REFERENCES `user` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Tabella di Join: lesson_PARTICIPANTS (Molti-a-Molti)
-- Generata se in Hibernate usi @ManyToMany tra lesson e User per gli invitati
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_lesson` (
    `lesson_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    PRIMARY KEY (`lesson_id`, `user_id`),
    CONSTRAINT `FK_join_lesson` FOREIGN KEY (`lesson_id`) 
        REFERENCES `lessons` (`id`) 
        ON DELETE CASCADE,
    CONSTRAINT `FK_join_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Inserimento Dati di Test di Esempio (Opzionale)
-- -----------------------------------------------------
-- Inseriamo un utente di test (password fittizia)
INSERT INTO `user` (`id`, `username`, `email`, `password`, `enabled`) 
VALUES (1, 'admin', 'admin@calendar.com', '$2a$10$xyz...', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Inseriamo un lessono associato all'utente admin
INSERT INTO `lesson` (`id`, `title`, `description`, `start_time`, `end_time`, `location`, `user_id`) 
VALUES (1, 'Riunione Iniziale Progetto', 'Discussione architettura DB e Docker', '2026-07-01 10:00:00.000000', '2026-07-01 11:30:00.000000', 'Microsoft Teams', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;