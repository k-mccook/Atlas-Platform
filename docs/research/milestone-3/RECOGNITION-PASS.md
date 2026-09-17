# Application-only recognition pass — activation still unexecuted

Historical pre-activation report. See [ACTIVATION.md](ACTIVATION.md) for the subsequent approved activation and actual production results.

Starting checkpoint: `bd694b64ea837f5d6da38c9173e64874e3123624`, clean main. The starting benchmark was reproduced before editing: 25 grounded / 6 correct abstentions / 19 coverage failures, zero unsupported answers. Its exact report is preserved in `benchmark-first-staged.json`. The benchmark question strings, classifications and proposition checks were not changed in this pass.

A fresh SELECT-only run of `proposed-corpus-verify_load.sql` confirmed nine sources and 67 chunks, zero field mismatches, staged_provenance_review status, and both legacy sources still current. No database mutation, activation, schema/function/index/grant/RLS/Auth change, credential creation or paid service was used. Load/activation SQL files are unchanged.

## Failure analysis and changes

`failure-analysis-before.json` captures all 19 initial failures. Six were missing classification/decomposition (sales history, zoning, below-grade area, condition, photos and adjustments-plus-zoning). Thirteen primarily involved literal terminology/qualifier checks. Relevant publisher text exists for all 19. The scarcity case also needed the selection logic to retain its noncomparable-sales qualification, rather than citing only the rural-distance paragraph.

The implementation adds five reusable concepts and section hints. Focused, bounded RPC expansion terms select relevant subsections even when the original wording is sparse. Multi-topic recognition retains each concept; retrieval still makes at most four RPC calls. No database function or index change is needed for these improvements.

Publisher-only linguistic normalization handles comp/comps, photos/pictures, non-conforming, financially interested, permitted, grammatical question words and similar variations. Numbers, negation and substantive unknown terms remain required. An “always” premise can be addressed only when a cited paragraph for the primary topic contains an explicit qualification or prohibition. No factual answer templates, benchmark question strings, numeric policy limits or new facts were added to the engine.

Scarcity/noncomparable selection is included in rural evidence matching so its complete publisher subsection and qualifications are retained. Responses continue to quote retrieved evidence with exact offsets and hashes. Coverage metadata now reports missing topics and unmatched terms. Partial multi-part evidence yields the existing insufficient-guidance answer at Low confidence, while metadata distinguishes recognized supported topics from missing portions; it is not presented as a complete answer.

## Measured results

| Measure | Legacy baseline | First staged | Final staged |
| --- | ---: | ---: | ---: |
| Grounded answers | 16 | 25 | 40 |
| Correct abstentions | 17 | 6 | 6 |
| Coverage failures | 17 | 19 | 4 |
| Unsupported/incorrect answers detected | 0 | 0 | 0 |
| Authority failures | 0 | 0 | 0 |
| Citation failures | 0 | 0 | 0 |
| Confidence failures | 0 | 0 | 0 |

Fifteen of the 19 initial failures are corrected, including **all nine priority evidence-available abstentions**: FM18, FM20, FM29, FM31, FM35, FM36, FM37, FM38 and FM45. All previously successful staged answers and all six intended abstentions remain successful. Compared with the original legacy baseline, 13 of its 17 coverage failures are now corrected; 11 former abstentions now have publisher-supported answers. None became an unsupported answer.

Four conservative coverage failures remain:

- FM13: replacing all closed comparables with listings. Relevant minimum/supporting-data guidance exists, but the engine does not yet prove the substitution relation.
- FM15 and FM16: proposed 15% net and 25% gross limits. The publisher rejects specific limits, but the coverage checker deliberately does not discard unmatched numeric thresholds.
- FM26: an 18-month-old comparable. Older-sale guidance is available, but mapping an arbitrary number to that general qualification is not implemented.

These four are application reasoning limits, not demonstrated missing corpus or database retrieval defects. No database change is proposed. The six intended abstentions include unsupported numeric rules, unavailable other-authority guidance, ambiguous authorities and unsupported premises; coverage beyond the captured nine Fannie sections remains out of scope.

`failure-analysis-after.json` provides per-case final coverage, missing terms and remaining cause. Regenerate with `node scripts/research/analyze-staged-failures.mjs`. `benchmark-staged.json` is the final 50-case diagnostic report; regenerate with `node scripts/research/benchmark-staged.mjs`. Both are local-only. The latter retains the original replay caveats: it is not a live activated corpus test, does not model PostgreSQL collation or competing authority rows, and zero detected unsupported answers is not exhaustive semantic certification.

## Validation and decision

All eight original publisher compatibility cases pass, retaining their topics/categories, Fannie sections, official URLs, provenance, citation offsets, qualifications and appropriate confidence. Existing security, legacy research, provenance and confidence regressions remain intact. New tests cover nine non-benchmark wording variants, seven unsupported/authority adversarial variants, bounded multi-topic retrieval and partial evidence. All 40 staged grounded successes and six correct abstentions are durable regressions.

The full automated suite passes: **173 passed, zero failed, nine deferred**. Deferred tests remain the eight authenticated-account HTTP requests plus authenticated direct RPC; no credentials were created. An initial build caught two regex flags incompatible with the project's TypeScript target; equivalent character classes fixed that issue without changing semantics.

Targeted ESLint, TypeScript and the final production build pass. Changed files: research `analysis.ts`, `confidence.ts`, `engine.ts`, `evidence.ts`, `retrieval.ts`, `types.ts`, new `terminology.ts`; `tests/staged-benchmark.test.mjs`, new `tests/research-recognition.test.mjs`; new `scripts/research/analyze-staged-failures.mjs`; the final/first staged benchmark reports, before/after failure analyses, this report and the historical compatibility report link. No API authentication, gateway, browser-token handling, production corpus, or activation artifacts were changed.

Recommendation: the staged corpus is ready for a separately approved activation with the four documented conservative limitations and post-activation live checks. The original-eight compatibility and provenance gates pass, coverage materially improves, and the six intended abstentions remain intact. Do not treat this recommendation as authorization. Activation has NOT occurred.

Unchanged activation file: `proposed-corpus-activate.sql`. Normalized UTF-8/LF SHA-256: `2931154dc8f8c58303ce2b86dfcacce8144a004c6c1cb2dd8ef68a03380f78fd`.
