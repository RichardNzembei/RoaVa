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
  signin_subtitle: "No password needed — use your phone, email, or Google.",
  signin_method_phone: "Phone",
  signin_method_email: "Email",
  signin_phone_label: "Phone number",
  signin_phone_hint:
    "We'll text you a code to sign in. Standard rates may apply.",
  signin_email_label: "Email address",
  signin_email_hint: "We'll email you a code to sign in.",
  signin_send: "Send code",
  signin_sending: "Just a moment…",
  signin_code_label: "Enter the code we sent you",
  signin_sent_to: "Sent to",
  signin_verify: "Verify and continue",
  signin_verifying: "Just a moment…",
  signin_resend: "Resend code",
  signin_resend_in: "Resend code in",
  signin_change: "Use a different method",
  signin_or: "or",
  signin_google: "Continue with Google",

  // onboarding
  onb_title: "Welcome to RoaVa",
  onb_subtitle:
    "One quick thing — your name helps operators know who's coming.",
  onb_name_label: "What should we call you?",
  onb_continue: "Continue",
  onb_saving: "Saving…",

  // discover feed
  discover_title: "Find your next day out",
  discover_subtitle:
    "Day-trips and experiences near Nairobi — book a slot, pay with M-Pesa.",
  discover_search: "Search experiences, places, dates…",
  discover_browse_category: "Browse by category",
  discover_this_week: "This week",
  discover_this_week_sub: "Slots in the next 7 days",
  discover_all: "All experiences",
  discover_all_sub: "Fresh finds near you",
  discover_empty: "Nothing here yet — check back soon.",
  lead_from: "from",
  per_person: "/ person",
  verified_badge: "Verified",
  ticket_ref: "Booking ref",
  ticket_note:
    "Show this QR at the meeting point. It works offline — keep this page open. Each ticket can be used once.",
  ticket_preparing: "Your ticket is being prepared. Refresh in a moment.",

  // tickets
  tickets_title: "Your tickets",
  tickets_empty_title: "No tickets yet",
  tickets_empty_body:
    "Book an experience and your QR ticket will appear here — ready to show even without signal.",
  tickets_explore: "Explore experiences",
  ticket_valid: "Valid",
  ticket_used: "Used",
  ticket_review: "★ Leave a review",
  guest_one: "guest",
  guest_many: "guests",

  // booking waiting / result
  wait_title: "Check your phone",
  wait_confirmed: "Booking confirmed",
  wait_view_ticket: "View your ticket",
  wait_back_home: "Back to home",
  wait_try_again: "Try again",
  wait_try_in: "Try again in",
  wait_browse_other: "Browse other experiences",
  wait_pay_manual: "Pay manually instead",

  // experience detail
  detail_back: "Back to browse",
  detail_verified: "Verified operator",
  detail_about: "About this experience",
  detail_duration_about: "Duration: about",
  hour_one: "hour",
  hour_many: "hours",
  detail_meeting: "Meeting point",
  detail_cancellation: "Cancellation policy",
  detail_reviews: "Reviews",
  detail_no_reviews: "No reviews yet — be the first after your visit.",
  detail_price_note:
    "Prices in Kenyan shillings (KES). Pay securely with M-Pesa at checkout.",

  // slot picker
  slot_choose_date: "Choose a date",
  slot_guests: "Guests",
  slot_seats: "{n} seats",
  slot_only_left: "Only {n} left",
  slot_fewer: "Fewer guests",
  slot_more: "More guests",
  slot_continue: "Continue",
  slot_none: "No upcoming dates right now. Check back soon or save it for later.",

  // checkout
  checkout_back: "Back",
  checkout_title: "Confirm and pay",
  checkout_experience: "Experience",
  checkout_date: "Date",
  checkout_guests: "Guests",
  checkout_meeting: "Meeting point",
  checkout_total: "Total",
  checkout_unavailable_title: "That slot isn't available",
  checkout_unavailable_body: "Pick another date for {title}.",
  checkout_back_experience: "Back to the experience",
  checkout_mpesa_label: "M-Pesa number",
  checkout_mpesa_hint:
    "We'll send a prompt to this number — enter your M-Pesa PIN to confirm.",
  checkout_pay: "Pay with M-Pesa",
  checkout_paying: "Sending prompt…",
  checkout_pay_note: "You only pay once you approve the prompt on your phone.",

  // gifting (diaspora)
  gift_toggle: "Gift this to someone",
  gift_recipient_label: "Recipient's phone or email",
  gift_recipient_hint: "We'll create a claim link you can share with them.",
  gift_message_label: "Message (optional)",
  gift_share_title: "Gift ready to send",
  gift_share_body: "Share this link with {recipient} — they sign in and the ticket becomes theirs.",
  gift_share_claimed_title: "Gift claimed",
  gift_share_claimed_body: "{recipient} has claimed this gift — the ticket is now theirs.",
  gift_share_copy: "Copy claim link",
  gift_share_copied: "Copied ✓",
  gift_invalid_title: "Gift not found",
  gift_invalid_body: "This claim link isn't valid. Check it and try again.",
  gift_browse: "Browse experiences",
  gift_claim_title: "You've been gifted an experience",
  gift_claim_subtitle: "Claim it to add the ticket to your wallet.",
  gift_claim_button: "Claim my gift",
  gift_claiming: "Just a moment…",
  gift_already_claimed: "This gift has already been claimed.",
  gift_err_already_claimed: "Sorry — someone has already claimed this gift.",
  gift_err_not_ready: "The payment is still processing. Check back in a moment.",

  // booking result — confirmed / pending / manual fallback
  book_confirmed_body: "You're all set for {title} on {date}.",
  book_confirmed_sms: "We've sent your booking reference to your phone.",
  book_pending_body:
    "We've sent an M-Pesa prompt — enter your PIN to confirm {amount} for {title}.",
  book_waiting: "Waiting for confirmation… {n}s",
  book_still: "Still confirming — hang tight, this can take a moment.",
  book_try_in: "Try again in {n}s",
  book_manual_detail:
    "M-Pesa Paybill {paybill}, account {ref}, amount {amount}. We'll confirm once received.",

  // booking failure modes (§6.5)
  fail_insufficient_title: "Not enough M-Pesa balance",
  fail_insufficient_detail: "Top up or use Fuliza, then try again.",
  fail_pin_title: "Wrong M-Pesa PIN",
  fail_pin_detail: "Try again and enter your PIN carefully.",
  fail_cancel_title: "Payment cancelled",
  fail_cancel_detail: "You dismissed the prompt. Try again when you're ready.",
  fail_timeout_title: "The prompt timed out",
  fail_timeout_detail:
    "We didn't get a response in time. Resend and check your phone.",
  fail_network_title: "Network hiccup",
  fail_network_detail: "M-Pesa was briefly unreachable. Please try again.",
  fail_generic_title: "Payment didn't go through",
  fail_generic_detail: "Something went wrong. You can try again.",

  // review
  review_not_yet_title: "Not yet",
  review_not_yet_body: "You can leave a review once your trip is complete.",
  review_back_experience: "Back to the experience",
  review_back_tickets: "Your tickets",
  review_title: "Review {title}",
  review_subtitle: "Real reviews help other guests decide. Thank you.",
  review_your_rating: "Your rating",
  review_rating_aria: "Rating",
  review_star_one: "{n} star",
  review_star_many: "{n} stars",
  review_your_review: "Your review",
  review_placeholder: "How was it? What should other guests know?",
  review_photos: "Photos (optional)",
  review_uploading: "Uploading…",
  review_posting: "Posting…",
  review_post: "Post review",

  // browse / search
  browse_title: "Browse experiences",
  browse_result_one: "{n} result",
  browse_result_many: "{n} results",
  browse_search_ph: "Search experiences, places…",
  browse_search_aria: "Search",
  browse_cat: "Category",
  browse_any_cat: "Any category",
  browse_county: "County",
  browse_any_county: "Any county",
  browse_date: "Date",
  browse_max_price: "Max price (KES)",
  browse_price_any: "Any",
  browse_guests: "Guests",
  browse_search: "Search",
  browse_clear: "Clear filters",
  browse_none_title: "No experiences match",
  browse_none_body: "Try widening your dates, price, or area.",

  // wishlist
  wishlist_title: "Saved",
  wishlist_empty_title: "Nothing saved yet",
  wishlist_empty_body: "Tap “Save” on any experience to keep it here for later.",
  wishlist_explore: "Explore experiences",
  wishlist_remove: "Remove from saved",
  wishlist_save_aria: "Save for later",
  wishlist_saved: "Saved",
  wishlist_save: "Save",

  // shared operator
  op_back: "Back to dashboard",
  op_published: "Published",
  op_draft: "Draft",
  date_one: "date",
  date_many: "dates",

  // operator dashboard
  op_list_title: "List with RoaVa",
  op_list_body:
    "Take bookings and get paid to M-Pesa. Reach guests looking for exactly what you offer — no pen-and-paper chaos.",
  op_verified: "verified",
  op_your_experiences: "Your experiences",
  op_earnings: "Earnings",
  op_checkin: "Check in",
  op_new: "New",
  op_none_title: "No experiences yet",
  op_none_body:
    "Create your first listing — it starts as a draft, so nothing goes live until you publish it.",
  op_create_first: "Create your first experience",

  // become operator
  op_setup: "Setting up…",
  op_start_listing: "Start listing",
  op_biz_name: "Business name",
  op_biz_ph: "e.g. Rift Valley Treks",
  op_biz_hint: "This is what guests will see on your listings.",

  // new experience
  op_new_title: "New experience",
  op_new_body:
    "Start with the basics. You'll add photos, times, and details before it goes live.",
  op_creating: "Creating…",
  op_create_draft: "Create draft",

  // experience form fields (create + edit)
  op_f_title: "Title",
  op_title_ph: "e.g. Sunrise hike up Ngong Hills",
  op_f_category: "Category",
  op_cat_ph: "Choose a category",
  op_f_county: "County",
  op_county_ph: "Choose a county",
  op_choose: "Choose",
  op_f_price: "Price per person (KES)",
  op_price_ph: "e.g. 3500",
  op_price_hint: "You can fine-tune everything else next.",
  op_f_desc: "Description",
  op_desc_ph: "What makes this worth doing? What's included?",
  op_f_area: "Area / neighbourhood",
  op_area_ph: "e.g. Karen",
  op_f_meeting: "Meeting point",
  op_meeting_ph: "Where exactly should guests meet you?",
  op_meeting_hint: "Required before publishing.",
  op_f_duration: "Duration (minutes)",
  op_duration_ph: "e.g. 180",
  op_f_maxparty: "Max party size per booking",
  op_f_cancel: "Cancellation policy",
  op_cancel_ph: "e.g. Free cancellation up to 24 hours before.",
  op_cancel_hint: "Shown to guests before they pay.",
  op_saving: "Saving…",
  op_save_changes: "Save changes",
  op_saved_instant: "Saved changes appear instantly.",

  // manage experience
  op_view_guests: "View guests",
  op_sec_photos: "Photos",
  op_sec_photos_hint: "The first photo is the cover. Up to 8.",
  op_sec_details: "Details",
  op_sec_availability: "Availability",
  op_sec_availability_hint:
    "Each time slot has its own capacity. Guests book a specific slot.",

  // publish controls
  op_publishing: "Publishing…",
  op_publish: "Publish",
  op_live_msg: "This experience is live and bookable.",
  op_unpublish: "Unpublish",
  op_draft_msg: "Draft — only you can see this.",
  op_delete_confirm: "Delete this experience for good?",
  op_keep: "Keep",
  op_delete: "Delete",
  op_delete_exp: "Delete experience",

  // slot manager
  op_adding: "Adding…",
  op_add_slot: "Add slot",
  op_slot_close: "Close",
  op_slot_remove: "Remove",
  op_slot_aria: "{action} slot {date}",
  op_f_date: "Date",
  op_f_time: "Time",
  op_f_capacity: "Capacity",
  op_f_repeat: "Repeat weekly (weeks)",
  op_repeat_hint: "1 = just this date.",
  op_f_price_override: "Price override (KES, optional)",
  op_price_override_ph: "Leave blank to use the base price",
  op_added_one: "Added {n} slot.",
  op_added_many: "Added {n} slots.",
  op_no_slots: "No time slots yet. Add at least one upcoming slot to publish.",
  op_booked: "{booked}/{capacity} booked",

  // image manager
  op_img_cover: "Cover",
  op_img_remove: "Remove photo",
  op_img_none_title: "No photos yet",
  op_img_none_hint: "Add a sunlit, people-present shot",
  op_img_uploading: "Uploading…",
  op_img_upload_failed: "Upload failed. Check your connection and try again.",
  op_img_save_failed: "Couldn't save the photo.",

  // guests roster
  op_guests_title: "Guests",
  op_guests_summary: "{g} {gUnit} booked across {d} {dUnit}.",
  op_guests_none:
    "No confirmed bookings yet. Guests appear here once they've paid.",
  op_guest_fallback: "Guest",
  op_checked_in: "Checked in",
  op_expected: "Expected",

  // check-in + scanner
  op_checkin_title: "Check in guests",
  op_checkin_body: "Scan each guest's ticket QR. Each ticket works once.",
  scan_ok: "Checked in ✓",
  scan_used_title: "Already used",
  scan_used_detail: "This ticket was already checked in",
  scan_not_owner_title: "Not your experience",
  scan_not_owner_detail: "This ticket belongs to another operator.",
  scan_not_confirmed_title: "Not confirmed",
  scan_not_confirmed_detail: "This booking isn't paid/confirmed.",
  scan_invalid_title: "Invalid ticket",
  scan_invalid_detail: "We couldn't verify this code.",
  scan_camera_title: "Camera unavailable",
  scan_camera_detail: "Allow camera access, or paste the code below.",
  scan_stop: "Stop scanning",
  scan_start: "Scan a ticket",
  scan_unsupported:
    "Camera scanning isn't supported on this device — paste the ticket code below.",
  scan_or_enter: "Or enter the ticket code",
  scan_code_ph: "Paste the scanned code",
  scan_checking: "Checking…",
  scan_checkin: "Check in",

  // earnings & payouts
  pay_title: "Earnings & payouts",
  pay_subtitle: "Your share after the RoaVa commission. Paid to your M-Pesa.",
  pay_net: "Net earned",
  pay_paid: "Paid out",
  pay_sending: "Sending",
  pay_owed: "Owed",
  pay_none: "No completed trips yet. Earnings appear here after guests attend.",
  pay_badge_paid: "Paid",
  pay_badge_failed: "Failed",
  pay_send: "Send payout",
  pay_retry: "Retry payout",
  pay_gross_fee: "Gross {gross} · fee {fee}",
  pay_failed_msg:
    "That payout did not go through. Check your M-Pesa number and try again.",
  pay_need_number: "Add your M-Pesa payout number above to send this.",
  pay_noncustodial:
    "RoaVa is non-custodial: payments settle through the licensed provider and your share is disbursed to your M-Pesa — funds are never held by RoaVa. Total handled: {total}.",
  pay_saving: "Saving…",
  pay_update: "Update",
  pay_save: "Save",
  pay_num_title: "Payout number",
  pay_num_set: "Payouts go to {phone}.",
  pay_num_unset:
    "Add the M-Pesa number to receive your payouts — required to get paid.",
  pay_num_label: "M-Pesa number",
  pay_num_saved: "Payout number saved.",

  // server-action error / validation messages
  err_phone_invalid: "Enter a valid Kenyan phone number, e.g. 0712 345 678.",
  err_email_invalid: "Enter a valid email address.",
  err_oauth: "Couldn't sign in with that provider. Please try again.",
  err_otp_ratelimit: "Too many code requests. Please wait a few minutes and try again.",
  err_otp_empty: "Enter the code we sent you.",
  err_otp_bad: "That code didn't work. Check it or request a new one.",
  err_otp_send: "We couldn't send the code. Check the number and try again in a moment.",
  err_name_empty: "Please enter your name.",
  err_name_long: "That name is too long.",
  err_signin_again: "Please sign in again.",
  err_save_retry: "We couldn't save that. Please try again.",
  err_biz_empty: "Enter your business name.",
  err_biz_long: "That business name is too long.",
  err_op_setup: "We couldn't set up your operator account. Please try again.",
  err_op_finish: "We couldn't finish setup. Please try again.",
  err_exp_title: "Give your experience a title.",
  err_exp_category: "Choose a category.",
  err_exp_county: "Choose a county.",
  err_exp_price: "Enter a valid price in KES.",
  err_exp_create: "We couldn't create that. Please try again.",
  err_exp_duration: "Duration must be a whole number of minutes.",
  err_exp_maxparty: "Max party size must be a positive whole number.",
  err_exp_save: "We couldn't save changes. Please try again.",
  err_exp_notfound: "Experience not found.",
  err_exp_photo: "Add at least one photo before publishing.",
  err_exp_meeting: "Add a meeting point before publishing.",
  err_exp_slotreq: "Add at least one upcoming time slot before publishing.",
  err_exp_publish: "We couldn't publish. Please try again.",
  err_img_path: "Unexpected upload path.",
  err_img_max: "Up to {n} photos.",
  err_img_save: "Couldn't save the photo.",
  err_slot_datetime: "Choose a date and time.",
  err_slot_capacity: "Capacity must be between 1 and 1000.",
  err_slot_repeat: "Repeat must be 1 to {n} weeks.",
  err_slot_price: "Price override must be a whole KES amount.",
  err_slot_invalid: "That date/time isn't valid.",
  err_slot_future: "Pick a time in the future.",
  err_slot_add: "We couldn't add those slots. Please try again.",
  err_msisdn_invalid: "Enter a valid M-Pesa number, e.g. 0712 345 678.",
  err_review_rating: "Tap a star rating from 1 to 5.",
  err_review_long: "Please keep your review under 1000 characters.",
  err_review_post:
    "We couldn't post that review. You can only review a trip you've completed, once.",
  err_book_guests: "Choose at least one guest.",
  err_book_ratelimit:
    "You've started a lot of bookings. Please wait a moment and try again.",
  err_book_slot_notfound: "That time slot wasn't found.",
  err_book_slot_unavail: "That time slot is no longer available.",
  err_book_exp_unavail: "This experience isn't available right now.",
  err_book_maxparty: "Up to {n} guests per booking.",
  err_book_generic: "Something went wrong. Please try again.",
  err_book_taken: "Sorry — those seats were just taken. Pick another date.",
  err_book_start: "Couldn't start your booking. Please try again.",
  err_book_paystart: "Couldn't start payment. Please try again.",
  err_book_mpesa: "We couldn't reach M-Pesa. Please try again in a moment.",

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
  signin_subtitle:
    "Hakuna nenosiri — tumia simu, barua pepe, au Google.",
  signin_method_phone: "Simu",
  signin_method_email: "Barua pepe",
  signin_phone_label: "Namba ya simu",
  signin_phone_hint:
    "Tutakutumia msimbo wa kuingia. Ada za kawaida zaweza kutumika.",
  signin_email_label: "Anwani ya barua pepe",
  signin_email_hint: "Tutakutumia msimbo kwa barua pepe.",
  signin_send: "Tuma msimbo",
  signin_sending: "Subiri kidogo…",
  signin_code_label: "Weka msimbo tuliokutumia",
  signin_sent_to: "Imetumwa kwa",
  signin_verify: "Thibitisha na uendelee",
  signin_verifying: "Subiri kidogo…",
  signin_resend: "Tuma tena msimbo",
  signin_resend_in: "Tuma tena baada ya",
  signin_change: "Tumia njia nyingine",
  signin_or: "au",
  signin_google: "Endelea na Google",

  onb_title: "Karibu RoaVa",
  onb_subtitle:
    "Jambo moja haraka — jina lako husaidia waendeshaji kujua nani anakuja.",
  onb_name_label: "Tukuite nani?",
  onb_continue: "Endelea",
  onb_saving: "Inahifadhi…",

  discover_title: "Pata shughuli yako ya siku",
  discover_subtitle:
    "Safari za siku na matukio karibu na Nairobi — weka nafasi, lipa na M-Pesa.",
  discover_search: "Tafuta matukio, maeneo, tarehe…",
  discover_browse_category: "Vinjari kwa aina",
  discover_this_week: "Wiki hii",
  discover_this_week_sub: "Nafasi katika siku 7 zijazo",
  discover_all: "Matukio yote",
  discover_all_sub: "Mapya karibu nawe",
  discover_empty: "Hakuna kitu bado — angalia tena hivi karibuni.",
  lead_from: "kuanzia",
  per_person: "/ mtu",
  verified_badge: "Imethibitishwa",
  ticket_ref: "Kumbukumbu ya nafasi",
  ticket_note:
    "Onyesha QR hii mahali pa kukutana. Inafanya kazi bila intaneti — acha ukurasa huu wazi. Kila tikiti hutumika mara moja.",
  ticket_preparing: "Tikiti yako inaandaliwa. Onyesha upya baada ya muda.",

  tickets_title: "Tikiti zako",
  tickets_empty_title: "Hakuna tikiti bado",
  tickets_empty_body:
    "Weka nafasi ya tukio na tikiti yako ya QR itaonekana hapa — tayari kuonyesha hata bila mtandao.",
  tickets_explore: "Gundua matukio",
  ticket_valid: "Halali",
  ticket_used: "Imetumika",
  ticket_review: "★ Acha maoni",
  guest_one: "mgeni",
  guest_many: "wageni",

  wait_title: "Angalia simu yako",
  wait_confirmed: "Nafasi imethibitishwa",
  wait_view_ticket: "Ona tikiti yako",
  wait_back_home: "Rudi mwanzo",
  wait_try_again: "Jaribu tena",
  wait_try_in: "Jaribu tena baada ya",
  wait_browse_other: "Vinjari matukio mengine",
  wait_pay_manual: "Lipa kwa mkono badala yake",

  detail_back: "Rudi kwa orodha",
  detail_verified: "Mwendeshaji aliyethibitishwa",
  detail_about: "Kuhusu tukio hili",
  detail_duration_about: "Muda: takriban",
  hour_one: "saa",
  hour_many: "saa",
  detail_meeting: "Mahali pa kukutana",
  detail_cancellation: "Sera ya kughairi",
  detail_reviews: "Maoni",
  detail_no_reviews: "Hakuna maoni bado — kuwa wa kwanza baada ya ziara yako.",
  detail_price_note:
    "Bei kwa shilingi za Kenya (KES). Lipa kwa usalama na M-Pesa wakati wa malipo.",

  slot_choose_date: "Chagua tarehe",
  slot_guests: "Wageni",
  slot_seats: "Viti {n}",
  slot_only_left: "Vimebaki {n} pekee",
  slot_fewer: "Wageni wachache",
  slot_more: "Wageni zaidi",
  slot_continue: "Endelea",
  slot_none:
    "Hakuna tarehe zijazo kwa sasa. Angalia tena hivi karibuni au ihifadhi kwa baadaye.",

  checkout_back: "Rudi",
  checkout_title: "Thibitisha na ulipe",
  checkout_experience: "Tukio",
  checkout_date: "Tarehe",
  checkout_guests: "Wageni",
  checkout_meeting: "Mahali pa kukutana",
  checkout_total: "Jumla",
  checkout_unavailable_title: "Nafasi hiyo haipatikani",
  checkout_unavailable_body: "Chagua tarehe nyingine kwa {title}.",
  checkout_back_experience: "Rudi kwenye tukio",
  checkout_mpesa_label: "Namba ya M-Pesa",
  checkout_mpesa_hint:
    "Tutatuma ujumbe kwa namba hii — weka PIN yako ya M-Pesa kuthibitisha.",
  checkout_pay: "Lipa na M-Pesa",
  checkout_paying: "Inatuma ujumbe…",
  checkout_pay_note: "Unalipa tu baada ya kuidhinisha ujumbe kwenye simu yako.",

  // gifting (diaspora)
  gift_toggle: "Mzawadie mtu hii",
  gift_recipient_label: "Simu au barua pepe ya mpokeaji",
  gift_recipient_hint: "Tutatengeneza kiungo cha kudai utakachoshiriki nao.",
  gift_message_label: "Ujumbe (hiari)",
  gift_share_title: "Zawadi iko tayari kutumwa",
  gift_share_body: "Shiriki kiungo hiki na {recipient} — wakiingia, tikiti inakuwa yao.",
  gift_share_claimed_title: "Zawadi imedaiwa",
  gift_share_claimed_body: "{recipient} amedai zawadi hii — tikiti sasa ni yao.",
  gift_share_copy: "Nakili kiungo",
  gift_share_copied: "Imenakiliwa ✓",
  gift_invalid_title: "Zawadi haikupatikana",
  gift_invalid_body: "Kiungo hiki cha kudai si sahihi. Kiangalie na ujaribu tena.",
  gift_browse: "Vinjari matukio",
  gift_claim_title: "Umezawadiwa tukio",
  gift_claim_subtitle: "Lidai ili kuongeza tikiti kwenye pochi yako.",
  gift_claim_button: "Dai zawadi yangu",
  gift_claiming: "Subiri kidogo…",
  gift_already_claimed: "Zawadi hii tayari imedaiwa.",
  gift_err_already_claimed: "Samahani — mtu tayari amedai zawadi hii.",
  gift_err_not_ready: "Malipo bado yanachakatwa. Angalia tena baada ya muda.",

  book_confirmed_body: "Uko tayari kwa {title} tarehe {date}.",
  book_confirmed_sms: "Tumetuma kumbukumbu ya nafasi yako kwa simu yako.",
  book_pending_body:
    "Tumetuma ujumbe wa M-Pesa — weka PIN yako kuthibitisha {amount} kwa {title}.",
  book_waiting: "Inasubiri uthibitisho… {n}s",
  book_still: "Bado inathibitisha — subiri kidogo, hii yaweza kuchukua muda.",
  book_try_in: "Jaribu tena baada ya {n}s",
  book_manual_detail:
    "M-Pesa Paybill {paybill}, akaunti {ref}, kiasi {amount}. Tutathibitisha mara tu tutakapopokea.",

  fail_insufficient_title: "Salio la M-Pesa halitoshi",
  fail_insufficient_detail: "Ongeza salio au tumia Fuliza, kisha ujaribu tena.",
  fail_pin_title: "PIN ya M-Pesa si sahihi",
  fail_pin_detail: "Jaribu tena na uweke PIN yako kwa makini.",
  fail_cancel_title: "Malipo yameghairiwa",
  fail_cancel_detail: "Ulifuta ujumbe. Jaribu tena ukiwa tayari.",
  fail_timeout_title: "Ujumbe umeisha muda",
  fail_timeout_detail:
    "Hatukupata jibu kwa wakati. Tuma tena na uangalie simu yako.",
  fail_network_title: "Hitilafu ya mtandao",
  fail_network_detail: "M-Pesa haikupatikana kwa muda mfupi. Tafadhali jaribu tena.",
  fail_generic_title: "Malipo hayakukamilika",
  fail_generic_detail: "Kitu kimeenda vibaya. Unaweza kujaribu tena.",

  review_not_yet_title: "Bado",
  review_not_yet_body: "Unaweza kuacha maoni mara tu ziara yako itakapokamilika.",
  review_back_experience: "Rudi kwenye tukio",
  review_back_tickets: "Tikiti zako",
  review_title: "Toa maoni kuhusu {title}",
  review_subtitle: "Maoni halisi huwasaidia wageni wengine kuamua. Asante.",
  review_your_rating: "Kadirio lako",
  review_rating_aria: "Kadirio",
  review_star_one: "nyota {n}",
  review_star_many: "nyota {n}",
  review_your_review: "Maoni yako",
  review_placeholder: "Ilikuwaje? Wageni wengine wanapaswa kujua nini?",
  review_photos: "Picha (si lazima)",
  review_uploading: "Inapakia…",
  review_posting: "Inachapisha…",
  review_post: "Chapisha maoni",

  browse_title: "Vinjari matukio",
  browse_result_one: "matokeo {n}",
  browse_result_many: "matokeo {n}",
  browse_search_ph: "Tafuta matukio, maeneo…",
  browse_search_aria: "Tafuta",
  browse_cat: "Aina",
  browse_any_cat: "Aina yoyote",
  browse_county: "Kaunti",
  browse_any_county: "Kaunti yoyote",
  browse_date: "Tarehe",
  browse_max_price: "Bei ya juu (KES)",
  browse_price_any: "Yoyote",
  browse_guests: "Wageni",
  browse_search: "Tafuta",
  browse_clear: "Futa vichujio",
  browse_none_title: "Hakuna matukio yanayolingana",
  browse_none_body: "Jaribu kupanua tarehe, bei, au eneo.",

  wishlist_title: "Zilizohifadhiwa",
  wishlist_empty_title: "Hakuna kilichohifadhiwa bado",
  wishlist_empty_body:
    "Gusa “Hifadhi” kwenye tukio lolote ili likae hapa kwa baadaye.",
  wishlist_explore: "Gundua matukio",
  wishlist_remove: "Ondoa kwenye zilizohifadhiwa",
  wishlist_save_aria: "Hifadhi kwa baadaye",
  wishlist_saved: "Imehifadhiwa",
  wishlist_save: "Hifadhi",

  op_back: "Rudi kwa dashibodi",
  op_published: "Imechapishwa",
  op_draft: "Rasimu",
  date_one: "tarehe",
  date_many: "tarehe",

  op_list_title: "Orodhesha na RoaVa",
  op_list_body:
    "Pokea nafasi na ulipwe kwa M-Pesa. Fikia wageni wanaotafuta hasa unachotoa — bila fujo za karatasi.",
  op_verified: "imethibitishwa",
  op_your_experiences: "Matukio yako",
  op_earnings: "Mapato",
  op_checkin: "Andikisha",
  op_new: "Mpya",
  op_none_title: "Hakuna matukio bado",
  op_none_body:
    "Tengeneza orodha yako ya kwanza — huanza kama rasimu, hivyo hakuna kinachoenda hadharani hadi uchapishe.",
  op_create_first: "Tengeneza tukio lako la kwanza",

  op_setup: "Inaweka…",
  op_start_listing: "Anza kuorodhesha",
  op_biz_name: "Jina la biashara",
  op_biz_ph: "k.m. Rift Valley Treks",
  op_biz_hint: "Hii ndiyo wageni wataona kwenye orodha zako.",

  op_new_title: "Tukio jipya",
  op_new_body:
    "Anza na mambo ya msingi. Utaongeza picha, nyakati, na maelezo kabla halijaenda hadharani.",
  op_creating: "Inatengeneza…",
  op_create_draft: "Tengeneza rasimu",

  op_f_title: "Kichwa",
  op_title_ph: "k.m. Kupanda Ngong Hills wakati wa mapambazuko",
  op_f_category: "Aina",
  op_cat_ph: "Chagua aina",
  op_f_county: "Kaunti",
  op_county_ph: "Chagua kaunti",
  op_choose: "Chagua",
  op_f_price: "Bei kwa mtu (KES)",
  op_price_ph: "k.m. 3500",
  op_price_hint: "Unaweza kuboresha mengine yote baadaye.",
  op_f_desc: "Maelezo",
  op_desc_ph: "Ni nini kinachofanya hili lifae? Kinajumuisha nini?",
  op_f_area: "Eneo / mtaa",
  op_area_ph: "k.m. Karen",
  op_f_meeting: "Mahali pa kukutana",
  op_meeting_ph: "Wageni wakutane nawe wapi hasa?",
  op_meeting_hint: "Inahitajika kabla ya kuchapisha.",
  op_f_duration: "Muda (dakika)",
  op_duration_ph: "k.m. 180",
  op_f_maxparty: "Idadi ya juu ya wageni kwa nafasi",
  op_f_cancel: "Sera ya kughairi",
  op_cancel_ph: "k.m. Kughairi bure hadi saa 24 kabla.",
  op_cancel_hint: "Inaonyeshwa kwa wageni kabla ya kulipa.",
  op_saving: "Inahifadhi…",
  op_save_changes: "Hifadhi mabadiliko",
  op_saved_instant: "Mabadiliko yaliyohifadhiwa yanaonekana papo hapo.",

  op_view_guests: "Ona wageni",
  op_sec_photos: "Picha",
  op_sec_photos_hint: "Picha ya kwanza ndiyo jalada. Hadi 8.",
  op_sec_details: "Maelezo",
  op_sec_availability: "Upatikanaji",
  op_sec_availability_hint:
    "Kila nafasi ya muda ina uwezo wake. Wageni huweka nafasi mahususi.",

  op_publishing: "Inachapisha…",
  op_publish: "Chapisha",
  op_live_msg: "Tukio hili liko hadharani na linaweza kuwekewa nafasi.",
  op_unpublish: "Ondoa hadharani",
  op_draft_msg: "Rasimu — wewe pekee ndiye unayeona hili.",
  op_delete_confirm: "Futa tukio hili kabisa?",
  op_keep: "Weka",
  op_delete: "Futa",
  op_delete_exp: "Futa tukio",

  op_adding: "Inaongeza…",
  op_add_slot: "Ongeza nafasi",
  op_slot_close: "Funga",
  op_slot_remove: "Ondoa",
  op_slot_aria: "{action} nafasi {date}",
  op_f_date: "Tarehe",
  op_f_time: "Saa",
  op_f_capacity: "Uwezo",
  op_f_repeat: "Rudia kila wiki (wiki)",
  op_repeat_hint: "1 = tarehe hii pekee.",
  op_f_price_override: "Badilisha bei (KES, si lazima)",
  op_price_override_ph: "Acha tupu kutumia bei ya msingi",
  op_added_one: "Imeongeza nafasi {n}.",
  op_added_many: "Imeongeza nafasi {n}.",
  op_no_slots:
    "Hakuna nafasi za muda bado. Ongeza angalau nafasi moja ijayo ili kuchapisha.",
  op_booked: "{booked}/{capacity} zimewekwa",

  op_img_cover: "Jalada",
  op_img_remove: "Ondoa picha",
  op_img_none_title: "Hakuna picha bado",
  op_img_none_hint: "Ongeza picha yenye jua na watu",
  op_img_uploading: "Inapakia…",
  op_img_upload_failed: "Upakiaji umeshindwa. Angalia muunganisho wako na ujaribu tena.",
  op_img_save_failed: "Haikuweza kuhifadhi picha.",

  op_guests_title: "Wageni",
  op_guests_summary: "{g} {gUnit} wamewekewa nafasi katika {d} {dUnit}.",
  op_guests_none:
    "Hakuna nafasi zilizothibitishwa bado. Wageni wataonekana hapa mara tu watakapolipa.",
  op_guest_fallback: "Mgeni",
  op_checked_in: "Ameandikishwa",
  op_expected: "Anatarajiwa",

  op_checkin_title: "Andikisha wageni",
  op_checkin_body: "Skani QR ya tikiti ya kila mgeni. Kila tikiti hutumika mara moja.",
  scan_ok: "Ameandikishwa ✓",
  scan_used_title: "Tayari imetumika",
  scan_used_detail: "Tikiti hii tayari iliandikishwa",
  scan_not_owner_title: "Si tukio lako",
  scan_not_owner_detail: "Tikiti hii ni ya mwendeshaji mwingine.",
  scan_not_confirmed_title: "Haijathibitishwa",
  scan_not_confirmed_detail: "Nafasi hii bado haijalipiwa/kuthibitishwa.",
  scan_invalid_title: "Tikiti batili",
  scan_invalid_detail: "Hatukuweza kuthibitisha msimbo huu.",
  scan_camera_title: "Kamera haipatikani",
  scan_camera_detail: "Ruhusu ufikiaji wa kamera, au ubandike msimbo hapa chini.",
  scan_stop: "Acha kuskani",
  scan_start: "Skani tikiti",
  scan_unsupported:
    "Uskanishaji wa kamera hauungwi mkono kwenye kifaa hiki — bandika msimbo wa tikiti hapa chini.",
  scan_or_enter: "Au weka msimbo wa tikiti",
  scan_code_ph: "Bandika msimbo uliyoskani",
  scan_checking: "Inaangalia…",
  scan_checkin: "Andikisha",

  pay_title: "Mapato na malipo",
  pay_subtitle: "Sehemu yako baada ya kamisheni ya RoaVa. Hulipwa kwa M-Pesa yako.",
  pay_net: "Mapato halisi",
  pay_paid: "Yamelipwa",
  pay_sending: "Inatuma",
  pay_owed: "Inadaiwa",
  pay_none:
    "Hakuna safari zilizokamilika bado. Mapato yataonekana hapa baada ya wageni kuhudhuria.",
  pay_badge_paid: "Yamelipwa",
  pay_badge_failed: "Imeshindwa",
  pay_send: "Tuma malipo",
  pay_retry: "Jaribu tena malipo",
  pay_gross_fee: "Jumla {gross} · ada {fee}",
  pay_failed_msg:
    "Malipo hayo hayakukamilika. Angalia namba yako ya M-Pesa na ujaribu tena.",
  pay_need_number: "Ongeza namba yako ya malipo ya M-Pesa hapo juu ili kutuma hili.",
  pay_noncustodial:
    "RoaVa haishikilii fedha: malipo hupitia mtoa huduma aliyeidhinishwa na sehemu yako hutumwa kwa M-Pesa yako — fedha hazishikiliwi na RoaVa kamwe. Jumla iliyoshughulikiwa: {total}.",
  pay_saving: "Inahifadhi…",
  pay_update: "Sasisha",
  pay_save: "Hifadhi",
  pay_num_title: "Namba ya malipo",
  pay_num_set: "Malipo huenda kwa {phone}.",
  pay_num_unset:
    "Ongeza namba ya M-Pesa kupokea malipo yako — inahitajika ili ulipwe.",
  pay_num_label: "Namba ya M-Pesa",
  pay_num_saved: "Namba ya malipo imehifadhiwa.",

  err_phone_invalid: "Weka namba sahihi ya simu ya Kenya, k.m. 0712 345 678.",
  err_email_invalid: "Weka anwani sahihi ya barua pepe.",
  err_oauth: "Imeshindwa kuingia na mtoa huduma huyo. Tafadhali jaribu tena.",
  err_otp_ratelimit: "Maombi mengi ya msimbo. Tafadhali subiri dakika chache ujaribu tena.",
  err_otp_empty: "Weka msimbo tuliokutumia.",
  err_otp_bad: "Msimbo huo haukufanya kazi. Uangalie au uombe mpya.",
  err_otp_send: "Hatukuweza kutuma msimbo. Angalia namba na ujaribu tena baada ya muda.",
  err_name_empty: "Tafadhali weka jina lako.",
  err_name_long: "Jina hilo ni refu mno.",
  err_signin_again: "Tafadhali ingia tena.",
  err_save_retry: "Hatukuweza kuhifadhi hilo. Tafadhali jaribu tena.",
  err_biz_empty: "Weka jina la biashara yako.",
  err_biz_long: "Jina hilo la biashara ni refu mno.",
  err_op_setup: "Hatukuweza kusanidi akaunti yako ya mwendeshaji. Tafadhali jaribu tena.",
  err_op_finish: "Hatukuweza kukamilisha usanidi. Tafadhali jaribu tena.",
  err_exp_title: "Lipe tukio lako kichwa.",
  err_exp_category: "Chagua aina.",
  err_exp_county: "Chagua kaunti.",
  err_exp_price: "Weka bei sahihi kwa KES.",
  err_exp_create: "Hatukuweza kutengeneza hilo. Tafadhali jaribu tena.",
  err_exp_duration: "Muda lazima uwe idadi kamili ya dakika.",
  err_exp_maxparty: "Idadi ya juu ya wageni lazima iwe namba kamili chanya.",
  err_exp_save: "Hatukuweza kuhifadhi mabadiliko. Tafadhali jaribu tena.",
  err_exp_notfound: "Tukio halikupatikana.",
  err_exp_photo: "Ongeza angalau picha moja kabla ya kuchapisha.",
  err_exp_meeting: "Ongeza mahali pa kukutana kabla ya kuchapisha.",
  err_exp_slotreq: "Ongeza angalau nafasi moja ya muda ijayo kabla ya kuchapisha.",
  err_exp_publish: "Hatukuweza kuchapisha. Tafadhali jaribu tena.",
  err_img_path: "Njia ya upakiaji isiyotarajiwa.",
  err_img_max: "Hadi picha {n}.",
  err_img_save: "Haikuweza kuhifadhi picha.",
  err_slot_datetime: "Chagua tarehe na saa.",
  err_slot_capacity: "Uwezo lazima uwe kati ya 1 na 1000.",
  err_slot_repeat: "Kurudia lazima kuwe wiki 1 hadi {n}.",
  err_slot_price: "Bei mbadala lazima iwe kiasi kamili cha KES.",
  err_slot_invalid: "Tarehe/saa hiyo si sahihi.",
  err_slot_future: "Chagua saa ya wakati ujao.",
  err_slot_add: "Hatukuweza kuongeza nafasi hizo. Tafadhali jaribu tena.",
  err_msisdn_invalid: "Weka namba sahihi ya M-Pesa, k.m. 0712 345 678.",
  err_review_rating: "Gusa kadirio la nyota kutoka 1 hadi 5.",
  err_review_long: "Tafadhali weka maoni yako chini ya herufi 1000.",
  err_review_post:
    "Hatukuweza kuchapisha maoni hayo. Unaweza kutoa maoni kuhusu safari uliyokamilisha, mara moja tu.",
  err_book_guests: "Chagua angalau mgeni mmoja.",
  err_book_ratelimit:
    "Umeanzisha nafasi nyingi. Tafadhali subiri kidogo ujaribu tena.",
  err_book_slot_notfound: "Nafasi hiyo ya muda haikupatikana.",
  err_book_slot_unavail: "Nafasi hiyo ya muda haipatikani tena.",
  err_book_exp_unavail: "Tukio hili halipatikani kwa sasa.",
  err_book_maxparty: "Hadi wageni {n} kwa nafasi.",
  err_book_generic: "Kitu kimeenda vibaya. Tafadhali jaribu tena.",
  err_book_taken: "Samahani — nafasi hizo zimechukuliwa tu. Chagua tarehe nyingine.",
  err_book_start: "Hatukuweza kuanzisha nafasi yako. Tafadhali jaribu tena.",
  err_book_paystart: "Hatukuweza kuanzisha malipo. Tafadhali jaribu tena.",
  err_book_mpesa: "Hatukuweza kufikia M-Pesa. Tafadhali jaribu tena baada ya muda.",

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
