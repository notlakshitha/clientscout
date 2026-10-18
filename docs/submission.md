You can build a website for a business. Finding the business to build it for is where things get a little harder.

![ClientScout walkthrough](https://raw.githubusercontent.com/notlakshitha/clientscout/main/docs/media/clientscout-demo.gif)

So I built ClientScout to give freelancers somewhere to start. You tell it what you do, who you want to help, and where to look. It finds businesses that could be a fit and puts the useful details in one place.

The pitch is simple: **I find you clients. You do your thing.**

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).*

## What I Built

ClientScout helps freelancers and small agencies find potential business customers. Someone selling websites, photography, social media services, or bookkeeping can describe their offer and get a shortlist to work through.

For example, you could search for guesthouses around Galle that might be relevant to a direct-booking website service. Each profile shows the business, its location, public contact details when available, and why it could fit your offer.

The idea is to make the research before outreach easier. Instead of keeping a dozen search tabs open and copying details into a spreadsheet, you can review the businesses together and keep the ones that interest you.

Open a profile to see the evidence, a possible opening, and what you still need to check. A relevant business isn't necessarily looking to buy, so the app keeps that distinction visible.

You can save prospects in your browser, filter the shortlist, export a CSV, or prepare an introduction. The introduction is editable, and nothing gets sent automatically.

I think this could be useful to someone who needs a few relevant businesses to approach each week. I haven't tested paid demand yet, but that's the problem I'd want a paid version to solve.

## Demo

![ClientScout home](https://raw.githubusercontent.com/notlakshitha/clientscout/main/docs/media/landing.png)

[Try ClientScout](https://clientscout-akrc.onrender.com)

Try describing an offer, choosing a type of business and a location, then running a search. Open a profile, check its sources, and save a business you'd want to look into.

![A shortlist in ClientScout](https://raw.githubusercontent.com/notlakshitha/clientscout/main/docs/media/shortlist.png)

The GIF and workspace screenshots use the app's labelled fictional example. You can open it with **Take a look first** to explore without using search quota. Live searches use public business listings.

![Preparing an introduction](https://raw.githubusercontent.com/notlakshitha/clientscout/main/docs/media/outreach.png)

The hosted demo has a small shared search allowance. It's on Render's free service, so it can take a little longer to wake up after being idle.

## Code

{% github https://github.com/notlakshitha/clientscout %}

It's built with Next.js, React, TypeScript, and plain CSS. The code is MIT licensed, with setup instructions in the repository.

## How I Built It

SerpApi searches Google Maps for the requested business type and location. That gives the app public listing details to work with, including names, addresses, websites, and phone numbers when listed.

Gemini reads those listings alongside the user's offer and turns them into structured profiles. The server matches each profile back to a listing and takes the contact details from that record. It drops unmatched business names and doesn't let the model fill missing contacts with guesses. The listing search doesn't collect email addresses.

Gemma 4 reviews how each business fits the offer. It suggests a possible opening and explains what's still unknown, such as the business's current setup or interest in the service. That assessment is separate from the factual contact fields.

The hosted app uses `gemma-4-26b-a4b-it` through Google's API. A live test returned three guesthouses around Galle with public listing phone numbers and source links.

Render hosts the Next.js app and its server routes. API keys stay on the server. Saved prospects stay in browser storage, so you don't need an account to try the workspace.

## Why Does Open Innovation Matter?

I wanted to keep the part that decides what makes a useful prospect easy to change. Gemma is an open-weight model, and its review is a separate stage with its own prompt and model setting.

That lets me change how it assesses an offer without changing where business details come from. During testing, I switched from the 31B model to the 26B model after the larger endpoint failed on a full review. The listing and contact handling stayed the same.

The available weights also leave room to serve or adapt that model later. This version uses hosted inference, so it still needs an internet connection and sends the brief to the configured providers. Local inference isn't implemented yet.

## Prize Categories

**Best Use of Gemma** — Gemma 4 reviews business relevance and suggests an opening while keeping unknowns visible.

**Best Use of SerpApi** — Finds public business listings through live Google Maps search.

**Best Use of Render** — Hosts the Next.js app and server routes, with API keys configured on the server.

## What I Hope Comes From It

I'd like someone who's good at their work but stuck on finding clients to get a useful starting point from this.

The next step is to put it in front of freelancers and see which prospects they keep, which they skip, and whether it saves them time. Finding the next client still takes a conversation. I want ClientScout to make it easier to get to that conversation.

