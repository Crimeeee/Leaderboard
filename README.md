# GTA RP Operations Board

Custom, dependency-free faction intelligence board for a GTA RP server. It runs as a polished offline presentation or as a small Express/MySQL application.

## Included experience

- 25-row paginated faction board with type filters, search, sorting, score breakdowns, and top-faction dossiers.
- Faction detail dossiers: leader, roster, seasonal history, control record, territories, wins, and activity.
- Player ranking categories for influence, operations, territory control, and event wins.
- Live-style event calendar and result ledger, interactive district territory map, announcements/changelog, and season archive/hall of fame.
- Staff console for adding/editing faction names, colors, optional logo URLs, active state, and score categories. It persists to browser storage in offline/demo mode, so no database console is needed for a presentation.
- Optional MySQL persistence and protected staff API for deployed environments.

No external fonts, images, frontend libraries, or browser network dependency is required. Opening `public/index.html` directly uses built-in presentation data.

## Quick start

```bash
npm install
npm start
```

Visit `http://localhost:3000`. With no database environment variables, Express returns safe demo data. Alternatively, open `public/index.html` directly in a browser; the complete dashboard and local staff-demo edits work offline.

## MySQL setup

1. Create a fresh MySQL 8+ database account with only the privileges this application requires.
2. Run `schema.sql` with an account allowed to create the `gta_leaderboard` schema, or remove its first two lines and run the remaining SQL against your chosen schema.
3. Copy `.env.example` to `.env`, set the database values and a long, random `ADMIN_API_TOKEN`, then start the application.

`schema.sql` creates seasons, factions, roster members, territories and their history, event calendar/results, player rankings, announcements, and starter records. It is intended for a fresh install; apply an explicit migration before using it against an existing production schema.

## Configuration

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=leaderboard_user
DB_PASSWORD=replace-with-a-strong-password
DB_NAME=gta_leaderboard
DB_CONNECTION_LIMIT=5
SERVER_NAME=CITY OF CRIME
SERVER_SEASON=SEASON 01
ADMIN_API_TOKEN=replace-with-a-long-random-token

# Optional Discord readiness configuration; leaving all of these unset is supported.
DISCORD_WEBHOOK_URL=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
```

Never commit `.env`, credentials, admin tokens, Discord client secrets, or webhook URLs.

## API

Public endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Complete payload for factions, rankings, territories, events, announcements, and seasons |
| `GET` | `/api/leaderboard` | Lightweight faction standings and server identity |
| `GET` | `/api/factions/:id` | One faction with its territories, ranked members, and recorded wins |
| `GET` | `/api/health` | Reports demo mode or database connectivity |

Staff endpoints require `Authorization: Bearer <ADMIN_API_TOKEN>`, MySQL configuration, JSON input, and complete validated score values:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/factions` | Create a faction |
| `PUT` | `/api/admin/factions/:id` | Update name, type, color, optional HTTPS logo URL, scores, and active state |

Example:

```bash
curl -X PUT http://localhost:3000/api/admin/factions/1 ^
  -H "Authorization: Bearer YOUR_LONG_RANDOM_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Serbian Mafia\",\"type\":\"criminal\",\"color\":\"#c8182a\",\"logo\":\"\",\"operations\":1280,\"territory\":740,\"events\":420,\"support\":190,\"isActive\":true}"
```

For the deployed staff console, place the same token in browser session storage under `operationsBoardAdminToken` through your own authenticated staff shell. The included UI deliberately does not ask users to type or store a production secret.

## Discord preparation

Discord is **not active by default**. The dashboard advertises only whether environment variables are present. `GET /auth/discord` builds a Discord OAuth authorization redirect only after the client ID, secret, and redirect URI are configured. Its callback intentionally returns `501` until a production session provider and verified state/code exchange are implemented. A webhook URL is reserved in configuration for server-side notification wiring; this project does not send webhooks by itself. Do not describe either integration as live until those deployment-specific pieces are completed.

## Project structure

```text
public/
  index.html             Single-page presentation shell
  css/style.css          Responsive red/black visual system
  js/demo-data.js        Offline presentation records
  js/leaderboard.js      Dashboard, staff demo, and API UI
server.js                Express API and safe MySQL integration
schema.sql               Fresh-install MySQL schema and starter data
.env.example             Private configuration template
```

## Validation

Run syntax checks after changes:

```bash
node --check server.js
node --check public/js/demo-data.js
node --check public/js/leaderboard.js
```
