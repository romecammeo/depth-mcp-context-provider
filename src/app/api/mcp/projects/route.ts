import { NextResponse, type NextRequest } from "next/server";
import { mcpAuth } from "@/lib/server/mcp-auth";
import { listProjects } from "@/lib/server/mcp-store";

export const runtime = "nodejs";

// GET /api/mcp/projects  (Bearer <mcp token>) → projects in the token's workspace
export async function GET(req: NextRequest) {
  const a = await mcpAuth(req);
  if ("status" in a) return NextResponse.json({ error: a.error }, { status: a.status });
  return NextResponse.json({ projects: await listProjects(a.workspaceId) });
}
