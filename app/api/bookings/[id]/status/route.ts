import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/lib/payments";
import { processCallback } from "@/lib/payments/webhook";

// Poll fallback windows: try the provider's own status first, then expire.
const RECONCILE_AFTER_MS = 70_000;
const EXPIRE_AFTER_MS = 150_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient(); // user session — RLS scopes to own booking

  let booking = await readBooking(supabase, id);
  if (!booking) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  let payment = await readPayment(supabase, id);

  // Reconciliation: a missed callback must never strand a pending booking (§4.3).
  if (booking.status === "pending" && payment?.provider_ref) {
    const age = Date.now() - new Date(booking.created_at).getTime();
    if (age > RECONCILE_AFTER_MS) {
      const state = await getPaymentProvider().getStatus(payment.provider_ref);
      if (state === "success" || state === "failed") {
        await processCallback({
          providerRef: payment.provider_ref,
          state,
          failureReason: state === "failed" ? "failed" : undefined,
        });
      } else if (age > EXPIRE_AFTER_MS) {
        const service = createServiceClient();
        await service.rpc("expire_pending_booking", { p_booking_id: id });
      }
      booking = (await readBooking(supabase, id)) ?? booking;
      payment = await readPayment(supabase, id);
    }
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id")
    .eq("booking_id", id)
    .maybeSingle();

  return NextResponse.json(
    {
      status: booking.status,
      payment: payment?.status ?? null,
      failureReason: payment?.failure_reason ?? null,
      hasTicket: Boolean(ticket),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

async function readBooking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const { data } = await supabase
    .from("bookings")
    .select("id, status, created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function readPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const { data } = await supabase
    .from("payments")
    .select("status, failure_reason, provider_ref, created_at")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
