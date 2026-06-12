import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchExperienceDetail } from "@/lib/experiences";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { experienceImageUrl, reviewImageUrl } from "@/lib/storage";
import { getT } from "@/lib/i18n";
import { StarRating } from "@/components/star-rating";
import { Reveal } from "@/components/reveal";
import { ParallaxImage } from "@/components/parallax-image";
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

  const t = await getT();

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

  const location = [exp.area, exp.county].filter(Boolean).join(", ");

  return (
    <main className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Immersive hero — full-bleed cover with the title/meta overlaid. */}
      <section className="from-sunset/30 to-savanna/30 relative isolate flex min-h-[60vh] flex-col overflow-hidden bg-gradient-to-br text-white">
        {exp.images.length > 0 ? (
          <ParallaxImage src={experienceImageUrl(exp.images[0])} />
        ) : null}
        <div className="from-ink/95 via-ink/80 absolute inset-0 -z-10 bg-gradient-to-t from-0% via-40% to-transparent to-90%" />

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-between gap-6 px-5 pb-9 pt-20">
          <Link
            href="/experiences"
            className="bg-ink/40 text-small ease-out-soft w-fit rounded-full px-3 py-1.5 backdrop-blur-sm transition-colors hover:bg-ink/60"
          >
            ← {t("detail_back")}
          </Link>

          <div className="flex flex-col gap-3 [text-shadow:0_2px_18px_rgb(0_0_0_/_0.55)]">
            {exp.category ? (
              <span className="bg-white/15 text-caption w-fit rounded-full px-2.5 py-1 backdrop-blur-sm">
                {exp.category}
              </span>
            ) : null}
            <h1 className="text-hero">{exp.title}</h1>
            <div className="text-small flex flex-wrap items-center gap-x-3 gap-y-1 opacity-95">
              {location ? <span>{location}</span> : null}
              {exp.rating ? (
                <span aria-label={`Rated ${exp.rating.avg.toFixed(1)} of 5`}>
                  ★ {exp.rating.avg.toFixed(1)}{" "}
                  <span className="opacity-80">({exp.rating.count})</span>
                </span>
              ) : null}
              <span>·</span>
              <span>{exp.operator.name}</span>
              {exp.operator.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">
                  ✓ {t("detail_verified")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-8">
        {/* Thumbnail strip */}
        {exp.images.length > 1 ? (
          <div className="-mt-2 grid grid-cols-4 gap-2">
            {exp.images.slice(1, 5).map((img) => (
              <div
                key={img}
                className="bg-accent-soft shadow-card aspect-square overflow-hidden rounded-base"
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

        <WishlistButton
          experienceId={exp.id}
          initialSaved={saved}
          labels={{
            saved: t("wishlist_saved"),
            save: t("wishlist_save"),
            removeAria: t("wishlist_remove"),
            saveAria: t("wishlist_save_aria"),
          }}
        />

        {/* Booking */}
        <SlotPicker
          experienceId={exp.id}
          slots={exp.slots}
          maxPartySize={exp.maxPartySize}
          labels={{
            chooseDate: t("slot_choose_date"),
            guests: t("slot_guests"),
            seats: t("slot_seats"),
            onlyLeft: t("slot_only_left"),
            fewer: t("slot_fewer"),
            more: t("slot_more"),
            guestOne: t("guest_one"),
            guestMany: t("guest_many"),
            continue: t("slot_continue"),
            none: t("slot_none"),
          }}
        />

        {/* About */}
        {exp.description ? (
          <Reveal as="section" className="flex flex-col gap-2">
            <h2 className="text-h2 text-foreground">{t("detail_about")}</h2>
            <p className="text-body text-foreground whitespace-pre-line">
              {exp.description}
            </p>
            {hours ? (
              <p className="text-small text-muted">
                {t("detail_duration_about")}{" "}
                {hours % 1 === 0 ? hours : hours.toFixed(1)}{" "}
                {hours === 1 ? t("hour_one") : t("hour_many")}.
              </p>
            ) : null}
          </Reveal>
        ) : null}

        {/* Meeting point */}
        {exp.meetingPoint ? (
          <Reveal as="section" className="flex flex-col gap-1">
            <h2 className="text-h2 text-foreground">{t("detail_meeting")}</h2>
            <p className="text-body text-foreground">{exp.meetingPoint}</p>
          </Reveal>
        ) : null}

        {/* Cancellation terms — shown BEFORE payment (trust). */}
        {exp.cancellationPolicy ? (
          <Reveal
            as="section"
            className="border-hairline rounded-card bg-surface shadow-card flex flex-col gap-1 border p-4"
          >
            <h2 className="text-h3 text-foreground">
              {t("detail_cancellation")}
            </h2>
            <p className="text-small text-muted">{exp.cancellationPolicy}</p>
          </Reveal>
        ) : null}

        {/* Reviews */}
        <Reveal as="section" className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-h2 text-foreground">{t("detail_reviews")}</h2>
            {exp.rating ? (
              <StarRating avg={exp.rating.avg} count={exp.rating.count} />
            ) : null}
          </div>
          {exp.reviews.length === 0 ? (
            <p className="text-small text-muted">{t("detail_no_reviews")}</p>
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
        </Reveal>

        <p className="text-caption text-muted pb-4">{t("detail_price_note")}</p>
      </div>
    </main>
  );
}
