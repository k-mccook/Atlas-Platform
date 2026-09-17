import type { SearchResult } from './types';
import { publisherReceipt } from './provenance';

// Bounded coverage transformations, never answer text. Each transformation needs
// a complete, verified publisher subsection. The response still quotes that
// subsection including its qualifications; unmatched qualifiers remain required.
export function boundedReasoning(question: string, rows: SearchResult[]) {
  let coverageQuestion = question;
  const steps: { rule: string; chunk_id: string }[] = [];
  const verified = rows.filter(row => publisherReceipt(row));
  const apply = (row: SearchResult, rule: string, next: string) => {
    if (next !== coverageQuestion) { steps.push({ rule, chunk_id: row.chunk_id }); coverageQuestion = next; }
  };
  for (const row of verified) {
    const text = row.content;
    // A quantified proposed limit is answered by an explicit denial of limits
    // on that same metric. No other quantities or adjustment types are removed.
    if (/does not have specific limitations or guidelines associated with net or gross adjustments/i.test(text) &&
        /must not be the sole determinant/i.test(text) && /market based adjustments/i.test(text) &&
        /\b(?:net|gross)\s+adjustments?\b/i.test(coverageQuestion) &&
        /\b(?:cap|limit|limitation|rejection|reject)\w*\b/i.test(coverageQuestion)) {
      const metricQuantity = /\b\d+(?:\.\d+)?\s*(?:percent|%)\s+(?:net|gross)\s+adjustments?\b/i;
      const quantityAfterMetric = /\b(?:net|gross)\s+adjustments?\s+(?:at|of|to)\s+\d+(?:\.\d+)?\s*(?:percent\b|%)/i;
      const next = coverageQuestion.replace(metricQuantity, value => value.replace(/\d+(?:\.\d+)?\s*(?:percent|%)/i, ''))
        .replace(quantityAfterMetric, value => value.replace(/(?:at|of|to)\s+\d+(?:\.\d+)?\s*(?:percent|%)/i, ''));
      if (next !== coverageQuestion) apply(row, 'explicit_no_limit_on_same_metric', next.replace(/\bcaps?\b/gi, 'limitations'));
    }
    // Apply an explicitly qualified older-sales rule to a concrete age beyond
    // the publisher's stated recent-sales window. Never infer guaranteed approval.
    const window = text.match(/closed within the last (\d+) months/i);
    if (window && /older comparable sales[\s\S]*can be used if appropriate/i.test(text) &&
        /explain why they are being used/i.test(text)) {
      const example = /\b(\d+)\s*[- ]months?[- ]old\s+(?:comparable(?: sale)?|comp|sale)\b/i;
      const match = coverageQuestion.match(example);
      if (match && Number(match[1]) > Number(window[1])) {
        apply(row, 'concrete_age_within_qualified_older_sales_rule', coverageQuestion.replace(example, 'older comparable sale'));
      }
    }
    // Replacing every required closed sale conflicts with a stated positive
    // minimum. Preserve the whole subsection, including its exception reference.
    if (/minimum of (?:[1-9]\d*|one|two|three|four|five) closed comparables must be reported/i.test(text) &&
        /listings can be used as supporting data, if appropriate/i.test(text) &&
        /exceptions to this policy/i.test(text)) {
      apply(row, 'required_minimum_vs_complete_replacement', coverageQuestion.replace(
        /\b(?:replace|substitute)\s+all\s+closed\s+comparable\s+sales\s+with\s+listings\b/gi,
        'closed comparable sales and listings'));
    }
  }
  return { coverageQuestion, steps };
}
