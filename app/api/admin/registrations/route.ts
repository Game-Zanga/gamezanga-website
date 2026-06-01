import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const svc = getServiceClient();
  // Optional ?edition=TAG query param to filter; defaults to current edition.
  // ?edition=all returns every participant ever registered.
  // Tags are strings (e.g. "14", "13", "SE") since participants.editions is TEXT[].
  const url = new URL(req.url);
  const editionParam = url.searchParams.get("edition");
  const filterTag = editionParam !== "all" ? editionParam?.trim() || String(JAM_CONFIG.edition) : null;

  // Supabase caps single .select() at 1000 rows by default. After importing the
  // legacy CSVs (~2k rows), one request truncates. Paginate via .range() until
  // we get a short page back.
  const PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = svc
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (filterTag) q = q.contains("editions", [filterTag]);
    const { data, error } = await q;
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return NextResponse.json({ participants: all });
}
