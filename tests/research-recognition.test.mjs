import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypescript } from './load-typescript.mjs';
import { publisherRows } from './fixtures/publisher-corpus.mjs';
import { replayClient } from '../scripts/research/benchmark.mjs';
const { research, INSUFFICIENT } = loadTypescript('app/lib/research/engine.ts');
const { publisherReceipt } = loadTypescript('app/lib/research/provenance.ts');
const variations = [
  ['What prior transfers must be reported for a Fannie Mae subject property?', 'sales_history','B4-1.3-07',/three year subject property/],
  ['What sales history is required for Fannie Mae comparable properties?', 'sales_history','B4-1.3-07',/twelve month comparable/],
  ['What does Fannie Mae require for legal non-conforming zoning?', 'zoning','B4-1.3-04',/provided that.*adverse effect/is],
  ['How should Fannie Mae basement finished area be reported?', 'below_grade','B4-1.3-05',/report below-grade areas separately/],
  ['What photographs must a Fannie Mae appraisal include?', 'photos','B4-1.2-01',/all bathrooms/],
  ['Which pictures must a Fannie Mae appraisal include?', 'photos','B4-1.2-01',/all bedrooms/],
  ['Can C6 Fannie Mae properties be appraised as is?', 'condition','B4-1.3-06',/subject to.*minimum resulting condition rating of C5/is],
  ['Are short sale comps permitted by Fannie Mae?', 'comparable_sales','B4-1.3-08',/cannot assume it is equal/],
  ['Must concessions always be deducted dollar for dollar under Fannie Mae?', 'concessions','B4-1.3-09',/full amount.*dollar-for-dollar adjustment is acceptable/is],
];
for (const [q,topic,section,qualification] of variations) test(`terminology variation: ${q}`,async()=>{
  const r=await research(q,replayClient(publisherRows));
  assert.notEqual(r.answer,INSUFFICIENT);assert.equal(r.topic,topic);assert.equal(r.primary_section,section);assert.match(r.answer,qualification);
  for(const source of r.sources){assert.equal(source.organization,'Fannie Mae');assert.ok(publisherReceipt(source));}
  for(const part of r.answer_parts){const source=r.sources.find(s=>s.chunk_id===part.chunk_id);const cite=r.citations.find(c=>c.id===part.citation_id);assert.equal(source.content.slice(part.start,part.end),part.text);assert.equal(cite.source_url,source.source_url);}
});
for(const q of [
  'What does Fannie Mae require for zoning and bitcoin adjustments?',
  'Does Fannie Mae guarantee that C6 properties will be approved?',
  'Does Fannie Mae require exactly 99 interior photographs?',
  'Does Fannie Mae prescribe a fixed $999 per square foot adjustment?',
  'Does Fannie Mae permit a 900 year sales history?',
  'Compare Freddie Mac and Fannie Mae zoning.',
  'What does Freddie Mac require for photographs?',
]) test(`unsupported variation: ${q}`,async()=>{
  const r=await research(q,replayClient(publisherRows));assert.equal(r.answer,INSUFFICIENT);assert.equal(r.confidence,'Low');assert.equal(r.sources.length,0);
});
test('multiple recognized topics retain both required sections and bounded RPC calls',async()=>{
  const calls=[],client=replayClient(publisherRows);
  const r=await research('What does Fannie Mae require for zoning and photos?',{rpc:(n,p)=>{calls.push(p.search_query);return client.rpc(n,p);}});
  assert.equal(r.coverage.complete,true);assert.deepEqual(r.topics,['zoning','photos']);
  for(const section of ['B4-1.3-04','B4-1.2-01']) assert.ok(r.sources.some(s=>s.section===section));
  assert.ok(calls.length<=4);assert.ok(calls.some(q=>q.includes('exhibits photographs')));
});
test('partial multi-part evidence reports missing topic without presenting a complete answer',async()=>{
  const r=await research('What does Fannie Mae require for zoning and photos?',replayClient(publisherRows.filter(r=>r.section!=='B4-1.2-01')));
  assert.equal(r.answer,INSUFFICIENT);assert.equal(r.coverage.complete,false);assert.ok(r.coverage.supported.includes('zoning'));assert.ok(r.coverage.unsupported.includes('photos'));assert.equal(r.confidence,'Low');
});
