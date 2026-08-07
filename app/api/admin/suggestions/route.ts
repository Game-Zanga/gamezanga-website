import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";
import { isSameOrigin } from "@/lib/csrf";
import { dbErrorResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 200;

// `approved` is tri-state: TRUE = approved, FALSE = rejected, NULL = pending.
const STATUSES = ["all", "pending", "approved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(req: Request) {
  if (!(await isAdminAuthorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const raw = url.searchParams.get("status");
  const status: Status = (STATUSES as readonly string[]).includes(raw ?? "") ? (raw as Status) : "all";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? 0) || 0);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT)
  );

  const svc = getServiceClient();

  // Counts for the filter chips. `head: true` transfers no rows — Postgres
  // returns only the count, so four of these stay cheap.
  async function countFor(s: Status): Promise<number> {
    let q = svc
      .from("theme_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("edition", JAM_CONFIG.edition);
    if (s === "approved") q = q.eq("approved", true);
    else if (s === "rejected") q = q.eq("approved", false);
    else if (s === "pending") q = q.is("approved", null);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  }

  try {
    const [all, pending, approved, rejected] = await Promise.all([
      countFor("all"),
      countFor("pending"),
      countFor("approved"),
      countFor("rejected"),
    ]);

    const from = page * limit;
    let q = svc
      .from("theme_suggestions")
      .select("id, theme_ar, theme_en, approved, created_at", { count: "exact" })
      .eq("edition", JAM_CONFIG.edition)
      .order("created_at", { ascending: true })
      .range(from, from + limit - 1);
    if (status === "approved") q = q.eq("approved", true);
    else if (status === "rejected") q = q.eq("approved", false);
    else if (status === "pending") q = q.is("approved", null);

    const { data, error, count } = await q;
    if (error) return dbErrorResponse("admin/suggestions", error);

    return NextResponse.json({
      suggestions: data ?? [],
      total: count ?? 0,
      page,
      limit,
      status,
      counts: { all, pending, approved, rejected },
    });
  } catch (e) {
    return dbErrorResponse("admin/suggestions.counts", e);
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  let body: { id?: string; approved?: boolean | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const svc = getServiceClient();
  const { error } = await svc
    .from("theme_suggestions")
    .update({ approved: body.approved ?? null })
    .eq("id", body.id);
  if (error) return dbErrorResponse("admin/suggestions", error);
  return NextResponse.json({ success: true });
}
