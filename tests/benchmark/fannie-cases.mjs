import { cases as original } from '../ask-atlas.cases.mjs';
import { factualChecks } from '../fixtures/fannie-evidence.mjs';

// Expected support is defined against the seven inspected legacy Fannie chunks.
// Missing corpus cases must remain abstentions until their evidence is actually ingested.
const entries = [
  ...original.map(entry => ({ question: entry.question, classification: 'answerable', sections: [entry.section], checks: factualChecks[entry.topic].map(regex => regex.source), kind: 'established' })),
  ['What physical characteristics should comparable sales share with the subject under Fannie Mae?', '08', 'physical and legal|physical.*characteristics', 'straightforward'],
  ['Do Fannie Mae comparables need similar legal characteristics?', '08', 'physical and legal', 'paraphrase'],
  ['How many closed comparable sales does Fannie Mae require?', '08', 'minimum of three closed', 'terminology'],
  ['Can a previously closed subject property be a fourth Fannie Mae comparable?', '08', 'fourth comparable', 'exception'],
  ['Can I replace all closed comparable sales with listings for Fannie Mae?', '08', 'minimum of three closed', 'misleading premise'],
  ['Fannie Mae requires every comp within one mile, correct?', null, null, 'nonexistent numeric rule'],
  ['Does Fannie Mae cap net adjustments at 15 percent?', '09', 'does not establish specific limitations', 'adjustment myth'],
  ['Is a 25 percent gross adjustment a Fannie Mae rejection limit?', '09', 'does not establish specific limitations', 'adjustment myth'],
  ['Are the number of adjustments alone grounds to reject a Fannie Mae comparable?', '09', 'must not be used as the sole determinant', 'paraphrase'],
  ['Does Fannie Mae prescribe a fixed $20 per square foot adjustment?', null, null, 'missing corpus'],
  ['Must Fannie Mae adjustments reflect market reaction rather than arbitrary amounts?', '09', 'market-based rather than arbitrary', 'straightforward'],
  ['Should Fannie Mae concessions always be deducted dollar for dollar?', null, null, 'missing corpus'],
  ['Can a financially interested party supply Fannie Mae comparable data without verification?', '07', 'must verify.*does not have a financial interest', 'misleading premise'],
  ['Is public records a specific enough Fannie Mae verification source description?', '07', 'specific source rather than.*public records', 'terminology'],
  ['Can multiple listing services and deed records be Fannie Mae data sources?', '07', 'multiple listing services, deed records', 'straightforward'],
  ['How many years of subject sales history does Fannie Mae require?', '07', 'three years of prior sales history', 'sales history'],
  ['What prior sales history is required for Fannie Mae comparable sales?', '07', 'twelve months of prior sales history', 'sales history'],
  ['Can an 18 month old comp be used for Fannie Mae?', '08', 'older sale may be appropriate', 'terminology'],
  ['Is the most recent sale always the best Fannie Mae comparable?', '08', 'not necessarily the most recent', 'misleading premise'],
  ['What explanation supports distant rural Fannie Mae comparables?', '08', 'explanation and support', 'paraphrase'],
  ['Can I use noncomparable properties when Fannie Mae rural sales are scarce?', null, null, 'partially answerable'],
  ['Can foreclosure comparables be used in a Fannie Mae appraisal?', null, null, 'missing corpus'],
  ['Does Fannie Mae permit short sale comparables?', null, null, 'missing corpus'],
  ['May I expand the market area just to include Fannie Mae comps?', '08', 'should not expand', 'misleading premise'],
  ['Are location adjustments always required for Fannie Mae outside-market comparables?', '08', 'location adjustments when warranted', 'qualification'],
  ['How must Fannie Mae neighborhood boundaries be described?', null, null, 'missing corpus'],
  ['How does Fannie Mae treat legal nonconforming zoning?', null, null, 'missing corpus'],
  ['How does Fannie Mae report below-grade finished area?', null, null, 'missing corpus'],
  ['Can a Fannie Mae property in C6 condition be appraised as is?', null, null, 'missing corpus'],
  ['What photos does Fannie Mae require in an appraisal?', null, null, 'missing corpus'],
  ['Can Fannie Mae reconciliation use a weighted average with proper explanation?', '11', 'weighted average technique.*proper explanation', 'exception'],
  ['May I simply average the approaches for Fannie Mae reconciliation?', '11', 'must never be an averaging technique.*exception', 'misleading premise'],
  ['Must the Fannie Mae final reconciled value be within the range of approaches?', '11', 'must be within the range', 'straightforward'],
  ['What must Fannie Mae reconciliation report about the most weight?', '11', 'approach or approaches.*most weight', 'straightforward'],
  { question: 'What does Fannie Mae require for verification and gross adjustments?', classification: 'answerable', sections: ['B4-1.3-07', 'B4-1.3-09'], checks: ['must verify', 'specific limitations'], kind: 'multi-part' },
  { question: 'Explain older and rural Fannie Mae comparables.', classification: 'answerable', sections: ['B4-1.3-08'], checks: ['older sale may', 'rural or low-volume'], kind: 'multi-part' },
  ['How do Fannie Mae adjustments and zoning requirements apply?', null, null, 'partially answerable'],
  ['Compare Fannie Mae and Freddie Mac comparable distance rules.', null, null, 'ambiguous authority'],
  ['Does FHA allow Fannie Mae comparable adjustments?', null, null, 'ambiguous authority'],
  ['What is the required bitcoin adjustment in a Fannie Mae appraisal?', null, null, 'intentionally unsupported'],
  ['Does Fannie Mae guarantee my appraised value will be approved?', null, null, 'intentionally unsupported'],
  ['What does Freddie Mac require for comparable sales?', null, null, 'other authority'],
];
export const benchmarkCases = entries.map((entry, index) => {
  if (!Array.isArray(entry)) return { id: `FM${String(index + 1).padStart(2, '0')}`, ...entry };
  const [question, section, check, kind] = entry;
  const classification = section ? 'answerable' : ['partially answerable', 'ambiguous authority', 'intentionally unsupported'].includes(kind) ? kind : 'insufficient evidence';
  return { id: `FM${String(index + 1).padStart(2, '0')}`, question, classification, sections: section ? [`B4-1.3-${section}`] : [], checks: check ? [check] : [], kind };
});
