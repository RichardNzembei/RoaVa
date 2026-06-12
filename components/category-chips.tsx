import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";

// Pill chips linking into the browse page filtered by category.
export function CategoryChips({ active }: { active?: string }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {CATEGORIES.map((c) => {
        const selected = c === active;
        return (
          <Link
            key={c}
            href={`/experiences?category=${encodeURIComponent(c)}`}
            className={`text-small shrink-0 rounded-full px-3 py-2 ${
              selected
                ? "bg-accent-strong text-accent-contrast"
                : "border-hairline bg-surface text-foreground border"
            }`}
          >
            {c}
          </Link>
        );
      })}
    </div>
  );
}
