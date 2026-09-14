// Generates review artifacts only. No database client, credentials or network calls.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { legacyCorpus } from './benchmark.mjs';
import { audit } from './audit-provenance.mjs';
import { digest } from './capture-fannie.mjs';
import { sections } from './fannie-sections.mjs';

const md5 = text => createHash('md5').update(text.replace(/\r\n/g, '\n')).digest('hex');
const uuid = value => {
  const hex = digest('atlas-fannie-publisher-v1|' + value).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const literal = value => "'" + value.replace(/'/g, "''") + "'";
const ids = rows => rows.map(row => literal(row.id ?? row.chunk_id)).join(', ');
const payload = value => {
  const text = JSON.stringify(value, null, 2);
  if (text.includes('$atlas_review$')) throw new Error('Unsafe SQL delimiter');
  return `$atlas_review$${text}$atlas_review$::jsonb`;
};

export function makePlan(pages) {
  if (pages.length !== 9 || new Set(pages.map(page => page.section)).size !== 9) throw new Error('Expected nine reviewed sections');
  const sources = [], chunks = [];
  for (const page of pages) {
    const expectedPage = sections.find(entry => entry.section === page.section);
    if (!expectedPage || expectedPage.url !== page.official_url || !page.title.startsWith(page.section + ',') || page.material_type !== 'publisher_capture' || !/^[a-f0-9]{64}$/.test(page.html_sha256)) throw new Error('Unverified publisher origin');
    const id = uuid(page.official_url + page.html_sha256);
    const version = `Selling Guide section revision ${page.section_revision_date}; capture ${page.verified_at.slice(0, 10)}`;
    sources.push({ id, title: page.title, organization: 'Fannie Mae', source_type: 'FANNIE_MAE', url: page.official_url,
      description: JSON.stringify({ material_type: 'publisher_capture', section_revision_date: page.section_revision_date, html_sha256: page.html_sha256, capture: 'docs/research/milestone-3/publisher-capture.json', effective_date_verified: false }),
      version, effective_date: null, last_verified_at: page.verified_at, chapter: page.section.slice(0, -3), topic: page.section,
      publication_date: null, status: 'staged_provenance_review', domain: 'selling-guide.fanniemae.com' });
    if (new Set(page.blocks.map(block => block.heading)).size !== page.blocks.length) throw new Error('Duplicate subsection heading');
    page.blocks.forEach((block, index) => {
      if (digest(block.content) !== block.sha256 || !block.content || !block.heading) throw new Error('Changed publisher block');
      chunks.push({ id: uuid(id + block.heading + block.sha256), source_id: id, title: block.heading, content: block.content,
        section: page.section, page_number: null, chunk_number: index + 1, source_version: version, effective_date: null, authority_level: 'authoritative' });
    });
    const source = sources[sources.length - 1];
    source.description = JSON.stringify({ ...JSON.parse(source.description), subsections: chunks.filter(chunk => chunk.source_id === id).map(chunk => ({ chunk_id: chunk.id, heading: chunk.title, ordinal: chunk.chunk_number, content_sha256: digest(chunk.content) })) });
  }
  if (chunks.length !== 67 || new Set(chunks.map(row => row.id)).size !== chunks.length) throw new Error('Unexpected reviewed chunk inventory');
  return { sources, chunks, legacy: legacyCorpus.map(row => ({ chunk_id: row.chunk_id, source_id: row.source_id, md5_lf: md5(row.content), authority_level: row.authority_level })),
    derived: audit(pages).filter(row => row.classification !== 'publisher_text_match_normalized').map(row => row.chunk_id) };
}
const header = '-- UNEXECUTED PROPOSAL. Requires explicit approval. Never invoked by app/tests.\n';
export function makeSql(plan) {
  const newSources = ids(plan.sources), newChunks = ids(plan.chunks);
  const oldSources = [...new Set(plan.legacy.map(row => literal(row.source_id)))].join(', ');
  const derived = plan.derived.map(literal).join(', ');
  const oldGuard = `IF (SELECT count(*) FROM public.knowledge_sources WHERE id IN (${oldSources}) AND status = 'current') <> 2 THEN RAISE EXCEPTION 'Legacy source state changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_chunks WHERE source_id IN (${oldSources})) <> 7 THEN RAISE EXCEPTION 'Legacy inventory changed'; END IF;
IF EXISTS (SELECT 1 FROM jsonb_to_recordset(${payload(plan.legacy)}) AS expected(chunk_id uuid, source_id uuid, md5_lf text, authority_level text)
LEFT JOIN public.knowledge_chunks c ON c.id = expected.chunk_id
WHERE c.id IS NULL OR c.source_id <> expected.source_id OR md5(replace(c.content, E'\\r\\n', E'\\n')) <> expected.md5_lf OR c.authority_level IS DISTINCT FROM expected.authority_level)
THEN RAISE EXCEPTION 'Legacy content or labels changed'; END IF;`;
  const sourceType = 'id uuid,title text,organization text,source_type text,url text,description text,version text,effective_date date,last_verified_at timestamptz,chapter text,topic text,publication_date date,status text,domain text';
  const sourceMismatch = `SELECT 1 FROM jsonb_to_recordset(${payload(plan.sources)}) AS expected(${sourceType}) LEFT JOIN public.knowledge_sources s ON s.id = expected.id WHERE (to_jsonb(s) - 'created_at') IS DISTINCT FROM to_jsonb(expected)`;
  const newGuard = `IF EXISTS (${sourceMismatch}) THEN RAISE EXCEPTION 'Staged source metadata changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_sources WHERE id IN (${newSources}) AND status = 'staged_provenance_review') <> 9 THEN RAISE EXCEPTION 'Staged source state changed'; END IF;
IF (SELECT count(*) FROM public.knowledge_chunks WHERE source_id IN (${newSources})) <> 67 THEN RAISE EXCEPTION 'Staged chunk count changed'; END IF;
IF EXISTS (SELECT 1 FROM jsonb_to_recordset(${payload(plan.chunks.map(row => ({ id: row.id, source_id: row.source_id, md5_lf: md5(row.content), section: row.section, source_version: row.source_version, title: row.title, chunk_number: row.chunk_number })))}) AS expected(id uuid, source_id uuid, md5_lf text, section text, source_version text, title text, chunk_number integer)
LEFT JOIN public.knowledge_chunks c ON c.id = expected.id WHERE c.id IS NULL OR c.source_id <> expected.source_id OR c.section IS DISTINCT FROM expected.section OR c.source_version IS DISTINCT FROM expected.source_version OR c.title IS DISTINCT FROM expected.title OR c.chunk_number IS DISTINCT FROM expected.chunk_number OR c.page_number IS NOT NULL OR c.effective_date IS NOT NULL OR c.authority_level IS DISTINCT FROM 'authoritative' OR md5(replace(c.content, E'\\r\\n', E'\\n')) <> expected.md5_lf)
THEN RAISE EXCEPTION 'Staged content or metadata changed'; END IF;`;
  const load = `${header}-- Phase 1: load nine non-current sources and 67 exact publisher blocks; ordinary RPC remains unchanged.
BEGIN;
LOCK TABLE public.knowledge_sources, public.knowledge_chunks IN SHARE ROW EXCLUSIVE MODE;
DO $guard$ BEGIN
${oldGuard}
IF EXISTS (SELECT 1 FROM public.knowledge_sources WHERE id IN (${newSources})) OR EXISTS (SELECT 1 FROM public.knowledge_chunks WHERE id IN (${newChunks})) THEN RAISE EXCEPTION 'Proposal IDs already exist'; END IF;
END; $guard$;
INSERT INTO public.knowledge_sources (id,title,organization,source_type,url,description,version,effective_date,last_verified_at,chapter,topic,publication_date,status,domain)
SELECT * FROM jsonb_to_recordset(${payload(plan.sources)}) AS s(id uuid,title text,organization text,source_type text,url text,description text,version text,effective_date date,last_verified_at timestamptz,chapter text,topic text,publication_date date,status text,domain text);
INSERT INTO public.knowledge_chunks (id,source_id,title,content,section,page_number,chunk_number,source_version,effective_date,authority_level)
SELECT * FROM jsonb_to_recordset(${payload(plan.chunks)}) AS c(id uuid,source_id uuid,title text,content text,section text,page_number integer,chunk_number integer,source_version text,effective_date date,authority_level text);
COMMIT;
`;
  const activate = `${header}-- Phase 2: ONLY after exact staged corpus passes the review's activation gates.
BEGIN;
LOCK TABLE public.knowledge_sources, public.knowledge_chunks IN SHARE ROW EXCLUSIVE MODE;
DO $guard$ BEGIN
${oldGuard}
${newGuard}
END; $guard$;
UPDATE public.knowledge_chunks SET authority_level = 'derived' WHERE id IN (${derived});
UPDATE public.knowledge_sources SET status = 'superseded' WHERE id IN (${oldSources});
UPDATE public.knowledge_sources SET status = 'current' WHERE id IN (${newSources});
COMMIT;
`;
  const rollbackOldGuard = oldGuard.replace("status = 'current'", "status = 'superseded'").replace(payload(plan.legacy), payload(plan.legacy.map(row => ({ ...row, authority_level: plan.derived.includes(row.chunk_id) ? 'derived' : row.authority_level }))));
  const rollbackNewGuard = newGuard.replaceAll('staged_provenance_review', 'current');
  const rollback = `${header}-- Rollback of Phase 2 only; retains all inserted publisher records for review.
-- Abort on any content/metadata drift. Retain the staged rows; no records are deleted.
BEGIN;
LOCK TABLE public.knowledge_sources, public.knowledge_chunks IN SHARE ROW EXCLUSIVE MODE;
DO $guard$ BEGIN
${rollbackOldGuard}
${rollbackNewGuard}
IF (SELECT count(*) FROM public.knowledge_sources WHERE id IN (${newSources}) AND status = 'current') <> 9 OR (SELECT count(*) FROM public.knowledge_sources WHERE id IN (${oldSources}) AND status = 'superseded') <> 2 THEN RAISE EXCEPTION 'Unexpected rollback source state'; END IF;
IF (SELECT count(*) FROM public.knowledge_chunks WHERE id IN (${derived}) AND authority_level = 'derived') <> 6 THEN RAISE EXCEPTION 'Unexpected rollback labels'; END IF;
END; $guard$;
UPDATE public.knowledge_sources SET status = 'staged_provenance_review' WHERE id IN (${newSources});
UPDATE public.knowledge_sources SET status = 'current' WHERE id IN (${oldSources});
UPDATE public.knowledge_chunks SET authority_level = 'authoritative' WHERE id IN (${derived});
COMMIT;
`;
  const verify = status => `${header}-- SELECT-only verification; safe before/after the indicated phase.
WITH expected_sources AS (
 SELECT * FROM jsonb_to_recordset(${payload(plan.sources.map(source => ({ ...source, status })))}) AS s(${sourceType})
), expected_chunks AS (
 SELECT * FROM jsonb_to_recordset(${payload(plan.chunks)}) AS c(id uuid,source_id uuid,title text,content text,section text,page_number integer,chunk_number integer,source_version text,effective_date date,authority_level text)
)
SELECT json_build_object(
 'expected_status', ${literal(status)},
 'source_count', (SELECT count(*) FROM public.knowledge_sources WHERE id IN (${newSources})),
 'chunk_count', (SELECT count(*) FROM public.knowledge_chunks WHERE source_id IN (${newSources})),
 'source_mismatches', (SELECT count(*) FROM expected_sources e LEFT JOIN public.knowledge_sources s ON s.id=e.id WHERE (to_jsonb(s)-'created_at') IS DISTINCT FROM to_jsonb(e)),
 'chunk_mismatches', (SELECT count(*) FROM expected_chunks e LEFT JOIN public.knowledge_chunks c ON c.id=e.id WHERE (to_jsonb(c)-'created_at') IS DISTINCT FROM to_jsonb(e)),
 'legacy_sources', (SELECT json_agg(json_build_object('id',id,'status',status)) FROM public.knowledge_sources WHERE id IN (${oldSources})),
 'legacy_labels', (SELECT json_agg(json_build_object('id',id,'authority_level',authority_level)) FROM public.knowledge_chunks WHERE id IN (${ids(plan.legacy)})),
 'section_counts', (SELECT json_agg(r) FROM (SELECT section,count(*) AS chunks FROM public.knowledge_chunks WHERE source_id IN (${newSources}) GROUP BY section ORDER BY section) r)
) AS verification;
`;
  return { load, activate, rollback, verify_load: verify('staged_provenance_review'), verify_activate: verify('current') };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = resolve('docs/research/milestone-3');
  const capture = JSON.parse(await readFile(resolve(directory, 'publisher-capture.json'), 'utf8'));
  const plan = makePlan(capture.pages), sql = makeSql(plan);
  await writeFile(resolve(directory, 'corpus-plan.json'), JSON.stringify({ state: 'UNEXECUTED', sources: plan.sources.map(row => ({ id: row.id, section: row.topic, url: row.url })),
    chunks: plan.chunks.map(row => ({ id: row.id, source_id: row.source_id, section: row.section, title: row.title, content_sha256: digest(row.content) })), derived_chunk_ids: plan.derived }, null, 2) + '\n');
  for (const [name, value] of Object.entries(sql)) await writeFile(resolve(directory, `proposed-corpus-${name}.sql`), value);
  console.log(JSON.stringify({ sources: plan.sources.length, chunks: plan.chunks.length, corrected_labels: plan.derived.length, executed: false }));
}
