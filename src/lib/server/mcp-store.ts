/*
 * Read-only context provider (MCP seam). Authenticated by a scoped bearer token
 * (hashed in mcp_tokens), NOT a user session. Returns source-linked context —
 * packs, handoffs, and source metadata for the token's workspace. It never
 * exposes Slack/GitHub/provider secrets, and offers no write path.
 *
 * Uses the local SQLite client in local mode, or a service-role client in
 * Supabase mode (the token has no auth.uid(), so RLS can't scope it — the
 * workspace_id filter here is the scoping). 503 if no service key in Supabase.
 */
import "server-only";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isLocalMode } from "@/lib/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { createLocalServerClient } from "@/lib/local/client";
import { renderHandoff } from "@/lib/engine/handoff";
import { HANDOFF_TARGETS, type HandoffTarget } from "@/lib/vocab";
import type { ContextPack, ContextPackClaim, Project, Source } from "@/lib/db/types";

export class McpNotAvailableError extends Error {
  constructor() {
    super("Read API requires SUPABASE_SERVICE_ROLE_KEY in Supabase mode");
    this.name = "McpNotAvailableError";
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readClient(): SupabaseClient {
  if (isLocalMode()) return createLocalServerClient() as unknown as SupabaseClient;
  const sb = createServiceClient();
  if (!sb) throw new McpNotAvailableError();
  return sb;
}

export async function resolveMcpToken(bearer: string): Promise<{ workspaceId: string } | null> {
  const client = readClient();
  const hash = hashToken(bearer);
  const { data } = await client.from("mcp_tokens").select("workspace_id").eq("token_hash", hash).maybeSingle<{ workspace_id: string }>();
  if (!data) return null;
  await client.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("token_hash", hash);
  return { workspaceId: data.workspace_id };
}

async function projectInWorkspace(client: SupabaseClient, ws: string, projectId: string): Promise<Project | null> {
  const { data } = await client.from("projects").select("*").eq("id", projectId).maybeSingle<Project>();
  return data && data.workspace_id === ws ? (data as Project) : null;
}

export async function listProjects(ws: string) {
  const client = readClient();
  const { data } = await client.from("projects").select("*").eq("workspace_id", ws).is("archived_at", null).order("created_at", { ascending: false });
  return ((data ?? []) as Project[]).map((p) => ({ id: p.id, name: p.name, task_context: p.task_context, created_at: p.created_at }));
}

export async function getLatestContextPack(ws: string, projectId: string) {
  const client = readClient();
  const project = await projectInWorkspace(client, ws, projectId);
  if (!project) return null;
  const { data: pack } = await client.from("context_packs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle<ContextPack>();
  if (!pack) return { project: { id: project.id, name: project.name }, pack: null };

  const [{ data: claims }, { data: sources }] = await Promise.all([
    client.from("context_pack_claims").select("*").eq("context_pack_id", pack.id).order("ordering"),
    client.from("sources").select("*").eq("project_id", projectId),
  ]);
  const byId = new Map(((sources ?? []) as Source[]).map((s) => [s.id, s]));
  return {
    project: { id: project.id, name: project.name },
    pack: {
      id: pack.id,
      decision_summary: pack.decision_summary,
      generated_by: pack.generated_by,
      model: pack.model,
      created_at: pack.created_at,
      claims: ((claims ?? []) as ContextPackClaim[]).map((c) => ({
        kind: c.kind,
        text: c.text,
        confidence: c.confidence,
        freshness_warning: c.freshness_warning,
        // source-linked: titles + types, not raw source bodies
        sources: c.source_ids.map((sid) => {
          const s = byId.get(sid);
          return s ? { id: s.id, title: s.title, source_type: s.source_type, freshness_state: s.freshness_state } : { id: sid };
        }),
      })),
    },
  };
}

export async function getHandoffMarkdown(ws: string, projectId: string, target: HandoffTarget) {
  const client = readClient();
  const project = await projectInWorkspace(client, ws, projectId);
  if (!project) return null;
  const { data: pack } = await client.from("context_packs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle<ContextPack>();
  if (!pack) return { markdown: null };

  const [{ data: claims }, { data: sources }] = await Promise.all([
    client.from("context_pack_claims").select("*").eq("context_pack_id", pack.id).order("ordering"),
    client.from("sources").select("*").eq("project_id", projectId),
  ]);
  const markdown = renderHandoff({
    projectName: project.name,
    taskContext: project.task_context ?? "",
    decisionSummary: pack.decision_summary ?? "",
    claims: ((claims ?? []) as ContextPackClaim[]).map((c) => ({ kind: c.kind, text: c.text, source_ids: c.source_ids, freshness_warning: c.freshness_warning })),
    sources: ((sources ?? []) as Source[]).map((s) => ({ id: s.id, title: s.title, source_type: s.source_type, freshness_state: s.freshness_state, source_url: s.source_url, last_updated_at: s.last_updated_at })),
    target,
  });
  return { markdown };
}

export function isHandoffTarget(x: string): x is HandoffTarget {
  return HANDOFF_TARGETS.some((t) => t.id === x);
}

/** Metadata only (no full bodies) — a directory of sources, not a dump. */
export async function searchProjectSources(ws: string, projectId: string, query: string) {
  const client = readClient();
  const project = await projectInWorkspace(client, ws, projectId);
  if (!project) return null;
  const { data } = await client.from("sources").select("*").eq("project_id", projectId);
  const q = query.trim().toLowerCase();
  return ((data ?? []) as Source[])
    .filter((s) => !q || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
    .map((s) => ({
      id: s.id,
      title: s.title,
      source_type: s.source_type,
      freshness_state: s.freshness_state,
      source_url: s.source_url,
      last_updated_at: s.last_updated_at,
      metadata: s.metadata,
    }));
}

export async function getSourceForToken(ws: string, sourceId: string) {
  const client = readClient();
  const { data } = await client.from("sources").select("*").eq("id", sourceId).maybeSingle<Source>();
  if (!data || data.workspace_id !== ws) return null;
  return {
    id: data.id,
    title: data.title,
    source_type: data.source_type,
    freshness_state: data.freshness_state,
    source_url: data.source_url,
    body: data.body,
    metadata: data.metadata,
    last_updated_at: data.last_updated_at,
  };
}
