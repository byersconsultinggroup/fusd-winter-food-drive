-- FUSD Foundation — Winter Food Drive
-- Run ONCE in the Supabase SQL editor (Project → SQL Editor → New query).

create table if not exists items (
  id          text primary key,            -- slug, matches app.js ITEMS id
  name        text not null,
  goal        int  not null,
  pledged     int  not null default 0,
  walmart_url text,
  image_file  text,
  sort        int  default 0
);

alter table items enable row level security;

-- anyone may read the list + counts.
-- Tables made via raw SQL don't auto-grant to the anon role, so grant it
-- explicitly (the RLS policy below then governs which rows are visible).
grant select on items to anon, authenticated;
drop policy if exists "public read" on items;
create policy "public read" on items for select using (true);

-- the ONLY write path: a bounded increment. No direct updates are allowed,
-- so visitors cannot set arbitrary totals.
create or replace function increment_pledge(p_id text, p_qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty < 1 or p_qty > 500 then
    raise exception 'quantity out of range';
  end if;
  update items set pledged = pledged + p_qty where id = p_id;
  if not found then
    raise exception 'unknown item %', p_id;
  end if;
end;
$$;

grant execute on function increment_pledge(text, int) to anon;
