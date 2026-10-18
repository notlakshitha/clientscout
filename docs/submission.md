*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).*

Building something and finding someone who needs it are two different problems.

You can make websites, edit videos, or handle a small business's bookkeeping. But you still need somewhere to start looking for the next client. A search result gives you names. It doesn't explain which ones might make sense for what you do.

So I built ClientScout. The pitch is pretty simple: **I find you clients. You do your thing.**

The actual promise is a bit smaller than that. It finds potential clients, shows why they might fit, and leaves the decision to you.

## What I Built

ClientScout is a web app for freelancers and small agencies who sell to other businesses.

You tell it what you offer, who you want to help, and where to look. For example:

> I build direct-booking websites for small guesthouses in Galle, Sri Lanka.

It searches public business listings and turns them into profiles with the business name, location, website and public phone number when available. Each profile includes observed evidence, a suggested opening, the source, and things you still need to check.

That last part matters. A guesthouse being listed online doesn't mean it needs a website. It doesn't mean the owner has a budget. I wanted the app to help someone prepare a conversation without pretending the conversation has already happened.

You can save a prospect, export the shortlist as a CSV, or prepare an introduction and edit it before copying. ClientScout doesn't send messages for you.

The person I'd want to make this useful for is a freelancer who needs a handful of relevant businesses to approach, rather than a huge contact database. That is the part I think someone might pay for: less time spent on the research before outreach. I haven't validated that with a paying customer yet.

## Demo

[Try ClientScout](https://clientscout-akrc.onrender.com)

The **Take a look first** button opens a fictional example so you can explore the workspace without spending API quota. Those businesses are clearly labelled as demo data.

For a real search, open the workspace and describe your offer, audience, and location. Review a profile, check its sources, then save or export the ones worth keeping.

The hosted demo has a small shared search allowance. It's on Render's free service, so the first request after a quiet period can take a little longer.

## Code

{% github notlakshitha/clientscout %}

[Source and setup instructions](https://github.com/notlakshitha/clientscout)

The application code is MIT licensed. You'll need your own provider keys if you run a copy.

## How I Built It

It's a Next.js App Router app with TypeScript and plain CSS. The landing page takes its visual direction from the Axisform template: dark background, orange accents, big type, and layered cards. I rebuilt that direction as React components and gave the workspace the same palette.

The live research has three stages.

**SerpApi finds the businesses.** It searches Google Maps using the requested audience and place. I keep the useful listing fields and build source references, rather than forwarding the provider's raw response.

**Gemini structures the profiles.** It reads the listings alongside the offer and proposes relevant profiles. The server then matches each result back to an exact business listing. Names that don't match are dropped. Phone numbers and websites come from the listing, not from the model's proposed contact fields. This path doesn't collect emails, so there isn't a guessed email address filling the gap.

**Gemma reviews the fit.** The deployed app uses `gemma-4-26b-a4b-it`, served through Google's API. It assesses the relevance of each business, suggests a tentative opening, and explains what remains unknown. It can change that assessment; it cannot rewrite the business's factual contact details.

During testing, the 31B endpoint passed a tiny prompt but failed on the full review. I switched to the 26B model and tested the complete search again. A live Galle search returned three guesthouses with listing phone numbers and source links. That checks that the pipeline works, not that those businesses want to buy a website.

I also added tests that deliberately give the model invented contacts and an invented business. The result has to keep the listing's phone number, discard the invented email, and drop the unmatched business.

Saved prospects stay in browser storage for now. There's no account system or database. API keys stay on the server, and the public demo limits concurrent searches and total searches per process. Those in-memory counters reset on restart, so they're not a replacement for provider spending limits.

## Why Does Open Innovation Matter?

The open-weight piece here is Gemma, and its job is the actual relevance review. It's enabled in the hosted app; a failed review produces an error rather than silently returning an unreviewed shortlist.

Keeping that stage separate lets me change the qualification prompt or switch the configured Gemma model without changing the business records or contact handling. The 31B-to-26B change was a useful example of that separation working in practice.

Gemma's available weights also leave room to serve or adapt the model independently later. That isn't implemented in this version. Right now the app uses hosted inference, Gemini is still part of the pipeline, and live search needs an internet connection. I haven't measured a cost or quality advantage over an entirely closed-model setup, and I don't want to claim one before testing it.

What I have is a small, inspectable review step that I can keep improving for a specific kind of work, without letting model changes alter the source facts.

## Prize Categories

- **Best Use of Render:** hosts the Next.js frontend and server routes.
- **Best Use of Gemma:** reviews business relevance, the suggested opening, and the unknowns before profiles reach the user.
- **Best Use of SerpApi:** supplies live public business listings for discovery and contact provenance.

## What I Hope Comes From It

The next useful test is letting someone use it for real outreach and finding out which profiles they keep, which they discard, and why.

I haven't landed a first customer with it yet. Before adding payments or a bigger dashboard, I want to know whether the shortlist saves enough research time to be worth coming back to.

## Credits

I used DevRelay to read community work and prepare this draft. [Shivam Kumar's LiveLead](https://dev.to/shivaysinghrajput/livelead-live-google-search-data-explainable-sales-leads-in-one-command-1k89) was a useful reference for live listing research and search-quota tradeoffs. ClientScout takes a more cautious approach to missing websites: an empty listing field isn't enough evidence for a sales claim.

AI tools helped build the app and draft this write-up. The project doesn't claim verified buying intent, email deliverability, customers, or revenue.
