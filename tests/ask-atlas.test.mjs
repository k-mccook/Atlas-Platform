import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compileFunction } from 'node:vm';
import { before, describe, test } from 'node:test';
import { authorities, cases } from './ask-atlas.cases.mjs';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
const ts = require('typescript');
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let POST;
let accessToken;
let userClient;

function loadRoute(clientFactory, environment = process.env) {
  const filename = fileURLToPath(new URL('../app/api/ask-atlas/route.ts', import.meta.url));
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const routeModule = { exports: {} };
  const routeRequire = createRequire(filename);
  const dependencies = (name) => name === '@supabase/supabase-js' && clientFactory
    ? { createClient: clientFactory } : routeRequire(name);
  compileFunction(compiled.outputText, ['require', 'module', 'exports', 'process'], { filename })(
    dependencies, routeModule, routeModule.exports, { env: environment },
  );
  return routeModule.exports.POST;
}

const syntheticToken = 'test.user.signature'; // Inert test input, never a real credential.
function request(authorization, body = JSON.stringify({ question: 'Fannie Mae adjustments' })) {
  return new Request('http://localhost/api/ask-atlas', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) }, body,
  });
}
function isolatedRoute(verification, throws = false) {
  const calls = { auth: 0, rpc: 0 };
  const handler = loadRoute((url, key, options) => {
    assert.equal(url, 'https://example.invalid');
    assert.equal(key, 'public-test-key');
    assert.ok(options.global.headers.Authorization === `Bearer ${syntheticToken}`, 'user token forwarded');
    assert.deepEqual(options.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    return {
      auth: { getUser: async (token) => {
        calls.auth++;
        assert.ok(token === syntheticToken, 'same token independently verified');
        if (throws) throw new Error('Authentication transport unavailable');
        return verification;
      } },
      rpc: async (name, params) => {
        calls.rpc++;
        assert.equal(calls.auth, 1, 'verification precedes retrieval');
        assert.equal(name, 'search_knowledge');
        assert.equal(params.search_query, 'Fannie Mae adjustments');
        return { data: [], error: null };
      },
    };
  }, { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key', SUPABASE_SERVICE_ROLE_KEY: 'must-not-be-used' });
  return { handler, calls };
}
const validUser = { data: { user: { id: 'test-user', role: 'authenticated', is_anonymous: false } }, error: null };

describe('Authentication security (isolated; no credentials or network)', () => {
  for (const header of [undefined, 'Basic test', 'Bearer', 'Bearer not-a-jwt', 'Bearer a.b.c extra', 'Bearer a.b.c, Bearer d.e.f']) {
    test(`rejects missing/malformed authorization: ${header ?? 'missing'}`, async () => {
      const { handler, calls } = isolatedRoute(validUser);
      assert.equal((await handler(request(header, '{'))).status, 401);
      assert.deepEqual(calls, { auth: 0, rpc: 0 });
    });
  }
  for (const status of [400, 401, 403, 422]) {
    test(`Supabase rejects credentials (${status}): 401, no retrieval`, async () => {
      const { handler, calls } = isolatedRoute({ data: { user: null }, error: { status, message: syntheticToken } });
      const response = await handler(request(`Bearer ${syntheticToken}`));
      assert.equal(response.status, 401);
      assert.ok(!(await response.text()).includes(syntheticToken));
      assert.deepEqual(calls, { auth: 1, rpc: 0 });
    });
  }
  for (const status of [undefined, 0, 429, 500, 503]) {
    test(`verification unavailable (${status}): 503, no retrieval`, async () => {
      const { handler, calls } = isolatedRoute({ data: { user: null }, error: { status, message: syntheticToken } });
      const response = await handler(request(`Bearer ${syntheticToken}`));
      assert.equal(response.status, 503);
      assert.ok(!(await response.text()).includes(syntheticToken));
      assert.deepEqual(calls, { auth: 1, rpc: 0 });
    });
  }
  test('thrown verification failure fails closed', async () => {
    const { handler, calls } = isolatedRoute(null, true);
    assert.equal((await handler(request(`Bearer ${syntheticToken}`))).status, 503);
    assert.equal(calls.rpc, 0);
  });
  for (const user of [null, { id: 'test-user', role: 'anon' }, { id: 'test-user', role: 'service_role' }, { id: 'test-user', role: 'authenticated', is_anonymous: true }]) {
    test(`requires a registered authenticated user: ${JSON.stringify(user)}`, async () => {
      const { handler, calls } = isolatedRoute({ data: { user }, error: null });
      assert.equal((await handler(request(`Bearer ${syntheticToken}`))).status, 401);
      assert.equal(calls.rpc, 0);
    });
  }
  for (const body of ['{', 'null', '{}', '{"question":42}', '{"question":"   "}']) {
    test(`authenticated invalid question remains 400: ${body}`, async () => {
      const { handler, calls } = isolatedRoute(validUser);
      assert.equal((await handler(request(`Bearer ${syntheticToken}`, body))).status, 400);
      assert.deepEqual(calls, { auth: 1, rpc: 0 });
    });
  }
  test('verified user reaches RPC with user credentials, never service role', async () => {
    const { handler, calls } = isolatedRoute(validUser);
    assert.equal((await handler(request(`Bearer ${syntheticToken}`))).status, 200);
    assert.deepEqual(calls, { auth: 1, rpc: 1 });
  });
});

describe('Authenticated live integration', () => {
before(async () => {
  // Match next dev environment loading without printing credentials.
  loadEnvConfig(projectRoot, true);
  assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL, 'Missing NEXT_PUBLIC_SUPABASE_URL; configure .env.local.');
  assert.ok(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Missing Supabase key; configure .env.local.',
  );
  assert.ok(process.env.ATLAS_TEST_EMAIL && process.env.ATLAS_TEST_PASSWORD,
    'Authenticated integration requires approved ATLAS_TEST_EMAIL and ATLAS_TEST_PASSWORD in ignored local configuration. No account is created by tests.');
  const { createClient } = require('@supabase/supabase-js');
  userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  let login;
  try {
    login = await userClient.auth.signInWithPassword({ email: process.env.ATLAS_TEST_EMAIL, password: process.env.ATLAS_TEST_PASSWORD });
  } catch { throw new Error('Test sign-in unavailable; details withheld.'); }
  assert.ok(!login.error && login.data.session && !login.data.user?.is_anonymous, 'Test sign-in failed; details withheld.');
  accessToken = login.data.session.access_token;
  POST = loadRoute();
  assert.equal(typeof POST, 'function', 'Route must export POST.');
});

for (const entry of cases) {
  test(`${entry.authority}: ${entry.question}`, { timeout: 45_000 }, async () => {
    const response = await POST(new Request('http://localhost/api/ask-atlas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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

test('authenticated direct RPC remains available', async () => {
  const { data, error } = await userClient.rpc('search_knowledge', { search_query: cases[0].question });
  assert.ok(!error && Array.isArray(data) && data.length > 0, 'Authenticated RPC must return evidence');
});
});

describe('Public access integration (no test account)', () => {
  let publicPOST;
  before(() => {
    loadEnvConfig(projectRoot, true);
    assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Public Supabase configuration required');
    publicPOST = loadRoute();
  });
test('live Supabase rejects a forged token and anon key as user authentication', { timeout: 45_000 }, async () => {
  for (const token of [syntheticToken, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY]) {
    assert.equal((await publicPOST(request(`Bearer ${token}`))).status, 401);
  }
});
test('direct anon RPC matches the explicitly selected rollout stage', { timeout: 45_000 }, async () => {
  const expected = process.env.ATLAS_TEST_RPC_ACCESS ?? 'post-revoke';
  assert.ok(['pre-revoke', 'post-revoke'].includes(expected), 'Invalid ATLAS_TEST_RPC_ACCESS');
  const { createClient } = require('@supabase/supabase-js');
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await anon.rpc('search_knowledge', { search_query: cases[0].question });
  if (expected === 'post-revoke') {
    assert.equal(error?.code, '42501', 'Anonymous RPC must fail with insufficient privilege');
    assert.equal(data, null);
  } else {
    assert.ok(!error && Array.isArray(data) && data.length > 0, 'Pre-revoke RPC still publicly executable');
  }
});
});
