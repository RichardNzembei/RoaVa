import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { ReviewForm } from "./review-form";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile(`/bookings/${id}/review`);
  const t = await getT();

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, status, experience_id,
       experiences ( title ),
       reviews ( id )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const exp = booking.experiences as unknown as { title: string };
  const existingReview = booking.reviews as unknown as { id: string } | null;

  // Only completed bookings can be reviewed; one review per booking.
  if (booking.status !== "completed") {
    return (
      <Notice title={t("review_not_yet_title")}>
        {t("review_not_yet_body")}
        <Back
          experienceId={booking.experience_id}
          label={t("review_back_experience")}
        />
      </Notice>
    );
  }
  if (existingReview) {
    redirect(`/experiences/${booking.experience_id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/tickets" className="text-small text-muted">
        ← {t("review_back_tickets")}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">
          {t("review_title").replace("{title}", exp.title)}
        </h1>
        <p className="text-small text-muted">{t("review_subtitle")}</p>
      </div>
      <ReviewForm
        bookingId={booking.id}
        experienceId={booking.experience_id}
        profileId={profile.id}
        labels={{
          yourRating: t("review_your_rating"),
          ratingAria: t("review_rating_aria"),
          starOne: t("review_star_one"),
          starMany: t("review_star_many"),
          yourReview: t("review_your_review"),
          placeholder: t("review_placeholder"),
          photos: t("review_photos"),
          uploading: t("review_uploading"),
          posting: t("review_posting"),
          post: t("review_post"),
        }}
      />
    </main>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-8">
      <h1 className="text-h1 text-foreground">{title}</h1>
      <p className="text-body text-muted">{children}</p>
    </main>
  );
}

function Back({
  experienceId,
  label,
}: {
  experienceId: string;
  label: string;
}) {
  return (
    <span className="mt-2 block">
      <Link href={`/experiences/${experienceId}`} className="text-small text-sunset">
        ← {label}
      </Link>
    </span>
  );
}
