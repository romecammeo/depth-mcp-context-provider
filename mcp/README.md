# Depth — read-only context provider (MCP seam)

Depth exposes a **read-only** HTTP API so an AI coding agent (Claude Code, Cursor, …) can pull a
project's **source-linked context pack**, **agent handoff**, and **source metadata** — instead of
copy-pasting. This is the seam; the thin MCP server below is an example wrapper.

## The read API (built, in the app)

Authenticate with a **scoped bearer token** (Settings → *Context API tokens (MCP · read-only)* → Generate).
The token is workspace-scoped and grants **read-only** access. It never exposes Slack/GitHub/model keys.

| Endpoint | Returns |
|---|---|
| `GET /api/mcp/projects` | projects in the token's workspace |
| `GET /api/mcp/projects/:id/pack` | latest context pack (claims + the sources that support each — source-linked, not raw) |
| `GET /api/mcp/projects/:id/handoff?target=claude_code` | copyable handoff markdown |
| `GET /api/mcp/projects/:id/sources?query=` | source directory (metadata only, no full bodies) |
| `GET /api/mcp/sources/:id` | one source's full content + metadata |

```bash
curl -H "Authorization: Bearer $DEPTH_MCP_TOKEN" https://<your-app>/api/mcp/projects
```

> In Supabase mode the read API needs `SUPABASE_SERVICE_ROLE_KEY` set (the token has no user session, so
> RLS can't scope it — the workspace filter does). Without it, the read routes return `503`. Local mode
> needs no key. This key is **server-only**; it is never sent to the browser.

## Thin MCP server (example — adapt + run separately)

`depth-mcp-server.mjs` wraps the read API as MCP **tools** (`get_context_pack`, `get_handoff`,
`search_sources`, `get_source`). It is **not** part of the Next app build. To use:

```bash
npm i @modelcontextprotocol/sdk
DEPTH_BASE_URL=https://<your-app> DEPTH_MCP_TOKEN=depth_mcp_… node mcp/depth-mcp-server.mjs
```

Then register it with your agent (example — Claude Code / Cursor MCP config):

```json
{
  "mcpServers": {
    "depth": {
      "command": "node",
      "args": ["/abs/path/to/depth/mcp/depth-mcp-server.mjs"],
      "env": { "DEPTH_BASE_URL": "https://<your-app>", "DEPTH_MCP_TOKEN": "depth_mcp_…" }
    }
  }
}
```

All tools are read-only. There is no write/update/delete path in this increment.
