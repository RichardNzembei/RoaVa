import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchExperiences } from "@/lib/experiences";
import { getT } from "@/lib/i18n";
import { ExperienceCard } from "@/components/experience-card";
import { EmptyState } from "@/components/empty-state";

export default async function WishlistPage() {
  await requireProfile("/wishlist");
  const t = await getT();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("wishlist")
    .select("experience_id");
  const ids = (rows ?? []).map((r) => r.experience_id);
  const cards = ids.length ? await fetchExperiences({ ids }) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <h1 className="text-h1 text-foreground">{t("wishlist_title")}</h1>

      {cards.length === 0 ? (
        <EmptyState
          title={t("wishlist_empty_title")}
          body={t("wishlist_empty_body")}
          action={
            <Link href="/discover" className="text-small text-sunset">
              {t("wishlist_explore")}
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
