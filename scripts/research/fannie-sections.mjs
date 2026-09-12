export const sections = [
  ['B4-1.3-03', 'neighborhood-section-appraisal-report'],
  ['B4-1.3-04', 'site-section-appraisal-report'],
  ['B4-1.3-05', 'improvements-section-appraisal-report'],
  ['B4-1.3-06', 'property-condition-and-quality-construction-improvements'],
  ['B4-1.3-07', 'sales-comparison-approach-section-appraisal-report'],
  ['B4-1.3-08', 'comparable-sales'],
  ['B4-1.3-09', 'adjustments-comparable-sales'],
  ['B4-1.3-11', 'valuation-analysis-and-reconciliation'],
  ['B4-1.2-01', 'appraisal-report-forms-and-exhibits'],
].map(([section, slug]) => ({ section, url: `https://selling-guide.fanniemae.com/sel/${section.toLowerCase()}/${slug}` }));
