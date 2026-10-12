# Source provenance and historical status

## Snapshot identity

- **Original project:** Depth
- **Portfolio repository name:** `depth-mcp-context-provider`
- **Source branch:** `release/autonomous-reviewer-alpha`
- **Source commit:** `364f3e02d8b944a0439e9be3ab191259b3385b9e`
- **Source commit date:** 2026-07-17T18:09:51+03:00
- **Source commit subject:** `Record verified Vercel reviewer release`
- **Extraction/preparation date:** 2026-10-12
- **Source worktree:** clean before and after preparation validation
- **Source remote:** none configured in the inspected local repository

## Implementation history visible in Git

- `mcp/depth-mcp-server.mjs`, `scripts/smoke-mcp.mjs`, the server auth/store files, and the token migration first appear in commit `5a536a24621aab80755ad229a8f2508c084d6268`, dated 2026-07-12T16:27:34+03:00.
- `mcp/README.md` was subsequently changed in commit `ed9dea07b2fd80c102adf9167aa12c88f90a23a0`, dated 2026-07-12T22:24:13+03:00.
- This portfolio copied the files as they existed at the pinned 2026-07-17 source commit.

These dates establish repository history, not necessarily the first moment the code was authored outside Git.

## Test and portfolio dates

- **Historical smoke execution:** 2026-10-12; exact original timestamp not retained in the preserved record.
- **Preparation-time validation:** completed by 2026-10-12T15:10:54Z.
- **Portfolio snapshot prepared:** 2026-10-12.

The preparation-time run is additional evidence and is not substituted for the historical result.

## Evidence-packet availability qualification

The requested input was `Depth_MCP_Read-Only_Context_Provider_Sanitized_Evidence_Packet_2026-10-12.zip`. That ZIP was not present at the supplied Downloads path during this preparation pass. The previously recorded packet contents and 16/0 result informed the scope, but publication files were freshly copied from the clean pinned Depth source commit and re-reviewed. The historical result file is explicitly marked as a transcription rather than a byte-identical packet extraction.

This is an unresolved provenance limitation. It prevents a current byte-for-byte comparison against the earlier packet, but it does not change the pinned source commit or the separately rerun preparation validation.

## Historical status boundary

This repository is deliberately static. It does not track future Depth development and makes no claim about:

- whether Depth remained deployed after the snapshot;
- whether the architecture later changed;
- whether the project is actively maintained;
- whether the implementation is production-ready;
- whether a later system superseded this seam.

The engineering evidence is intended to remain inspectable even if the parent project is discontinued.

## Preservation policy

Published implementation files retain their original repository-relative paths and bytes. Portfolio-authored documents explain the boundary around them. No private Git history, remote, author email, environment file, database, user data, or internal corpus is included.
