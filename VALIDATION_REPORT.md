# Validation report

**Prepared:** 2026-10-12  
**Source commit:** `364f3e02d8b944a0439e9be3ab191259b3385b9e`  
**Publication status:** local review package only; not published

## Source-repository validation

Run against the full local Depth source repository before packaging:

| Check | Result |
|---|---|
| Source worktree before validation | Clean |
| `npm run build` | PASS — Next.js 16.2.10 compiled successfully |
| MCP HTTP routes present in build | PASS — seven `/api/mcp` route handlers enumerated |
| `npm run typecheck` | PASS |
| `node --check mcp/depth-mcp-server.mjs` | PASS |
| `npm run smoke:mcp` | PASS — 16 passed, 0 failed |
| Source worktree after validation | Clean |

The smoke suite exercised the HTTP context API in local mode. It did not launch an MCP client or test stdio interoperability.

During final owner-review preparation on 2026-10-12, the validation sequence was rerun. `npm run build` and `npm run smoke:mcp` initially encountered sandbox localhost/bind restrictions; both passed when rerun outside the sandbox. `npm run typecheck` and `node --check mcp/depth-mcp-server.mjs` passed in the sandbox. The rerun smoke result was again `PASS — 16 passed, 0 failed`.

## Publication-package validation

| Check | Result |
|---|---|
| Files before manifest/control generation | 27 |
| Exact source files copied | 13 |
| Source-to-public copy hash mismatches | 0 |
| Absolute home-directory paths | 0 |
| Non-fixture email addresses | 0 |
| Literal Depth tokens matching long token format | 0 |
| Common API-token patterns | 0 |
| Private-key blocks | 0 |
| Private Supabase/Vercel hosts | 0 |
| Personal-name marker checked | 0 |
| Forbidden environment/key/database/Git files | 0 |
| Broken relative Markdown links | 0 |
| Architecture SVG XML parse | PASS |

The two `@smoke.test` email values and the fixture password/session secret in `scripts/smoke-mcp.mjs` are intentionally fictional local test inputs, not operational credentials.

## Dependency and license checks

- The source repository contained no project-level license file.
- The published snapshot therefore uses an all-rights-reserved notice pending an owner licensing decision.
- `@modelcontextprotocol/sdk` was referenced but absent from the Depth package manifest and lockfile.
- npm metadata inspected on 2026-10-12 reported SDK version `1.32.1`, license `MIT`; this does not prove the historical intended version.
- No third-party packages or binaries are vendored.

## Evidence-integrity qualifications

- The historical 16/0 result is kept separate from the preparation-time 16/0 rerun.
- The historical result is not dated more precisely than the available evidence supports.
- The named sanitized ZIP was unavailable during this preparation pass, so no current byte-level comparison against that packet was possible.
- Published source files were instead copied from the clean pinned Depth commit and independently hashed.
- The portfolio is not a standalone application and does not contain fabricated mocks.

## Remaining pre-publication decisions

1. Confirm the all-rights-reserved license posture or select an explicit public license.
2. Accept the unavailable-evidence-ZIP provenance qualification.
3. Decide whether exposing full-source retrieval code is acceptable for the intended public audience.
4. Add a current security contact only if the repository will accept issue reports.
5. Obtain explicit owner approval before creating a GitHub repository or pushing any files.
