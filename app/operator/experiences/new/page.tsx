import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { CreateExperienceForm } from "./create-form";

export default async function NewExperiencePage() {
  await requireOperator();
  const t = await getT();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/operator" className="text-small text-muted">
        ← {t("op_back")}
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">{t("op_new_title")}</h1>
        <p className="text-body text-muted">{t("op_new_body")}</p>
      </div>
      <CreateExperienceForm
        labels={{
          title: t("op_f_title"),
          titlePh: t("op_title_ph"),
          category: t("op_f_category"),
          catPh: t("op_cat_ph"),
          county: t("op_f_county"),
          countyPh: t("op_county_ph"),
          price: t("op_f_price"),
          pricePh: t("op_price_ph"),
          priceHint: t("op_price_hint"),
          creating: t("op_creating"),
          createDraft: t("op_create_draft"),
        }}
      />
    </main>
  );
}
