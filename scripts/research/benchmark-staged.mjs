import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadTypescript } from '../../tests/load-typescript.mjs';
import { publisherRows } from '../../tests/fixtures/publisher-corpus.mjs';
import { publisherCases } from '../../tests/benchmark/publisher-cases.mjs';
import { assess, replayClient } from './benchmark.mjs';
const { research } = loadTypescript(fileURLToPath(new URL('../../app/lib/research/engine.ts', import.meta.url)));
const { publisherReceipt } = loadTypescript(fileURLToPath(new URL('../../app/lib/research/provenance.ts', import.meta.url)));
export async function runStagedBenchmark() {
  const baseline = JSON.parse(await readFile(new URL('../../docs/research/milestone-3/benchmark-baseline.json', import.meta.url)));
  const results = [];
  for (const entry of publisherCases) {
    const response = await research(entry.question, replayClient(publisherRows));
    const result = assess(entry, response);
    if (response.sources.some(row => !publisherReceipt(row))) result.failures.push('provenance_failure');
    if (result.failures.length) result.outcome = 'failure';
    result.publisher_provenance = response.sources.length ? 'hash_verified_capture' : 'not_applicable';
    results.push(result);
  }
  const count = outcome => results.filter(row => row.outcome === outcome).length;
  return { methodology:'Local replay of all 67 exact database-verified staged publisher chunks; no activation or live staged RPC. Same 50 questions with publisher-supported propositions and answerability. PostgreSQL collation and other-authority competition are not simulated.',
    activation_executed:false, total:50, correct_grounded_answers:count('correct_grounded_answer'), correct_abstentions:count('correct_abstention'), failed_cases:count('failure'),
    failure_counts:Object.fromEntries(['incorrect_answer','wrong_section_retrieval','incomplete_evidence_coverage','authority_failure','citation_failure','confidence_calibration_failure','provenance_failure'].map(key=>[key,results.filter(row=>row.failures.includes(key)).length])),
    previous_coverage_failures_corrected:baseline.results.filter(old=>old.failures.includes('incomplete_evidence_coverage') && results.find(row=>row.id===old.id).outcome==='correct_grounded_answer').map(row=>row.id),
    previously_correct_answers_now_failing:baseline.results.filter(old=>old.outcome==='correct_grounded_answer' && results.find(row=>row.id===old.id).outcome==='failure').map(row=>row.id),
    previous_abstentions_now_supported:baseline.results.filter(old=>old.outcome==='correct_abstention' && results.find(row=>row.id===old.id).outcome==='correct_grounded_answer').map(row=>row.id),
    previous_abstentions_now_unsupported_answers:baseline.results.filter(old=>old.outcome==='correct_abstention' && results.find(row=>row.id===old.id).failures.includes('incorrect_answer')).map(row=>row.id), results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = await runStagedBenchmark();
  await writeFile('docs/research/milestone-3/benchmark-staged.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,results:report.results.filter(row=>row.outcome==='failure').map(row=>({id:row.id,failures:row.failures}))},null,2));
}
