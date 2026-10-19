'use client';

import { useState } from 'react';
import { ArrowRight, MapPin, Target } from 'lucide-react';

const examples = [
  { label: 'Web design', offer: 'I build direct-booking websites for independent guesthouses.', audience: 'Guesthouses & boutique hotels', location: 'Galle, Sri Lanka' },
  { label: 'Photography', offer: 'I shoot food and menu photography for independent cafés.', audience: 'Independent cafés & restaurants', location: 'Colombo, Sri Lanka' },
  { label: 'Bookkeeping', offer: 'I handle monthly bookkeeping for small independent businesses.', audience: 'Independent shops', location: 'London, United Kingdom' },
];

export default function StartSearch() {
  const [brief, setBrief] = useState(examples[0]);
  return <form className="start-form" action="/app" method="get">
    <div className="start-form-heading"><span className="section-kicker">START WITH WHAT YOU DO</span><span className="step-counter">01 / 03</span></div>
    <div className="service-examples" aria-label="Example services">{examples.map(example => <button key={example.label} type="button" aria-pressed={brief.label === example.label} onClick={() => setBrief(example)}>{example.label}</button>)}</div>
    <label htmlFor="start-offer">What do you offer?</label>
    <textarea id="start-offer" name="offer" required minLength={10} maxLength={1500} value={brief.offer} onChange={e => setBrief({ ...brief, label: '', offer: e.target.value })}/>
    <div className="start-fields"><div><label htmlFor="start-audience">Who would you like to help?</label><div className="start-input"><Target size={17}/><input id="start-audience" name="audience" required minLength={2} maxLength={250} value={brief.audience} onChange={e => setBrief({ ...brief, audience: e.target.value })}/></div></div><div><label htmlFor="start-location">Where?</label><div className="start-input"><MapPin size={17}/><input id="start-location" name="location" required minLength={2} maxLength={200} value={brief.location} onChange={e => setBrief({ ...brief, location: e.target.value })}/></div></div></div>
    <button className="button-accent" type="submit">Build my shortlist <ArrowRight size={18}/></button>
    <p className="start-note">Review your brief in the workspace before searching.</p>
  </form>;
}
