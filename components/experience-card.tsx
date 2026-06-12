import Link from "next/link";
import { experienceImageUrl } from "@/lib/storage";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { StarRating } from "@/components/star-rating";
import { ExperienceImage } from "@/components/experience-image";
import type { ExperienceCard as Card } from "@/lib/experiences";

export function ExperienceCard({ card, index = 0 }: { card: Card; index?: number }) {
  return (
    <Link
      href={`/experiences/${card.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="group ease-out-soft motion-safe:animate-fade-up flex flex-col gap-2 transition-transform duration-300 will-change-transform hover:-translate-y-1 active:scale-[0.985]"
    >
      <div className="bg-accent-soft shadow-card group-hover:shadow-card-hover relative aspect-[4/3] overflow-hidden rounded-card transition-shadow duration-300">
        {card.image ? (
          <ExperienceImage
            src={experienceImageUrl(card.image)}
            fallbackChar={card.title.charAt(0).toUpperCase()}
            loading="lazy"
            className="ease-out-soft h-full w-full object-cover transition-transform duration-[650ms] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="text-sunset text-display flex h-full w-full items-center justify-center">
            {card.title.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Faint base gradient grounds the image and lifts text/badges on it. */}
        <div className="from-ink/15 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent to-40%" />
        {card.verified ? (
          <span className="bg-savanna/90 text-caption absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white backdrop-blur-sm">
            ✓ Verified
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-h3 text-foreground truncate">{card.title}</h3>
        </div>
        <p className="text-small text-muted truncate">
          {[card.area, card.county].filter(Boolean).join(", ") || card.county}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="text-small text-foreground">
            {formatKes(card.priceKes)}{" "}
            <span className="text-muted text-caption">/ person</span>
          </span>
          {card.rating ? (
            <StarRating
              avg={card.rating.avg}
              count={card.rating.count}
              showCount={false}
            />
          ) : null}
        </div>
        {card.nextSlotAt ? (
          <p className="text-caption text-savanna">
            Next: {formatSlotDateTime(card.nextSlotAt)}
          </p>
        ) : (
          <p className="text-caption text-muted">No upcoming dates</p>
        )}
      </div>
    </Link>
  );
}
