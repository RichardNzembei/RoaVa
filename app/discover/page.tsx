import Link from "next/link";
import { fetchExperiences } from "@/lib/experiences";
import { ExperienceCard } from "@/components/experience-card";
import { CategoryChips } from "@/components/category-chips";

// Server-rendered discovery feed. Reads only published experiences (RLS).
export default async function Discover() {
  const [thisWeek, all] = await Promise.all([
    fetchExperiences({ upcomingOnly: true, withinDays: 7, limit: 6 }),
    fetchExperiences({ limit: 24 }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-6">
      <section className="flex flex-col gap-3">
        <h1 className="text-display text-foreground">Find your next day out</h1>
        <p className="text-body text-muted">
          Day-trips and experiences near Nairobi — book a slot, pay with M-Pesa.
        </p>
        <Link
          href="/experiences"
          className="border-hairline bg-surface text-muted text-body flex min-h-12 items-center rounded-base border px-4"
        >
          Search experiences, places, dates…
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h2 text-foreground">Browse by category</h2>
        <CategoryChips />
      </section>

      {thisWeek.length > 0 ? (
        <FeedSection
          title="This week"
          subtitle="Slots in the next 7 days"
          cards={thisWeek}
          href="/experiences?when=week"
        />
      ) : null}

      <FeedSection
        title="All experiences"
        subtitle="Fresh finds near you"
        cards={all}
      />
    </main>
  );
}

function FeedSection({
  title,
  subtitle,
  cards,
  href,
}: {
  title: string;
  subtitle?: string;
  cards: Awaited<ReturnType<typeof fetchExperiences>>;
  href?: string;
}) {
  if (cards.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-h2 text-foreground">{title}</h2>
        <p className="text-small text-muted">
          Nothing here yet — check back soon.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h2 text-foreground">{title}</h2>
          {subtitle ? <p className="text-small text-muted">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="text-small text-sunset shrink-0">
            See all
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {cards.map((card) => (
          <ExperienceCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
