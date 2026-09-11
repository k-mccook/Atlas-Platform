// Read-only remote capture. This script writes only the local baseline JSON.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cases } from '../../tests/ask-atlas.cases.mjs';

const root = new URL('../../', import.meta.url);
const configuration = {};
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  // Intentionally do not use dotenv: only these two approved settings are parsed.
  const line = readFileSync(new URL('.env.local', root), 'utf8')
    .split(/\r?\n/).find((line) => line.startsWith(`${name}=`));
  if (!line) throw new Error(`Missing approved setting: ${name}`);
  configuration[name] = line.slice(name.length + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
}
const base = new URL(configuration.NEXT_PUBLIC_SUPABASE_URL);
if (base.protocol !== 'https:' || base.username || base.password) {
  throw new Error('Expected HTTPS Supabase URL without embedded credentials.');
}
const headers = {
  apikey: configuration.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${configuration.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};
const columns = {
  knowledge_sources: ['id', 'title', 'organization', 'source_type', 'url', 'domain', 'version', 'effective_date'],
  knowledge_chunks: ['id', 'source_id', 'section', 'title', 'authority_level', 'source_version', 'effective_date'],
};
const evidenceFields = [
  'chunk_id', 'source_id', 'source_title', 'organization', 'source_type',
  'source_url', 'domain', 'section', 'chunk_title', 'authority_level',
  'source_version', 'effective_date', 'rank',
];

async function get(path, extraHeaders = {}) {
  const allowed = ['/rest/v1/', '/rest/v1/knowledge_sources', '/rest/v1/knowledge_chunks', '/rest/v1/rpc/search_knowledge'];
  const url = new URL(path, base);
  if (url.origin !== base.origin || !allowed.includes(url.pathname)) throw new Error('Endpoint not allowlisted.');
  try {
    return await fetch(url, { method: 'GET', headers: { ...headers, ...extraHeaders }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  } catch {
    throw new Error('Read-only knowledge request failed; check network access.');
  }
}

async function readTable(table) {
  const rows = [];
  let total;
  for (let offset = 0; ; ) {
    const query = new URLSearchParams({ select: columns[table].join(','), order: 'id.asc', limit: '250', offset: String(offset) });
    const response = await get(`/rest/v1/${table}?${query}`, { Prefer: 'count=exact' });
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status}; response body withheld.`);
    const range = response.headers.get('content-range');
    const currentTotal = Number(range?.split('/')[1]);
    if (!Number.isSafeInteger(currentTotal) || currentTotal < 0) throw new Error('Exact visible row count unavailable.');
    if (total !== undefined && currentTotal !== total) throw new Error('Corpus count changed during capture; retry.');
    total = currentTotal;
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Expected metadata rows.');
    rows.push(...page.map((row) => Object.fromEntries(columns[table].map((key) => [key, row[key] ?? null]))));
    if (rows.length === total) break;
    if (!page.length || rows.length > total) throw new Error('Pagination/count mismatch.');
    offset += page.length;
  }
  if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error('Duplicate IDs during pagination.');
  return { visible_row_count: total, rows };
}

function audit(serialized) {
  for (const value of Object.values(configuration)) {
    if (value && serialized.includes(value)) throw new Error('Export rejected: configuration value found.');
  }
  if (serialized.includes(base.hostname)) throw new Error('Export rejected: project hostname found.');
  const suspicious = [
    /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    /\b(?:sb_secret_|sb_publishable_|sk-proj-|sk_live_)[A-Za-z0-9_-]+/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /postgres(?:ql)?:\/\//i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  ];
  if (suspicious.some((pattern) => pattern.test(serialized))) throw new Error('Export rejected by sensitive-data scan.');
}

async function main() {
  const started = new Date().toISOString();
  const discovery = await get('/rest/v1/', { Accept: 'application/openapi+json' });
  // Never persist a full discovery document: it could describe unrelated tables.
  await discovery.body?.cancel();
  const sources = await readTable('knowledge_sources');
  const chunks = await readTable('knowledge_chunks');
  const sourceById = new Map(sources.rows.map((source) => [source.id, source]));
  const groups = new Map();
  for (const chunk of chunks.rows) {
    const source = sourceById.get(chunk.source_id);
    const keyFields = {
      authority: source?.organization ?? null, source_id: chunk.source_id,
      source_title: source?.title ?? null, section: chunk.section,
      source_version: source?.version ?? null, chunk_source_version: chunk.source_version,
      source_effective_date: source?.effective_date ?? null, chunk_effective_date: chunk.effective_date,
      authority_level: chunk.authority_level,
    };
    const key = JSON.stringify(keyFields);
    const group = groups.get(key) ?? { ...keyFields, chunk_count: 0 };
    group.chunk_count += 1;
    groups.set(key, group);
  }
  const questions = [];
  for (const entry of cases) {
    const query = new URLSearchParams({ search_query: entry.question });
    const response = await get(`/rest/v1/rpc/search_knowledge?${query}`);
    if (!response.ok) throw new Error(`Search capture: HTTP ${response.status}; response body withheld.`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Expected search result rows.');
    questions.push({
      question: entry.question,
      expected_response: { topic: entry.topic, category: entry.category, primary_section: entry.section, authority: entry.authority, confidence: entry.confidence },
      returned_row_count: rows.length,
      // RPC returns content, but prose is discarded and never written or logged.
      retrieved_evidence: rows.map((row) => ({
        ...Object.fromEntries(evidenceFields.map((key) => [key, row[key] ?? null])),
        content_character_count: typeof row.content === 'string' ? row.content.length : null,
        content_sha256: typeof row.content === 'string' ? createHash('sha256').update(row.content).digest('hex') : null,
      })),
    });
  }
  const observedChunks = new Map();
  for (const question of questions) {
    for (const row of question.retrieved_evidence) {
      const { rank, ...metadata } = row;
      // A rank belongs to a query, not to a corpus record.
      void rank;
      const previous = observedChunks.get(row.chunk_id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(metadata)) throw new Error('Evidence changed across queries; retry capture.');
      observedChunks.set(row.chunk_id, metadata);
    }
  }
  const observedGroups = new Map();
  for (const row of observedChunks.values()) {
    const fields = {
      authority: row.organization, source_id: row.source_id, source_title: row.source_title,
      section: row.section, source_version: row.source_version,
      effective_date: row.effective_date, authority_level: row.authority_level,
    };
    const key = JSON.stringify(fields);
    const group = observedGroups.get(key) ?? { ...fields, observed_chunk_count: 0 };
    group.observed_chunk_count += 1;
    observedGroups.set(key, group);
  }
  const snapshot = {
    format_version: 1, capture_started_at: started, capture_finished_at: new Date().toISOString(),
    access: 'public anon key; GET only; RLS-visible data only',
    consistency: 'Separate HTTP requests, not a transactionally consistent snapshot; counts checked during pagination.',
    schema_discovery_http_status: discovery.status,
    schema_status: 'Exact DDL, function body, indexes, policies, grants, security mode and FTS configuration are NOT obtained by this capture.',
    observed_selectable_columns: columns,
    corpus: { sources, chunks, groups: [...groups.values()], chunks_without_visible_source: chunks.rows.filter((row) => !sourceById.has(row.source_id)).length },
    search_observed_inventory: {
      completeness: 'PARTIAL: union of eight query results only. Zero directly visible table rows does not establish that tables are empty. RPC may use a different security context or underlying relation; SQL is unavailable.',
      distinct_source_count: new Set([...observedChunks.values()].map((row) => row.source_id)).size,
      distinct_chunk_count: observedChunks.size,
      groups: [...observedGroups.values()],
    },
    regression_evidence: questions,
    evidence_scope: 'Raw RPC order/rank before application filtering. expected_response is the test contract, NOT an observed API response. Text is excluded; hashes do not validate truth or provenance.',
  };
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  audit(serialized);
  // Inspect every persisted URL: only public official guidance hosts are accepted.
  const officialDomains = ['fanniemae.com', 'freddiemac.com', 'hud.gov', 'va.gov', 'appraisalfoundation.org'];
  for (const urlText of [...sources.rows.map((row) => row.url), ...questions.flatMap((q) => q.retrieved_evidence.map((row) => row.source_url))].filter(Boolean)) {
    const url = new URL(urlText);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || !officialDomains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) {
      throw new Error('Export rejected: source URL needs manual sanitization/review.');
    }
  }
  const destination = new URL('docs/database/knowledge-baseline/snapshot.json', root);
  mkdirSync(new URL('.', destination), { recursive: true });
  writeFileSync(destination, serialized);
  console.log(JSON.stringify({ output: 'docs/database/knowledge-baseline/snapshot.json', visible_sources: sources.visible_row_count, visible_chunks: chunks.visible_row_count, inventory_groups: groups.size, questions: questions.length, schema_discovery_status: discovery.status, sensitive_data_scan: 'passed' }));
}

main().catch(() => {
  // Do not print remote error bodies, URLs, configuration or metadata on failure.
  console.error('Baseline capture failed safely. No new snapshot was written unless the final success summary appeared. Check access, count consistency and metadata sanitization.');
  process.exitCode = 1;
});
