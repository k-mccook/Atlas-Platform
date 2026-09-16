import type { Topic } from './types';

// Coverage checks establish the kind of support required, not a factual answer.
const support: Record<Topic, RegExp[]> = {
  adjustments: [/adjustment/i, /must|should|may/i], concessions: [/concession/i, /market/i, /adjust/i],
  verification: [/verif/i, /source/i, /must|require/i],
  distance: [/distan|mile|proximity/i, /may|must|should/i],
  rural_comparables: [/rural|remote|low.volume/i, /may|must|should/i],
  older_comparables: [/older|twelve months|12 months/i, /may|must|should/i],
  market_area: [/outside|different|another/i, /market area|neighborhood/i, /must|should|may/i],
  listings_contracts: [/listing|contract offering/i, /support/i, /closed/i],
  reconciliation: [/reconcil/i, /must|should|may/i],
  sales_comparison: [/sales comparison/i, /must|should|may/i],
  comparable_sales: [/comparable/i, /must|should|may/i], general: [/$a/],
};

export function directCoverage(topic: Topic, text: string) {
  return support[topic].every(pattern => pattern.test(text));
}

const synonyms: Record<string, string> = {
  neighborhood: 'market area', pending: 'contract', sold: 'sale', twelve: '12',
  farther: 'distant', far: 'distant', distance: 'distant', guidelines: '', limits: 'limitation',
  supports: 'explanation',
};
const stop = new Set('a an the does do is are be have has can could i we use used using under for from of to on in at and or than more ago away how what when where why should would require requires requirement requirements fannie mae fnma freddie mac fhlmc fha hud uspap va uad appraisal appraisals subject subjects property properties question please tell me about with their its it that this my sale sales comparable comparables guideline guidelines'.split(' '));
function words(text: string) {
  return (text.toLowerCase().match(/[a-z]+|\d+/g) ?? []).filter(word => !stop.has(word))
    .flatMap(word => (synonyms[word] ?? word).split(' ')).filter(word => word && !stop.has(word))
    .map(word => word.replace(/(?:ments?|ing|ed|s)$/, ''));
}

// Fail conservatively on unrepresented specifics rather than inventing a topic answer.
// Lexical coverage is intentionally limited; synonyms can be extended with regression cases.
export function missingSpecifics(question: string, text: string) {
  const available = new Set(words(text));
  return [...new Set(words(question))].filter(word => !available.has(word));
}

