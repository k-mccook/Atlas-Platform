import type { SearchResult, TargetSource, Topic } from './types';

export const preferredSections: Partial<Record<Topic, string>> = {
  sales_history: 'B4-1.3-07', zoning: 'B4-1.3-04', below_grade: 'B4-1.3-05',
  condition: 'B4-1.3-06', photos: 'B4-1.2-01',
  comparable_sales: 'B4-1.3-08',
  adjustments: 'B4-1.3-09',
  sales_comparison: 'B4-1.3-07',
  reconciliation: 'B4-1.3-11',
  verification: 'B4-1.3-07',
  concessions: 'B4-1.3-09',
  market_area: 'B4-1.3-08',
  older_comparables: 'B4-1.3-08',
  rural_comparables: 'B4-1.3-08',
  distance: 'B4-1.3-08',
  listings_contracts: 'B4-1.3-08',
};

const fannieSectionUrls: Record<string, string> = {
  'B4-1.3-07':
    'https://selling-guide.fanniemae.com/sel/b4-1.3-07/sales-comparison-approach-section-appraisal-report',

  'B4-1.3-08':
    'https://selling-guide.fanniemae.com/sel/b4-1.3-08/comparable-sales',

  'B4-1.3-09':
    'https://selling-guide.fanniemae.com/sel/b4-1.3-09/adjustments-comparable-sales',

  'B4-1.3-11':
    'https://selling-guide.fanniemae.com/sel/b4-1.3-11/valuation-analysis-and-reconciliation',
};

export function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

const authorityPatterns: Record<NonNullable<TargetSource>, RegExp> = {
  'Fannie Mae': /\bfannie(?: mae)?\b|\bfnma\b/i,
  'Freddie Mac': /\bfreddie(?: mac)?\b|\bfhlmc\b/i,
  FHA: /\bfha\b|\bhud\b/i,
  USPAP: /\buspap\b|appraisal foundation/i,
  VA: /\bva\b|veterans affairs/i,
  UAD: /\buad\b|uniform appraisal dataset/i,
};

export function detectAuthorities(question: string) {
  return (Object.keys(authorityPatterns) as NonNullable<TargetSource>[])
    .filter(authority => authorityPatterns[authority].test(question));
}

export function detectTopics(question: string): Topic[] {
  const topics: Topic[] = [];
  const q = question
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (/sales? history|prior (sales?|transfers?)|previous (sales?|transfers?)/.test(q)) topics.push('sales_history');
  if (/zon(?:ing|ed)|non[- ]?conforming|grandfathered/.test(q)) topics.push('zoning');
  if (/below[- ]grade|basement|finished area|square footage|ansi/.test(q)) topics.push('below_grade');
  if (/\bcondition\b|\bc[1-6]\b|safety|soundness|structural integrity/.test(q)) topics.push('condition');
  if (/photo(?:graphs?)?s?|pictures?|images?/.test(q)) topics.push('photos');

  if (
    q.includes('reconcil') ||
    q.includes('final value') ||
    q.includes('final opinion') ||
    q.includes('indicated value') ||
    q.includes('approaches to value') ||
    q.includes('approach to value') ||
    q.includes('most weight') ||
    q.includes('weighted average') ||
    q.includes('weighting') ||
    q.includes('average the') ||
    q.includes('average of') ||
    q.includes('simply average') ||
    q.includes('averaging') ||
    q.includes('range of values') ||
    q.includes('range of the approaches')
  ) {
    topics.push('reconciliation');
  }

  if (
    q.includes('concession') ||
    q.includes('concessions') ||
    q.includes('seller contribution') ||
    q.includes('seller contributions') ||
    q.includes('sales concession') ||
    q.includes('sales concessions') ||
    q.includes('financing concession') ||
    q.includes('financing concessions')
  ) {
    topics.push('concessions');
  }

  if (
    q.includes('adjustment') ||
    q.includes('adjustments') ||
    q.includes('gross adjustment') ||
    q.includes('net adjustment') ||
    q.includes('gross or net') ||
    q.includes('net or gross') ||
    q.includes('adjusted value') ||
    q.includes('market-based adjustment') ||
    q.includes('market based adjustment')
  ) {
    topics.push('adjustments');
  }

  if (
    q.includes('verify') ||
    q.includes('verified') ||
    q.includes('verification') ||
    q.includes('data source') ||
    q.includes('data sources') ||
    q.includes('public record') ||
    q.includes('public records') ||
    q.includes('disinterested source') ||
    q.includes('source of data')
  ) {
    topics.push('verification');
  }

  if (
    q.includes('older comp') ||
    q.includes('older comparable') ||
    q.includes('older sale') ||
    q.includes('old comparable') ||
    q.includes('old comp') ||
    q.includes('more than 12 months') ||
    q.includes('over 12 months') ||
    q.includes('older than 12 months') ||
    q.includes('12 months ago') ||
    q.includes('year old') ||
    q.includes('prior twelve months') ||
    q.includes('prior 12 months')
  ) {
    topics.push('older_comparables');
  }

  if (
    q.includes('rural') ||
    q.includes('remote market') ||
    q.includes('low-volume market') ||
    q.includes('low volume market') ||
    q.includes('distant comparable') ||
    q.includes('distant comparables') ||
    q.includes('distant comp') ||
    q.includes('distant comps')
  ) {
    topics.push('rural_comparables');
  }

  if (
    q.includes('distance') ||
    q.includes('how far') ||
    q.includes('far away') ||
    q.includes('far from') ||
    q.includes('miles away') ||
    q.includes('mile away') ||
    q.includes('within a mile') ||
    q.includes('one mile') ||
    q.includes('1 mile') ||
    q.includes('proximity')
  ) {
    topics.push('distance');
  }

  if (
    q.includes('listing') ||
    q.includes('listings') ||
    q.includes('active listing') ||
    q.includes('active listings') ||
    q.includes('contract sale') ||
    q.includes('contract sales') ||
    q.includes('pending sale') ||
    q.includes('pending sales') ||
    q.includes('pending comp') ||
    q.includes('pending comps') ||
    q.includes('under contract')
  ) {
    topics.push('listings_contracts');
  }

  if (
    q.includes('market area') ||
    q.includes('outside the market') ||
    q.includes('outside market') ||
    q.includes('neighborhood boundary') ||
    q.includes('neighborhood boundaries') ||
    q.includes('outside the neighborhood') ||
    q.includes('outside neighborhood') ||
    q.includes("outside the subject's neighborhood") ||
    q.includes('competing market') ||
    q.includes('different neighborhood') ||
    q.includes('another neighborhood')
  ) {
    topics.push('market_area');
  }

  if (
    q.includes('sales comparison approach') ||
    q.includes('sales comparison') ||
    q.includes('comparable analysis')
  ) {
    if (!topics.length) topics.push('sales_comparison');
  }

  if (
    q.includes('comparable sale') ||
    q.includes('comparable sales') ||
    q.includes('comparable') ||
    q.includes('comparables') ||
    q.includes('comp ') ||
    q.endsWith('comp') ||
    q.includes('comps')
  ) {
    if (!topics.length) topics.push('comparable_sales');
  }

  return topics.length ? topics : ['general'];
}

export function strictSourceMatch(
  result: SearchResult,
  targetSource: TargetSource
): boolean {
  if (!targetSource) {
    return true;
  }

  const organization = normalize(result.organization);
  const sourceType = normalize(result.source_type);
  const domain = normalize(result.domain);

  switch (targetSource) {
    case 'Fannie Mae':
      return (
        organization === 'fannie mae' &&
        (
          sourceType === 'fannie_mae' ||
          sourceType === 'fnma' ||
          domain.includes('fanniemae.com')
        )
      );

    case 'Freddie Mac':
      return (
        organization === 'freddie mac' &&
        (
          sourceType === 'freddie_mac' ||
          sourceType === 'fhlmc' ||
          domain.includes('freddiemac.com')
        )
      );

    case 'FHA':
      return (
        organization === 'fha' ||
        organization === 'hud' ||
        organization ===
          'u.s. department of housing and urban development'
      );

    case 'USPAP':
      return (
        organization === 'the appraisal foundation' ||
        organization === 'appraisal foundation' ||
        organization === 'uspap'
      );

    case 'VA':
      return (
        organization === 'department of veterans affairs' ||
        organization === 'u.s. department of veterans affairs' ||
        organization === 'va'
      );

    case 'UAD':
      return (
        sourceType === 'uad' ||
        normalize(result.source_title).includes(
          'uniform appraisal dataset'
        )
      );

    default:
      return false;
  }
}

export function topicLabel(topic: Topic) {
  switch (topic) {
    case 'sales_history': return 'Prior Sales History';
    case 'zoning': return 'Property Zoning';
    case 'below_grade': return 'Above- and Below-Grade Areas';
    case 'condition': return 'Property Condition';
    case 'photos': return 'Appraisal Photographs';
    case 'comparable_sales':
      return 'Comparable Sales';

    case 'adjustments':
      return 'Comparable Adjustments';

    case 'sales_comparison':
      return 'Sales Comparison Approach';

    case 'reconciliation':
      return 'Reconciliation';

    case 'verification':
      return 'Comparable Verification';

    case 'concessions':
      return 'Sales Concessions';

    case 'market_area':
      return 'Comparable Market Area';

    case 'older_comparables':
      return 'Older Comparable Sales';

    case 'rural_comparables':
      return 'Rural Comparable Sales';

    case 'distance':
      return 'Comparable Distance';

    case 'listings_contracts':
      return 'Listings and Contract Sales';

    default:
      return 'Appraisal Guidance';
  }
}

export function getOfficialSourceUrl(result: SearchResult) {
  if (
    normalize(result.organization) === 'fannie mae' &&
    result.section &&
    fannieSectionUrls[result.section]
  ) {
    return fannieSectionUrls[result.section];
  }

  return result.source_url;
}
