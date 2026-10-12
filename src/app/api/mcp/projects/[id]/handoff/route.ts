import { NextResponse, type NextRequest } from "next/server";
import { mcpAuth } from "@/lib/server/mcp-auth";
import { getHandoffMarkdown, isHandoffTarget } from "@/lib/server/mcp-store";

export const runtime = "nodejs";

// GET /api/mcp/projects/[id]/handoff?target=claude_code → copyable handoff markdown
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await mcpAuth(req);
  if ("status" in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const targetParam = req.nextUrl.searchParams.get("target") ?? "claude_code";
  const target = isHandoffTarget(targetParam) ? targetParam : "claude_code";
  const result = await getHandoffMarkdown(a.workspaceId, id, target);
  if (!result) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ target, ...result });
}
