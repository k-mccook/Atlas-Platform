# Publisher compatibility and Confidence V2 review

Activation remains unexecuted. This document supersedes the pre-change compatibility warning in `corpus-compatibility-preview.json` without rewriting that historical receipt.

## What changed

The prior confidence rule required every source to have a version, URL and effective date for High confidence. It conflated a publisher's missing discrete effective date with weak factual support. The engine now reports separate evidence, provenance and temporal states, and retains null effective dates in sources/citations. The UI displays missing-date uncertainty and expandable evidence/version details.

For the reviewed publisher corpus, High requires complete direct coverage, no detected conflict/authority ambiguity, exact content SHA-256 and source metadata matching a server-owned publisher receipt, a capture within the last 30 days, and no explicit historical/version/transition applicability question. Stale/future captures, changed or unknown provenance and temporal questions cannot obtain this publisher High classification. Incomplete/conflicting evidence still abstains at Low. Missing dates alone do not downgrade otherwise verified direct evidence. The 30-day freshness window is an explicit conservative review policy, not a publisher guarantee; revalidation must actually revisit publisher guidance before renewing receipts. This implementation does not automatically refresh them.

The reviewed receipt list is `app/lib/research/publisher-receipts.json`, derived from the committed capture/plan, not supplied by users or inferred from an authority label. It carries no answer text, credentials or activation switch. Tests verify all 67 records against the source corpus. The database function remains responsible for returning only current sources in normal operation. Local staged replay is explicitly a candidate-corpus evaluation, not evidence of activation. The existing RPC does not expose source status/revision/capture metadata, so the repository receipts provide provenance without a database function change. A future generic ingestion system should maintain equivalent verified receipts rather than hand-editing trust claims.

The legacy dated-corpus confidence contract remains compatible; it is explicitly labeled unverified stored evidence with currency not independently verified. This change does not retroactively certify legacy paraphrases. The original eight live current-corpus results remain High and unchanged in substantive behavior. Temporal applicability questions are conservatively capped even for dated legacy records.

Verified publisher subsections are retained as complete paragraph/list units to avoid losing qualifications or list items lacking repeated topic keywords. A lexical alias for the verb “supports” handles requests for an explanation without adding a factual rule. No answer templates or numeric policy rules were added. This also restores the reconciliation “most weight” list item and preserves rural credible-results qualifications. Answers may be long; relevance/length refinement remains future work.

## Eight original questions

All eight pass local publisher tests for authority, topic/category, primary section, exact publisher content, official URL, citation offsets/hash metadata, and required qualifications. All eight currently receive High under the revised, independently tested freshness/provenance rules; they will become Medium if their publisher review expires. Tests use fixed review-relative times for rule boundaries so expiry is not bypassed to keep CI green.

Publisher-supported corrections and qualifications include:

- Market-area search may expand when appropriate; **neighborhood boundaries must not be expanded merely to encompass selected comparables**. The legacy prose and FM32 expectation incorrectly collapsed these different concepts. The staged expectation is corrected; legacy fixtures remain historical controls until activation.
- Distant rural comparables require credible assignment results and an explanation; distance reporting uses straight-line miles and a directional indicator.
- Older comparables may be appropriate, with explanation; recent sales are not automatically the best.
- Concessions reflect market impact, if any. Automatic dollar-for-dollar deductions are inappropriate, but dollar-for-dollar is acceptable when the market reaction equals the full concession. Positive concession adjustments are unacceptable.
- Listings/contracts are supporting data where appropriate; the closed-comparable rule retains the publisher's referral to new-development exceptions.
- The publisher permits use of less-than-truly-comparable sales in scarcity situations with documented analysis and explanation. This is now an answerable benchmark case, although the engine still abstains for that wording.

## Measured benchmark and remaining limits

The same 50 question strings are retained. Publisher expectations replace paraphrase-specific literal wording and recognize newly available sections. All proposition checks are in `tests/benchmark/publisher-cases.mjs`; original baseline expectations remain unchanged for historical comparison.

| Measure | Original legacy baseline | Staged publisher corpus |
| --- | ---: | ---: |
| Grounded answers meeting checks | 16 | 25 |
| Correct abstentions | 17 | 6 |
| Coverage failures | 17 | 19 |
| Incorrect/unsupported answers detected | 0 | 0 |
| Authority failures | 0 | 0 |
| Citation failures | 0 | 0 |
| Confidence failures detected | 0 | 0 |

Seven previous coverage failures improve: FM10, FM11, FM22, FM25, FM27, FM33, FM44. All 16 previous grounded successes remain successful. Two previous abstentions now produce supported answers (FM30 foreclosure sales and FM34 neighborhood boundaries); six remain appropriate abstentions. Nine other former abstentions now have available evidence but still abstain, becoming coverage failures. Thus 19 failures consist of ten remaining old failures plus nine newly answerable gaps. The change in denominator/answerability means 31/50 versus 33/50 appropriate outcomes is not a like-for-like accuracy improvement. No correct abstention turns into an unsupported answer.

Remaining failures: FM09, FM13, FM15–18, FM20–21, FM24, FM26, FM29, FM31–32, FM35–38, FM40 and FM45. Most stem from conservative lexical/specificity matching; subject-sales history, zoning, below-grade area, condition and photos need broader topic/evidence handling. These are diagnostic failures, not hidden as passing tests. No database retrieval rewrite is justified by these results alone. The 25 successes and six intended abstentions are durable regressions.

`benchmark-staged.json` contains the full measured results. This is local replay of all 67 database-verified staged chunks, not a live staged RPC benchmark. It does not reproduce PostgreSQL collation or other-authority competition. The current RPC intentionally cannot return staged sources. The automated evaluator checks known propositions and citations; zero detected unsupported answers is not a claim of exhaustive semantic verification.

Run `node scripts/research/benchmark-staged.mjs` to regenerate the diagnostic report. It performs no database access or mutation. The original 50-case baseline artifact is preserved.

## Activation decision

Data/provenance and original-eight compatibility gates pass. Expanded coverage is incomplete: 19 cases still abstain despite available guidance. Recommend reviewing these limits before activation; do not represent this as a fully passing 50-case suite. Future application improvements can address them without database mutation, but neither activation nor additional database changes are authorized by this document.

No credentials were created, stored or logged. No paid service, package, Auth change, deployment, schema/function/index/grant/RLS change or activation occurred. Automated authenticated-account tests remain deferred; the active database SELECT replay is reported separately rather than substituted for authenticated HTTP testing.

Final validation repeated September 15, 2026: `npm test` completed with **140 passed, zero failed, nine skipped**. The skips are eight live authenticated-account questions and authenticated direct RPC; no credentials were created to run them. Security, existing research, provenance, original eight local regressions, publisher compatibility and 31 durable staged cases pass. Targeted ESLint and the production build (including TypeScript) pass. The separate diagnostic benchmark still has the 19 reported coverage failures; these are not counted as successful test cases. Secret scanning found no credential values or patterns in the changed files. All proposal SQL files remain unchanged from `56d5ac3`.
