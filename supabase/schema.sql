-- ───────────────────────── KHIRNA · schéma Supabase (prototype) ─────────────────────────
-- À exécuter UNE fois : Supabase → SQL Editor → New query → coller → Run.
-- Chaque collection de l'app = une table (id + données JSON). Le script est ré-exécutable.
--
-- ⚠ Prototype de démo : les politiques ci-dessous autorisent la lecture/écriture à toute
-- personne qui possède la clé publique (anon). Ne JAMAIS y mettre de vraies données.

do $$
declare
  t text;
  tables text[] := array[
    'users', 'projects', 'investments', 'wallets', 'transactions', 'updates',
    'visits', 'offers', 'applications', 'sale_reports', 'distributions', 'notifications'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create table if not exists public.%I (
         id text primary key,
         data jsonb not null,
         updated_at timestamptz not null default now()
       )', t);

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo_all" on public.%I', t);
    execute format(
      'create policy "demo_all" on public.%I for all to anon, authenticated using (true) with check (true)', t);

    -- Temps réel : les autres appareils reçoivent chaque modification.
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
