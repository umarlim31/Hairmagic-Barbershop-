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
3. Apply `supabase/migrations/001_hairmagic_website.sql` to the `hairmagic-website` Supabase project.
4. Copy `public/runtime-config.js` values into the deployment environment/build step using the public Supabase URL and **anon key only**.
5. Create Owner users in Supabase Auth and set `app_metadata.role = "owner"` using a trusted admin/server context. Never expose the service-role key in this repository or browser.

## Security model

- Public visitors cannot read booking customer data.
- Public booking uses `public_create_booking()` (SECURITY DEFINER) so capacity and minimum lead time are enforced in PostgreSQL, not only in JavaScript.
- Public availability exposes counts only, never customer identity.
- Ratings are anonymous by schema: there are no name/phone columns.
- Media is publicly readable only from the dedicated `website-media` bucket; writes require authenticated Owner role.
- Owner reports require an authenticated JWT with `app_metadata.role = owner`.

## Recovery status

This source is intended for branch `recovery/astra-september-2026`. Do not merge to `main` until Supabase migration, runtime config, owner login, booking, media upload, feedback QR, and public-access regression checks all pass.
