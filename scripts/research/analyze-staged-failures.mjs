// Diagnostic only. No database access. Preserve the captured pre-change analysis.
import { readFile, writeFile } from 'node:fs/promises';
import { loadTypescript } from '../../tests/load-typescript.mjs';
import { publisherCases } from '../../tests/benchmark/publisher-cases.mjs';
import { publisherRows } from '../../tests/fixtures/publisher-corpus.mjs';
import { assess, replayClient } from './benchmark.mjs';
const { research } = loadTypescript('app/lib/research/engine.ts');
const before = JSON.parse(await readFile('docs/research/milestone-3/failure-analysis-before.json'));
const results = [];
for (const previous of before.results) {
  const entry = publisherCases.find(entry => entry.id === previous.id);
  const response = await research(entry.question, replayClient(publisherRows));
  const evaluation = assess(entry, response);
  results.push({ ...previous,
    secondary_cause: previous.id === 'FM29' ? 'topic_matching_omitted_scarcity_qualification' : previous.secondary_cause,
    corrected: evaluation.outcome === 'correct_grounded_answer',
    final_topics: response.topics, final_coverage: response.coverage, final_failures: evaluation.failures,
    remaining_cause: evaluation.outcome !== 'failure' ? null : response.coverage.missing_terms.some(term=>/\d/.test(term)) ? 'numeric_applicability_not_proven_by_lexical_coverage' : 'substitution_premise_requires_explicit_relation_reasoning',
  });
}
await writeFile('docs/research/milestone-3/failure-analysis-after.json',JSON.stringify({
  methodology:'Same frozen 19 initial failures, same publisher benchmark classifications/checks. Diagnoses are explanatory, not production routing rules.',
  corrected:results.filter(r=>r.corrected).length,
  priority_nine_corrected:results.filter(r=>r.previously_abstained&&r.corrected).length,
  database_change_required:false, results,
},null,2)+'\n');
console.log(JSON.stringify({corrected:results.filter(r=>r.corrected).length,priority_nine_corrected:results.filter(r=>r.previously_abstained&&r.corrected).length}));
