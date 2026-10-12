/*
 * Depth MCP server (EXAMPLE / thin wrapper — not part of the Next build).
 *
 * Exposes Depth's READ-ONLY context API as MCP tools for Claude Code / Cursor.
 * Requires the MCP SDK:  npm i @modelcontextprotocol/sdk
 * Run:  DEPTH_BASE_URL=https://<app> DEPTH_MCP_TOKEN=depth_mcp_… node mcp/depth-mcp-server.mjs
 *
 * Read-only by design: there are no write/update/delete tools.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = process.env.DEPTH_BASE_URL || "http://localhost:3000";
const TOKEN = process.env.DEPTH_MCP_TOKEN;
if (!TOKEN) {
  console.error("Set DEPTH_MCP_TOKEN (Settings → Context API tokens → Generate).");
  process.exit(1);
}

async function depthGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const TOOLS = [
  { name: "list_projects", description: "List Depth projects in this workspace.", inputSchema: { type: "object", properties: {} } },
  { name: "get_context_pack", description: "Get the latest source-linked context pack for a project.", inputSchema: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] } },
  { name: "get_handoff", description: "Get the copyable agent handoff for a project.", inputSchema: { type: "object", properties: { project_id: { type: "string" }, target: { type: "string", enum: ["claude_code", "cursor", "codex", "human"] } }, required: ["project_id"] } },
  { name: "search_sources", description: "Search a project's sources (metadata only).", inputSchema: { type: "object", properties: { project_id: { type: "string" }, query: { type: "string" } }, required: ["project_id"] } },
  { name: "get_source", description: "Get one source's full content + metadata.", inputSchema: { type: "object", properties: { source_id: { type: "string" } }, required: ["source_id"] } },
];

const server = new Server({ name: "depth", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a = {} } = req.params;
  let data;
  if (name === "list_projects") data = await depthGet(`/api/mcp/projects`);
  else if (name === "get_context_pack") data = await depthGet(`/api/mcp/projects/${a.project_id}/pack`);
  else if (name === "get_handoff") data = await depthGet(`/api/mcp/projects/${a.project_id}/handoff?target=${a.target || "claude_code"}`);
  else if (name === "search_sources") data = await depthGet(`/api/mcp/projects/${a.project_id}/sources?query=${encodeURIComponent(a.query || "")}`);
  else if (name === "get_source") data = await depthGet(`/api/mcp/sources/${a.source_id}`);
  else throw new Error(`Unknown tool: ${name}`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

await server.connect(new StdioServerTransport());
