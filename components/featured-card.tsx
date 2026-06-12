import Link from "next/link";
import { experienceImageUrl } from "@/lib/storage";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import type { ExperienceCard as Card } from "@/lib/experiences";

// Large, immersive editorial lead card — the photo IS the card, with the title
// and meta overlaid. Used to headline a feed (e.g. "This week" on discover).
export function FeaturedCard({
  card,
  fromLabel,
  perPerson,
  verifiedLabel,
}: {
  card: Card;
  fromLabel: string; // e.g. "from"
  perPerson: string; // e.g. "/ person"
  verifiedLabel: string;
}) {
  const location = [card.area, card.county].filter(Boolean).join(", ");
  return (
    <Link
      href={`/experiences/${card.id}`}
      className="group shadow-card ease-out-soft relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-card text-white transition-transform duration-300 will-change-transform hover:-translate-y-1 active:scale-[0.99]"
    >
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={experienceImageUrl(card.image)}
          alt=""
          className="ease-out-soft absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-[1.05]"
        />
      ) : (
        <div className="from-sunset/40 to-savanna/40 absolute inset-0 -z-10 bg-gradient-to-br" />
      )}
      <div className="from-ink/90 via-ink/45 absolute inset-0 -z-10 bg-gradient-to-t from-0% via-50% to-transparent" />

      {card.verified ? (
        <span className="bg-white/15 text-caption absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 backdrop-blur-sm">
          ✓ {verifiedLabel}
        </span>
      ) : null}

      <div className="flex flex-col gap-2 p-5 [text-shadow:0_2px_16px_rgb(0_0_0_/_0.5)]">
        {card.category ? (
          <span className="text-caption opacity-90">{card.category}</span>
        ) : null}
        <h3 className="text-display">{card.title}</h3>
        <div className="text-small flex flex-wrap items-center gap-x-3 gap-y-0.5 opacity-95">
          {location ? <span>{location}</span> : null}
          {card.rating ? (
            <span>★ {card.rating.avg.toFixed(1)}</span>
          ) : null}
          {card.nextSlotAt ? (
            <span>{formatSlotDateTime(card.nextSlotAt)}</span>
          ) : null}
        </div>
        <span className="text-h3 mt-1">
          {fromLabel} {formatKes(card.priceKes)}{" "}
          <span className="text-small opacity-80">{perPerson}</span>
        </span>
      </div>
    </Link>
  );
}
