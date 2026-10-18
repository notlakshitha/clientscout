'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Bookmark, Check, CheckCheck, ChevronRight, CircleHelp, Compass, Copy, Globe2, KeyRound, LoaderCircle, MapPin, Plus, Radar, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, X } from 'lucide-react';
import { csvFor, demoResult, exampleBrief, safeUrl, type Brief, type Prospect, type SearchResult, type Source } from '../lib/prospects';

type Saved = { prospect: Prospect; sources: Source[]; brief: Brief; savedAt: string };
type View = 'discover' | 'saved';
const presets = [
  { label: 'Web design', brief: exampleBrief },
  { label: 'Social media', brief: { ...exampleBrief, offer: 'I help independent restaurants grow with social media content and photography.', audience: 'Independent restaurants & cafés', location: 'Colombo, Sri Lanka' } },
  { label: 'B2B services', brief: { ...exampleBrief, offer: 'I provide bookkeeping and monthly financial reporting for small businesses.', audience: 'Small businesses & independent shops', location: 'London, United Kingdom' } },
];
function initials(name: string) { return name.split(' ').filter(w => w !== '&').slice(0, 2).map(w => w[0]).join(''); }
function savedKey(p: Prospect) { return `${p.demo ? 'demo' : 'live'}:${p.name.toLowerCase()}:${p.location.toLowerCase()}`; }

export default function Workspace() {
  const [view, setView] = useState<View>('discover');
  const [brief, setBrief] = useState<Brief>({ offer: '', audience: '', location: '', language: 'English', count: 6 });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [serverConfigured, setServerConfigured] = useState(false);
  const [settings, setSettings] = useState(false);
  const [help, setHelp] = useState(false);
  const [selected, setSelected] = useState<Saved | null>(null);
  const [draft, setDraft] = useState('');
  const [showResearch, setShowResearch] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const ready = Boolean(apiKey || serverConfigured);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('clientscout-saved-v1') || '[]');
      if (Array.isArray(raw)) setSaved(raw.filter(s => s?.prospect?.id && typeof s.prospect.name === 'string' && Array.isArray(s.sources) && s.brief));
      const storedBrief = localStorage.getItem('clientscout-brief-v1');
      if (storedBrief) { const b = JSON.parse(storedBrief); if (b.offer && b.audience && b.location) setBrief(b); }
    } catch { /* Storage may be unavailable. In-memory use still works. */ }
    setLoaded(true);
    if (new URLSearchParams(window.location.search).get('demo') === '1') { setBrief(exampleBrief); setResult(demoResult()); }
    fetch('/api/status').then(r => r.json()).then(d => setServerConfigured(d.configured)).catch(() => {});
    return () => abort.current?.abort();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem('clientscout-saved-v1', JSON.stringify(saved)); localStorage.setItem('clientscout-brief-v1', JSON.stringify(brief)); }
    catch { setToast('Browser storage is full or unavailable. Changes are kept for this session only.'); }
  }, [saved, brief, loaded]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (!busy) return; setElapsed(0); const t = setInterval(() => setElapsed(n => n + 1), 1000); return () => clearInterval(t); }, [busy]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSettings(false); setHelp(false); setSelected(null); } };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    if (!settings && !help && !selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, [tabindex="0"]') || []).filter(el => !el.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = focusable(); const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [settings, help, selected]);

  async function discover(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!ready) { setSettings(true); return; }
    setBusy(true); setView('discover'); setFilter('all'); setQuery('');
    const controller = new AbortController(); abort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch('/api/discover', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-gemini-key': apiKey } : {}) }, body: JSON.stringify(brief), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed. Please try again.');
      setResult(data); setShowResearch(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) { setError(controller.signal.aborted ? 'Search stopped. You can adjust your brief and try again.' : e instanceof Error ? e.message : 'Unable to search. Please retry.'); }
    finally { clearTimeout(timeout); setBusy(false); abort.current = null; }
  }
  function toggleSave(item: Saved) {
    const exists = saved.some(s => savedKey(s.prospect) === savedKey(item.prospect));
    setSaved(old => exists ? old.filter(s => savedKey(s.prospect) !== savedKey(item.prospect)) : [...old, item]);
    setToast(exists ? 'Removed from your saved leads' : 'Lead saved to this browser');
  }
  function openItem(item: Saved) { setSelected(item); setDraft(''); }
  function makeDraft() {
    if (!selected) return;
    setDraft(`Subject: An idea for ${selected.prospect.name}\n\nHi ${selected.prospect.name} team,\n\nI came across your business while researching ${selected.brief.audience.toLowerCase()} in ${selected.brief.location}.\n\n${selected.brief.offer}\n\nI wondered whether this might be useful for your team. Would you be open to a quick conversation?\n\nBest,\n[Your name]`);
  }
  async function copyDraft() { try { await navigator.clipboard.writeText(draft); setToast('Draft copied'); } catch { setToast('Copy is unavailable. Select and copy the draft text instead.'); } }
  const items: Saved[] = view === 'saved' ? saved : result?.prospects.map(prospect => ({ prospect, sources: result.sources, brief: result.brief, savedAt: result.searchedAt })) || [];
  const visible = items.filter(({ prospect: p }) => (filter !== 'strong' || p.fit === 'Strong') && (filter !== 'contact' || p.email || p.phone) && `${p.name} ${p.category} ${p.location}`.toLowerCase().includes(query.toLowerCase()));
  function exportCsv() {
    const blob = new Blob(['\ufeff' + csvFor(visible.map(i => i.prospect))], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `clientscout-${view}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setToast('CSV exported');
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="ClientScout home"><span className="brand-mark"><Radar size={23}/></span>clientscout<span className="brand-dot">.</span></a>
      <div className="workspace-label"><span className="workspace-avatar">Y</span><div>Your workspace<small>Personal workspace</small></div><span className="workspace-tag">FREE</span></div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Main navigation"><button className={view === 'discover' ? 'nav-item active' : 'nav-item'} onClick={() => setView('discover')}><Compass size={19}/>Discover clients<span className="nav-arrow">↗</span></button><button className={view === 'saved' ? 'nav-item active' : 'nav-item'} onClick={() => { setView('saved'); setFilter('all'); setQuery(''); }}><Bookmark size={18}/>Saved leads<span className="nav-count">{saved.length}</span></button></nav>
      <div className="sidebar-note"><span className="mini-stars">✧</span><h3>Your next client is<br/>out there.</h3><p>Let’s find the businesses that could use what you do.</p><div className="note-line"/></div>
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => setHelp(true)}><CircleHelp size={18}/>How it works</button><button className="nav-item" onClick={() => setSettings(true)}><Settings2 size={18}/>API settings<span className={ready ? 'status-dot connected' : 'status-dot'}/></button><div className="user-row"><span className="user-avatar">Y</span><div>Your workspace<small>Made for your next move</small></div></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={14}/><span>{view === 'discover' ? 'Discover clients' : 'Saved leads'}</span></div><button className="connection" onClick={() => setSettings(true)}><span className={ready ? 'status-dot connected' : 'status-dot'}/>{ready ? 'Gemini key ready' : 'Connect Gemini'}<ChevronRight size={13}/></button></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow"><span/>YOUR NEXT OPPORTUNITY STARTS HERE</div><h1>{view === 'discover' ? <>I find you <span>clients/customers.</span></> : <>Good leads.<br className="mobile-break"/> <span>Kept close.</span></>}</h1><p>{view === 'discover' ? 'Tell me what you do. I’ll find businesses that could use it.' : 'Your shortlist, ready for a thoughtful first conversation.'}</p></div><div className="heading-doodle" aria-hidden="true"><Target size={67} strokeWidth={1}/><span>✦</span></div></div>
        {view === 'discover' && <section className="discovery-layout">
          <form className="brief-card" onSubmit={discover}>
            <div className="card-heading"><div className="section-icon"><Sparkles size={18}/></div><div><h2>Let’s get to know your business</h2><p>A little context. A much better shortlist.</p></div><span className="step-pill">01 / DISCOVER</span></div>
            <fieldset disabled={busy}>
              <label className="field-label" htmlFor="offer">What do you offer?<span>Be as specific as you can</span></label>
              <textarea id="offer" required minLength={10} maxLength={1500} placeholder="e.g. I build websites with direct booking for boutique hotels and guesthouses…" value={brief.offer} onChange={e => setBrief({ ...brief, offer: e.target.value })}/>
              <div className="preset-row"><span>Try an example</span>{presets.map(p => <button type="button" key={p.label} onClick={() => setBrief(p.brief)}>{p.label}<ArrowUpRight size={11}/></button>)}</div>
              <div className="field-grid"><div><label className="field-label" htmlFor="audience">Who’s your ideal customer?</label><div className="input-wrap"><Target size={16}/><input id="audience" required minLength={2} maxLength={250} placeholder="e.g. Boutique hotels" value={brief.audience} onChange={e => setBrief({ ...brief, audience: e.target.value })}/></div></div><div><label className="field-label" htmlFor="location">Where should I look?</label><div className="input-wrap"><MapPin size={16}/><input id="location" required minLength={2} maxLength={200} placeholder="City, region, or country" value={brief.location} onChange={e => setBrief({ ...brief, location: e.target.value })}/></div></div></div>
              <div className="options-row"><div><Globe2 size={15}/><label htmlFor="language">Results in</label><select id="language" value={brief.language} onChange={e => setBrief({ ...brief, language: e.target.value as Brief['language'] })}>{['English', 'Sinhala', 'Tamil', 'Spanish', 'French'].map(l => <option key={l}>{l}</option>)}</select></div><div><SlidersHorizontal size={15}/><label htmlFor="count">Find up to</label><select id="count" value={brief.count} onChange={e => setBrief({ ...brief, count: +e.target.value })}>{[3, 6, 10, 15].map(n => <option key={n} value={n}>{n} prospects</option>)}</select></div></div>
            </fieldset>
            <div className="form-footer"><span><ShieldCheck size={15}/>Public sources. Clear reasons.</span><button className="primary" disabled={busy} type="submit">{busy ? <><LoaderCircle className="spin" size={17}/>Finding your clients</> : <>Find my clients<ArrowRight size={17}/></>}</button></div>
            {error && <div role="alert" className="error-box">{error}</div>}
            {busy && <div role="status" className="progress-box"><span><LoaderCircle className="spin" size={16}/>{elapsed < 12 ? 'Searching for businesses that fit your brief…' : elapsed < 35 ? 'Researching public sources and contact details…' : 'Research is still running. Larger searches can take up to two minutes.'}</span><button type="button" onClick={() => abort.current?.abort()}>Cancel</button></div>}
          </form>
          <aside className="how-card"><div className="how-top"><span className="how-tag">A LITTLE LESS GUESSWORK</span><Sparkles size={19}/></div><h2>Less searching.<br/>More connecting.</h2><p className="how-intro">Your offer, matched to real-world opportunities.</p><ol><li><span>01</span><div><h3>Tell me what you do</h3><p>Your service, your ideal customer, your corner of the world.</p></div></li><li><span>02</span><div><h3>I do the digging</h3><p>Gemini researches the web for businesses that could be a fit.</p></div></li><li><span>03</span><div><h3>You make the connection</h3><p>Review the evidence. Save a lead. Start a conversation.</p></div></li></ol><div className="powered"><span>✦</span> Research powered by Gemini</div></aside>
        </section>}
        <section className="results-section" ref={resultsRef}>
          <div className="results-heading"><div><h2>{view === 'saved' ? 'Your saved leads' : result ? 'Your next conversations' : 'A shortlist with a reason behind it'}{items.length > 0 && <span className="number-pill">{items.length}</span>}</h2><p>{view === 'saved' ? 'Saved on this browser. Export a copy to take them with you.' : result?.demo ? 'Demo preview · Fictional businesses, just to show you around.' : result ? `Researched ${new Date(result.searchedAt).toLocaleDateString()} · AI suggestions, ready for your review.` : 'Business details, evidence, and a way to start the conversation.'}</p></div>{items.length > 0 && <button className="secondary" onClick={exportCsv} disabled={!visible.length}><ArrowDownToLine size={15}/>Export CSV</button>}</div>
          {items.length > 0 && <div className="results-toolbar"><div className="tabs"><button onClick={() => setFilter('all')} className={filter === 'all' ? 'selected' : ''}>All prospects <span>{items.length}</span></button><button onClick={() => setFilter('strong')} className={filter === 'strong' ? 'selected' : ''}>Strong fit</button><button onClick={() => setFilter('contact')} className={filter === 'contact' ? 'selected' : ''}>With contact</button></div><div className="filter-input"><Search size={15}/><input aria-label="Filter prospects" placeholder="Filter businesses…" value={query} onChange={e => setQuery(e.target.value)}/></div></div>}
          {!items.length ? <div className="empty-state"><div className="empty-art" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="empty-center"><Radar size={28}/></div><span className="orbit-dot dot-one"/><span className="orbit-dot dot-two"/><span className="tiny-card"><Check size={13}/>A better fit</span></div><h3>{view === 'saved' ? 'Your shortlist starts with a good find.' : result ? 'No supported prospects found this time.' : 'Your next client could be closer than you think.'}</h3><p>{view === 'saved' ? 'Tap the bookmark on any prospect to keep it here.' : result ? 'Try a broader location or a different customer description.' : 'Fill in your brief above and let’s find a few good places to start.'}</p><button className="text-button" onClick={() => { if (view === 'saved') setView('discover'); else { setResult(demoResult()); setFilter('all'); setQuery(''); } }}>{view === 'saved' ? 'Discover clients' : 'Explore an example shortlist'}<ArrowRight size={15}/></button></div> : visible.length === 0 ? <div className="no-matches"><Search size={24}/><h3>No prospects match these filters</h3><button className="text-button" onClick={() => { setFilter('all'); setQuery(''); }}>Clear filters</button></div> : <div className="prospect-grid">{visible.map((item, index) => { const p = item.prospect; const isSaved = saved.some(s => savedKey(s.prospect) === savedKey(p)); return <article className="prospect-card" key={p.id}><div className="prospect-top"><span className={`business-avatar color-${index % 4}`}>{initials(p.name)}</span><span className={p.fit === 'Strong' ? 'fit-badge strong' : 'fit-badge'}><span/>{p.fit} fit</span><button aria-label={isSaved ? `Unsave ${p.name}` : `Save ${p.name}`} className={isSaved ? 'bookmark-button saved' : 'bookmark-button'} onClick={() => toggleSave(item)}><Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'}/></button></div><h3>{p.name}</h3><p className="business-category">{p.category}</p><p className="business-location"><MapPin size={13}/>{p.location}</p><div className="fit-reason"><span><Sparkles size={13}/>THE OPPORTUNITY</span><p>{p.opportunity}</p></div><div className="prospect-bottom"><span>{p.demo ? 'Illustrative example' : `${p.sourceIds.length} research source${p.sourceIds.length === 1 ? '' : 's'}`}</span><button onClick={() => openItem(item)}>View profile<ArrowUpRight size={14}/></button></div></article>; })}</div>}
          {view === 'discover' && result && !result.demo && <div className="research-panel"><button className="text-button" onClick={() => setShowResearch(!showResearch)}>{showResearch ? 'Hide' : 'View'} original research & sources<ChevronRight size={15}/></button>{showResearch && <div><pre>{result.research}</pre><div className="source-list">{result.sources.map((s, i) => <a key={i} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer">[{i + 1}] {s.title}<ArrowUpRight size={13}/></a>)}</div></div>}{result.searchWidget && <iframe title="Google Search suggestions" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={result.searchWidget} className="search-widget"/>}</div>}
        </section>
        <footer className="page-footer"><span><Radar size={14}/>A little research. A real opportunity.</span><span>Built for independent businesses.</span></footer>
      </main>
    </div>
    {toast && <div className="toast" role="status"><CheckCheck size={17}/>{toast}</div>}
    {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="modal" onClick={e => e.stopPropagation()}><button className="close-button" aria-label="Close API settings" onClick={() => setSettings(false)}><X size={20}/></button><div className="modal-icon"><KeyRound size={24}/></div><h2 id="settings-title">Connect your Gemini</h2><p>Use your Gemini API key for live web research. It’s kept in memory for this tab and sent through this app’s server to Google. It isn’t saved in browser storage.</p><form onSubmit={e => { e.preventDefault(); setApiKey(keyDraft.trim()); setKeyDraft(''); setSettings(false); setToast('Key added for this session. Run a search to check the connection.'); }}><label className="field-label" htmlFor="api-key">Gemini API key</label><input className="full-input" id="api-key" autoFocus type="password" autoComplete="off" required minLength={15} maxLength={500} placeholder="Paste your API key" value={keyDraft} onChange={e => setKeyDraft(e.target.value)}/><p className="key-note">Google may charge for model and Search grounding usage. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Get a key in Google AI Studio ↗</a></p><button className="primary full-width" type="submit">Use this key<ArrowRight size={16}/></button></form>{apiKey && <button className="text-button danger" onClick={() => { setApiKey(''); setSettings(false); setToast('Session key removed'); }}>Disconnect session key</button>}{serverConfigured && <p className="server-note"><Check size={14}/>A server API key is already configured.</p>}</section></div>}
    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}><section role="dialog" aria-modal="true" aria-labelledby="help-title" className="modal" onClick={e => e.stopPropagation()}><button className="close-button" aria-label="Close help" onClick={() => setHelp(false)}><X size={20}/></button><div className="modal-icon"><Compass size={25}/></div><h2 id="help-title">From an offer to an opportunity.</h2><p>Describe what you sell, who benefits, and where to look. Live search finds public business listings. Gemini structures the profiles, and the configured open model reviews their relevance.</p><div className="help-step"><strong>1. Research with context</strong><p>Specific offers and locations produce a more useful shortlist.</p></div><div className="help-step"><strong>2. Review before reaching out</strong><p>Fit is an AI assessment, not confirmed buying intent. Sources may be incomplete or outdated. Contact deliverability isn’t verified.</p></div><div className="help-step"><strong>3. Keep the best prospects</strong><p>Save leads locally, export CSV, or prepare an editable outreach template. Nothing is sent automatically.</p></div><button className="primary full-width" onClick={() => setHelp(false)}>Let’s find some clients<ArrowRight size={16}/></button></section></div>}
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside role="dialog" aria-modal="true" aria-labelledby="profile-title" className="profile-drawer" onClick={e => e.stopPropagation()}><div className="drawer-top"><span>PROSPECT PROFILE</span><button aria-label="Close profile" onClick={() => setSelected(null)}><X size={21}/></button></div><div className="business-avatar large color-0">{initials(selected.prospect.name)}</div><h2 id="profile-title">{selected.prospect.name}</h2><p className="business-location"><MapPin size={14}/>{selected.prospect.location}</p><span className="fit-badge strong">{selected.prospect.fit} fit · {selected.prospect.demo ? 'Demo' : 'AI assessment'}</span><section className="profile-section"><h3>What the research says</h3><p>{selected.prospect.evidence}</p></section><section className="profile-section opportunity"><h3><Sparkles size={15}/>Your opening</h3><p>{selected.prospect.opportunity}</p></section><section className="profile-section"><h3>Business contact details</h3>{safeUrl(selected.prospect.website) && <a className="contact-line" href={safeUrl(selected.prospect.website)} target="_blank" rel="noopener noreferrer"><Globe2 size={16}/>Visit website<ArrowUpRight size={14}/></a>}{selected.prospect.email && <p className="contact-line">{selected.prospect.email}</p>}{selected.prospect.phone && <p className="contact-line">{selected.prospect.phone}</p>}{!selected.prospect.email && !selected.prospect.phone && <p className="muted">No supported email or phone found. Check the business’s official contact page.</p>}{safeUrl(selected.prospect.contactSource) && <a href={safeUrl(selected.prospect.contactSource)} target="_blank" rel="noopener noreferrer" className="source-link">Contact source ↗</a>}</section><section className="profile-section"><h3>Still worth checking</h3><p>{selected.prospect.uncertainty}</p></section>{selected.prospect.sourceIds.length > 0 && <section className="profile-section"><h3>Research sources</h3><div className="source-list">{selected.prospect.sourceIds.map(i => selected.sources[i] && <a key={i} href={safeUrl(selected.sources[i].url)} target="_blank" rel="noopener noreferrer">{selected.sources[i].title}<ArrowUpRight size={14}/></a>)}</div></section>}<div className="drawer-actions"><button className="primary" onClick={() => toggleSave(selected)}><Bookmark size={16}/>{saved.some(s => savedKey(s.prospect) === savedKey(selected.prospect)) ? 'Remove saved lead' : 'Save lead'}</button><button className="secondary" onClick={makeDraft}>Prepare outreach<ArrowRight size={15}/></button></div>{draft && <section className="profile-section"><h3>Your outreach template</h3><p className="muted">Edit this template before sending. Nothing is sent by ClientScout.</p><textarea aria-label="Outreach draft" className="draft-area" value={draft} onChange={e => setDraft(e.target.value)}/><button className="secondary" onClick={copyDraft}><Copy size={15}/>Copy draft</button></section>}</aside></div>}
  </div>;
}


