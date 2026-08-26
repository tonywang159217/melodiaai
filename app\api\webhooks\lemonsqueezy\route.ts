import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from "@/lib/lemonsqueezy";

interface LSWebhookEvent {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string };
  };
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (LEMON_SQUEEZY_WEBHOOK_SECRET) {
    const expected = crypto
      .createHmac("sha256", LEMON_SQUEEZY_WEBHOOK_SECRET)
      .update(raw)
      .digest("hex");
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: LSWebhookEvent;
  try {
    event = JSON.parse(raw) as LSWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const eventName = event?.meta?.event_name;
  const userId = event?.meta?.custom_data?.user_id;
  const custom = userId
    ? { ok: true, note: "future: sync subscriptions table" }
    : { ok: true, note: "add user_id in checkout custom_data to sync per-user" };

  console.log("[LS webhook]", eventName, custom);

  return NextResponse.json({ received: true });
}