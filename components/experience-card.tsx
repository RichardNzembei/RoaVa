import Link from "next/link";
import { experienceImageUrl } from "@/lib/storage";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { StarRating } from "@/components/star-rating";
import { ExperienceImage } from "@/components/experience-image";
import type { ExperienceCard as Card } from "@/lib/experiences";

export function ExperienceCard({ card }: { card: Card }) {
  return (
    <Link
      href={`/experiences/${card.id}`}
      className="group flex flex-col gap-2 active:opacity-90"
    >
      <div className="bg-accent-soft relative aspect-[4/3] overflow-hidden rounded-card">
        {card.image ? (
          <ExperienceImage
            src={experienceImageUrl(card.image)}
            fallbackChar={card.title.charAt(0).toUpperCase()}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-sunset text-display flex h-full w-full items-center justify-center">
            {card.title.charAt(0).toUpperCase()}
          </div>
        )}
        {card.verified ? (
          <span className="bg-savanna text-caption absolute left-2 top-2 rounded-full px-2 py-0.5 text-white">
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
