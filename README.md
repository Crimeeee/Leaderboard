# GTA RP Operations Board

A responsive, custom leaderboard for GTA Roleplay factions, teams, departments, and civilian organizations.

## Features

- Faction standings for operations, territory, events, and support
- Filters for criminal, government, and civilian organizations
- Search and sorting by score, name, or activity
- Custom pagination that renders 25 factions at a time for responsive performance with large leaderboards
- Custom faction dossiers for the top three factions, with generated insignia and configurable team colors
- Live summary cards for the leading faction and city-wide activity
- Responsive layout for desktop and mobile browsers

## Presentation mode

Run `npm start` immediately to present the website at `http://localhost:3000`. Without a `.env` file, the application automatically uses safe, built-in demo data. The protected admin endpoints are disabled in demo mode.

You can also open `public/index.html` directly in a browser for an offline presentation. It automatically displays demo factions when the Node.js API is unavailable. Use `npm start` for the production/API version.

## Production setup

## Project structure

```text
public/
  index.html             Website markup
  css/style.css          Custom public styling
  js/leaderboard.js      Leaderboard UI logic
server.js                Node.js API and static-file server
schema.sql               MySQL schema and starter data
.env                     Private production configuration
```

1. Create a MySQL database and run `schema.sql`.
2. Copy `.env.example` to `.env` and fill in your database credentials.
3. Install dependencies with `npm install`.
4. Start the website and API with `npm start`.

The website is then available at `http://localhost:3000`. The public data endpoint is `GET /api/leaderboard`.

## Developer API

The public `GET /api/leaderboard` endpoint returns the active factions and server branding. `GET /api/health` verifies that Node.js can reach MySQL, which is useful for hosting monitors.

Management endpoints require an `Authorization: Bearer <ADMIN_API_TOKEN>` header. Keep this token private and generate a long random value before production use.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/factions` | Create a faction |
| `PUT` | `/api/admin/factions/:id` | Replace a faction's name, type, scores, and active state |

Example update request:

```bash
curl -X PUT http://localhost:3000/api/admin/factions/1 \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Serbian Mafia\",\"type\":\"criminal\",\"operations\":1280,\"territory\":740,\"events\":420,\"support\":190,\"isActive\":true}"
```

## Managing data

Every faction has a `name`, `type`, `operations`, `territory`, `events`, and `support` value. The total score is calculated automatically from the four score columns.

The initial faction data is included in `schema.sql`. A developer can update the records through the protected API, an admin panel, or a direct MySQL integration with the game server.

Never commit the `.env` file because it contains database credentials.

## License

MIT. See [LICENSE](LICENSE).
