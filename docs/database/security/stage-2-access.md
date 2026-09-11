# Ask Atlas Security Stage 2

## Rollout status

Application, tests and documentation implemented locally. On 2026-09-11 the user
approved and we executed exactly stage-2-rpc-access.sql. No other database-changing
SQL was executed in Stage 2. Authenticated browser smoke testing passed after the
change. The nine account-based automated integration checks remain deferred; no
test account, credentials or Auth settings were created or changed. No application
deployment was performed.

Read-only inspection of Atlas Authentication > Sign In / Providers on 2026-09-10
showed **Allow anonymous sign-ins disabled**. No controls were changed. If this
setting changes later, guest sessions can assume the authenticated database role;
the route rejects such users, but the retained direct RPC grant would need review.

## Access flow

Previously the browser sent a question without authentication. The route preferred
a service-role key, otherwise anon, and independently queried the public RPC.

Now SearchBar reuses the existing Supabase browser client's session and sends its
access token only in the Authorization bearer header. The route validates header
syntax and independently verifies the token with Supabase auth.getUser(token).
It requires a user ID, role authenticated and a non-anonymous user. The same
token is forwarded in a request-scoped client's Authorization header for the RPC.
That client uses only the public URL and anon API key; it does not read a
service-role key. Server persistence, auto-refresh and URL session detection are
disabled. No tokens are written to files, URLs, logs or responses by this path.
Existing browser session persistence/refresh remains unchanged; this is not a
cookie/SSR authentication migration.

Missing, malformed or rejected credentials return 401 before parsing the question
or retrieving knowledge. Auth transport failures, throttling and upstream server
errors fail closed with generic 503 responses. After successful authentication,
missing/non-string/blank questions and malformed JSON return 400. Valid requests
continue through the unchanged topic, retrieval, answer, citation and confidence
logic. Raw SDK errors are not exposed or logged by the route.

## Database history and verified permissions

The historical knowledge-baseline catalog predates Security Stage 1 and must not
be mistaken for current grants. Stage 1 was executed and verified separately:
anon and authenticated now have only SELECT on both knowledge tables. postgres
and service_role retain their prior privileges. RLS remains enabled, with
authenticated SELECT USING (true); anon direct table reads expose no rows.

Stage 2's executed stage-2-rpc-access.sql removed function EXECUTE from PUBLIC and
anon. authenticated, postgres and service_role retain EXECUTE. It changes no
function body, security mode, owner, table content, table grant or RLS policy.
Post-change catalog verification: PUBLIC has no EXECUTE grant; anon effective
EXECUTE is false; authenticated, postgres and service_role effective EXECUTE remain
true. The function definition MD5 before and after was
c1a18771195e2cf56efeddd773b93ff3. Owner postgres, SECURITY DEFINER, search_path=public,
knowledge-table ACLs and RLS flags were unchanged.

Authenticated users intentionally retain direct RPC and knowledge-table reads.
This stage is login gating, not subscription/tenant entitlement or an exclusive
backend gateway. Route-only quotas would still be bypassable by authenticated
database calls. No rate limiter is implemented in this stage.

## Validation and deployment sequence

1. Run isolated security tests and public-access checks as documented in README.
2. With separately approved test credentials, run the nine authenticated live
   tests: eight existing Fannie expectations plus direct authenticated RPC access.
3. Run the production build and review the diff. Deploy the browser and route
   together; verify normal login and a successful authenticated search in the UI.
4. Completed: explicit approval and exact REVOKE execution on 2026-09-11.
5. Use read-only catalog checks for explicit and effective EXECUTE privileges:
   anon false; authenticated true; postgres/service_role unchanged. Compare the
   function definition, table grants and RLS against the pre-change capture.
6. Run the full tests with ATLAS_TEST_RPC_ACCESS=post-revoke. The anonymous RPC
   check must return PostgreSQL insufficient privilege (42501), not a network
   error. A successful anonymous RPC is a failure in this mode.

The tests never execute SQL or create accounts. Full npm test fails
when authenticated test credentials are missing; filtered checks are explicitly
partial validation, not proof that all eight regression cases passed.

## Rollback

Before the SQL is applied, restore the previous application deployment only if
explicitly authorized. This restores public application access and weakens the
authentication boundary. Prefer fixing forward or temporarily disabling search.

After the SQL is applied, an old anon-backed route will not work with application
rollback alone. A separately approved full rollback can restore the original
function grants:

```sql
GRANT EXECUTE
ON FUNCTION public.search_knowledge(text)
TO PUBLIC, anon;
```

This reopens anonymous RPC access. Never restore the destructive table grants
removed in Stage 1. No rollback is automatic, and no Git history is rewritten by
the implementation or tests.

## Stage 2 checkpoint validation (2026-09-11)

28 credential-free security/public-access checks passed. Direct anonymous RPC
returned insufficient privilege (42501). The signed-in browser returned the
expected Fannie Mae adjustment answer, B4-1.3-09, High confidence and official URL.
A separate credential-free application POST returned 401. Production build and
targeted lint passed. The eight automated authenticated answer regressions and
authenticated direct-RPC automated check remain deferred, not claimed as passed.
