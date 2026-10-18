import { safeUrl, type Brief, type Source } from './prospects.ts';

/** Only structured public listing fields leave the search provider. Never forward its API URLs. */
export async function searchListings(brief: Brief, signal: AbortSignal) {
  const query = new URLSearchParams({ engine: 'google_maps', type: 'search', q: `${brief.audience} in ${brief.location}`, hl: 'en', api_key: process.env.SERPAPI_API_KEY! });
  const response = await fetch(`https://serpapi.com/search.json?${query}`, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Business search is unavailable. Please try again later.');
  const data = await response.json();
  if (data.error) throw new Error('Business search could not complete. Check the server search quota.');
  const sources: Source[] = [];
  const rows: Record<string, unknown>[] = Array.isArray(data.local_results) ? data.local_results : [];
  const listings = rows.slice(0, Math.min(20, brief.count * 2)).flatMap((row) => {
    if (typeof row.title !== 'string' || !row.title) return [];
    const maps = new URLSearchParams({ api: '1', query: `${row.title} ${typeof row.address === 'string' ? row.address : brief.location}` });
    if (typeof row.place_id === 'string') maps.set('query_place_id', row.place_id);
    const source = { title: `${row.title} · Google Maps listing`, url: `https://www.google.com/maps/search/?${maps}` };
    const index = sources.push(source) - 1;
    return [{ name: row.title, category: typeof row.type === 'string' ? row.type : '', address: typeof row.address === 'string' ? row.address : '', website: safeUrl(row.website), phone: typeof row.phone === 'string' ? row.phone : '', description: typeof row.description === 'string' ? row.description : '', sourceIndex: index, contactSource: source.url }];
  });
  if (!listings.length) throw new Error('No public business listings were found. Try a broader audience or a nearby city.');
  return { sources, listings, text: JSON.stringify(listings, null, 2) };
}
