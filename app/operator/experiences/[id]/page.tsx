import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOperator } from "@/lib/auth";
import { getT } from "@/lib/i18n";
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
  const t = await getT();

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
          ← {t("op_back")}
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
            {exp.status === "published" ? t("op_published") : t("op_draft")}
          </span>
        </div>
        <Link
          href={`/operator/experiences/${exp.id}/guests`}
          className="text-small text-savanna w-fit"
        >
          {t("op_view_guests")} →
        </Link>
      </div>

      <PublishControls
        experienceId={exp.id}
        status={exp.status}
        labels={{
          publishing: t("op_publishing"),
          publish: t("op_publish"),
          liveMsg: t("op_live_msg"),
          unpublish: t("op_unpublish"),
          draftMsg: t("op_draft_msg"),
          deleteConfirm: t("op_delete_confirm"),
          keep: t("op_keep"),
          del: t("op_delete"),
          deleteExp: t("op_delete_exp"),
        }}
      />

      <Section title={t("op_sec_photos")} hint={t("op_sec_photos_hint")}>
        <ImageManager
          experienceId={exp.id}
          operatorId={operator.id}
          images={exp.images ?? []}
          labels={{
            cover: t("op_img_cover"),
            remove: t("op_img_remove"),
            noneTitle: t("op_img_none_title"),
            noneHint: t("op_img_none_hint"),
            uploading: t("op_img_uploading"),
            uploadFailed: t("op_img_upload_failed"),
            saveFailed: t("op_img_save_failed"),
          }}
        />
      </Section>

      <Section title={t("op_sec_details")}>
        <EditExperienceForm
          experience={exp}
          labels={{
            title: t("op_f_title"),
            desc: t("op_f_desc"),
            descPh: t("op_desc_ph"),
            category: t("op_f_category"),
            county: t("op_f_county"),
            choose: t("op_choose"),
            area: t("op_f_area"),
            areaPh: t("op_area_ph"),
            meeting: t("op_f_meeting"),
            meetingPh: t("op_meeting_ph"),
            meetingHint: t("op_meeting_hint"),
            price: t("op_f_price"),
            duration: t("op_f_duration"),
            durationPh: t("op_duration_ph"),
            maxParty: t("op_f_maxparty"),
            cancel: t("op_f_cancel"),
            cancelPh: t("op_cancel_ph"),
            cancelHint: t("op_cancel_hint"),
            saving: t("op_saving"),
            save: t("op_save_changes"),
            savedInstant: t("op_saved_instant"),
          }}
        />
      </Section>

      <Section
        title={t("op_sec_availability")}
        hint={t("op_sec_availability_hint")}
      >
        <SlotManager
          experienceId={exp.id}
          slots={slots ?? []}
          labels={{
            date: t("op_f_date"),
            time: t("op_f_time"),
            capacity: t("op_f_capacity"),
            repeat: t("op_f_repeat"),
            repeatHint: t("op_repeat_hint"),
            priceOverride: t("op_f_price_override"),
            priceOverridePh: t("op_price_override_ph"),
            adding: t("op_adding"),
            addSlot: t("op_add_slot"),
            close: t("op_slot_close"),
            remove: t("op_slot_remove"),
            slotAria: t("op_slot_aria"),
            addedOne: t("op_added_one"),
            addedMany: t("op_added_many"),
            noSlots: t("op_no_slots"),
            booked: t("op_booked"),
          }}
        />
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
