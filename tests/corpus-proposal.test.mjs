import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { makePlan, makeSql } from '../scripts/research/prepare-corpus-proposal.mjs';
import { sections } from '../scripts/research/fannie-sections.mjs';
import { digest } from '../scripts/research/capture-fannie.mjs';
const { pages } = JSON.parse(readFileSync(new URL('../docs/research/milestone-3/publisher-capture.json', import.meta.url)));
const plan = makePlan(pages), sql = makeSql(plan);

test('proposal is deterministic with nine staged sources and 67 uniquely identified blocks', () => {
  assert.deepEqual(makePlan(pages), plan); assert.deepEqual(makeSql(makePlan(pages)), sql);
  assert.equal(plan.sources.length, 9); assert.equal(plan.chunks.length, 67);
  assert.equal(new Set(plan.chunks.map(row => row.id)).size, 67);
  assert.equal(new Set(plan.chunks.map(row => row.source_id + '|' + row.title)).size, 67);
  for (const source of plan.sources) {
    assert.equal(source.status, 'staged_provenance_review'); assert.equal(source.effective_date, null);
    assert.equal(source.url, sections.find(row => row.section === source.topic).url);
    const metadata = JSON.parse(source.description);
    for (const entry of metadata.subsections) {
      const chunk = plan.chunks.find(row => row.id === entry.chunk_id);
      assert.equal(digest(chunk.content), entry.content_sha256); assert.equal(chunk.source_id, source.id);
      const page = pages.find(page => page.section === chunk.section);
      assert.equal(chunk.content, page.blocks.find(block => block.heading === chunk.title).content);
    }
  }
});
test('exact six derived labels include the research summary; original content is retained', () => {
  assert.equal(plan.derived.length, 6);
  assert.ok(plan.derived.includes('d6e61b42-b75f-4f61-9790-b7c1d7ced295'));
  assert.ok(!plan.derived.includes('68a33188-648b-41e9-9d58-3ad6b154c051'));
  assert.doesNotMatch(sql.activate, /SET\s+content\b|\bDELETE\b|\bDROP\b/i);
  assert.doesNotMatch(sql.rollback, /\bDELETE\b|\bDROP\b/i);
});
test('SQL artifacts include transaction boundaries, valid DO terminators and scope guards', () => {
  for (const name of ['load', 'activate', 'rollback']) {
    assert.match(sql[name], /BEGIN;/); assert.match(sql[name], /END; \$guard\$;/); assert.match(sql[name], /COMMIT;/);
    assert.match(sql[name], /LOCK TABLE public.knowledge_sources, public.knowledge_chunks IN SHARE ROW EXCLUSIVE MODE/);
    const executable = sql[name].replace(/\$atlas_review\$[^]*?\$atlas_review\$/g, "'payload'").replace(/--[^\n]*/g, '');
    assert.ok(!/\b(?:CREATE|ALTER|GRANT|REVOKE|TRUNCATE)\s/i.test(executable), `${name} contains no schema or privilege mutations`);
  }
  assert.match(sql.activate, /Staged source metadata changed/); assert.match(sql.activate, /Legacy inventory changed/);
  assert.match(sql.rollback, /Staged content or metadata changed/);
  assert.match(sql.rollback, /"authority_level": "derived"/);
});
test('checked-in SQL matches deterministic generator output', () => {
  for (const [name, value] of Object.entries(sql)) {
    const saved = readFileSync(new URL(`../docs/research/milestone-3/proposed-corpus-${name}.sql`, import.meta.url), 'utf8');
    assert.ok(saved.replace(/\r\n/g, '\n') === value.replace(/\r\n/g, '\n'), `${name} artifact is current`);
  }
});
test('embedded JSON payloads are parseable and records match the intended tables', () => {
  for (const text of Object.values(sql)) for (const match of text.matchAll(/\$atlas_review\$([^]*?)\$atlas_review\$::jsonb/g)) {
    assert.ok(Array.isArray(JSON.parse(match[1])));
  }
  for (const name of ['verify_load', 'verify_activate']) {
    const statement = sql[name].replace(/--[^\n]*/g, '').replace(/\$atlas_review\$[^]*?\$atlas_review\$/g, "'payload'");
    assert.doesNotMatch(statement, /\b(?:INSERT|UPDATE|DELETE|DO|LOCK|CREATE|ALTER|GRANT|REVOKE)\b/i);
    assert.match(statement, /SELECT json_build_object/);
  }
});
test('tampered mappings, duplicate blocks and altered hashes fail preparation', () => {
  for (const change of [copy => { copy[0].official_url = pages[1].official_url; }, copy => { copy[0].blocks.push(copy[0].blocks[0]); }, copy => { copy[0].blocks[0].content += ' invented rule'; }]) {
    const copy = structuredClone(pages); change(copy); assert.throws(() => makePlan(copy));
  }
});
