import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest. Icons: scalable SVG + raster PNGs (any) +
// maskable PNGs. Regenerate the PNGs from the SVG marks with `pnpm icons`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RoaVa — discover · book · experience",
    short_name: "RoaVa",
    description:
      "Discover and book day-trips and experiences near Nairobi. Pay with M-Pesa.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f3ee",
    theme_color: "#d85a30",
    lang: "en",
    categories: ["travel", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
