import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadTypescript } from './load-typescript.mjs';
import { evidence } from './fixtures/fannie-evidence.mjs';
const { research, INSUFFICIENT } = loadTypescript(fileURLToPath(new URL('../app/lib/research/engine.ts', import.meta.url)));
const run = (question, rows = evidence) => research(question, { rpc: async () => ({ data: rows, error: null }) });

test('explicit Freddie restriction never returns Fannie evidence', async () => {
  const result = await run('Freddie Mac adjustments');
  assert.equal(result.answer, INSUFFICIENT); assert.equal(result.sources.length, 0);
});
test('explicit multiple authorities abstain instead of blending', async () => {
  assert.equal((await run('Fannie Mae and Freddie Mac adjustments')).answer, INSUFFICIENT);
});
test('unnamed authority is ambiguous when two authorities are eligible', async () => {
  assert.equal((await run('adjustments', [...evidence, { ...evidence[0], chunk_id: 'other', organization: 'Freddie Mac', source_type: 'freddie_mac', source_url: 'https://guide.freddiemac.com/' }])).answer, INSUFFICIENT);
});
for (const question of ['Fannie Mae bitcoin requirements', 'Fannie Mae swimming pool adjustments', 'Fannie Mae adjustments for 30 percent', 'Fannie Mae solar adjustments']) {
  test('unsupported question: ' + question, async () => {
    const result = await run(question); assert.equal(result.answer, INSUFFICIENT); assert.equal(result.confidence, 'Low');
  });
}
test('section and topic alone cannot create High confidence', async () => {
  assert.equal((await run('Fannie Mae adjustments', [{ ...evidence[0], content: 'Adjustments appear in this section.' }])).confidence, 'Low');
});
test('derived material is excluded even with enormous database rank', async () => {
  const derived = { ...evidence[0], chunk_id: 'derived', rank: 1e9, authority_level: 'derived' };
  const result = await run('Fannie Mae adjustments', [derived, ...evidence]);
  assert.ok(!result.sources.some(row => row.chunk_id === 'derived'));
  assert.equal((await run('Fannie Mae adjustments', [derived])).answer, INSUFFICIENT);
});
test('summary labels do not become authoritative through metadata', async () => {
  assert.equal((await run('Fannie Mae adjustments', [{ ...evidence[0], chunk_title: 'Atlas Research Summary' }])).answer, INSUFFICIENT);
});
test('opposite modal statements fail closed', async () => {
  const rows = [evidence[0], { ...evidence[0], chunk_id: 'conflict', content: evidence[0].content.replace('must reflect', 'must not reflect') }];
  const result = await run('Fannie Mae adjustments', rows);
  assert.equal(result.answer, INSUFFICIENT); assert.match(result.confidence_reasons.join(' '), /conflicting/);
});
test('unresolved version differences fail closed', async () => {
  assert.equal((await run('Fannie Mae adjustments', [evidence[0], { ...evidence[0], chunk_id: 'old', source_version: 'Old' }])).answer, INSUFFICIENT);
});
test('multiple concepts retain both sections and their cited qualifications', async () => {
  const result = await run('Fannie Mae verification and adjustments');
  assert.ok(result.topics.includes('verification') && result.topics.includes('adjustments'));
  assert.ok(result.sources.some(row => row.section === 'B4-1.3-07'));
  assert.ok(result.sources.some(row => row.section === 'B4-1.3-09'));
  assert.equal(result.coverage.complete, true);
});
test('missing part of a multiple-concept question abstains', async () => {
  assert.equal((await run('Fannie Mae verification and adjustments', [evidence[0]])).answer, INSUFFICIENT);
});
test('more than three relevant chunks can support an answer', async () => {
  const rows = Array.from({ length: 5 }, (_, index) => ({ ...evidence[0], chunk_id: 'chunk' + index }));
  assert.equal((await run('Fannie Mae adjustments', rows)).sources.length, 5);
});
test('missing version metadata reduces confidence', async () => {
  assert.equal((await run('Fannie Mae adjustments', [{ ...evidence[0], source_version: null }])).confidence, 'Medium');
});
test('saturated RPC expands bounded searches then deduplicates', async () => {
  const calls = [];
  const result = await research('Fannie Mae adjustments', { rpc: async (_, params) => {
    calls.push(params.search_query); return { data: Array(12).fill(evidence[0]), error: null };
  } });
  assert.deepEqual(calls, ['Fannie Mae adjustments', 'B4-1.3-09']); assert.equal(result.sources.length, 1);
});

test('concepts are recognized within a single clause', async () => {
  const result = await run('Fannie Mae rural older comparables');
  assert.ok(result.topics.includes('rural_comparables'));
  assert.ok(result.topics.includes('older_comparables'));
  assert.equal(result.coverage.complete, true);
});
test('adjacent exception remains quoted with exact offsets', async () => {
  const row = { ...evidence[0], content: 'Adjustments must reflect market reaction.\n\nHowever, this does not apply in the circumstances described below.' };
  const result = await run('Fannie Mae adjustments', [row]);
  assert.match(result.answer, /However, this does not apply/);
  for (const part of result.answer_parts) assert.equal(row.content.slice(part.start, part.end), part.text);
});
for (const source_url of ['https://fanniemae.com.example.invalid/', 'http://fanniemae.com/', 'javascript:alert(1)', 'https://user:password@fanniemae.com/']) {
  test('rejects untrusted source URL ' + source_url.split(':')[0], async () => {
    assert.equal((await run('Fannie Mae adjustments', [{ ...evidence[0], source_url }])).answer, INSUFFICIENT);
  });
}
test('citation metadata resolves every exact evidence passage', async () => {
  const result = await run('Fannie Mae verification and adjustments');
  for (const part of result.answer_parts) {
    const citation = result.citations.find(citation => citation.id === part.citation_id);
    const source = result.sources.find(source => source.chunk_id === citation.chunk_id);
    assert.equal(source.content.slice(citation.start, citation.end), part.text);
    assert.equal(citation.authority, source.organization);
    assert.equal(citation.section, source.section);
    assert.equal(citation.source_version, source.source_version);
    assert.equal(citation.effective_date, source.effective_date);
    const url = new URL(citation.source_url);
    assert.equal(url.hostname, 'selling-guide.fanniemae.com');
    assert.ok(url.pathname.includes(source.section.toLowerCase()));
  }
});
test('expansion failure does not return an apparently complete answer', async () => {
  let calls = 0;
  await assert.rejects(research('Fannie Mae verification and adjustments', { rpc: async () => ++calls === 1
    ? { data: evidence, error: null } : { data: null, error: { message: 'internal diagnostic' } } }), /Knowledge search unavailable/);
});
