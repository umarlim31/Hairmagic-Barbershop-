-- Restore the original booking/feedback contract and manage the original visuals.
create or replace function private.hm_create_booking(payload jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_id text := coalesce(nullif(payload->>'id',''), pg_catalog.gen_random_uuid()::text);
  slot_date date := nullif(payload->>'booking_date','')::date;
  slot_time text := coalesce(payload->>'start_time','');
  selected_barber text := nullif(lower(trim(payload->>'barber_id')), '');
  v_customer_name text := trim(coalesce(payload->>'customer_name',''));
  v_customer_phone text := trim(coalesce(payload->>'customer_phone',''));
  booking_notes text := trim(coalesce(payload->>'notes',''));
  barber_name text;
  v_total int;
  v_barber_count int;
  v_visit timestamptz;
begin
  if requested_id !~ '^[A-Za-z0-9-]{8,80}$' then raise exception 'Invalid booking id'; end if;
  if char_length(v_customer_name) < 2 or char_length(v_customer_name) > 80 then
    raise exception 'Invalid customer name';
  end if;
  if v_customer_phone !~ '^[0-9]{8,15}$' then
    raise exception 'Invalid customer phone';
  end if;
  if char_length(booking_notes) > 500 then
    raise exception 'Notes too long';
  end if;
  if selected_barber is not null and selected_barber not in ('abibayu','rival','umar') then
    raise exception 'Invalid barber';
  end if;
  if slot_date is null or extract(isodow from slot_date) = 1 then
    raise exception 'Invalid appointment date';
  end if;
  if slot_time not in (
    '10:00','10:40','11:20','13:00','13:40','14:20','15:00','15:40','16:20','17:00',
    '19:00','19:40','20:20','21:00'
  ) then
    raise exception 'Invalid appointment slot';
  end if;

  v_visit := ((slot_date::text || ' ' || slot_time)::timestamp at time zone 'Asia/Makassar');
  if v_visit < pg_catalog.now() + interval '5 hours' then
    raise exception 'Advance booking window not met';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('booking|' || requested_id, 0));
  if exists(select 1 from public.bookings where id = requested_id) then
    return exists(select 1 from public.bookings b where b.id = requested_id
      and b.customer_name = v_customer_name and b.customer_phone = v_customer_phone
      and b.booking_date = slot_date and b.start_time = slot_time
      and b.barber_id is not distinct from selected_barber and b.notes = booking_notes);
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(slot_date::text || '|' || slot_time, 0));

  select pg_catalog.count(*)::int into v_total
  from public.bookings
  where booking_date = slot_date
    and start_time = slot_time
    and status in ('pending','confirmed','checked_in');
  if v_total >= 3 then return false; end if;

  if selected_barber is not null then
    select pg_catalog.count(*)::int into v_barber_count
    from public.bookings
    where booking_date = slot_date
      and start_time = slot_time
      and barber_id = selected_barber
      and status in ('pending','confirmed','checked_in');
    if v_barber_count >= 1 then return false; end if;
  end if;

  barber_name := case selected_barber
    when 'abibayu' then 'Abibayu'
    when 'rival' then 'Rival'
    when 'umar' then 'Umar'
    else null
  end;

  insert into public.bookings(
    id, customer_name, customer_phone, service_code, service_name,
    barber_id, barber_name, booking_date, start_time, end_time,
    status, source, notes
  ) values (
    requested_id, v_customer_name, v_customer_phone, 'haircut', 'Haircut',
    selected_barber, barber_name, slot_date, slot_time,
    pg_catalog.to_char(slot_time::time + interval '40 minutes','HH24:MI'),
    'pending', 'website', booking_notes
  );

  return true;
end;
$$;


create or replace function private.hm_submit_feedback(payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  submission uuid := coalesce(nullif(payload->>'id','')::uuid, pg_catalog.gen_random_uuid());
  score integer := (payload->>'rating')::integer;
  comment_text text := trim(coalesce(payload->>'message',''));
begin
  if score is null or score not between 1 and 5 or char_length(comment_text) > 1500 then
    raise exception 'Invalid feedback';
  end if;
  insert into public.feedback(id,rating,message,submitted_day)
  values (submission,score,comment_text,(pg_catalog.now() at time zone 'Asia/Makassar')::date)
  on conflict(id) do nothing;
end;
$$;

alter table public.media_assets add column asset_origin text not null default 'storage'
  check (asset_origin in ('storage','bundled'));
alter table public.media_assets add constraint known_bundled_media check (
  asset_origin <> 'bundled' or storage_path in (
    'hairmagic-film.mp4','hair-magic-kids-cut.webp','hair-magic-storefront.webp'
  )
);
-- Preserve the original assets and captions. Existing uploads are left intact.
insert into public.media_assets(storage_bucket,storage_path,asset_origin,kind,title,alt_text,caption,sort_order,published,is_hero)
values
('hairmagic-media','hairmagic-film.mp4','bundled','video','Di sinilah magic-nya.','Suasana Hairmagic Barbershop','',0,true,not exists(select 1 from public.media_assets where is_hero)),
('hairmagic-media','hair-magic-kids-cut.webp','bundled','image','Detail kecil. Perhatian penuh.','Kapster Hairmagic memotong rambut pelanggan anak','Dari pelanggan kecil sampai dewasa, setiap potongan punya ceritanya sendiri.',10,true,false),
('hairmagic-media','hair-magic-storefront.webp','bundled','image','Tempat untuk jadi diri sendiri.','Pintu masuk dan suasana di dalam Hairmagic Barbershop','Kenali suasana Hairmagic sebelum datang untuk potongan berikutnya.',20,true,false)
on conflict(storage_path) do nothing;

create function public.hm_set_hero(p_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.owner_accounts where user_id = (select auth.uid())) then
    raise exception 'Owner required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hairmagic-hero',0));
  if not exists(select 1 from public.media_assets where id = p_id and kind = 'video' and published) then
    raise exception 'Choose a published video';
  end if;
  update public.media_assets set is_hero = false where is_hero;
  update public.media_assets set is_hero = true where id = p_id;
end;
$$;
revoke all on function public.hm_set_hero(uuid) from public,anon,authenticated;
grant execute on function public.hm_set_hero(uuid) to authenticated;

create function public.hm_reorder_media(p_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.owner_accounts where user_id = (select auth.uid())) then
    raise exception 'Owner required' using errcode = '42501';
  end if;
  if cardinality(p_ids) > 500 or cardinality(p_ids) <> (select count(distinct x) from unnest(p_ids) x) then
    raise exception 'Invalid media order';
  end if;
  update public.media_assets m set sort_order = s.position::integer * 10
  from unnest(p_ids) with ordinality s(id,position) where m.id = s.id;
end;
$$;
revoke all on function public.hm_reorder_media(uuid[]) from public,anon,authenticated;
grant execute on function public.hm_reorder_media(uuid[]) to authenticated;
