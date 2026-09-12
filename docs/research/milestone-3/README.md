# Milestone 3 — provenance, benchmark and corpus proposal

State: **local preparation; no production corpus mutation executed**.
Baseline: `03142a388e1271893cdf9775367af58acdf808db`, clean main matching
GitHub main; 84 automated checks passed and nine credential-dependent checks
remained deferred on 2026-09-12.

## Audit

Read-only production inspection found seven Fannie Selling Guide chunks across
two sources. `provenance-audit.json` records each ID, stored-text hash, publisher
URL and classification. Five are paraphrases or unverified derivations, one is
an explicitly derived Reconciliation Research Summary, and one reconciliation
passage matches publisher text after punctuation/case normalization. Authorship
of the paraphrases cannot be recovered from current metadata. They must not be
promoted to verified publisher text on the strength of the authoritative label.
The summary is already excluded by the running engine's title checks; the new
audit tests separately demonstrate that a summary cannot earn publisher verification.

Official section pages for B4-1.3-07, -08, -09 and -11 exist and show a
06/04/2025 heading revision. That date does not establish every rule's effective
date. The database calls it an effective date and uses a mutable "Current" version
label. The original import method, original HTML/hash and publisher passage offsets
are not recorded. Source-level verification timestamps alone do not repair this.

Specific content gaps found in publisher comparison:

- **07:** source/verification wording was paraphrased; the UAD applicability referral was omitted.
- **08:** omitted proximity measurement, scarcity, foreclosure/short-sale and new-development qualifications. The legacy text conflates expanding a search area with redrawing neighborhood boundaries.
- **09:** omitted detailed concession and time-adjustment qualifications.
- **11:** three rewritten passages accompany one close publisher match; the summary is not primary evidence.

The same read-only query also found four joint Fannie/Freddie UAD records under
source `0012a8e6-61b7-4742-a879-f1f5b1e477dd`, with null sections/titles, dates
2026-01-26, 2026-03-10, 2026-06-04 and 2026-06-23, and a common UAD landing URL.
Their leaf-document provenance is unverified. The landing-page lookup timed out;
do not treat the date fields as verified policy-effective dates. These joint
records are excluded by strict named-Fannie matching and are not included in
this Fannie-only corpus expansion or benchmark replay. No joint-authority data
was modified or newly ingested.

## Benchmark

`tests/benchmark/fannie-cases.mjs` contains 50 questions: the permanent eight plus
paraphrases, terminology, multi-part, qualification, misleading-premise, missing
content, unsupported and authority-ambiguity cases. Expectations reference the
inspected legacy corpus. Missing publisher content is not silently assumed present.

Run `node scripts/research/benchmark.mjs`. It executes the real V2 research engine
with the seven inspected Fannie chunks and a deterministic replay of the current
RPC's term matching, ordering and twelve-row limit. This is **not a live database
benchmark**: joint UAD/other-authority competition and database collation are not
modeled. `benchmark-baseline.json` preserves each question, result and failure.

Baseline result: **33/50 appropriate responses (66%)**: 16 passage-grounded answers,
17 correct abstentions, 17 incomplete-coverage failures. Zero observed incorrect
answers, section failures, citation failures, authority failures or confidence
category failures under these checks. All 16 answers still rely on legacy corpus
provenance and are **not certified publisher-verified answers**. This distinction
must accompany the score.

Root causes for failures: 16 coverage/assembly failures, mainly conservative
lexical specificity and unrecognized wording; one primary classification failure
(subject sales history). No evidence of a database retrieval bottleneck is established
by this small replay. Correct abstentions also identify corpus gaps in foreclosures,
short sales, site/zoning, below-grade area, condition and report exhibits.
Numeric myths and unusual wording should be improved with intent/evidence tests,
not blanket relaxation of abstention or hard-coded answers.

The benchmark command is diagnostic and writes all failures; it does not assert a
fake 100% success rate. Unit tests lock the existing 33 successful cases and test
the evaluator's ability to flag false answers. Benchmark failures are reported
separately from the passing automated unit/security test count.

## Reproducible publisher capture

`node scripts/research/capture-fannie.mjs <new-output-directory>` fetches only
the nine official URLs in `scripts/research/fannie-sections.mjs`. It refuses
redirects, checks section/title/date/HTML structure, and refuses to overwrite an
existing capture. It requires no account, secret, paid service or added package.
It never connects to Supabase. `publisher-capture.json` contains **nine pages and
67 complete policy subsections**, approximately 96,000 characters, for local
review only. None has been added to production.

Sections: B4-1.3-03, -04, -05, -06, -07, -08, -09, -11 and B4-1.2-01.
Captures preserve policy paragraphs, lists and table cell text; each block has a
SHA-256 and the source page has an HTML hash, official URL, title, revision date
and verification timestamp. Page dates remain revision dates; unverified effective
dates are null. UAD 3.6 policy referrals are retained. Capturing a referral does
not capture the referred supplement or establish its applicability to an assignment.
Table text is linearized with cell separators; original visual layout is not reproduced.

`node scripts/research/audit-provenance.mjs` compares legacy passages with those
captures. Matching is a provenance signal, not a semantic accuracy certificate.
The stored snapshot files contain knowledge material only, not user/assignment
records or credentials. Production behavior and all security controls remain unchanged.

## Approval boundary

The next stage requires a consolidated reviewed database operation to archive the
two legacy Fannie sources, correct derived labels and add verified publisher rows.
Do not execute any such operation merely by running the capture/audit/benchmark
scripts. No schema/RPC/index/grant/RLS change is justified by this baseline.
Runtime support and benchmark expectations must be validated against the exact
approved new corpus, including revision-date semantics and UAD qualifications,
before claiming expanded product coverage or enabling a production checkpoint.
