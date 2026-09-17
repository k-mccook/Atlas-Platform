import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypescript } from './load-typescript.mjs';
import { publisherRows } from './fixtures/publisher-corpus.mjs';
import { publisherCases } from './benchmark/publisher-cases.mjs';
import { assess, replayClient } from '../scripts/research/benchmark.mjs';
const { research, INSUFFICIENT } = loadTypescript('app/lib/research/engine.ts');
const { boundedReasoning } = loadTypescript('app/lib/research/reasoning.ts');

for (const id of ['FM13', 'FM15', 'FM16', 'FM26']) test(`bounded reasoning resolves ${id} without changed expectations`, async () => {
  const entry = publisherCases.find(row => row.id === id);
  const result = await research(entry.question, replayClient(publisherRows));
  assert.equal(assess(entry, result).outcome, 'correct_grounded_answer');
  assert.ok(result.reasoning.length);
  for (const step of result.reasoning) assert.ok(result.sources.some(row => row.chunk_id === step.chunk_id));
  for (const part of result.answer_parts) {
    const source = result.sources.find(row => row.chunk_id === part.chunk_id);
    assert.equal(part.text, source.content.slice(part.start, part.end));
    assert.ok(result.citations.some(citation => citation.id === part.citation_id));
  }
});

for (const [question, qualification] of [
  ['Does Fannie Mae cap gross adjustments at 30 percent?', /must not be the sole determinant/],
  ['Is a 22 percent net adjustment a Fannie Mae rejection limit?', /market based adjustments/],
  ['Does Fannie Mae cap net adjustments at 12.5 percent?', /without regard to arbitrary limits/],
  ['Can a 24 month old comp be used for Fannie Mae?', /explain why they are being used/],
  ['Can a 36-month-old comparable sale be used for Fannie Mae?', /can be used if appropriate/],
  ['Can I substitute all closed comparable sales with listings for Fannie Mae?', /exceptions to this policy/],
]) test(`bounded paraphrase: ${question}`, async () => {
  const result = await research(question, replayClient(publisherRows));
  assert.notEqual(result.answer, INSUFFICIENT);
  assert.match(result.answer, qualification);
  assert.ok(result.reasoning.length);
});

for (const question of [
  'Does Fannie Mae cap net adjustments at 15 percent and bitcoin at 20 percent?',
  'Does Fannie Mae cap net adjustments at 15 percent with guaranteed approval?',
  'Does Fannie Mae cap site adjustments at 15 percent?',
  'Can a 900 year old comp be used for Fannie Mae?',
  'Can an 18 month old comp be used for Freddie Mac?',
  'Can an 18 month old comp be used for Fannie Mae and Freddie Mac?',
  'Can an 18 month old comp be used for Fannie Mae with guaranteed approval?',
  'Can I replace all closed comparable sales with listings and bitcoin for Fannie Mae?',
]) test(`bounded reasoning retains unsupported specifics: ${question}`, async () => {
  const result = await research(question, replayClient(publisherRows));
  assert.equal(result.answer, INSUFFICIENT);
  assert.equal(result.confidence, 'Low');
  assert.equal(result.reasoning.length, 0);
});

test('reasoning requires intact publisher provenance and complete qualification', () => {
  const question = 'Does Fannie Mae cap net adjustments at 15 percent?';
  assert.equal(boundedReasoning(question, publisherRows.map(row => ({ ...row, authority_level: 'derived' }))).steps.length, 0);
  assert.equal(boundedReasoning(question, publisherRows.map(row => ({ ...row, content: row.content.replace('must not be the sole determinant', 'does not matter') }))).steps.length, 0);
});

test('age rule does not resolve unrelated numbers or change a recent-age premise', () => {
  for (const q of ['Can a 6 month old comp be used?', 'Can an 18 month old comp support a 99 percent adjustment?']) {
    const result = boundedReasoning(q, publisherRows);
    if (q.includes('6 month')) assert.equal(result.steps.length, 0);
    else assert.match(result.coverageQuestion, /99 percent/);
  }
});

test('missing publisher evidence cannot be repaired by a reasoning rule', async () => {
  const result = await research('Does Fannie Mae cap net adjustments at 15 percent?', replayClient(publisherRows.filter(row => !/Analysis of Adjustments/.test(row.chunk_title))));
  assert.equal(result.answer, INSUFFICIENT);
});

test('historical applicability remains conservative even with bounded reasoning', async () => {
  const result = await research('Does Fannie Mae cap net adjustments at 15 percent in 1999?', replayClient(publisherRows));
  assert.equal(result.answer, INSUFFICIENT);
  assert.equal(result.confidence, 'Low');
});
