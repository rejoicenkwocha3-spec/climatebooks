import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Selar payment notification endpoint. Configure in Selar:  https://YOUR-DOMAIN/api/selar/webhook?secret=SELAR_WEBHOOK_SECRET
// Access is granted ONLY here, after the shared secret is verified. Never from a checkout click.
const PRICE_TO_PLAN: Record<string, "plan_1" | "plan_2" | "plan_3"> = { "47": "plan_1", "57": "plan_2", "97": "plan_3" };
const eq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const pick = (o: any, keys: string[]) => { for (const k of keys) { const v = k.split(".").reduce((a, p) => a?.[p], o); if (v !== undefined && v !== null && v !== "") return v; } };

export async function POST(req: NextRequest) {
  const expected = process.env.SELAR_WEBHOOK_SECRET;
  if (!expected) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const given = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-webhook-secret") ?? "";
  if (!eq(given, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const email = String(pick(body, ["customer_email", "buyer_email", "email", "customer.email", "data.customer_email", "data.email"]) ?? "").toLowerCase();
  const ref = String(pick(body, ["reference", "order_id", "transaction_id", "id", "data.reference", "data.id"]) ?? "");
  const amount = String(Math.round(Number(pick(body, ["amount", "price", "data.amount", "data.price"]) ?? NaN)));
  const text = JSON.stringify(body).toLowerCase();
  const plan = PRICE_TO_PLAN[amount] ?? (text.includes("47plan") ? "plan_1" : text.includes("57plan") ? "plan_2" : text.includes("97plan") ? "plan_3" : undefined);
  const event = String(pick(body, ["event", "type", "status"]) ?? "").toLowerCase();
  if (!email || !plan || !ref) return NextResponse.json({ error: "Missing email, plan or reference" }, { status: 422 });

  const db = supabaseAdmin();
  const cancelled = /cancel|expire|fail|refund/.test(event);
  const { data: user } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
  const end = new Date(Date.now() + 31 * 86400000).toISOString();
  const { error } = await db.from("subscriptions").upsert({ buyer_email: email, user_id: user?.id ?? null, plan_key: plan, status: cancelled ? "cancelled" : "active", selar_reference: ref, current_period_end: end }, { onConflict: "selar_reference" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
