import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile(`/bookings/${id}/review`);

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
      <Notice title="Not yet">
        You can leave a review once your trip is complete.
        <Back experienceId={booking.experience_id} />
      </Notice>
    );
  }
  if (existingReview) {
    redirect(`/experiences/${booking.experience_id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/tickets" className="text-small text-muted">
        ← Your tickets
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Review {exp.title}</h1>
        <p className="text-small text-muted">
          Real reviews help other guests decide. Thank you.
        </p>
      </div>
      <ReviewForm bookingId={booking.id} experienceId={booking.experience_id} />
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

function Back({ experienceId }: { experienceId: string }) {
  return (
    <span className="mt-2 block">
      <Link href={`/experiences/${experienceId}`} className="text-small text-sunset">
        ← Back to the experience
      </Link>
    </span>
  );
}
