# Atlas knowledge-layer baseline

## Status and evidence levels

This baseline combines **verified PostgreSQL catalog definitions** with an earlier
**partial API-observed corpus snapshot**. It is not a complete database backup,
migration, or tested restore procedure. Both captures occurred on 2026-09-10 UTC.
The unchanged application baseline is commit
`6a771e61b4d4124c66516a3439bf0194f2728878`.

Initial API inspection used the approved public anon key and GET requests. Later
catalog inspection used the user's signed-in Atlas Supabase SQL editor and only
SELECT queries. No database/configuration changes, installations, or credential
exports were performed. No application records were queried during catalog inspection.

## Files

- `catalog.json`: verified catalog facts, normalized and with identical ACL rows
  grouped without losing privileges.
- `search_knowledge.sql`: exact pg_get_functiondef text, with line endings normalized.
  **Reference only: its CREATE text was returned by SELECT, never executed.**
- `table-definitions.sql`: table definitions reconstructed from verified catalogs;
  not original authored DDL, a migration, or an executed script.
- `catalog-inspection.sql`: SELECT-only repeat-inspection worksheet. Equivalent
  catalog queries were run in the browser, grouped into JSON; the worksheet itself
  was not executed as a script.
- `snapshot.json`: unchanged historical API capture for eight questions. Its
  schema-unavailable statements describe the earlier anon capture, not the later
  successful catalog inspection.
- `../../../scripts/database/capture-knowledge-baseline.mjs`: repeatable anon API
  metadata capture. It does not refresh catalog.json or perform SQL catalog access.

## Verified database facts

The inspected server is PostgreSQL 17.6.

### Tables, constraints and indexes

Both public.knowledge_sources and public.knowledge_chunks are permanent ordinary
tables owned by postgres. Sources have 15 columns; chunks have 11. Ordered types,
defaults, nullability and collation are preserved in catalog.json. There are no
identity or generated columns. Text columns use the default collation.

Both tables have UUID primary keys with gen_random_uuid() defaults. Chunks have a
NOT NULL source_id foreign key to knowledge_sources(id), with ON DELETE CASCADE.
All three catalog constraints are validated. No additional CHECK/UNIQUE/exclusion
constraints were found in pg_constraint; NOT NULL flags are recorded per column.

Four indexes exist, all valid and ready:

- knowledge_sources_pkey: unique btree on source ID.
- knowledge_chunks_pkey: unique btree on chunk ID.
- knowledge_chunks_source_id_idx: btree on source_id.
- knowledge_chunks_content_idx: GIN on to_tsvector('english'::regconfig, content).

No user-defined triggers, rewrite rules or inherited parents were found. Four
enabled internal foreign-key triggers are recorded with their built-in enforcement
functions. Their generated names are instance-specific; do not restore them manually.

### Exact search function

One public.search_knowledge(text) overload was found. It returns 14 columns,
including UUID IDs, text metadata/content, date effective_date and integer rank.
See search_knowledge.sql for the exact parameter and return definition.

Verified behavior:

1. Split the question on whitespace and lowercase distinct words of at least
   three characters, excluding the explicit stopword list in the function.
2. Join knowledge_chunks to knowledge_sources; retain sources where
   COALESCE(status, 'current') = 'current'.
3. Count distinct query words matching substrings in chunk content, chunk title,
   section, source title or organization. A word counts once even across fields.
4. Keep positive ranks. Sort by rank descending, then prefer authoritative rows,
   then sort by chunk title; return at most 12 results.

Punctuation is not separately normalized and LIKE wildcards are not escaped.
There is no authority, section, effective-date or version restriction in the SQL,
and no final stable-ID tie-breaker. Rank is an overlap count, not confidence.

The function does NOT use PostgreSQL full-text search or embeddings. The English
GIN expression index exists, but its tsvector expression is not queried by the
function's substring predicates. No EXPLAIN ANALYZE or performance workload was run.
The inspected session default is pg_catalog.english. That configuration uses
pg_catalog.default as parser and pg_catalog.english_stem / pg_catalog.simple as
its dictionaries. No generated search column exists on either table.

### Security and privileges

- The function is SQL, SECURITY DEFINER, owned by postgres, with search_path=public.
- It is declared VOLATILE, PARALLEL UNSAFE, non-strict and not leakproof. Its body
  contains SELECT logic only; VOLATILE does not mean writes were observed.
- Both tables have RLS enabled, not forced. Each has one permissive SELECT policy
  for authenticated with USING (true). No anon or write policies were found.
- PUBLIC, postgres, anon, authenticated and service_role have EXECUTE on the function,
  without grant option. All four named roles have effective EXECUTE and table SELECT.
- postgres and service_role have BYPASSRLS; anon and authenticated do not. None of
  those four roles has the superuser flag in this catalog.
- Both tables have SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER and
  MAINTAIN ACL entries for postgres, anon, authenticated and service_role, all
  without grant option. No column-specific ACL entries were found.
- Public-schema ACL and effective schema privileges are recorded. All four named
  roles have USAGE; only postgres among those four has effective schema CREATE.

These are inspected permissions, NOT tests of write access. No write, truncate,
maintenance, grant, policy or configuration operation was attempted. Broad grants
and public RPC access deserve a separate security decision; they remain unchanged.

Catalog dependency tracking lists only schema public for the SQL-string function.
Its body directly names the two knowledge tables and uses built-in operations;
pg_depend alone does not enumerate all references in that body.

## Interpretation supported by verified facts

Earlier direct anon reads returned zero visible rows while the RPC returned
knowledge evidence. This is explained by RLS limiting table reads to authenticated
users and the publicly executable SECURITY DEFINER function running as postgres,
which owns the tables and has BYPASSRLS. Knowledge-table RLS does not make the RPC
private. An empty anon SELECT did not establish that the tables were empty.

The interpretation of the GIN index's lack of use follows from comparing its
expression to the verified function body; no runtime query plan was captured.

## Historical API observations and partial corpus

The earlier schema-discovery request returned HTTP 401. Direct metadata SELECTs
returned HTTP 200 with zero rows visible to anon. Eight search GETs returned 11
or 12 rows each. These observations remain unchanged in snapshot.json.

Their union contains **14 distinct chunks from 4 sources**, not a complete corpus:

| Authority/source | Sections | Observed chunks |
| --- | --- | ---: |
| Fannie Mae Selling Guide | B4-1.3-07, -08, -09 | 3 |
| Fannie Mae / Valuation Analysis and Reconciliation | B4-1.3-11 | 4 |
| Fannie Mae / Freddie Mac / UAD 3.6 | Missing sections | 4 |
| Veterans Affairs / Tidewater and Reconsideration training | Missing sections | 3 |

The JSON groups records by authority, source, section, version, effective date and
level. Fannie rows have descriptive version text and 2025-06-04 date metadata;
this does not establish current policy validity. UAD rows use level primary;
VA rows lack section/version/date/level. Some domain fields contain category
labels. A Reconciliation Research Summary title is labeled authoritative: this
raises a provenance question but does not prove that it is AI-generated.

All eight exact questions and expected fields are preserved. expected_response
means test expectations, not an observed handler response. retrieved_evidence
contains raw RPC ordering/metadata BEFORE application filtering and URL overrides.
Content prose was discarded; lengths and SHA-256 fingerprints were retained.
Fingerprints do not establish authenticity, truth or adequate citation support.

## Current application integration

The browser posts a question to /api/ask-atlas. The route uses the public URL and
prefers a service-role key if configured, otherwise the anon key. The initial
capture used only anon and did not inspect/use service-role credentials.

The route detects one authority/topic, calls search_knowledge(search_query), filters
named authority, prefers authoritative rows and one expected section, adds ranking
bonuses, deduplicates by source/section/title, and keeps up to three chunks.
Recognized Fannie topics receive prewritten answers; other answers extract sentences
from the primary chunk. Confidence follows source/section metadata. Four official
Fannie section URLs are overridden locally. The browser deduplicates again by
source ID and does not display version/effective-date metadata.

## Reproducibility and remaining gaps

From the project root, run `node scripts/database/capture-knowledge-baseline.mjs`
only with approved public-anon access. It makes allowlisted GET requests, selects
metadata explicitly, checks pagination counts, fingerprints RPC text and writes
only local snapshot.json. It excludes credentials, project hostname, prose and
unrelated data; free-text metadata still requires human review. Separate requests
are not a transactionally consistent database snapshot.

For catalog refreshes, use an approved SQL editor or sanitized administrator export
and the SELECT-only worksheet. Review function/default/policy literals for secrets
before saving. Never execute the captured DDL files as part of an inspection.
No CLI or database password is required for the browser approach used here.

Still not obtained/validated:

- Complete corpus counts/inventory or source provenance; no application rows were
  queried in the catalog phase.
- Ingestion/chunking scripts and migration history.
- Original authored CREATE TABLE scripts or a tested complete restore.
- Full role membership, unrelated database objects, storage details and comments.
  These were not necessary for the scoped inspection.

## Validation

Catalog function text and key metadata groups match browser transfer checksums,
normalizing only function line endings/trailing whitespace. Table SQL is explicitly
reconstructed.

Validation completed on 2026-09-10 UTC:

- `npm test`: 8 passed, 0 failed, 0 skipped.
- `npm run build`: passed, including Next.js compilation and TypeScript validation.
- Seven baseline/script files inspected for approved credential values, project
  hostname, key/connection-string/private-key/email patterns: no matches.
- Catalog structure checked: two tables, 26 columns, three constraints, four
  indexes, four internal triggers, two policies and eight grouped table ACL entries.
- Saved catalog metadata and exact function text matched browser transfer checksums.
- Metadata contains only knowledge definitions, publication evidence metadata and
  system-role privilege information, not user/authentication/assignment records.
- Git confirms application code, existing tests, manifests and configuration are
  unchanged. The earlier snapshot and capture script were not rewritten.

Normal environment loading for validation was authorized earlier. The build wrote
only its normal ignored output. No database-changing statement was executed and
no commits or pushes have been made.
