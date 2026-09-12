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

Run `npm test` for the complete security and authenticated regression suite,
including all eight validated Fannie Mae questions against stored evidence fixtures.
The nine live authenticated checks are explicitly marked deferred if no approved
test-account credentials are available; all other available checks still run.
No running dashboard, new packages, paid testing service, or OpenAI credits are
required. Use Node 20 or newer (validated locally with Node 24).

These integration tests call the real `app/api/ask-atlas/route.ts` POST handler
with a Web Request and query the configured Supabase `search_knowledge` function.
Node's built-in test runner and the installed TypeScript compiler load the route
in memory. Production files are not rewritten. Isolated tests inject a Supabase client and
stored evidence fixtures; live tests use the installed client and real database.
No knowledge-data writes, SQL permission changes or user creation are performed
by the tests. Live authenticated tests sign in normally to Supabase Auth, which
can create normal session/audit records. Isolated security tests substitute only
the Supabase client to check denial paths and token forwarding without credentials.

Use the existing `.env.local` or environment variables to configure
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The route and tests
do not use `SUPABASE_SERVICE_ROLE_KEY` for research. Full integration also requires
separately approved `ATLAS_TEST_EMAIL` and `ATLAS_TEST_PASSWORD` for a dedicated
existing test account in ignored local configuration or CI secrets. Never commit
or print those values or access tokens. Do not create an account or add credentials
without approval. Test session tokens stay in memory, with persistence and refresh
disabled. Environment files remain ignored by Git. Network access and the existing
knowledge-base records are required. Missing public configuration, partially configured test credentials, and retrieval
failures fail. Only the complete absence of test-account credentials defers the
nine authenticated checks, with an explicit reason on each test.
The current handler does not use the OpenAI key.

Each question checks status, topic, category, authority, confidence, primary
section, a nonempty answer without the insufficient-guidance fallback, and a
primary source with an official HTTPS URL identifying the expected section.
Results are printed per question; any failure produces a nonzero exit code.
Each case has a 45-second test timeout.

Run just the isolated security checks (no account, configuration or network needed):

```sh
node --test --test-name-pattern="Authentication security|Gateway hardening" tests/ask-atlas.test.mjs
```

Run all currently available checks without a live test account (public Supabase
configuration and network access are needed for the public-access group):

```sh
npm test
```

Without approved test credentials these commands defer the eight authenticated Fannie regressions and the
direct authenticated RPC check. They do not prove those nine checks pass. Those
tests are currently deferred by user instruction; no test credentials were added.

The public-access tests verify a forged token and the anon API key cannot act as
user authentication, and check direct anon RPC access for the chosen rollout
stage. `ATLAS_TEST_RPC_ACCESS` defaults to `post-revoke`, requiring direct anonymous
RPC denial after the approved SQL was executed on 2026-09-11. `pre-revoke` is only
for explicitly testing a historical environment before that change.
This optional non-secret test setting does not change any database permissions.

Stage 2 application authentication uses the existing browser session's bearer
token and server-side `getUser(token)` verification. The database REVOKE
was executed with approval on 2026-09-11. See [Stage 2 access and rollout](docs/database/security/stage-2-access.md)
and [executed SQL record](docs/database/security/stage-2-rpc-access.sql).

The application gateway accepts JSON request bodies up to 16,384 bytes and
questions up to 2,000 JavaScript UTF-16 code units before trimming. It preserves
internal whitespace and Unicode, bounds body reading to 5 seconds and Supabase
transport to 10 seconds, and rejects bearer headers longer than 8,192 characters.
See [gateway hardening and launch limits](docs/database/security/gateway-hardening.md).
Shared rate limiting is still required. A
[backend-only access proposal](docs/database/security/backend-only-proposal.md)
is documentation only; its SQL has NOT been executed and its backend is NOT enabled.

Add questions to `tests/ask-atlas.cases.mjs`. Entries define `question`, `topic`,
`category`, `section`, `authority`, and `confidence`; the current list defaults
the last two to Fannie Mae and High. Add an official hostname to `authorities`
for another authority. Extend the URL assertion if its section URL convention
differs from the current path-segment convention.

The tests cover security, evidence selection, factual passages, citation offsets,
authority restrictions, conflicts, and confidence. Live tests also check the current
knowledge base. They do not independently certify publisher accuracy. Database
changes can cause legitimate failures; investigate before changing expectations.
The in-memory loader supports package imports and relative local TypeScript modules.
Next request-context APIs may still require testing through a running server. Run `npm run build` separately for Next.js
compilation and TypeScript validation.

See [Research Engine V2](docs/research-engine-v2.md) for architecture, grounding
limits, test coverage, and remaining work. No database behavior or content changed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
