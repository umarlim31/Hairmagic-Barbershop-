
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.hm_active_bookings(p_date date)
returns table(barber_id text, start_time text)
language sql stable security definer set search_path = ''
as $$
  select b.barber_id, b.start_time
  from public.bookings b
  where b.booking_date = p_date
    and b.status in ('pending','confirmed','checked_in');
$$;

create or replace function private.hm_create_booking(payload jsonb)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  slot_date date := nullif(payload->>'booking_date','')::date;
  slot_time text := coalesce(payload->>'start_time','');
  selected_barber text := nullif(lower(trim(payload->>'barber_id')), '');
  customer_name text := trim(coalesce(payload->>'customer_name',''));
  customer_phone text := trim(coalesce(payload->>'customer_phone',''));
  booking_notes text := trim(coalesce(payload->>'notes',''));
  barber_name text;
  v_total int;
  v_barber_count int;
  v_visit timestamptz;
begin
  if char_length(customer_name) < 2 or char_length(customer_name) > 80 then raise exception 'Invalid customer name'; end if;
  if customer_phone !~ '^[0-9]{8,15}$' then raise exception 'Invalid customer phone'; end if;
  if char_length(booking_notes) > 500 then raise exception 'Notes too long'; end if;
  if selected_barber is not null and selected_barber not in ('abibayu','rival','umar') then raise exception 'Invalid barber'; end if;
  if slot_date is null or extract(isodow from slot_date) = 1 then raise exception 'Invalid appointment date'; end if;
  if slot_time not in ('10:00','10:40','11:20','13:00','13:40','14:20','15:00','15:40','16:20','17:00','19:00','19:40','20:20','21:00')
    then raise exception 'Invalid appointment slot'; end if;

  v_visit := ((slot_date::text || ' ' || slot_time)::timestamp at time zone 'Asia/Makassar');
  if v_visit < pg_catalog.now() + interval '5 hours' then raise exception 'Advance booking window not met'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(slot_date::text || '|' || slot_time, 0));

  select pg_catalog.count(*)::int into v_total
  from public.bookings
  where booking_date = slot_date and start_time = slot_time and status in ('pending','confirmed','checked_in');
  if v_total >= 3 then return false; end if;

  if selected_barber is not null then
    select pg_catalog.count(*)::int into v_barber_count
    from public.bookings
    where booking_date = slot_date and start_time = slot_time and barber_id = selected_barber
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
    barber_id, barber_name, booking_date, start_time, end_time, status, source, notes
  ) values (
    pg_catalog.gen_random_uuid()::text, customer_name, customer_phone, 'haircut', 'Haircut',
    selected_barber, barber_name, slot_date, slot_time,
    pg_catalog.to_char(slot_time::time + interval '40 minutes','HH24:MI'),
    'pending', 'website', booking_notes
  );

  return true;
end;
$$;

create or replace function private.hm_submit_feedback(payload jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_rating int := (payload->>'rating')::int;
  v_message text := trim(coalesce(payload->>'message',''));
begin
  if v_rating not between 1 and 5 then raise exception 'Invalid rating'; end if;
  if char_length(v_message) > 1500 then raise exception 'Feedback too long'; end if;
  insert into public.feedback(id, rating, message, submitted_day)
  values (pg_catalog.gen_random_uuid(), v_rating, v_message, (pg_catalog.now() at time zone 'Asia/Makassar')::date);
end;
$$;

revoke execute on function private.hm_active_bookings(date) from public;
revoke execute on function private.hm_create_booking(jsonb) from public;
revoke execute on function private.hm_submit_feedback(jsonb) from public;
grant execute on function private.hm_active_bookings(date) to anon, authenticated, service_role;
grant execute on function private.hm_create_booking(jsonb) to anon, authenticated, service_role;
grant execute on function private.hm_submit_feedback(jsonb) to anon, authenticated, service_role;

create or replace function public.hm_active_bookings(p_date date)
returns table(barber_id text, start_time text)
language sql stable security invoker set search_path = ''
as $$ select * from private.hm_active_bookings(p_date); $$;

create or replace function public.hm_create_booking(payload jsonb)
returns boolean
language sql security invoker set search_path = ''
as $$ select private.hm_create_booking(payload); $$;

create or replace function public.hm_submit_feedback(payload jsonb)
returns void
language sql security invoker set search_path = ''
as $$ select private.hm_submit_feedback(payload); $$;

revoke execute on function public.hm_active_bookings(date) from public, anon, authenticated;
revoke execute on function public.hm_create_booking(jsonb) from public, anon, authenticated;
revoke execute on function public.hm_submit_feedback(jsonb) from public, anon, authenticated;
revoke execute on function public.hm_feedback_report(date,uuid) from public, anon, authenticated;

grant execute on function public.hm_active_bookings(date) to anon, authenticated;
grant execute on function public.hm_create_booking(jsonb) to anon, authenticated;
grant execute on function public.hm_submit_feedback(jsonb) to anon, authenticated;
grant execute on function public.hm_feedback_report(date,uuid) to authenticated;
