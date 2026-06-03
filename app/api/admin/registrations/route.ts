import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";
import { dbErrorResponse } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000; // cap so a malicious/buggy client can't ask for the whole table

export async function GET(req: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const svc = getServiceClient();

  // Filters + pagination params:
  //   ?edition=TAG  — filter by editions array containment (default = current edition)
  //   ?edition=all  — every participant ever
  //   ?page=N       — zero-indexed page (default 0)
  //   ?limit=N      — page size (default 50, max 1000)
  //   ?all=1        — bypass pagination, stream all rows (for CSV export)
  // Tags are strings ("14", "13", "SE") since participants.editions is TEXT[].
  const url = new URL(req.url);
  const editionParam = url.searchParams.get("edition");
  const filterTag = editionParam !== "all" ? editionParam?.trim() || String(JAM_CONFIG.edition) : null;
  const wantAll = url.searchParams.get("all") === "1";
  const page = Math.max(0, Number(url.searchParams.get("page") ?? 0) || 0);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT));

  const buildQuery = (range: [number, number]) => {
    let q = svc
      .from("participants")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(range[0], range[1]);
    if (filterTag) q = q.contains("editions", [filterTag]);
    return q;
  };

  if (!wantAll) {
    // Single-page request — fast path.
    const from = page * limit;
    const to = from + limit - 1;
    const { data, error, count } = await buildQuery([from, to]);
    if (error) return dbErrorResponse("admin/registrations", error);
    return NextResponse.json({
      participants: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  }

  // ?all=1 — paginate the underlying Supabase 1000-row cap internally for CSV export.
  const SUPA_PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  let total = 0;
  for (let from = 0; ; from += SUPA_PAGE) {
    const { data, error, count } = await buildQuery([from, from + SUPA_PAGE - 1]);
    if (error) return dbErrorResponse("admin/registrations", error);
    if (count != null && total === 0) total = count;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < SUPA_PAGE) break;
  }
  return NextResponse.json({ participants: all, total, page: 0, limit: all.length });
}
