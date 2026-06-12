import Link from "next/link";
import { fetchExperiences, type ExperienceFilters } from "@/lib/experiences";
import { ExperienceCard } from "@/components/experience-card";
import { CATEGORIES, COUNTIES } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

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
  const hasFilters = Boolean(
    sp.q || sp.category || sp.county || sp.date || sp.price || sp.party || sp.when,
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Browse experiences</h1>
        <p className="text-small text-muted">
          {cards.length} {cards.length === 1 ? "result" : "results"}
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
          placeholder="Search experiences, places…"
          aria-label="Search"
          className="border-hairline bg-background text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-4"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              name="category"
              defaultValue={sp.category ?? ""}
              className="border-hairline bg-background text-body text-foreground min-h-12 rounded-base border px-3"
            >
              <option value="">Any category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="County">
            <select
              name="county"
              defaultValue={sp.county ?? ""}
              className="border-hairline bg-background text-body text-foreground min-h-12 rounded-base border px-3"
            >
              <option value="">Any county</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Date">
            <input
              type="date"
              name="date"
              defaultValue={sp.date ?? ""}
              className="border-hairline bg-background text-body text-foreground min-h-12 rounded-base border px-3"
            />
          </Field>
          <Field label="Max price (KES)">
            <input
              type="text"
              inputMode="numeric"
              name="price"
              defaultValue={sp.price ?? ""}
              placeholder="Any"
              className="border-hairline bg-background text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-3"
            />
          </Field>
          <Field label="Guests">
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
          <Button type="submit">Search</Button>
          {hasFilters ? (
            <Link href="/experiences" className="text-small text-muted">
              Clear filters
            </Link>
          ) : null}
        </div>
      </form>

      {cards.length === 0 ? (
        <div className="border-hairline rounded-card bg-surface flex flex-col items-start gap-2 border p-6">
          <h2 className="text-h3 text-foreground">No experiences match</h2>
          <p className="text-small text-muted">
            Try widening your dates, price, or area.
          </p>
          <Link href="/experiences" className="text-small text-sunset">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {cards.map((card) => (
            <ExperienceCard key={card.id} card={card} />
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
