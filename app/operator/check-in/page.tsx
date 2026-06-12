import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { CheckInScanner } from "./scanner";

export default async function CheckInPage() {
  await requireOperator("/operator/check-in");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/operator" className="text-small text-muted">
        ← Back to dashboard
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Check in guests</h1>
        <p className="text-small text-muted">
          Scan each guest&apos;s ticket QR. Each ticket works once.
        </p>
      </div>
      <CheckInScanner />
    </main>
  );
}
