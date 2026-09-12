# Ask Atlas Research Engine V2

## Scope and recovery

Milestone 1 checkpoint: `193c8f40a25dc43f802389da6c25f288e936f887`.
The interrupted Milestone 2 work was uncommitted: four modified tracked files,
eight new research modules and three new test/fixture files. No intermediate
Milestone 2 commit existed. Local main and remote main still matched Milestone 1.
The recovered implementation passed 76 available tests before further edits.

The interrupted run had extracted the engine, removed factual templates, added
fixture tests, and passed eight signed-in browser checks. It had not finished
documentation, final review or the Git checkpoint. A build had passed before the
last edits; lint had found a loader variable name subsequently corrected.
The resumed work preserves those changes, consolidates authority/topic analysis,
retains adjacent exception paragraphs, validates official source hosts, improves
test deferral reporting and adds adversarial citation/coverage tests.

No database mutations, ingestion, Auth changes, new users, credentials, packages,
paid AI calls or deployment are part of this milestone. Knowledge-only SELECT
inspection supplied the three stored Fannie passages used as test fixtures.
The fixtures normalize line endings; production offsets use the exact returned content.

## Request and research flow

Previously the route combined authentication, classification, one RPC call,
section filtering, three-chunk selection and per-topic factual templates.
Now the route is an authenticated HTTP adapter:

1. Validate bearer format; verify the user with Supabase `getUser(token)`.
2. Enforce the existing request limits; retrieve using that same user token.
3. Analyze all matching specific topics and named authorities.
4. Retrieve candidates, apply strict authority/provenance checks, rank and select evidence.
5. Check coverage, specifics, potential conflicts and metadata; assemble quoted passages with citations or abstain.

| File | Responsibility |
| --- | --- |
| `app/api/ask-atlas/route.ts` | HTTP authentication, verified-user client, status/error responses |
| `app/lib/research/gateway.ts` | Unchanged body/header limits and bounded, sanitized upstream transport |
| `app/lib/research/types.ts` | RPC row and compatibility topic/authority types |
| `app/lib/research/analysis.ts` | Authority names, all matching topics, labels, Fannie section/URL hints |
| `app/lib/research/retrieval.ts` | Existing RPC, bounded supplementary searches |
| `app/lib/research/evidence.ts` | Provenance eligibility, ranking, paragraphs/context, conflict signals |
| `app/lib/research/confidence.ts` | Direct-support patterns and conservative lexical specificity checks |
| `app/lib/research/citations.ts` | Exact excerpts, source metadata and citation assembly |
| `app/lib/research/engine.ts` | Orchestration, coverage decisions and compatible response |
| `app/components/SearchBar.tsx` | Existing authenticated UI; source grouping now includes section |

All Milestone 1 protections remain: bearer verification, guest rejection, user-token
forwarding, anon public key rather than service-role research credentials, 401/400
semantics, generic failures, 16,384-byte bodies, 2,000 UTF-16-unit questions,
8,192-character authorization headers, five-second body deadline and ten-second
upstream transport deadline. No tokens are logged, returned or added to URLs.
The existing database anonymous-RPC restriction is untouched.

## Retrieval and authority boundaries

The first RPC uses the original question. If its twelve-row result cap is reached,
or multiple concepts are present, at most three additional distinct section-hint
queries run concurrently. Maximum four RPC calls per request. Additional queries
use the same verified-user client. An expansion error fails the request rather
than presenting incomplete retrieval as complete. There is no three-chunk answer
ceiling; all eligible selected evidence participates. Fannie sections are ranking
bonuses, not filters. Title and content matches also contribute; database rank
cannot promote a derived summary above authoritative material.

Authority checks use organization/source metadata plus a credential-free HTTPS
publisher host allowlist. Explicit multiple-authority questions abstain for now.
Unnamed-authority questions abstain if eligible results include multiple
organizations. This does not claim to search every authority exhaustively.
The current SQL search's lexical matching and twelve-row cap still limit recall.
The existing full-text GIN index remains unused by that SQL function. No SQL change
is necessary for this incremental application improvement, and none is proposed
for execution in this checkpoint. A future retrieval milestone should benchmark
an authority-filtered FTS RPC before requesting a specific migration approval.

All specific matching topic rules contribute to `topics`, including multiple
concepts in one clause. The first matching topic retains the legacy `topic` and
category priority. Generic comparable/sales-comparison mentions do not add a
redundant topic when more specific concepts already match. This remains a
deterministic vocabulary, not general natural-language understanding.

## Grounding and citations

All previous per-topic factual answer templates are removed, including the eight
validated topics and reconciliation/general comparable templates. Remaining
hard-coded material is classification vocabulary, direct-support checks, labels,
official URL mappings, citation formatting and the unchanged insufficient-guidance
message. None supplies an appraisal rule to an answer.

Answers reproduce complete selected paragraphs without rewriting `must`, `may`,
`generally` or conditional language. Adjacent explicit exception/continuation
paragraphs are retained. Each `answer_part` has its exact text, chunk ID and UTF-16
start/end offsets. Its citation includes authority, section, official URL, version
and effective date. Sources retain the original full chunk content. Section-aware
UI grouping preserves links to several sections from the same source document.

Stored material labeled derived, summary, training or Atlas is excluded, even if
it also carries an authoritative flag. Other evidence must carry an authoritative
or primary flag and an official URL. These are corpus provenance signals, not proof
that the stored prose is a verbatim publisher original. `material_type` explicitly
means stored authoritative evidence. Publisher verification and original/derived
lineage remain needed before broader content expansion.

The previous distance template asserted no maximum mileage, which the stored
passage does not state. It now returns the conditional distant-comparable guidance.
The concessions answer no longer adds the unsupported face-amount comparison.
Neither absence of a rule nor a topic match becomes a new factual proposition.

## Confidence and limits

High requires eligible authoritative passages, direct-support patterns for every
recognized concept, no unmatched question specifics, one applicable authority,
no detected conflict and available URL/version/effective-date metadata. Missing
version/date metadata reduces a supported answer to Medium. Missing support,
authority ambiguity or detected conflict yields Low and the unchanged fallback.
`coverage` and `confidence_reasons` expose these decisions. High describes support
within the retrieved corpus; it is not certification that guidance is current or
publisher-verified.

Specificity checks use lexical normalization and a small synonym vocabulary.
They conservatively abstain on unfamiliar details; word overlap is not semantic
entailment. Conflict checks detect opposite modal wording and inconsistent versions
within the same authority/section, not arbitrary paraphrased contradictions.
Continuation detection cannot resolve exceptions in an unretrieved section.
These limitations must not be represented as a complete legal-rule reasoning engine.

## Validation and extension

`npm test` discovers both test files. The shared in-memory TypeScript loader resolves
relative local modules while retaining isolated client/fetch/log injections.
No production files are rewritten by tests. Nine account-dependent checks are
explicitly deferred individually when both approved test credentials are absent:
the eight live handler regressions and direct authenticated RPC. Partial credential
configuration, public configuration failures and actual test failures still fail.
No test account was created or credentials stored.

Available coverage: 49 original isolated authentication/gateway checks, two live
public-access checks, eight evidence-fixture regressions, and 25 engine checks.
Engine tests cover authority isolation, unsupported specifics, missing support,
derived sources, conflicts/versions, multi-concept coverage, more than three chunks,
bounded expansion and failure, exception context, official URLs and citation offsets.
The eight fixture regressions check expected categories/sections/confidence and
important factual passages; the live regressions retain their original expectations.

Add questions to `tests/ask-atlas.cases.mjs`; add reviewed evidence and factual
expectations separately. Add authority aliases/official hosts with negative tests.
Avoid extending topic vocabulary without tests for missing and conflicting evidence.
Run targeted lint and `npm run build` for real TypeScript/Next validation; the loader
transpiles rather than type-checks. Signed-in browser tests complement the automated
suite without extracting or storing session credentials.

Remaining work: independently verified source/version lineage; better query intent
and semantic/conflict evaluation; authority-aware FTS retrieval; concise quote
presentation and partial-coverage UX; repeatable approved live-account CI testing.
Backend-only access and shared quotas/rate limits remain launch-security blockers
from Milestone 1 and are not enabled by this research refactor.

Recommended next major milestone: authoritative evidence provenance and retrieval
evaluation, beginning with a publisher-to-corpus audit of these three Fannie sections
and an adversarial benchmark before expanding content or changing the RPC.

## Final validation record — 2026-09-12

`npm test`: 84 passed, zero failed, nine explicitly deferred. Targeted ESLint
and the production build (including TypeScript checking) passed. All eight
questions also passed in the existing signed-in browser session with the expected
Fannie authority, category, section, official link, factual passage and High confidence.
Anonymous application access returned 401; direct anonymous RPC denial passed.
The authentication/validation block and gateway limits were compared with
Milestone 1 and remain unchanged. Diff review found no credentials, sensitive
logging, unrelated changes or database-changing artifacts.
