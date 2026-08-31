import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "../../../lib/metaCapi";

const ALLOWED_EVENTS = new Set(["AddToCart", "Purchase"]);
const MAX_STRING_LEN = 200;

function isValidString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= MAX_STRING_LEN;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!ALLOWED_EVENTS.has(b.event as string)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  if (typeof b.value !== "number" || !Number.isFinite(b.value) || b.value < 0 || b.value > 1_000_000) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }
  if (b.contentId !== undefined && !isValidString(b.contentId)) {
    return NextResponse.json({ error: "Invalid contentId" }, { status: 400 });
  }
  if (b.contentName !== undefined && !isValidString(b.contentName)) {
    return NextResponse.json({ error: "Invalid contentName" }, { status: 400 });
  }
  if (b.orderId !== undefined && !isValidString(b.orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }
  if (
    b.contentIds !== undefined &&
    (!Array.isArray(b.contentIds) || b.contentIds.length > 50 || !b.contentIds.every(isValidString))
  ) {
    return NextResponse.json({ error: "Invalid contentIds" }, { status: 400 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  await sendMetaCapiEvent({
    event: b.event as "AddToCart" | "Purchase",
    value: b.value,
    contentId: b.contentId as string | undefined,
    contentIds: b.contentIds as string[] | undefined,
    contentName: b.contentName as string | undefined,
    orderId: b.orderId as string | undefined,
    clientIp,
    userAgent: req.headers.get("user-agent") ?? undefined,
    eventSourceUrl: req.headers.get("referer") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
