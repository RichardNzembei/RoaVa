# Roava — technical landscape: stack, data, AI & automation

A map of the tools, data sources, AI, and automation for the wider engine — with opinionated recommendations and, crucially, *when* to bring each one in. The recurring theme: build the marketplace first; the "polls every source" AI engine is a Phase 2 growth layer, not a launch requirement.

*Prepared June 2026. Tool capabilities, pricing, and coverage shift fast — verify before committing. Not legal advice; the scraping and data-protection notes need a Kenyan lawyer's review.*

---

## 1. The decision that frames everything: bookable supply vs. discovery index

Hold two distinct concepts in the data model from day one:

- **Bookable inventory** — experiences an operator has listed and connected to your payment rail. You can take payment and earn commission on these. This is your owned asset and your moat.
- **Discovery index** — events/experiences aggregated from APIs or scraping. You display and link out to these; you cannot transact on them (they aren't yours). They make the app feel alive and drive SEO/content, but they don't directly monetize.

Conflating these is the classic aggregator trap: a rich feed with no revenue. Tag every record with its source and whether it's bookable, and design the UI so the difference is honest (a "book on Roava" experience vs. a "find out more" listing that links out).

---

## 2. Data sourcing (in priority order)

Global event APIs are built for Western markets and forecasting; hyperlocal Kenyan coverage is thin. So the hierarchy is owned-first.

### Tier 1 — Operator self-serve (primary, bookable, owned)
The experiences operators list themselves. Clean, accurate, bookable, and defensible. This is already in v1 and is the spine of the business. Everything else is supplementary.

### Tier 2 — Official event APIs (discovery breadth)
| Source | Strength | Kenya fit |
|---|---|---|
| Google Events (via SerpApi or Apify actors) | Aggregates Google's events box — pulls Ticketmaster/Eventbrite/local sites; good local breadth | Best single discovery source for Kenya; pay per query |
| Eventbrite API | Free dev keys; events hosted on Eventbrite; ticketing-oriented | Some Kenyan events; easy to start |
| PredictHQ | Aggregates 200+ sources, enriched + ranked + geolocated, ~400k new events/month, 5yr history | Powerful but enterprise-priced; better later, and coverage of small local events is uncertain |
| Bandsintown | Artist tours / concerts | Useful for music events |
| Ticketmaster, SeatGeek | Large catalogs | Western-heavy, minimal Kenya |

Recommendation: start discovery with Google Events (SerpApi/Apify) + Eventbrite; consider PredictHQ only once scale and budget justify it.

### Tier 3 — Scraping (supplementary, with guardrails)
Tools (2026): Firecrawl (turns pages into LLM-ready markdown/JSON, AI extraction, free 500 credits then ~$19/mo, self-hostable under AGPL) is the best fit for an LLM ingestion pipeline; Apify (actor marketplace incl. Google Events scrapers); Playwright/Crawlee for DIY; Bright Data for proxies/anti-bot at scale.

**The honest legal/ethical line — read this before scraping anything:**
- Public data is often scrapable, but Terms of Service, copyright, and privacy law all still apply. There are real fines in this space for scraping personal data.
- Kenya's Data Protection Act (2019) governs personal data — be cautious scraping anything tied to identifiable people.
- Do **not** bypass CAPTCHAs, anti-bot systems, or login walls. If a site actively blocks you, that's a "no."
- Do **not** republish others' event descriptions verbatim — that's copyright infringement. Use the LLM to rewrite/summarize in your own words and **always link to the source**.
- Respect robots.txt and ToS; prefer official APIs over scraping wherever one exists.
- Treat scraping as a feed-filler for the discovery index, never the core. A scraped database is fragile (sites change, blocks happen, legal exposure) — the durable asset is owned operator supply.

### Tier 4 — Partnerships, feeds, and manual
Direct feeds or data-sharing with venues, county tourism offices, and large organizers; RSS/calendar feeds where they exist; and old-fashioned manual curation early on (which doubles as quality control and relationship-building).

---

## 3. The AI layer

Grounded, useful AI — not AI for its own sake. The guardrail throughout: **AI enriches, normalizes, and ranks; it never invents event facts.** Extract, verify, attribute, link.

- **Extraction (messy → structured).** Feed scraped pages (Firecrawl markdown) or social posts to Claude to extract structured records: title, date/time, venue, price, category, organizer. Use structured/JSON output. This is what makes "polls every source" actually work.
- **Normalization & dedup.** The same event appears across sources. Use text embeddings + fuzzy matching (name + date + venue proximity) to merge duplicates into one canonical record.
- **Enrichment.** Geocode venues (maps API), auto-categorize, infer tags, flag quality. Optionally predict popularity for ranking.
- **Semantic discovery & recommendations.** Store embeddings of experiences in Supabase pgvector (HNSW index, cosine distance, `vector_cosine_ops`; under ~1M rows HNSW is the right call). Use the **same embedding model everywhere** (e.g. OpenAI `text-embedding-3-small` at 1536 dims, or an open model). Do **hybrid search** (Postgres full-text keyword + vector similarity) for best results. Supabase supports automatic embeddings via triggers + queues + edge functions, so new listings get vectorized without manual steps. Personalize ranking with user behavior over time.
- **Generation.** Draft listing copy and improve operator descriptions; EN↔Kiswahili translation; auto-generate "what's on this weekend" content for marketing.
- **Moderation & support.** LLM to flag inappropriate listings/reviews; later, a WhatsApp concierge/support assistant.
- **Models.** Claude (Anthropic API) for extraction, generation, translation, moderation; a dedicated embeddings model for vectors; keep prompts and schemas versioned.

---

## 4. Automation & pipelines

### The ingestion pipeline (the "engine")
A scheduled ETL loop for the discovery index:

`fetch (APIs / scrape) → extract to structured (LLM) → normalize & dedupe (embeddings + rules) → geocode & categorize → embed → store (Postgres/pgvector) → rank → serve`

Each stage idempotent and logged; failed records quarantined for review, not silently dropped.

### Where it runs
- Scheduling: Vercel Cron, Supabase scheduled edge functions / `pg_cron`, or a small worker on Railway/Render for heavier jobs.
- Queues: Supabase Queues (pgmq) or Upstash QStash to decouple fetching from LLM processing and smooth rate limits/costs.
- Monitoring: Sentry for errors; structured logs; alerts on pipeline failures.

### Workflow/glue tools
For notifications, simple integrations, and early semi-automation: n8n (self-hostable, developer-friendly, cheap) is the best fit; Make/Zapier are no-code but pricier and less flexible. Use these for glue (e.g. "new operator signs up → notify ops → send welcome"), not for the core ingestion pipeline, which belongs in code.

### Don't over-automate early
In the beginning, manual or semi-automated curation beats a fragile full-auto pipeline. Curate by hand, learn what good data looks like, then automate the parts that are stable. Automation is a cost and a maintenance burden — earn it.

---

## 5. Full integration inventory

| Layer | Tool (recommended) | Role | When |
|---|---|---|---|
| Payments | IntaSend (alt: Flutterwave, Pesapal) | M-Pesa STK + cards + payouts | v1 |
| SMS | Africa's Talking | Transactional confirmations | v1 |
| Auth | Supabase Auth (phone OTP via supported SMS provider) | Sign-in | v1 |
| Data/DB/storage | Supabase (Postgres + pgvector + Storage) | App data, vectors, images | v1 |
| Hosting | Vercel + Supabase | App + data | v1 |
| Maps/geocoding | Google Maps Platform or Mapbox | Geocoding, venue data, maps | v1–2 |
| Error monitoring | Sentry | Reliability | v1 |
| Product analytics | PostHog | Behavior, funnels | v1–2 |
| Event discovery API | Google Events (SerpApi/Apify), Eventbrite | Fill discovery index | Phase 2 |
| Scraping | Firecrawl (alt: Apify, Playwright/Crawlee) | Supplementary discovery data | Phase 2 |
| LLM | Anthropic Claude API | Extraction, generation, translation, moderation | Phase 2 |
| Embeddings | OpenAI `text-embedding-3-small` or open model | Semantic search / recs / dedup | Phase 2 |
| Vector store | Supabase pgvector (Vector Buckets at large scale) | Similarity search | Phase 2 |
| Workflow glue | n8n (alt: Make/Zapier) | Notifications, light automation | Phase 2 |
| WhatsApp | Meta WhatsApp Cloud API or Twilio | Confirmations, support | Phase 2+ |
| Event intelligence | PredictHQ | Enriched/ranked event data | Later/optional |

---

## 6. Sequencing — what to build when

- **v1 (the build plan):** none of the scraping/AI engine. Operator self-serve + simple ranking (recency, proximity, popularity) is enough to launch and validate. Ship this first.
- **Phase 2 (growth):** add the discovery index — Google Events + Eventbrite + selective scraping, with the LLM extraction/dedup pipeline — to fill the feed and make the app feel alive even with few operators. Layer in pgvector semantic search and recommendations. This engine doubles as your content/marketing machine.
- **Phase 3:** richer personalization, WhatsApp concierge, PredictHQ-grade enrichment, regional expansion. Vector Buckets if the index grows into the millions.

The order matters because discovery without bookable supply doesn't monetize — the same lesson from the strategy work. The engine amplifies a working marketplace; it can't substitute for one.

---

## 7. Cost & risk notes

- Costs compound: event APIs (per-query), scraping credits, LLM tokens, embeddings, proxies. Start on free tiers, batch and cache aggressively (e.g. semantic caching), and keep manual curation as the cheap default early.
- Scraping carries maintenance (sites change, blocks evolve) and legal exposure — budget for both or lean on official APIs.
- AI cost control: cache embeddings, only re-embed on change, use cheaper models for bulk extraction and reserve stronger models for hard cases, and rate-limit the pipeline.
- The asset that compounds in value is owned operator supply and your booking/payment data — not the aggregated index, which anyone can replicate.

---

## Sources

Event data APIs: PredictHQ product/comparison pages, VisionVix "Best Event Data APIs 2026," Apify/SerpApi Google Events material. Scraping tools and legal landscape: Browse AI, Firecrawl, Apify, Prospeo, Browser-Use 2026 guides (Firecrawl/Apify/Playwright/Crawlee/Bright Data; ToS/copyright/GDPR and enforcement examples). AI/vector layer: Supabase docs (semantic search, automatic embeddings, AI & Vectors, Vector Buckets), OpenAI cookbook (Supabase semantic search), Kreante and DEV community pgvector guides (HNSW/ivfflat, embedding-model consistency). Kenya market, device, payment, and regulatory context as compiled in the companion strategy, design, and build-plan documents.

*Verify tool pricing/coverage, Supabase auth-provider support, and the legal items (scraping/ToS/copyright/Data Protection Act) before building on them.*
