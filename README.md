# GHL Contact Tools Monorepo

This repository contains two apps used to work with GoHighLevel (GHL) contacts:

- `client/`: Next.js web app to fetch contacts and audit duplicate status in bulk.
- `server/`: Express API for workflow/webhook use cases (duplicate checks and contact fetch).

## What This Project Does

### 1) Client app (`client/`)

The client provides a UI where an operator can:

- Enter `ghlApiKey`, `ghlLocationId`, and an admin `accessKey`.
- Fetch all contacts from GHL through a server-side Next.js route.
- Group contacts by name or email.
- See duplicate status for each contact:
	- Email: `Missing`, `Unique`, `Duplicate`
	- Phone: `Missing`, `Unique`, `Duplicate`

Primary route in the client app:

- `POST /api/ghl/contacts`:
	- Validates `accessKey` against `APP_ACCESS_KEY`.
	- Uses submitted GHL credentials to paginate through contacts.
	- Returns normalized contact records.

### 2) Server API (`server/`)

The server app exposes webhook-friendly endpoints:

- `POST /api/check-duplicate`
	- Requires `x-api-key` (internal shared secret) and `x-ghl-api-key`.
	- Requires `x-location-id` and request body `phone`.
	- Calls GHL duplicate search endpoint and returns `status`.

- `POST /api/get-all-contacts`
	- Requires the same headers.
	- Fetches contacts from GHL.
	- Returns duplicate summary for emails and phones.

## Repository Structure

```text
.
├── README.md
├── client/
│   ├── README.md
│   └── src/
│       └── app/
│           ├── page.tsx
│           └── api/
│               └── ghl/
│                   └── contacts/
│                       └── route.ts
└── server/
		├── README.md
		├── index.js
		└── api/
				├── check-duplicate.js
				└── getAllContact.js
```

## Prerequisites

- Node.js 18+
- pnpm (recommended)

## Setup

Install dependencies separately in each app:

```bash
cd client && pnpm install
cd ../server && pnpm install
```

## Environment Variables

### Client app (`client/.env.local`)

```bash
APP_ACCESS_KEY=your_admin_access_key
GHL_API_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
GHL_CONTACT_PAGE_LIMIT=100

# Optional fallback values if you use GET /api/ghl/contacts directly
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_ghl_location_id
```

Notes:

- The UI flow uses `POST /api/ghl/contacts` and sends GHL credentials in the request body.
- `APP_ACCESS_KEY` is required for POST requests from the UI.

### Server app (`server/.env`)

```bash
API_SECRET_KEY=your_internal_shared_key
PORT=8000
```

Notes:

- `API_SECRET_KEY` is used to validate the `x-api-key` request header.
- GHL credentials are expected from request headers per call (not from `.env`).

## Running The Apps

Run each app in its own terminal.

### Client (Next.js)

```bash
cd client
pnpm dev
```

Open `http://localhost:3000`.

### Server (Express)

```bash
cd server
pnpm dev
```

Server runs on `http://localhost:8000` by default.

## API Quick Reference (Server)

### `POST /api/check-duplicate`

Headers:

- `x-api-key`: must match `API_SECRET_KEY`
- `x-ghl-api-key`: GHL bearer token
- `x-location-id`: GHL location ID
- `content-type: application/json`

Body example:

```json
{
	"id": "contact-id",
	"name": "John Doe",
	"email": "john@example.com",
	"phone": "+1234567890"
}
```

Response example:

```json
{
	"status": "unique"
}
```

### `POST /api/get-all-contacts`

Headers:

- `x-api-key`
- `x-ghl-api-key`
- `x-location-id`

Response includes:

- `totalContacts`
- `contacts`
- `duplicates` (email/phone duplicate summary)

## Additional Docs

- `client/README.md` contains client-specific behavior and usage notes.
- `server/README.md` contains server endpoint docs and workflow setup guidance.
