import Link from "next/link";
import { fetchExperiences, type ExperienceFilters } from "@/lib/experiences";
import { ExperienceCard } from "@/components/experience-card";
import { CATEGORIES, COUNTIES } from "@/lib/catalog";
import { getT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

type SP = {
  q?: string;
  category?: string;
  county?: string;
  date?: string;
  price?: string;
  party?: string;
  when?: string;
};

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const filters: ExperienceFilters = {
    q: sp.q || undefined,
    category: sp.category || undefined,
    county: sp.county || undefined,
    date: sp.date || undefined,
    maxPrice: sp.price ? Number(sp.price) : undefined,
    party: sp.party ? Number(sp.party) : undefined,
    upcomingOnly: sp.when === "week" ? true : undefined,
    withinDays: sp.when === "week" ? 7 : undefined,
  };

  const cards = await fetchExperiences(filters);
  const t = await getT();
  const hasFilters = Boolean(
    sp.q || sp.category || sp.county || sp.date || sp.price || sp.party || sp.when,
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">{t("browse_title")}</h1>
        <p className="text-small text-muted">
          {(cards.length === 1 ? t("browse_result_one") : t("browse_result_many")).replace(
            "{n}",
            String(cards.length),
          )}
        </p>
      </div>

      {/* Plain GET form — works without JS, data-light. */}
      <form
        method="get"
        action="/experiences"
        className="border-hairline rounded-card bg-surface flex flex-col gap-4 border p-4"
      >
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={t("browse_search_ph")}
          aria-label={t("browse_search_aria")}
          className="border-hairline bg-background text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-4"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("browse_cat")}>
            <select
              name="category"
              defaultValue={sp.category ?? ""}
              className="border-hairline bg-background text-body text-foreground min-h-12 rounded-base border px-3"
            >
              <option value="">{t("browse_any_cat")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("browse_county")}>
            <select
              name="county"
              defaultValue={sp.county ?? ""}
              className="border-hairline bg-background text-body text-foreground min-h-12 rounded-base border px-3"
            >
              <option value="">{t("browse_any_county")}</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label={t("browse_date")}>
            <input
              type="date"
              name="date"
              defaultValue={sp.date ?? ""}
              className="border-hairline bg-background text-body text-foreground min-h-12 rounded-base border px-3"
            />
          </Field>
          <Field label={t("browse_max_price")}>
            <input
              type="text"
              inputMode="numeric"
              name="price"
              defaultValue={sp.price ?? ""}
              placeholder={t("browse_price_any")}
              className="border-hairline bg-background text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-3"
            />
          </Field>
          <Field label={t("browse_guests")}>
            <input
              type="text"
              inputMode="numeric"
              name="party"
              defaultValue={sp.party ?? ""}
              placeholder="1"
              className="border-hairline bg-background text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-3"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit">{t("browse_search")}</Button>
          {hasFilters ? (
            <Link href="/experiences" className="text-small text-muted">
              {t("browse_clear")}
            </Link>
          ) : null}
        </div>
      </form>

      {cards.length === 0 ? (
        <EmptyState
          title={t("browse_none_title")}
          body={t("browse_none_body")}
          action={
            <Link href="/experiences" className="text-small text-sunset">
              {t("browse_clear")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {cards.map((card, i) => (
            <ExperienceCard key={card.id} card={card} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small text-foreground">{label}</span>
      {children}
    </label>
  );
}
