import { assemble } from './citations';
import { detectAuthorities, detectTopics, strictSourceMatch, topicLabel } from './analysis';
import { concepts, rankEvidence, selectEvidence, hasConflict } from './evidence';
import { directCoverage, missingSpecifics } from './confidence';
import { retrieve } from './retrieval';
import { evidenceConfidence } from './provenance';
import { publisherReceipt } from './provenance';
import { canonicalWording, hasExplicitQualification } from './terminology';

export const INSUFFICIENT = 'Atlas did not find enough relevant authoritative guidance in the current knowledge base to answer this question reliably.';

export function analyze(question: string) {
  const topics = detectTopics(question);
  const authorities = detectAuthorities(question);
  return { topic: topics[0], topics, authorities, target: authorities[0] ?? null };
}

export async function research(question: string, client: Parameters<typeof retrieve>[2]) {
  const { topic, topics, authorities, target } = analyze(question);
  const raw = await retrieve(question, topics, client);
  const eligible = raw.filter(row => strictSourceMatch(row, target));
  const ranked = rankEvidence(eligible, topics, question);
  const ambiguous = authorities.length > 1 || (!target && new Set(ranked.map(row => row.organization)).size > 1);
  const parts = selectEvidence(ranked, topics);
  const used = ranked.filter(row => parts.some(part => part.chunk_id === row.chunk_id));
  const conflict = hasConflict(used);
  const covered = topics.filter(topic => directCoverage(topic, parts.filter(part => concepts[topic].test(part.text)).map(part => part.text).join(" ")));
  // Do not let a familiar topic hide a specific unsupported qualifier.
  const vocabulary = parts.map(part => part.text).join(' ').toLowerCase();
  const publisherVerified = used.length > 0 && used.every(row => publisherReceipt(row));
  const qualifiedPrimary = parts.some(part => concepts[topic].test(part.text) && hasExplicitQualification(part.text));
  const missing = publisherVerified ? missingSpecifics(canonicalWording(question), canonicalWording(vocabulary))
    .filter(term => term !== 'alway' || !qualifiedPrimary) : missingSpecifics(question, vocabulary);
  const unsupported = missing.length > 0;
  const complete = covered.length === topics.length && topic !== 'general' && !unsupported;
  const safe = complete && !ambiguous && !conflict && used.length > 0;
  const assembled = assemble(safe ? used : [], safe ? parts : []);
  const { sources, answer_parts: answerParts, citations } = assembled;
  const primary = sources[0];
  const reasons = [safe ? 'Direct passages cover each recognized concept.' : 'Direct support is insufficient for the complete question.'];
  if (ambiguous) reasons.push('An authority must be selected; requirements are not combined.');
  if (conflict) reasons.push('Potential conflicting wording or versions require review.');
  const confidenceState = evidenceConfidence(used, safe, question);
  if (safe) reasons.push(...confidenceState.reasons);
  return {
    answer: safe ? assembled.answer : INSUFFICIENT,
    category: topicLabel(topic), confidence: confidenceState.confidence, topic, topics,
    target_source: target ?? primary?.organization ?? null, primary_section: primary?.section ?? null,
    primary_section_title: primary?.chunk_title ?? primary?.source_title ?? null,
    sources, result_count: sources.length, answer_parts: answerParts, citations,
    coverage: { requested: topics, supported: covered, unsupported: topics.filter(topic => !covered.includes(topic)), missing_terms: missing, complete: safe }, confidence_reasons: reasons,
    confidence_state: confidenceState,
  };
}
