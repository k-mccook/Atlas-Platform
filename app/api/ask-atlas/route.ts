import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type SearchResult = {
  chunk_id: string;
  source_id: string;
  source_title: string | null;
  organization: string | null;
  source_type: string | null;
  source_url: string | null;
  domain: string | null;
  section: string | null;
  chunk_title: string | null;
  authority_level: string | null;
  source_version: string | null;
  effective_date: string | null;
  content: string;
  rank: number;
};

type TargetSource =
  | 'Fannie Mae'
  | 'Freddie Mac'
  | 'FHA'
  | 'USPAP'
  | 'VA'
  | 'UAD'
  | null;

type Topic =
  | 'comparable_sales'
  | 'adjustments'
  | 'sales_comparison'
  | 'reconciliation'
  | 'verification'
  | 'concessions'
  | 'market_area'
  | 'older_comparables'
  | 'rural_comparables'
  | 'distance'
  | 'listings_contracts'
  | 'general';

const preferredSections: Partial<Record<Topic, string>> = {
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

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function detectTargetSource(question: string): TargetSource {
  const q = question.toLowerCase();

  if (
    q.includes('fannie mae') ||
    q.includes('fannie') ||
    q.includes('fnma')
  ) {
    return 'Fannie Mae';
  }

  if (
    q.includes('freddie mac') ||
    q.includes('freddie') ||
    q.includes('fhlmc')
  ) {
    return 'Freddie Mac';
  }

  if (q.includes('fha') || q.includes('hud')) {
    return 'FHA';
  }

  if (
    q.includes('uspap') ||
    q.includes('appraisal foundation')
  ) {
    return 'USPAP';
  }

  if (
    q.includes('department of veterans affairs') ||
    q.includes('va appraisal') ||
    q.includes('va loan')
  ) {
    return 'VA';
  }

  if (
    q.includes('uad') ||
    q.includes('uniform appraisal dataset')
  ) {
    return 'UAD';
  }

  return null;
}

function detectTopic(question: string): Topic {
  const q = question
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

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
    return 'reconciliation';
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
    return 'concessions';
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
    return 'adjustments';
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
    return 'verification';
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
    return 'older_comparables';
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
    return 'rural_comparables';
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
    return 'distance';
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
    return 'listings_contracts';
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
    return 'market_area';
  }

  if (
    q.includes('sales comparison approach') ||
    q.includes('sales comparison') ||
    q.includes('comparable analysis')
  ) {
    return 'sales_comparison';
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
    return 'comparable_sales';
  }

  return 'general';
}

function strictSourceMatch(
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

function topicLabel(topic: Topic) {
  switch (topic) {
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

function getOfficialSourceUrl(result: SearchResult) {
  if (
    normalize(result.organization) === 'fannie mae' &&
    result.section &&
    fannieSectionUrls[result.section]
  ) {
    return fannieSectionUrls[result.section];
  }

  return result.source_url;
}

function scoreResult(
  result: SearchResult,
  topic: Topic,
  question: string
) {
  let score = Number(result.rank ?? 0);

  const preferredSection = preferredSections[topic];
  const section = result.section ?? '';
  const content = normalize(result.content);
  const title = normalize(result.chunk_title);
  const q = normalize(question);

  if (
    preferredSection &&
    section === preferredSection
  ) {
    score += 1000;
  }

  if (
    normalize(result.authority_level) ===
    'authoritative'
  ) {
    score += 100;
  }

  switch (topic) {
    case 'distance':
      if (content.includes('distance')) score += 100;
      if (content.includes('miles')) score += 100;
      if (content.includes('directional')) score += 100;
      if (content.includes('rural')) score += 25;
      break;

    case 'older_comparables':
      if (content.includes('12 months')) score += 125;
      if (content.includes('older')) score += 100;
      if (content.includes('recent')) score += 50;
      break;

    case 'rural_comparables':
      if (content.includes('rural')) score += 150;
      if (content.includes('distant')) score += 100;
      break;

    case 'market_area':
      if (content.includes('market area')) score += 150;
      if (content.includes('neighborhood')) score += 100;
      if (content.includes('location adjustment')) score += 50;
      break;

    case 'listings_contracts':
      if (content.includes('listing')) score += 125;
      if (content.includes('contract')) score += 125;
      break;

    case 'verification':
      if (content.includes('verification')) score += 125;
      if (content.includes('verify')) score += 100;
      if (content.includes('data source')) score += 100;
      if (content.includes('disinterested')) score += 100;
      break;

    case 'concessions':
      if (content.includes('concession')) score += 150;
      if (content.includes('market value')) score += 25;
      break;

    case 'adjustments':
      if (title.includes('adjustment')) score += 100;

      if (
        q.includes('limit') &&
        (
          content.includes(
            'does not establish specific limitations'
          ) ||
          content.includes('no specific')
        )
      ) {
        score += 200;
      }

      break;

    case 'reconciliation':
      if (title.includes('reconcil')) score += 125;
      if (content.includes('reconcil')) score += 100;

      if (
        q.includes('average') &&
        content.includes('averag')
      ) {
        score += 150;
      }

      if (
        q.includes('range') &&
        content.includes('range')
      ) {
        score += 100;
      }

      break;

    case 'comparable_sales':
      if (title.includes('comparable sales')) score += 100;
      break;

    case 'sales_comparison':
      if (
        content.includes('sales comparison approach')
      ) {
        score += 150;
      }

      break;

    default:
      break;
  }

  return score;
}

function dedupeResults(results: SearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = [
      result.source_id,
      result.section,
      result.chunk_title,
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function calculateConfidence(
  primary: SearchResult | null,
  topic: Topic,
  targetSource: TargetSource
): 'High' | 'Medium' | 'Low' {
  if (!primary) {
    return 'Low';
  }

  const authoritative =
    normalize(primary.authority_level) ===
    'authoritative';

  const expectedSection =
    preferredSections[topic];

  const correctSection =
    expectedSection
      ? primary.section === expectedSection
      : false;

  const correctSource =
    targetSource
      ? strictSourceMatch(primary, targetSource)
      : true;

  if (
    authoritative &&
    correctSection &&
    correctSource
  ) {
    return 'High';
  }

  if (
    authoritative &&
    correctSource
  ) {
    return 'Medium';
  }

  return 'Low';
}

function cleanSentence(sentence: string) {
  return sentence
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(content: string) {
  return content
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(cleanSentence)
    .filter((sentence) => sentence.length > 20);
}

function selectRelevantSentences(
  content: string,
  keywords: string[],
  limit = 3
) {
  const sentences = splitIntoSentences(content);

  const scored = sentences
    .map((sentence, index) => {
      const normalizedSentence = normalize(sentence);

      const score = keywords.reduce(
        (total, keyword) =>
          normalizedSentence.includes(keyword)
            ? total + 1
            : total,
        0
      );

      return {
        sentence,
        index,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.index - b.index;
    });

  const selected = scored
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  return selected;
}

function buildFannieAnswer(
  topic: Topic,
  primary: SearchResult
) {
  const sourceLine =
    primary.section
      ? `Source: Fannie Mae Selling Guide ${primary.section}.`
      : 'Source: Fannie Mae Selling Guide.';

  switch (topic) {
    case 'distance':
      return [
        'Fannie Mae does not establish a specific maximum mileage or distance for a comparable sale.',
        'The appraiser is responsible for selecting the best and most appropriate comparable sales for the subject property and its market. More distant comparables may be appropriate, particularly in rural or low-volume markets, when they are the best indicators of value and the appraiser adequately explains and supports their use.',
        sourceLine,
      ].join('\n\n');

    case 'older_comparables':
      return [
        'Yes. Fannie Mae generally expects comparable sales from the prior 12 months, but an older sale may be used when it is a better and more appropriate indicator of value.',
        'When an older comparable is used because more recent sales are unavailable or less appropriate, the appraiser should explain why the older sale was selected and support its relevance to the subject.',
        sourceLine,
      ].join('\n\n');

    case 'rural_comparables':
      return [
        'Yes. In rural or low-volume markets, Fannie Mae permits the use of more distant or older comparable sales when they are the best available indicators of value.',
        'The appraiser must adequately explain and support why those comparables were selected.',
        sourceLine,
      ].join('\n\n');

    case 'market_area':
      return [
        "Yes. A comparable sale may come from outside the subject property's market area when it is one of the best and most appropriate comparables available.",
        'The appraiser should explain the rationale for using the sale and make a location adjustment when warranted. Fannie Mae also indicates that the market area should not simply be expanded for the purpose of encompassing otherwise distant comparable sales.',
        sourceLine,
      ].join('\n\n');

    case 'verification':
      return [
        'Fannie Mae requires the appraiser to report the data and verification sources used for comparable sales.',
        'The source should be specific and reliable rather than described only in broad terms such as "public records." When information comes from a party with a financial interest in the transaction, the appraiser should verify that information through a disinterested source.',
        sourceLine,
      ].join('\n\n');

    case 'listings_contracts':
      return [
        'Yes. Fannie Mae allows current listings and contract sales to be used as supporting market data when appropriate.',
        'The sales comparison approach must still include at least three closed comparable sales. Listings and contract offerings can supplement those closed sales and provide additional support for the opinion of market value.',
        sourceLine,
      ].join('\n\n');

    case 'concessions':
      return [
        'Sales and financing concessions should be adjusted based on their actual effect on the comparable sale price and the market.',
        'The adjustment should be market-supported rather than based only on the face amount of the concession. The appraiser should provide objective, fact-based support and identify the data used to develop the adjustment.',
        sourceLine,
      ].join('\n\n');

    case 'adjustments':
      return [
        'Fannie Mae does not establish specific percentage limits for gross or net adjustments.',
        'The size or number of adjustments alone does not determine whether a comparable is acceptable. Adjustments should reflect market reaction, be market-supported, and be adequately explained when necessary.',
        sourceLine,
      ].join('\n\n');

    case 'reconciliation':
      return [
        'Fannie Mae requires the appraiser to reconcile the applicability and reliability of the approaches to value used in the appraisal and explain which approach or approaches were given the most weight.',
        'Reconciliation is not simply an averaging exercise. A weighted average may be appropriate only when it is properly supported and explained, and the final reconciled value should be consistent with the value indications developed in the appraisal.',
        sourceLine,
      ].join('\n\n');

    case 'sales_comparison':
      return [
        'Fannie Mae requires the sales comparison approach to analyze the sales, contracts, listings, and other market evidence that are most comparable to the subject property.',
        'The appraiser should report and analyze the relevant market data, identify the sources used, and explain the reasoning supporting the value conclusion.',
        sourceLine,
      ].join('\n\n');

    case 'comparable_sales':
      return [
        'Fannie Mae places responsibility on the appraiser to determine which comparable sales are the best and most appropriate for the assignment.',
        'Comparable selection should reflect the subject property, its market area, physical and legal characteristics, competitive alternatives, and relevant external influences. At least three closed comparable sales are generally required in the sales comparison approach.',
        sourceLine,
      ].join('\n\n');

    default:
      return null;
  }
}

function buildExtractiveAnswer(
  question: string,
  topic: Topic,
  primary: SearchResult
) {
  const topicKeywords: Record<Topic, string[]> = {
    distance: [
      'distance',
      'mile',
      'miles',
      'distant',
      'rural',
      'proximity',
    ],

    older_comparables: [
      '12 months',
      'older',
      'recent',
      'prior',
      'sale',
    ],

    rural_comparables: [
      'rural',
      'distant',
      'limited',
      'market',
    ],

    market_area: [
      'market area',
      'neighborhood',
      'location',
      'outside',
    ],

    listings_contracts: [
      'listing',
      'contract',
      'pending',
      'support',
    ],

    verification: [
      'verify',
      'verification',
      'data source',
      'source',
      'disinterested',
    ],

    concessions: [
      'concession',
      'market',
      'adjust',
      'financing',
    ],

    adjustments: [
      'adjustment',
      'gross',
      'net',
      'market',
      'limit',
    ],

    reconciliation: [
      'reconcil',
      'weight',
      'average',
      'approach',
      'final',
    ],

    comparable_sales: [
      'comparable',
      'sale',
      'market',
      'subject',
    ],

    sales_comparison: [
      'sales comparison',
      'comparable',
      'market',
      'analysis',
    ],

    general: normalize(question)
      .split(/\s+/)
      .filter((word) => word.length >= 5)
      .slice(0, 8),
  };

  const sentences = selectRelevantSentences(
    primary.content,
    topicKeywords[topic],
    3
  );

  if (sentences.length > 0) {
    return sentences.join(' ');
  }

  const fallbackSentences =
    splitIntoSentences(primary.content).slice(0, 3);

  if (fallbackSentences.length > 0) {
    return fallbackSentences.join(' ');
  }

  return primary.content.trim();
}

function buildAnswer(
  question: string,
  topic: Topic,
  primary: SearchResult | null
) {
  if (!primary) {
    return 'Atlas did not find enough relevant authoritative guidance in the current knowledge base to answer this question reliably.';
  }

  if (normalize(primary.organization) === 'fannie mae') {
    const fannieAnswer =
      buildFannieAnswer(topic, primary);

    if (fannieAnswer) {
      return fannieAnswer;
    }
  }

  return buildExtractiveAnswer(
    question,
    topic,
    primary
  );
}

export async function POST(request: Request) {
  try {
    const bearer = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
      request.headers.get('authorization') ?? ''
    );
    if (!bearer) {
      return NextResponse.json(
        { error: 'Please sign in to use Ask Atlas.' },
        { status: 401 }
      );
    }
    const token = bearer[1];

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            'Atlas is missing its Supabase environment configuration.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Verify independently; never trust a decoded token or browser user object.
    // Keep credentials and authentication error details out of logs/responses.
    let verified;
    try {
      verified = await supabase.auth.getUser(token);
    } catch {
      return NextResponse.json(
        { error: 'Sign-in verification is temporarily unavailable.' },
        { status: 503 }
      );
    }
    if (verified.error) {
      const invalidCredentials = [400, 401, 403, 422].includes(verified.error.status ?? 0);
      return NextResponse.json(
        { error: invalidCredentials
          ? 'Please sign in to use Ask Atlas.'
          : 'Sign-in verification is temporarily unavailable.' },
        { status: invalidCredentials ? 401 : 503 }
      );
    }
    if (!verified.data.user?.id || verified.data.user.role !== 'authenticated' || verified.data.user.is_anonymous) {
      return NextResponse.json(
        { error: 'Please sign in to use Ask Atlas.' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Please enter a question.' }, { status: 400 });
    }
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) {
      return NextResponse.json({ error: 'Please enter a question.' }, { status: 400 });
    }

    const targetSource =
      detectTargetSource(question);

    const topic =
      detectTopic(question);

    const expectedSection =
      preferredSections[topic] ?? null;

    const { data, error } =
      await supabase.rpc(
        'search_knowledge',
        {
          search_query: question,
        }
      );

    if (error) {
      console.error(
        'Atlas knowledge search failed.'
      );

      return NextResponse.json(
        {
          error:
            'Atlas could not search the knowledge base.',
        },
        { status: 500 }
      );
    }

    let results =
      (data ?? []) as SearchResult[];

    // Enforce a named authority.
    if (targetSource) {
      results = results.filter((result) =>
        strictSourceMatch(
          result,
          targetSource
        )
      );
    }

    // Prefer official authoritative material.
    const authoritativeResults =
      results.filter(
        (result) =>
          normalize(result.authority_level) ===
          'authoritative'
      );

    if (authoritativeResults.length > 0) {
      results = authoritativeResults;
    }

    // Keep recognized topics inside the expected section
    // whenever the knowledge base contains that section.
    if (expectedSection) {
      const sectionResults =
        results.filter(
          (result) =>
            result.section === expectedSection
        );

      if (sectionResults.length > 0) {
        results = sectionResults;
      }
    }

    // Rank the chunks that remain.
    results = [...results].sort(
      (a, b) =>
        scoreResult(b, topic, question) -
        scoreResult(a, topic, question)
    );

    results = dedupeResults(results);

    // Keep the result display focused.
    const selectedResults =
      results.slice(0, 3);

    const primary =
      selectedResults[0] ?? null;

    // NEW:
    // Produce a concise answer from the retrieved authority
    // instead of dumping the entire database chunk.
    const answer =
      buildAnswer(
        question,
        topic,
        primary
      );

    const confidence =
      calculateConfidence(
        primary,
        topic,
        targetSource
      );

    const sources =
      selectedResults.map((result) => ({
        chunk_id:
          result.chunk_id,

        source_id:
          result.source_id,

        source_title:
          result.source_title,

        organization:
          result.organization,

        source_type:
          result.source_type,

        source_url:
          getOfficialSourceUrl(result),

        domain:
          result.domain,

        section:
          result.section,

        chunk_title:
          result.chunk_title,

        authority_level:
          result.authority_level,

        source_version:
          result.source_version,

        effective_date:
          result.effective_date,

        content:
          result.content,

        rank:
          result.rank,
      }));

    return NextResponse.json({
      answer,

      category:
        topicLabel(topic),

      confidence,

      topic,

      target_source:
        targetSource ??
        primary?.organization ??
        null,

      primary_section:
        primary?.section ??
        null,

      primary_section_title:
        primary?.chunk_title ??
        primary?.source_title ??
        null,

      sources,

      result_count:
        sources.length,
    });
  } catch {
    console.error(
      'Ask Atlas API failed.'
    );

    return NextResponse.json(
      {
        error:
          'Atlas encountered an unexpected error.',
      },
      { status: 500 }
    );
  }
}
