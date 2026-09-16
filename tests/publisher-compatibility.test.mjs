import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypescript } from './load-typescript.mjs';
import { cases } from './ask-atlas.cases.mjs';
import { publisherRows, publisherChecks } from './fixtures/publisher-corpus.mjs';
import { replayClient } from '../scripts/research/benchmark.mjs';
const { research, INSUFFICIENT } = loadTypescript('app/lib/research/engine.ts');
const { publisherReceipt, evidenceConfidence, REVIEW_WINDOW_MS } = loadTypescript('app/lib/research/provenance.ts');
const row = publisherRows[0];
const captured = Date.parse(publisherReceipt(row).verified_at);

for (const entry of cases) test(`publisher compatibility: ${entry.topic}`, async () => {
  const result = await research(entry.question, replayClient(publisherRows));
  assert.notEqual(result.answer, INSUFFICIENT);
  for (const field of ['topic', 'category']) assert.equal(result[field], entry[field]);
  assert.equal(result.target_source, entry.authority); assert.equal(result.primary_section, entry.section);
  for (const pattern of publisherChecks[entry.topic]) assert.ok(pattern.test(result.answer), `${entry.topic}: missing qualification ${pattern}`);
  assert.ok(result.sources.length > 0);
  for (const source of result.sources) { assert.equal(source.organization, 'Fannie Mae'); assert.ok(publisherReceipt(source)); }
  for (const part of result.answer_parts) {
    const source = result.sources.find(source => source.chunk_id === part.chunk_id);
    const citation = result.citations.find(citation => citation.id === part.citation_id);
    assert.equal(source.content.slice(part.start, part.end), part.text);
    assert.equal(citation.material_type, 'publisher_capture'); assert.equal(citation.section, source.section);
    assert.equal(citation.source_url, source.source_url); assert.equal(citation.effective_date, null);
    assert.ok(citation.content_sha256); assert.ok(citation.publisher_verified_at);
  }
  assert.equal(result.confidence_state.provenance, 'verified_publisher_capture');
  assert.equal(result.confidence_state.effective_date_missing, true);
  const expected = evidenceConfidence(result.sources, true, entry.question).confidence;
  assert.equal(result.confidence, expected); // time-sensitive receipt expiry must remain conservative
});
test('verified, recent and direct publisher evidence can be High without an effective date', () => {
  const result = evidenceConfidence([row], true, 'Fannie Mae guidance', captured + 1);
  assert.equal(result.confidence, 'High'); assert.equal(result.effective_date_missing, true);
  assert.equal(result.temporal, 'recent_publisher_capture');
});
test('missing dates do not override stale, future, unknown or mismatched provenance', () => {
  for (const now of [captured - 1, captured + REVIEW_WINDOW_MS + 1]) assert.equal(evidenceConfidence([row], true, 'Fannie Mae guidance', now).confidence, 'Medium');
  for (const changed of [{content:row.content+' invented'}, {source_version:'unknown'}, {source_url:'https://example.com'}, {chunk_id:'unknown'}, {effective_date:'2025-06-04'}]) {
    const candidate = {...row,...changed};
    assert.equal(publisherReceipt(candidate), null);
    assert.equal(evidenceConfidence([candidate], true, 'Fannie Mae guidance', captured + 1).confidence, 'Medium');
  }
});
test('applicability and incomplete/conflicting evidence stay conservative', () => {
  for (const question of ['As of 2024, what applies?', 'Which effective date applies?', 'Does UAD 3.6 apply?']) assert.equal(evidenceConfidence([row], true, question, captured + 1).confidence, 'Medium');
  assert.equal(evidenceConfidence([row], false, 'Fannie Mae guidance', captured + 1).confidence, 'Low');
});
