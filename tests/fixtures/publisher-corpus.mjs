import { readFileSync } from 'node:fs';
import { makePlan } from '../../scripts/research/prepare-corpus-proposal.mjs';
export const pages = JSON.parse(readFileSync(new URL('../../docs/research/milestone-3/publisher-capture.json', import.meta.url))).pages;
const plan = makePlan(pages);
export const publisherRows = plan.chunks.map(chunk => {
  const source = plan.sources.find(source => source.id === chunk.source_id);
  return { ...chunk, chunk_id: chunk.id, chunk_title: chunk.title, source_title: source.title,
    organization: source.organization, source_type: source.source_type, source_url: source.url, domain: source.domain, rank: 0 };
});
// Assertions are publisher propositions and qualifications, not generated answer templates.
export const publisherChecks = {
  adjustments: [/does not have specific limitations or guidelines associated with net or gross adjustments/i, /must not be the sole determinant/i, /market.*reaction/is],
  distance: [/considerable distance away/i, /credible assignment results/i, /explanation of why/i, /straight line/i, /miles.*directional/is],
  older_comparables: [/last 12 months should be used/i, /may not always be the most recent/i, /older comparable sales.*explain why/is],
  rural_comparables: [/considerable distance away/i, /credible assignment results/i, /explanation of why/i],
  market_area: [/expansion of the market area search is appropriate/i, /location adjustments if warranted/i, /must not expand the neighborhood boundaries/i, /discussion of how a competing neighborhood is comparable/i],
  verification: [/must state the specific data source/i, /refrain from using broad categories/i, /must verify the data with a party that does not have a financial interest/i],
  listings_contracts: [/minimum of three closed comparables/i, /Contract offerings and current listings can be used as supporting data, if appropriate/i, /exceptions to this policy/i],
  concessions: [/impact, if any/i, /dollar-for-dollar deductions.*not appropriate/is, /market.s reaction is the full amount.*dollar-for-dollar adjustment is acceptable/is, /Positive adjustments.*not acceptable/is],
};
