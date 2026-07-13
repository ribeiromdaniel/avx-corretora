-- ============================================================
-- Avaloon Planner — Migração 0002: Row Level Security
--
-- Regra geral:
--   gerente_conta  → só os clientes onde é gc_responsavel
--   diretor        → tudo (leitura + decisão)
--   admin          → tudo + tabelas de configuração
-- ============================================================

alter table planner.profiles         enable row level security;
alter table planner.clientes         enable row level security;
alter table planner.blocos_config    enable row level security;
alter table planner.dossie_blocos    enable row level security;
alter table planner.camadas_config   enable row level security;
alter table planner.planos           enable row level security;
alter table planner.plano_camadas    enable row level security;
alter table planner.aprovacoes       enable row level security;
alter table planner.demandas_extras  enable row level security;
alter table planner.resultados_ciclo enable row level security;
alter table planner.prompts_config   enable row level security;
alter table planner.eventos          enable row level security;

-- ------------------------------------------------------------
-- profiles: todos os usuários autenticados leem (nomes na UI);
-- cada um edita o próprio; admin gerencia papéis.
-- ------------------------------------------------------------
create policy "profiles_select" on planner.profiles
  for select to authenticated using (true);

create policy "profiles_update_self" on planner.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and papel = (select papel from planner.profiles p where p.id = auth.uid()));

create policy "profiles_admin_all" on planner.profiles
  for all to authenticated
  using (planner.eh_admin())
  with check (planner.eh_admin());

-- ------------------------------------------------------------
-- clientes
-- ------------------------------------------------------------
create policy "clientes_select" on planner.clientes
  for select to authenticated
  using (planner.eh_diretor() or gc_responsavel = auth.uid());

create policy "clientes_insert" on planner.clientes
  for insert to authenticated
  with check (planner.eh_diretor() or gc_responsavel = auth.uid());

create policy "clientes_update" on planner.clientes
  for update to authenticated
  using (planner.eh_diretor() or gc_responsavel = auth.uid());

create policy "clientes_delete" on planner.clientes
  for delete to authenticated
  using (planner.eh_admin());

-- ------------------------------------------------------------
-- dossie_blocos
-- ------------------------------------------------------------
create policy "dossie_select" on planner.dossie_blocos
  for select to authenticated using (planner.pode_ver_cliente(cliente_id));

create policy "dossie_insert" on planner.dossie_blocos
  for insert to authenticated with check (planner.pode_ver_cliente(cliente_id));

create policy "dossie_update" on planner.dossie_blocos
  for update to authenticated using (planner.pode_ver_cliente(cliente_id));

-- ------------------------------------------------------------
-- planos
-- ------------------------------------------------------------
create policy "planos_select" on planner.planos
  for select to authenticated using (planner.pode_ver_cliente(cliente_id));

create policy "planos_insert" on planner.planos
  for insert to authenticated with check (planner.pode_ver_cliente(cliente_id));

create policy "planos_update" on planner.planos
  for update to authenticated using (planner.pode_ver_cliente(cliente_id));

-- ------------------------------------------------------------
-- plano_camadas
-- ------------------------------------------------------------
create policy "plano_camadas_select" on planner.plano_camadas
  for select to authenticated
  using (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ));

create policy "plano_camadas_write" on planner.plano_camadas
  for all to authenticated
  using (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ))
  with check (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ));

-- ------------------------------------------------------------
-- aprovacoes: leitura por quem vê o cliente; escrita só via RPC
-- decidir_plano (security definer) — insert direto só diretor.
-- ------------------------------------------------------------
create policy "aprovacoes_select" on planner.aprovacoes
  for select to authenticated
  using (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ));

create policy "aprovacoes_insert" on planner.aprovacoes
  for insert to authenticated
  with check (planner.eh_diretor() and diretor_id = auth.uid());

-- ------------------------------------------------------------
-- demandas_extras
-- ------------------------------------------------------------
create policy "demandas_select" on planner.demandas_extras
  for select to authenticated using (planner.pode_ver_cliente(cliente_id));

create policy "demandas_insert" on planner.demandas_extras
  for insert to authenticated with check (planner.pode_ver_cliente(cliente_id));

create policy "demandas_update" on planner.demandas_extras
  for update to authenticated using (planner.pode_ver_cliente(cliente_id));

-- ------------------------------------------------------------
-- resultados_ciclo
-- ------------------------------------------------------------
create policy "resultados_select" on planner.resultados_ciclo
  for select to authenticated
  using (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ));

create policy "resultados_insert" on planner.resultados_ciclo
  for insert to authenticated
  with check (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ));

-- ------------------------------------------------------------
-- eventos: leitura por quem vê o cliente (inserts vêm de trigger
-- security definer, nunca do client)
-- ------------------------------------------------------------
create policy "eventos_select" on planner.eventos
  for select to authenticated
  using (exists (
    select 1 from planner.planos p
    where p.id = plano_id and planner.pode_ver_cliente(p.cliente_id)
  ));

-- ------------------------------------------------------------
-- Tabelas de configuração: leitura para todos autenticados,
-- escrita só admin.
-- ------------------------------------------------------------
create policy "blocos_config_select" on planner.blocos_config
  for select to authenticated using (true);
create policy "blocos_config_admin" on planner.blocos_config
  for all to authenticated using (planner.eh_admin()) with check (planner.eh_admin());

create policy "camadas_config_select" on planner.camadas_config
  for select to authenticated using (true);
create policy "camadas_config_admin" on planner.camadas_config
  for all to authenticated using (planner.eh_admin()) with check (planner.eh_admin());

create policy "prompts_config_select" on planner.prompts_config
  for select to authenticated using (true);
create policy "prompts_config_admin" on planner.prompts_config
  for all to authenticated using (planner.eh_admin()) with check (planner.eh_admin());
