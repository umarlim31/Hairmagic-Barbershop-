# Hairmagic Barbershop Website — September 2026 Recovery

This branch reconstructs the **September 2026 Astra website baseline** and intentionally does not use the obsolete July HTML as the source of truth.

## Recovered product baseline

- Hero: **“Gaya punya kamu. Magic dari kami.”**
- Services: Haircut, Coloring, Perm, Perawatan
- Haircut booking: 40 minutes, Tuesday–Sunday, 10.00–22.00 WITA, breaks 12.00–13.00 and 18.00–19.00
- Minimum booking lead time: 5 hours
- Barbers: Abibayu Rp40.000, Rival Rp40.000, Umar Rp60.000
- Booking is stored before WhatsApp confirmation
- Anonymous ratings / QR feedback do not collect customer identity
- Protected Owner area via Supabase Auth
- Owner media management and owner-only report summary
- Supabase RLS and server-side booking-capacity enforcement

## Local setup

1. `npm install`
2. `npm run check`
3. Production Supabase already contains the Astra foundation migrations plus `20260923022409 public_rpc_bridge`. Do not re-create the schema from scratch.
4. `public/runtime-config.js` points to the `hairmagic-website` project using its public publishable key. Never put a service-role/secret key in browser code.
5. Owner authorization uses the production `owner_accounts` membership table plus Supabase Auth. Add an Auth user to `owner_accounts` only from a trusted admin/database context.

## Security model

- Public visitors cannot read booking customer data.
- Public booking calls `hm_create_booking(jsonb)`. The public wrapper is SECURITY INVOKER and delegates validated privileged work to a helper in the non-exposed `private` schema, so capacity and minimum lead time are enforced in PostgreSQL, not only in JavaScript.
- Public availability uses `hm_active_bookings(date)` and exposes only barber/slot occupancy needed to calculate remaining capacity, never customer identity.
- Feedback is anonymous by schema: there are no name/phone columns, and public submission goes through `hm_submit_feedback(jsonb)`.
- Published media uses the existing public `hairmagic-media` bucket; media writes require an authenticated user who is present in `owner_accounts`.
- Owner access is authorized by Supabase Auth plus membership in the production `owner_accounts` table; authorization does not trust user-editable metadata.

## Recovery status

This source is intended for branch `recovery/astra-september-2026`. Do not merge to `main` until Supabase migration, runtime config, owner login, booking, media upload, feedback QR, and public-access regression checks all pass.
