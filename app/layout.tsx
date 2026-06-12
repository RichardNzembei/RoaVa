import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/analytics";

// Humanist sans, two weights only (400/500) to keep rendering crisp and the
// bundle light on low-end Android (Section 1 + performance budget).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoaVa — discover · book · experience",
  description:
    "Discover and book day-trips and experiences near Nairobi. Pay with M-Pesa.",
  applicationName: "RoaVa",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "RoaVa",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#17120f" },
  ],
  width: "device-width",
  initialScale: 1,
  // Allow zoom for accessibility; do not lock scaling.
  maximumScale: 5,
};

// Apply the saved theme before paint to avoid a flash. Defaults to system.
const themeScript = `(function(){try{var t=localStorage.getItem('roava-theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark')}else if(t==='light'){d.classList.add('light')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <ServiceWorkerRegistrar />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
