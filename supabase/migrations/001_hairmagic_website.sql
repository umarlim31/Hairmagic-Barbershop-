-- Hairmagic Website recovery schema — September 2026 baseline.
-- Safe frontend rule: only SUPABASE_URL + anon key are public. Never expose service_role.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 8 and 30),
  barber text null check (barber in ('Abibayu','Rival','Umar')),
  visit_date date not null,
  visit_time time not null,
  notes text null check (char_length(notes) <= 1200),
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_visit_idx on public.bookings(visit_date, visit_time, status);
create index if not exists bookings_barber_idx on public.bookings(visit_date, visit_time, barber, status);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  rating int not null check (rating between 1 and 5),
  category text not null default 'lainnya' check (category in ('pelayanan','hasil-cukur','kenyamanan','kebersihan','lainnya')),
  message text null check (char_length(message) <= 1200),
  source text not null default 'website' check (source in ('website','qr')),
  created_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  section text not null default 'gallery' check (section in ('hero','gallery','about')),
  caption text null check (char_length(caption) <= 240),
  alt_text text null check (char_length(alt_text) <= 240),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_owner()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner';
$$;

alter table public.bookings enable row level security;
alter table public.ratings enable row level security;
alter table public.media_items enable row level security;

drop policy if exists owner_all_bookings on public.bookings;
create policy owner_all_bookings on public.bookings for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists owner_read_ratings on public.ratings;
create policy owner_read_ratings on public.ratings for select to authenticated using (public.is_owner());

drop policy if exists public_read_active_media on public.media_items;
create policy public_read_active_media on public.media_items for select to anon, authenticated using (is_active or public.is_owner());
drop policy if exists owner_manage_media on public.media_items;
create policy owner_manage_media on public.media_items for all to authenticated using (public.is_owner()) with check (public.is_owner());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-media','website-media',true,12582912,array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'])
on conflict (id) do update set public=true, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists public_read_website_media on storage.objects;
create policy public_read_website_media on storage.objects for select to public using (bucket_id='website-media');
drop policy if exists owner_insert_website_media on storage.objects;
create policy owner_insert_website_media on storage.objects for insert to authenticated with check (bucket_id='website-media' and public.is_owner());
drop policy if exists owner_update_website_media on storage.objects;
create policy owner_update_website_media on storage.objects for update to authenticated using (bucket_id='website-media' and public.is_owner()) with check (bucket_id='website-media' and public.is_owner());
drop policy if exists owner_delete_website_media on storage.objects;
create policy owner_delete_website_media on storage.objects for delete to authenticated using (bucket_id='website-media' and public.is_owner());

create or replace function public.valid_booking_slot(p_time time)
returns boolean language sql immutable as $$
  select p_time in (
    time '10:00', time '10:40', time '11:20',
    time '13:00', time '13:40', time '14:20', time '15:00', time '15:40', time '16:20', time '17:00',
    time '19:00', time '19:40', time '20:20', time '21:00'
  );
$$;

create or replace function public.public_booking_availability(p_visit_date date, p_barber text default null)
returns table(slot_time time, remaining int)
language sql security definer set search_path=public as $$
  with slots(slot_time) as (
    values (time '10:00'),(time '10:40'),(time '11:20'),(time '13:00'),(time '13:40'),(time '14:20'),(time '15:00'),(time '15:40'),(time '16:20'),(time '17:00'),(time '19:00'),(time '19:40'),(time '20:20'),(time '21:00')
  ), counts as (
    select b.visit_time,
           count(*) filter (where b.status in ('pending','confirmed'))::int total_count,
           count(*) filter (where b.status in ('pending','confirmed') and b.barber = p_barber)::int barber_count
    from public.bookings b where b.visit_date=p_visit_date group by b.visit_time
  )
  select s.slot_time,
    greatest(0, case when p_barber is null or p_barber='' then 3-coalesce(c.total_count,0) else least(3-coalesce(c.total_count,0),1-coalesce(c.barber_count,0)) end)::int
  from slots s left join counts c on c.visit_time=s.slot_time
  order by s.slot_time;
$$;

grant execute on function public.public_booking_availability(date,text) to anon, authenticated;

create or replace function public.public_create_booking(
  p_name text, p_phone text, p_barber text, p_visit_date date, p_visit_time time, p_notes text default null
) returns table(booking_id uuid, whatsapp_text text)
language plpgsql security definer set search_path=public as $$
declare
  v_total int;
  v_barber_count int;
  v_id uuid;
  v_visit timestamptz;
begin
  if extract(isodow from p_visit_date) = 1 then raise exception 'Hairmagic tutup setiap Senin'; end if;
  if p_visit_date < (now() at time zone 'Asia/Makassar')::date then raise exception 'Tanggal booking sudah lewat'; end if;
  if not public.valid_booking_slot(p_visit_time) then raise exception 'Jam booking tidak valid'; end if;
  if p_barber is not null and p_barber <> '' and p_barber not in ('Abibayu','Rival','Umar') then raise exception 'Kapster tidak valid'; end if;
  v_visit := ((p_visit_date::text || ' ' || p_visit_time::text)::timestamp at time zone 'Asia/Makassar');
  if v_visit < now() + interval '5 hours' then raise exception 'Booking minimal 5 jam sebelum waktu cukur'; end if;

  perform pg_advisory_xact_lock(hashtext(p_visit_date::text || p_visit_time::text));
  select count(*)::int into v_total from public.bookings where visit_date=p_visit_date and visit_time=p_visit_time and status in ('pending','confirmed');
  if v_total >= 3 then raise exception 'Slot sudah penuh'; end if;
  if p_barber is not null and p_barber <> '' then
    select count(*)::int into v_barber_count from public.bookings where visit_date=p_visit_date and visit_time=p_visit_time and barber=p_barber and status in ('pending','confirmed');
    if v_barber_count >= 1 then raise exception 'Kapster tersebut sudah terisi pada jam ini'; end if;
  end if;

  insert into public.bookings(customer_name,phone,barber,visit_date,visit_time,notes)
  values(trim(p_name),trim(p_phone),nullif(trim(p_barber),''),p_visit_date,p_visit_time,nullif(trim(p_notes),'')) returning id into v_id;

  return query select v_id,
    'Halo Hairmagic, saya ' || trim(p_name) || ' sudah mengirim permintaan booking untuk ' || to_char(p_visit_date,'DD/MM/YYYY') || ' pukul ' || to_char(p_visit_time,'HH24:MI') || ' WITA' || case when p_barber is null or trim(p_barber)='' then '.' else ' dengan kapster '||trim(p_barber)||'.' end || ' Mohon konfirmasi jadwalnya.';
end; $$;

grant execute on function public.public_create_booking(text,text,text,date,time,text) to anon, authenticated;

create or replace function public.public_submit_rating(p_rating int,p_category text,p_message text default null,p_source text default 'website')
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_rating not between 1 and 5 then raise exception 'Rating harus 1 sampai 5'; end if;
  if p_category not in ('pelayanan','hasil-cukur','kenyamanan','kebersihan','lainnya') then raise exception 'Kategori tidak valid'; end if;
  if p_source not in ('website','qr') then raise exception 'Sumber tidak valid'; end if;
  insert into public.ratings(rating,category,message,source) values(p_rating,p_category,nullif(trim(p_message),''),p_source) returning id into v_id;
  return v_id;
end; $$;

grant execute on function public.public_submit_rating(int,text,text,text) to anon, authenticated;

create or replace function public.owner_report_summary()
returns table(bookings_today bigint, bookings_upcoming bigint, ratings_count bigint, average_rating numeric, active_media bigint)
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  return query select
    (select count(*) from public.bookings where visit_date=(now() at time zone 'Asia/Makassar')::date and status<>'cancelled'),
    (select count(*) from public.bookings where visit_date>=(now() at time zone 'Asia/Makassar')::date and status in ('pending','confirmed')),
    (select count(*) from public.ratings),
    (select round(avg(rating)::numeric,2) from public.ratings),
    (select count(*) from public.media_items where is_active);
end; $$;

grant execute on function public.owner_report_summary() to authenticated;
