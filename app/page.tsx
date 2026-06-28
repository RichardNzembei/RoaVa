import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchExperiences } from "@/lib/experiences";
import { ExperienceCard } from "@/components/experience-card";
import { HeroCarousel } from "@/components/hero-carousel";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { getT } from "@/lib/i18n";
import {
  HERO_IMAGES,
  HERO_VIDEO_SRC,
  OPERATOR_BAND_IMAGE,
} from "@/lib/marketing-media";

export const metadata: Metadata = {
  title: "RoaVa — discover, book, and experience Kenya",
  description:
    "Discover day-trips and experiences near Nairobi, book a slot, and pay with M-Pesa. Verified operators, real reviews, and a QR ticket that works offline.",
};

// Marketing landing (public front door). The live feed lives at /discover.
export default async function Landing() {
  const [featured, t] = await Promise.all([
    fetchExperiences({ upcomingOnly: true, limit: 3 }),
    getT(),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero — sunlit photo background with a slow Ken-Burns drift */}
      <section className="relative isolate overflow-hidden">
        <HeroCarousel images={HERO_IMAGES} videoSrc={HERO_VIDEO_SRC || undefined} />
        {/* Warm sunset wash for brand + text contrast (white on dark passes AA) */}
        <div className="from-ink/85 via-ink/55 to-sunset/45 absolute inset-0 -z-10 bg-gradient-to-t" />
        {/* Slow-drifting sunset glow — keeps the hero alive after the entrance
            settles. Low-alpha single radial layer, transform-only, behind text. */}
        <div
          aria-hidden
          className="animate-aurora absolute inset-0 -z-10 [background:radial-gradient(55%_45%_at_30%_65%,rgba(216,90,48,0.45),transparent_70%)]"
        />

        <div className="mx-auto flex min-h-[78vh] w-full max-w-2xl flex-col justify-end gap-6 px-5 pb-14 pt-24 text-white">
          <span className="animate-fade-up text-small/none opacity-90">
            {t("brand_descriptor")}
          </span>
          {/* Headline reveals word-by-word — each word rides up out of an
              overflow-hidden mask (the pb/-mb pair gives descenders like g/y
              room inside the clip without shifting layout). Words are
              inline-block so lines still wrap naturally; stagger is capped so a
              long (e.g. Kiswahili) title never drags the cascade out. */}
          <h1 className="text-hero max-w-xl">
            {t("hero_title")
              .split(" ")
              .map((word, i, arr) => (
                <Fragment key={i}>
                  <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                    <span
                      className="animate-word-mask inline-block"
                      style={{ animationDelay: `${140 + Math.min(i, 8) * 90}ms` }}
                    >
                      {word}
                    </span>
                  </span>
                  {i < arr.length - 1 ? " " : null}
                </Fragment>
              ))}
          </h1>
          <p className="animate-fade-up text-body max-w-md opacity-95 [animation-delay:460ms]">
            {t("hero_body")}
          </p>
          <div className="animate-fade-up flex flex-wrap gap-3 [animation-delay:580ms]">
            <Link
              href="/discover"
              className="bg-accent-strong text-accent-contrast ease-out-soft inline-flex min-h-12 items-center justify-center rounded-base px-5 text-h3 shadow-card transition-transform duration-200 active:scale-[0.97]"
            >
              {t("cta_explore")}
            </Link>
            <Link
              href="/operator"
              className="border-white/50 bg-white/10 ease-out-soft inline-flex min-h-12 items-center justify-center rounded-base border px-5 text-h3 backdrop-blur-md transition-colors duration-200 hover:bg-white/20"
            >
              {t("cta_list_experience")}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-5 py-16">
        {/* Why RoaVa */}
        <Reveal as="section" className="flex flex-col gap-5">
          <h2 className="text-display text-foreground">{t("why_title")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <ValueProp title={t("vp_mpesa_title")} body={t("vp_mpesa_body")} />
            <ValueProp title={t("vp_trust_title")} body={t("vp_trust_body")} />
            <ValueProp title={t("vp_local_title")} body={t("vp_local_body")} />
          </div>
        </Reveal>

        {/* Live preview */}
        {featured.length > 0 ? (
          <Reveal as="section" className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-display text-foreground">{t("popular_title")}</h2>
              <Link href="/discover" className="text-small text-sunset shrink-0">
                {t("see_all")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {featured.map((card, i) => (
                <ExperienceCard key={card.id} card={card} index={i} />
              ))}
            </div>
          </Reveal>
        ) : null}

        {/* How it works */}
        <Reveal as="section" className="flex flex-col gap-5">
          <h2 className="text-display text-foreground">{t("how_title")}</h2>
          <ol className="flex flex-col gap-4">
            <Step n={1} title={t("step1_title")}>
              {t("step1_body")}
            </Step>
            <Step n={2} title={t("step2_title")}>
              {t("step2_body")}
            </Step>
            <Step n={3} title={t("step3_title")}>
              {t("step3_body")}
            </Step>
          </ol>
        </Reveal>

        {/* Operators — photo-backed band */}
        <Reveal
          as="section"
          className="shadow-card relative isolate flex min-h-64 flex-col justify-end overflow-hidden rounded-card"
        >
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OPERATOR_BAND_IMAGE}
              alt=""
              loading="lazy"
              className="animate-kenburns h-full w-full object-cover"
            />
            <div className="from-savanna/95 via-savanna/70 to-ink/40 absolute inset-0 bg-gradient-to-tr" />
          </div>
          <div className="flex flex-col gap-3 p-7 text-white">
            <h2 className="text-display">{t("ops_title")}</h2>
            <p className="text-body max-w-md opacity-95">{t("ops_body")}</p>
            <Link
              href="/operator"
              className="bg-surface text-savanna ease-out-soft mt-1 inline-flex min-h-12 w-fit items-center justify-center rounded-base px-5 text-h3 shadow-card transition-transform duration-200 active:scale-[0.97]"
            >
              {t("nav_list")}
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <footer className="border-hairline border-t">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 py-8">
          <Logo />
          <p className="text-caption text-muted">{t("footer_blurb")}</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/discover" className="text-small text-foreground">
              {t("nav_explore")}
            </Link>
            <Link href="/experiences" className="text-small text-foreground">
              {t("footer_search")}
            </Link>
            <Link href="/operator" className="text-small text-foreground">
              {t("nav_list")}
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function ValueProp({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-hairline rounded-card bg-surface shadow-card ease-out-soft flex flex-col gap-1.5 border p-5 transition-transform duration-300 hover:-translate-y-1">
      <h3 className="text-h3 text-foreground">{title}</h3>
      <p className="text-small text-muted">{body}</p>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="bg-accent-soft text-sunset text-h3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        {n}
      </span>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-h3 text-foreground">{title}</h3>
        <p className="text-small text-muted">{children}</p>
      </div>
    </li>
  );
}
