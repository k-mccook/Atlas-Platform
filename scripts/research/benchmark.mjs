import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadTypescript } from '../../tests/load-typescript.mjs';
import { evidence } from '../../tests/fixtures/fannie-evidence.mjs';
import { reconciliation } from '../../tests/fixtures/fannie-reconciliation.mjs';
import { benchmarkCases } from '../../tests/benchmark/fannie-cases.mjs';
const { research, INSUFFICIENT } = loadTypescript(fileURLToPath(new URL('../../app/lib/research/engine.ts', import.meta.url)));
export const legacyCorpus = [...evidence, ...reconciliation];
const stop = new Set('the and for what when where does are how why can this that with from into become have has had under would should could about'.split(' '));
export function replayClient(rows) {
  return { rpc: async (_, { search_query }) => {
    const terms = [...new Set(search_query.toLowerCase().split(/\s+/).filter(word => word.length >= 3 && !stop.has(word)))];
    const data = rows.map(row => ({ ...row, rank: terms.filter(term => {
      const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.'), 'i');
      return [row.content, row.chunk_title, row.section, row.source_title, row.organization].some(text => pattern.test(text ?? ''));
    }).length })).filter(row => row.rank > 0).sort((a, b) => b.rank - a.rank ||
      Number(b.authority_level === 'authoritative') - Number(a.authority_level === 'authoritative') || (a.chunk_title ?? '').localeCompare(b.chunk_title ?? '')).slice(0, 12);
    return { data, error: null };
  } };
}
export function assess(entry, result) {
  const abstained = result.answer === INSUFFICIENT;
  const shouldAnswer = entry.classification === 'answerable';
  const failures = [];
  if (shouldAnswer && abstained) failures.push('incomplete_evidence_coverage');
  if (!shouldAnswer && !abstained) failures.push('incorrect_answer');
  if (!abstained) {
    if (result.sources.some(row => row.organization !== 'Fannie Mae')) failures.push('authority_failure');
    if (entry.sections.some(section => !result.sources.some(row => row.section === section))) failures.push('wrong_section_retrieval');
    if (entry.checks.some(pattern => !new RegExp(pattern, 'is').test(result.answer))) failures.push('incomplete_evidence_coverage');
    if (!result.answer_parts.length || result.answer_parts.some(part => {
      const row = result.sources.find(row => row.chunk_id === part.chunk_id);
      const citation = result.citations.find(citation => citation.id === part.citation_id);
      return !row || row.content.slice(part.start, part.end) !== part.text || !citation || citation.section !== row.section || !/^https:\/\/selling-guide\.fanniemae\.com\/sel\//.test(citation.source_url);
    })) failures.push('citation_failure');
  }
  if ((!shouldAnswer && result.confidence !== 'Low') || (shouldAnswer && !abstained && result.confidence === 'Low')) failures.push('confidence_calibration_failure');
  const unique = [...new Set(failures)];
  return { id: entry.id, question: entry.question, classification: entry.classification, kind: entry.kind,
    expected_sections: entry.sections, actual_topic: result.topic, actual_sections: result.sources.map(row => row.section),
    confidence: result.confidence, outcome: unique.length ? 'failure' : abstained ? 'correct_abstention' : 'correct_grounded_answer',
    failures: unique, root_cause: unique.length ? (abstained ? (result.topic === 'general' ? 'classification' : 'evidence_assembly') : 'confidence') : null,
    publisher_provenance: abstained ? 'not_applicable' : 'legacy_corpus_not_certified',
  };
}
export async function runBenchmark(rows = legacyCorpus) {
  const results = [];
  for (const entry of benchmarkCases) results.push(assess(entry, await research(entry.question, replayClient(rows))));
  const count = outcome => results.filter(row => row.outcome === outcome).length;
  return { methodology: 'Offline Research Engine V2 with seven inspected Fannie chunks and a lexical RPC replay. Excludes joint UAD/other-authority rows and database collation differences. Not a live database benchmark or publisher-accuracy certification.',
    total: results.length, correct_grounded_answers: count('correct_grounded_answer'), correct_abstentions: count('correct_abstention'), failed_cases: count('failure'),
    failure_counts: Object.fromEntries(['incorrect_answer', 'wrong_section_retrieval', 'incomplete_evidence_coverage', 'citation_failure', 'authority_failure', 'confidence_calibration_failure'].map(key => [key, results.filter(row => row.failures.includes(key)).length])),
    results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = await runBenchmark();
  const destination = resolve('docs/research/milestone-3');
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'benchmark-baseline.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
}
