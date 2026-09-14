# Consolidated Fannie corpus proposal — NOT EXECUTED

Prepared from checkpoint feff39e. This package proposes data changes only. It does not change application behavior, schema, indexes, functions, ownership, grants, RLS, Auth, or any other authority's content. No SQL in this package has been executed.

## Decision and activation gate

Approve as one staged correction/expansion, with activation conditional on the gates below. Loading is separable from activation: the existing corpus remains current throughout loading and review. **Do not activate immediately with the unchanged V2 engine.** The offline preview obtains answers and expected topics/sections for all eight original questions, but all eight receive Medium rather than High confidence because effective dates are unknown. This is a real compatibility blocker, not a reason to fabricate dates or relax evidence standards.

After approval, review application-level provenance/confidence handling and publisher-native factual regression assertions against the staged corpus before activation. Preserve all eight substantive expectations, qualifications, citations, and abstention protections. If these gates cannot be satisfied without additional database changes, stop for approval. The SQL guards validate database state; they cannot enforce human review or test results.

## Exact operations and inventory

| Section | Publisher subsections | Purpose |
| --- | ---: | --- |
| B4-1.3-03 | 9 | Neighborhood analysis |
| B4-1.3-04 | 10 | Site, zoning and property characteristics |
| B4-1.3-05 | 13 | Improvements and reporting |
| B4-1.3-06 | 11 | Condition and construction quality |
| B4-1.3-07 | 4 | Sales comparison and verification correction |
| B4-1.3-08 | 7 | Comparable selection and exceptions correction |
| B4-1.3-09 | 5 | Adjustments and concessions correction |
| B4-1.3-11 | 3 | Reconciliation correction |
| B4-1.2-01 | 5 | Report forms and exhibits |
| Total | 67 | Nine official source records |

Exact official URLs, source IDs, subsection titles, chunk IDs and SHA-256 hashes are in `corpus-plan.json`. Exact captured text, page HTML hash receipts, revision dates and capture timestamps are in `publisher-capture.json`; all sources are official selling-guide.fanniemae.com section pages. No third-party commentary or Atlas summary is inserted as publisher evidence.

`proposed-corpus-load.sql` inserts nine sources with status `staged_provenance_review` and 67 linked authoritative publisher-text chunks. It updates no existing record. Deterministic IDs derive from official URL, captured HTML hash, subsection heading and content hash. Repeating the load aborts rather than duplicating records. No deletes occur in any phase.

`proposed-corpus-activate.sql` atomically changes two legacy source statuses from `current` to `superseded`, changes the nine staged sources to `current`, and changes six legacy chunk authority labels from `authoritative` to `derived`. The six are five unverified/paraphrased passages plus **Reconciliation Research Summary** (`d6e61b42-b75f-4f61-9790-b7c1d7ced295`). Their content remains intact for history, but their superseded sources exclude them from ordinary search. The seventh legacy chunk, a normalized publisher-text match, retains its authority label under a superseded source. Exact legacy IDs and expected content fingerprints are embedded in the SQL. No authorship is inferred for the paraphrases.

`proposed-corpus-rollback.sql` reverses only activation: nine publisher sources become staged again, two old sources become current, and six labels return to their original authoritative values. This deliberately restores the prior imperfect labeling; the engine's summary exclusion remains unchanged. Inserted publisher rows are retained. A failed load transaction rolls back atomically; an approved successful load can remain staged indefinitely without deletion.

## Provenance and limitations

Text is extracted publisher policy-block text, with HTML removed and whitespace/table layout normalized. It is not a byte-for-byte HTML archive. Each chunk's content hash, heading, ordinal and ID are preserved in its source description JSON as well as the local manifest. Source metadata distinguishes `publisher_capture` from legacy derived material. Revision dates are recorded separately in description/version; effective_date and publication_date remain null because a section heading revision date alone does not establish applicability. Capture time is last_verified_at, not a claim of perpetual currency.

All 67 content SHA-256 hashes are recomputed locally. Original HTML hashes are capture receipts: raw HTML was not retained, so those original hashes cannot independently be recomputed from this repository. Capture code and the exact official URL allowlist are committed. Publisher text includes referrals to the UAD 3.6 supplement; the supplement itself is not captured. Do not infer full UAD applicability from these nine pages. Joint Fannie/Freddie UAD records are outside this proposal.

There are no duplicate IDs or duplicate subsection headings within a source. Eight sections intentionally share the same UAD referral text; these remain separate provenance-bearing blocks, not accidental repeated imports.

## Procedure and acceptance gates

1. Confirm approval covers these exact artifacts and compare hashes. Refresh read-only catalog/state checks if the database has changed since the baseline. The known schema contains no user triggers; stop if new triggers or incompatible structure are found. Confirm search still filters source status to current/null. No new SQL mutation is implicitly authorized by drift.
2. Execute the entire approved load transaction once. It locks both knowledge tables against concurrent writes while permitting ordinary reads, checks the exact seven legacy rows/content/labels and two source states, and rejects existing proposed IDs. Do not run fragments or bypass a guard. On an error, roll back the failed transaction rather than continuing within it.
3. Run `proposed-corpus-verify_load.sql` (SELECT only). Require source_count=9, chunk_count=67, source_mismatches=0, chunk_mismatches=0, per-section counts above, two old current sources and seven unchanged old labels. Exact text comparison checks all loaded content; source description preserves SHA-256 linkage. Export only scoped knowledge results if needed and recompute hashes locally.
4. Replay the actual staged records through the engine locally without changing production search. Resolve the documented confidence compatibility blocker honestly; run all eight original substantive regressions, the complete 50-case benchmark, security/research tests, lint and build. Review every newly answered case for qualifications and publisher provenance. Do not count a non-empty answer alone as success. Require no regression in previously successful cases and document remaining coverage gaps. A live original-corpus smoke test should still pass during staging.
5. Only after these gates pass, execute the entire activation transaction. It rechecks exact staged source metadata, content fingerprints, section/version/title/order/null-date fields, relationships/counts, old content and labels under write locks. Old and new corpus statuses change in the same transaction. Staging is a search-selection mechanism, not confidentiality: existing authenticated table readers can see staged rows.
6. Run `proposed-corpus-verify_activate.sql`: require 9/67, zero mismatches, old sources superseded, six derived labels and one original authoritative label. Run authenticated representative UI smoke tests, original eight regressions, 50-case benchmark and security checks. Do not create test credentials; record any unavailable live checks explicitly.
7. If post-activation behavior fails, execute only the approved rollback transaction. Drift guards abort rather than overwrite intervening changes. Rerun load-state verification and original-corpus smoke tests. Any guard failure needs inspection; do not force rollback by editing SQL.

## Evidence for expected benefit and validation limits

Current 50-case baseline: **16 passage-grounded answers / 17 correct abstentions / 17 coverage failures** (33/50 appropriate outcomes). Those 16 answers were grounded in stored passages, not proof those passages were publisher-verbatim. Most observed failures concern wording/specificity rather than demonstrated database retrieval defects. The benchmark uses local replay, not 50 live database requests.

New publisher qualifications and sections should improve coverage of comparable scarcity, foreclosure/short-sale selection, neighborhood, site/zoning, condition, improvements and reporting. No numerical post-expansion improvement is claimed before measurement. `corpus-compatibility-preview.json` records the unchanged engine's eight-question probe: zero complete legacy contracts pass due to Medium confidence. The proposal is safe to stage, but not yet validated for activation.

SQL receives structural, payload, deterministic-output and scope tests against the catalog-derived schema. PostgreSQL tooling is unavailable locally; SQL has not been parsed or executed by PostgreSQL, even in a scratch database. No software was installed. Runtime SQL errors remain possible and must abort transactions, never trigger ad hoc production edits.

## Reproducible artifacts

- `scripts/research/prepare-corpus-proposal.mjs`: local-only generator; no database or network access.
- `scripts/research/preview-corpus.mjs`: local engine replay; no database access.
- `tests/corpus-proposal.test.mjs`: mappings, hashes, IDs, scope, guards, payloads, tamper rejection and artifact reproducibility.
- `corpus-plan.json`: exact source/subsection inventory and corrected legacy IDs.
- `publisher-capture.json`, `provenance-audit.json`, `benchmark-baseline.json`: previously committed source and diagnostic evidence.
- `proposed-corpus-load.sql`, `proposed-corpus-activate.sql`, `proposed-corpus-rollback.sql`: exact unexecuted mutations.
- `proposed-corpus-verify_load.sql`, `proposed-corpus-verify_activate.sql`: exact SELECT-only verification.
- `corpus-compatibility-preview.json`: pre-activation compatibility warning.
- `proposal-checksums.json`: SHA-256 receipts for evidence and SQL artifacts, computed on UTF-8 text with CRLF normalized to LF so Git line-ending conversion does not invalidate review.

Validation on September 14, 2026: 97 automated tests passed, zero failed, nine authenticated live tests deferred (the original eight live questions plus authenticated direct RPC; no credentials created). The eight local existing-corpus regressions pass. Six proposal tests pass. Targeted ESLint and the production build including TypeScript pass. Initial restricted-network test/build attempts could not reach Supabase/Google Fonts; validation was retried with network permission. This does not certify the staged corpus's blocked High-confidence compatibility expectations.

Generate with `node scripts/research/prepare-corpus-proposal.mjs`; preview with `node scripts/research/preview-corpus.mjs`; validate with `npm test`. These commands do not execute the proposal SQL. Do not place these files in an automatically applied migration directory.
