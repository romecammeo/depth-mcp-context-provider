import { NextResponse, type NextRequest } from "next/server";
import { mcpAuth } from "@/lib/server/mcp-auth";
import { getLatestContextPack } from "@/lib/server/mcp-store";

export const runtime = "nodejs";

// GET /api/mcp/projects/[id]/pack → latest source-linked context pack
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await mcpAuth(req);
  if ("status" in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const result = await getLatestContextPack(a.workspaceId, id);
  if (!result) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(result);
}
