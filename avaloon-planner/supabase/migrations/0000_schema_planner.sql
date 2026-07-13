-- ============================================================
-- Avaloon Planner — Migração 0000: Schema dedicado 'planner'
--
-- O Planner vive em um schema próprio, isolado do restante do
-- projeto Supabase que o hospeda. Isso permite compartilhar um
-- projeto existente (ex.: Avix) sem misturar tabelas, e migrar
-- para um projeto dedicado no futuro com um simples pg_dump do
-- schema. O Auth (auth.users) é compartilhado por projeto.
-- ============================================================

create schema if not exists planner;

grant usage on schema planner to anon, authenticated, service_role;

-- Objetos criados a seguir pelas migrações ficam acessíveis à API
alter default privileges in schema planner
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema planner
  grant all on functions to anon, authenticated, service_role;
alter default privileges in schema planner
  grant all on sequences to anon, authenticated, service_role;
