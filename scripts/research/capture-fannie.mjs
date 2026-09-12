import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { sections } from './fannie-sections.mjs';

export const digest = text => createHash('sha256').update(text).digest('hex');
export function textContent(html) {
  const entities = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', bull: '•' };
  return html.replace(/<(script|style)\b[^>]*>[^]*?<\/\1>/gi, '')
    .replace(/<\/(p|li|tr|h[1-6])\s*>/gi, '\n\n').replace(/<\/(td|th)\s*>/gi, ' | ')
    .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, name) => name[0] === '#'
      ? String.fromCodePoint(parseInt(name.slice(name[1] === 'x' ? 2 : 1), name[1] === 'x' ? 16 : 10)) : entities[name] ?? whole)
    .split(/\n\s*\n/).map(block => block.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
}

// Balanced div scanning retains nested lists/tables; reject changed publisher structure.
function innerDiv(html, start) {
  const tags = /<\/?div\b[^>]*>/gi; tags.lastIndex = start;
  let depth = 0, begin;
  for (let tag; (tag = tags.exec(html));) {
    if (!tag[0].startsWith('</')) { depth++; if (depth === 1) begin = tags.lastIndex; }
    else if (--depth === 0) return html.slice(begin, tag.index);
  }
  throw new Error('Publisher HTML has an unclosed section');
}
export function extractPage(html, expected) {
  const title = textContent(html.match(/<h1\b[^>]*>([^]*?)<\/h1>/i)?.[1] ?? '');
  if (!title.startsWith(expected.section + ',')) throw new Error('Publisher section/title mismatch');
  const date = title.match(/\((\d{2})\/(\d{2})\/(\d{4})\)$/);
  if (!date) throw new Error('Publisher section revision date unavailable');
  const blocks = [];
  for (const match of html.matchAll(/<div\b[^>]*class="[^"]*paragraph--type--policy-statement[^"]*"[^>]*>/gi)) {
    const block = innerDiv(html, match.index);
    const heading = textContent(block.match(/<h4\b[^>]*>([^]*?)<\/h4>/i)?.[1] ?? '');
    const body = block.search(/<div\b[^>]*class="body-field"/i);
    if (!heading || body < 0) throw new Error('Publisher subsection cannot be extracted');
    const content = textContent(innerDiv(block, body));
    if (!content || /&[a-z]+;/i.test(content)) throw new Error('Unresolved publisher text');
    blocks.push({ heading, content, sha256: digest(content) });
  }
  if (!blocks.length) throw new Error('No publisher policy blocks');
  return { authority: 'Fannie Mae', source_family: 'Selling Guide', section: expected.section,
    title, official_url: expected.url, section_revision_date: `${date[3]}-${date[1]}-${date[2]}`,
    effective_date: null, date_note: 'Page heading date is a section revision date, not a verified rule-effective date.',
    verified_at: new Date().toISOString(), material_type: 'publisher_capture', html_sha256: digest(html), blocks };
}

export async function capture(destination) {
  const pages = [];
  for (const entry of sections) {
    const url = new URL(entry.url);
    if (url.origin !== 'https://selling-guide.fanniemae.com' || url.username || url.password) throw new Error('Unapproved publisher');
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Publisher fetch failed for ${entry.section}`);
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error('Publisher page exceeds capture limit');
    pages.push(extractPage(html, entry));
  }
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'publisher-capture.json'), JSON.stringify({ state: 'LOCAL REVIEW ONLY — NOT INGESTED', pages }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ pages: pages.length, blocks: pages.reduce((n, page) => n + page.blocks.length, 0), destination }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const destination = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../../docs/research/milestone-3/', import.meta.url));
  await capture(destination);
}
