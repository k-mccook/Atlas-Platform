import { benchmarkCases } from './fannie-cases.mjs';
import { cases } from '../ask-atlas.cases.mjs';
import { publisherChecks } from '../fixtures/publisher-corpus.mjs';

// Same 50 questions; expectations independently aligned to captured publisher text.
// Newly available evidence changes answerability, not the question or score threshold.
const rules = {
  FM09: ['08', 'similar physical and legal characteristics'],
  FM10: ['08', 'similar physical and legal characteristics'],
  FM11: ['08', 'minimum of three closed comparables', 'exceptions to this policy'],
  FM12: ['08', 'fourth comparable sale.*previously closed'],
  FM13: ['08', 'minimum of three closed comparables', 'supporting data, if appropriate'],
  FM15: ['09', 'does not have specific limitations or guidelines.*net or gross'],
  FM16: ['09', 'does not have specific limitations or guidelines.*net or gross'],
  FM17: ['09', 'must not be the sole determinant'],
  FM18: ['09', 'inappropriate.*\\$20 per square foot.*rule-of-thumb', 'market based adjustments'],
  FM19: ['09', 'market.s reaction', 'without regard to arbitrary limits'],
  FM20: ['09', 'dollar-for-dollar deductions.*not appropriate', 'full amount.*dollar-for-dollar adjustment is acceptable'],
  FM21: ['07', 'must verify the data with a party that does not have a financial interest'],
  FM22: ['07', 'specific data source', 'refrain from using broad categories'],
  FM23: ['07', 'multiple listing service, deed records', 'reliable sources'],
  FM24: ['07', 'three year subject property'],
  FM25: ['07', 'twelve month comparable sales history'],
  FM26: ['08', 'older comparable sales.*explain why'],
  FM27: ['08', 'may not always be the most recent'],
  FM28: ['08', 'credible assignment results', 'explanation of why'],
  FM29: ['08', 'not truly comparable may simply be the best available', 'adequately documents the analysis and explains why'],
  FM30: ['08', 'acceptable to use foreclosures and short sales.*best and most appropriate', 'prevalence.*impact', 'cannot assume it is equal'],
  FM31: ['08', 'acceptable to use foreclosures and short sales.*best and most appropriate', 'prevalence.*impact', 'cannot assume it is equal'],
  FM32: ['08', 'expansion of the market area search is appropriate', 'must not expand the neighborhood boundaries'],
  FM33: ['08', 'location adjustments if warranted'],
  FM34: ['03', 'North.*South.*East.*West', 'should not reference a map.*only example'],
  FM35: ['04', 'legal, nonconforming use.*provided that.*adverse effect', 'value and the marketability'],
  FM36: ['05', 'if any portion of it is below-grade', 'report below-grade areas separately', 'make appropriate adjustments'],
  FM37: ['06', 'C6.*subject to.*minimum resulting condition rating of C5'],
  FM38: ['B4-1.2-01', 'front, back, and a street scene.*front of each comparable', 'all bathrooms', 'all bedrooms', 'finished and unfinished rooms'],
  FM39: ['11', 'weighted average technique that includes proper explanation'],
  FM40: ['11', 'must never be an averaging technique with the exception.*weighted average'],
  FM41: ['11', 'must be within the range'],
  FM42: ['11', 'approach or approaches that were given the most weight'],
  FM43: [['B4-1.3-07','B4-1.3-09'], 'must verify the data', 'specific limitations'],
  FM44: ['08', 'older comparable sales.*explain why', 'credible assignment results'],
  FM45: [['B4-1.3-09','B4-1.3-04'], 'market.s reaction', 'legal, nonconforming use.*adverse effect'],
};
export const publisherCases = benchmarkCases.map((entry, index) => {
  if (index < 8) return {...entry, checks:publisherChecks[cases[index].topic].map(pattern=>pattern.source)};
  const rule = rules[entry.id];
  if (!rule) return entry;
  const [section,...checks] = rule;
  return {...entry, classification:'answerable', sections:Array.isArray(section) ? section : [section.startsWith('B4-') ? section : `B4-1.3-${section}`], checks};
});
