"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { checkInTicket, type CheckInResult } from "./actions";

type ResultUI = {
  tone: "success" | "warning" | "danger";
  title: string;
  detail?: string;
};

export type ScannerLabels = {
  ok: string;
  usedTitle: string;
  usedDetail: string;
  notOwnerTitle: string;
  notOwnerDetail: string;
  notConfirmedTitle: string;
  notConfirmedDetail: string;
  invalidTitle: string;
  invalidDetail: string;
  guestOne: string;
  guestMany: string;
  cameraTitle: string;
  cameraDetail: string;
  stop: string;
  start: string;
  unsupported: string;
  orEnter: string;
  codePh: string;
  checking: string;
  checkin: string;
};

function present(r: CheckInResult, labels: ScannerLabels): ResultUI {
  switch (r.status) {
    case "ok":
      return {
        tone: "success",
        title: labels.ok,
        detail: [
          r.guest,
          r.party
            ? `${r.party} ${r.party === 1 ? labels.guestOne : labels.guestMany}`
            : null,
          r.experience,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    case "used":
      return {
        tone: "warning",
        title: labels.usedTitle,
        detail: `${labels.usedDetail}${r.guest ? ` (${r.guest})` : ""}.`,
      };
    case "not_owner":
      return { tone: "danger", title: labels.notOwnerTitle, detail: labels.notOwnerDetail };
    case "not_confirmed":
      return { tone: "danger", title: labels.notConfirmedTitle, detail: labels.notConfirmedDetail };
    default:
      return { tone: "danger", title: labels.invalidTitle, detail: labels.invalidDetail };
  }
}

const toneClasses: Record<ResultUI["tone"], string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function CheckInScanner({ labels }: { labels: ScannerLabels }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultUI | null>(null);
  const [scanning, setScanning] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Post-mount feature detection (BarcodeDetector is a client-only API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanScan(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  async function submit(value: string) {
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      const res = await checkInTicket(v);
      setResult(present(res, labels));
      setToken("");
    } finally {
      setBusy(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startCamera() {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // @ts-expect-error BarcodeDetector is not in TS lib yet.
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && codes[0].rawValue) {
            stopCamera();
            await submit(codes[0].rawValue);
            return;
          }
        } catch {
          // ignore per-frame detection errors
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setScanning(false);
      setResult({
        tone: "danger",
        title: labels.cameraTitle,
        detail: labels.cameraDetail,
      });
    }
  }

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="flex flex-col gap-5">
      {result ? (
        <div className={`rounded-card flex flex-col gap-1 p-5 ${toneClasses[result.tone]}`}>
          <span className="text-h2">{result.title}</span>
          {result.detail ? <span className="text-small">{result.detail}</span> : null}
        </div>
      ) : null}

      {scanning ? (
        <div className="flex flex-col gap-3">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-square w-full rounded-card bg-ink object-cover"
          />
          <Button variant="secondary" onClick={stopCamera}>
            {labels.stop}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {canScan ? (
            <Button onClick={startCamera} fullWidth disabled={busy}>
              {labels.start}
            </Button>
          ) : (
            <p className="text-caption text-muted">{labels.unsupported}</p>
          )}

          <div className="border-hairline rounded-card bg-surface flex flex-col gap-3 border p-4">
            <label htmlFor="token" className="text-small text-foreground">
              {labels.orEnter}
            </label>
            <input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={labels.codePh}
              className="border-hairline bg-background text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-4"
            />
            <Button onClick={() => submit(token)} disabled={busy || !token.trim()}>
              {busy ? labels.checking : labels.checkin}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
