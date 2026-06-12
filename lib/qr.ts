import "server-only";

import QRCode from "qrcode";

// Render the ticket token as an inline SVG QR, server-side. Baking the SVG into
// the (service-worker-cached) ticket page is what makes the QR viewable offline
// at the gate (CLAUDE.md §8). High error correction survives a dim phone screen.
export async function renderQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#241F1C", light: "#FFFFFF" },
    width: 256,
  });
}
