import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, getOperator } from "@/lib/auth";
import { buttonClasses } from "@/components/ui/button";
import { formatKes } from "@/lib/format";
import { experienceImageUrl } from "@/lib/storage";
import { getT } from "@/lib/i18n";
import { BecomeOperatorForm } from "./become-operator-form";

export default async function OperatorPage() {
  // Must be signed in and named; sends to sign-in/onboarding otherwise.
  await requireProfile("/operator");
  const operator = await getOperator();
  const t = await getT();

  if (!operator) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-foreground">{t("op_list_title")}</h1>
          <p className="text-body text-muted">{t("op_list_body")}</p>
        </div>
        <BecomeOperatorForm
          labels={{
            bizName: t("op_biz_name"),
            bizPh: t("op_biz_ph"),
            bizHint: t("op_biz_hint"),
            setup: t("op_setup"),
            start: t("op_start_listing"),
          }}
        />
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
              <span className="text-savanna text-caption">
                ✓ {t("op_verified")}
              </span>
            ) : null}
          </div>
          <p className="text-small text-muted">{t("op_your_experiences")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/operator/payouts"
            className={buttonClasses("ghost")}
          >
            {t("op_earnings")}
          </Link>
          <Link
            href="/operator/check-in"
            className={buttonClasses("secondary")}
          >
            {t("op_checkin")}
          </Link>
          <Link
            href="/operator/experiences/new"
            className={buttonClasses("primary")}
          >
            {t("op_new")}
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="border-hairline rounded-card bg-surface flex flex-col items-start gap-3 border p-6">
          <h2 className="text-h3 text-foreground">{t("op_none_title")}</h2>
          <p className="text-small text-muted">{t("op_none_body")}</p>
          <Link
            href="/operator/experiences/new"
            className={buttonClasses("primary")}
          >
            {t("op_create_first")}
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
                <StatusPill
                  status={exp.status}
                  publishedLabel={t("op_published")}
                  draftLabel={t("op_draft")}
                />
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

function StatusPill({
  status,
  publishedLabel,
  draftLabel,
}: {
  status: string;
  publishedLabel: string;
  draftLabel: string;
}) {
  const published = status === "published";
  return (
    <span
      className={`text-caption rounded-base px-2 py-1 ${
        published
          ? "bg-success/15 text-success"
          : "bg-warning/15 text-warning"
      }`}
    >
      {published ? publishedLabel : draftLabel}
    </span>
  );
}
