# GHL Duplicate Backend (Multi-Tenant)

Production-grade Node.js backend for GoHighLevel duplicate detection with:

- MongoDB as source of truth
- Redis for ultra-fast duplicate lookup
- BullMQ for asynchronous background sync
- Webhook ingestion for near real-time updates

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Redis + ioredis
- BullMQ
- Axios
- Zod validation
- Vitest unit tests

## Folder Structure

```
server/
  app.js
  index.js
  config/
  jobs/
  middleware/
  models/
  modules/
    auth/
    duplicate/
    webhook/
  services/
  utils/
  tests/
```

## Environment Setup

Copy `.env.example` to `.env` and fill values.

Required variables:

- `DATABASE_URL`
- `REDIS_URL`
- `ACCESS_KEY_SECRET`

Recommended access-key cookie variables:

- `ACCESS_KEY_COOKIE_NAME` (default: `ghl_access_key`)
- `ACCESS_KEY_COOKIE_SECURE` (`true` in production)
- `ACCESS_KEY_COOKIE_SAME_SITE` (`lax`, `strict`, or `none`)
- `ACCESS_KEY_COOKIE_MAX_AGE_MS` (default: 30 days)
- `ACCESS_KEY_COOKIE_DOMAIN` (optional)

## Run

```bash
pnpm install
pnpm dev
```

## API Endpoints

### 1) Connect GHL

`POST /api/v1/auth/connect-ghl`

Request body:

```json
{
  "locationId": "abc123",
  "ghlApiKey": "ghl_private_api_key"
}
```

Response:

```json
{
  "message": "GHL account connected successfully",
  "accessKey": "ak_..."
}
```

Behavior:

- Stores tenant credentials in MongoDB
- Generates internal `accessKey`
- Enqueues async contact sync job

### 2) Duplicate Check

`POST /api/v1/duplicate/check`

Headers:

- `x-access-key: <tenant-access-key>`

Authentication behavior:

- Header-first: `x-access-key` is always preferred when provided.
- Fallback: if header is missing, backend also accepts access key from an HttpOnly cookie.

Request body:

```json
{
  "email": "test@example.com",
  "phone": "+14155550100"
}
```

Response:

```json
{
  "email": "duplicate",
  "phone": "unique"
}
```

Use these values directly in your GHL workflow conditions:

- `email == duplicate` or `email == unique`
- `phone == duplicate` or `phone == unique`

Important: this endpoint reads from Redis indexes for speed and verifies counts against MongoDB as source of truth.

### GHL Custom Webhook Setup (Automation)

Use this when calling duplicate check from GHL workflows:

- Method: `POST`
- URL: `https://<your-backend>/api/v1/duplicate/check`
- Header: `x-access-key: ak_...`
- Content-Type: `application/json`
- Body example:

```json
{
  "email": "{{contact.email}}",
  "phone": "{{contact.phone}}"
}
```

Important: GHL server-to-server calls should always pass `x-access-key` header. Cookie fallback is mainly for browser-based app flows.

### 3) Webhook Ingestion

`POST /api/v1/webhook/ghl`

Body accepts either:

- `{ "contact": { ... } }`
- or raw contact fields including `locationId`

The handler upserts MongoDB and updates Redis cache.

## Sync Workflow

- Queue name: `contact-sync`
- Worker fetches contacts from GHL in paginated pages
- Each page is normalized and upserted into MongoDB
- Redis keys are indexed via pipeline:
  - `email:{locationId}:{email}`
  - `phone:{locationId}:{phone}`
- Scheduler periodically enqueues sync for all tenants

## Testing

Run unit tests:

```bash
pnpm test
```

Covered basics:

- Email/phone normalization
- Duplicate check service behavior with mocked Redis
