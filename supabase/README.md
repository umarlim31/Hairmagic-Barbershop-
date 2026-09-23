# Supabase production baseline

Project: `hairmagic-website` (`lrhggtctzwhujjmngmvr`, Singapore / `ap-southeast-1`).

Already present in production before this recovery branch:

- `20260919061249 hairmagic_website_foundation`
- `20260919061515 consolidate_media_read_policy`

The production schema uses `owner_accounts`, `bookings`, `feedback`, `media_assets`, the public bucket `hairmagic-media`, and the private draft bucket `hairmagic-media-drafts`.

`20260923022409_public_rpc_bridge.sql` is additive. It keeps the Astra public RPC signatures but moves privileged insert/read work into the non-exposed `private` schema. Public tables remain protected by their existing grants and RLS policies.

Never put a `service_role` or secret key in browser code. The website only uses the project URL plus a publishable key; Owner operations additionally use the signed-in user's access token and RLS membership in `owner_accounts`.
