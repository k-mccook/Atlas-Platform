# Staged load executed; activation NOT executed

On September 14, 2026, the user approved only the exact staged load from checkpoint `56d5ac3c9043895aa3b34778cf7464f1545e2a0d`. Its Git contents and normalized UTF-8 SHA-256 were checked before submission:

`2710058bed99116f598c82f41cc6f76a0d79b553628be4027a5d67ab30d9fa76`

The entire unchanged `proposed-corpus-load.sql` transaction was submitted once through the existing signed-in Supabase SQL editor. Supabase returned success. No activation, rollback, or other database-changing SQL was executed. Read-only catalog preflight confirmed both legacy sources current, zero user triggers, and the existing SECURITY DEFINER function's current/null source-status filter.

`staged-load-result.json` contains the actual SELECT-only verification output: nine staged sources, 67 linked chunks, zero source field mismatches, zero chunk field mismatches. Every reviewed field, including content, section, URL, version, description provenance and subsection hashes, matched. All source statuses remain `staged_provenance_review`. The two legacy sources remain current; all seven legacy labels remain unchanged. No existing records were deleted or updated. No schema, function, index, grant, RLS, or Auth changes were made.

`active-corpus-validation.json` records eight successful regressions using actual current database RPC results plus the engine's three bounded section-expansion results. No staged chunk appeared in any raw result. The local engine evaluated these exact live SELECT responses; this is not an authenticated HTTP-session test. The original topics, categories, Fannie authority, sections, High confidence and legacy factual checks passed. Raw result payloads were not saved to the repository.

The original proposal and SQL files are deliberately unchanged, including their historical UNEXECUTED headers. This receipt is the authoritative execution-status update: **load executed, activation/rollback unexecuted**. Do not rerun the load; its existing-ID guards will reject a second insertion.

The exact activation file remains at normalized SHA-256:

`2931154dc8f8c58303ce2b86dfcacce8144a004c6c1cb2dd8ef68a03380f78fd`

Future activation requires separate explicit approval. It would supersede the two old sources, make nine publisher sources current, and relabel six legacy chunks as derived. Reconciliation Research Summary is one of those six; its text would remain intact under a superseded source. None of those changes has happened.

Recovery on September 15: local and remote main were still at `56d5ac3`; work had stopped before committing the completed changes. The load was not repeated. Fresh SELECT-only checks in `staged-recovery-verification.json` again found 9/67 and zero mismatches. `catalog-recovery.json` records unchanged legacy fingerprints (zero mismatches), the same function definition as the baseline, postgres ownership, SECURITY DEFINER mode, existing indexes, RLS and policies. Table client grants remain SELECT-only; function execution remains postgres/authenticated/service_role only. No Auth settings or users were accessed or modified during recovery.
