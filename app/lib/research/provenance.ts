import { createHash } from 'node:crypto';
import receipts from './publisher-receipts.json';
import type { SearchResult } from './types';

// Server-owned review receipts, never accepted from request metadata. They certify
// captured content, not activation or perpetual publisher currency.
export const REVIEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const byId = new Map(receipts.map(receipt => [receipt.chunk_id, receipt]));
export function publisherReceipt(row: SearchResult) {
  const receipt = byId.get(row.chunk_id);
  if (!receipt || row.authority_level !== 'authoritative') return null;
  const fields = ['source_id', 'section', 'chunk_title', 'organization', 'source_type', 'domain', 'source_url', 'source_title', 'source_version', 'effective_date'] as const;
  if (fields.some(field => row[field] !== receipt[field])) return null;
  const hash = createHash('sha256').update(row.content.replace(/\r\n/g, '\n')).digest('hex');
  return hash === receipt.content_sha256 ? receipt : null;
}

export function evidenceConfidence(rows: SearchResult[], safe: boolean, question: string, now = Date.now()) {
  const verified = rows.map(publisherReceipt);
  const publisherVerified = rows.length > 0 && verified.every(Boolean);
  const recent = publisherVerified && verified.every(receipt => {
    const age = now - Date.parse(receipt!.verified_at);
    return Number.isFinite(age) && age >= 0 && age <= REVIEW_WINDOW_MS;
  });
  // Historical/transition questions require applicability evidence beyond a recent capture.
  const temporalQuestion = /\bas of\b|\beffective\b|\bversion\b|\btransition\b|\b20\d{2}\b|\buad\b/i.test(question);
  const effectiveDateMissing = rows.some(row => !row.effective_date);
  const knownReceipt = rows.some(row => byId.has(row.chunk_id));
  // Preserve the legacy active-corpus contract; do not upgrade uncertified undated rows.
  const legacyDated = !knownReceipt && rows.length > 0 && rows.every(row => row.source_version && row.effective_date && row.source_url);
  const confidence = !safe ? 'Low' : (recent && !temporalQuestion) || (legacyDated && !temporalQuestion) ? 'High' : 'Medium';
  return {
    confidence,
    evidence: safe ? 'direct_coverage' : 'insufficient_or_conflicting',
    provenance: publisherVerified ? 'verified_publisher_capture' : 'unverified_stored_evidence',
    temporal: temporalQuestion ? 'applicability_requires_review' : recent ? 'recent_publisher_capture' : 'currency_not_verified',
    effective_date_missing: effectiveDateMissing,
    review_window_days: 30,
    reasons: [
      publisherVerified ? 'Content and source metadata match reviewed official publisher captures.' : 'Publisher provenance is not independently verified for all evidence.',
      recent ? 'Publisher capture is within the 30-day review window; this is not a guarantee of unchanged guidance.' : 'Publisher currency has not been established within the review window.',
      ...(effectiveDateMissing ? ['A discrete effective date is unavailable; no date has been inferred.'] : []),
      ...(temporalQuestion ? ['Date or version applicability requires additional verification.'] : []),
    ],
  };
}
