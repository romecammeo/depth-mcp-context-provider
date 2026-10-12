-- Depth alpha — 0011 — read-only context API tokens (MCP seam)
--
-- Scoped bearer tokens that let an external read-only client (e.g. a Depth MCP
-- server for Claude Code / Cursor) fetch a workspace's context packs, handoffs,
-- and source metadata. Only the SHA-256 hash is stored (the plaintext token is
-- shown once at creation). Read-only: these tokens grant no write access, and
-- the read API never exposes Slack/GitHub/provider secrets.

create table if not exists public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  label text not null default '',
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists mcp_tokens_workspace_idx on public.mcp_tokens(workspace_id);

alter table public.mcp_tokens enable row level security;

-- Workspace members manage their workspace's tokens from the app. (The read API
-- itself authenticates by token hash via a trusted server context, not RLS.)
drop policy if exists mcp_tokens_all on public.mcp_tokens;
create policy mcp_tokens_all on public.mcp_tokens for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
