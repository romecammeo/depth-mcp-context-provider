import { NextResponse, type NextRequest } from "next/server";
import { mcpAuth } from "@/lib/server/mcp-auth";
import { getSourceForToken } from "@/lib/server/mcp-store";

export const runtime = "nodejs";

// GET /api/mcp/sources/[id] → one source's full content + metadata (scoped to token workspace)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await mcpAuth(req);
  if ("status" in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const source = await getSourceForToken(a.workspaceId, id);
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  return NextResponse.json({ source });
}
