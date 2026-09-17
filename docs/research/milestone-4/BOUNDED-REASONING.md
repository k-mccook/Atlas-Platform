# Bounded evidence reasoning

Milestone 4 adds three small evidence-gated coverage rules. They do not generate factual answer sentences. Responses continue to quote complete publisher subsections with existing citations, offsets and qualifications.

1. A proposed numerical cap on net/gross adjustments can be covered by a retrieved explicit denial of limits on that same metric. The metric must match; unrelated quantities and unknown qualifiers remain required.
2. A concrete month age beyond the recent-sales window can be covered by the publisher's qualified older-sales permission. The window comes from the retrieved text. The answer retains appropriateness and explanation requirements; it does not certify an individual comparable.
3. Replacing all required closed sales with listings can be answered by the positive minimum requirement plus the supporting-data provision. The whole subsection and exception reference remain in the answer; this is not an unconditional claim that exceptions never exist.

All three rules require intact server-owned publisher receipts and matching content hashes. They transform only the question used for lexical coverage. The original question still drives retrieval, authority selection and temporal confidence. Conflict, partial-topic support, unknown specifics, multiple authorities, stale provenance and applicability uncertainty retain their existing safeguards. A successful response includes `reasoning` rule identifiers and the supporting chunk IDs; an abstention exposes no successful reasoning steps.

This is deliberately bounded pattern recognition, not a general entailment system. Unrecognized paraphrases can still abstain. No benchmark question strings, fixed answer templates, universal numeric tolerance, or removal of arbitrary numeric qualifiers are used. Publisher wording changes require reviewed receipts and possibly parser updates.

## Validation before gateway cutover

Run `node scripts/research/benchmark-reasoning.mjs` to regenerate the separate local replay report. This does not contact or mutate the database, and it does not overwrite any Milestone 3 report.

The unchanged fifty publisher cases yield **44 grounded / 6 correct abstentions / 0 coverage failures**, with zero detected incorrect-answer, authority, citation, confidence or provenance failures. All four previous conservative cases now pass. This is **local publisher replay**, not a new production retrieval capture or fifty authenticated HTTP requests.

Twenty-two additional tests cover alternate numerical values, decimal percentages, alternate month ages, replacement wording, unsupported qualifiers, other/multiple authorities, missing/tampered evidence, unrelated numbers and historical applicability. The four prior failures are also now included in the durable fifty-case assertions. Factual expectations and answerability classifications were not changed.

The original eight publisher compatibility cases and prior terminology/confidence checks pass. The combined focused run is 102 passed, zero failed; targeted ESLint passes. Full application validation is recorded with the gateway approval package.
