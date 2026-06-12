# Roava — design system, UX, marketing & product specification

A deep build spec for the experiences engine: the design language, the UX patterns, the three product layers (how each should feel, look, and perform), the marketing position, and the goals and targets to measure against. Every major decision is anchored to how Kenyans actually use phones, pay, and connect — that grounding is in Section 0 and threads through everything.

*Prepared June 2026. Market and infrastructure figures are from the sources at the end and shift over time; re-verify before committing. This is a product/design spec and a strategic plan, not legal or financial advice.*

---

## 0. The realities this is designed around (research foundation)

Design decisions here are not aesthetic preferences; they fall out of measured conditions in the Kenyan market.

**Devices.** By the end of 2025, smartphones made up roughly 93% of phones connected to Kenyan networks (Communications Authority of Kenya), but the growth is driven by entry-level Android devices — Tecno, itel, Infinix — now selling under KES 5,000. So the realistic target device is a low-end Android with modest CPU, limited RAM, and a small-to-mid screen, not a flagship. Feature phones still account for a meaningful slice (penetration around 56%), which matters for reach and for SMS/USSD fallbacks.

**Connectivity and data.** The internet is overwhelmingly mobile (around 97% of access). 4G dominates and the average user pulls ~14.6 GB/month, but data is metered and users are cost-conscious; heavy pages cost them money and load slowly on congested cells. Network quality is inconsistent outside urban cores.

**Money.** Mobile money penetration is near-universal (~98%), and M-Pesa is the financial rail. The STK Push payment flow (the "enter your PIN" prompt) is the norm, and it has hard constraints worth designing for: a ~60-second response window, three PIN attempts, and well-known failure modes (timeout, insufficient funds, wrong PIN, network drop, conflicting USSD session). Critically, a "success" on the payment *request* only means the prompt was sent — the payment is pending until a server callback confirms it.

**Where attention lives.** WhatsApp and Facebook are the most-used platforms, with TikTok rising fast among the young. WhatsApp in particular is a primary communication channel, not just social.

**The seven design principles that follow from the above:**

1. **Mobile-first, low-end-first.** Design and performance-budget for a cheap Android on a metered connection, not a designer's iPhone. If it's smooth there, it's smooth everywhere.
2. **Data-light by default.** Compressed/lazy-loaded images, minimal fonts, small bundles. Respect the user's airtime.
3. **Offline-tolerant.** Cache what's been seen; let people browse saved experiences and view their tickets with no signal. Never lose a booking record to a dropped connection.
4. **M-Pesa-native, payment as the hero moment.** The pay sheet is the most important screen in the product. It must be fast, reassuring, and bulletproof against the known STK failure modes.
5. **Trust-forward.** First-time buyers fear fake tickets and dodgy operators. Verification badges, real reviews, and unmistakable refund/cancellation clarity carry the conversion.
6. **Bilingual and locally-voiced.** English and Kiswahili throughout; tone that sounds Kenyan, not imported. A light Sheng register is fine in marketing, never in money or legal copy.
7. **WhatsApp-aware.** Confirmations, tickets, and support should be reachable over WhatsApp/SMS, not only email — email is secondary here.

---

## 1. Brand & design language

### Personality and voice
Roava is **warm, confident, and effortless** — a knowledgeable local friend, not a corporate travel agency. It is proud of Kenya without being touristy or clichéd (no tired "magical safari" tropes). Voice is plain, friendly, and direct: short sentences, active verbs, no jargon. In money and legal contexts the voice tightens to calm and precise. Sentence case everywhere; never shouty caps.

### Logo and lockup (recap)
Lowercase `roava` wordmark, soft and rounded, with a small dot/mark that doubles as the app icon. Permanent functional descriptor `discover · book · experience` sits with the logo. Emotional line varies by audience (Section 4). Typeface direction: a humanist sans with warmth and excellent legibility at small sizes on low-density screens — a clean geometric-humanist (e.g. the Inter/General Sans family of feel) for UI, with a slightly more characterful display cut reserved for the wordmark and hero headlines only.

### Color system
Two brand ramps plus neutrals and semantics. Warm because the product is about joy, sun, and discovery; restrained so it stays premium and legible.

| Token | Hex | Role |
|---|---|---|
| Sunset / primary | `#D85A30` | Primary actions, brand accent, the M-Pesa button, key highlights |
| Sunset-dark | `#A8482A` | Primary text on light coral fills, pressed states |
| Sunset-tint | `#FAECE7` | Soft fills, selected chips, subtle backgrounds |
| Savanna / secondary | `#0F6E56` | Secondary/trust accent; corporate-tier surfaces; "verified" |
| Ink | `#241F1C` | Primary text (warm near-black, softer than pure #000) |
| Sand | `#F7F3EE` | Warm page/surface background (light mode) |
| Success | `#1D9E75` | Confirmed payments, valid tickets |
| Warning | `#EF9F27` | Pending states, low stock |
| Danger | `#E24B4A` | Errors, failed payments, cancellations |

Usage rules: one primary action per screen in Sunset; Savanna for secondary/trust, never competing with Sunset for the eye; semantic colors only for their meaning. Always pair color with a second cue (icon, label) — never rely on color alone. All text/background pairings must meet WCAG AA (4.5:1 for body, 3:1 for large text); Sunset on white passes for large text and buttons, and white on Sunset passes — verify each pairing in a contrast checker, and provide a full dark-mode palette (Ink-based surfaces, lightened Sunset for accents) since many users run dark mode and OLED saves battery.

### Typography scale
A tight, mobile-tuned scale. Two weights only in UI (regular 400, medium 500) to keep rendering crisp on low-end screens.

| Style | Size / weight | Use |
|---|---|---|
| Display | 30–34 / 500 | Wordmark, hero headlines (sparingly) |
| H1 | 24 / 500 | Screen titles |
| H2 | 20 / 500 | Section headers |
| H3 | 16 / 500 | Card titles, list headers |
| Body | 15–16 / 400 | Default text, line-height ~1.5 |
| Small | 13–14 / 400 | Metadata, captions |
| Caption | 12 / 400 | Timestamps, fine print (never below 12) |

### Spacing, grid, radius, elevation
8-point spacing system (4/8/12/16/24/32). Single-column mobile layouts; content max-width on larger screens. Corner radius: 8px default, 12px for cards, full-pill only for chips/tags. Elevation is **flat** — rely on hairline 0.5px borders and the Sand/white surface contrast, not heavy drop shadows (shadows render poorly and cost performance on cheap GPUs). One soft shadow reserved for the bottom-sheet (the pay sheet) to signal it floats above content.

### Iconography and imagery
Outline icon set, consistent stroke weight, 24px base, 48px minimum touch target. Photography is the soul of an experiences brand: real, sunlit, people-present, unpolished-but-beautiful — never generic stock safaris. Operators upload imagery, so the system must make even a phone photo look good (consistent aspect ratios, subtle treatment, graceful low-res fallbacks). Always ship a tasteful placeholder for missing images rather than a broken frame.

### Motion
Purposeful and quick (150–250ms), easing-in-out, `transform`/`opacity` only. Motion communicates state (sheet slides up, ticket flips to show QR, success check draws in) — never decorative. Respect `prefers-reduced-motion`.

### Accessibility (non-negotiable, WCAG 2.1 AA)
48px minimum touch targets; AA contrast on all text; full keyboard/screen-reader semantics on web; scalable text; never color-only signaling; clear focus states. Accessibility here is also a market-reach issue — older users and first-time smartphone owners benefit from the same large targets and plain copy.

---

## 2. UX principles & patterns

### Performance budget
Treat performance as a feature. Targets: first meaningful content under ~3s on a 4G connection on a low-end device; interactive under ~5s; initial bundle lean; images lazy-loaded and right-sized. Every screen should be usable on a 360px-wide, low-RAM device. Measure on a real cheap Android, not an emulator on a fast laptop.

### The signature pattern: the M-Pesa pay flow
This is the screen that makes or breaks revenue, so it gets specified in detail.

1. **Set expectations before you ask.** The pay sheet states the exact amount in KES, the phone number (editable, M-Pesa-format aware), and one line of plain copy: "We'll send a prompt to your phone — enter your M-Pesa PIN to confirm." No surprises, no extra fields. Guest checkout is prominent; do not force account creation before payment.
2. **One primary action.** A single Sunset "Pay with M-Pesa" button. Card payment is a clearly secondary option for diaspora/corporate, not competing for the eye.
3. **Trigger and wait state.** On tap, immediately move to a calm waiting screen: a progress indicator, a countdown reflecting the ~60s window, and reassurance ("Check your phone for the M-Pesa prompt"). The app polls the server for the callback; remember that the request succeeding only means the prompt was sent — treat as pending until the callback confirms.
4. **Handle every failure explicitly and kindly.** Distinct, plain-language messages and next steps for: timeout ("Didn't get the prompt? Resend"), insufficient funds (suggest top-up/Fuliza), wrong PIN (retry), cancelled, and network/USSD conflict. Implement retry with a sensible cooldown (~30s).
5. **Always offer a fallback.** If STK Push fails repeatedly, surface manual Paybill/Till instructions with the exact reference so the user can still pay. Never dead-end.
6. **Confirm across channels.** On success, instant in-app confirmation plus an SMS and (ideally) a WhatsApp message with the ticket/booking — because email is not where this audience lives, and because a confirmation that survives offline reduces support load.
7. **Never lose the record.** Reconciliation matches the system reference to the booking automatically; a dropped connection on the user's side must never orphan a paid booking.

### Offline & poor-network tolerance
Cache browsed experiences and the user's tickets locally. Tickets (QR) must render with no signal — they're scanned at gates where connectivity is often poor, so validation should work offline-first and sync later. Show honest, friendly offline states, never spinners that hang forever.

### Trust patterns
Verified-operator badges; genuine reviews with photos; transparent, prominent cancellation/refund terms before payment; clear display of what's included; visible support contact (WhatsApp). For events, anti-fraud is part of the UX: tickets carry signed, single-use QR codes; the holder sees a subtly animated/timestamped ticket that's hard to screenshot-fake.

### Language & localization
Full English/Kiswahili support with an easy switch; detect sensibly but let users choose. Currency always explicit (KES; USD for diaspora/corporate where relevant). Date/time in local conventions. Keep money and legal copy in clear standard language; reserve any playful Sheng register for marketing surfaces.

### System states
Design empty, loading, error, and success states for every screen up front — they are most of the perceived quality. Skeleton loaders (cheap to render) over spinners; encouraging empty states that guide the next action; errors that say what happened and what to do.

---

## 3. The product layers — feel, look, deliver, expectations, goals

The engine exposes three products on one rail. Each has a distinct audience, feel, and set of targets. Targets below are illustrative early benchmarks to design and aim toward, not promises.

### Layer 1 — Consumer app (discovery + ticketing)

**Who it's for.** Domestic Kenyans (and visitors) looking for things to do — events, experiences, hidden gems — and buying tickets.

**How it should feel & look.** Joyful, fast, effortless, and trustworthy. Visually rich with real photography but data-light. The home is a discovery feed — what's happening near you, this weekend, hidden gems by region — powered by the curation engine. Browsing feels like scrolling a beautiful local guide; booking feels like two taps and an M-Pesa prompt.

**What it must deliver (core jobs).**
- Discover: location- and taste-aware feed; search and filter (category, county, date, price); "near me" and "this weekend."
- Decide: rich experience/event pages with photos, included details, reviews, clear pricing, cancellation terms.
- Book & pay: frictionless guest checkout, the M-Pesa pay flow above, instant cross-channel confirmation.
- Hold & use: a wallet of tickets/bookings that works offline; QR at the gate.
- Save & share: wishlists; easy share to WhatsApp (the real sharing channel).

**Key screens.** Discovery home, search/filter, experience detail, pay sheet, ticket wallet, profile.

**v1 scope discipline.** Ship discovery + ticketing for one wedge (e.g. Nairobi-region events + nearby experiences). Skip multi-day itinerary building, social feeds, loyalty programs — later.

**Goals / targets (illustrative early benchmarks).**
- North-star contribution: booked experiences/tickets per active user per month.
- Payment success rate ≥ ~92% of initiated STK pushes (guardrail; below this, the pay flow is leaking money).
- Checkout completion (detail → paid) trending toward 50%+ as trust builds.
- Repeat-purchase rate within 90 days as the real signal of product-market fit.
- Crash-free sessions ≥ 99% on low-end Android.

### Layer 2 — Operator tool (booking & payment software)

**Who it's for.** Experience operators and event organizers — many small, some still on pen, paper, and WhatsApp.

**How it should feel & look.** Calm, reliable, "this makes my life easier." Utilitarian where the consumer app is lush. Mobile-first (operators run their business from a phone), with a clean dashboard: today's bookings, upcoming, money in, what needs action. The emotional job is *confidence* — the operator must trust that bookings and payouts are correct, because it's their livelihood.

**What it must deliver.**
- Listings & availability: simple calendar, capacity, pricing; create a sellable experience/event in minutes.
- Take bookings & payments: shareable booking/payment links (M-Pesa STK + card), instant payout to their M-Pesa/bank, auto-confirmation to the customer via SMS/WhatsApp.
- Manage the day: bookings list, gate check-in/scan for events (offline-tolerant), simple customer comms.
- See the money: clear sales and payout reporting, real-time, reconciled.
- Onboarding help: heavy hand-holding for the undigitized — templates, guided setup, human support in Kiswahili.

**v1 scope discipline.** Calendar + payment link + auto-confirmation + simple dashboard. Skip OTA/channel-manager sync, complex multi-vendor packaging, dynamic pricing — those are later and are where the global incumbents over-serve.

**Goals / targets.**
- Activation: % of signed operators who create a listing and take a first real booking within 14 days.
- Retention: monthly active operators / churn — the core SaaS health metric.
- Payout reliability and speed (this is the trust differentiator vs. global tools): correct, same-day payout.
- Supply contribution: bookable inventory added to the platform per operator (this is also the supply feeding Layers 1 and 3).
- Net revenue retention as operators grow volume through you.

### Layer 3 — Corporate & diaspora demand

**Who it's for.** Corporate buyers (team-building, offsites, incentives, conference "bleisure" add-ons) and the diaspora (gifting experiences home; planning visits).

**How it should feel & look.** Premium, curated, reassuring, human. This layer can be largely concierge-led early — a request flow plus human curation — rather than fully self-serve. Visually it leans on the Savanna/trust palette and editorial, high-quality presentation; it should feel like a service, not a marketplace. For diaspora, the emotional register is belonging and pride; for corporate, it's reliability, professionalism, and one-vendor convenience.

**What it must deliver.**
- Corporate: curated packages and a request/quote flow; invoicing; account management; reliable delivery; light reporting for the buyer.
- Diaspora: gift-an-experience and homecoming-planning flows; hard-currency/card payment with clear FX; the recipient experience handled locally.
- Both: ride the same supply and rail; premium curation is the product.

**v1 scope discipline.** Run it manually first — a concierge service curating from existing supply, charging a planning fee plus commission. Productize only once demand is proven. Build last, after real supply exists.

**Goals / targets.**
- Corporate: number of repeat corporate accounts; average deal size; gross margin (should materially exceed consumer ticketing margin).
- Diaspora: conversion of gifting/homecoming requests; average order value in hard currency.
- Margin contribution per booking vs. the consumer side (the whole point is monetizing the same supply at higher margin).

---

## 4. Marketing & positioning

### Positioning statement
For Kenyans (at home and abroad) and the businesses that serve them, Roava is the place to discover, book, and experience the best of Kenya — from hidden gems and local events to curated corporate and homecoming experiences — paid the way Kenya pays. Unlike global experience marketplaces that carry only the famous tours, and unlike government inspiration sites you can't actually book through, Roava is local-first, M-Pesa-native, and built to be transacted on.

### What makes it different (the defensible story)
Not "first to exist" — the Kenyan ticketing space is crowded and global operator tools are capable. The edge is: native M-Pesa and instant payout; discovery fused with the transaction (most local tools are checkout-only); hyperlocal and county-level coverage the global players ignore; and one rail that monetizes the same supply three ways.

### Audience-specific messaging
- **Local consumer:** lead with discovery and pride. Emotional line: "Kenya, from every angle." Hook: you haven't seen all of your own country yet — find the hidden gems and the events worth leaving the house for, and book in two taps.
- **Diaspora:** lead with belonging. "Kenya, from every angle" works hardest here. Hook: gift an experience to family back home, or plan the homecoming trip — handled, locally, end to end.
- **Corporate:** lead with reliability and convenience. Scalable line: "Every experience, one place." Hook: offsites, team-building, and incentive experiences across Kenya, curated and handled by one trusted partner.
- **Operators (B2B):** lead with livelihood. Hook: take bookings, get paid instantly to M-Pesa, and reach customers actively looking for what you offer — without the pen-and-paper chaos.

Keep `discover · book · experience` as the constant, audience-neutral descriptor across all surfaces.

### Channels
- **Organic + content:** the curation engine is also a content machine. Turn "what's on this weekend," "hidden gems of [county]," and trending experiences into TikTok, Instagram, and a WhatsApp/Telegram broadcast — proving demand and building audience before/alongside the app.
- **WhatsApp-first comms:** confirmations, support, and even discovery nudges where the audience already is.
- **Operator partnerships:** organizers and operators are both supply and a distribution channel — they push their own audiences to your checkout.
- **Diaspora networks:** associations, community groups, churches, and diaspora-focused social channels; hard-currency-ready.
- **Corporate:** relationship selling, references, and bleisure tie-ins with conference/MICE organizers.

### Launch motion
Wedge-first, revenue-first, lean. Prove one layer in one slice (likely ticketing + nearby experiences for the Nairobi region), validate operators will pay and consumers will book, then expand category and geography, then switch on corporate/diaspora. Let the cash-generating layer fund the vision rather than raising against it — fitting a market where most startups fail within five years and tourism-tech funding is thin.

### Brand do's and don'ts
Do: real Kenyan imagery, plain warm voice, pride without cliché, money clarity. Don't: generic safari stock, shouty caps, hidden fees, "magical" tourist-board language, or anything that erodes trust at the moment of payment.

---

## 5. Targets, goals & metrics

### North-star metric
**Completed, paid experiences and tickets per month** (and the active users/operators driving them) — it captures discovery working, trust holding, and payment succeeding all at once.

### Guardrail metrics (quality must not be sacrificed for growth)
- M-Pesa payment success rate (initiated → confirmed) — the single most important operational metric.
- Payout accuracy and speed to operators.
- Crash-free sessions and load time on low-end Android.
- Support-ticket rate per booking (a rising rate signals UX or payment problems).
- Refund/dispute rate.

### Per-layer KPIs (recap)
- Consumer: bookings/active user/month, checkout completion, 90-day repeat rate.
- Operator: 14-day activation, monthly active operators, churn, inventory added, net revenue retention.
- Corporate/diaspora: repeat accounts, average order value, gross margin vs. consumer side.

### Phasing the goals
- **Phase 1 (prove):** one wedge live; validate operators pay and consumers book; nail payment success rate; small but real repeat usage. The goal is *evidence*, not scale.
- **Phase 2 (deepen):** expand categories/counties; grow operator base and recurring revenue; harden reliability.
- **Phase 3 (widen):** switch on corporate/diaspora as the high-margin demand layer; consider regional expansion (East Africa) where competition is thinner.

---

## Sources

Device, connectivity, and mobile-money data: Communications Authority of Kenya sector statistics (smartphone/feature-phone penetration, data subscriptions, mobile-money penetration) via CA, Techweez, Tech-ish, Maudhui House, and CATI Africa reporting (2025–2026). M-Pesa STK Push UX and failure-handling: Vendly, Zama, Webpinn, Nairobi Web Experts, WooDev, and developer write-ups on Daraja integration. Checkout UX best practices: Baymard Institute. Market, competitor, payment-gateway, regulatory (CBK/PSP), diaspora-remittance, and MICE context as compiled in the companion deep-dive document (GetYourGuide/Viator, Mookh/Ticketsasa and the Kenyan ticketing field, Rezdy/Bókun/FareHarbor, Pesapal/Flutterwave/IntaSend, CBK National Payment System Act, CBK diaspora figures, and global MICE reports).

*Figures current as of reporting in late 2025 / early-to-mid 2026; re-verify before committing capital or finalizing technical and design decisions.*
