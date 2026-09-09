const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = Number(process.env.PORT || 3000);
const databaseEnabled = ["DB_HOST", "DB_USER", "DB_NAME"].every((setting) => process.env[setting]);
const factionTypes = ["criminal", "government", "civilian"];
const pool = databaseEnabled ? mysql.createPool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5), queueLimit: 0
}) : null;

function demoDashboard() {
    const rows = [
        ["Serbian Mafia", "criminal", "#c8182a", 1280, 740, 420, 190], ["Los Santos Police", "government", "#3b75c9", 1160, 690, 510, 245],
        ["The Families", "criminal", "#5f9d4e", 1050, 630, 350, 165], ["Los Santos EMS", "government", "#df4d57", 900, 470, 390, 320],
        ["Italian Syndicate", "criminal", "#b68a42", 840, 530, 290, 110], ["Downtown Customs", "civilian", "#8c57b8", 710, 380, 260, 205],
        ["Peaky Blinders", "criminal", "#a6684a", 690, 450, 170, 95], ["San Andreas News", "civilian", "#329ba8", 510, 240, 330, 180]
    ];
    const extraFactions = [
        ["Ballas", "criminal", "#8655d6"], ["Vagos", "criminal", "#d0a622"], ["Lost MC", "criminal", "#a9a9a9"], ["Marabunta Grande", "criminal", "#35a2c7"],
        ["The Triads", "criminal", "#cd4338"], ["Los Santos Sheriff", "government", "#af8753"], ["Department of Justice", "government", "#e0bf72"], ["San Andreas Dispatch", "government", "#77a7bd"],
        ["Los Santos Fire Rescue", "government", "#e75a3e"], ["City Hall", "government", "#4d97be"], ["Weazel News", "civilian", "#c73c43"], ["Premium Deluxe Motorsport", "civilian", "#e38a38"],
        ["Benny's Original Motor Works", "civilian", "#d75b39"], ["Los Santos Taxi", "civilian", "#deb839"], ["The Vanilla Unicorn", "civilian", "#d25191"], ["Bahama Mamas", "civilian", "#b54c93"],
        ["Galaxy Nightclub", "civilian", "#624fb3"], ["Redline Racing", "civilian", "#cf3c31"], ["The Cartel", "criminal", "#bc4b37"], ["Yakuza", "criminal", "#b64749"],
        ["The Brotherhood", "criminal", "#7e6b58"], ["Gruppe Sechs", "government", "#526f8a"], ["Los Santos Tow", "civilian", "#d39336"], ["Pacific Bluffs Security", "civilian", "#4f8491"]
    ];
    extraFactions.forEach((row, index) => rows.push([...row, Math.max(180, 690 - index * 22), Math.max(70, 450 - index * 14), Math.max(95, 260 - index * 6), Math.max(60, 180 - index * 3)]));
    const factions = rows.map((row, index) => ({ id: index + 1, name: row[0], type: row[1], color: row[2], operations: row[3], territory: row[4], events: row[5], support: row[6], leader: ["Milan Petrovic", "Chief Maya Torres", "Dre Wallace", "Dr. Harper Quinn"][index] || "Faction Command", members: Math.max(8, 34 - index), wins: Math.max(1, 18 - Math.floor(index / 2)), founded: "Season 01", logo: "" }));
    const districts = ["Vespucci Canals", "Little Seoul", "Mirror Park", "La Mesa", "Rancho", "Strawberry", "Del Perro", "Pillbox Hill"];
    return {
        server: { name: process.env.SERVER_NAME || "CITY OF CRIME", season: process.env.SERVER_SEASON || "SEASON 01", discord: { enabled: Boolean(process.env.DISCORD_WEBHOOK_URL), oauthReady: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) } },
        factions,
        territories: districts.map((name, index) => ({ id: index + 1, name, factionId: (index % factions.length) + 1, value: 50 + index * 10, contested: index === 3, lastContest: index % 2 ? "2h ago" : "Yesterday" })),
        players: factions.slice(0, 6).map((faction, index) => ({ name: faction.leader, factionId: faction.id, influence: 988 - index * 74, operations: 78 - index * 5, territories: 6 - Math.floor(index / 2), events: 11 - index })),
        events: [
            { id: 1, title: "Dockyard Arms Run", startsAt: "2026-09-12T20:00:00", status: "upcoming", location: "Terminal", format: "Faction operation", participants: "Open to criminal factions" },
            { id: 2, title: "City Council Security Detail", startsAt: "2026-09-14T18:30:00", status: "upcoming", location: "City Hall", format: "Public event", participants: "Government & civilian" },
            { id: 3, title: "Rancho Takeover", startsAt: "2026-09-08T21:00:00", status: "complete", winnerId: 1, score: "3–1", location: "Rancho", format: "Territory war" }
        ],
        announcements: [
            { date: "SEP 09", tag: "LIVE", title: "Territory scoring refresh is active", body: "District control updates after verified contests and staff review." },
            { date: "SEP 07", tag: "PATCH 1.2", title: "Event result ledger added", body: "Completed events now record winners, format, and final score." }
        ],
        seasons: [{ name: "Season 01", state: "LIVE", winner: "In progress", score: "—", note: "Current city campaign" }, { name: "Preseason Trials", state: "ARCHIVED", winner: "Serbian Mafia", score: "2,410 pts", note: "Founders' Cup winner" }]
    };
}

function validId(value) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function isScore(value) { return Number.isSafeInteger(value) && value >= 0 && value <= 100000000; }
function validFaction(payload, complete) {
    const scores = ["operations", "territory", "events", "support"];
    if (typeof payload.name !== "string" || !payload.name.trim() || payload.name.trim().length > 80 || !factionTypes.includes(payload.type) || !/^#[0-9a-f]{6}$/i.test(payload.color) || !scores.every((key) => isScore(payload[key]))) { return false; }
    return !complete || typeof payload.isActive === "boolean";
}
function safeLogo(value) { return typeof value === "undefined" || (typeof value === "string" && value.length <= 255 && (!value || /^https:\/\/[^\s]+$/i.test(value))); }
function adminToken(request) {
    const token = (request.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const configured = process.env.ADMIN_API_TOKEN;
    if (!token || !configured) { return false; }
    const expected = Buffer.from(configured); const received = Buffer.from(token);
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
function requireAdmin(request, response, next) {
    if (!databaseEnabled || !process.env.ADMIN_API_TOKEN) { return response.status(503).json({ error: "The admin API requires MySQL and ADMIN_API_TOKEN." }); }
    if (!adminToken(request)) { return response.status(401).json({ error: "A valid administrator token is required." }); }
    return next();
}

async function databaseDashboard() {
    const [factions] = await pool.execute(`SELECT f.id, f.name, f.type, f.color, f.logo, f.operations, f.territory, f.events, f.support, f.is_active AS isActive,
        COALESCE(l.name, 'Faction Command') AS leader, (SELECT COUNT(*) FROM faction_members m WHERE m.faction_id = f.id AND m.is_active = 1) AS members,
        (SELECT COUNT(*) FROM events e WHERE e.winner_faction_id = f.id AND e.status = 'complete') AS wins, s.name AS founded
        FROM factions f LEFT JOIN faction_members l ON l.faction_id = f.id AND l.role = 'leader' AND l.is_active = 1
        LEFT JOIN seasons s ON s.id = f.season_id WHERE f.is_active = 1 ORDER BY (f.operations + f.territory + f.events + f.support) DESC, f.name`);
    const [territories] = await pool.execute("SELECT id, name, faction_id AS factionId, control_value AS value, is_contested AS contested, DATE_FORMAT(updated_at, '%b %e') AS lastContest FROM territories WHERE is_active = 1 ORDER BY id");
    const [players] = await pool.execute("SELECT name, faction_id AS factionId, influence, operations, territories, event_wins AS events FROM player_rankings WHERE season_id = (SELECT id FROM seasons WHERE is_current = 1 LIMIT 1) ORDER BY influence DESC LIMIT 100");
    const [events] = await pool.execute("SELECT id, title, DATE_FORMAT(starts_at, '%Y-%m-%dT%H:%i:%s') AS startsAt, status, location, format, participants, winner_faction_id AS winnerId, result_score AS score FROM events WHERE starts_at >= DATE_SUB(NOW(), INTERVAL 45 DAY) ORDER BY starts_at DESC LIMIT 50");
    const [announcements] = await pool.execute("SELECT DATE_FORMAT(published_at, '%b %e') AS date, tag, title, body FROM announcements WHERE is_published = 1 ORDER BY published_at DESC LIMIT 20");
    const [seasons] = await pool.execute("SELECT s.name, IF(s.is_current, 'LIVE', 'ARCHIVED') AS state, COALESCE(f.name, 'In progress') AS winner, COALESCE(s.winner_score, '—') AS score, s.description AS note FROM seasons s LEFT JOIN factions f ON f.id = s.winner_faction_id ORDER BY s.starts_at DESC LIMIT 20");
    return { server: { name: process.env.SERVER_NAME || "CITY OF CRIME", season: process.env.SERVER_SEASON || "SEASON 01", discord: { enabled: Boolean(process.env.DISCORD_WEBHOOK_URL), oauthReady: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) } }, factions, territories, players, events, announcements, seasons };
}
async function dashboard() { return databaseEnabled ? databaseDashboard() : demoDashboard(); }

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "16kb" }));
app.get("/api/dashboard", async (_request, response, next) => { try { response.json(await dashboard()); } catch (error) { next(error); } });
app.get("/api/leaderboard", async (_request, response, next) => { try { const data = await dashboard(); response.json({ server: data.server, factions: data.factions }); } catch (error) { next(error); } });
app.get("/api/factions/:id", async (request, response, next) => {
    const id = validId(request.params.id); if (!id) { return response.status(400).json({ error: "Invalid faction id." }); }
    try { const data = await dashboard(); const faction = data.factions.find((item) => item.id === id); if (!faction) { return response.status(404).json({ error: "Faction not found." }); } return response.json({ faction, territories: data.territories.filter((item) => item.factionId === id), members: data.players.filter((item) => item.factionId === id), wins: data.events.filter((item) => item.winnerId === id) }); } catch (error) { return next(error); }
});
app.get("/api/health", async (_request, response, next) => { try { if (!databaseEnabled) { return response.json({ status: "demo", database: "not configured" }); } await pool.query("SELECT 1"); return response.json({ status: "ok", database: "connected" }); } catch (error) { return next(error); } });

app.post("/api/admin/factions", requireAdmin, async (request, response, next) => {
    if (!validFaction(request.body) || !safeLogo(request.body.logo)) { return response.status(400).json({ error: "Provide a name, type, hex color, optional HTTPS logo, and non-negative integer scores." }); }
    const { name, type, color, logo = "", operations, territory, events, support } = request.body;
    try { const [result] = await pool.execute("INSERT INTO factions (name, type, color, logo, operations, territory, events, support) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [name.trim(), type, color, logo, operations, territory, events, support]); return response.status(201).json({ id: result.insertId }); } catch (error) { return next(error); }
});
app.put("/api/admin/factions/:id", requireAdmin, async (request, response, next) => {
    const id = validId(request.params.id); if (!id || !validFaction(request.body, true) || !safeLogo(request.body.logo)) { return response.status(400).json({ error: "Provide a complete valid faction record." }); }
    const { name, type, color, logo = "", operations, territory, events, support, isActive } = request.body;
    try { const [result] = await pool.execute("UPDATE factions SET name=?, type=?, color=?, logo=?, operations=?, territory=?, events=?, support=?, is_active=? WHERE id=?", [name.trim(), type, color, logo, operations, territory, events, support, isActive, id]); if (!result.affectedRows) { return response.status(404).json({ error: "Faction not found." }); } return response.status(204).end(); } catch (error) { return next(error); }
});

app.get("/auth/discord", (request, response) => {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.DISCORD_REDIRECT_URI) { return response.status(503).json({ error: "Discord OAuth is not configured. Set Discord environment variables to enable it." }); }
    const state = crypto.randomBytes(24).toString("hex");
    response.cookie("discord_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600000 });
    const params = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, redirect_uri: process.env.DISCORD_REDIRECT_URI, response_type: "code", scope: "identify guilds", state });
    return response.redirect(`https://discord.com/oauth2/authorize?${params}`);
});
app.get("/auth/discord/callback", (_request, response) => response.status(501).json({ error: "OAuth callback exchange must be connected to your session provider before production use." }));

app.use((error, _request, response, _next) => {
    console.error("Operations Board error:", error);
    if (error.code === "ER_DUP_ENTRY") { return response.status(409).json({ error: "A record with that name already exists." }); }
    return response.status(500).json({ error: "The server could not complete this request." });
});
async function start() { if (databaseEnabled) { await pool.query("SELECT 1"); } app.listen(port, () => console.log(`Operations Board is running in ${databaseEnabled ? "MySQL" : "demo"} mode at http://localhost:${port}`)); }
start().catch((error) => { console.error("Unable to connect to MySQL:", error); process.exitCode = 1; });
