import { getOfficialSourceUrl } from './analysis';
import type { SearchResult } from './types';
import type { selectEvidence } from './evidence';

export function assemble(rows: SearchResult[], parts: ReturnType<typeof selectEvidence>) {
  const sources = rows.map(row => ({ ...row, source_url: getOfficialSourceUrl(row) }));
  const answerParts = parts.map((part, index) => ({ ...part, citation_id: `E${index + 1}` }));
  const citations = answerParts.map(part => {
    const row = sources.find(source => source.chunk_id === part.chunk_id)!;
    return { id: part.citation_id, chunk_id: row.chunk_id, section: row.section, authority: row.organization,
      source_url: row.source_url, source_version: row.source_version, effective_date: row.effective_date,
      material_type: 'stored_authoritative_evidence', start: part.start, end: part.end };
  });
  const answer = answerParts.map(part => {
    const row = sources.find(source => source.chunk_id === part.chunk_id)!;
    return `${part.text}\n[${part.citation_id}] ${row.organization} — ${row.section ?? ''}`;
  }).join('\n\n');
  return { sources, answer_parts: answerParts, citations, answer };
}
