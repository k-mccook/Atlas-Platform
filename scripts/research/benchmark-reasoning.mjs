// Local publisher replay only. Preserve the historical production/staged reports.
import { mkdir, writeFile } from 'node:fs/promises';
import { runStagedBenchmark } from './benchmark-staged.mjs';
const report = await runStagedBenchmark();
report.methodology = 'Milestone 4 bounded reasoning: local replay of the 67 hash-verified publisher chunks with unchanged fifty-case publisher expectations. This is not a fresh production RPC capture or authenticated HTTP validation. Historical Milestone 3 reports remain unchanged.';
delete report.activation_executed;
report.production_baseline = { grounded: 40, correct_abstentions: 6, coverage_failures: 4, unsupported: 0 };
await mkdir('docs/research/milestone-4', { recursive: true });
await writeFile('docs/research/milestone-4/benchmark-reasoning.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ grounded: report.correct_grounded_answers, abstentions: report.correct_abstentions, failures: report.failure_counts }, null, 2));
