This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Ask Atlas regression tests

Run `npm test` to check all eight validated Fannie Mae questions automatically.
No running dashboard, new packages, paid testing service, or OpenAI credits are
required. Use Node 20 or newer (validated locally with Node 24).

These integration tests call the real `app/api/ask-atlas/route.ts` POST handler
with a Web Request and query the configured Supabase `search_knowledge` function.
Node's built-in test runner and the installed TypeScript compiler load the route
in memory. Production files and dependencies are not rewritten or mocked.
No database write operations are added by the tests.

Use the existing `.env.local` or environment variables to configure
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Like the route,
the tests prefer `SUPABASE_SERVICE_ROLE_KEY` if present. Environment files remain
ignored by Git. Network access and the existing knowledge-base records are
required. Missing configuration or retrieval failures fail rather than skip.
The current handler does not use the OpenAI key.

Each question checks status, topic, category, authority, confidence, primary
section, a nonempty answer without the insufficient-guidance fallback, and a
primary source with an official HTTPS URL identifying the expected section.
Results are printed per question; any failure produces a nonzero exit code.
Each case has a 45-second test timeout.

Add questions to `tests/ask-atlas.cases.mjs`. Entries define `question`, `topic`,
`category`, `section`, `authority`, and `confidence`; the current list defaults
the last two to Fannie Mae and High. Add an official hostname to `authorities`
for another authority. Extend the URL assertion if its section URL convention
differs from the current path-segment convention.

These tests cover API/retrieval behavior against the live knowledge base, not
browser rendering, guideline accuracy, or exact answer wording. Database changes
can cause legitimate failures; investigate before changing expectations.
The in-memory loader supports the current route's package imports. Future local
TypeScript imports or Next request-context APIs may require extending the loader
or testing through a running server. Run `npm run build` separately for Next.js
compilation and TypeScript validation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
