# Fannie publisher corpus activation — September 16, 2026

**Activation executed successfully; rollback was not required or executed.** This receipt supersedes historical activation-gate statements in the staged-load, compatibility, recognition-pass and original proposal documents. Reviewed SQL files deliberately retain their original contents and historical headers.

## Recovered state and preflight

At the recovery request, activation, production retrieval assessment, tests, build, lint, TypeScript and browser smoke checks had completed. Four files were untracked: the activation receipt, production benchmark, query list and evaluator. The documentation patch had failed atomically; no checkpoint had been committed/pushed. Valid work was retained. Activation was not rerun. A fresh SELECT-only verification reconfirmed the successful activated state.

Before activation, Git was clean on `main` at `cfd36b79fef6d8440ba486f41ceb782acea3f3b6`. Live `origin/main` matched. The activation file matched the reviewed version from `56d5ac3c9043895aa3b34778cf7464f1545e2a0d`. Its normalized UTF-8/LF SHA-256 was verified before execution and again on recovery:

`2931154dc8f8c58303ce2b86dfcacce8144a004c6c1cb2dd8ef68a03380f78fd`

Preflight SELECT verified nine staged sources, 67 chunks, zero source/chunk mismatches, both legacy sources current and all seven legacy labels authoritative. Existing transaction guards checked legacy fingerprints and exact publisher records before updates.

Only the unchanged `proposed-corpus-activate.sql` was executed, once, through the existing signed-in Supabase SQL editor. It returned `Success. No rows returned.` The staged load was not repeated. All subsequent SQL was read-only verification/retrieval.

## Verified database result

`activation-verification.json` contains actual before/after verification, catalog definitions/ACLs and legacy fingerprints. Exact-record comparison covers all reviewed publisher fields except generated creation timestamps: text, relationships, official URLs, versions, provenance descriptions and hashes.

- Nine intended publisher sources are **current**, with **67 authoritative chunks** correctly linked. Source mismatches: **0**; chunk mismatches: **0**.
- Both intended legacy sources are **superseded**. All seven legacy chunks remain with unchanged content fingerprints and source relationships.
- Exactly the intended six legacy chunks are **derived**, including `Reconciliation Research Summary` (`d6e61b42-b75f-4f61-9790-b7c1d7ced295`). Its superseded source excludes it from current search; application filtering independently excludes derived/summary evidence.
- The remaining legacy publisher-matching chunk retains its authoritative label under a superseded source. No publisher chunk was relabeled derived. No records or text were deleted.
- Function definition, postgres ownership, SECURITY DEFINER mode, execution ACL, table ACLs, indexes, RLS enablement/policies and zero user-trigger count compare identical before/after. No schema, function, index, grant, RLS, Auth, user or credential changes were performed.

| Section | Publisher chunks |
| --- | ---: |
| B4-1.2-01 | 5 |
| B4-1.3-03 | 9 |
| B4-1.3-04 | 10 |
| B4-1.3-05 | 13 |
| B4-1.3-06 | 11 |
| B4-1.3-07 | 4 |
| B4-1.3-08 | 7 |
| B4-1.3-09 | 5 |
| B4-1.3-11 | 3 |

Counts concern the approved Fannie scope, not all database authorities. The approved SQL contains no DELETE or object/security mutation. No unrelated application data was saved in validation artifacts.

## Actual production retrieval benchmark

`benchmark-production.json` is distinct from the unchanged staged lexical replay in `benchmark-staged.json`.

All 50 unchanged benchmark questions and nine distinct expansion queries were submitted to **actual production `public.search_knowledge(text)`** through read-only SELECT. The 677 returned rows across 59 queries include real PostgreSQL collation, ranking, twelve-row cap, current-source filtering and competing authorities. The unmodified Research Engine consumed those exact results, including every requested expansion. No lexical simulation or Fannie-only prefilter was used.

The SQL editor uses its existing database identity: this verifies real production retrieval and engine behavior, **not 50 end-to-end user-token HTTP requests**. Browser smoke tests and anonymous checks separately verify the application gateway. No account credentials were extracted/stored for automation.

| Measure | Original legacy | Staged replay | Activated production |
| --- | ---: | ---: | ---: |
| Grounded answers | 16 | 40 | **40** |
| Correct abstentions | 17 | 6 | **6** |
| Coverage failures | 17 | 4 | **4** |
| Unsupported/incorrect answers detected | 0 | 0 | **0** |
| Wrong-section failures | — | 0 | **0** |
| Authority failures | 0 | 0 | **0** |
| Citation failures | 0 | 0 | **0** |
| Confidence failures | 0 | 0 | **0** |
| Publisher provenance failures | not certified | 0 | **0** |

No outcome/failure differs from staged replay. All six intended abstentions remain; none was lost. Thirteen original coverage failures are corrected; eleven former abstentions now have publisher-supported answers. No previously successful answer regressed. These are failures detected by the fixed checks, not proof of safety for every possible question.

### Original eight compatibility cases

Every case passed authority, topic/category, primary section, nonempty answer, publisher provenance/hash, qualifications/exceptions, exact citation offsets, official URL and confidence checks.

| Topic | Primary section | Confidence | Result |
| --- | --- | --- | --- |
| adjustments | B4-1.3-09 | High | Pass |
| distance | B4-1.3-08 | High | Pass |
| older_comparables | B4-1.3-08 | High | Pass |
| rural_comparables | B4-1.3-08 | High | Pass |
| market_area | B4-1.3-08 | High | Pass |
| verification | B4-1.3-07 | High | Pass |
| listings_contracts | B4-1.3-08 | High | Pass |
| concessions | B4-1.3-09 | High | Pass |

Discrete effective dates remain unavailable/null and visible as uncertainty. Recent verified publisher evidence can support High evidentiary confidence without invented dates; stale receipts and date/version applicability remain conservative.

### Repeating the measurement

`production-retrieval-queries.json` lists the exact 59 queries. Collect fresh read-only batches shaped as:

```sql
SELECT json_agg(json_build_object(
  'query', q,
  'rows', (SELECT coalesce(json_agg(r), '[]'::json)
           FROM public.search_knowledge(q) r)
)) AS results
FROM json_array_elements_text('<properly SQL-escaped JSON query array>'::json) q;
```

Combine results into `{ "captured_at": "<UTC timestamp>", "results": [...] }`. Raw knowledge results were held in a local temporary file, not committed as duplicate corpus text. Run `node scripts/research/assess-production-capture.mjs <capture-file>` from the repository root. It uses unchanged benchmark classifications/propositions, fails on uncaptured engine queries and writes the production report. It has no network/database mutation capability. Evaluating captured results is explicitly distinct from a fresh database run.

## Security, browser and full validation

- `npm test`: **182 tests; 173 passed, 0 failed, 9 deferred**. Covers authentication/gateway, Research Engine V2, original fixture regressions, publisher compatibility, provenance, confidence, adversarial/abstention and staged benchmark regressions.
- Deferred: eight account-based authenticated integrations and authenticated direct-RPC integration. No test credentials or users were added.
- Live public integration confirmed forged authentication rejection and direct anonymous RPC denial. EXECUTE remains postgres/authenticated/service_role only; PUBLIC/anon remain denied.
- Real unauthenticated POST to the production-build `/api/ask-atlas`: **401**, generic sign-in response.
- Existing signed-in browser: adjustments returned B4-1.3-09 with High confidence; verification returned B4-1.3-07 with specific-source/disinterested-verification qualifications. Official links and missing-date uncertainty displayed. Zoning-plus-bitcoin correctly abstained at Low confidence. These demonstrate successful authenticated application handling; individual HTTP statuses were not separately instrumented.
- Browser URLs contained no tokens; the inspected console had zero captured entries. No token was extracted, displayed, persisted or put in a URL.
- Targeted ESLint (gateway, SearchBar, research modules, tests and research scripts): **pass**.
- `tsc --noEmit --incremental false`: **pass**.
- Production build, Next.js 16.2.11: **pass**.

No application source, test expectation, engine behavior, package or configuration changed. Repository additions are validation tooling and documentation/receipts. Final diffs were inspected for credentials, secrets, user/assignment records and unrelated changes.

## Remaining limitations and Milestone 4

Four conservative failures are unchanged: **FM13** (replace all closed comparables with listings), **FM15** (15% net), **FM16** (25% gross), **FM26** (18-month comparable). General publisher guidance exists, but the engine does not yet safely establish those substitution/numeric/applicability relationships. It abstains. Grounding and benchmark expectations were not weakened.

Answers can contain overly broad, lengthy excerpts and duplicated cross-reference labels inherited from publisher markup. Improve relevance/readability without deleting qualifications or altering source text. Keyword ranking's twelve-row cap, receipt freshness and version applicability remain limitations. Backend-only access and shared per-user/IP/global quotas remain separate launch-security work; activation changed no security architecture.

Recommended **Milestone 4: bounded reasoning and concise evidence selection**, with explicit proposition/qualifier relationships, contradiction-safe numeric premise handling, tests for all four remaining cases and preservation of citations/exceptions. Production launch still requires the separately approved backend-only gateway and shared abuse controls.

Rollback was not triggered: production retained staged safety properties without material regression. Reviewed rollback remains unchanged at normalized SHA-256 `85475dae97af421a3ee81bd8608da2b8d67550ec092ab1f4ec74711391bac036`; it was not executed.
