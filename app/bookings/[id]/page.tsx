import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { manualPayment, publicEnv } from "@/lib/env";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { getGiftForBooking } from "@/lib/gifts";
import { BookingStatus } from "./booking-status";
import { GiftShare } from "./gift-share";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile(`/bookings/${id}`);
  const t = await getT();

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, status, party_size, amount_kes, experience_id, slot_id,
       experiences ( title ),
       availability_slots ( start_at )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const experience = booking.experiences as unknown as { title: string };
  const slot = booking.availability_slots as unknown as { start_at: string };

  // If this booking was bought as a gift, surface the shareable claim link.
  const gift = await getGiftForBooking(booking.id);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-10">
      <BookingStatus
        bookingId={booking.id}
        initialStatus={booking.status}
        title={experience.title}
        dateLabel={formatSlotDateTime(slot.start_at)}
        party={booking.party_size}
        amountLabel={formatKes(booking.amount_kes)}
        retryHref={`/experiences/${booking.experience_id}/book?slot=${booking.slot_id}&party=${booking.party_size}`}
        manualPaybill={manualPayment.enabled ? manualPayment.paybill : null}
        labels={{
          confirmedTitle: t("wait_confirmed"),
          confirmedBody: t("book_confirmed_body"),
          confirmedSms: t("book_confirmed_sms"),
          viewTicket: t("wait_view_ticket"),
          pendingTitle: t("wait_title"),
          pendingBody: t("book_pending_body"),
          waiting: t("book_waiting"),
          still: t("book_still"),
          tryAgain: t("wait_try_again"),
          tryIn: t("book_try_in"),
          payManual: t("wait_pay_manual"),
          manualDetail: t("book_manual_detail"),
          browseOther: t("wait_browse_other"),
          guestOne: t("guest_one"),
          guestMany: t("guest_many"),
          failure: {
            insufficient: {
              title: t("fail_insufficient_title"),
              detail: t("fail_insufficient_detail"),
            },
            pin: { title: t("fail_pin_title"), detail: t("fail_pin_detail") },
            cancel: {
              title: t("fail_cancel_title"),
              detail: t("fail_cancel_detail"),
            },
            timeout: {
              title: t("fail_timeout_title"),
              detail: t("fail_timeout_detail"),
            },
            network: {
              title: t("fail_network_title"),
              detail: t("fail_network_detail"),
            },
            generic: {
              title: t("fail_generic_title"),
              detail: t("fail_generic_detail"),
            },
          },
        }}
      />

      {gift ? (
        <GiftShare
          claimUrl={`${publicEnv.siteUrl}/gift/${gift.redemption_code}`}
          claimed={Boolean(gift.claimed_at)}
          recipient={gift.recipient_phone ?? gift.recipient_email ?? ""}
          labels={{
            title: gift.claimed_at ? t("gift_share_claimed_title") : t("gift_share_title"),
            body: gift.claimed_at
              ? t("gift_share_claimed_body")
              : t("gift_share_body"),
            copy: t("gift_share_copy"),
            copied: t("gift_share_copied"),
          }}
        />
      ) : null}
    </main>
  );
}
