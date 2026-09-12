import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { legacyCorpus } from './benchmark.mjs';
import { digest } from './capture-fannie.mjs';

export const canonical = text => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export function classifyProvenance(row, page) {
  if (/summary|atlas|derived/i.test(row.chunk_title ?? '')) return 'derived_summary';
  if (!page || row.section !== page.section) return 'unverified';
  return page.blocks.some(block => canonical(block.content).includes(canonical(row.content)))
    ? 'publisher_text_match_normalized' : 'paraphrase_or_unverified_derivation';
}
export function audit(pages) {
  return legacyCorpus.map(row => {
    const page = pages.find(page => page.section === row.section);
    return { chunk_id: row.chunk_id, source_id: row.source_id, title: row.chunk_title, section: row.section,
      stored_content_sha256_lf: digest(row.content.replace(/\r\n/g, '\n')), stored_authority_level: row.authority_level,
      stored_version: row.source_version, stored_effective_date: row.effective_date,
      official_url: page?.official_url, publisher_section_revision_date: page?.section_revision_date,
      verified_at: page?.verified_at, classification: classifyProvenance(row, page),
      author_identity: 'Not recoverable from current schema/import records',
      note: 'Normalized matching ignores punctuation/case. A URL and authoritative label do not prove publisher authorship. Heading revision dates are not established rule-effective dates.' };
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = resolve('docs/research/milestone-3');
  const { pages } = JSON.parse(await readFile(resolve(directory, 'publisher-capture.json'), 'utf8'));
  const result = audit(pages);
  await writeFile(resolve(directory, 'provenance-audit.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result.map(({ section, title, classification }) => ({ section, title, classification })), null, 2));
}
