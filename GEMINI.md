# Gram2City — Server

## Overview

Express 5 REST API + Socket.io backend for the Gram2City logistics/parcel-delivery platform.  
Handles auth, parcel management, rider assignment, payments, real-time chat, and file uploads.

**Root path**: `gram2city-server/`  
**Dev server**: `npm run dev` (ts-node-dev, `--respawn --transpile-only`)  
**Package name**: `gram2city-server`  
**Deployed to**: Vercel (`vercel.json` present)  
**API version**: `2.3.0`  
**Swagger docs**: `GET /swagger`

---

## Tech Stack

| Concern      | Library / Version                                    |
| ------------ | ---------------------------------------------------- |
| Framework    | Express 5 (CommonJS)                                 |
| Language     | TypeScript 6                                         |
| Database     | MongoDB native driver v6                             |
| Auth         | Firebase Admin SDK v13 (JWT verification)            |
| Real-time    | Socket.io v4                                         |
| Payments     | Stripe v18                                           |
| File uploads | Multer v2                                            |
| API docs     | swagger-ui-express v5                                |
| Security     | Helmet, CORS, express-rate-limit (1000 req / 15 min) |
| Compression  | compression (gzip)                                   |
| Logging      | Morgan (via custom `logger` middleware)              |
| Validation   | Zod v4                                               |

---

## Source Structure (`src/`)

```
src/
├── app.ts                # Express app: middleware stack, routes, Swagger setup
├── server.ts             # HTTP server entry + Socket.io init
├── config/               # Env config (typed, validated)
├── db/                   # MongoDB connection helper
├── middleware/
│   ├── logger.ts         # Morgan request logger
│   ├── globalErrorHandler.ts  # Centralized error handler
│   └── (auth guards)     # Firebase token verification middleware
├── modules/              # Feature modules (MVC)
│   ├── app.routes.ts     # Root API router (mounts all modules)
│   ├── admin/            # Admin-only operations
│   ├── auth/             # Login, register, token refresh
│   ├── finance/          # Financial settings, Stripe integration
│   ├── parcel/           # Parcel CRUD, status updates
│   ├── public/           # Unauthenticated public endpoints
│   ├── rider/            # Rider deliveries, earnings
│   ├── support/          # Feedback / support tickets
│   └── user/             # User profile, addresses
├── socket/               # Socket.io event handlers (chat, live updates)
├── swagger/              # OpenAPI spec generation (`swaggerSpec`)
├── types/                # Shared server-side TypeScript types
└── utils/                # Utility helpers
```

---

## Key Conventions

- **Module pattern**: Each feature has its own folder with `router`, `controller`, and `service` files
- **Auth**: All protected routes use Firebase Admin token verification middleware (`Authorization: Bearer <token>`)
- **Error handling**: Always throw to `globalErrorHandler`; never send error responses inline in controllers
- **Validation**: Zod schemas on request body/query before hitting controller logic
- **Env**: All config loaded from `.env` via `src/config/` — never `process.env` directly in business logic
- **File naming**: camelCase for all server files
- **DB**: MongoDB native driver — no ODM (no Mongoose); collections accessed via helpers in `src/db/`

---

## Auth Flow

1. Client sends Firebase ID token in `Authorization: Bearer <token>` header
2. Auth middleware calls `admin.auth().verifyIdToken(token)`
3. Decoded token's UID is used to look up the user document in MongoDB
4. User role (`user` | `rider` | `admin`) is attached to `req.user` for downstream guards

---

## Environment Variables (`.env`)

| Variable                | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `PORT`                  | Express server port                          |
| `MONGO_URI`             | MongoDB Atlas connection string              |
| `CLIENT_URL`            | Comma-separated allowed CORS origins         |
| `FB_SERVICE_KEY`        | Base64-encoded Firebase service account JSON |
| `STRIPE_SECRET_KEY`     | Stripe secret key                            |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret                |

---

## API Overview

All routes mounted under `/` via `app.routes.ts`:

| Prefix     | Module     | Auth               |
| ---------- | ---------- | ------------------ |
| `/auth`    | auth       | Public + Protected |
| `/user`    | user       | User role          |
| `/rider`   | rider      | Rider role         |
| `/admin`   | admin      | Admin role         |
| `/parcel`  | parcel     | Mixed              |
| `/finance` | finance    | Admin role         |
| `/support` | support    | Mixed              |
| `/public`  | public     | None               |
| `/swagger` | Swagger UI | None               |

---

## Socket.io

- Initialized in `server.ts` alongside the HTTP server
- Event handlers in `src/socket/`
- Used for: real-time chat (`messages`), live parcel status updates for riders and users

---

## Notes

- Firebase service account loaded from `FB_SERVICE_KEY` (base64 env var), not from a file at runtime
- Rate limiter is set to 1000 req / 15 min (intentionally high to support dashboard polling + dev)
- `logs.txt` in root is generated at runtime — not committed to git
- The project was previously named **ZapShift**; package name is now `gram2city-server`
