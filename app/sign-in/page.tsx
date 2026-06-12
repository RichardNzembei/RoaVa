import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Already signed in — no reason to be here.
  if (await getUser()) {
    redirect(next?.startsWith("/") ? next : "/");
  }

  const t = await getT();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">{t("signin_title")}</h1>
        <p className="text-body text-muted">{t("signin_subtitle")}</p>
      </div>

      <SignInForm
        next={next}
        labels={{
          phoneLabel: t("signin_phone_label"),
          phoneHint: t("signin_phone_hint"),
          send: t("signin_send"),
          sending: t("signin_sending"),
          codeLabel: t("signin_code_label"),
          sentTo: t("signin_sent_to"),
          verify: t("signin_verify"),
          verifying: t("signin_verifying"),
          resend: t("signin_resend"),
          resendIn: t("signin_resend_in"),
          change: t("signin_change"),
        }}
      />
    </main>
  );
}
