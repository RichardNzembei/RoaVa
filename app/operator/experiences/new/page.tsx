import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { CreateExperienceForm } from "./create-form";

export default async function NewExperiencePage() {
  await requireOperator();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/operator" className="text-small text-muted">
        ← Back to dashboard
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">New experience</h1>
        <p className="text-body text-muted">
          Start with the basics. You&apos;ll add photos, times, and details
          before it goes live.
        </p>
      </div>
      <CreateExperienceForm />
    </main>
  );
}
