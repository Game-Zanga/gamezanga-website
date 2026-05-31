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
  // Optional ?edition=N query param to filter; defaults to current edition.
  // ?edition=all returns every participant ever registered.
  const url = new URL(req.url);
  const editionParam = url.searchParams.get("edition");
  let query = svc.from("participants").select("*").order("created_at", { ascending: false });
  if (editionParam !== "all") {
    const editionNum = editionParam ? Number(editionParam) : JAM_CONFIG.edition;
    if (Number.isFinite(editionNum)) {
      query = query.contains("editions", [editionNum]);
    }
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ participants: data ?? [] });
}
