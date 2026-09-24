-- Keep one SELECT policy per role without changing who may see published media.
alter policy public_published_media on public.media_assets to anon;
alter policy owner_reads_media on public.media_assets
  using (published or (select auth.uid()) in (select user_id from public.owner_accounts));
