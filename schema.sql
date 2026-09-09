CREATE DATABASE IF NOT EXISTS gta_leaderboard
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE gta_leaderboard;

CREATE TABLE IF NOT EXISTS factions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    type ENUM('criminal', 'government', 'civilian') NOT NULL,
    color CHAR(7) NOT NULL DEFAULT '#c8182a',
    operations INT UNSIGNED NOT NULL DEFAULT 0,
    territory INT UNSIGNED NOT NULL DEFAULT 0,
    events INT UNSIGNED NOT NULL DEFAULT 0,
    support INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY factions_name_unique (name),
    KEY factions_active_score (is_active, operations, territory, events, support)
);

INSERT INTO factions (name, type, color, operations, territory, events, support) VALUES
    ('Serbian Mafia', 'criminal', '#c8182a', 1280, 740, 420, 190),
    ('Los Santos Police', 'government', '#3b75c9', 1160, 690, 510, 245),
    ('The Families', 'criminal', '#5f9d4e', 1050, 630, 350, 165),
    ('Los Santos EMS', 'government', '#df4d57', 900, 470, 390, 320),
    ('Italian Syndicate', 'criminal', '#b68a42', 840, 530, 290, 110),
    ('Downtown Customs', 'civilian', '#8c57b8', 710, 380, 260, 205),
    ('Peaky Blinders', 'criminal', '#a6684a', 690, 450, 170, 95),
    ('San Andreas News', 'civilian', '#329ba8', 510, 240, 330, 180)
ON DUPLICATE KEY UPDATE
    type = VALUES(type),
    color = VALUES(color),
    operations = VALUES(operations),
    territory = VALUES(territory),
    events = VALUES(events),
    support = VALUES(support),
    is_active = TRUE;
