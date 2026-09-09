# GTA RP Operations Board

A red-and-black public portal for a GTA RP server. It provides faction standings, faction dossiers, player rankings, territory control, events, announcements, and a seasonal Hall of Fame.

The project has two modes:

- **Offline presentation mode:** open `public/index.html` directly in a browser. It uses included demo records and needs no Node.js, MySQL, Discord, or internet connection.
- **Production mode:** run the Express server with MySQL configured. The website then reads real data from its API.

## Features

- Paginated faction leaderboard with type filters, search, and sort controls
- Top-faction cards and individual faction dossiers
- Player rankings for influence, operations, territory control, and event wins
- Interactive district territory board
- Upcoming events and verified results
- Announcements, patch notes, seasonal archive, and Hall of Fame
- Demo staff console with browser-local edits for presentations
- Lightweight Node.js and MySQL production foundation

## Presentation quick start

For a presentation, open this file in Chrome, Edge, or another modern browser:

```text
public/index.html
```

It immediately loads 32 demo factions. You can test faction cards, the full board, filters, search, sorting, pagination, faction detail pages, territory map, event calendar, bulletin, season archive, and local demo edits in **Staff**.

Demo staff edits are stored only in that browser's local storage. They do not change source files, the server, or MySQL. Clear the browser's site data to reset them.

## Production quick start

### 1. Requirements

- Node.js 18 or newer
- MySQL 8 or newer
- A separate MySQL account for this application

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

For a new install, run `schema.sql` using an account allowed to create the schema:

```bash
mysql -u root -p < schema.sql
```

`schema.sql` includes starter records. Do not run it unreviewed against an existing production database; use a proper migration instead.

### 4. Configure environment variables

Copy `.env.example` to `.env`, then fill in the values:

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

# Optional Discord configuration. Leave blank until Discord is implemented.
DISCORD_WEBHOOK_URL=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
```

Generate `ADMIN_API_TOKEN` with a password manager or a cryptographically secure random generator. Never commit `.env`, database passwords, tokens, client secrets, or webhook URLs.

### 5. Run the app

```bash
npm start
```

Open `http://localhost:3000`. The health endpoint is available at `http://localhost:3000/api/health`.

## API reference

### Public endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Complete portal payload: factions, rankings, territories, events, announcements, and seasons |
| `GET` | `/api/leaderboard` | Lightweight faction standings and server identity |
| `GET` | `/api/factions/:id` | One faction with territories, ranked members, and recorded wins |
| `GET` | `/api/health` | Confirms demo mode or MySQL connectivity |

### Protected faction-management endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/factions` | Create a faction |
| `PUT` | `/api/admin/factions/:id` | Update all faction values |

Both endpoints require the `ADMIN_API_TOKEN` as a Bearer token, server-to-server only. Do **not** put this token in frontend JavaScript, browser storage, a public website, or a Discord bot.

Example request:

```bash
curl -X PUT http://localhost:3000/api/admin/factions/1 \
  -H "Authorization: Bearer YOUR_ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Serbian Mafia\",\"type\":\"criminal\",\"color\":\"#c8182a\",\"logo\":\"\",\"operations\":1280,\"territory\":740,\"events\":420,\"support\":190,\"isActive\":true}"
```

## GTA RP server integration

The portal is framework-independent. Once the GTA RP server framework and its faction resource are chosen, the developer must write the connector. It should be the only component that decides when a game event earns points.

Recommended flow:

```text
GTA RP faction/event resource
        |
        | verified game events and score changes
        v
Server-side integration service
        |
        | protected API request or direct MySQL write
        v
Operations Board MySQL database
        |
        v
Node.js API -> public portal
```

The connector should:

1. Create a faction record when an approved in-game faction is created.
2. Update faction metadata when its name, leader, color, roster, or active status changes.
3. Update scores only after the game server verifies an operation, territory capture, event result, or support activity.
4. Record territory ownership, event outcomes, player leaderboard values, and season winners in the corresponding tables.
5. Use a private server-side credential; never call the protected API from a game client or browser.

Because ESX, QBCore, vRP, and custom servers store faction data differently, no Lua connector is included. Adding one before the server framework is selected would not be reliable.

## Staff console and production security

The included **Staff** screen is deliberately a presentation tool. In offline/demo mode it saves only to browser-local storage.

Before using staff management in production, the developer must add a real authentication layer:

1. Authenticate approved staff through a server-side session, preferably Discord OAuth with role validation.
2. Authorize only specific staff roles.
3. Make the server-side staff route call the protected admin API or database.
4. Keep `ADMIN_API_TOKEN` exclusively on the server.
5. Add audit logging for score and faction changes.

## Discord status

Discord is not active by default. The environment variables only reserve configuration for a future implementation.

- `GET /auth/discord` can build an authorization redirect once Discord credentials are supplied.
- The OAuth callback intentionally returns `501` until a developer implements secure state validation, code exchange, user session storage, and role checks.
- The webhook setting is reserved for server-side notification wiring; this project does not post Discord webhooks by itself.

Do not describe Discord authentication or notifications as live until those pieces are implemented and tested.

## Project structure

```text
public/
  index.html             Portal markup
  css/style.css          Responsive red-and-black visual system
  js/demo-data.js        Offline presentation data
  js/leaderboard.js      Portal interaction and rendering logic
server.js                Express API and MySQL connection
schema.sql               Fresh-install MySQL schema and starter data
.env.example             Configuration template
```

## Developer validation

Run these after changes:

```bash
node --check server.js
node --check public/js/demo-data.js
node --check public/js/leaderboard.js
```

Then run `npm start` and check:

```text
http://localhost:3000/
http://localhost:3000/api/health
http://localhost:3000/api/dashboard
```
