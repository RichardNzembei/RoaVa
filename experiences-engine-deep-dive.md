# The experiences engine: a deep dive into the three layers

A working analysis of building one shared platform for the Kenyan experiences and events economy, monetized three ways: event ticketing, operator booking/payment software, and corporate/diaspora demand. For each layer this covers the problem it solves, the market (Kenya and global), what incumbents have already solved, the gaps you could exploit, the tech and build process, what it demands of you, and the honest risks.

*Prepared June 2026. Figures are from the sources listed at the end; market data shifts, so treat the numbers as direction, not gospel, and re-verify before committing capital.*

---

## How to read this

The thesis from earlier still holds: this is **one engine with three revenue layers**, not three businesses. The engine is a shared rail — payments, an operator/inventory base, and a booking ledger. The three monetization layers sit on top of it and reinforce each other. So this document starts with the rail (Layer 0), because the rail's constraints — especially the regulatory ones around money — shape everything built on top of it.

The single most important finding from the research: **the moment you hold other people's money, you enter a regulated space in Kenya.** That fact reorganizes the whole build. It's covered in Layer 0 and referenced throughout.

---

## Layer 0 — The shared rail (payments, supply, ledger)

### What it is and the problem it solves

Everything the three layers do reduces to the same primitives: take a payment, know what inventory exists and who owns it, and keep a reliable record of who booked what and who gets paid. Build these once, well, and ticketing, operator software, and corporate sales are all interfaces onto the same core.

### Market and tech reality: payments

Kenya is the best mobile-money market on earth for this. M-Pesa processes more than 60 million transactions a day and is effectively the country's financial infrastructure; card-only processors built for Europe or the US simply do not work for a Kenyan consumer audience. Any consumer-facing layer must take M-Pesa natively.

You have two technical routes to M-Pesa:

1. **Direct integration via Safaricom's Daraja API.** Daraja is a RESTful API (managed on Google's Apigee) exposing endpoints for STK Push (the "enter your PIN" prompt — Lipa na M-Pesa Online), C2B, B2C (payouts), and B2B. It is the cheapest at scale (no middleman fee) but the most work: documentation is uneven, you need a Safaricom business account with a Paybill or Till, server-side handling of asynchronous callbacks, and a registered Kenyan business to go live. Going live also has an approval/onboarding lag.

2. **Aggregators that wrap M-Pesa (and cards) for you.** Pesapal, Flutterwave, Paystack, IntaSend, iPay, DPO, Cellulant/Tingg, KopoKopo, plus bank rails like Jenga (Equity) and Buni (KCB). These handle the API heavy lifting and add cards on the same checkout, for a per-transaction fee. Indicative fees seen in the market: Paystack around 1.5%, iPay around 2.5%, Flutterwave around 3.8% on international; local settlement is typically T+1, versus M-Pesa's near-instant settlement.

The practical recommendation: **start on an aggregator, not direct Daraja.** It compresses time-to-market, gives you cards alongside M-Pesa, and — crucially — keeps you on someone else's licence (see regulation below). Move volume to direct Daraja later only if fee savings justify the engineering and compliance load.

### The regulatory finding that reshapes the whole build

Under Kenya's National Payment System Act framework, an entity that provides payment services or facilitates electronic payments is a Payment Service Provider (PSP) and needs authorization/licensing from the Central Bank of Kenya. Licensing is rigorous (financial standing, governance, infrastructure, risk management, KYC/AML), and critically, **PSPs are required to establish a Trust to safeguard customer funds.** A 2022 High Court decision even extended the PSP definition to some back-end processors.

What this means for you in plain terms:

- If your platform **holds** ticket proceeds or experience payments before paying operators out — i.e. you sit in the money flow as escrow or a wallet — you are walking toward PSP territory and the licensing, capital, trust-account, and compliance burden that comes with it.
- The clean way to avoid that early is to architect so that **money never rests with you**: the licensed aggregator collects from the buyer and settles to the operator's account directly, and you take your fee as a clearly defined commission/marketplace fee, not by warehousing funds. Many marketplaces structure exactly this way to stay merchant-of-record-adjacent rather than money-transmitter.
- Escrow and "hold the deposit, release on completion" — genuinely useful for trust — is the feature most likely to drag you across the regulatory line. If it's core to your model, get specific legal advice on structure *before* building it, because it can dictate your corporate setup.

I am not a lawyer; this is the flag, not the ruling. The point is that money-handling structure is an early architectural decision with legal consequences, not a detail to bolt on later.

### Build complexity and demands

The rail is the highest-trust, highest-consequence part of the system: payment bugs lose real money and trust instantly. It demands a competent backend developer comfortable with asynchronous payment callbacks, idempotency (so a retried payment doesn't double-charge or double-credit), reconciliation (matching M-Pesa confirmations to bookings), and secure secret handling (never expose API keys client-side). This is not no-code territory, though aggregator SDKs and plugins reduce the lift substantially.

### Gaps you can exploit

The global operator-software incumbents (next section) are priced and built for Western operators and **do not do M-Pesa natively or well.** Local payment competence — instant M-Pesa settlement, payouts to operator wallets, reconciliation that matches how Kenyan organizers actually work — is a real, defensible edge that none of the foreign tools replicate. The rail is where "built for Kenya" stops being a slogan and becomes a moat.

---

## Layer 1 — Event ticketing

### What it is and the problem it solves

Sell tickets to events (concerts, festivals, conferences, theatre, sport, community events), deliver a scannable digital ticket, validate at the gate, and pay the organizer. The organizer's core pains: collecting money cleanly (no manual Paybill errors or reversals), getting paid fast enough to actually fund the event, controlling fraud at the gate, and seeing real-time sales.

### Market research

This is the layer with the **cleanest transaction** (a dated, discrete sale with a clear fulfilment moment) and the **fastest cash** — but it is *not* an empty field. Kenya's ticketing market is genuinely crowded and maturing:

| Platform | Position / note |
|---|---|
| Ticketsasa | Veteran, trusted; strong on corporate conferences, theatre, sport; wide payment options |
| Mookh | Built for the *small* organizer who needs cash immediately; ~8% commission; 1,000+ merchants across Kenya, Uganda, Rwanda, Tanzania; partnered with a financier to offer organizers upfront event funding |
| Mtickets / Madfun | Powerhouses for large-scale concerts and festivals |
| ZenLipa, Hustlesasa, OneKitty, Tokea, Pataticket | Newer/varied: recurring-event tooling, RSVP, fast one-off setups |
| KenyaBuzz | Nation Media-owned; strong on discovery and cinema seat selection |
| Tickets Kenya | Corporate/professional events focus, QR entry |

Indicative economics: commissions cluster around the high-single-digits (Mookh's ~8% is a useful anchor), well below the 20–30% that global experience marketplaces like Viator and GetYourGuide take, because a ticket is a simpler product than a tour. A key structural insight from Mookh's own history: the gap they exploited was **payout speed** — Ticketsasa served corporates who didn't need money immediately; small organizers need ticket revenue *now* to fund the event. Cash-flow timing, not features, was the wedge.

### What incumbents have already solved

Digital tickets with QR/barcode validation, gate-scanning apps, real-time sales dashboards, M-Pesa + card checkout, promo codes and comps, and (Mookh) even organizer financing. The basics are a solved, commoditized problem in Kenya. Re-building "a way to sell a ticket" adds nothing.

### Gaps and flaws (your opening)

- **Discovery is weak.** Reviewers note that, unlike Eventbrite, several local platforms don't let you browse "events around you" well — they're checkout tools, not discovery engines. Your AI-aggregation strength (knowing what's happening everywhere, surfacing it by location and taste) is exactly what they lack. Ticketing-as-checkout is crowded; **ticketing-fused-with-discovery** is not.
- **Hyperlocal and county-level events** beyond Nairobi's concert scene are under-served — and Kenya's tourism push spans all 47 counties, with festivals and cultural events that have no clean ticketing/discovery home.
- **Payout speed and trust** remain differentiators, as Mookh proved; there's room to be the fastest, most transparent payout in a niche.
- **Cross-border**: Mookh moved HQ toward Uganda citing "more events, less competition." East Africa regionally is less saturated than Nairobi.

### Tech and build process

A ticketing v1 is the most achievable of the three. Core build: event creation and ticket types, inventory limits, M-Pesa/card checkout (via aggregator), digital ticket generation with a tamper-resistant QR (signed payload so it can't be forged), a gate-scanner mobile view that marks tickets used (and handles offline/poor-connectivity scanning, which matters at Kenyan venues), an organizer dashboard, and payout logic. The hard technical bits are fraud prevention (one ticket, one entry — preventing screenshot resale and double-scan) and reliable scanning under bad network conditions. Realistic v1 with an aggregator: small but real — weeks to a few months for a focused build, not a weekend.

### Demands on you

A developer for the checkout/QR/scanner, a relationship motion to sign organizers (sales, not just software), and gate-day operational support (when scanning fails at 8pm at a packed venue, someone answers the phone). Marketing matters because ticket buyers are price- and trust-sensitive consumers.

### Risks

Crowded incumbents with trust and organizer relationships you'll have to displace; consumer trust (people fear fake tickets); event seasonality and concentration (a few big events dominate); and chargeback/refund handling when events are cancelled or postponed — which, if you hold funds, loops straight back to the Layer 0 regulatory issue.

---

## Layer 2 — Operator booking & payment software

### What it is and the problem it solves

Software for ongoing experience operators (safari guides, day-tour operators, activity providers, boat trips, cultural experiences) to manage availability, take bookings, get paid, and avoid the pen-and-paper chaos and double-bookings most still run on. This is recurring B2B revenue and — the strategic prize — it's how you onboard supply for everything else.

### Market research

The global incumbents are mature, capable, and **priced for Western operators in USD**:

| Platform | Model (indicative) | Owner / note |
|---|---|---|
| Rezdy | ~$49–$249/mo + ~3% booking fee | Independent; strong reseller/OTA distribution |
| Bókun | ~$49/mo (free tier exists) + ~1–1.5% | TripAdvisor/Viator-owned; deep Viator integration |
| FareHarbor | No subscription, but ~6% commission (region-dependent) | Booking Holdings (Booking.com); strong US distribution, POS |
| WeTravel | ~$79/mo + ~1.5–3.9% processing | Multi-day trips, payments-led |
| Peek Pro | Up to ~6–8% booking fees | US-focused; AI/marketing features, operator financing |

The critical local realities the global market data doesn't show: (a) these tools assume card payments and OTA distribution, **not M-Pesa**, and (b) their USD subscriptions ($49–$99+/mo) are steep for a small Kenyan operator. Meanwhile the broader problem is well-documented: a large share of small operators still run on pen, paper, and WhatsApp, which is *the* supply bottleneck for the whole experiences economy — and the reason "aggregate everything" ideas stall, because there's nothing bookable to aggregate.

### What incumbents have already solved

Availability calendars, real-time booking engines, channel managers (sync one inventory across Viator/GetYourGuide/Booking so you don't double-book), embeddable booking widgets, POS for in-person sales, reseller networks, automated confirmations, reporting, and increasingly AI assistants for marketing/back-office. Don't rebuild any of this generically — it's done better than you can do alone.

### Gaps and flaws (your opening)

- **No native, first-class M-Pesa.** This is the big one. A booking tool where the operator gets paid instantly to their M-Pesa, customers pay how Kenyans actually pay, and reconciliation matches local behaviour — none of the foreign tools nail this.
- **Pricing/packaging for the local operator.** A KES-priced, mobile-first, dead-simple tool (calendar + M-Pesa payment link + auto-confirmation) priced for a one-guide operation beats a $99/mo Western SaaS the operator will never adopt.
- **Onboarding the undigitized.** The incumbents assume a digitally ready operator. The unmet need is hand-holding the pen-and-paper operator onto *anything* — which is fieldwork, not features, and is exactly why it's defensible.
- **Distribution is OTA-centric and global.** A tool that also feeds *your own* consumer/event discovery layer (Layer 1) and *your* corporate/diaspora demand (Layer 3) gives the operator local demand the foreign tools can't.

### Tech and build process

A v1 can be deliberately thin: a booking calendar with availability, a shareable booking/payment link (M-Pesa STK Push + card via aggregator), automatic confirmation (SMS/WhatsApp matters more than email here), and a simple operator dashboard. You can skip channel-management and OTA sync entirely at first — those are v3 problems. The build is moderate; the genuine difficulty is less the software than getting operators to *use* it daily.

### Demands on you

This is a **SaaS sales-and-support motion**, which is a different muscle from consumer marketing: demos, onboarding, training, retention, churn management. It also demands patience — operator adoption is slow and high-touch. The payoff is sticky recurring revenue plus the supply base that powers Layers 1 and 3.

### Risks

Slow adoption and high churn among small operators; the temptation to over-build toward the feature-rich incumbents (death by scope); price sensitivity capping your per-operator revenue; and the fact that, again, if you intermediate the booking payment and hold it before payout, Layer 0's regulatory question applies.

---

## Layer 3 — Corporate & diaspora demand

### What it is and the problem it solves

Two higher-value demand channels pointed at the supply Layers 1 and 2 assembled, monetized at higher margin and with far less price resistance than the mass consumer.

- **Corporate**: team-building, offsites, retreats, incentive trips, conference "bleisure" add-ons. Budget-holders, repeat buyers, not haggling over a few hundred shillings.
- **Diaspora**: Kenyans abroad with hard currency, gifting or booking experiences for family back home, or planning their own visits.

### Market research

**Corporate / MICE.** The global MICE (meetings, incentives, conferences, exhibitions) market is large — credible estimates put it around or above US$1 trillion in 2025 with high-single-digit growth — and **Kenya is repeatedly named as an emerging MICE destination** improving its infrastructure to court international business groups. The most relevant trend for you isn't hosting the conference; it's the **experiential upsell**: a large majority of "bleisure" trips originate from conferences and meetings, and hotels/DMCs increasingly bundle cultural tours, outdoor activities, and culinary experiences onto business trips because they're high-margin and lengthen stays. That upsell layer — curated, bookable experiences attached to corporate events and offsites — is a concrete wedge that doesn't require you to win the MICE business itself.

**Diaspora.** The numbers are striking. Per Central Bank of Kenya data, diaspora remittances reached about US$5.04 billion in 2025, a record, and now exceed tourism receipts and agricultural exports as Kenya's largest source of foreign exchange. The US sends just over half (~54%). The government launched a 2025–2030 Diaspora Investment Strategy to deepen these flows. (Note: a senior official cited a much higher ~KES 1 trillion / ~$7.75bn figure in late 2025; the CBK's ~$5.04bn is the conservative, official number — flagged so you don't over-anchor on the larger political claim.)

**The honest caveat on diaspora:** that $5bn is overwhelmingly *household support* — school fees, family upkeep — not discretionary experience spending. Your addressable slice is a thin sliver of it. What the figure really proves is *willingness and ability to pay in hard currency, plus strong emotional pull* — gifting an experience to family, or planning a homecoming trip. That's a real, under-served, high-margin niche, but size it as a niche, not as "a $5bn market."

### What incumbents have already solved / current state

Corporate events in Kenya are largely served by traditional event-management and travel-agency relationships and DMCs — relationship-driven, offline, fragmented. There's no dominant digital player owning "bookable experiences for corporate offsites and diaspora gifting." Global experience marketplaces (Viator/GetYourGuide) carry the famous tours but are thin on local, curated, relationship-sold corporate packages and have no diaspora-gifting angle at all.

### Gaps and flaws (your opening)

- **Corporate experiences are sold on relationships and curation, not self-serve checkout** — which is precisely why a curated, well-supplied platform with a human concierge layer can win, and why margins are high.
- **Diaspora gifting and homecoming planning** is almost entirely unserved as a product; remittance rails move money but don't let someone *book an experience* for family back home.
- This layer **monetizes the same supply twice**: inventory acquired cheaply via the consumer/ticketing side gets resold at premium margins here, with no consumer-acquisition cost.

### Tech and build process

This layer is the **least technical and most human** early on. You can run it largely manually at first: a concierge/itinerary service that curates from your supply base, quotes corporates, and handles diaspora requests over WhatsApp/email, charging a planning fee plus operator commissions. Productize (request forms, packaged offerings, payment in USD/cards for diaspora) only once the manual version shows demand. The tech mostly rides on the rail and supply you already built.

### Demands on you

Relationship and enterprise selling for corporate (longer cycles, trust, references), and trust/marketing reach into diaspora communities (often via diaspora networks, churches, associations, social channels). Hard-currency payment handling and cross-border settlement (Flutterwave, DPO, and similar handle this; note T+3–5 international settlement and a looming risk of US remittance taxation).

### Risks

Long sales cycles and lumpy revenue (corporate); diaspora is a niche that's easy to over-size on paper; cross-border payment friction and FX; and dependence on having real, high-quality supply already in place — which is why this is sequenced *last*.

---

## Cross-cutting: sequencing and what to actually build first

The layers share the rail, so build the rail once and switch the revenue layers on in sequence. Recommended order and why:

1. **Event ticketing first.** It forces you to build the payment + ticket infrastructure that *is* the rail, generates the fastest clean cash, and onboards event organizers (a form of supply). Differentiate on discovery + payout speed + hyperlocal/county events, since plain ticketing is crowded. Stay on an aggregator's licence; don't hold funds.
2. **Operator software second.** Same calendar, same payments, now pointed at recurring availability. Recurring revenue, deeper supply, sticky. Win on native M-Pesa, KES pricing, and onboarding the undigitized — not on feature parity with Rezdy/Bókun.
3. **Corporate & diaspora third**, mostly manual at first, as a high-margin demand layer on the supply the first two assembled.

A defensible alternative is operator-software-first *if* you already have strong operator relationships. For most people starting cold, ticketing's clean cash flow is the safer opener.

---

## The honest bottom line

What the research changes about the original idea:

- **None of these is a green field.** Ticketing in Kenya is crowded; operator software has strong (if non-local) global incumbents; corporate/diaspora is fragmented but relationship-locked. Your edge is not "first to exist" — it's **local payment competence (M-Pesa), discovery fused with transaction, and onboarding the undigitized**, stitched into one rail that lets you monetize the same supply three ways.
- **The supply bottleneck is still the real constraint**, and the operator layer is how you turn that bottleneck into a paid acquisition channel.
- **The money-handling regulatory question (CBK/PSP/Trust) is an early architectural decision, not a detail.** Default to never holding funds; ride a licensed aggregator; get legal advice before building escrow.
- **Kenya's startup reality is unforgiving** — most fail within five years, tourism-tech funding is thin, and well-funded companies have died from burning cash without a path to profit. So the strategy that fits is revenue-first and lean: validate each layer (ideally manually) before building, and let the cash-generating layer fund the vision rather than raising against it.

The engine is real and coherent. The win comes from sequencing and local execution, not from breadth on day one.

---

## Sources

Market, competitor, payment, regulatory, and macro data drawn from, among others: Sharetribe and CanvasBusinessModel (global experience-marketplace commissions); Skift and Dittofi (Airbnb Experiences, Viator competitors); Bókun, CaptainBook, Automate.travel, Arival, WP Travel Engine (tour-operator software pricing/features); Techweez, Dignited, Victor Matara, Business Daily, ZenLipa, Tickets Kenya, Pesapal (Kenya ticketing market and Mookh economics); PaymentProviders.io, Dusupay, IntaSend, SmartBizSystems, Webpinn, Zegetech, CNBCode (Kenya payment gateways and M-Pesa/Daraja integration); Lawzana, Cliffe Dekker Hofmeyr, Afriwise, Central Bank of Kenya, PayAtlas (CBK / National Payment System Act / PSP licensing); CBK via Tuko, Kenyan Wall Street, Business Daily, Khusoko, BitKE (2025 diaspora remittance figures); Fortune Business Insights, Mordor Intelligence, Persistence, Market Mind Partners (global MICE market and Kenya as emerging MICE destination); Tech In Africa, The Kenya Times, BusinessDay, Launch Base Africa, WeeTracker, Disrupt Africa, PhocusWire (African startup failure rates and tourism-tech funding context); Kenya Tourism Board / KATA coverage (47-county tourism circuits, experiential travel shift).

*Figures were current as of reporting in late 2025 / early-to-mid 2026 and should be re-verified before any commitment of capital. This document is strategic and informational, not legal or financial advice; consult qualified Kenyan counsel on payment licensing and a financial professional on capital decisions.*
