import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatKenyanPhone } from "@/lib/phone";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { AccountNameForm } from "./account-name-form";

export default async function AccountPage() {
  const profile = await requireProfile("/account");
  const locale = await getLocale();
  const isOperator = profile.role === "operator" || profile.role === "admin";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-8">
      <h1 className="text-h1 text-foreground">Your account</h1>

      <section className="flex flex-col gap-4">
        <AccountNameForm
          currentName={profile.name ?? ""}
          labels={{
            nameLabel: "Name",
            save: "Save",
            saving: "Saving…",
            saved: "Saved",
          }}
        />
        <div className="flex flex-col gap-1">
          <span className="text-small text-foreground">Phone</span>
          <span className="text-body text-muted">
            {profile.phone ? formatKenyanPhone(`+${profile.phone.replace(/^\+/, "")}`) : "—"}
          </span>
        </div>
      </section>

      <section className="border-hairline flex flex-col gap-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <span className="text-small text-foreground">Language</span>
          <LanguageToggle locale={locale} />
        </div>
        <ThemeToggle label="Theme" />
      </section>

      <nav className="border-hairline flex flex-col gap-3 border-t pt-6">
        <Link href="/tickets" className="text-body text-foreground">
          Your tickets
        </Link>
        <Link href="/wishlist" className="text-body text-foreground">
          Saved
        </Link>
        <Link href="/operator" className="text-body text-savanna">
          {isOperator ? "Operator dashboard" : "List with us"}
        </Link>
        <SignOutButton />
      </nav>
    </main>
  );
}
