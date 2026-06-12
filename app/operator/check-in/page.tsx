import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { CheckInScanner } from "./scanner";

export default async function CheckInPage() {
  await requireOperator("/operator/check-in");
  const t = await getT();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/operator" className="text-small text-muted">
        ← {t("op_back")}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">{t("op_checkin_title")}</h1>
        <p className="text-small text-muted">{t("op_checkin_body")}</p>
      </div>
      <CheckInScanner
        labels={{
          ok: t("scan_ok"),
          usedTitle: t("scan_used_title"),
          usedDetail: t("scan_used_detail"),
          notOwnerTitle: t("scan_not_owner_title"),
          notOwnerDetail: t("scan_not_owner_detail"),
          notConfirmedTitle: t("scan_not_confirmed_title"),
          notConfirmedDetail: t("scan_not_confirmed_detail"),
          invalidTitle: t("scan_invalid_title"),
          invalidDetail: t("scan_invalid_detail"),
          guestOne: t("guest_one"),
          guestMany: t("guest_many"),
          cameraTitle: t("scan_camera_title"),
          cameraDetail: t("scan_camera_detail"),
          stop: t("scan_stop"),
          start: t("scan_start"),
          unsupported: t("scan_unsupported"),
          orEnter: t("scan_or_enter"),
          codePh: t("scan_code_ph"),
          checking: t("scan_checking"),
          checkin: t("scan_checkin"),
        }}
      />
    </main>
  );
}
