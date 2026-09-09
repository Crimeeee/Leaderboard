const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = Number(process.env.PORT || 3000);

const requiredDatabaseSettings = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingSettings = requiredDatabaseSettings.filter((setting) => !process.env[setting]);
const databaseEnabled = missingSettings.length === 0;
const demoLeaderboard = {
    server: { name: "CITY OF CRIME", season: "SEASON 01" },
    factions: [
        ["Serbian Mafia", "criminal", "#c8182a", 1280, 740, 420, 190],
        ["Los Santos Police", "government", "#3b75c9", 1160, 690, 510, 245],
        ["The Families", "criminal", "#5f9d4e", 1050, 630, 350, 165],
        ["Los Santos EMS", "government", "#df4d57", 900, 470, 390, 320],
        ["Italian Syndicate", "criminal", "#b68a42", 840, 530, 290, 110],
        ["Downtown Customs", "civilian", "#8c57b8", 710, 380, 260, 205],
        ["Peaky Blinders", "criminal", "#a6684a", 690, 450, 170, 95],
        ["San Andreas News", "civilian", "#329ba8", 510, 240, 330, 180],
        ["Ballas", "criminal", "#8655d6", 620, 395, 220, 82],
        ["Vagos", "criminal", "#d0a622", 585, 408, 180, 91],
        ["Lost MC", "criminal", "#a9a9a9", 560, 370, 190, 65],
        ["Marabunta Grande", "criminal", "#35a2c7", 535, 340, 155, 78],
        ["The Triads", "criminal", "#cd4338", 510, 320, 175, 80],
        ["Los Santos Sheriff", "government", "#af8753", 490, 285, 230, 165],
        ["Department of Justice", "government", "#e0bf72", 440, 260, 270, 215],
        ["San Andreas Dispatch", "government", "#77a7bd", 430, 210, 240, 195],
        ["Los Santos Fire Rescue", "government", "#e75a3e", 405, 185, 215, 205],
        ["City Hall", "government", "#4d97be", 360, 150, 295, 180],
        ["Weazel News", "civilian", "#c73c43", 350, 160, 280, 172],
        ["Premium Deluxe Motorsport", "civilian", "#e38a38", 330, 190, 155, 200],
        ["Benny's Original Motor Works", "civilian", "#d75b39", 315, 185, 145, 187],
        ["Los Santos Taxi", "civilian", "#deb839", 300, 115, 175, 180],
        ["The Vanilla Unicorn", "civilian", "#d25191", 285, 120, 195, 145],
        ["Bahama Mamas", "civilian", "#b54c93", 270, 110, 180, 150],
        ["Galaxy Nightclub", "civilian", "#624fb3", 260, 135, 170, 128],
        ["Redline Racing", "civilian", "#cf3c31", 245, 150, 160, 105],
        ["The Cartel", "criminal", "#bc4b37", 440, 285, 120, 68],
        ["Yakuza", "criminal", "#b64749", 415, 270, 110, 64],
        ["The Brotherhood", "criminal", "#7e6b58", 390, 240, 130, 72],
        ["Gruppe Sechs", "government", "#526f8a", 265, 95, 135, 190],
        ["Los Santos Tow", "civilian", "#d39336", 220, 100, 150, 155],
        ["Pacific Bluffs Security", "civilian", "#4f8491", 205, 80, 130, 172]
    ].map(([name, type, color, operations, territory, events, support], index) => ({
        id: index + 1, name, type, color, operations, territory, events, support
    }))
};

const pool = databaseEnabled
    ? mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
        queueLimit: 0
    })
    : null;

app.use(express.static(__dirname));
app.use(express.json({ limit: "16kb" }));

function isValidFactionType(type) {
    return ["criminal", "government", "civilian"].includes(type);
}

function isNonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0;
}

function hasAdminAccess(request) {
    const token = request.get("authorization")?.replace(/^Bearer\s+/i, "");
    const configuredToken = process.env.ADMIN_API_TOKEN;

    if (!configuredToken || !token) {
        return false;
    }

    const expected = Buffer.from(configuredToken);
    const received = Buffer.from(token);
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function requireAdminAccess(request, response, next) {
    if (!databaseEnabled) {
        return response.status(503).json({ error: "Admin API is unavailable while demo mode is active." });
    }
    if (!process.env.ADMIN_API_TOKEN) {
        return response.status(503).json({ error: "Admin API is not configured." });
    }
    if (!hasAdminAccess(request)) {
        return response.status(401).json({ error: "Valid administrator credentials are required." });
    }
    next();
}

app.get("/api/leaderboard", async (_request, response, next) => {
    if (!databaseEnabled) {
        return response.json(demoLeaderboard);
    }

    try {
        const [factions] = await pool.execute(`
            SELECT id, name, type, color, operations, territory, events, support
            FROM factions
            WHERE is_active = 1
            ORDER BY (operations + territory + events + support) DESC, name ASC
        `);

        response.json({
            server: {
                name: process.env.SERVER_NAME || "CITY OF CRIME",
                season: process.env.SERVER_SEASON || "SEASON 01"
            },
            factions
        });
    } catch (error) {
        next(error);
    }
});

app.get("/api/health", async (_request, response, next) => {
    if (!databaseEnabled) {
        return response.json({ status: "demo", database: "not configured" });
    }

    try {
        await pool.query("SELECT 1");
        response.json({ status: "ok" });
    } catch (error) {
        next(error);
    }
});

app.post("/api/admin/factions", requireAdminAccess, async (request, response, next) => {
    const { name, type, color = "#c8182a", operations = 0, territory = 0, events = 0, support = 0 } = request.body;
    const values = [operations, territory, events, support];

    if (typeof name !== "string" || !name.trim() || name.length > 80 || !isValidFactionType(type) || !/^#[0-9a-fA-F]{6}$/.test(color) || !values.every(isNonNegativeInteger)) {
        return response.status(400).json({ error: "Provide a name, valid type, hex color, and non-negative integer scores." });
    }

    try {
        const [result] = await pool.execute(
            "INSERT INTO factions (name, type, color, operations, territory, events, support) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name.trim(), type, color, ...values]
        );
        response.status(201).json({ id: result.insertId });
    } catch (error) {
        next(error);
    }
});

app.put("/api/admin/factions/:id", requireAdminAccess, async (request, response, next) => {
    const factionId = Number(request.params.id);
    const { name, type, color, operations, territory, events, support, isActive } = request.body;
    const values = [operations, territory, events, support];

    if (!Number.isSafeInteger(factionId) || factionId < 1 || typeof name !== "string" || !name.trim() || name.length > 80 ||
        !isValidFactionType(type) || !/^#[0-9a-fA-F]{6}$/.test(color) || !values.every(isNonNegativeInteger) || typeof isActive !== "boolean") {
        return response.status(400).json({ error: "Provide a complete valid faction record." });
    }

    try {
        const [result] = await pool.execute(
            "UPDATE factions SET name = ?, type = ?, color = ?, operations = ?, territory = ?, events = ?, support = ?, is_active = ? WHERE id = ?",
            [name.trim(), type, color, ...values, isActive, factionId]
        );
        if (result.affectedRows === 0) {
            return response.status(404).json({ error: "Faction not found." });
        }
        response.status(204).end();
    } catch (error) {
        next(error);
    }
});

app.use((error, _request, response, _next) => {
    console.error("Unable to load leaderboard:", error);
    if (error.code === "ER_DUP_ENTRY") {
        return response.status(409).json({ error: "A faction with this name already exists." });
    }
    response.status(500).json({ error: "The server could not complete this request." });
});

async function startServer() {
    if (databaseEnabled) {
        await pool.query("SELECT 1");
    }
    app.listen(port, () => {
        const mode = databaseEnabled ? "MySQL" : "demo";
        console.log(`Operations Board is running in ${mode} mode at http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("Unable to connect to MySQL:", error);
    process.exitCode = 1;
});
