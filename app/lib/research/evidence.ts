import { normalize, preferredSections, strictSourceMatch } from './analysis';
import type { SearchResult, Topic } from './types';
import { publisherReceipt } from './provenance';

// Retrieval vocabulary, never answer text. Keep complete paragraphs to retain qualifications.
export const concepts: Record<Topic, RegExp> = {
  sales_history: /sales history|prior sales|prior transfers/i,
  zoning: /zoning|nonconforming|non-conforming|land-use regulation/i,
  below_grade: /below-grade|above-grade|ANSI|square footage/i,
  condition: /condition rating|\bC[1-6]\b|safety|soundness|structural integrity/i,
  photos: /photograph|photo\b/i,
  adjustments: /adjustment/i,
  concessions: /concession/i,
  verification: /verif|data source|financial interest/i,
  distance: /distan|proximity|mile/i,
  rural_comparables: /rural|low.volume|remote|shortage|not truly comparable/i,
  older_comparables: /older|prior twelve months|prior 12 months/i,
  market_area: /market area|neighborhood|location adjustment/i,
  listings_contracts: /listing|contract offering|closed comparable/i,
  reconciliation: /reconcil|final opinion|range of.*adjusted/i,
  sales_comparison: /sales comparison/i,
  comparable_sales: /comparable sales/i,
  general: /$a/,
};

export function isAuthoritative(row: SearchResult) {
  if (!['authoritative', 'primary'].includes(normalize(row.authority_level)) ||
    /summary|derived|training|atlas/i.test(`${row.chunk_title} ${row.source_title}`)) return false;
  try {
    const url = new URL(row.source_url ?? '');
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const official = [
      ['Fannie Mae', 'fanniemae.com'], ['Freddie Mac', 'freddiemac.com'],
      ['FHA', 'hud.gov'], ['USPAP', 'appraisalfoundation.org'], ['VA', 'va.gov'],
      ['UAD', 'fanniemae.com'], ['UAD', 'freddiemac.com'],
    ] as const;
    return official.some(([authority, host]) => strictSourceMatch(row, authority) &&
      (url.hostname === host || url.hostname.endsWith(`.${host}`)));
  } catch { return false; }
}

export function paragraphs(row: SearchResult) {
  return [...row.content.matchAll(/\S[^]*?(?=\r?\n\s*\r?\n|$)/g)]
    .map(match => ({ text: match[0], start: match.index!, end: match.index! + match[0].length }));
}

export function rankEvidence(rows: SearchResult[], topics: Topic[], question: string) {
  const terms = question.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const score = (row: SearchResult) => {
    const title = normalize(row.chunk_title);
    const content = normalize(row.content);
    return topics.reduce((sum, topic) => sum + (concepts[topic].test(content) ? 30 : 0) +
      (row.section === preferredSections[topic] ? 15 : 0), 0) +
      terms.reduce((sum, term) => sum + (title.includes(term) ? 3 : 0) + (content.includes(term) ? 1 : 0), 0);
  };
  return [...new Map(rows.map(row => [row.chunk_id, row])).values()]
    .filter(isAuthoritative).sort((a, b) => score(b) - score(a) || a.chunk_id.localeCompare(b.chunk_id));
}

export function selectEvidence(rows: SearchResult[], topics: Topic[]) {
  const continuation = /^(however|unless|except|provided|in such|in these|in those|this |these |those |the above|for example|\(?\d+[.)]|[-•])/i;
  return rows.flatMap(row => {
    const blocks = paragraphs(row);
    // A reviewed publisher subsection is a semantic unit. Keep its lists and
    // qualifications together instead of dropping items lacking topic keywords.
    if (publisherReceipt(row) && topics.some(topic => concepts[topic].test(row.content))) {
      return blocks.map(part => ({ ...part, chunk_id: row.chunk_id, topics: topics.filter(topic => concepts[topic].test(row.content)) }));
    }
    const selected = new Set<number>();
    blocks.forEach((part, index) => {
      if (topics.some(topic => concepts[topic].test(part.text))) {
        selected.add(index);
        // Include adjacent qualifications even when they do not repeat the topic vocabulary.
        for (let next = index + 1; next < blocks.length && continuation.test(blocks[next].text); next++) selected.add(next);
        for (let previous = index; previous > 0 && continuation.test(blocks[previous].text); previous--) selected.add(previous - 1);
      }
    });
    return blocks.filter((_, index) => selected.has(index))
      .map(part => ({ ...part, chunk_id: row.chunk_id, topics: topics.filter(topic => concepts[topic].test(part.text)) }));
  });
}

// Conservative, explainable conflict signal. This is not a general contradiction solver.
export function hasConflict(rows: SearchResult[]) {
  const versions = new Map<string, Set<string>>();
  const sentences = new Map<string, Set<boolean>>();
  for (const row of rows) {
    const key = `${row.organization}|${row.section}`;
    const values = versions.get(key) ?? new Set();
    values.add(`${row.source_version}|${row.effective_date}`);
    versions.set(key, values);
    for (const sentence of row.content.toLowerCase().split(/[.!?]/)) {
      if (!/\b(must|may|should|shall|can|does)\b/.test(sentence)) continue;
      const negative = /\b(not|never)\b/.test(sentence);
      const skeleton = sentence.replace(/\b(not|never)\b/g, '').replace(/\s+/g, ' ').trim();
      const polarity = sentences.get(skeleton) ?? new Set();
      polarity.add(negative); sentences.set(skeleton, polarity);
    }
  }
  return [...versions.values()].some(value => value.size > 1) || [...sentences.values()].some(value => value.size > 1);
}
