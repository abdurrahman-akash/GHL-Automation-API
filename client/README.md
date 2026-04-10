Production-grade Next.js client for a multi-tenant SaaS workflow that:

- Connects a GHL tenant (location ID + API key)
- Receives and stores tenant access key in memory
- Runs duplicate checks for email/phone
- Displays dashboard-level backend and sync status

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# Optional sync endpoints if your backend exposes them
NEXT_PUBLIC_SYNC_TRIGGER_PATH=/api/v1/sync/trigger
NEXT_PUBLIC_SYNC_STATUS_PATH=/api/v1/sync/status
```

Required:

- `NEXT_PUBLIC_API_BASE_URL`

## Routes

- `/connect` - Connect GHL and receive tenant access key
- `/dashboard` - View location, backend health, sync state, and last sync time
- `/duplicate-check` - Test duplicate detection by email and/or phone

## Architecture

- `src/lib` - Axios instance + API service functions
- `src/hooks` - React Query hooks only
- `src/store` - Zustand auth/session state (in-memory)
- `src/components/ui` - Reusable UI primitives
- `src/components/forms` - Feature form components
- `src/app` - Route pages only

## Security Notes

- GHL API key is not stored after successful connect submission.
- Access key is kept in memory only (not in local storage).
- Auth header injection is centralized in request interceptor.

## Testing

Run lint and tests:

```bash
pnpm lint
pnpm test
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
