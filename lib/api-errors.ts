// Sanitized error responses for API routes.
//
// We want full error details in the server logs (for debugging) but the client
// should only see a generic "something went wrong" — so a probing user can't
// learn schema details from error messages.

import { NextResponse } from "next/server";

/**
 * Log the real error to the server console + return a sanitized 500 to the
 * client. Use this in admin/service-role routes where we don't want to leak
 * Postgres column/table names in responses.
 */
export function dbErrorResponse(context: string, error: unknown): NextResponse {
  console.error(`[${context}] DB error:`, error);
  return NextResponse.json({ message: "Internal error" }, { status: 500 });
}
