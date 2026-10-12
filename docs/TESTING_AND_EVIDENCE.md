# Testing and evidence

## Historical result

The sanitized evidence packet prepared on 2026-10-12 reported:

```text
PASS — 16 passed, 0 failed
```

The exact original execution timestamp was not retained. During this portfolio preparation the named ZIP was no longer present at the supplied Downloads path, so `evidence/HISTORICAL_SMOKE_TEST_RESULT_2026-10-12.txt` is a provenance-labeled transcription of the previously verified record, not a byte-for-byte extraction from the unavailable ZIP.

## What the smoke suite actually exercised

The historical `scripts/smoke-mcp.mjs` test:

1. starts the built Next.js application in isolated local mode;
2. uses a temporary SQLite database;
3. creates two fictional local users and separate workspaces;
4. seeds a project, source, and generated context pack;
5. issues a read token through the session-authenticated token endpoint;
6. calls the HTTP context API directly; and
7. deletes the temporary data directory during cleanup.

The sixteen assertions were:

1. a scoped token is returned once;
2. token listing exposes neither plaintext nor hash;
3. no bearer token returns 401;
4. an invalid bearer token returns 401;
5. project listing returns the seeded workspace project;
6. context-pack retrieval returns claims;
7. claims include source title and source type;
8. handoff retrieval returns markdown with a source legend;
9. source search returns metadata without bodies;
10. explicit source retrieval returns body and metadata;
11. POST to a read route returns 405;
12. selected secret-like field patterns are absent from read payloads;
13. an unconfigured Slack start route redirects honestly rather than crashing;
14. a second workspace token cannot read the first workspace's pack;
15. a second workspace token cannot read the first workspace's source; and
16. a revoked token returns 401.

## What it did not exercise

The suite did **not**:

- launch `depth-mcp-server.mjs`;
- create an MCP client;
- perform MCP initialize/handshake negotiation;
- call `tools/list` or `tools/call` over stdio;
- verify compatibility with Claude Code, Cursor, Codex, or another MCP host;
- run against Supabase or a deployed environment;
- exhaustively test every route for cross-workspace access;
- prove absence of every possible secret or sensitive field;
- test rate limiting, token expiration, audit alerting, or adversarial traffic;
- establish production readiness.

Accordingly, the 16/0 result is evidence for the HTTP context seam and selected security invariants, not end-to-end MCP interoperability.

## Preparation-time validation

A separate validation run was completed during portfolio preparation on 2026-10-12. It is intentionally recorded separately from the historical result.

Commands:

```bash
npm run build
npm run typecheck
node --check mcp/depth-mcp-server.mjs
npm run smoke:mcp
```

Observed results:

- Next.js build: pass
- TypeScript check: pass
- MCP adapter syntax check: pass
- HTTP smoke suite: `PASS — 16 passed, 0 failed`
- source worktree before and after: clean

See `evidence/PREPARATION_VALIDATION_2026-10-12.txt`.

## Reproduction boundary

The included portfolio slice is not sufficient to rerun the smoke suite because the suite depends on the full Depth application. With an authorized full checkout of the pinned commit, the historical command sequence was:

```bash
npm ci
npm run build
npm run smoke:mcp
```

Running the MCP adapter additionally requires installing `@modelcontextprotocol/sdk`, configuring `DEPTH_BASE_URL` and `DEPTH_MCP_TOKEN`, and providing a live compatible Depth API. No public mock or replacement backend is supplied.
