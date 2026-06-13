# Roava — Corporate / Diaspora demand channel (v2 plan)

> **Status: deferred. Do not build until the trigger.** This is the "third" layer — a high-margin *demand* channel layered on top of the v1 supply+consumer marketplace. It is mostly a sales/BD effort, not new core architecture. Chasing it early pulls engineering away from the thing that actually unlocks it.
>
> *Companion to `roava-v1-build-plan.md` (§8 defers this). Product/engineering plan, not legal/financial advice — the v1 compliance items (payments structure, data protection) still govern.*

---

## 1. The thesis

This is **demand, not supply**: corporates booking group days out, and diaspora gifting/booking experiences for family back home. It's attractive because it's:

- **High-margin** — less price-sensitive (an offsite budget; a gift), and concentrated (one corporate = many seats), so acquisition cost amortises across a big basket.
- **Layered, not foundational** — it rides on inventory that already exists; it adds new *demand entry points*, not a new marketplace.

The corollary: it's worthless on an empty marketplace. You can't sell inventory you don't have.

## 2. Trigger to start — liquidity, not a date

Begin only when there is **enough published experiences with consistent real availability and reliable fulfilment** that there's something genuinely worth selling to a corporate buyer. Concretely, rough signals:

- A meaningful roster of **published, verified operators** with **recurring future slots** (not one-off seeded dates).
- A track record of **bookings that actually happened** and **checked-in guests** (fulfilment works).
- Payouts settling cleanly to operators (the money loop is trustworthy).

Until those hold, this stays a slide for sales conversations and a ready backlog — not a sprint.

## 3. What v1 already supports (do NOT rebuild — and don't remove)

v1 does not paint you into a corner. The following already exist and are reused as-is:

- **Group bookings** — `bookings.party_size` + per-slot `capacity`/`booked_count` with atomic reservation. Booking N seats already works.
- **Non-custodial payments** — collect-and-disburse through the licensed provider, commission as a defined fee. New collection rails (invoice, international card) bolt on as additional methods *without* re-architecting the money flow or touching payouts.
- **Tickets/QR + check-in** — signed single-use tickets and operator check-in work regardless of how the booking was paid for or who it was gifted to.

> Guardrail: keep `party_size`, per-slot capacity, and the non-custodial split intact. They are the hooks this whole layer depends on.

## 4. Sub-channel A — Corporate (group / team outings)

**~80% of the work is demand-gen / BD, not build:**
- Outbound to HR / People-Ops / EAs at Nairobi employers.
- A "team day out near Nairobi" landing page + a curated set of group-ready experiences.
- A booking can start as a **form + a human** — no new app surface required to validate demand.

**Build, only once demand is proven, smallest slice first:**
1. **Group / block booking** — extend the existing N-seat booking to *block-book a whole private slot* (or span multiple dates) in one transaction.
2. **Invoice / pay-later** — corporates won't STK-push KES 200k. Add an `invoice` payment method (PO number, due date, mark-paid on bank/card receipt); IntaSend card for mid-size baskets. Still non-custodial.
3. **Organisation accounts** — multiple bookers under one billing entity; consolidated receipts/reporting.
4. **Private / custom experiences** — an operator quotes a private group (booking `status = quote`), distinct from public inventory.

## 5. Sub-channel B — Diaspora (gifting / booking from abroad)

**Demand-gen:** diaspora community channels; "gift an experience back home" angle; foreign-currency price display.

**Build, once proven:**
1. **International card** — IntaSend cards (or Stripe) as a second collection rail; the non-custodial split is unchanged.
2. **Gifting** — buy a ticket/voucher for someone else (recipient phone/email); recipient redeems → a normal booking + ticket. Reuses the existing ticket/QR machinery end to end.
3. **Currency display** — show the foreign-currency equivalent; settle in KES.

## 6. Data-model deltas (additive — nothing in v1 changes)

Sketch only; design properly at build time:

| New / changed | Purpose |
|---|---|
| `organizations` | corporate billing entity |
| `org_members` | bookers under an org |
| `vouchers` / `gifts` | gifting: buyer, recipient contact, redemption → booking |
| `payments.provider` / method | add `invoice` and `card_intl` alongside M-Pesa |
| `bookings.status` | add `quote` for private/custom corporate bookings |

Bookings, tickets, capacity reservation, RLS, and payouts are **reused unchanged**.

## 7. Sequencing when triggered

1. Validate demand with **no build** (landing page + form + manual fulfilment).
2. Ship the **smallest enabling slice** that the first real buyers need (usually: block-booking + invoice for corporate; or international card + gifting for diaspora).
3. Only then add org accounts / custom experiences / currency polish.

## 8. Explicitly NOT in scope now

No corporate or diaspora features ship in v1. This document is the ready-to-execute plan for when liquidity arrives — and a guardrail reminder that the v1 build must keep `party_size`, per-slot capacity, and non-custodial payments intact so this can bolt on later.
