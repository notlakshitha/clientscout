// A small single-instance demo allowance. Provider-side quotas remain the hard spending limit.
let windowStart = Date.now();
let used = 0;
let active = 0;
export function reserveSearch() {
  if (Date.now() - windowStart > 86_400_000) { windowStart = Date.now(); used = 0; }
  const limit = Number(process.env.SEARCH_DAILY_LIMIT || 20);
  if (used >= limit) return { error: 'The shared demo allowance is used up for today. You can still explore the example shortlist.', release: () => {} };
  if (active >= 2) return { error: 'Two searches are already running. Please try again in a moment.', release: () => {} };
  used++; active++;
  let released = false;
  return { error: '', release: () => { if (!released) { active--; released = true; } } };
}
