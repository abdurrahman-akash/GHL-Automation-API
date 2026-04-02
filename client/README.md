This is a Next.js app to fetch all contacts from GoHighLevel (GHL) and run a bulk duplicate check for email and phone status.

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

## GHL Configuration

Create a `.env.local` file in the project root:

```bash
GHL_API_BASE_URL=https://services.leadconnectorhq.com
APP_ACCESS_KEY=your_private_access_key_here
GHL_API_VERSION=2021-07-28
GHL_CONTACT_PAGE_LIMIT=100
```

Required values:

- `APP_ACCESS_KEY`

Then run the app and fill this form on the page:

- `GHL_API_KEY` (provided by user)
- `GHL_LOCATION_ID` (provided by user)
- `Access Key` (provided by admin, must match `APP_ACCESS_KEY`)

After that, click **Fetch All Contacts**. You can choose grouping by name or email, select a bulk value, and view each contact status:

- `Unique`
- `Duplicate`
- `Missing`

Main files:

- `src/app/page.tsx` (bulk duplicate checker UI)
- `src/app/api/ghl/contacts/route.ts` (server-side GHL fetch + pagination)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
