import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, getOperator } from "@/lib/auth";
import { buttonClasses } from "@/components/ui/button";
import { formatKes } from "@/lib/format";
import { experienceImageUrl } from "@/lib/storage";
import { BecomeOperatorForm } from "./become-operator-form";

export default async function OperatorPage() {
  // Must be signed in and named; sends to sign-in/onboarding otherwise.
  const profile = await requireProfile("/operator");
  const operator = await getOperator();

  if (!operator) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-foreground">List with RoaVa</h1>
          <p className="text-body text-muted">
            Take bookings and get paid to M-Pesa. Reach guests looking for
            exactly what you offer — no pen-and-paper chaos.
          </p>
        </div>
        <BecomeOperatorForm />
      </main>
    );
  }

  const supabase = await createClient();
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, title, status, base_price_kes, images, county")
    .eq("operator_id", operator.id)
    .order("created_at", { ascending: false });

  const list = experiences ?? [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-h1 text-foreground">{operator.business_name}</h1>
            {operator.verified ? (
              <span className="text-savanna text-caption">✓ verified</span>
            ) : null}
          </div>
          <p className="text-small text-muted">Your experiences</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/operator/payouts"
            className={buttonClasses("ghost")}
          >
            Earnings
          </Link>
          <Link
            href="/operator/check-in"
            className={buttonClasses("secondary")}
          >
            Check in
          </Link>
          <Link
            href="/operator/experiences/new"
            className={buttonClasses("primary")}
          >
            New
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border-hairline rounded-card bg-surface flex flex-col items-start gap-3 border p-6">
          <h2 className="text-h3 text-foreground">No experiences yet</h2>
          <p className="text-small text-muted">
            Create your first listing — it starts as a draft, so nothing goes
            live until you publish it.
          </p>
          <Link
            href="/operator/experiences/new"
            className={buttonClasses("primary")}
          >
            Create your first experience
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((exp) => (
            <li key={exp.id}>
              <Link
                href={`/operator/experiences/${exp.id}`}
                className="border-hairline rounded-card bg-surface flex items-center gap-4 border p-3 active:bg-accent-soft"
              >
                <ExperienceThumb image={exp.images?.[0]} title={exp.title} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-h3 text-foreground truncate">
                    {exp.title}
                  </span>
                  <span className="text-small text-muted">
                    {exp.county ? `${exp.county} · ` : ""}
                    {formatKes(exp.base_price_kes)}
                  </span>
                </div>
                <StatusPill status={exp.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ExperienceThumb({
  image,
  title,
}: {
  image?: string;
  title: string;
}) {
  if (!image) {
    // Tasteful placeholder, never a broken frame.
    return (
      <div className="bg-accent-soft text-sunset flex h-14 w-14 shrink-0 items-center justify-center rounded-base text-h3">
        {title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={experienceImageUrl(image)}
      alt=""
      className="h-14 w-14 shrink-0 rounded-base object-cover"
    />
  );
}

function StatusPill({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`text-caption rounded-base px-2 py-1 ${
        published
          ? "bg-success/15 text-success"
          : "bg-warning/15 text-warning"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
