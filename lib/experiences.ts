import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ExperienceFilters = {
  category?: string;
  county?: string;
  maxPrice?: number;
  party?: number;
  /** ISO date (YYYY-MM-DD) in EAT — keep only experiences with a slot that day. */
  date?: string;
  /** Only experiences with at least one bookable upcoming slot. */
  upcomingOnly?: boolean;
  /** Only experiences with a slot within the next N days (for "this weekend"). */
  withinDays?: number;
  /** Restrict to specific experience ids (e.g. a wishlist). */
  ids?: string[];
  limit?: number;
};

export type ExperienceCard = {
  id: string;
  title: string;
  image: string | null;
  county: string | null;
  area: string | null;
  category: string | null;
  priceKes: number;
  operatorName: string;
  verified: boolean;
  rating: { avg: number; count: number } | null;
  nextSlotAt: string | null;
};

type SlotLite = {
  start_at: string;
  status: string;
  capacity: number;
  booked_count: number;
};

function bookable(slot: SlotLite, party: number): boolean {
  return (
    slot.status === "open" &&
    new Date(slot.start_at).getTime() > Date.now() &&
    slot.capacity - slot.booked_count >= party
  );
}

// Discovery query. Coarse filters (category/county/price) run in SQL; slot-based
// filters (date/party/upcoming) and aggregates are derived in JS — fine at v1
// data sizes, and keeps the ranking logic simple and explicit.
export async function fetchExperiences(
  filters: ExperienceFilters = {},
): Promise<ExperienceCard[]> {
  const supabase = await createClient();
  const party = filters.party && filters.party > 0 ? filters.party : 1;

  let query = supabase
    .from("experiences")
    .select(
      `id, title, images, county, area, category, base_price_kes, created_at,
       operators!inner ( business_name, verified ),
       reviews ( rating ),
       availability_slots ( start_at, status, capacity, booked_count )`,
    )
    .eq("status", "published");

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.county) query = query.eq("county", filters.county);
  if (filters.maxPrice) query = query.lte("base_price_kes", filters.maxPrice);
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    query = query.in("id", filters.ids);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const now = Date.now();
  const withinMs = filters.withinDays
    ? filters.withinDays * 24 * 60 * 60 * 1000
    : null;

  const cards: ExperienceCard[] = [];
  for (const row of data) {
    const slots = (row.availability_slots ?? []) as SlotLite[];
    const upcoming = slots
      .filter((s) => bookable(s, party))
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      );

    if (filters.upcomingOnly && upcoming.length === 0) continue;

    if (filters.date) {
      const onDate = upcoming.some(
        (s) => toEatDate(s.start_at) === filters.date,
      );
      if (!onDate) continue;
    }
    if (withinMs !== null) {
      const within = upcoming.some(
        (s) => new Date(s.start_at).getTime() - now <= withinMs,
      );
      if (!within) continue;
    }

    const ratings = (row.reviews ?? []).map((r) => r.rating);
    const operator = row.operators as unknown as {
      business_name: string;
      verified: boolean;
    };

    cards.push({
      id: row.id,
      title: row.title,
      image: row.images?.[0] ?? null,
      county: row.county,
      area: row.area,
      category: row.category,
      priceKes: row.base_price_kes,
      operatorName: operator.business_name,
      verified: operator.verified,
      rating: ratings.length
        ? {
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            count: ratings.length,
          }
        : null,
      nextSlotAt: upcoming[0]?.start_at ?? null,
    });
  }

  // Simple v1 ranking: experiences with an upcoming slot first, then by
  // popularity (review count), then newest.
  cards.sort((a, b) => {
    if (!!a.nextSlotAt !== !!b.nextSlotAt) return a.nextSlotAt ? -1 : 1;
    const ra = a.rating?.count ?? 0;
    const rb = b.rating?.count ?? 0;
    if (ra !== rb) return rb - ra;
    return 0;
  });

  return filters.limit ? cards.slice(0, filters.limit) : cards;
}

export type DetailSlot = {
  id: string;
  startAt: string;
  capacity: number;
  bookedCount: number;
  priceKes: number;
  seatsLeft: number;
};

export type ExperienceDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  county: string | null;
  area: string | null;
  meetingPoint: string | null;
  cancellationPolicy: string | null;
  images: string[];
  basePriceKes: number;
  durationMinutes: number | null;
  maxPartySize: number;
  operator: { name: string; bio: string | null; verified: boolean };
  slots: DetailSlot[];
  reviews: {
    id: string;
    rating: number;
    body: string | null;
    reviewerName: string;
    createdAt: string;
  }[];
  rating: { avg: number; count: number } | null;
};

// Full public detail for one experience, or null if not found/unpublished
// (RLS hides drafts from the anon/consumer session).
export async function fetchExperienceDetail(
  id: string,
): Promise<ExperienceDetail | null> {
  const supabase = await createClient();

  const { data: exp } = await supabase
    .from("experiences")
    .select(
      `id, title, description, category, county, area, meeting_point,
       cancellation_policy, images, base_price_kes, duration_minutes,
       max_party_size, status,
       operators!inner ( business_name, bio, verified ),
       availability_slots ( id, start_at, capacity, booked_count, price_override, status )`,
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!exp) return null;

  const operator = exp.operators as unknown as {
    business_name: string;
    bio: string | null;
    verified: boolean;
  };

  const now = Date.now();
  const slots: DetailSlot[] = (exp.availability_slots ?? [])
    .filter(
      (s) =>
        s.status === "open" && new Date(s.start_at).getTime() > now,
    )
    .map((s) => ({
      id: s.id,
      startAt: s.start_at,
      capacity: s.capacity,
      bookedCount: s.booked_count,
      priceKes: s.price_override ?? exp.base_price_kes,
      seatsLeft: s.capacity - s.booked_count,
    }))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  const { data: reviewRows } = await supabase
    .from("experience_reviews")
    .select("id, rating, body, reviewer_name, created_at")
    .eq("experience_id", id)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r) => ({
    id: r.id as string,
    rating: r.rating as number,
    body: r.body as string | null,
    reviewerName: r.reviewer_name as string,
    createdAt: r.created_at as string,
  }));

  const rating = reviews.length
    ? {
        avg: reviews.reduce((a, r) => a + r.rating, 0) / reviews.length,
        count: reviews.length,
      }
    : null;

  return {
    id: exp.id,
    title: exp.title,
    description: exp.description,
    category: exp.category,
    county: exp.county,
    area: exp.area,
    meetingPoint: exp.meeting_point,
    cancellationPolicy: exp.cancellation_policy,
    images: exp.images ?? [],
    basePriceKes: exp.base_price_kes,
    durationMinutes: exp.duration_minutes,
    maxPartySize: exp.max_party_size,
    operator: {
      name: operator.business_name,
      bio: operator.bio,
      verified: operator.verified,
    },
    slots,
    reviews,
    rating,
  };
}

function toEatDate(iso: string): string {
  // YYYY-MM-DD as seen in East Africa Time.
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Africa/Nairobi",
  });
}
