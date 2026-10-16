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

