# ClientScout

**I find you clients/customers.**

A Next.js App Router application with TypeScript, React, and the Gemini API. Google Search grounding discovers businesses; a second Gemini call extracts structured profiles while retaining original research and source links. Styling uses plain CSS.

## Run locally

Requires Node.js 22.13+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Connect a Gemini API key in **API settings**, or copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`. Session keys stay in memory, are sent through the Next.js server to Google, and disappear on refresh. They are not written to browser storage. Google model and Search grounding usage may incur charges.

`GEMINI_MODEL` optionally overrides the default `gemini-3.8-flash`. Secrets are server-only. Never prefix them with `NEXT_PUBLIC_`.

## Features

- Offer, audience, location, language, and result-count brief.
- Gemini research with Google Search grounding and source links.
- Separate JSON extraction, no invented fallback results.
- Qualitative fit, observed evidence, suggested opportunity, and uncertainties.
- Public business contacts with source references; unknown details left blank.
- Browser-local saved leads, filters, and spreadsheet-safe CSV export.
- Editable English outreach templates and clipboard copy; no automatic sending.
- Clearly labeled fictional demo, plus original live research and Google Search suggestions.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

API tests use mocked Gemini responses. Live verification requires a valid key and quota. Sources and copied contacts are model-grounded, not independently fetched or email-deliverability verified. Inspect source pages before outreach. Saved leads and the last brief are local to this browser; export CSV for backup.

## Deployment

This is a standard Next.js app, compatible with a Node.js host or Vercel. Use `npm run build` followed by `npm start` for a local production server. Before exposing a shared server API key publicly, add authentication and durable per-user quotas. The development server binds to localhost.

## Challenge status

Gemini is proprietary. This version alone does not fulfill the challenge requirement for open-source AI at the core. Integrate an actual open-weight matching model or an open-source AI workflow before claiming that requirement.

## Structure

- `app/workspace.tsx`: workspace and interactions.
- `app/api/discover/route.ts`: server-side Gemini research pipeline.
- `lib/prospects.ts`: validation, normalization, safe URLs, CSV, demo data.
- `tests/discover.test.ts`: grounding, provenance, validation, failure handling.

API documentation: https://ai.google.dev/gemini-api/docs/generate-content/google-search
