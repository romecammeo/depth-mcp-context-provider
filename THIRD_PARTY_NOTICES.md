# Third-party dependency notes

## MCP TypeScript SDK

`mcp/depth-mcp-server.mjs` imports `@modelcontextprotocol/sdk`.

Observed during portfolio preparation on 2026-10-12:

- npm package: `@modelcontextprotocol/sdk`
- current npm version observed: `1.32.1`
- license reported by npm: MIT
- repository reported by npm: `https://github.com/modelcontextprotocol/typescript-sdk`

The historical Depth package manifest did not declare or pin this dependency, and its lockfile did not contain it. Therefore the exact SDK version historically intended or exercised is not established by the inspected repository.

## Underlying application dependencies

The selected backend files reference Next.js, Supabase, local SQLite adapters, and internal Depth modules. Those dependencies and modules are not vendored in this portfolio snapshot. Their licenses remain governed by their respective projects and the full application's dependency records.

## No vendored third-party code

This portfolio does not include `node_modules`, copied SDK source, or third-party binaries.
