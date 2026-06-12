import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { NameForm } from "./name-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const profile = await getProfile();

  // Not signed in → sign in first.
  if (!profile) {
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/sign-in${q}`);
  }
  // Name already captured → nothing to do here.
  if (profile.name) {
    redirect(next?.startsWith("/") ? next : "/");
  }

  const t = await getT();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">{t("onb_title")}</h1>
        <p className="text-body text-muted">{t("onb_subtitle")}</p>
      </div>
      <NameForm
        next={next}
        labels={{
          nameLabel: t("onb_name_label"),
          continue: t("onb_continue"),
          saving: t("onb_saving"),
        }}
      />
    </main>
  );
}
