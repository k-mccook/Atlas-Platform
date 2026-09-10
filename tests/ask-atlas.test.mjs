import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compileFunction } from 'node:vm';
import { before, test } from 'node:test';
import { authorities, cases } from './ask-atlas.cases.mjs';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
const ts = require('typescript');
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let POST;

before(() => {
  // Match next dev environment loading without printing credentials.
  loadEnvConfig(projectRoot, true);
  assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL, 'Missing NEXT_PUBLIC_SUPABASE_URL; configure .env.local.');
  assert.ok(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Missing Supabase key; configure .env.local.',
  );
  // Compile the actual route only in memory; dependencies and retrieval are real.
  const filename = fileURLToPath(new URL('../app/api/ask-atlas/route.ts', import.meta.url));
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const routeModule = { exports: {} };
  compileFunction(compiled.outputText, ['require', 'module', 'exports'], { filename })(
    createRequire(filename), routeModule, routeModule.exports,
  );
  POST = routeModule.exports.POST;
  assert.equal(typeof POST, 'function', 'Route must export POST.');
});

for (const entry of cases) {
  test(`${entry.authority}: ${entry.question}`, { timeout: 45_000 }, async () => {
    const response = await POST(new Request('http://localhost/api/ask-atlas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: entry.question }),
    }));
    const result = await response.json();
    assert.equal(response.status, 200, `API failed: ${result.error ?? 'unknown error'}`);
    assert.equal(result.topic, entry.topic, 'topic');
    assert.equal(result.category, entry.category, 'category');
    assert.equal(result.primary_section, entry.section, 'primary section');
    assert.equal(result.target_source, entry.authority, 'target authority');
    assert.equal(result.confidence, entry.confidence, 'confidence');
    assert.equal(typeof result.answer, 'string', 'answer must be text');
    assert.ok(result.answer.trim(), 'answer must not be empty');
    assert.doesNotMatch(result.answer, /did not find enough relevant authoritative guidance/i);
    assert.ok(Array.isArray(result.sources) && result.sources.length > 0, 'at least one source');
    const primary = result.sources[0];
    assert.equal(primary.organization, entry.authority, 'primary authority');
    assert.equal(primary.section, entry.section, 'primary source section');
    const authority = authorities[entry.authority];
    assert.ok(authority, 'add URL expectations for this authority');
    const url = new URL(primary.source_url);
    assert.equal(url.protocol, 'https:', 'official source must use HTTPS');
    assert.equal(url.hostname, authority.officialHostname, 'official source hostname');
    assert.equal(url.username + url.password, '', 'source URL must not contain credentials');
    assert.ok(
      url.pathname.toLowerCase().split('/').includes(entry.section.toLowerCase()),
      'official source URL must identify the expected section',
    );
  });
}
