import { NextResponse, type NextRequest } from "next/server";
import { mcpAuth } from "@/lib/server/mcp-auth";
import { searchProjectSources } from "@/lib/server/mcp-store";

export const runtime = "nodejs";

// GET /api/mcp/projects/[id]/sources?query= → source directory (metadata, no full bodies)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await mcpAuth(req);
  if ("status" in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const query = req.nextUrl.searchParams.get("query") ?? "";
  const result = await searchProjectSources(a.workspaceId, id, query);
  if (result === null) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ sources: result });
}
