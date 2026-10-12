# MCP tool contracts

The adapter exposes five tools through MCP stdio transport. For successful calls it serializes the underlying HTTP JSON response and returns it as one MCP text-content item.

## `list_projects`

- **Input:** empty object
- **HTTP call:** `GET /api/mcp/projects`
- **Application behavior:** lists non-archived projects filtered by the token's workspace
- **Observed response fields:** `id`, `name`, `task_context`, `created_at`
- **Does not:** create, update, or archive projects

## `get_context_pack`

- **Required input:** `project_id: string`
- **HTTP call:** `GET /api/mcp/projects/:project_id/pack`
- **Application behavior:** verifies the project belongs to the token workspace and retrieves the latest existing pack
- **Claim provenance:** each claim maps source IDs to `id`, `title`, `source_type`, and `freshness_state`
- **Does not:** generate or persist a new context pack
- **Empty state:** the project may be returned with `pack: null`

## `get_handoff`

- **Required input:** `project_id: string`
- **Optional input:** `target`, one of `claude_code`, `cursor`, `codex`, or `human`
- **HTTP call:** `GET /api/mcp/projects/:project_id/handoff?target=...`
- **Default:** `claude_code`
- **Application behavior:** verifies workspace access and calls the application's handoff renderer using existing project, pack, claim, and source records
- **Does not:** implement handoff generation inside the MCP adapter

## `search_sources`

- **Required input:** `project_id: string`
- **Optional input:** `query: string`
- **HTTP call:** `GET /api/mcp/projects/:project_id/sources?query=...`
- **Search behavior:** case-insensitive substring matching against title and body in the inspected implementation
- **Returned data:** source metadata including ID, title, type, freshness, URL, update timestamp, and metadata
- **Not returned:** source body
- **Does not:** use a demonstrated vector or semantic-search subsystem in this route

## `get_source`

- **Required input:** `source_id: string`
- **HTTP call:** `GET /api/mcp/sources/:source_id`
- **Application behavior:** requires the source's `workspace_id` to match the bearer token workspace
- **Returned data:** one source's ID, title, type, freshness, URL, full body, metadata, and update timestamp
- **Security significance:** this is the deliberate full-content expansion tool

## Error behavior

- Missing or invalid bearer token: HTTP 401 from the application
- Missing service-role capability in Supabase mode: HTTP 503
- Project/source outside the workspace or not found: HTTP 404
- Unknown MCP tool name: adapter throws `Unknown tool`
- Other non-2xx HTTP responses: adapter throws the application error or `HTTP <status>`

## Contract limitations

- The wrapper relies on MCP input schemas and does not add independent runtime validation.
- Project and source IDs are interpolated into paths; the historical implementation assumes expected identifier shapes.
- Only the search query is explicitly URL-encoded by the wrapper.
- Responses are returned as JSON text rather than typed MCP resources.
- No MCP resources, prompts, subscriptions, or write tools are exposed.
