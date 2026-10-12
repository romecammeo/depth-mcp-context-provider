import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";

// DELETE /api/mcp/tokens/[id] → revoke a token
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrCreateWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = await createClient();
  await supabase.from("mcp_tokens").delete().eq("id", id).eq("workspace_id", ctx.workspace.id);
  return NextResponse.json({ ok: true });
}
