-- ============================================================
-- Avaloon Planner — Migração 0002: Row Level Security
--
-- Regra geral:
--   gerente_conta  → só os clientes onde é gc_responsavel
--   diretor        → tudo (leitura + decisão)
--   admin          → tudo + tabelas de configuração
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.clientes         enable row level security;
alter table public.blocos_config    enable row level security;
alter table public.dossie_blocos    enable row level security;
alter table public.camadas_config   enable row level security;
alter table public.planos           enable row level security;
alter table public.plano_camadas    enable row level security;
alter table public.aprovacoes       enable row level security;
alter table public.demandas_extras  enable row level security;
alter table public.resultados_ciclo enable row level security;
alter table public.prompts_config   enable row level security;
alter table public.eventos          enable row level security;

-- ------------------------------------------------------------
-- profiles: todos os usuários autenticados leem (nomes na UI);
-- cada um edita o próprio; admin gerencia papéis.
-- ------------------------------------------------------------
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and papel = (select papel from public.profiles p where p.id = auth.uid()));

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- ------------------------------------------------------------
-- clientes
-- ------------------------------------------------------------
create policy "clientes_select" on public.clientes
  for select to authenticated
  using (public.eh_diretor() or gc_responsavel = auth.uid());

create policy "clientes_insert" on public.clientes
  for insert to authenticated
  with check (public.eh_diretor() or gc_responsavel = auth.uid());

create policy "clientes_update" on public.clientes
  for update to authenticated
  using (public.eh_diretor() or gc_responsavel = auth.uid());

create policy "clientes_delete" on public.clientes
  for delete to authenticated
  using (public.eh_admin());

-- ------------------------------------------------------------
-- dossie_blocos
-- ------------------------------------------------------------
create policy "dossie_select" on public.dossie_blocos
  for select to authenticated using (public.pode_ver_cliente(cliente_id));

create policy "dossie_insert" on public.dossie_blocos
  for insert to authenticated with check (public.pode_ver_cliente(cliente_id));

create policy "dossie_update" on public.dossie_blocos
  for update to authenticated using (public.pode_ver_cliente(cliente_id));

-- ------------------------------------------------------------
-- planos
-- ------------------------------------------------------------
create policy "planos_select" on public.planos
  for select to authenticated using (public.pode_ver_cliente(cliente_id));

create policy "planos_insert" on public.planos
  for insert to authenticated with check (public.pode_ver_cliente(cliente_id));

create policy "planos_update" on public.planos
  for update to authenticated using (public.pode_ver_cliente(cliente_id));

-- ------------------------------------------------------------
-- plano_camadas
-- ------------------------------------------------------------
create policy "plano_camadas_select" on public.plano_camadas
  for select to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ));

create policy "plano_camadas_write" on public.plano_camadas
  for all to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ))
  with check (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ));

-- ------------------------------------------------------------
-- aprovacoes: leitura por quem vê o cliente; escrita só via RPC
-- decidir_plano (security definer) — insert direto só diretor.
-- ------------------------------------------------------------
create policy "aprovacoes_select" on public.aprovacoes
  for select to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ));

create policy "aprovacoes_insert" on public.aprovacoes
  for insert to authenticated
  with check (public.eh_diretor() and diretor_id = auth.uid());

-- ------------------------------------------------------------
-- demandas_extras
-- ------------------------------------------------------------
create policy "demandas_select" on public.demandas_extras
  for select to authenticated using (public.pode_ver_cliente(cliente_id));

create policy "demandas_insert" on public.demandas_extras
  for insert to authenticated with check (public.pode_ver_cliente(cliente_id));

create policy "demandas_update" on public.demandas_extras
  for update to authenticated using (public.pode_ver_cliente(cliente_id));

-- ------------------------------------------------------------
-- resultados_ciclo
-- ------------------------------------------------------------
create policy "resultados_select" on public.resultados_ciclo
  for select to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ));

create policy "resultados_insert" on public.resultados_ciclo
  for insert to authenticated
  with check (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ));

-- ------------------------------------------------------------
-- eventos: leitura por quem vê o cliente (inserts vêm de trigger
-- security definer, nunca do client)
-- ------------------------------------------------------------
create policy "eventos_select" on public.eventos
  for select to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = plano_id and public.pode_ver_cliente(p.cliente_id)
  ));

-- ------------------------------------------------------------
-- Tabelas de configuração: leitura para todos autenticados,
-- escrita só admin.
-- ------------------------------------------------------------
create policy "blocos_config_select" on public.blocos_config
  for select to authenticated using (true);
create policy "blocos_config_admin" on public.blocos_config
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "camadas_config_select" on public.camadas_config
  for select to authenticated using (true);
create policy "camadas_config_admin" on public.camadas_config
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "prompts_config_select" on public.prompts_config
  for select to authenticated using (true);
create policy "prompts_config_admin" on public.prompts_config
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
