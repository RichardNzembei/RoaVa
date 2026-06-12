import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchExperienceDetail } from "@/lib/experiences";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { experienceImageUrl, reviewImageUrl } from "@/lib/storage";
import { formatKes } from "@/lib/format";
import { StarRating } from "@/components/star-rating";
import { SlotPicker } from "./slot-picker";
import { WishlistButton } from "./wishlist-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const exp = await fetchExperienceDetail(id);
  if (!exp) return { title: "Experience — RoaVa" };
  return {
    title: `${exp.title} — RoaVa`,
    description: exp.description ?? undefined,
  };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exp = await fetchExperienceDetail(id);
  if (!exp) notFound();

  // Saved state for the wishlist button (if signed in).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let saved = false;
  if (user) {
    const { data } = await supabase
      .from("wishlist")
      .select("experience_id")
      .eq("profile_id", user.id)
      .eq("experience_id", id)
      .maybeSingle();
    saved = Boolean(data);
  }

  const hours = exp.durationMinutes ? exp.durationMinutes / 60 : null;

  // schema.org structured data for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: exp.title,
    description: exp.description ?? undefined,
    image: exp.images.map(experienceImageUrl),
    brand: { "@type": "Organization", name: exp.operator.name },
    offers: {
      "@type": "Offer",
      price: exp.basePriceKes,
      priceCurrency: "KES",
      availability:
        exp.slots.length > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      url: `${publicEnv.siteUrl}/experiences/${exp.id}`,
    },
    ...(exp.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: exp.rating.avg.toFixed(1),
            reviewCount: exp.rating.count,
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/experiences" className="text-small text-muted">
        ← Back to browse
      </Link>

      {/* Gallery */}
      {exp.images.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="bg-accent-soft aspect-[4/3] overflow-hidden rounded-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={experienceImageUrl(exp.images[0])}
              alt={exp.title}
              className="h-full w-full object-cover"
            />
          </div>
          {exp.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {exp.images.slice(1, 5).map((img) => (
                <div
                  key={img}
                  className="bg-accent-soft aspect-square overflow-hidden rounded-base"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={experienceImageUrl(img)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-accent-soft text-sunset text-display flex aspect-[4/3] items-center justify-center rounded-card">
          {exp.title.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Title + meta */}
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">{exp.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-small text-muted">
            {[exp.area, exp.county].filter(Boolean).join(", ")}
          </span>
          {exp.category ? (
            <span className="bg-accent-soft text-sunset text-caption rounded-full px-2 py-0.5">
              {exp.category}
            </span>
          ) : null}
          {exp.rating ? (
            <StarRating avg={exp.rating.avg} count={exp.rating.count} />
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-small text-foreground">{exp.operator.name}</span>
          {exp.operator.verified ? (
            <span className="text-savanna text-caption">✓ Verified operator</span>
          ) : null}
        </div>
        <div className="mt-1">
          <WishlistButton experienceId={exp.id} initialSaved={saved} />
        </div>
      </div>

      {/* Booking */}
      <SlotPicker
        experienceId={exp.id}
        slots={exp.slots}
        maxPartySize={exp.maxPartySize}
      />

      {/* About */}
      {exp.description ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-h2 text-foreground">About this experience</h2>
          <p className="text-body text-foreground whitespace-pre-line">
            {exp.description}
          </p>
          {hours ? (
            <p className="text-small text-muted">
              Duration: about {hours % 1 === 0 ? hours : hours.toFixed(1)} hour
              {hours === 1 ? "" : "s"}.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Meeting point */}
      {exp.meetingPoint ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-h2 text-foreground">Meeting point</h2>
          <p className="text-body text-foreground">{exp.meetingPoint}</p>
        </section>
      ) : null}

      {/* Cancellation terms — shown BEFORE payment (trust). */}
      {exp.cancellationPolicy ? (
        <section className="border-hairline rounded-card bg-surface flex flex-col gap-1 border p-4">
          <h2 className="text-h3 text-foreground">Cancellation policy</h2>
          <p className="text-small text-muted">{exp.cancellationPolicy}</p>
        </section>
      ) : null}

      {/* Reviews */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-h2 text-foreground">Reviews</h2>
          {exp.rating ? (
            <StarRating avg={exp.rating.avg} count={exp.rating.count} />
          ) : null}
        </div>
        {exp.reviews.length === 0 ? (
          <p className="text-small text-muted">
            No reviews yet — be the first after your visit.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {exp.reviews.map((r) => (
              <li
                key={r.id}
                className="border-hairline flex flex-col gap-1 border-b pb-4 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-small text-foreground">
                    {r.reviewerName}
                  </span>
                  <StarRating avg={r.rating} count={0} showCount={false} />
                </div>
                {r.body ? (
                  <p className="text-body text-muted">{r.body}</p>
                ) : null}
                {r.photos.length > 0 ? (
                  <ul className="mt-1 flex gap-2">
                    {r.photos.map((key) => (
                      <li
                        key={key}
                        className="bg-accent-soft h-20 w-20 overflow-hidden rounded-base"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={reviewImageUrl(key)}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-caption text-muted pb-4">
        Prices in Kenyan shillings (KES). Pay securely with M-Pesa at checkout.
      </p>
    </main>
  );
}
