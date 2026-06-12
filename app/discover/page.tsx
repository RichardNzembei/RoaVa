import Link from "next/link";
import { fetchExperiences } from "@/lib/experiences";
import { getT } from "@/lib/i18n";
import { ExperienceCard } from "@/components/experience-card";
import { FeaturedCard } from "@/components/featured-card";
import { CategoryChips } from "@/components/category-chips";

// Server-rendered discovery feed. Reads only published experiences (RLS).
export default async function Discover() {
  const [thisWeek, all, t] = await Promise.all([
    fetchExperiences({ upcomingOnly: true, withinDays: 7, limit: 6 }),
    fetchExperiences({ limit: 24 }),
    getT(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-6">
      <section className="flex flex-col gap-3">
        <h1 className="text-display text-foreground">{t("discover_title")}</h1>
        <p className="text-body text-muted">{t("discover_subtitle")}</p>
        <Link
          href="/experiences"
          className="border-hairline bg-surface text-muted text-body flex min-h-12 items-center rounded-base border px-4"
        >
          {t("discover_search")}
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h2 text-foreground">
          {t("discover_browse_category")}
        </h2>
        <CategoryChips />
      </section>

      {thisWeek.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-h2 text-foreground">
                {t("discover_this_week")}
              </h2>
              <p className="text-small text-muted">
                {t("discover_this_week_sub")}
              </p>
            </div>
            <Link
              href="/experiences?when=week"
              className="text-small text-sunset shrink-0"
            >
              {t("see_all")}
            </Link>
          </div>
          <FeaturedCard
            card={thisWeek[0]}
            fromLabel={t("lead_from")}
            perPerson={t("per_person")}
            verifiedLabel={t("verified_badge")}
          />
          {thisWeek.length > 1 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {thisWeek.slice(1).map((card, i) => (
                <ExperienceCard key={card.id} card={card} index={i} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <FeedSection
        title={t("discover_all")}
        subtitle={t("discover_all_sub")}
        cards={all}
        seeAll={t("see_all")}
        empty={t("discover_empty")}
      />
    </main>
  );
}

function FeedSection({
  title,
  subtitle,
  cards,
  href,
  seeAll,
  empty,
}: {
  title: string;
  subtitle?: string;
  cards: Awaited<ReturnType<typeof fetchExperiences>>;
  href?: string;
  seeAll: string;
  empty: string;
}) {
  if (cards.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-h2 text-foreground">{title}</h2>
        <p className="text-small text-muted">{empty}</p>
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
            {seeAll}
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {cards.map((card, i) => (
          <ExperienceCard key={card.id} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}
