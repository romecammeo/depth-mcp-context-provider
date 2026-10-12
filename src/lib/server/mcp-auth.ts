import "server-only";
import type { NextRequest } from "next/server";
import { resolveMcpToken, McpNotAvailableError } from "./mcp-store";

/** Resolve a Bearer MCP token → { workspaceId }, or an error status to return. */
export async function mcpAuth(req: NextRequest): Promise<{ workspaceId: string } | { status: number; error: string }> {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!bearer) return { status: 401, error: "Bearer token required" };
  try {
    const ctx = await resolveMcpToken(bearer);
    return ctx ?? { status: 401, error: "Invalid token" };
  } catch (err) {
    if (err instanceof McpNotAvailableError) return { status: 503, error: err.message };
    return { status: 500, error: "auth failed" };
  }
}
