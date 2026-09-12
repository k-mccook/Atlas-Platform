import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyProvenance } from '../scripts/research/audit-provenance.mjs';
import { extractPage, textContent, digest } from '../scripts/research/capture-fannie.mjs';
import { runBenchmark, assess } from '../scripts/research/benchmark.mjs';
import { benchmarkCases } from './benchmark/fannie-cases.mjs';
const { pages } = JSON.parse(readFileSync(new URL('../docs/research/milestone-3/publisher-capture.json', import.meta.url)));

test('publisher capture has nine official sections with intact block hashes', () => {
  assert.equal(pages.length, 9);
  for (const page of pages) {
    assert.equal(new URL(page.official_url).hostname, 'selling-guide.fanniemae.com');
    assert.equal(page.material_type, 'publisher_capture'); assert.equal(page.effective_date, null);
    for (const block of page.blocks) assert.equal(digest(block.content), block.sha256);
    assert.ok(page.blocks.some(block => block.heading.includes('UAD')));
  }
});
test('derived summary never becomes publisher verified through its title, flag or URL', () => {
  const page = pages.find(page => page.section === 'B4-1.3-11');
  assert.equal(classifyProvenance({ section: page.section, chunk_title: 'Reconciliation Research Summary', authority_level: 'authoritative', content: page.blocks[0].content }, page), 'derived_summary');
});
test('changed substantive text loses normalized publisher match', () => {
  const page = pages[0]; const row = { section: page.section, chunk_title: 'Evidence', content: page.blocks[0].content };
  assert.equal(classifyProvenance(row, page), 'publisher_text_match_normalized');
  assert.equal(classifyProvenance({ ...row, content: row.content + ' This is an invented requirement.' }, page), 'paraphrase_or_unverified_derivation');
});
test('extractor retains nested list/table text and rejects unexpected page structure', () => {
  const html = '<h1>B4-1.3-11, Example (06/04/2025)</h1><div class="paragraph paragraph--type--policy-statement"><h4>Rules</h4><div class="body-field"><p>Must consider:</p><ul><li>A &amp; B</li><li>Unless C.</li></ul><table><tr><td>One</td><td>Two</td></tr></table></div></div>';
  const page = extractPage(html, { section: 'B4-1.3-11', url: pages[0].official_url });
  assert.match(page.blocks[0].content, /Must consider/); assert.match(page.blocks[0].content, /Unless C/); assert.match(page.blocks[0].content, /One \| Two/);
  assert.throws(() => extractPage(html, { section: 'wrong' }), /mismatch/);
  assert.equal(textContent('<p>A&nbsp;B</p>'), 'A B');
});
test('benchmark contains 50 distinct realistic cases and all eight permanent cases', () => {
  assert.equal(benchmarkCases.length, 50); assert.equal(new Set(benchmarkCases.map(entry => entry.question)).size, 50);
  assert.equal(benchmarkCases.filter(entry => entry.kind === 'established').length, 8);
  for (const type of ['answerable', 'partially answerable', 'insufficient evidence', 'ambiguous authority', 'intentionally unsupported']) assert.ok(benchmarkCases.some(entry => entry.classification === type));
});
test('known benchmark successes are durable regressions; failures remain visible diagnostics', async () => {
  const baseline = JSON.parse(readFileSync(new URL('../docs/research/milestone-3/benchmark-baseline.json', import.meta.url)));
  const report = await runBenchmark();
  for (const row of baseline.results.filter(row => row.outcome !== 'failure')) {
    assert.equal(report.results.find(result => result.id === row.id).outcome, row.outcome, row.id);
  }
  assert.equal(report.total, 50);
});
test('benchmark evaluator detects a false confident answer rather than counting it as success', () => {
  const entry = benchmarkCases.find(entry => entry.classification === 'intentionally unsupported');
  const result = assess(entry, { answer: 'Unsupported rule', sources: [], answer_parts: [], citations: [], confidence: 'High' });
  assert.ok(result.failures.includes('incorrect_answer')); assert.ok(result.failures.includes('confidence_calibration_failure')); assert.ok(result.failures.includes('citation_failure'));
});
