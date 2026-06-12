import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-display text-foreground">Not found</h1>
      <p className="text-body text-muted">
        This page or experience isn&apos;t here. It may have been unpublished or
        the link is off.
      </p>
      <Link href="/experiences" className={buttonClasses("primary")}>
        Explore experiences
      </Link>
    </main>
  );
}
