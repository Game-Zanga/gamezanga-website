// Cron-triggered every 3 hours by GitHub Actions.
//
// What it does:
//   1. Pulls all participants registered in the last 3 hours.
//   2. Finds names appearing >5 times in the last 1 hour — auto-adds them to
//      the Upstash dynamic blocklist (so /api/register starts shadowbanning
//      them on the very next request).
//   3. Posts a summary to Discord via webhook.
//
// Auth: protected by Authorization: Bearer ${CRON_SECRET}. Any external
// caller without the secret is rejected.

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getServiceClient } from "@/lib/supabase-server";
import { DYNAMIC_BLOCKLIST_KEY } from "@/lib/spam-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const AUTO_BLOCK_WINDOW_MS = 60 * 60 * 1000;  // 1 hour
const AUTO_BLOCK_THRESHOLD = 5;               // >5 same-name signups in 1 hour

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function postToDiscord(content: string): Promise<void> {
  const webhook = process.env.DISCORD_SPAM_WEBHOOK;
  if (!webhook) {
    console.warn("DISCORD_SPAM_WEBHOOK not set — skipping Discord post");
    return;
  }
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        // Suppress @everyone/@here mentions even if content accidentally contains them.
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) {
      console.error("Discord webhook failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Discord webhook threw:", e);
  }
}

export async function GET(req: Request) {
  // Cron-secret auth — only the GitHub Actions workflow with the correct
  // bearer token can trigger this. Other callers get 401.
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const svc = getServiceClient();
  const redis = getRedis();
  const now = Date.now();
  const reportSince = new Date(now - REPORT_WINDOW_MS).toISOString();
  const autoBlockSince = now - AUTO_BLOCK_WINDOW_MS;

  // Pull every participant created in the report window (3h).
  // Should always fit in 1 page in normal operation; paginate just in case.
  const recent: Array<{ full_name: string; email: string; created_at: string; editions: string[] }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await svc
      .from("participants")
      .select("full_name, email, created_at, editions")
      .gte("created_at", reportSince)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error) {
      console.error("DB query failed:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    if (!data?.length) break;
    recent.push(...data);
    if (data.length < 1000) break;
  }

  // 1. Auto-blocklist: names with >threshold occurrences in last 1h window.
  const lastHourByName = new Map<string, number>();
  for (const r of recent) {
    if (new Date(r.created_at).getTime() < autoBlockSince) continue;
    lastHourByName.set(r.full_name, (lastHourByName.get(r.full_name) ?? 0) + 1);
  }

  const newlyBlocked: Array<{ name: string; count: number }> = [];
  if (redis) {
    for (const [name, count] of lastHourByName) {
      if (count <= AUTO_BLOCK_THRESHOLD) continue;
      const key = name.trim().toLowerCase();
      if (!key) continue;
      // Check current membership so we don't spam the "newly blocked" list
      // every run for the same name.
      const already = await redis.sismember(DYNAMIC_BLOCKLIST_KEY, key);
      if (already) continue;
      await redis.sadd(DYNAMIC_BLOCKLIST_KEY, key);
      newlyBlocked.push({ name, count });
    }
  }

  // 2. Build the Discord summary.
  const totalSignups = recent.length;
  const byName = new Map<string, number>();
  for (const r of recent) byName.set(r.full_name, (byName.get(r.full_name) ?? 0) + 1);
  const topNames = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const blocklistSize = redis ? await redis.scard(DYNAMIC_BLOCKLIST_KEY) : 0;

  const lines: string[] = [];
  lines.push(`**🎮 Game Zanga — site report (last 3h)**`);
  lines.push(`Total signups: **${totalSignups}**`);
  if (totalSignups > 0) {
    lines.push("");
    lines.push("Top names:");
    for (const [name, c] of topNames) lines.push(`• \`${c}×\` ${name}`);
  }
  if (newlyBlocked.length > 0) {
    lines.push("");
    lines.push(`🚨 **Auto-blocked new patterns** (>${AUTO_BLOCK_THRESHOLD} hits in 1h):`);
    for (const b of newlyBlocked) lines.push(`• \`${b.count}×\` ${b.name}`);
  }
  lines.push("");
  lines.push(`Dynamic blocklist size: **${blocklistSize}**`);

  await postToDiscord(lines.join("\n"));

  return NextResponse.json({
    ok: true,
    signups: totalSignups,
    newlyBlocked,
    blocklistSize,
  });
}
