import { assemble } from './citations';
import { detectAuthorities, detectTopics, strictSourceMatch, topicLabel } from './analysis';
import { concepts, rankEvidence, selectEvidence, hasConflict } from './evidence';
import { directCoverage, missingSpecifics } from './confidence';
import { retrieve } from './retrieval';

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
  const unsupported = missingSpecifics(question, vocabulary).length > 0;
  const complete = covered.length === topics.length && topic !== 'general' && !unsupported;
  const safe = complete && !ambiguous && !conflict && used.length > 0;
  const assembled = assemble(safe ? used : [], safe ? parts : []);
  const { sources, answer_parts: answerParts, citations } = assembled;
  const primary = sources[0];
  const reasons = [safe ? 'Direct passages cover each recognized concept.' : 'Direct support is insufficient for the complete question.'];
  if (ambiguous) reasons.push('An authority must be selected; requirements are not combined.');
  if (conflict) reasons.push('Potential conflicting wording or versions require review.');
  if (safe) reasons.push('Evidence is labeled authoritative in the corpus; publisher provenance is not independently verified.');
  const dated = sources.every(row => row.source_version && row.effective_date && row.source_url);
  return {
    answer: safe ? assembled.answer : INSUFFICIENT,
    category: topicLabel(topic), confidence: safe ? (dated ? 'High' : 'Medium') : 'Low', topic, topics,
    target_source: target ?? primary?.organization ?? null, primary_section: primary?.section ?? null,
    primary_section_title: primary?.chunk_title ?? primary?.source_title ?? null,
    sources, result_count: sources.length, answer_parts: answerParts, citations,
    coverage: { requested: topics, supported: covered, complete: safe }, confidence_reasons: reasons,
  };
}
