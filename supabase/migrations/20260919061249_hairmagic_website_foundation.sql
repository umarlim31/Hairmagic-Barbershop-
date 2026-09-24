-- Hairmagic Website: separate from Hairmagic POS.
-- This migration does not import customer data or create an owner account.
-- Application reads/writes remain behind the existing server routes.

create table public.owner_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.owner_accounts enable row level security;
revoke all on public.owner_accounts from public, anon, authenticated;
grant select on public.owner_accounts to authenticated;
grant all on public.owner_accounts to service_role;
create policy owner_can_read_own_membership on public.owner_accounts
  for select to authenticated using ((select auth.uid()) = user_id);
-- Only service_role / the database administrator can provision owners.

create table public.bookings (
  id text primary key,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^[0-9]{8,15}$'),
  service_code text not null default 'haircut',
  service_name text not null default 'Haircut',
  barber_id text,
  barber_name text,
  booking_date date not null,
  start_time text not null check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  status text not null default 'pending',
  source text not null default 'website',
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now()
);
create index idx_bookings_date_time_status on public.bookings(booking_date, start_time, status);
create unique index uq_bookings_barber_active_slot on public.bookings(barber_id, booking_date, start_time)
  where barber_id is not null and status in ('pending', 'confirmed', 'checked_in');
alter table public.bookings enable row level security;
revoke all on public.bookings from public, anon, authenticated;
grant all on public.bookings to service_role;
grant select on public.bookings to authenticated;
create policy owner_reads_bookings on public.bookings for select to authenticated
  using ((select auth.uid()) in (select user_id from public.owner_accounts));

-- No name, phone, account, booking reference, precise timestamp, IP or device.
create table public.feedback (
  id uuid primary key,
  rating integer not null check (rating between 1 and 5),
  message text not null default '' check (char_length(message) <= 1500),
  submitted_day date not null
);
create index idx_feedback_day_id on public.feedback(submitted_day desc, id desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from public, anon, authenticated;
grant all on public.feedback to service_role;
grant select on public.feedback to authenticated;
create policy owner_reads_feedback on public.feedback for select to authenticated
  using ((select auth.uid()) in (select user_id from public.owner_accounts));

-- Prepared for the separately requested owner media manager.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null check (storage_bucket in ('hairmagic-media', 'hairmagic-media-drafts')),
  storage_path text not null unique,
  kind text not null check (kind in ('image', 'video')),
  title text not null default '' check (char_length(title) <= 120),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  caption text not null default '' check (char_length(caption) <= 500),
  sort_order integer not null default 0,
  published boolean not null default false,
  is_hero boolean not null default false,
  created_at timestamptz not null default now(),
  check (not published or storage_bucket = 'hairmagic-media'),
  check (not is_hero or (kind = 'video' and published))
);
create unique index one_published_hero on public.media_assets(is_hero) where is_hero;
create index gallery_order on public.media_assets(published, sort_order, id);
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select on public.media_assets to anon;
grant select, insert, update, delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
create policy public_published_media on public.media_assets for select to anon, authenticated using (published);
create policy owner_reads_media on public.media_assets for select to authenticated
  using ((select auth.uid()) in (select user_id from public.owner_accounts));
create policy owner_inserts_media on public.media_assets for insert to authenticated
  with check ((select auth.uid()) in (select user_id from public.owner_accounts));
create policy owner_updates_media on public.media_assets for update to authenticated
  using ((select auth.uid()) in (select user_id from public.owner_accounts))
  with check ((select auth.uid()) in (select user_id from public.owner_accounts));
create policy owner_deletes_media on public.media_assets for delete to authenticated
  using ((select auth.uid()) in (select user_id from public.owner_accounts));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('hairmagic-media', 'hairmagic-media', true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('hairmagic-media-drafts', 'hairmagic-media-drafts', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4']);
create policy owner_reads_hairmagic_files on storage.objects for select to authenticated
  using (bucket_id in ('hairmagic-media','hairmagic-media-drafts') and (select auth.uid()) in (select user_id from public.owner_accounts));
create policy owner_uploads_hairmagic_files on storage.objects for insert to authenticated
  with check (bucket_id in ('hairmagic-media','hairmagic-media-drafts') and (select auth.uid()) in (select user_id from public.owner_accounts));
create policy owner_updates_hairmagic_files on storage.objects for update to authenticated
  using (bucket_id in ('hairmagic-media','hairmagic-media-drafts') and (select auth.uid()) in (select user_id from public.owner_accounts))
  with check (bucket_id in ('hairmagic-media','hairmagic-media-drafts') and (select auth.uid()) in (select user_id from public.owner_accounts));
create policy owner_deletes_hairmagic_files on storage.objects for delete to authenticated
  using (bucket_id in ('hairmagic-media','hairmagic-media-drafts') and (select auth.uid()) in (select user_id from public.owner_accounts));

-- Server-only RPCs. No SECURITY DEFINER: service_role already has the explicit
-- grants it needs. Browser clients cannot call these routines.
create function public.hm_create_booking(payload jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  slot_date date := (payload->>'booking_date')::date;
  slot_time text := payload->>'start_time';
  selected_barber text := nullif(payload->>'barber_id', '');
begin
  if selected_barber is not null and selected_barber not in ('abibayu','rival','umar') then
    raise exception 'Invalid barber';
  end if;
  if extract(isodow from slot_date) = 1 or slot_time not in (
    '10:00','10:40','11:20','13:00','13:40','14:20','15:00','15:40','16:20','17:00',
    '19:00','19:40','20:20','21:00'
  ) then raise exception 'Invalid appointment slot'; end if;
  if ((slot_date::text || ' ' || slot_time)::timestamp at time zone 'Asia/Makassar') < now() + interval '5 hours' then
    raise exception 'Advance booking window not met';
  end if;
  -- Serializes every booking writer for this slot, including unassigned barbers.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(slot_date::text || '|' || slot_time, 0));
  if (select count(*) from public.bookings where booking_date = slot_date and start_time = slot_time
      and status in ('pending','confirmed','checked_in')) >= 3 then return false; end if;
  if selected_barber is not null and exists (
    select 1 from public.bookings where booking_date = slot_date and start_time = slot_time
    and barber_id = selected_barber and status in ('pending','confirmed','checked_in')
  ) then return false; end if;
  insert into public.bookings(id,customer_name,customer_phone,barber_id,barber_name,booking_date,start_time,end_time,notes)
    values (payload->>'id',payload->>'customer_name',payload->>'customer_phone',selected_barber,payload->>'barber_name',
      slot_date,slot_time,to_char(slot_time::time + interval '40 minutes','HH24:MI'),coalesce(payload->>'notes',''));
  return true;
end;
$$;
revoke all on function public.hm_create_booking(jsonb) from public, anon, authenticated;
grant execute on function public.hm_create_booking(jsonb) to service_role;

create function public.hm_active_bookings(p_date date) returns table(barber_id text,start_time text)
language sql stable security invoker set search_path = '' as $$
  select b.barber_id,b.start_time from public.bookings b
    where b.booking_date=p_date and b.status in ('pending','confirmed','checked_in');
$$;
revoke all on function public.hm_active_bookings(date) from public, anon, authenticated;
grant execute on function public.hm_active_bookings(date) to service_role;

create function public.hm_submit_feedback(payload jsonb) returns void
language sql security invoker set search_path = '' as $$
  insert into public.feedback(id,rating,message,submitted_day)
    values ((payload->>'id')::uuid,(payload->>'rating')::integer,coalesce(payload->>'message',''),(payload->>'submitted_day')::date)
    on conflict(id) do nothing;
$$;
revoke all on function public.hm_submit_feedback(jsonb) from public, anon, authenticated;
grant execute on function public.hm_submit_feedback(jsonb) to service_role;

create function public.hm_feedback_report(p_day date default null,p_id uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'counts',coalesce((select jsonb_agg(c) from (select rating,count(*) as count from public.feedback group by rating) c),'[]'::jsonb),
    'rows',coalesce((select jsonb_agg(r order by r."submittedDay" desc,r.id desc) from (
      select id,rating,message,submitted_day as "submittedDay" from public.feedback
      where p_day is null or submitted_day<p_day or (submitted_day=p_day and id<p_id)
      order by submitted_day desc,id desc limit 21
    ) r),'[]'::jsonb)
  );
$$;
revoke all on function public.hm_feedback_report(date,uuid) from public, anon, authenticated;
grant execute on function public.hm_feedback_report(date,uuid) to service_role;
