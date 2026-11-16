-- Bot connections (Claude, Grok, ...) to the back office over MCP.
-- RLS is on with NO policies on purpose: these tables are only ever read or
-- written server-side with the service-role key, never with the anon key.
-- (Applied to the production project as migration "mcp_tokens_and_activity".)
create table public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token_hash text not null unique,
  can_write boolean not null default false,
  created_by_email text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table public.mcp_activity (
  id bigint generated always as identity primary key,
  token_id uuid references public.mcp_tokens(id) on delete set null,
  token_name text not null,
  tool text not null,
  is_write boolean not null default false,
  ok boolean not null default true,
  summary text,
  created_at timestamptz not null default now()
);

create index mcp_activity_created_at_idx on public.mcp_activity (created_at desc);

alter table public.mcp_tokens enable row level security;
alter table public.mcp_activity enable row level security;
