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
  const { data, error } = await svc
    .from("participants")
    .select("*")
    .eq("edition", JAM_CONFIG.edition)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ participants: data ?? [] });
}
