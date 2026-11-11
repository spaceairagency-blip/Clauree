-- Clauree: safe to run more than once. Never deletes your data.
-- Run in Supabase > SQL Editor.

create table if not exists clauree_sync (
  key_hash   text primary key,               -- sha256 of the user's sync key (the key itself is never stored)
  hits       jsonb not null default '[]',    -- [{t: timestamp, u: tokens used when the limit hit}]
  hist       jsonb not null default '[]',    -- [{s: start, e: end, n: messages, u: tokens}]
  updated_at timestamptz not null default now()
);

create table if not exists clauree_rate (
  k      text        not null,               -- hashed visitor / key id
  bucket timestamptz not null,               -- the hour
  n      int         not null default 0,
  primary key (k, bucket)
);

-- Only the server (service role) may touch these. No public policies on purpose.
alter table clauree_sync enable row level security;
alter table clauree_rate enable row level security;

-- Counts one request and returns true while the visitor is under the hourly limit.
create or replace function clauree_hit(p_k text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare c int;
begin
  insert into clauree_rate (k, bucket, n)
  values (p_k, date_trunc('hour', now()), 1)
  on conflict (k, bucket) do update set n = clauree_rate.n + 1
  returning n into c;
  if random() < 0.02 then
    delete from clauree_rate where bucket < now() - interval '2 days';  -- old rate counters only
  end if;
  return c <= p_limit;
end $$;

revoke all on function clauree_hit(text, int) from public, anon, authenticated;
