import "server-only";

import { cookies } from "next/headers";

// Lightweight bilingual layer (English / Kiswahili) — no heavy i18n framework.
// Locale is a cookie; server components read it and pick the dictionary. Money
// and legal copy stays in clear standard language (design spec §8).

export type Locale = "en" | "sw";
export const LOCALES: Locale[] = ["en", "sw"];
export const LOCALE_COOKIE = "roava-locale";

const en = {
  // header / nav
  nav_explore: "Explore",
  nav_tickets: "Tickets",
  nav_signin: "Sign in",
  nav_operator: "Operator",
  nav_list: "List with us",
  nav_signout: "Sign out",
  nav_account: "Account",

  // landing hero
  brand_descriptor: "discover · book · experience",
  hero_title: "Kenya, from every angle",
  hero_body:
    "You haven't seen all of your own country yet. Find the hidden gems and day-trips worth leaving the house for near Nairobi — and book in a couple of taps.",
  cta_explore: "Explore experiences",
  cta_list_experience: "List your experience",

  // landing value props
  why_title: "Built for how Kenya moves",
  vp_mpesa_title: "Pay with M-Pesa",
  vp_mpesa_body:
    "Pay the way Kenya pays. A single STK prompt — no cards, no fuss. Your booking is only confirmed once payment clears.",
  vp_trust_title: "Trust, built in",
  vp_trust_body:
    "Verified operators, real reviews with photos, and clear cancellation terms before you pay. Your ticket is a signed QR, used once.",
  vp_local_title: "Truly local",
  vp_local_body:
    "Hidden gems and county-level experiences the global apps miss — surfaced by what's near you and on this week.",

  // landing popular + how it works
  popular_title: "Popular near Nairobi",
  see_all: "See all",
  how_title: "How it works",
  step1_title: "Find something worth doing",
  step1_body: "Browse by category, area, or what's on this weekend.",
  step2_title: "Book a slot",
  step2_body:
    "Pick a date and party size. See the exact price in KES before you commit.",
  step3_title: "Pay with M-Pesa, show your QR",
  step3_body:
    "Approve the prompt on your phone and get a QR ticket that works offline at the meeting point.",

  // landing operators band
  ops_title: "Run experiences?",
  ops_body:
    "Take bookings, get paid straight to M-Pesa, and reach guests actively looking for what you offer — without the pen-and-paper chaos. Listing is free; you keep the lion's share of every sale.",
  footer_blurb:
    "discover · book · experience — day-trips and experiences near Nairobi. Prices in Kenyan shillings (KES). English & Kiswahili.",
  footer_search: "Search",

  // sign-in
  signin_title: "Sign in or sign up",
  signin_subtitle: "Use your phone number — no password needed.",
  signin_phone_label: "Phone number",
  signin_phone_hint:
    "We'll text you a code to sign in. Standard rates may apply.",
  signin_send: "Send code",
  signin_sending: "Just a moment…",
  signin_code_label: "Enter the 6-digit code",
  signin_sent_to: "Sent to",
  signin_verify: "Verify and continue",
  signin_verifying: "Just a moment…",
  signin_resend: "Resend code",
  signin_resend_in: "Resend code in",
  signin_change: "Change number",

  // onboarding
  onb_title: "Welcome to RoaVa",
  onb_subtitle:
    "One quick thing — your name helps operators know who's coming.",
  onb_name_label: "What should we call you?",
  onb_continue: "Continue",
  onb_saving: "Saving…",

  // language
  lang_label: "Language",
} as const;

export type TranslationKey = keyof typeof en;

const sw: Record<TranslationKey, string> = {
  nav_explore: "Gundua",
  nav_tickets: "Tikiti",
  nav_signin: "Ingia",
  nav_operator: "Opereta",
  nav_list: "Orodhesha nasi",
  nav_signout: "Toka",
  nav_account: "Akaunti",

  brand_descriptor: "gundua · weka · furahia",
  hero_title: "Kenya, kwa kila pembe",
  hero_body:
    "Hujaona kila kona ya nchi yako bado. Pata maeneo ya kipekee na safari za siku zinazostahili karibu na Nairobi — na uweke nafasi kwa mibofyo michache.",
  cta_explore: "Gundua matukio",
  cta_list_experience: "Orodhesha tukio lako",

  why_title: "Imejengwa kwa jinsi Kenya inavyosafiri",
  vp_mpesa_title: "Lipa na M-Pesa",
  vp_mpesa_body:
    "Lipa jinsi Kenya inavyolipa. Ujumbe mmoja wa STK — bila kadi, bila usumbufu. Nafasi yako huthibitishwa pale tu malipo yanapokamilika.",
  vp_trust_title: "Uaminifu, umejengwa ndani",
  vp_trust_body:
    "Waendeshaji waliothibitishwa, maoni halisi yenye picha, na masharti ya kughairi wazi kabla ya kulipa. Tikiti yako ni QR iliyosainiwa, hutumika mara moja.",
  vp_local_title: "Ya kienyeji kweli",
  vp_local_body:
    "Maeneo ya kipekee na matukio ya kaunti ambayo programu za kimataifa hukosa — yanaonyeshwa kulingana na yaliyo karibu nawe na wiki hii.",

  popular_title: "Maarufu karibu na Nairobi",
  see_all: "Ona zote",
  how_title: "Jinsi inavyofanya kazi",
  step1_title: "Pata jambo la kufanya",
  step1_body: "Vinjari kwa aina, eneo, au yaliyopo wikendi hii.",
  step2_title: "Weka nafasi",
  step2_body:
    "Chagua tarehe na idadi ya wageni. Ona bei kamili kwa KES kabla ya kuthibitisha.",
  step3_title: "Lipa na M-Pesa, onyesha QR yako",
  step3_body:
    "Idhinisha ujumbe kwenye simu yako na upate tikiti ya QR inayofanya kazi bila intaneti mahali pa kukutana.",

  ops_title: "Unaendesha matukio?",
  ops_body:
    "Pokea nafasi, lipwa moja kwa moja kwa M-Pesa, na ufikie wageni wanaotafuta unachotoa — bila fujo za karatasi. Kuorodhesha ni bure; unabaki na sehemu kubwa ya kila mauzo.",
  footer_blurb:
    "gundua · weka · furahia — safari za siku na matukio karibu na Nairobi. Bei kwa shilingi za Kenya (KES). Kiingereza na Kiswahili.",
  footer_search: "Tafuta",

  signin_title: "Ingia au jisajili",
  signin_subtitle: "Tumia namba yako ya simu — hakuna nenosiri.",
  signin_phone_label: "Namba ya simu",
  signin_phone_hint:
    "Tutakutumia msimbo wa kuingia. Ada za kawaida zaweza kutumika.",
  signin_send: "Tuma msimbo",
  signin_sending: "Subiri kidogo…",
  signin_code_label: "Weka msimbo wa tarakimu 6",
  signin_sent_to: "Imetumwa kwa",
  signin_verify: "Thibitisha na uendelee",
  signin_verifying: "Subiri kidogo…",
  signin_resend: "Tuma tena msimbo",
  signin_resend_in: "Tuma tena baada ya",
  signin_change: "Badilisha namba",

  onb_title: "Karibu RoaVa",
  onb_subtitle:
    "Jambo moja haraka — jina lako husaidia waendeshaji kujua nani anakuja.",
  onb_name_label: "Tukuite nani?",
  onb_continue: "Endelea",
  onb_saving: "Inahifadhi…",

  lang_label: "Lugha",
};

const dictionaries = { en, sw };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "sw" ? "sw" : "en";
}

export type Translator = (key: TranslationKey) => string;

// Server-side translator. For client components, resolve the strings you need
// and pass them in as props (see SignInForm).
export async function getT(): Promise<Translator> {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return (key) => dict[key] ?? en[key];
}

// A whole dictionary for a locale — handy to hand a labels bundle to a client
// component.
export async function getDict(): Promise<Record<TranslationKey, string>> {
  const locale = await getLocale();
  return dictionaries[locale];
}
