import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { before, describe, test } from 'node:test';
import { authorities, cases } from './ask-atlas.cases.mjs';
import { loadTypescript } from './load-typescript.mjs';
import { evidence, factualChecks } from './fixtures/fannie-evidence.mjs';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let POST;
let accessToken;
let userClient;

function loadRoute(clientFactory, environment = process.env, runtime = {}) {
  const filename = fileURLToPath(new URL('../app/api/ask-atlas/route.ts', import.meta.url));
  return loadTypescript(filename, clientFactory ? { '@supabase/supabase-js': { createClient: clientFactory } } : {}, environment, runtime).POST;
}

const syntheticToken = 'test.user.signature'; // Inert test input, never a real credential.
function request(authorization, body = JSON.stringify({ question: 'Fannie Mae adjustments' })) {
  return new Request('http://localhost/api/ask-atlas', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) }, body,
  });
}
function isolatedRoute(verification, throws = false, options = {}) {
  const calls = { auth: 0, rpc: 0 };
  const handler = loadRoute((url, key, clientOptions) => {
    assert.equal(url, 'https://example.invalid');
    assert.equal(key, 'public-test-key');
    assert.ok(clientOptions.global.headers.Authorization === `Bearer ${syntheticToken}`, 'user token forwarded');
    assert.deepEqual(clientOptions.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    if (options.inspectFetch) options.inspectFetch(clientOptions.global.fetch);
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
        assert.equal(params.search_query, options.question ?? 'Fannie Mae adjustments');
        return options.rpcResult ?? { data: [], error: null };
      },
    };
  }, { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key', SUPABASE_SERVICE_ROLE_KEY: 'must-not-be-used' }, options.runtime);
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

describe('Gateway hardening (isolated; no credentials or network)', () => {
  function streamRequest(chunks, headers = {}) {
    return new Request('http://localhost/api/ask-atlas', {
      method: 'POST', duplex: 'half',
      headers: { Authorization: `Bearer ${syntheticToken}`, 'Content-Type': 'application/json', ...headers },
      body: new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }),
    });
  }
  const bytes = (text) => new TextEncoder().encode(text);
  for (const length of [2000, 2001]) {
    test(`question boundary ${length}`, async () => {
      const question = 'a'.repeat(length);
      const { handler, calls } = isolatedRoute(validUser, false, { question });
      const response = await handler(request(`Bearer ${syntheticToken}`, JSON.stringify({ question })));
      assert.equal(response.status, length === 2000 ? 200 : 400);
      assert.equal(calls.rpc, length === 2000 ? 1 : 0);
    });
  }
  for (const length of [16384, 16385]) {
    test(`streamed body byte boundary ${length} without Content-Length`, async () => {
      const base = JSON.stringify({ question: 'Fannie Mae adjustments' });
      const { handler, calls } = isolatedRoute(validUser);
      const response = await handler(streamRequest([bytes(base), bytes(' '.repeat(length - base.length))]));
      assert.equal(response.status, length === 16384 ? 200 : 400);
      assert.equal(calls.rpc, length === 16384 ? 1 : 0);
    });
  }
  test('actual streamed bytes override a false small Content-Length', async () => {
    const { handler, calls } = isolatedRoute(validUser);
    assert.equal((await handler(streamRequest([bytes(' '.repeat(16385))], { 'Content-Length': '1' }))).status, 400);
    assert.equal(calls.rpc, 0);
  });
  for (const headers of [{ 'Content-Length': '16385' }, { 'Content-Length': '-1' }, { 'Content-Length': 'abc' }, { 'Content-Type': 'text/plain' }, { 'Content-Encoding': 'gzip' }]) {
    test(`invalid body headers: ${JSON.stringify(headers)}`, async () => {
      const { handler, calls } = isolatedRoute(validUser);
      assert.equal((await handler(streamRequest([bytes('{"question":"Fannie Mae adjustments"}')], headers))).status, 400);
      assert.equal(calls.rpc, 0);
    });
  }
  for (const body of ['[]', '"text"', '{"question":null}', '{"question":true}', '{"question":{}}']) {
    test(`rejects invalid JSON shape: ${body}`, async () => {
      const { handler, calls } = isolatedRoute(validUser);
      assert.equal((await handler(request(`Bearer ${syntheticToken}`, body))).status, 400);
      assert.equal(calls.rpc, 0);
    });
  }
  test('trims outer whitespace without changing Unicode or internal whitespace', async () => {
    const question = 'Fannie Mae café\n  adjustments';
    const { handler } = isolatedRoute(validUser, false, { question });
    assert.equal((await handler(request(`Bearer ${syntheticToken}`, JSON.stringify({ question: ` \t${question}\r\n` })))).status, 200);
  });
  test('rejects invalid UTF-8', async () => {
    const { handler, calls } = isolatedRoute(validUser);
    assert.equal((await handler(streamRequest([new Uint8Array([0xff])]))).status, 400);
    assert.equal(calls.rpc, 0);
  });
  test('multibyte UTF-8 may cross chunk boundaries', async () => {
    const question = 'café'; const payload = bytes(JSON.stringify({ question }));
    const split = payload.indexOf(0xc3) + 1;
    const { handler } = isolatedRoute(validUser, false, { question });
    assert.equal((await handler(streamRequest([payload.slice(0, split), payload.slice(split)]))).status, 200);
  });
  test('oversized auth header is rejected before verification', async () => {
    const { handler, calls } = isolatedRoute(validUser);
    assert.equal((await handler(request(`Bearer ${'a'.repeat(8192)}.b.c`))).status, 401);
    assert.deepEqual(calls, { auth: 0, rpc: 0 });
  });
  test('body stream read errors return generic 400', async () => {
    const { handler, calls } = isolatedRoute(validUser);
    const body = new ReadableStream({ start(controller) { controller.error(new Error(syntheticToken)); } });
    const response = await handler(new Request('http://localhost/api/ask-atlas', { method: 'POST', duplex: 'half', headers: { Authorization: `Bearer ${syntheticToken}`, 'Content-Type': 'application/json' }, body }));
    assert.equal(response.status, 400); assert.equal(calls.rpc, 0);
    assert.ok(!(await response.text()).includes(syntheticToken));
  });
  test('slow body is cancelled at the total read deadline', { timeout: 8000 }, async () => {
    let cancelled = false;
    const body = new ReadableStream({ cancel() { cancelled = true; } });
    const { handler, calls } = isolatedRoute(validUser);
    const response = await handler(new Request('http://localhost/api/ask-atlas', { method: 'POST', duplex: 'half', headers: { Authorization: `Bearer ${syntheticToken}`, 'Content-Type': 'application/json' }, body }));
    assert.equal(response.status, 400); assert.equal(calls.rpc, 0); assert.ok(cancelled);
  });
  test('database errors never expose upstream details in response or logs', async () => {
    const logs = [];
    const { handler } = isolatedRoute(validUser, false, { rpcResult: { data: null, error: { message: syntheticToken } }, runtime: { console: { error: (...args) => logs.push(args) } } });
    const response = await handler(request(`Bearer ${syntheticToken}`));
    assert.equal(response.status, 500);
    assert.ok(!JSON.stringify(logs).includes(syntheticToken));
    assert.ok(!(await response.text()).includes(syntheticToken));
  });
  test('upstream transport uses deadline and rejects redirects; errors are sanitized', async () => {
    let transport;
    const { handler } = isolatedRoute(validUser, false, {
      inspectFetch: (value) => { transport = value; },
      runtime: { fetch: async (_input, init) => { assert.equal(init.redirect, 'error'); assert.ok(init.signal instanceof AbortSignal); throw new Error(syntheticToken); } },
    });
    await handler(request(`Bearer ${syntheticToken}`));
    const response = await transport('https://example.invalid/auth/v1/user');
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes(syntheticToken));
  });
});

loadEnvConfig(projectRoot, true);
const authDeferred = !process.env.ATLAS_TEST_EMAIL && !process.env.ATLAS_TEST_PASSWORD
  ? 'Deferred: no approved test-account credentials' : false;
describe('Authenticated live integration', () => {
before(async () => {
  if (authDeferred) return;
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
  test(`${entry.authority}: ${entry.question}`, { timeout: 45_000, skip: authDeferred }, async () => {
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
    for (const check of factualChecks[entry.topic] ?? []) assert.match(result.answer, check);
    for (const part of result.answer_parts) {
      const source = result.sources.find(source => source.chunk_id === part.chunk_id);
      assert.equal(source.content.slice(part.start, part.end), part.text);
    }
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

test('authenticated direct RPC remains available', { skip: authDeferred }, async () => {
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

describe('Evidence grounding', () => {
  for (const entry of cases) test(entry.topic + ' preserves facts and cites exact evidence', async () => {
    const { handler } = isolatedRoute(validUser, false, { question: entry.question, rpcResult: { data: evidence, error: null } });
    const response = await handler(request('Bearer ' + syntheticToken, JSON.stringify({ question: entry.question })));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.topic, entry.topic);
    assert.equal(result.category, entry.category);
    assert.equal(result.primary_section, entry.section);
    assert.equal(result.confidence, entry.confidence);
    for (const check of factualChecks[entry.topic]) assert.match(result.answer, check);
    assert.doesNotMatch(result.answer, /specific maximum mileage|face amount|face value/i);
    assert.ok(result.answer_parts.length > 0);
    for (const part of result.answer_parts) {
      const source = result.sources.find(source => source.chunk_id === part.chunk_id);
      assert.equal(source.content.slice(part.start, part.end), part.text);
      assert.ok(result.answer.includes(part.text));
    }
  });
});
