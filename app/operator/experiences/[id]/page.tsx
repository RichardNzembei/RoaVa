import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOperator } from "@/lib/auth";
import { EditExperienceForm } from "./edit-form";
import { ImageManager } from "./image-manager";
import { SlotManager } from "./slot-manager";
import { PublishControls } from "./publish-controls";

export default async function ManageExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operator = await requireOperator();

  const supabase = await createClient();
  const { data: exp } = await supabase
    .from("experiences")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // RLS already hides others' drafts; double-check ownership for clarity.
  if (!exp || exp.operator_id !== operator.id) notFound();

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("experience_id", id)
    .order("start_at", { ascending: true });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-8">
      <div className="flex flex-col gap-3">
        <Link href="/operator" className="text-small text-muted">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-h1 text-foreground">{exp.title}</h1>
          <span
            className={`text-caption rounded-base px-2 py-1 ${
              exp.status === "published"
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning"
            }`}
          >
            {exp.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <Link
          href={`/operator/experiences/${exp.id}/guests`}
          className="text-small text-savanna w-fit"
        >
          View guests →
        </Link>
      </div>

      <PublishControls experienceId={exp.id} status={exp.status} />

      <Section title="Photos" hint="The first photo is the cover. Up to 8.">
        <ImageManager
          experienceId={exp.id}
          operatorId={operator.id}
          images={exp.images ?? []}
        />
      </Section>

      <Section title="Details">
        <EditExperienceForm experience={exp} />
      </Section>

      <Section
        title="Availability"
        hint="Each time slot has its own capacity. Guests book a specific slot."
      >
        <SlotManager experienceId={exp.id} slots={slots ?? []} />
      </Section>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-h2 text-foreground">{title}</h2>
        {hint ? <p className="text-small text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
