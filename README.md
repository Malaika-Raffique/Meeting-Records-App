# Ops Archive

Ops Archive is a secure, long-term record system for weekly operations meetings. It replaces editable Word-file history with structured, searchable records based on the company’s existing Weekly Ops Review template.

## What is included

- An Operations Manager can create, edit, publish, and archive weekly meeting records.
- Employees can sign in, search, filter, and view published records only.
- Every create, edit, publish, and archive operation saves an immutable version snapshot with the user, time, action, and changed fields.
- The form includes the current template’s recap, sales, marketing, hosting, projects, pipeline, live-products, plans, team check-in, knowledge session, quote, employee updates, action list, founders’ notes, and closing sections.
- The manager can create employee accounts and disable access. There is no public registration route.

## Stack

- **Client:** React, Vite, and custom CSS
- **API:** Node.js and Express
- **Database:** MongoDB Atlas through Mongoose
- **Security:** bcrypt password hashing, short-lived access tokens, hashed/rotated refresh tokens in `httpOnly` cookies, CSRF protection, approved Operations Manager email enforcement, role middleware, Helmet, CORS allow-listing, request limits, input allow-listing, and audit history

## Run locally

### 1. Configure the API

Open `server`, copy `.env.example` to `.env`, and replace every placeholder. Use a MongoDB Atlas database or a local MongoDB URI. Set `CLIENT_ORIGIN` to the frontend URL. Keep `OPERATIONS_MANAGER_EMAIL` and `SEED_MANAGER_EMAIL` set to `malaikaraffique@gmail.com` unless the company intentionally changes the approved manager account.

Create the first (and only) Operations Manager account:

```powershell
cd server
npm run seed:manager
```

Start the API:

```powershell
npm run dev
```

It runs at `http://localhost:4000` by default.

### 2. Configure and run the client

Open `client`, copy `.env.example` to `.env`, and start Vite:

```powershell
cd client
npm run dev
```

Open the URL Vite shows, normally `http://localhost:5173`.

## Important deployment notes

- Set `NODE_ENV=production`, HTTPS-only deployment URLs, and a precise `CLIENT_ORIGIN` before production deployment. In production the authentication cookies become `Secure` and `SameSite=None` for a separately hosted client and API.
- Do not expose `SEED_MANAGER_PASSWORD` after the first account is created. Delete the `SEED_MANAGER_*` values or rotate that password after seeding. Keep `OPERATIONS_MANAGER_EMAIL` configured so only the approved manager account can access admin features.
- Back up MongoDB regularly. `MeetingRevision` snapshots preserve application edit history but are not a replacement for database backups.
- File uploads are intentionally not part of this first release. When they are added, store files in private Cloudinary/S3 storage and save only protected URLs and metadata in MongoDB—never public server-disk paths.

## API overview

| Area | Routes |
| --- | --- |
| Authentication | `POST /api/v1/auth/login`, `POST /refresh`, `POST /logout`, `GET /me` |
| Meeting records | `GET /api/v1/meetings`, `GET /:meetingId`, manager-only `POST`, `PUT`, `POST /publish`, `POST /archive` |
| History | manager-only `GET /api/v1/meetings/:meetingId/history` |
| Employee access | manager-only `GET/POST /api/v1/users`, `PATCH /:userId/status` |

Employees are automatically restricted to published meeting records by the server, not merely by the interface.
