import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspace } from "@/lib/workspace";
import { hashToken } from "@/lib/server/mcp-store";
import type { McpToken } from "@/lib/db/types";

export const runtime = "nodejs";

// GET /api/mcp/tokens → list (no secrets)
export async function GET() {
  const ctx = await getOrCreateWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("mcp_tokens")
    .select("*")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false });
  const tokens = ((data ?? []) as McpToken[]).map((t) => ({
    id: t.id,
    label: t.label,
    created_at: t.created_at,
    last_used_at: t.last_used_at,
  }));
  return NextResponse.json({ tokens });
}

// POST /api/mcp/tokens { label? } → { id, token }  (plaintext token shown ONCE)
export async function POST(req: NextRequest) {
  const ctx = await getOrCreateWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { label } = (await req.json().catch(() => ({}))) as { label?: string };

  const token = "depth_mcp_" + randomBytes(24).toString("hex");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mcp_tokens")
    .insert({ workspace_id: ctx.workspace.id, user_id: ctx.user.id, label: label?.trim() || "MCP token", token_hash: hashToken(token) })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });

  // The plaintext token is returned exactly once and never stored.
  return NextResponse.json({ id: data.id, token });
}
