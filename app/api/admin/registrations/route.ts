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
  let query = svc.from("participants").select("*").order("created_at", { ascending: false });
  if (editionParam !== "all") {
    const tag = editionParam?.trim() || String(JAM_CONFIG.edition);
    query = query.contains("editions", [tag]);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ participants: data ?? [] });
}
