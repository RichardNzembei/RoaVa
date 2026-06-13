"use client";

import { useState } from "react";

// Shows the buyer the shareable claim link for a gift booking (or a confirmation
// once the recipient has claimed it).
export function GiftShare({
  claimUrl,
  claimed,
  recipient,
  labels,
}: {
  claimUrl: string;
  claimed: boolean;
  recipient: string;
  labels: { title: string; body: string; copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the link is visible to select manually
    }
  }

  return (
    <div
      className={`rounded-card flex flex-col gap-3 border p-4 ${
        claimed ? "border-success/40 bg-success/10" : "border-hairline bg-surface"
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-h3 text-foreground">🎁 {labels.title}</span>
        <span className="text-small text-muted">
          {labels.body.replace("{recipient}", recipient)}
        </span>
      </div>

      {claimed ? null : (
        <div className="flex flex-col gap-2">
          <code className="border-hairline bg-background text-caption text-foreground break-all rounded-base border px-3 py-2">
            {claimUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            className="border-hairline text-small text-savanna ease-out-soft min-h-12 rounded-base border bg-transparent px-4 active:scale-[0.97]"
          >
            {copied ? labels.copied : labels.copy}
          </button>
        </div>
      )}
    </div>
  );
}
