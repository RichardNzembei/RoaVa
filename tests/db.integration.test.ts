import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

/*
  Integration tests for the money-critical DB functions, run against the local
  Supabase stack. Codifies the invariants previously verified by hand:
  no oversell, payment idempotency, release-once, single-use check-in.

  Skips automatically if the local stack isn't reachable (e.g. plain CI).
*/
const db = createServiceClient();

async function probe(): Promise<boolean> {
  try {
    const { error } = await db.from("experiences").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
const available = await probe();

const created = { bookings: [] as string[], slots: [] as string[] };

async function makeSlot(experienceId: string, capacity: number): Promise<string> {
  const id = randomUUID();
  const { error } = await db.from("availability_slots").insert({
    id,
    experience_id: experienceId,
    start_at: new Date(Date.now() + 30 * 864e5).toISOString(),
    capacity,
  });
  if (error) throw error;
  created.slots.push(id);
  return id;
}

async function makeBooking(
  experienceId: string,
  slotId: string,
  consumerId: string,
  party: number,
  ref: string,
): Promise<string> {
  const id = randomUUID();
  const { error: be } = await db.from("bookings").insert({
    id,
    experience_id: experienceId,
    slot_id: slotId,
    consumer_profile_id: consumerId,
    party_size: party,
    amount_kes: party * 1000,
    status: "pending",
  });
  if (be) throw be;
  created.bookings.push(id);
  const { error: pe } = await db.from("payments").insert({
    booking_id: id,
    provider: "mock",
    provider_ref: ref,
    amount_kes: party * 1000,
    status: "pending",
  });
  if (pe) throw pe;
  return id;
}

describe.skipIf(!available)("payment + capacity invariants (local DB)", () => {
  let experienceId: string;
  let operatorOwner: string;
  let consumerId: string;

  beforeAll(async () => {
    const { data: exp } = await db
      .from("experiences")
      .select("id, operators!inner(owner_profile_id)")
      .eq("status", "published")
      .limit(1)
      .single();
    experienceId = exp!.id;
    operatorOwner = (exp!.operators as unknown as { owner_profile_id: string })
      .owner_profile_id;
    const { data: cons } = await db
      .from("profiles")
      .select("id")
      .eq("role", "consumer")
      .limit(1)
      .single();
    consumerId = cons!.id;
  });

  afterAll(async () => {
    if (created.bookings.length)
      await db.from("bookings").delete().in("id", created.bookings);
    if (created.slots.length)
      await db.from("availability_slots").delete().in("id", created.slots);
  });

  it("reserve_slot never oversells", async () => {
    const slot = await makeSlot(experienceId, 2);
    const a = await db.rpc("reserve_slot", { p_slot_id: slot, p_qty: 2 });
    const b = await db.rpc("reserve_slot", { p_slot_id: slot, p_qty: 1 });
    expect(a.data).toBe(true);
    expect(b.data).toBe(false);
    const { data: row } = await db
      .from("availability_slots")
      .select("booked_count")
      .eq("id", slot)
      .single();
    expect(row!.booked_count).toBe(2);
  });

  it("confirm_booking_payment is idempotent", async () => {
    const slot = await makeSlot(experienceId, 5);
    await db.rpc("reserve_slot", { p_slot_id: slot, p_qty: 1 });
    const ref = `it-confirm-${randomUUID()}`;
    const bookingId = await makeBooking(experienceId, slot, consumerId, 1, ref);

    const first = await db.rpc("confirm_booking_payment", { p_provider_ref: ref, p_raw: null });
    const second = await db.rpc("confirm_booking_payment", { p_provider_ref: ref, p_raw: null });
    expect(first.data).toBe(bookingId);
    expect(second.data).toBe(bookingId);

    const { data: bk } = await db.from("bookings").select("status").eq("id", bookingId).single();
    const { data: pay } = await db.from("payments").select("status").eq("provider_ref", ref).single();
    expect(bk!.status).toBe("confirmed");
    expect(pay!.status).toBe("success");
  });

  it("fail_booking_payment releases capacity exactly once", async () => {
    const slot = await makeSlot(experienceId, 5);
    await db.rpc("reserve_slot", { p_slot_id: slot, p_qty: 3 });
    const ref = `it-fail-${randomUUID()}`;
    const bookingId = await makeBooking(experienceId, slot, consumerId, 3, ref);

    await db.rpc("fail_booking_payment", { p_provider_ref: ref, p_reason: "wrong pin", p_raw: null });
    let { data: row } = await db.from("availability_slots").select("booked_count").eq("id", slot).single();
    expect(row!.booked_count).toBe(0);

    // Second call must not drive the count negative.
    await db.rpc("fail_booking_payment", { p_provider_ref: ref, p_reason: "wrong pin", p_raw: null });
    ({ data: row } = await db.from("availability_slots").select("booked_count").eq("id", slot).single());
    expect(row!.booked_count).toBe(0);

    const { data: bk } = await db.from("bookings").select("status").eq("id", bookingId).single();
    expect(bk!.status).toBe("cancelled");
  });

  it("check_in_ticket is single-use and ownership-scoped", async () => {
    const slot = await makeSlot(experienceId, 5);
    await db.rpc("reserve_slot", { p_slot_id: slot, p_qty: 1 });
    const ref = `it-checkin-${randomUUID()}`;
    const bookingId = await makeBooking(experienceId, slot, consumerId, 1, ref);
    await db.rpc("confirm_booking_payment", { p_provider_ref: ref, p_raw: null });

    const nonce = randomUUID();
    await db.from("tickets").insert({
      booking_id: bookingId,
      qr_payload: `${bookingId}.${nonce}.sig`,
      nonce,
      status: "valid",
    });

    const ok = await db.rpc("check_in_ticket", {
      p_booking_id: bookingId,
      p_nonce: nonce,
      p_operator_profile: operatorOwner,
    });
    const again = await db.rpc("check_in_ticket", {
      p_booking_id: bookingId,
      p_nonce: nonce,
      p_operator_profile: operatorOwner,
    });
    const wrongOperator = await db.rpc("check_in_ticket", {
      p_booking_id: bookingId,
      p_nonce: nonce,
      p_operator_profile: consumerId,
    });

    expect(ok.data).toBe("ok"); // first scan succeeds
    expect(again.data).toBe("used"); // replay blocked
    expect(wrongOperator.data).toBe("not_owner"); // ownership checked before state
  });

  it("check_rate_limit throttles past the max", async () => {
    const key = `it-rl-${randomUUID()}`;
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      const { data } = await db.rpc("check_rate_limit", {
        p_key: key,
        p_max: 3,
        p_window_seconds: 60,
      });
      results.push(data as boolean);
    }
    expect(results).toEqual([true, true, true, false, false]);
  });
});
