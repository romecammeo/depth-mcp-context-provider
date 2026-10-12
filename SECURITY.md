# Security model and limitations

## Scope

This is a historical code-review summary, not a security certification. It describes the inspected implementation at commit `364f3e02d8b944a0439e9be3ab191259b3385b9e`.

## Trust boundaries

### MCP process

The stdio adapter runs with two environment values:

- `DEPTH_BASE_URL`
- `DEPTH_MCP_TOKEN`

Anyone able to inspect that process environment can potentially obtain the bearer token. The adapter forwards the token to the configured base URL on each HTTP request. Operators must use a trusted host process and HTTPS outside localhost.

### Token-management boundary

Token creation, listing, and revocation are not MCP tools. They are application routes protected by the normal Depth web session and workspace context.

- Tokens contain 24 random bytes and a prefix.
- The plaintext is returned once.
- Storage uses a SHA-256 hash.
- Token listings omit plaintext and hash.
- Revocation deletes the token row within the current workspace.

A stored hash avoids retaining plaintext credentials, but an unsalted fast hash is not equivalent to a password hash. The random token's entropy is the primary protection against offline guessing.

### Read-API boundary

The bearer token resolves to a workspace. Application data access must apply that workspace consistently.

In Supabase mode, the bearer token is not an authenticated Supabase user session. The implementation uses a service-role client and therefore relies on application-level workspace checks rather than request-scoped RLS. A missed filter in a future route could be security-significant.

## Read-only design

The adapter exposes only five read tools. The included `/api/mcp` read routes define GET handlers; the token-management DELETE route is session-authenticated and is not exposed through MCP.

“Read-only” means the published MCP interface contains no data mutation tool. It does not mean that:

- the bearer token cannot expose sensitive source content;
- the full underlying application is read-only;
- every HTTP verb was formally denied by a centralized policy; or
- the design has been independently penetration-tested.

## Source-exposure model

- `search_sources` returns metadata and does not return `body`.
- `get_source` returns a selected source's full body and metadata.
- Context-pack claims return source identifiers and selected descriptive fields.
- Handoffs can include source references produced by the application's renderer.

The metadata/full-body split reduces accidental disclosure during discovery, but a valid token still authorizes access to workspace source content through explicit retrieval.

## Revocation and lifecycle

The observed implementation supports deletion-based revocation and tracks `last_used_at`. The inspected schema did not show:

- expiry timestamps;
- scoped permissions below workspace read access;
- automatic rotation;
- per-token rate limits;
- IP/device binding; or
- alerting on unusual use.

## Tested security properties

The HTTP smoke suite checked selected properties:

- missing and invalid bearer tokens return 401;
- token listing does not return plaintext/hash;
- two cross-workspace reads return 404;
- a revoked token returns 401;
- a POST to one read route returns 405;
- selected secret-like key patterns are absent from sampled payloads.

These tests are useful but bounded. They are not an exhaustive security proof.

## Reporting issues

This repository is a static portfolio snapshot and has no claim of active maintenance. Do not submit live credentials or private source data in an issue. If the repository is published, the owner should define a current contact and disclosure process separately.
