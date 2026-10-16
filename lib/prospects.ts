import { z } from 'zod';
export const briefSchema = z.object({
  offer: z.string().trim().min(10, 'Describe your offer in at least 10 characters.').max(1500),
  audience: z.string().trim().min(2, 'Enter your ideal customer.').max(250),
  location: z.string().trim().min(2, 'Enter a city or region.').max(200),
  language: z.enum(['English', 'Sinhala', 'Tamil', 'Spanish', 'French']).default('English'),
  count: z.number().int().min(3).max(15).default(6),
});
export type Brief = z.infer<typeof briefSchema>;
export type Prospect = { id: string; name: string; category: string; location: string; website: string; email: string; phone: string; contactSource: string; fit: 'Strong' | 'Possible'; evidence: string; opportunity: string; uncertainty: string; sourceIds: number[]; demo?: boolean };
export type Source = { title: string; url: string };
export type SearchResult = { prospects: Prospect[]; sources: Source[]; research: string; searchWidget: string; searchedAt: string; brief: Brief; demo?: boolean };
export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch { return ''; }
}
export function normalizeProspects(raw: unknown, sources: Source[], limit: number): Prospect[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const s = (v: unknown) => typeof v === 'string' ? v.trim().slice(0, 2500) : '';
  return raw.flatMap((item): Prospect[] => {
    if (!item || typeof item !== 'object') return [];
    const name = s(item.name);
    const sourceIds: number[] = Array.isArray(item.sourceIds) ? [...new Set<number>(item.sourceIds.filter((n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < sources.length))] : [];
    const identity = name.toLowerCase();
    if (!name || !sourceIds.length || seen.has(identity)) return [];
    seen.add(identity);
    const contactSource = sourceIds.map(i => sources[i].url).includes(safeUrl(item.contactSource)) ? safeUrl(item.contactSource) : '';
    const email = contactSource && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(item.email)) ? s(item.email) : '';
    return [{ id: crypto.randomUUID(), name, category: s(item.category), location: s(item.location), website: safeUrl(item.website), email,
      phone: contactSource ? s(item.phone) : '', contactSource, fit: item.fit === 'Strong' ? 'Strong' : 'Possible',
      evidence: s(item.evidence), opportunity: s(item.opportunity), uncertainty: s(item.uncertainty) || 'Buying intent and budget are unknown.', sourceIds }];
  }).slice(0, limit);
}
export function csvFor(prospects: Prospect[]) {
  const cell = (v: string) => '"' + (/^[\s]*[=+\-@]/.test(v) ? "'" + v : v).replaceAll('"', '""') + '"';
  return [['Business', 'Category', 'Location', 'Website', 'Email', 'Phone', 'Fit', 'Evidence', 'Opportunity', 'Unknown', 'Contact source', 'Demo'],
    ...prospects.map(p => [p.name, p.category, p.location, p.website, p.email, p.phone, p.fit, p.evidence, p.opportunity, p.uncertainty, p.contactSource, p.demo ? 'Yes' : 'No'])]
    .map(row => row.map(cell).join(',')).join('\r\n');
}
export const exampleBrief: Brief = { offer: 'I build beautiful websites with direct booking for independent hotels and guesthouses.', audience: 'Boutique hotels & guesthouses', location: 'Galle, Sri Lanka', language: 'English', count: 6 };
export function demoResult(): SearchResult {
  const names = ['Palm & Post Guesthouse', 'The Courtyard Stay', 'Saltwater House', 'Fort Lane Rooms', 'Mango Grove Retreat', 'The Southern Nest'];
  return { brief: exampleBrief, demo: true, searchedAt: new Date().toISOString(), sources: [], searchWidget: '', research: 'These are fictional businesses created to demonstrate the interface. Run a live search to discover real prospects.',
    prospects: names.map((name, i) => ({ id: `demo-${i}`, name, category: i % 2 ? 'Boutique hotel' : 'Guesthouse', location: ['Galle Fort', 'Unawatuna', 'Galle'][i % 3] + ', Sri Lanka', website: '', email: '', phone: '', contactSource: '', fit: i < 4 ? 'Strong' : 'Possible',
      evidence: ['Example signal: bookings are handled through phone enquiries.', 'Example signal: a small property markets stays through social media.', 'Example signal: guests are directed to third-party booking platforms.'][i % 3],
      opportunity: ['Offer a simple direct-booking website with a room gallery.', 'Bring room details and enquiries together on a dedicated website.', 'Pitch a mobile-friendly website with a direct enquiry form.'][i % 3], uncertainty: 'Fictional example. No business or contact details have been verified.', sourceIds: [], demo: true })) };
}
