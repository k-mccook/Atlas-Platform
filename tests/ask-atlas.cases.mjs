// Override authority/confidence per entry when adding cases for other authorities.
export const authorities = {
  'Fannie Mae': { officialHostname: 'selling-guide.fanniemae.com' },
};

export const cases = [
  {
    question: 'Does Fannie Mae have limits on gross or net adjustments?',
    topic: 'adjustments', category: 'Comparable Adjustments', section: 'B4-1.3-09',
  },
  {
    question: 'How far away can a comparable sale be under Fannie Mae guidelines?',
    topic: 'distance', category: 'Comparable Distance', section: 'B4-1.3-08',
  },
  {
    question: 'Can I use a comparable that sold more than 12 months ago for Fannie Mae?',
    topic: 'older_comparables', category: 'Older Comparable Sales', section: 'B4-1.3-08',
  },
  {
    question: 'Can rural comparable sales be farther away from the subject under Fannie Mae guidelines?',
    topic: 'rural_comparables', category: 'Rural Comparable Sales', section: 'B4-1.3-08',
  },
  {
    question: "Can I use a comparable from outside the subject's neighborhood under Fannie Mae guidelines?",
    topic: 'market_area', category: 'Comparable Market Area', section: 'B4-1.3-08',
  },
  {
    question: 'What does Fannie Mae require for verification of comparable sales?',
    topic: 'verification', category: 'Comparable Verification', section: 'B4-1.3-07',
  },
  {
    question: 'Can listings and pending sales be used in a Fannie Mae appraisal?',
    topic: 'listings_contracts', category: 'Listings and Contract Sales', section: 'B4-1.3-08',
  },
  {
    question: 'How should sales concessions be adjusted under Fannie Mae guidelines?',
    topic: 'concessions', category: 'Sales Concessions', section: 'B4-1.3-09',
  },
].map((entry) => ({ authority: 'Fannie Mae', confidence: 'High', ...entry }));
