import { NextResponse, type NextRequest } from "next/server";
import {
  initializeLemonSqueezy,
  createCheckout,
  LEMON_SQUEEZY_STORE_ID,
} from "@/lib/lemonsqueezy";

const BASIC_VARIANT_ID = process.env.NEXT_PUBLIC_BASIC_PLAN_VARIANT_ID;
const PRO_VARIANT_ID = process.env.NEXT_PUBLIC_PRO_PLAN_VARIANT_ID;

function getVariantId(input: string | null | undefined): string {
  if (!input) return "";
  const v = input.trim();
  switch (v.toLowerCase()) {
    case "basic":
    case "creator":
      return BASIC_VARIANT_ID ?? "";
    case "pro":
    case "studio":
      return PRO_VARIANT_ID ?? "";
    default:
      return /^\d+$/.test(v) ? v : "";
  }
}

/**
 * GET /api/checkout?plan=basic|pro
 *   307 跳转到 Lemon Squeezy Checkout
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const plan = searchParams.get("plan");
  const variantParam = searchParams.get("variantId");
  const variantId = getVariantId(plan ?? variantParam);

  if (!variantId) {
    return NextResponse.json(
      { error: "Invalid plan or variantId. Use ?plan=basic|pro" },
      { status: 400 }
    );
  }
  if (!LEMON_SQUEEZY_STORE_ID) {
    return NextResponse.json(
      { error: "LEMON_SQUEEZY_STORE_ID not configured" },
      { status: 500 }
    );
  }

  try {
    initializeLemonSqueezy();
    const { data, error } = await createCheckout(
      LEMON_SQUEEZY_STORE_ID,
      variantId,
      {
        productOptions: {
          redirectUrl: `${origin}/dashboard?checkout=success`,
          receiptThankYouNote: "Thank you for subscribing to MelodiaAI!",
        },
        checkoutData: {
          custom: {
            plan_slug: plan ?? "",
            variant_id: variantId,
            site_origin: origin,
          },
        },
      }
    );

    if (error || !data?.data?.attributes?.url) {
      console.error("LS checkout error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout", details: error ?? null },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.data.attributes.url, { status: 307 });
  } catch (err: unknown) {
    console.error("Checkout GET error:", err);
    return NextResponse.json(
      {
        error: "Checkout server error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout
 *   body: { plan?, variantId?, userId?, email? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      plan?: string;
      variantId?: string;
      userId?: string;
      email?: string;
    };
    const { origin } = new URL(req.url);
    const variantId = getVariantId(body.plan ?? body.variantId);

    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid plan or variantId" },
        { status: 400 }
      );
    }
    if (!LEMON_SQUEEZY_STORE_ID) {
      return NextResponse.json(
        { error: "Store ID not configured" },
        { status: 500 }
      );
    }

    initializeLemonSqueezy();

    const custom: Record<string, string> = {
      plan_slug: body.plan ?? "",
      variant_id: variantId,
      site_origin: origin,
    };
    if (body.userId) custom.user_id = body.userId;

    const { data, error } = await createCheckout(
      LEMON_SQUEEZY_STORE_ID,
      variantId,
      {
        productOptions: {
          redirectUrl: `${origin}/dashboard?checkout=success`,
        },
        checkoutData: {
          email: body.email ?? undefined,
          custom,
        },
      }
    );

    if (error || !data?.data?.attributes?.url) {
      return NextResponse.json(
        { error: "Failed to create checkout", details: error ?? null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: data.data.attributes.url,
      variantId,
    });
  } catch (err: unknown) {
    console.error("Checkout POST error:", err);
    return NextResponse.json(
      {
        error: "Checkout server error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}