import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { publisherCases } from './benchmark/publisher-cases.mjs';
import { benchmarkCases } from './benchmark/fannie-cases.mjs';
import { publisherRows } from './fixtures/publisher-corpus.mjs';
import { loadTypescript } from './load-typescript.mjs';
import { assess, replayClient } from '../scripts/research/benchmark.mjs';
const { research } = loadTypescript('app/lib/research/engine.ts');
const { publisherReceipt } = loadTypescript('app/lib/research/provenance.ts');
const grounded = new Set('FM01 FM02 FM03 FM04 FM05 FM06 FM07 FM08 FM10 FM11 FM12 FM19 FM22 FM23 FM25 FM27 FM28 FM30 FM33 FM34 FM39 FM41 FM42 FM43 FM44'.split(' '));
for (const id of 'FM09 FM17 FM18 FM20 FM21 FM24 FM29 FM31 FM32 FM35 FM36 FM37 FM38 FM40 FM45'.split(' ')) grounded.add(id);
for (const id of 'FM13 FM15 FM16 FM26'.split(' ')) grounded.add(id);
const abstentions = new Set('FM14 FM46 FM47 FM48 FM49 FM50'.split(' '));
test('publisher benchmark preserves all 50 questions and verifies all 67 runtime receipts', () => {
  assert.deepEqual(publisherCases.map(e=>[e.id,e.question]),benchmarkCases.map(e=>[e.id,e.question]));
  const receipts = JSON.parse(readFileSync('app/lib/research/publisher-receipts.json'));
  assert.equal(receipts.length,67); assert.equal(new Set(receipts.map(r=>r.chunk_id)).size,67);
  for (const row of publisherRows) assert.ok(publisherReceipt(row),row.chunk_id);
});
for (const entry of publisherCases.filter(e=>grounded.has(e.id)||abstentions.has(e.id))) test(`staged durable regression ${entry.id}`, async () => {
  const result = await research(entry.question,replayClient(publisherRows));
  const review = assess(entry,result);
  assert.deepEqual(review.failures,[]);
  assert.equal(review.outcome,grounded.has(entry.id)?'correct_grounded_answer':'correct_abstention');
  for (const source of result.sources) assert.ok(publisherReceipt(source));
});
