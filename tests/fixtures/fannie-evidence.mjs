// Knowledge-only excerpts read from the production RPC on 2026-09-11.
// These are stored corpus passages, not independently verified publisher originals.
// IDs and metadata match the catalog baseline; no account/session data is included.
const common = { source_id: '6ebe6a6a-393a-4313-90c6-9ef0b922f9e5', source_title: 'Fannie Mae Selling Guide', organization: 'Fannie Mae', source_type: 'FANNIE_MAE', source_url: 'https://selling-guide.fanniemae.com/', domain: 'FANNIE_MAE', authority_level: 'authoritative', source_version: 'Current Fannie Mae Selling Guide', effective_date: '2025-06-04', rank: 4 };
export const evidence = [
  { ...common, chunk_id: '58399be5-629d-4fb3-bc76-d70bd347e357', section: 'B4-1.3-09', chunk_title: 'Adjustments to Comparable Sales', content: `Fannie Mae does not establish specific limitations or guidelines for the amount of net or gross adjustments. The number or dollar amount of adjustments must not be used as the sole determinant of whether a comparable sale is acceptable.

Adjustments must reflect the market's reaction to differences between the subject property and comparable sales. The adjustments therefore must be market-based rather than arbitrary. Ideally, the best comparable would require no adjustment, but properties and transactions are rarely identical.

Sales concessions and financing concessions must be analyzed and adjusted when their impact on market value is supported by the market. The appraiser must provide fact-based and objective comments describing the work performed and data sources used to support market-derived adjustments, particularly adjustments associated with sales or financing concessions and condition.

A statement that an adjustment was simply made is not sufficient support. The appraisal commentary should explain the analysis and data supporting the adjustment.

The appraiser must also reconcile the adjusted comparable sale values and explain why particular comparable sales received the most weight in the final opinion of value. The indicated value from the sales comparison approach must fall within the range of the adjusted comparable sale prices reported in the appraisal.` },
  { ...common, chunk_id: '8f4ec5eb-8aaf-431b-ba30-213229d11764', section: 'B4-1.3-08', chunk_title: 'Comparable Sales', content: `Fannie Mae states that the appraiser is responsible for determining which comparable sales are the best and most appropriate for the assignment. Comparable sales should have similar physical and legal characteristics to the subject, including characteristics such as site, room count, finished area, style, and condition. External factors, including FEMA-designated flood zone, should also be considered when selecting comparable sales.

The appraiser should examine the subject property's market area, assess its characteristics, and identify comparable sales that are competitive with the subject and appeal to the same market participants. Comparable sales from the same market area, including the same subdivision or project when applicable, should be used when possible.

If comparable sales from outside the subject property's market area are selected, the appraiser must explain the rationale for using those sales and make location adjustments when warranted. The appraiser should not expand the market area simply to obtain comparable sales.

A minimum of three closed comparable sales must be reported in the sales comparison approach. Additional comparable sales may be reported when they provide support for the opinion of market value. A previously closed subject property may be used as a fourth comparable or supporting data. Current listings and contract offerings may also be used as supporting data when appropriate.

Comparable sales that closed within the prior twelve months should generally be used. However, the best and most appropriate comparable is not necessarily the most recent sale. An older sale may be appropriate when it is a better indicator of value, including situations involving changing market conditions or limited sales activity. When older comparable sales are used because recent comparable sales are unavailable or less appropriate, the appraiser must explain why the older sales were selected.

In rural or low-volume markets, distant or older comparable sales may be appropriate when they are the best indicators of value. The appraiser must provide appropriate explanation and support for the selection.` },
  { ...common, chunk_id: '184bc948-46f7-4c35-ab05-0901b30f2b37', section: 'B4-1.3-07', chunk_title: 'Sales Comparison Approach Section of the Appraisal Report', content: `Fannie Mae requires the sales comparison approach to analyze comparable sales, contract sales, and offerings or listings that are most comparable to the subject property. The appraiser must analyze the closed sales, contract sales, and offerings or listings that are most comparable to the subject in order to identify significant differences or elements of comparison that could affect the opinion of value as of the effective date of the appraisal. This analysis is important in all markets and is particularly important when market values are increasing or declining.

For each comparable sale, the appraisal report must identify the data and verification source or sources used. Acceptable data sources can include multiple listing services, deed records, tax records, real estate agents, builders, appraisers, appraiser files, and other reliable third-party sources. The appraiser must identify the specific source rather than using a broad description such as public records.

There must be sufficient information to understand the conditions of sale, whether financing concessions existed, the physical characteristics of the property, and whether the transaction was arm's length. When comparable data is provided by a party with a financial interest in the subject transaction, the appraiser must verify that information through a source that does not have a financial interest in the subject transaction.

Fannie Mae appraisal forms require the appraiser to report three years of prior sales history for the subject property and twelve months of prior sales history for comparable sales.` },
];
export const factualChecks = {
  adjustments: [/does not establish specific limitations/, /must not be used as the sole determinant/, /market-based/],
  distance: [/distant or older comparable sales may be appropriate when/, /explanation and support/],
  older_comparables: [/prior twelve months should generally/, /not necessarily the most recent/, /must explain why/],
  rural_comparables: [/In rural or low-volume markets/, /may be appropriate when/, /explanation and support/],
  market_area: [/must explain the rationale/, /when warranted/, /should not expand/],
  verification: [/must identify the specific source/, /must verify that information/, /does not have a financial interest/],
  listings_contracts: [/minimum of three closed/, /may also be used as supporting data when appropriate/],
  concessions: [/must be analyzed and adjusted when/, /fact-based and objective/],
};
