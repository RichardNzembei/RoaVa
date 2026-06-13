import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getGiftByCode } from "@/lib/gifts";
import { formatSlotDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { ClaimButton } from "./claim-button";

export default async function GiftClaimPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  // Sign in (any method) to claim — the recipient becomes the booking owner.
  await requireProfile(`/gift/${code}`);
  const t = await getT();

  const gift = await getGiftByCode(code);

  if (!gift) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-5 py-16 text-center">
        <span className="text-display">🎁</span>
        <h1 className="text-h1 text-foreground">{t("gift_invalid_title")}</h1>
        <p className="text-body text-muted">{t("gift_invalid_body")}</p>
        <Link href="/discover" className="text-small text-sunset">
          {t("gift_browse")}
        </Link>
      </main>
    );
  }

  const b = gift.bookings as unknown as {
    status: string;
    experiences: { title: string } | null;
    availability_slots: { start_at: string } | null;
  };
  const title = b?.experiences?.title ?? "—";
  const when = b?.availability_slots
    ? formatSlotDateTime(b.availability_slots.start_at)
    : "—";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-display">🎁</span>
        <h1 className="text-h1 text-foreground">{t("gift_claim_title")}</h1>
        <p className="text-body text-muted">{t("gift_claim_subtitle")}</p>
      </div>

      <div className="border-hairline rounded-card bg-surface flex flex-col gap-2 border p-4">
        <span className="text-h3 text-foreground">{title}</span>
        <span className="text-small text-muted">{when}</span>
        {gift.message ? (
          <p className="text-body text-foreground border-hairline mt-1 border-t pt-3 italic">
            “{gift.message}”
          </p>
        ) : null}
      </div>

      {gift.claimed_at ? (
        <p className="text-small text-muted text-center">
          {t("gift_already_claimed")}
        </p>
      ) : (
        <ClaimButton
          code={code}
          labels={{
            claim: t("gift_claim_button"),
            claiming: t("gift_claiming"),
            errAlreadyClaimed: t("gift_err_already_claimed"),
            errNotReady: t("gift_err_not_ready"),
            errInvalid: t("gift_invalid_title"),
            errGeneric: t("err_save_retry"),
          }}
        />
      )}
    </main>
  );
}
