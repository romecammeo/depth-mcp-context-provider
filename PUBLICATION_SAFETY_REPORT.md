# Publication safety report

**Review status:** prepared for owner review; not published  
**Review date:** 2026-10-12  
**Publication action taken:** none

## Included source files inspected

The following files were inspected before inclusion:

- `mcp/README.md`
- `mcp/depth-mcp-server.mjs`
- `scripts/smoke-mcp.mjs`
- `src/lib/server/mcp-auth.ts`
- `src/lib/server/mcp-store.ts`
- five read-route handlers under `src/app/api/mcp/`
- two token-management route handlers
- `supabase/migrations/20260629_0011_mcp_tokens.sql`

The project manifest and lockfile were inspected for dependency and licensing context but were not included.

## Exclusions

The package intentionally excludes:

- `.env` and `.env.local` files;
- API keys, bearer tokens, cookies, OAuth material, and service-role credentials;
- private databases and user/workspace records;
- private source documents and context corpora;
- deployment-project IDs, account mappings, and operational platform configuration;
- the full Depth repository and unrelated product source;
- private Git history, remotes, author names, and author emails;
- build output, caches, `node_modules`, and lockfiles;
- live application URLs or a claim that any deployment remains operational.

## Publication transformations

- The implementation files listed in `DEPTH_MCP_CONTEXT_PROVIDER_PUBLICATION_MANIFEST_2026-10-12.csv` are exact byte copies from the pinned source commit/worktree.
- Portfolio documentation, diagrams, manifest, notices, CV bullets, and validation summaries are newly authored explanatory material.
- The smoke-test source uses fictional `@smoke.test` accounts and local fixture values; those are retained and labeled as test fixtures.
- No mock backend or replacement implementation was created.
- The historical result is labeled as a transcription because the named evidence ZIP was unavailable during this pass.

## Safety checks

Completed checks include:

- common credential/token/private-key pattern scan;
- personal email and absolute home-path scan;
- private-host and deployment-domain scan;
- repository-wide source/published hash comparison for exact copies;
- checks for `.env`, database, key, certificate, cache, and Git-metadata files;
- build, TypeScript, wrapper syntax, and HTTP smoke validation in the source repository;
- final owner-review validation rerun, with sandbox binding limitations recorded separately;
- archive integrity testing;
- independent documentation/code-boundary review.

Final measured results are recorded in `VALIDATION_REPORT.md`.

## Licensing review

- The inspected Depth source repository had no project-level `LICENSE` file.
- The MCP adapter imports `@modelcontextprotocol/sdk`, but that dependency was not pinned in the Depth package manifest or lockfile.
- On the preparation date, the npm package metadata for the current SDK release (`1.32.1`) reported MIT licensing. This does not establish which SDK version, if any, was historically used.
- Third-party packages are not vendored in this portfolio.
- This repository therefore uses an all-rights-reserved notice unless the owner later selects an explicit open-source license.

## Unresolved risks and limitations

1. The named sanitized evidence ZIP was unavailable, so byte-for-byte comparison against it could not be performed.
2. The extracted repository is not standalone and cannot run its historical smoke suite without the full Depth application.
3. No separate MCP-client interoperability evidence was located.
4. The SDK version is unpinned and absent from the original application dependencies.
5. The review did not constitute penetration testing or a formal security audit.
6. Token expiry, rate limiting, fine-grained scopes, and monitoring were not evidenced in the included slice.
7. Future publication requires the owner's explicit approval and a decision on whether the all-rights-reserved posture is acceptable.
