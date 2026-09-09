CREATE DATABASE IF NOT EXISTS gta_leaderboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gta_leaderboard;

CREATE TABLE IF NOT EXISTS seasons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL DEFAULT '',
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    winner_faction_id INT UNSIGNED NULL,
    winner_score VARCHAR(40) NULL,
    KEY seasons_current (is_current, starts_at)
);

CREATE TABLE IF NOT EXISTS factions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NULL,
    name VARCHAR(80) NOT NULL,
    type ENUM('criminal', 'government', 'civilian') NOT NULL,
    color CHAR(7) NOT NULL DEFAULT '#c8182a',
    logo VARCHAR(255) NOT NULL DEFAULT '',
    operations INT UNSIGNED NOT NULL DEFAULT 0,
    territory INT UNSIGNED NOT NULL DEFAULT 0,
    events INT UNSIGNED NOT NULL DEFAULT 0,
    support INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY factions_name_unique (name),
    KEY factions_active_score (is_active, operations, territory, events, support),
    CONSTRAINT factions_season_fk FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS faction_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    faction_id INT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    role VARCHAR(40) NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY member_faction_name (faction_id, name),
    KEY members_faction_active (faction_id, is_active),
    CONSTRAINT members_faction_fk FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS territories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    faction_id INT UNSIGNED NULL,
    control_value INT UNSIGNED NOT NULL DEFAULT 0,
    is_contested BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY territories_active (is_active, faction_id),
    CONSTRAINT territories_faction_fk FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS territory_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    territory_id INT UNSIGNED NOT NULL,
    faction_id INT UNSIGNED NULL,
    event_note VARCHAR(255) NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY territory_history_lookup (territory_id, recorded_at),
    CONSTRAINT territory_history_territory_fk FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    CONSTRAINT territory_history_faction_fk FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    starts_at DATETIME NOT NULL,
    status ENUM('upcoming', 'complete', 'cancelled') NOT NULL DEFAULT 'upcoming',
    location VARCHAR(80) NOT NULL,
    format VARCHAR(80) NOT NULL,
    participants VARCHAR(160) NOT NULL DEFAULT '',
    winner_faction_id INT UNSIGNED NULL,
    result_score VARCHAR(40) NULL,
    UNIQUE KEY event_title_starts (title, starts_at),
    KEY events_schedule (starts_at, status),
    CONSTRAINT events_winner_fk FOREIGN KEY (winner_faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS player_rankings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    faction_id INT UNSIGNED NULL,
    name VARCHAR(80) NOT NULL,
    influence INT UNSIGNED NOT NULL DEFAULT 0,
    operations INT UNSIGNED NOT NULL DEFAULT 0,
    territories INT UNSIGNED NOT NULL DEFAULT 0,
    event_wins INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY player_season_unique (season_id, name),
    KEY player_ranking_score (season_id, influence),
    CONSTRAINT rankings_season_fk FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    CONSTRAINT rankings_faction_fk FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(32) NOT NULL DEFAULT 'NOTICE',
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY announcement_title_published (title, published_at),
    KEY announcements_public (is_published, published_at)
);

INSERT INTO seasons (name, description, starts_at, is_current)
VALUES ('Season 01', 'Current city campaign', '2026-09-01 00:00:00', TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description), is_current = VALUES(is_current);

INSERT INTO factions (season_id, name, type, color, operations, territory, events, support) VALUES
((SELECT id FROM seasons WHERE name = 'Season 01'), 'Serbian Mafia', 'criminal', '#c8182a', 1280, 740, 420, 190),
((SELECT id FROM seasons WHERE name = 'Season 01'), 'Los Santos Police', 'government', '#3b75c9', 1160, 690, 510, 245),
((SELECT id FROM seasons WHERE name = 'Season 01'), 'The Families', 'criminal', '#5f9d4e', 1050, 630, 350, 165),
((SELECT id FROM seasons WHERE name = 'Season 01'), 'Los Santos EMS', 'government', '#df4d57', 900, 470, 390, 320),
((SELECT id FROM seasons WHERE name = 'Season 01'), 'Italian Syndicate', 'criminal', '#b68a42', 840, 530, 290, 110),
((SELECT id FROM seasons WHERE name = 'Season 01'), 'Downtown Customs', 'civilian', '#8c57b8', 710, 380, 260, 205)
ON DUPLICATE KEY UPDATE type=VALUES(type), color=VALUES(color), operations=VALUES(operations), territory=VALUES(territory), events=VALUES(events), support=VALUES(support), is_active=TRUE;

INSERT INTO faction_members (faction_id, name, role) VALUES
((SELECT id FROM factions WHERE name='Serbian Mafia'), 'Milan Petrovic', 'leader'),
((SELECT id FROM factions WHERE name='Los Santos Police'), 'Chief Maya Torres', 'leader'),
((SELECT id FROM factions WHERE name='The Families'), 'Dre Wallace', 'leader')
ON DUPLICATE KEY UPDATE role=VALUES(role), is_active=TRUE;

INSERT INTO territories (name, faction_id, control_value, is_contested) VALUES
('Vespucci Canals', (SELECT id FROM factions WHERE name='Serbian Mafia'), 50, FALSE),
('Little Seoul', (SELECT id FROM factions WHERE name='The Families'), 60, FALSE),
('Mirror Park', (SELECT id FROM factions WHERE name='Los Santos Police'), 70, FALSE),
('La Mesa', (SELECT id FROM factions WHERE name='Los Santos EMS'), 80, TRUE)
ON DUPLICATE KEY UPDATE faction_id=VALUES(faction_id), control_value=VALUES(control_value), is_contested=VALUES(is_contested);

INSERT INTO events (title, starts_at, status, location, format, participants, winner_faction_id, result_score) VALUES
('Dockyard Arms Run', '2026-09-12 20:00:00', 'upcoming', 'Terminal', 'Faction operation', 'Open to criminal factions', NULL, NULL),
('City Council Security Detail', '2026-09-14 18:30:00', 'upcoming', 'City Hall', 'Public event', 'Government & civilian', NULL, NULL),
('Rancho Takeover', '2026-09-08 21:00:00', 'complete', 'Rancho', 'Territory war', '', (SELECT id FROM factions WHERE name='Serbian Mafia'), '3–1')
ON DUPLICATE KEY UPDATE status=VALUES(status), winner_faction_id=VALUES(winner_faction_id), result_score=VALUES(result_score);

INSERT INTO announcements (tag, title, body, published_at) VALUES
('LIVE', 'Territory scoring refresh is active', 'District control updates after verified contests and staff review.', '2026-09-09 12:00:00'),
('PATCH 1.2', 'Event result ledger added', 'Completed events now record winners, format, and final score.', '2026-09-07 12:00:00')
ON DUPLICATE KEY UPDATE tag=VALUES(tag), body=VALUES(body), is_published=TRUE;
