import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchExperiences } from "@/lib/experiences";
import { ExperienceCard } from "@/components/experience-card";

export default async function WishlistPage() {
  await requireProfile("/wishlist");

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("wishlist")
    .select("experience_id");
  const ids = (rows ?? []).map((r) => r.experience_id);
  const cards = ids.length ? await fetchExperiences({ ids }) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <h1 className="text-h1 text-foreground">Saved</h1>

      {cards.length === 0 ? (
        <div className="border-hairline rounded-card bg-surface flex flex-col items-start gap-2 border p-6">
          <h2 className="text-h3 text-foreground">Nothing saved yet</h2>
          <p className="text-small text-muted">
            Tap “Save” on any experience to keep it here for later.
          </p>
          <Link href="/discover" className="text-small text-sunset">
            Explore experiences
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
