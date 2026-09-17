// Offline evaluation of freshly captured REAL PostgreSQL RPC results. No lexical replay,
// database connection, credentials, mutations, or changes to benchmark expectations.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { loadTypescript } from '../../tests/load-typescript.mjs';
import { publisherCases } from '../../tests/benchmark/publisher-cases.mjs';
import { cases } from '../../tests/ask-atlas.cases.mjs';
import { publisherChecks } from '../../tests/fixtures/publisher-corpus.mjs';
import { assess } from './benchmark.mjs';
const { research, INSUFFICIENT } = loadTypescript('app/lib/research/engine.ts');
const { publisherReceipt, evidenceConfidence } = loadTypescript('app/lib/research/provenance.ts');
const input = process.argv[2];
assert.ok(input, 'Pass a JSON file containing actual SQL-editor search_knowledge results');
const capture = JSON.parse(await readFile(input, 'utf8'));
const queries = new Map(capture.results.map(row => [row.query, row.rows]));
const requested = new Set();
const client = { rpc: async (name, { search_query }) => {
  assert.equal(name, 'search_knowledge');
  assert.ok(queries.has(search_query), `Uncaptured production query: ${search_query}`);
  requested.add(search_query);
  return { data: queries.get(search_query), error: null };
} };
const results = [];
const compatibility = [];
for (const entry of publisherCases) {
  const response = await research(entry.question, client);
  const result = assess(entry, response);
  if (response.sources.some(row => !publisherReceipt(row))) result.failures.push('provenance_failure');
  if (result.failures.length) result.outcome = 'failure';
  result.publisher_provenance = response.sources.length ? 'hash_verified_capture' : 'not_applicable';
  result.coverage = response.coverage;
  results.push(result);
  const core = cases.find(row => row.question === entry.question);
  if (core) {
    const checks = {
      nonempty_grounded_answer: !!response.answer && response.answer !== INSUFFICIENT,
      authority: response.target_source === core.authority && response.sources.every(row => row.organization === core.authority),
      topic_category: response.topic === core.topic && response.category === core.category,
      primary_section: response.primary_section === core.section,
      publisher_evidence: response.sources.length > 0 && response.sources.every(row => !!publisherReceipt(row)),
      qualifications: publisherChecks[core.topic].every(pattern => pattern.test(response.answer)),
      citations: response.answer_parts.length > 0 && response.answer_parts.every(part => {
        const source = response.sources.find(row => row.chunk_id === part.chunk_id);
        const citation = response.citations.find(row => row.id === part.citation_id);
        return source && citation && source.content.slice(part.start, part.end) === part.text &&
          citation.source_url === source.source_url && citation.section === source.section &&
          citation.material_type === 'publisher_capture' && !!citation.content_sha256 && citation.effective_date === null;
      }),
      official_urls: response.sources.every(row => /^https:\/\/selling-guide\.fanniemae\.com\/sel\//.test(row.source_url)),
      confidence: response.confidence === evidenceConfidence(response.sources, true, core.question).confidence,
    };
    compatibility.push({ topic: core.topic, section: response.primary_section, confidence: response.confidence,
      passed: Object.values(checks).every(Boolean), checks });
  }
}
const staged = JSON.parse(await readFile('docs/research/milestone-3/benchmark-staged.json', 'utf8'));
const count = outcome => results.filter(row => row.outcome === outcome).length;
const report = {
  captured_at: capture.captured_at,
  methodology: 'Actual activated PostgreSQL public.search_knowledge results collected by read-only SELECT in the existing authenticated Supabase SQL editor, including real ranking, collation, twelve-row limit, current-source filter and other-authority competition. Unmodified Research Engine consumes exactly those returned rows, including bounded expansion queries. Not a lexical replay and not fifty authenticated HTTP requests; application authentication/UI is validated separately.',
  activation_executed: true, captured_queries: queries.size, consumed_queries: requested.size,
  total: results.length, correct_grounded_answers: count('correct_grounded_answer'),
  correct_abstentions: count('correct_abstention'), failed_cases: count('failure'),
  failure_counts: Object.fromEntries(['incorrect_answer','wrong_section_retrieval','incomplete_evidence_coverage','authority_failure','citation_failure','confidence_calibration_failure','provenance_failure'].map(key => [key,results.filter(row=>row.failures.includes(key)).length])),
  differences_from_staged: results.filter(row => { const old = staged.results.find(r=>r.id===row.id); return row.outcome !== old.outcome || JSON.stringify(row.failures)!==JSON.stringify(old.failures); }).map(row=>({id:row.id,outcome:row.outcome,failures:row.failures})),
  compatibility, results,
};
await writeFile('docs/research/milestone-3/benchmark-production.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:undefined},null,2));
