# Backend-only research access — UNEXECUTED proposal

No backend role, password, connection configuration, driver, adapter or SQL in
this proposal has been installed, created, stored, executed or enabled.

## Recommended smallest practical architecture

Keep browser bearer authentication and server-side Supabase getUser verification.
After verification, entitlement and shared quota checks, have the Next.js server
call the existing search function over a TLS-verified PostgreSQL connection using
a dedicated atlas_research_gateway login. Use the existing Supabase session pooler
(or its supported transaction pooler if validated for the deployment). A small
server-only pg pool and parameterized query replace only the current RPC call:

```sql
SELECT * FROM public.search_knowledge($1::text);
```

Preserve the 14 returned columns and all application ranking/answer code. Never
forward user-supplied SQL, role names or connection settings. Bind only the validated
question. Continue deriving quota identity from verified Supabase user data, not
client-supplied IDs. Validate pool capacity across instances against project limits.

The dedicated login gets no table SELECT/write grants, no role memberships, and
no RLS bypass. It executes the existing SECURITY DEFINER function; the function
still runs as postgres. This preserves present retrieval and is a narrower caller
credential than service_role. It does not reduce the function owner's privilege.

Ordinary authenticated users lose direct RPC execution AND direct knowledge-table
SELECT. PUBLIC/anon cannot execute it either. RLS policies may remain as they are:
policies do not grant SELECT when the SQL grant is absent. service_role/postgres
remain administrative exceptions, not ordinary research callers.

## Why not a new Supabase API key or a service account?

A public API key plus a normal service-account JWT still maps to authenticated;
keeping that role's grants also keeps every ordinary user's bypass. A service-role
key would reintroduce broad access. Minting custom database-role JWTs would require
signing authority and key-management work that is more sensitive than one limited
database login. The dedicated connection is the smallest practical least-privilege
option identified; a pg package is free, but must be approved before installation.

## Exact proposed changes and preflight gates

See backend-only-proposal.sql and backend-only-rollback.sql. Both are outside any
automatic migration directory, explicitly unexecuted and not referenced by tests.

Before approving execution, verify the target database name (the draft assumes
postgres), role-name availability, pooler compatibility and TLS CA configuration.
Audit effective PUBLIC privileges, role memberships and all other exposed
SECURITY DEFINER functions/views that could read the knowledge tables. NOINHERIT
does not remove privileges inherited from PUBLIC. Any additional permissions
identified by that audit require a revised, specifically approved proposal; the
draft does not claim complete isolation from unrelated database objects.

Provision a password through an approved secret-handling workflow; never embed it
in SQL source, shell history, logs or repository files. Store a server-only
ATLAS_RESEARCH_DATABASE_URL using the deployment's existing secret storage and
locally only if separately approved. Use TLS certificate validation, not
rejectUnauthorized=false. No JWT signing secret or service-role key is needed.

The exact role/privilege changes are:

1. Create the limited LOGIN role; grant CONNECT, schema USAGE and this function's
   EXECUTE; apply role-local statement, lock and idle transaction timeouts.
2. Provision the credential, add the free pg driver and implement/test the adapter
   only after approval. Do not activate a partly configured backend.
3. Deploy and verify the adapter before revoking authenticated RPC/table access.
4. Revoke EXECUTE from PUBLIC/anon/authenticated and SELECT on both knowledge
   tables from those roles. No policies, content, function ownership or security
   mode change is proposed.
5. Verify catalog privileges and real anonymous/authenticated direct-access denial;
   verify the application still passes all eight answer contracts. Verify the
   dedicated login cannot directly read or write tables, including through other
   exposed objects discovered by the preflight audit.

These are future operations, not authorization to execute them in milestone 1.
No paid infrastructure is required for the database connection itself. Shared
per-user/IP/global quotas still require an approved shared atomic storage design;
the backend-only change creates an enforceable gateway but does not supply quotas.

## Rollback

The rollback file restores Stage 2 authenticated EXECUTE and both client SELECT
grants. Switch the server back to user-token retrieval after those grants are
restored, then drain the new connection pool and disable its login. Existing
sessions are not killed automatically. No PUBLIC/anon EXECUTE or destructive table
grants are restored. All rollback permission changes require explicit approval.

## Primary references

- [Supabase database connections and custom-role pooler usernames](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PostgreSQL privileges, including PUBLIC](https://www.postgresql.org/docs/17/ddl-priv.html)
