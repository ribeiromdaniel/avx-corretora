-- ============================================================
-- Avaloon Planner — Migração 0001: Schema
-- Tabelas, constraints, triggers de updated_at, máquina de
-- estados do plano e trilha de eventos.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles (vinculada ao Supabase Auth)
-- ------------------------------------------------------------
create table planner.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  papel text not null default 'gerente_conta'
    check (papel in ('gerente_conta', 'diretor', 'admin')),
  cargo_diretor text, -- ex.: 'Diretor Criativo' | 'Diretor Comercial' | 'Diretor de Marketing'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cria o profile automaticamente no signup
create or replace function planner.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into planner.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_planner
  after insert on auth.users
  for each row execute function planner.handle_new_user();

-- ------------------------------------------------------------
-- clientes
-- ------------------------------------------------------------
create table planner.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text not null default '',
  cidade text not null default 'Montes Claros/MG',
  gc_responsavel uuid references planner.profiles (id),
  status text not null default 'ativo'
    check (status in ('ativo', 'pausado', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_gc_idx on planner.clientes (gc_responsavel);

-- ------------------------------------------------------------
-- blocos_config — blocos do briefing são dados, não código
-- schema jsonb: { "campos": [{ "chave", "rotulo", "descricao" }] }
-- ------------------------------------------------------------
create table planner.blocos_config (
  codigo text primary key,
  titulo text not null,
  ordem int not null default 0,
  schema jsonb not null default '{"campos": []}'::jsonb,
  ativo boolean not null default true
);

-- ------------------------------------------------------------
-- dossie_blocos — um registro por bloco, por cliente
-- ------------------------------------------------------------
create table planner.dossie_blocos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references planner.clientes (id) on delete cascade,
  bloco_codigo text not null references planner.blocos_config (codigo),
  conteudo jsonb not null default '{}'::jsonb,
  completude int not null default 0 check (completude between 0 and 100),
  atualizado_por uuid references planner.profiles (id),
  updated_at timestamptz not null default now(),
  unique (cliente_id, bloco_codigo)
);

create index dossie_blocos_cliente_idx on planner.dossie_blocos (cliente_id);

-- ------------------------------------------------------------
-- camadas_config — camadas de entregável são dados, não código
-- ------------------------------------------------------------
create table planner.camadas_config (
  codigo text primary key,
  titulo text not null,
  descricao text not null default '',
  obrigatoria boolean not null default false,
  ordem int not null default 0,
  ativo boolean not null default true
);

-- ------------------------------------------------------------
-- planos
-- ------------------------------------------------------------
create table planner.planos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references planner.clientes (id) on delete cascade,
  periodo_tipo text not null
    check (periodo_tipo in ('mensal', 'trimestral', 'semestral')),
  periodo_inicio date not null,
  periodo_fim date not null,
  status text not null default 'rascunho_ia'
    check (status in (
      'rascunho_ia', 'em_revisao_gc', 'aguardando_aprovacao',
      'ajustes_solicitados', 'aprovado', 'apresentado_cliente',
      'em_execucao', 'ciclo_fechado'
    )),
  objetivo_performance jsonb not null default '{}'::jsonb,
  objetivo_marca jsonb not null default '{}'::jsonb,
  ajustes_gc text not null default '',
  gerado_em timestamptz,
  versao_prompt text,
  created_by uuid references planner.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (periodo_fim >= periodo_inicio)
);

create index planos_cliente_idx on planner.planos (cliente_id);
create index planos_status_idx on planner.planos (status);

-- ------------------------------------------------------------
-- plano_camadas
-- ------------------------------------------------------------
create table planner.plano_camadas (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references planner.planos (id) on delete cascade,
  camada_codigo text not null references planner.camadas_config (codigo),
  conteudo jsonb not null default '{}'::jsonb,
  ordem int not null default 0,
  unique (plano_id, camada_codigo)
);

create index plano_camadas_plano_idx on planner.plano_camadas (plano_id);

-- ------------------------------------------------------------
-- aprovacoes — trilha de auditoria das decisões
-- ------------------------------------------------------------
create table planner.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references planner.planos (id) on delete cascade,
  diretor_id uuid not null references planner.profiles (id),
  decisao text not null check (decisao in ('aprovado', 'ajustes_solicitados')),
  comentario text not null default '',
  created_at timestamptz not null default now(),
  constraint comentario_obrigatorio_em_ajustes
    check (decisao <> 'ajustes_solicitados' or length(trim(comentario)) > 0)
);

create index aprovacoes_plano_idx on planner.aprovacoes (plano_id);

-- ------------------------------------------------------------
-- demandas_extras
-- ------------------------------------------------------------
create table planner.demandas_extras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references planner.clientes (id) on delete cascade,
  plano_id uuid references planner.planos (id) on delete set null,
  descricao text not null,
  solicitante text not null default '',
  esforco_estimado text not null default 'medio'
    check (esforco_estimado in ('baixo', 'medio', 'alto')),
  status text not null default 'registrada'
    check (status in ('registrada', 'atendida', 'negociada', 'recusada')),
  created_by uuid references planner.profiles (id),
  created_at timestamptz not null default now()
);

create index demandas_extras_cliente_idx on planner.demandas_extras (cliente_id);

-- ------------------------------------------------------------
-- resultados_ciclo — fechamento que alimenta o dossiê
-- ------------------------------------------------------------
create table planner.resultados_ciclo (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references planner.planos (id) on delete cascade,
  executado jsonb not null default '{}'::jsonb,
  metricas jsonb not null default '{}'::jsonb,
  aprendizados text not null default '',
  created_by uuid references planner.profiles (id),
  created_at timestamptz not null default now()
);

create index resultados_ciclo_plano_idx on planner.resultados_ciclo (plano_id);

-- ------------------------------------------------------------
-- prompts_config — metodologia versionada em banco
-- ------------------------------------------------------------
create table planner.prompts_config (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  versao text not null,
  conteudo text not null,
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (codigo, versao)
);

-- Garante no máximo um prompt ativo por código
create unique index prompts_config_um_ativo_por_codigo
  on planner.prompts_config (codigo) where ativo;

-- ------------------------------------------------------------
-- eventos — trilha de mudanças de status (base p/ automações)
-- ------------------------------------------------------------
create table planner.eventos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references planner.planos (id) on delete cascade,
  de text,
  para text not null,
  quem uuid references planner.profiles (id),
  quando timestamptz not null default now()
);

create index eventos_plano_idx on planner.eventos (plano_id);

-- ============================================================
-- Triggers utilitários
-- ============================================================

create or replace function planner.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on planner.profiles
  for each row execute function planner.set_updated_at();
create trigger clientes_updated_at before update on planner.clientes
  for each row execute function planner.set_updated_at();
create trigger dossie_blocos_updated_at before update on planner.dossie_blocos
  for each row execute function planner.set_updated_at();
create trigger planos_updated_at before update on planner.planos
  for each row execute function planner.set_updated_at();

-- ============================================================
-- Helpers de papel (security definer para evitar recursão em RLS)
-- ============================================================

create or replace function planner.papel_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from planner.profiles where id = auth.uid();
$$;

create or replace function planner.eh_diretor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(planner.papel_atual() in ('diretor', 'admin'), false);
$$;

create or replace function planner.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(planner.papel_atual() = 'admin', false);
$$;

create or replace function planner.pode_ver_cliente(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select planner.eh_diretor()
    or exists (
      select 1 from planner.clientes c
      where c.id = cid and c.gc_responsavel = auth.uid()
    );
$$;

-- ============================================================
-- Máquina de estados do plano
--
-- rascunho_ia → em_revisao_gc → aguardando_aprovacao → aprovado
--                    ↑                  |                  ↓
--                    └── ajustes_solicitados      apresentado_cliente
--                                                        ↓
--                                                   em_execucao
--                                                        ↓
--                                                   ciclo_fechado
-- ============================================================

create or replace function planner.valida_transicao_plano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  transicao text := old.status || '->' || new.status;
begin
  if old.status = new.status then
    return new;
  end if;

  if transicao not in (
    'rascunho_ia->em_revisao_gc',
    'em_revisao_gc->aguardando_aprovacao',
    'aguardando_aprovacao->aprovado',
    'aguardando_aprovacao->ajustes_solicitados',
    'ajustes_solicitados->aguardando_aprovacao',
    'aprovado->apresentado_cliente',
    'apresentado_cliente->em_execucao',
    'em_execucao->ciclo_fechado'
  ) then
    raise exception 'Transição de status inválida: % → %', old.status, new.status;
  end if;

  -- Revisão do GC é obrigatória e substantiva (mínimo 200 caracteres)
  if new.status = 'aguardando_aprovacao'
     and length(trim(new.ajustes_gc)) < 200 then
    raise exception 'Preencha "Ajustes do GC" com pelo menos 200 caracteres antes de enviar para aprovação (registre o que revisou, o que mudou e por quê).';
  end if;

  -- Aprovar/reprovar é exclusivo de diretores
  if new.status in ('aprovado', 'ajustes_solicitados')
     and not planner.eh_diretor() then
    raise exception 'Apenas diretores podem aprovar ou solicitar ajustes em um plano.';
  end if;

  return new;
end;
$$;

create trigger planos_valida_transicao
  before update of status on planner.planos
  for each row execute function planner.valida_transicao_plano();

-- Trilha de eventos em toda criação e mudança de status
create or replace function planner.registra_evento_plano()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into planner.eventos (plano_id, de, para, quem)
    values (new.id, null, new.status, auth.uid());
  elsif old.status is distinct from new.status then
    insert into planner.eventos (plano_id, de, para, quem)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger planos_registra_evento
  after insert or update of status on planner.planos
  for each row execute function planner.registra_evento_plano();

-- ============================================================
-- RPC: decisão de diretor (aprovação atômica = registro + status)
-- Basta UM dos diretores decidir.
-- ============================================================

create or replace function planner.decidir_plano(
  p_plano_id uuid,
  p_decisao text,
  p_comentario text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not planner.eh_diretor() then
    raise exception 'Apenas diretores podem decidir sobre planos.';
  end if;

  if p_decisao not in ('aprovado', 'ajustes_solicitados') then
    raise exception 'Decisão inválida: %', p_decisao;
  end if;

  if p_decisao = 'ajustes_solicitados' and length(trim(coalesce(p_comentario, ''))) = 0 then
    raise exception 'Comentário é obrigatório ao solicitar ajustes.';
  end if;

  if not exists (
    select 1 from planner.planos
    where id = p_plano_id and status = 'aguardando_aprovacao'
  ) then
    raise exception 'Plano não está aguardando aprovação.';
  end if;

  insert into planner.aprovacoes (plano_id, diretor_id, decisao, comentario)
  values (p_plano_id, auth.uid(), p_decisao, coalesce(p_comentario, ''));

  update planner.planos set status = p_decisao where id = p_plano_id;
end;
$$;

-- ============================================================
-- RPC: fechamento de ciclo — grava resultados e alimenta o
-- bloco 'historico_sazonalidade' do dossiê automaticamente.
-- ============================================================

create or replace function planner.fechar_ciclo(
  p_plano_id uuid,
  p_executado jsonb,
  p_metricas jsonb,
  p_aprendizados text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_periodo text;
  v_registro jsonb;
begin
  select cliente_id,
         periodo_tipo || ' ' || to_char(periodo_inicio, 'YYYY-MM-DD') || ' a ' || to_char(periodo_fim, 'YYYY-MM-DD')
    into v_cliente_id, v_periodo
    from planner.planos where id = p_plano_id;

  if v_cliente_id is null then
    raise exception 'Plano não encontrado.';
  end if;

  if not planner.pode_ver_cliente(v_cliente_id) then
    raise exception 'Sem permissão sobre este cliente.';
  end if;

  insert into planner.resultados_ciclo (plano_id, executado, metricas, aprendizados, created_by)
  values (p_plano_id, p_executado, p_metricas, p_aprendizados, auth.uid());

  update planner.planos set status = 'ciclo_fechado'
   where id = p_plano_id and status = 'em_execucao';

  -- Alimenta o bloco 6 do dossiê (histórico e sazonalidade)
  v_registro := jsonb_build_object(
    'periodo', v_periodo,
    'executado', p_executado,
    'metricas', p_metricas,
    'aprendizados', p_aprendizados,
    'registrado_em', to_char(now(), 'YYYY-MM-DD')
  );

  insert into planner.dossie_blocos (cliente_id, bloco_codigo, conteudo, atualizado_por)
  values (
    v_cliente_id,
    'historico_sazonalidade',
    jsonb_build_object('ciclos_fechados', jsonb_build_array(v_registro)),
    auth.uid()
  )
  on conflict (cliente_id, bloco_codigo) do update
    set conteudo = jsonb_set(
          planner.dossie_blocos.conteudo,
          '{ciclos_fechados}',
          coalesce(planner.dossie_blocos.conteudo -> 'ciclos_fechados', '[]'::jsonb) || v_registro
        ),
        atualizado_por = auth.uid(),
        updated_at = now();
end;
$$;
