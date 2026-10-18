import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/discover/route.ts';
import { briefSchema, csvFor, exampleBrief, normalizeProspects, safeUrl } from '../lib/prospects.ts';
const sources = [{ title: 'Business contact', url: 'https://example.com/contact' }];
test('validates input and rejects unsafe source URLs', () => {
  assert.equal(briefSchema.safeParse({ ...exampleBrief, count: 500 }).success, false);
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('https://example.com'), 'https://example.com/');
});
test('drops unsupported profiles, deduplicates businesses, and withholds unsourced contacts', () => {
  const rows = normalizeProspects([
    { name: 'A', sourceIds: [7], email: 'madeup@example.com' },
    { name: 'B', sourceIds: [0], email: 'madeup@example.com', website: 'javascript:alert(1)' },
    { name: 'B', sourceIds: [0] },
    { name: 'C', sourceIds: [0], email: 'hello@example.com', contactSource: sources[0].url },
  ], sources, 6);
  assert.equal(rows.length, 2); assert.equal(rows[0].email, ''); assert.equal(rows[0].website, ''); assert.equal(rows[1].email, 'hello@example.com');
});
test('CSV neutralizes spreadsheet formulas and escapes quotes', () => {
  const rows = normalizeProspects([{ name: '=HYPERLINK("bad")', sourceIds: [0] }], sources, 3);
  assert.ok(csvFor(rows).includes('"\'=HYPERLINK(""bad"")"'));
});
test('API rejects malformed JSON and cross-origin requests before calling Gemini', async () => {
  const malformed = await POST(new Request('http://localhost/api/discover', { method: 'POST', body: 'nope' }));
  assert.equal(malformed.status, 400);
  const cross = await POST(new Request('http://localhost/api/discover', { method: 'POST', headers: { origin: 'https://evil.example' }, body: JSON.stringify(exampleBrief) }));
  assert.equal(cross.status, 403);
});
test('API requires a key when no server key is set', async () => {
  const old = process.env.GEMINI_API_KEY; delete process.env.GEMINI_API_KEY;
  try { assert.equal((await POST(new Request('http://localhost/api/discover', { method: 'POST', body: JSON.stringify(exampleBrief) }))).status, 401); }
  finally { if (old) process.env.GEMINI_API_KEY = old; }
});
test('two-pass research preserves sources and removes contacts absent from research', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++; assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-key');
    const content = calls === 1 ? 'Business B has a public contact page. hello@example.com' : JSON.stringify({ prospects: [{ name: 'Business B', sourceIds: [0], contactSource: sources[0].url, email: 'hello@example.com', phone: 'invented phone', fit: 'Strong' }] });
    return Response.json({ candidates: [{ content: { parts: [{ text: content }] }, ...(calls === 1 ? { groundingMetadata: { groundingChunks: [{ web: { uri: sources[0].url, title: sources[0].title } }] } } : {}) }] });
  };
  try {
    const response = await POST(new Request('http://localhost/api/discover', { method: 'POST', headers: { 'x-gemini-key': 'test-key' }, body: JSON.stringify(exampleBrief) }));
    const data = await response.json(); assert.equal(response.status, 200); assert.equal(calls, 2); assert.equal(data.prospects[0].email, 'hello@example.com'); assert.equal(data.prospects[0].phone, ''); assert.equal(data.sources.length, 1);
  } finally { globalThis.fetch = original; }
});
test('API refuses ungrounded results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: 'Unsupported guess' }] } }] });
  try { const response = await POST(new Request('http://localhost/api/discover', { method: 'POST', headers: { 'x-gemini-key': 'test-key' }, body: JSON.stringify(exampleBrief) })); assert.equal(response.status, 422); }
  finally { globalThis.fetch = original; }
});
test('quota failures do not leak upstream response details', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ sensitive: 'never return this' }, { status: 429 });
  try { const response = await POST(new Request('http://localhost/api/discover', { method: 'POST', headers: { 'x-gemini-key': 'test-key' }, body: JSON.stringify(exampleBrief) })); const body = await response.text(); assert.equal(response.status, 502); assert.ok(body.includes('quota')); assert.ok(!body.includes('sensitive')); }
  finally { globalThis.fetch = original; }
});


test('listing-backed pipeline discards invented contacts and keeps Gemma review separate from facts', async () => {
  const original = globalThis.fetch;
  const oldSerp = process.env.SERPAPI_API_KEY; const oldGemma = process.env.GEMMA_MODEL;
  process.env.SERPAPI_API_KEY = 'search-test'; process.env.GEMMA_MODEL = 'gemma-test';
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    if (String(url).includes('serpapi.com')) return Response.json({ local_results: [{ title: 'Business B', address: 'Galle', phone: '+94 123456789', website: 'https://example.com', type: 'Guesthouse' }] });
    const sent = JSON.parse(String(init?.body));
    const profile = { name: 'Business B', sourceIds: [0], email: 'invented@example.com', phone: 'made up', website: 'https://invented.example', fit: 'Strong' };
    let content;
    if (String(url).includes('gemma-test')) {
      const input = JSON.parse(sent.contents[0].parts[0].text.split('Brief and profiles: ')[1]);
      content = JSON.stringify({ reviews: [{ id: input.prospects[0].id, fit: 'Possible', opportunity: 'Discuss direct bookings', uncertainty: 'Budget and interest are unknown', phone: 'another invented phone' }] });
    } else content = JSON.stringify({ prospects: [profile, {name:'Hallucinated business',sourceIds:[0]}] });
    return Response.json({ candidates: [{ content: { parts: [{text:content}] } }] });
  };
  try {
    const response = await POST(new Request('http://localhost/api/discover', {method:'POST',headers:{'x-gemini-key':'test-key'},body:JSON.stringify(exampleBrief)}));
    const data = await response.json();
    assert.equal(response.status,200); assert.equal(calls,3); assert.equal(data.prospects.length,1);
    assert.equal(data.prospects[0].phone,'+94 123456789'); assert.equal(data.prospects[0].email,'');
    assert.equal(data.prospects[0].website,'https://example.com/'); assert.equal(data.prospects[0].fit,'Possible');
    assert.ok(!JSON.stringify(data).includes('search-test')); assert.ok(data.prospects[0].contactSource.startsWith('https://www.google.com/maps/'));
  } finally { globalThis.fetch=original; if(oldSerp) process.env.SERPAPI_API_KEY=oldSerp; else delete process.env.SERPAPI_API_KEY; if(oldGemma) process.env.GEMMA_MODEL=oldGemma; else delete process.env.GEMMA_MODEL; }
});
