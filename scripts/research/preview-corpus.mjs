// Local-only compatibility probe. It neither activates nor writes database records.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { makePlan } from './prepare-corpus-proposal.mjs';
import { replayClient } from './benchmark.mjs';
import { cases } from '../../tests/ask-atlas.cases.mjs';
import { loadTypescript } from '../../tests/load-typescript.mjs';
const directory = new URL('../../docs/research/milestone-3/', import.meta.url);
const { pages } = JSON.parse(await readFile(new URL('publisher-capture.json', directory), 'utf8'));
const plan = makePlan(pages);
const rows = plan.chunks.map(chunk => {
  const source = plan.sources.find(source => source.id === chunk.source_id);
  return { ...chunk, chunk_id: chunk.id, chunk_title: chunk.title, source_title: source.title,
    organization: source.organization, source_type: source.source_type, source_url: source.url, domain: source.domain, rank: 0 };
});
const { research, INSUFFICIENT } = loadTypescript(fileURLToPath(new URL('../../app/lib/research/engine.ts', import.meta.url)));
const results = [];
for (const entry of cases) {
  const result = await research(entry.question, replayClient(rows));
  results.push({ topic: entry.topic, actual_topic: result.topic, expected_section: entry.section, actual_section: result.primary_section,
    expected_confidence: entry.confidence, actual_confidence: result.confidence, abstained: result.answer === INSUFFICIENT,
    current_contract_passes: result.topic === entry.topic && result.primary_section === entry.section && result.confidence === entry.confidence && result.answer !== INSUFFICIENT,
    coverage: result.coverage, reasons: result.confidence_reasons });
}
const report = { state: 'UNEXECUTED CORPUS — OFFLINE COMPATIBILITY PROBE',
  note: 'No post-expansion quality score is claimed. Legacy benchmark factual regexes are paraphrase-specific; publisher-native expectations and runtime adaptations must be reviewed before activation.',
  original_eight_contracts_passed: results.filter(row => row.current_contract_passes).length, results };
await writeFile(new URL('corpus-compatibility-preview.json', directory), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
