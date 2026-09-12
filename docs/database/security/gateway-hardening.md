# Ask Atlas gateway hardening — launch milestone 1

Implemented in the existing route without packages, services, credentials or
database changes. These controls apply to the application gateway only.

| Control | Limit / behavior |
| --- | --- |
| Bearer header | Maximum 8,192 characters; malformed/over-limit headers return 401 |
| Identity | Supabase getUser verifies the bearer token; registered authenticated role required |
| Body format | application/json (optional parameters); only absent/identity Content-Encoding |
| Request body | Maximum 16,384 actual streamed bytes; Content-Length is an early check, not trusted as the sole bound |
| Body read deadline | 5 seconds total after successful authentication; stalled/error streams cancelled |
| Question | String, nonblank, maximum 2,000 UTF-16 code units before trim; emoji may count as two units |
| Normalization | Trim outer whitespace only; preserve internal whitespace, punctuation and Unicode |
| Upstream transport | 10-second AbortSignal deadline for Supabase HTTP requests; redirects rejected |
| External errors | 401 invalid authentication; generic 503 unavailable authentication; 400 authenticated invalid body/question; generic 500 retrieval failures |

Body limit/type/deadline failures intentionally return 400, keeping the approved
authenticated-invalid-request contract. Authentication runs before body parsing.
The route retains at most 16 KiB of accepted body chunks plus its decoding buffer.
Next.js/hosting infrastructure may allocate or buffer bytes before the route sees
them; this is not a transport-layer upload cap or denial-of-service guarantee.
The request read deadline starts after authentication, not at initial connection.
Upstream cancellation does not guarantee immediate cancellation of PostgreSQL work.

The SDK receives sanitized synthetic 503 responses on transport exceptions instead
of raw exceptions that could contain request headers. The route does not log raw
SDK errors, user input, bearer tokens or Supabase credentials. Server-side session
persistence remains disabled. Existing browser Auth session storage is unchanged.
Successful answer selection, source content, citation mapping and confidence logic
are unchanged. No knowledge-content or database privilege changes accompany this work.

## Tests and limits of validation

The isolated suite exercises exact question/body boundaries, chunked bodies,
misleading Content-Length, malformed/non-string input, Unicode boundaries,
stalled/error streams, sanitized transport errors, authentication denial and
verified-token forwarding. Public-access integration checks use the existing anon
key and real Supabase endpoint, expecting anonymous RPC denial after Stage 2.

The full eight authenticated regression expectations remain unchanged. Their
automated live execution and the direct authenticated RPC automated check require
separately approved test credentials and remain deferred. Browser smoke checks
using the user's existing signed-in session do not expose or export its token.

## Remaining launch blockers

- Shared atomic per-user, trusted-client-IP and global rate/concurrency limits,
  with quotas and Retry-After responses. No in-memory limiter was implemented.
- Backend-only research access before relying on route quotas: authenticated
  users still have direct RPC execution and SELECT on knowledge tables.
- Hosting-level body/header/connection limits, trusted proxy IP configuration,
  credential/header redaction in platform logs and deployment verification.
- Approved repeatable authenticated test setup (no test account was created).
- A decision on account entitlement; registration alone currently permits research.

## Milestone validation — 2026-09-11

- Final combined run: 51 passed, 0 failed (26 authentication, 23 hardening,
  2 public-access checks). One preceding public-access run lacked the expected
  PostgreSQL error code; a focused rerun and the final combined run passed without
  changing the assertion or database permissions.
- All eight questions exercised through the existing signed-in browser session:
  expected category, Fannie Mae authority, High confidence, primary section and
  official source link were visible for every question. An initial browser
  assertion used a partial/diff snapshot; full snapshots resolved that test issue.
  This supplements but does not replace the nine deferred account-based tests.
- Separate unauthenticated application request returned HTTP 401. Direct anonymous
  Supabase RPC returned insufficient privilege (42501).
- Production build and targeted ESLint passed. Git diff whitespace check passed.
- Review/scan found no credentials, tokens or unrelated data in the changed files.
  Retrieval, answer, source, citation and confidence code and the eight original
  regression assertions were compared with the Stage 2 checkpoint and unchanged.
- Only the previously approved Stage 2 RPC REVOKE was executed in this milestone.
  The resumed portion performed catalog SELECTs only; the REVOKE was not repeated.
  Backend-only SQL remains an unexecuted proposal. Nothing was deployed.

## Rollback

Revert only the hardening code checkpoint if explicitly approved; retain the
Stage 2 authentication gate and database REVOKE. No database rollback is needed.
