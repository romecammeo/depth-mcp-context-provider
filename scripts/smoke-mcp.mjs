/*
 * MCP / read-only context seam smoke test.  `npm run build && npm run smoke:mcp`
 *
 * Drives the real HTTP stack in isolated local mode: builds a project + pack,
 * mints a scoped bearer token, and asserts the read API is (a) source-linked,
 * (b) READ-ONLY, (c) workspace-scoped, (d) leaks no secrets, and that a revoked
 * token stops working. Also asserts Slack-unconfigured handling (no Slack env).
 */
import { spawn } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const PORT = process.env.SMOKE_PORT || "4402";
const BASE = `http://localhost:${PORT}`;
const dataDir = mkdtempSync(path.join(tmpdir(), "depth-mcp-"));

let pass = 0, fail = 0;
const check = (n, c) => { if (c) { pass++; console.log("  \x1b[32m✓\x1b[0m " + n); } else { fail++; console.log("  \x1b[31m✗ " + n + "\x1b[0m"); } };
const cookieOf = (res) => (res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("depth_session="))?.split(";")[0] ?? null;
const jpost = (cookie, body) => ({ method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
const bearer = (t) => ({ headers: { Authorization: `Bearer ${t}` } });

async function waitReady(ms = 30000) {
  const s = Date.now();
  while (Date.now() - s < ms) { try { const r = await fetch(BASE + "/", { redirect: "manual" }); if (r.status > 0) return true; } catch {} await new Promise((r) => setTimeout(r, 400)); }
  return false;
}

async function seedProject(cookie) {
  const proj = await (await fetch(BASE + "/api/projects", jpost(cookie, { name: "MCP smoke", taskContext: "Understand the retrieval decision." }))).json();
  await fetch(BASE + "/api/sources", jpost(cookie, { projectId: proj.id, title: "Slack #eng", sourceType: "slack", freshness: "watched", body: "Decision for v1: keep retrieval in Postgres with pgvector. Do not add Pinecone without a review." }));
  await fetch(BASE + "/api/generate-context-pack", jpost(cookie, { projectId: proj.id }));
  return proj.id;
}

async function run() {
  console.log(`\nMCP read-only seam smoke → ${BASE}\n`);

  // User A: project + pack + token
  const aCookie = cookieOf(await fetch(BASE + "/api/auth/local/signup", jpost(null, { email: `mcpa_${Date.now()}@smoke.test`, password: "secret123" })));
  const projectId = await seedProject(aCookie);
  const mint = await (await fetch(BASE + "/api/mcp/tokens", jpost(aCookie, { label: "smoke" }))).json();
  const token = mint.token;
  check("mint scoped token (depth_mcp_… returned once)", typeof token === "string" && token.startsWith("depth_mcp_") && !!mint.id);

  // list never re-exposes the secret or its hash
  const list = await (await fetch(BASE + "/api/mcp/tokens", { headers: { Cookie: aCookie } })).json();
  const listStr = JSON.stringify(list);
  check("token list has no plaintext token and no hash", list.tokens?.some((t) => t.id === mint.id) && !listStr.includes(token) && !listStr.includes("token_hash"));

  // auth gating
  check("no bearer → 401", (await fetch(BASE + "/api/mcp/projects")).status === 401);
  check("bad bearer → 401", (await fetch(BASE + "/api/mcp/projects", bearer("depth_mcp_wrong"))).status === 401);

  // projects
  const projects = await (await fetch(BASE + "/api/mcp/projects", bearer(token))).json();
  check("GET projects (bearer) lists the workspace project", projects.projects?.some((p) => p.id === projectId));

  // pack — source-linked (claims cite sources with title + type, not raw dump)
  const packRes = await fetch(BASE + `/api/mcp/projects/${projectId}/pack`, bearer(token));
  const pack = await packRes.json();
  const claim = pack.pack?.claims?.[0];
  check("GET pack returns claims", (pack.pack?.claims?.length ?? 0) > 0);
  check("claims are SOURCE-LINKED (title + source_type)", !!claim?.sources?.[0]?.title && !!claim.sources[0].source_type);

  // handoff
  const ho = await (await fetch(BASE + `/api/mcp/projects/${projectId}/handoff?target=cursor`, bearer(token))).json();
  check("GET handoff returns markdown w/ source legend", ho.target === "cursor" && typeof ho.markdown === "string" && ho.markdown.includes("## Source references"));

  // sources directory is metadata-only (no bodies); single source has the body
  const dir = await (await fetch(BASE + `/api/mcp/projects/${projectId}/sources?query=pgvector`, bearer(token))).json();
  const first = dir.sources?.[0];
  check("GET sources = metadata directory, NO bodies", !!first && !("body" in first) && first.source_type === "slack");
  const one = await (await fetch(BASE + `/api/mcp/sources/${first.id}`, bearer(token))).json();
  check("GET one source returns full body + metadata", one.source?.id === first.id && /pgvector/.test(one.source?.body ?? ""));

  // READ-ONLY: no write verbs exist on the read routes
  check("POST to a read route → 405 (read-only)", (await fetch(BASE + "/api/mcp/projects", jpost(token, {}))).status === 405);

  // no secret leakage anywhere in the read payloads
  const blob = JSON.stringify(pack) + JSON.stringify(dir) + JSON.stringify(one);
  check("read payloads leak no secrets", !/access_token|service_role|client_secret|api_key|enc:v1:/i.test(blob));

  // Slack seam is unconfigured here (no Slack env) → honest redirect, not a crash
  const slackStart = await fetch(BASE + "/api/auth/slack/start", { headers: { Cookie: aCookie }, redirect: "manual" });
  check("Slack start with no env → /settings?slack=unconfigured", (slackStart.headers.get("location") ?? "").includes("slack=unconfigured"));

  // WORKSPACE SCOPING: user B's token cannot read A's project or source
  const bCookie = cookieOf(await fetch(BASE + "/api/auth/local/signup", jpost(null, { email: `mcpb_${Date.now()}@smoke.test`, password: "secret123" })));
  await seedProject(bCookie); // give B its own workspace
  const bToken = (await (await fetch(BASE + "/api/mcp/tokens", jpost(bCookie, { label: "b" }))).json()).token;
  check("B's token cannot read A's pack (404)", (await fetch(BASE + `/api/mcp/projects/${projectId}/pack`, bearer(bToken))).status === 404);
  check("B's token cannot read A's source (404)", (await fetch(BASE + `/api/mcp/sources/${first.id}`, bearer(bToken))).status === 404);

  // REVOCATION
  await fetch(BASE + `/api/mcp/tokens/${mint.id}`, { method: "DELETE", headers: { Cookie: aCookie } });
  check("revoked token → 401", (await fetch(BASE + "/api/mcp/projects", bearer(token))).status === 401);

  console.log(`\n${fail === 0 ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"} — ${pass} passed, ${fail} failed\n`);
  return fail === 0;
}

let child;
const cleanup = () => { try { child?.kill("SIGTERM"); } catch {} try { rmSync(dataDir, { recursive: true, force: true }); } catch {} };
process.on("SIGINT", () => { cleanup(); process.exit(1); });

child = spawn("npx", ["next", "start", "-p", PORT], {
  env: { ...process.env, DEPTH_BACKEND: "local", DEPTH_SQLITE_PATH: path.join(dataDir, "mcp.sqlite"), DEPTH_SESSION_SECRET: "smoke" },
  stdio: "ignore",
});
if (!(await waitReady())) { console.error("Server did not start. Run `npm run build` first."); cleanup(); process.exit(1); }
let ok = false;
try { ok = await run(); } catch (err) { console.error("Smoke error:", err); }
cleanup();
process.exit(ok ? 0 : 1);
